## Section 06: Integration Points & Search Architecture

---

## External Integration Inventory

### 1. Open311 GeoReport v2 — External Consumer Contract

**Direction:** Inbound — external municipality systems call uReport  
**Protocol:** HTTPS REST  
**Standard:** http://wiki.open311.org/GeoReport_v2  
**Auth:** None (read); `api_key` query param (write)

**Contract requirements:**
- Response field names, types, and structure must be **byte-compatible** with legacy PHP output
- JSON and XML formats both required
- Endpoint paths must match exactly:
  - `/open311/discovery`
  - `/open311/services`
  - `/open311/services/{service_code}`
  - `/open311/requests`
  - `/open311/requests/{service_request_id}`

**Validation approach:**
- Generate XML/JSON fixture files from legacy PHP system before cutover
- Automated byte-level diff tests run in CI against fixtures (NFR-1, NFR-9)
- `Open311XmlSerializer` uses manual XML writer (not JAXB) to match legacy element structure exactly

**Open311 → uReport field mapping:**
```
service_code         ← categories.id (as string)
service_request_id   ← tickets.id (as string)
status               ← tickets.status
status_notes         ← substatus.name
service_name         ← categories.name
description          ← tickets.description
agency_responsible   ← people.firstname + ' ' + people.lastname (assignedPerson)
requested_datetime   ← tickets.enteredDate (ISO 8601)
updated_datetime     ← tickets.lastModified (ISO 8601)
expected_datetime    ← tickets.enteredDate + category.slaDays days
lat                  ← tickets.latitude (as string)
long                 ← tickets.longitude (as string)
address              ← tickets.location
address_id           ← tickets.addressId (as string)
zipcode              ← tickets.zip
media_url            ← first media.url for the ticket
```

---

### 2. SMTP / Email Service

**Direction:** Outbound — uReport sends emails  
**Protocol:** SMTP (STARTTLS / TLS)  
**Used by:** F16 DigestNotificationScheduler  
**Library:** Spring Boot Mail (Jakarta Mail)

**Configuration:**
```yaml
spring.mail.host: ${SPRING_MAIL_HOST}
spring.mail.port: ${SPRING_MAIL_PORT:587}
spring.mail.username: ${SPRING_MAIL_USERNAME}
spring.mail.password: ${SPRING_MAIL_PASSWORD}
app.mail.from: noreply@ureport.local
```

**Email construction:**
- Subject: `[uReport] #{ticketId} - {categoryName} Update` (configurable)
- From: `app.mail.from`
- Reply-To: effective `replyEmail` (category_action_response > action > category.notificationReplyEmail)
- Body: rendered template text from `actions.template` with `{variable}` substitution

**Failure handling:** SMTP failures are logged at ERROR level. `ticketHistory.sentNotifications` is set to track which addresses were attempted. On failure, the entry is retried on the next scheduler cycle (since `sentNotifications` remains null until successful send).

---

### 3. OAuth / External Identity Provider (Optional)

**Direction:** Inbound callback — IdP redirects to uReport after auth  
**Protocol:** OAuth 2.0 Authorization Code flow  
**Endpoint:** `GET /callback?code={code}&state={csrf_state}`  
**Used by:** F04 (OAuth Callback)  

**Flow:**
```
1. User clicks SSO login → SPA redirects to IdP with state param
2. IdP authenticates user → redirects to /callback?code=...&state=...
3. CallbackController validates CSRF state
4. Exchanges code for IdP token (Spring OAuth2 client)
5. Extracts email from IdP token claims
6. Looks up people by email (must pre-exist — no auto-registration)
7. Issues local JWT + refresh token
8. Redirects SPA with tokens
```

**Configuration:** Spring Security OAuth2 client properties (configured for MSAL/Entra, Google, or generic OIDC provider).

---

### 4. AddressService Integration (Optional)

**Direction:** Outbound — uReport calls an external address validation service  
**Protocol:** HTTP REST  
**Used by:** F15 (Location/Address Management)  
**Condition:** Only invoked if `app.addressService.enabled = true` and `app.addressService.url` is configured

**Behavior:**
- On ticket creation with address fields, system calls AddressService with street + city + state + zip
- Response provides normalized address + `additionalFields` JSON blob
- System stores `additionalFields` on the ticket
- If AddressService is unavailable or not configured: ticket is created with raw unvalidated address (soft failure — logged, not rejected)

---

## Search Architecture (PostgreSQL FTS)

### Why PostgreSQL FTS Instead of Solr

