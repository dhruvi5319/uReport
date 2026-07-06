---

## Y3: Integration Points — External System Dependencies

This section documents all external system dependencies and integration contracts for the uReport modernized stack.

---

### INT-01: CAS — Central Authentication Service

**Feature:** F12  
**Direction:** Outbound (Spring Boot → CAS server)  
**Protocol:** CAS 2.0 / CAS 3.0 (HTTPS)  
**Library:** `spring-security-cas` (Spring Security CAS extension)

**Integration Contract:**

| Endpoint | Description |
|---|---|
| `{casServer}/login?service={serviceUrl}` | Redirect user to CAS login |
| `{casServer}/serviceValidate?service={serviceUrl}&ticket={ticket}` | Validate service ticket |
| `{casServer}/logout?service={serviceUrl}` | CAS single sign-out |

**Configuration Properties:**
```properties
cas.server.url=https://cas.city.gov
cas.service.url=https://ureport.city.gov/auth/cas/callback
```

**Failure Mode:** If CAS server is unreachable, users cannot authenticate via CAS. LDAP authentication remains available as fallback. Login screen shows a "CAS service unavailable" message.

**Dependency Risk:** Medium — CAS service is an external dependency. Prototype the integration early in development (see PRD §8 Risks).

---

### INT-02: LDAP — Lightweight Directory Access Protocol

**Feature:** F12  
**Direction:** Outbound (Spring Boot → LDAP server)  
**Protocol:** LDAP / LDAPS (port 389 / 636)  
**Library:** `spring-security-ldap`

**Integration Contract:**

- Spring Boot binds to the LDAP server using the provided `username` + `password`.
- On successful bind, the user's DN is resolved and the Spring Security principal is set.
- Group membership (for role mapping, if applicable) may be queried via LDAP search.

**Configuration Properties:**
```properties
spring.ldap.urls=ldaps://ldap.city.gov:636
spring.ldap.base=dc=city,dc=gov
spring.ldap.user-dn-pattern=uid={0},ou=people
```

**Failure Mode:** If LDAP server is unreachable, LDAP login attempts return 503. CAS remains available.

---

### INT-03: SMTP — Email Delivery

**Feature:** F9  
**Direction:** Outbound (Spring Boot → SMTP server)  
**Protocol:** SMTP / SMTPS  
**Library:** `spring-boot-starter-mail` (JavaMailSender)

**Integration Contract:**
- Spring Boot sends emails via the configured SMTP host/port/credentials.
- Emails are sent for: action responses to reporters, assignment notifications to assignees.
- Email delivery is synchronous (or via a small async queue). Failure is non-fatal — the ticket history entry is saved and the user receives a warning toast.

**Configuration Properties:**
```properties
spring.mail.host=smtp.city.gov
spring.mail.port=587
spring.mail.username=ureport@city.gov
spring.mail.password=${MAIL_PASSWORD}
spring.mail.properties.mail.smtp.starttls.enable=true
```

**Email Fields:**
- **From:** `ureport@city.gov` (configurable)
- **Reply-To:** From `category_action_responses.replyEmail` or `actions.replyEmail` or system default
- **To:** Recipient notification emails from `peopleEmails.usedForNotifications = true`
- **Subject:** `[uReport] Case #{ticket_id} — {action_name}`
- **Body:** Plain text or HTML; contains action notes + case link footer

**Failure Mode:** SMTP failure is logged at ERROR level. The `ticket_history` record is saved. A `sentNotifications` value of `[]` (empty) is stored. User receives a warning toast.

---

### INT-04: Mapbox GL JS — Interactive Maps

**Feature:** F2, F5, F16  
**Direction:** Outbound (React browser → Mapbox API)  
**Protocol:** HTTPS (REST + WebSocket)  
**API Key:** `VITE_MAPBOX_TOKEN` (environment variable)

**Integration Contract:**
- Map tiles loaded from `https://api.mapbox.com/styles/v1/...`
- Geocoding: `https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json?access_token={token}`
- Map styles and token managed client-side via environment variable.

**Geocoding API Response (simplified):**
```json
{
  "features": [
    {
      "place_name": "123 Main St, Bloomington, IN",
      "center": [-86.526, 39.165],
      "geometry": { "type": "Point", "coordinates": [-86.526, 39.165] }
    }
  ]
}
```

**Failure Mode:** If Mapbox token is absent or invalid, the system automatically falls back to Leaflet + OpenStreetMap tiles (see INT-05). Geocoding falls back to manual address-only entry (no autocomplete suggestions).

---

### INT-05: Leaflet + OpenStreetMap — Map Fallback

**Feature:** F2, F5, F16  
**Direction:** Outbound (React browser → OSM tile servers)  
**Protocol:** HTTPS  
**Trigger:** Used when Mapbox token is absent or when `VITE_MAP_PROVIDER=leaflet`

