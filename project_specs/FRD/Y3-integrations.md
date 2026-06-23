---

## Y3: External Integration Points

This document catalogs all external systems that uReport integrates with, the integration contracts, configuration parameters, failure modes, and abstraction layers used.

---

### §Open311 GeoReport v2

**Direction:** Inbound (external clients call uReport)  
**Type:** REST API (inbound)  
**Contract:** GeoReport v2 specification (open311.org)  
**Endpoint base:** `/open311/`  
**Formats:** JSON and XML (content negotiation via `format` query parameter or `Accept` header)  
**Auth:** API key (`api_key` query/body parameter)

**Field Mapping (Open311 → uReport internal):**

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
| `media_url` | `media.sourceUrl` |
| `api_key` | Validated against `clients.apiKeyHash` |

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
| `media_url` | `media.sourceUrl` or first image URL |

**Preservation guarantee:** The Open311 endpoint surface at `/open311/` is not modified during modernization. External clients require zero code changes after migration.

---

### §OIDC Provider

**Direction:** Outbound (uReport calls provider for auth exchange)  
**Protocol:** OpenID Connect 1.0 (Authorization Code Flow)  
**Examples:** Keycloak, Auth0, Azure AD, city SSO

**Configuration (site_config.php):**

| Constant | Description |
|---------|-------------|
| `OIDC_ISSUER` | Provider issuer URL (e.g., `https://sso.city.gov/`) |
| `OIDC_CLIENT_ID` | Client ID registered at provider |
| `OIDC_CLIENT_SECRET` | Client secret |
| `OIDC_REDIRECT_URI` | Callback URL (`BASE_URL . '/auth/callback'`) |
| `OIDC_SCOPES` | Scopes to request (default: `openid email profile`) |

**Endpoints used:**
- Authorization endpoint (from discovery document)
- Token endpoint (code exchange)
- JWKS endpoint (token signature validation)
- End-session endpoint (logout)

**Failure mode:** If the OIDC provider is unreachable, unauthenticated users receive HTTP 503 `IDP_UNAVAILABLE`. Already-authenticated users with valid session JWTs are not affected until their session expires.

---

### §Apache Solr

**Direction:** Bidirectional (uReport indexes to and queries from Solr)  
**Version:** Apache Solr 7.4+  
**Use cases:** Full-text search, faceted filtering, geospatial clustering

**Configuration (site_config.php):**

| Constant | Description |
|---------|-------------|
| `SOLR_URL` | Solr base URL (e.g., `http://solr:8983/solr/ureport`) |
| `SOLR_TIMEOUT` | Request timeout in seconds (default: 5) |

**Index operations:**
- **Create/Update:** `POST /solr/ureport/update` with ticket document on every ticket mutation
- **Delete:** `POST /solr/ureport/update` with delete-by-id on ticket delete
- **Query:** `GET /solr/ureport/select` with `q`, `fq`, `facet`, `spatial` params
- **Geo-cluster:** Solr Heatmap Faceting (`facet.heatmap` component) for density map data

**Solr document fields:**
- `id` (string): `ticket_<ticket_id>`
- `ticket_id` (int), `title` (text_en), `description` (text_en), `status` (string)
- `category_id` (int), `department_id` (int), `assignee_id` (int)
- `address` (text_en), `lat` (double), `lng` (double)
- `date_opened` (date), `date_closed` (date)
- `response_text` (text_en): Concatenated response action bodies for full-text search

**Abstraction:** All Solr calls are routed through a `SearchService` class. Controllers never call Solr directly.

**Failure mode:** Solr unavailability degrades to MySQL-only search (with reduced performance and no geo-clustering). API returns HTTP 503 `SEARCH_UNAVAILABLE` if Solr is required for the request.

---

### §SMTP / Email

**Direction:** Outbound (uReport sends email to users)  
**Protocol:** SMTP with STARTTLS or SSL  
**Use cases:** Ticket notifications, assignment alerts, reporter responses, digest emails

**Configuration (site_config.php):**

| Constant | Description |
|---------|-------------|
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (typically 587 for STARTTLS, 465 for SSL) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_TLS` | Boolean — use STARTTLS |
| `SMTP_FROM_ADDRESS` | From address (e.g., `noreply@city.gov`) |
| `SMTP_FROM_NAME` | From name (e.g., "City uReport") |

**Library:** PHPMailer (existing dependency) or equivalent Node.js mailer.

**Failure mode:** Non-fatal. SMTP failures are caught, logged to Graylog, and retried up to 3 times with exponential backoff. Ticket operations proceed regardless.

---

### §Address / Geocoding Service

**Direction:** Outbound (uReport calls geocoding service)  
**Use cases:** Address → lat/lng, lat/lng → address string (reverse geocode)

**Configuration (site_config.php):**

| Constant | Description |
|---------|-------------|
| `ADDRESS_SERVICE_TYPE` | `google` \| `nominatim` \| `city_gis` \| `none` |
| `ADDRESS_SERVICE_URL` | Base URL for the geocoding API |
| `ADDRESS_SERVICE_KEY` | API key (required for Google Maps) |

**Abstraction:** All geocoding calls routed through `AddressService` interface. Concrete implementations per service type.

**Failure mode:** Non-fatal. Geocoding failure sets `ticket_geodata.geoStatus = 'failed'`; ticket is saved. A CLI re-index command retries failed geocodes.

---

### §Graylog (Centralized Logging)

**Direction:** Outbound (uReport sends log messages to Graylog)  
**Protocol:** GELF (Graylog Extended Log Format) over UDP or HTTP  
**Use cases:** Error logging, structured application events, SMTP failure logs, auth events

**Configuration (site_config.php):**

| Constant | Description |
|---------|-------------|
| `GRAYLOG_HOST` | Graylog GELF input hostname |
| `GRAYLOG_PORT` | GELF port (default: 12201 UDP) |
| `GRAYLOG_ENABLED` | Boolean — disable in local dev |

**Log levels used:** ERROR (unhandled exceptions), WARNING (non-fatal failures), INFO (ticket lifecycle events), DEBUG (dev only).

**Failure mode:** If Graylog is unavailable, log falls back to local error log. Never blocks request handling.

---

### §GNU gettext / i18n

**Direction:** Internal (compile-time)  
**Use cases:** All user-facing strings externalized via `.po`/`.mo` files

- PHP backend: `_('string')` or `gettext('string')` via existing `LOCALE` constant
- Next.js frontend: `next-intl` or equivalent library reading compiled message catalogs
- Locale determined from `LOCALE` site config constant
- No hard-coded English strings in templates, component JSX, or API responses (for translatable messages)

---

*End of Y3 — integration points chunk.*
