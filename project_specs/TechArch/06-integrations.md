## 7. Integration Points

### 7.1 Open311 GeoReport v2 (Inbound)

**Direction:** Inbound — external clients call uReport  
**Protocol:** REST/HTTP — JSON and XML  
**Endpoint base:** `/open311/` (preserved verbatim)  
**Auth:** `api_key` query/body parameter (optional for public categories)

**Open311 → uReport field mapping:**

| Open311 Request Field | Internal Mapping |
|----------------------|-----------------|
| `service_code` | `categories.id` |
| `description` | `tickets.description` |
| `lat` | `ticket_geodata.lat` |
| `long` | `ticket_geodata.lng` |
| `address_string` | `tickets.address` |
| `first_name` + `last_name` | `tickets.reporterName` |
| `email` | `tickets.reporterEmail` |
| `phone` | `tickets.reporterPhone` |
| `media_url` | `media.sourceUrl` (URL stored; file not downloaded) |
| `api_key` | Validated against `clients.apiKeyHash` (bcrypt) |
| `attribute[{code}]` | `tickets.customFields[code]` |

| Open311 Response Field | Internal Source |
|-----------------------|----------------|
| `service_request_id` | `tickets.id` |
| `status` | `tickets.status` |
| `service_code` | `tickets.categoryId` |
| `service_name` | `categories.name` |
| `description` | `tickets.description` |
| `lat` | `ticket_geodata.lat` |
| `long` | `ticket_geodata.lng` |
| `address` | `tickets.address` |
| `requested_datetime` | `tickets.datetimeOpened` (ISO 8601) |
| `updated_datetime` | `tickets.datetimeUpdated` (ISO 8601) |
| `expected_datetime` | Computed: `datetimeOpened + (slaDays × 8h)` |
| `agency_responsible` | `departments.name` |
| `media_url` | First `media.sourceUrl` or first upload URL |

**Preservation guarantee:** The Open311 endpoint surface at `/open311/` is not modified during modernization. All external clients require zero code changes after migration.

---

### 7.2 OIDC Identity Provider (Outbound)

**Direction:** Outbound — uReport initiates auth flows to the IdP  
**Protocol:** OpenID Connect 1.0 (Authorization Code Flow)  
**Examples:** Keycloak, Auth0, Azure AD, Okta, city SSO

**OIDC endpoints used:**
- **Authorization endpoint** (from OIDC discovery document): redirect user here for login
- **Token endpoint**: exchange authorization code for `id_token` + `access_token`
- **JWKS endpoint**: fetch provider's public keys for `id_token` signature validation
- **End-session endpoint**: redirect user here on logout

**Configuration constants:**

| Constant | Description |
|----------|-------------|
| `OIDC_ISSUER` | Provider issuer URL (auto-discovers endpoints) |
| `OIDC_CLIENT_ID` | Client ID registered at provider |
| `OIDC_CLIENT_SECRET` | Client secret |
| `OIDC_REDIRECT_URI` | `{BASE_URL}/auth/callback` |
| `OIDC_SCOPES` | `openid email profile` |

**Person matching:**
1. Match `oidcSubject = id_token.sub` (primary)
2. Fallback: match `contactMethods.value = id_token.email` (type = email)
3. No match: auto-provision new person with role `public`

**Failure mode:** If IdP is unreachable, unauthenticated requests receive `503 IDP_UNAVAILABLE`. Already-authenticated users (valid session JWT not yet expired) are unaffected.

---

### 7.3 Apache Solr (Bidirectional)

**Direction:** Bidirectional — uReport indexes to and queries from Solr  
**Version:** Apache Solr 9.x  
**Use cases:** Full-text search, faceted filtering, geospatial clustering (heatmap)

**Abstraction:** All Solr calls are routed through `SearchService`. Controllers never call Solr directly. `SearchService` implements a `SearchServiceInterface` to allow mocking in unit tests.

**Solr index operations:**

| Operation | Trigger | Solr API |
|-----------|---------|---------|
| Create/update document | Any ticket mutation | `POST /solr/ureport/update` |
| Delete document | Ticket soft-delete | `POST /solr/ureport/update` (delete by ID) |
| Full-text + facet query | `GET /api/tickets` | `GET /solr/ureport/select` |
| Geospatial heatmap | `GET /api/tickets/clusters` | `GET /solr/ureport/select` (heatmap facet) |
| Full re-index | CLI command `bin/console solr:reindex` | Batch POST all tickets |

**Solr document schema:**