**Integration Contract:**
- Tile URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Attribution: "© OpenStreetMap contributors" (required by OSM tile usage policy)
- Geocoding fallback: Nominatim API (`https://nominatim.openstreetmap.org/search?q={query}&format=json`). Rate limit: 1 request/second. Public-facing deployment must not abuse Nominatim; a self-hosted or commercial geocoding service is recommended for production.

**Failure Mode:** If both Mapbox and OSM tiles fail, the map widget is hidden with a "Map unavailable" message. All ticket data remains accessible without the map.

---

### INT-06: PostgreSQL — Primary Database

**Feature:** All features  
**Direction:** Outbound (Spring Boot → PostgreSQL)  
**Protocol:** PostgreSQL wire protocol (JDBC)  
**Library:** Spring Data JPA + HikariCP connection pool

**Configuration:**
```properties
spring.datasource.url=jdbc:postgresql://postgres:5432/ureport
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.hikari.maximum-pool-size=20
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

**Failure Mode:** If PostgreSQL is unreachable, all API endpoints return 500. Spring Boot health endpoint `/actuator/health` reports `DOWN`. Docker Compose restart policy ensures auto-recovery.

---

### INT-07: Flyway — Database Migration

**Feature:** F21  
**Direction:** Outbound (Spring Boot startup → PostgreSQL)  
**Protocol:** JDBC  
**Trigger:** Automatic on Spring Boot startup

**Integration Contract:**
- Flyway scans `src/main/resources/db/migration/` for `V{n}__{description}.sql` files.
- Executes unapplied migrations in version order.
- Records applied migrations in `flyway_schema_history` table.
- On checksum mismatch (modified applied migration): startup fails; requires `flyway repair` in non-production only.

**Failure Mode:** If a migration fails, Spring Boot startup is aborted. Fix the migration SQL and restart. Never modify already-applied migration files.

---

### INT-08: Nginx — Reverse Proxy (React Frontend)

**Feature:** F17, F18, F19  
**Direction:** Inbound (clients → Nginx → React SPA / Spring Boot)  
**Protocol:** HTTPS  
**Configuration:** Docker Compose `react` service

**Integration Contract:**
- Nginx serves the React SPA static files (built by `npm run build`).
- All `/api/*` and `/open311/*` requests are reverse-proxied to the Spring Boot container.
- React Router routes (all non-`/api/*` paths) return `index.html` (client-side routing).
- HTTPS enforced; HTTP redirected to HTTPS.
- `Content-Security-Policy` header set to restrict script sources.

**Key Nginx Configuration (excerpt):**
```nginx
location /api/ { proxy_pass http://springboot:8080; }
location /open311/ { proxy_pass http://springboot:8080; }
location /auth/ { proxy_pass http://springboot:8080; }
location /v3/ { proxy_pass http://springboot:8080; }   # OpenAPI
location /swagger-ui { proxy_pass http://springboot:8080; }
location / { try_files $uri /index.html; }             # SPA fallback
```

---

### INT-09: Docker Compose — Container Orchestration

**Feature:** F21 (deployment)  
**Services:**
- `react` — Nginx serving built React SPA (port 80/443)
- `springboot` — Spring Boot application (port 8080, internal only)
- `postgres` — PostgreSQL 15 (port 5432, internal only)

**Volume Mounts:**
- `postgres_data` — Persistent PostgreSQL data volume
- `media_files` — Shared volume between `springboot` and `react` (or served via Spring Boot) for uploaded photos

**Environment Variables (managed via `.env` file, never committed):**
```
DB_USERNAME=ureport
DB_PASSWORD=<secret>
MAIL_PASSWORD=<secret>
JWT_SECRET=<secret>
MAPBOX_TOKEN=<token>
CAS_SERVER_URL=https://cas.city.gov
LDAP_URL=ldaps://ldap.city.gov:636
```

---

### Integration Dependency Matrix

| Integration | Feature(s) | Criticality | Failure Impact |
|---|---|---|---|
| PostgreSQL | All | P0 | Total system outage |
| Flyway | F21 | P0 | Startup failure |
| CAS | F12 | P0 | Staff cannot authenticate (LDAP fallback) |
| LDAP | F12 | P0 | Staff cannot authenticate (CAS fallback) |
| SMTP | F9 | P1 | Email notifications fail; core workflows unaffected |
| Mapbox | F2, F5, F16 | P2 | Map degrades to Leaflet/OSM |
| Leaflet/OSM | F2, F5, F16 | P2 | Map unavailable if both fail |
| Nginx | F17, F18 | P0 | Frontend inaccessible |
| Docker Compose | All | P0 | Service restart handles transient failures |