| Concern | Solr 7.4 | PostgreSQL FTS |
|---------|----------|----------------|
| Infrastructure | Separate JVM process, dedicated ops | Same DB instance, zero extra ops |
| Indexing | External push to Solr | PostgreSQL trigger on INSERT/UPDATE |
| Sync risk | Tickets + Solr can diverge | Always consistent (same transaction) |
| Search quality | Very high (Lucene-based) | High for structured CRM data |
| Geo search | Solr spatial | PostGIS ST_DWithin (native) |
| Maintenance | Solr schema.xml, solrconfig.xml | Standard SQL; no separate config |

### FTS Index Architecture

```sql
-- On tickets table:
search_vector TSVECTOR       -- pre-computed, updated by trigger
-- GIN index for fast queries:
CREATE INDEX idx_tickets_fts ON tickets USING GIN (search_vector);

-- Trigger sets search_vector on every INSERT/UPDATE:
NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(description, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(city, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(zip, '')), 'D');
```

**Note:** Reporter name, assignee name, category name, and department name are **not** in the trigger (they come from joined tables). The `TicketSearchService` can perform a supplemental ILIKE search on people names when `q` matches name patterns, or a background job can refresh `search_vector` to include joined fields via a more complex trigger that queries the related tables.

### Search Query Generation (TicketSearchService)

```java
// Pseudo-code for parameterized query construction
StringBuilder sql = new StringBuilder(
    "SELECT t.* FROM tickets t " +
    "JOIN categories c ON t.category_id = c.id " +
    "LEFT JOIN substatus s ON t.substatus_id = s.id " +
    "WHERE t.status <> 'deleted' "   // soft-delete filter
);

if (params.q != null) {
    sql.append("AND t.search_vector @@ websearch_to_tsquery('english', ?) ");
}
if (params.status != null) {
    sql.append("AND t.status = ? ");
}
if (params.categoryId != null) {
    sql.append("AND t.category_id = ? ");
}
// ... other filters ...
if (params.lat != null && params.lng != null && params.radius != null) {
    sql.append(
        "AND ST_DWithin(t.geo_point, ST_MakePoint(?, ?)::geography, ?) "
    );
}

// Ordering:
if (params.q != null) {
    sql.append("ORDER BY ts_rank(t.search_vector, websearch_to_tsquery('english', ?)) DESC ");
} else {
    sql.append("ORDER BY t.enteredDate DESC ");
}

sql.append("LIMIT ? OFFSET ?");
```

### Geo-Cluster Architecture

```
Nightly GeoClusterScheduler:
  1. Query all tickets WHERE geo_point IS NOT NULL
  2. For each zoom level N in [0..6]:
     a. Group tickets using ST_DWithin clustering:
        - Level 0: radius 50,000m (50km)
        - Level 6: radius 100m
     b. For each cluster: compute center = ST_Centroid(ST_Collect(geo_points))
     c. Upsert geoclusters row with (level, center)
     d. Upsert ticket_geodata row with cluster_id_N for each ticket
  3. Log: levels processed, clusters created, tickets assigned

Map view query:
  SELECT g.id AS cluster_id,
         COUNT(tgd.ticket_id) AS count,
         ST_Y(g.center::geometry) AS lat,
         ST_X(g.center::geometry) AS long
  FROM ticket_geodata tgd
  JOIN geoclusters g ON tgd.cluster_id_{N} = g.id
  [+ same WHERE filters as ticket search]
  GROUP BY g.id, g.center
```

### Performance Targets

| Query Type | Target | Mechanism |
|------------|--------|-----------|
| FTS keyword search (100K tickets) | < 500ms | GIN index on `search_vector` |
| Status/category filter (500K tickets) | < 200ms | B-tree indexes on `status`, `category_id` |
| Date range filter | < 200ms | B-tree indexes on `enteredDate`, `closedDate` |
| Geo radius query | < 300ms | GiST index on `geo_point` via PostGIS |
| Map cluster query (zoom 3) | < 400ms | Indexes on `cluster_id_3` in `ticket_geodata` |

---

## CI/CD Integration Points

| Check | Tool | Trigger |
|-------|------|---------|
| Unit tests | JUnit 5 | Every PR |
| Integration tests | Spring Boot Test + Testcontainers | Every PR |
| Open311 fixture diff | Shell script (diff XML/JSON) | Every PR |
| Schema migration validation | Flyway `migrate` on test DB | Every PR |
| FTS equivalence test | Custom query corpus comparison | Weekly / pre-release |
| Docker build | Docker Compose `build` | Every PR |
| Coverage gate | JaCoCo ≥ 80% service layer | Every PR |