| Field | Solr Type | Source |
|-------|-----------|--------|
| `id` | string | `ticket_{tickets.id}` |
| `ticket_id` | pint | `tickets.id` |
| `title` | text_en | `tickets.title` |
| `description` | text_en | `tickets.description` |
| `status` | string | `tickets.status` |
| `category_id` | pint | `tickets.categoryId` |
| `department_id` | pint | `tickets.departmentId` |
| `assignee_id` | pint | `tickets.personId` |
| `address` | text_en | `tickets.address` |
| `lat` | pdouble | `ticket_geodata.lat` |
| `lng` | pdouble | `ticket_geodata.lng` |
| `date_opened` | pdate | `tickets.datetimeOpened` |
| `date_closed` | pdate | `tickets.datetimeClosed` |
| `response_text` | text_en | Concatenated response action bodies |

**Failure mode:** Solr unavailability degrades to MySQL-only search (reduced performance, no geo-clustering). Returns `503 SEARCH_UNAVAILABLE` when Solr is required for the request (e.g., geo-cluster endpoint).

---

### 7.4 SMTP / Email (Outbound)

**Direction:** Outbound — uReport sends transactional emails  
**Protocol:** SMTP with STARTTLS or SSL  
**Library:** PHPMailer ^6.x

**Email types:**

| Template Slug | Trigger | Recipient |
|--------------|---------|-----------|
| `ticket_created` | Ticket creation | Reporter |
| `ticket_assigned` | Ticket assignment | New assignee (staff) |
| `ticket_response` | Staff response posted | Reporter |
| `ticket_closed` | Ticket closed | Reporter |
| `ticket_merged` | Source ticket merged | Reporter of source ticket |
| `digest_daily` | Scheduled cron (7am) | All active staff in department |

**Deduplication:** A notification is not sent if an identical `(ticketId, templateSlug, recipientEmail)` combination was sent within the last 60 seconds.

**Retry policy:** Up to 3 attempts with exponential backoff (5s, 15s, 45s). After 3 failures, `notification_log.status = 'failed'` and error logged to Graylog.

**Non-fatal:** SMTP failures do not abort the ticket operation. The ticket is saved and the error is logged.

---

### 7.5 Address / Geocoding Service (Outbound)

**Direction:** Outbound — uReport calls geocoding API  
**Abstraction:** `AddressService` interface with concrete implementations per provider

**Supported providers:**

| `ADDRESS_SERVICE_TYPE` | Implementation |
|------------------------|---------------|
| `google` | Google Maps Geocoding API |
| `nominatim` | OpenStreetMap Nominatim API |
| `city_gis` | Municipality's own GIS endpoint |
| `none` | Geocoding disabled; lat/lng stored as-is from caller |

**Operations:**
- **Geocode** (address → lat/lng): Called on ticket create when `lat`/`lng` not provided
- **Reverse geocode** (lat/lng → address): Called on ticket create when `address` not provided

**Caching:** Geocoding results are cached by address string (Redis if configured; PHP in-memory fallback) to avoid redundant API calls for identical addresses.

**Failure mode:** Non-fatal. `ticket_geodata.geoStatus = 'failed'` is set; ticket is saved without coordinates. A CLI command `bin/console geo:retry` retries failed geocodes.

---

### 7.6 Graylog — Centralized Logging (Outbound)

**Direction:** Outbound — uReport forwards structured log events  
**Protocol:** GELF (Graylog Extended Log Format) over UDP  
**Library:** monolog/monolog with `GelfHandler`

**Log levels:**

| Level | Use |
|-------|-----|
| ERROR | Unhandled exceptions, SMTP failures after all retries |
| WARNING | Non-fatal failures (geocoding, Solr unavailability, duplicate notification skip) |
| INFO | Ticket lifecycle events (create, close, merge), auth events (login, logout) |
| DEBUG | Solr query details, geocoding calls (local dev only — disabled in production) |

**Failure mode:** If Graylog is unreachable, logs fall back to PHP's local error log (`error_log()`). Never blocks request handling.

---

### 7.7 GNU gettext / i18n

**Direction:** Internal (compile-time + runtime)

**PHP backend:**
- All user-facing strings wrapped in `_('string')` or `gettext('string')`
- `.po` source files in `locale/{LOCALE}/LC_MESSAGES/ureport.po`
- `.mo` compiled files served at runtime
- `LOCALE` constant in `site_config.php` determines active locale

**Next.js frontend:**
- `next-intl` library for server and client components
- Message catalogs in `frontend/lib/i18n/messages/{locale}.json` (compiled from `.po` files or maintained separately)
- No hard-coded English strings in `.tsx` components

**Supported locales (existing):** Determined by the municipality's deployment configuration. English (`en_US`) is the default.

---
