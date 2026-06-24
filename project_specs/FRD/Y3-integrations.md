---

## Y3: Integration Points

This section documents all external system dependencies, integration contracts, and the interfaces between uReport and third-party services.

---

### 1. Open311 GeoReport v2 — External Consumer Contract

**Direction:** Inbound (external systems call uReport)  
**Protocol:** HTTPS REST  
**Standard:** http://wiki.open311.org/GeoReport_v2  

**Contract requirements:**
- Response field names, types, and structures must be byte-compatible with legacy PHP output.
- JSON and XML response shapes are both required.
- Authentication via `api_key` query parameter or form field for POST.
- No breaking changes to response payloads — external municipality integrations cannot be modified.
- Endpoint paths must match exactly: `/open311/discovery`, `/open311/services`, `/open311/services/{code}`, `/open311/requests`, `/open311/requests/{id}`.

**Validation approach:**
- Generate XML/JSON fixture files from legacy PHP system before migration.
- Run automated byte-level comparison tests against fixtures after migration (NFR-1, NFR-9).
- Integration tests for all 6 Open311 endpoints in CI pipeline.

---

### 2. SMTP / Email Service

**Direction:** Outbound (uReport sends email)  
**Protocol:** SMTP (or SMTP over TLS)  
**Used by:** F16 (Digest Notifications)  

**Configuration properties:**
```yaml
app:
  mail:
    host: smtp.example.com
    port: 587
    username: notifications@city.gov
    password: <secret>
    from: "uReport Notifications <notifications@city.gov>"
    footer: "This is an automated message from uReport."
    starttls: true
```

**Contract:**
- Spring Boot `JavaMailSender` or compatible SMTP client.
- Each notification email targets all `peopleEmails` records flagged `usedForNotifications = true` for the ticket reporter.
- Reply-To is set from the effective `replyEmail` (category or action override, see F09).
- Failed sends are logged; `sentNotifications` field is set to sent addresses (or null on total failure).
- No retry queue in MVP — failures are logged and addressed at next scheduler run.

---

### 3. AddressService (Optional External Address Validation)

**Direction:** Outbound (uReport calls AddressService)  
**Protocol:** HTTPS REST  
**Used by:** F15 (Location / Address Management)  
**Status:** Optional — system functions without it; raw address stored if unavailable.

**Integration contract:**
- System calls configured `app.address.serviceUrl` with address components.
- Expects a JSON response with canonical address fields and optionally `additionalFields` data.
- If service unavailable (timeout, 5xx), system logs warning and continues ticket creation with unvalidated address.
- `tickets.additionalFields` JSONB stores the raw AddressService response for downstream use.
- No specific AddressService vendor is mandated — interface is configurable.

**Configuration:**
```yaml
app:
  address:
    serviceUrl: https://address.example.gov/validate
    enabled: true
    timeoutMs: 3000
```

---

### 4. OAuth / External Identity Provider (Optional)

**Direction:** Inbound (IdP redirects to uReport callback)  
**Protocol:** OAuth 2.0 Authorization Code Flow  
**Used by:** F04 (Authentication — JWT)  
**Status:** Optional — local username/password is always available.

**Integration contract:**
- `GET /callback?code=<auth_code>&state=<csrf_state>` endpoint receives IdP redirect.
- System exchanges auth code for IdP token using configured client credentials.
- System extracts identity claim (email or `sub`) from IdP token.
- System looks up matching `people` record by email; no auto-registration.
- If no match → 404 (administrator must pre-create the person record).
- Issues local JWT and refresh token for the matched person.

**Configuration:**
```yaml
app:
  oauth:
    enabled: false
    clientId: <idp-client-id>
    clientSecret: <idp-client-secret>
    authorizationUri: https://idp.example.com/oauth2/authorize
    tokenUri: https://idp.example.com/oauth2/token
    redirectUri: https://city.gov/callback
    userInfoUri: https://idp.example.com/oauth2/userinfo
    scope: openid email profile
```

---

### 5. PostGIS (PostgreSQL Extension)

**Direction:** Internal (uReport database layer)  
**Used by:** F15 (Geo-Cluster Analysis), F11 (Radius Search)  

**Integration contract:**
- PostgreSQL must be configured with `CREATE EXTENSION IF NOT EXISTS postgis;`.
- `GEOGRAPHY(POINT, 4326)` type is used for ticket and location geo-points.
- `ST_DWithin` is used for radius-based ticket search.
- `ST_MakePoint(longitude, latitude)::geography` converts decimal lat/long to geography.
- `ST_Centroid` and `ST_DWithin` are used in the geo-cluster rebuild job.
- Docker image: `postgis/postgis:16-3.4` (or equivalent PostGIS + PostgreSQL 16 image).

---

### 6. React SPA ↔ Spring Boot API

**Direction:** Internal (SPA consumes REST API)  
**Protocol:** HTTPS REST  
**Used by:** All features  

**Contract:**
- SPA communicates exclusively via `/api/v1/*` endpoints.
- SPA stores JWT access token in memory (not localStorage) for security; refresh token in HttpOnly cookie.
- SPA handles 401 TOKEN_EXPIRED by calling `/api/v1/auth/refresh` before retrying.
- SPA performs client-side permission gating (hides UI elements) based on role from JWT, but API is the authoritative security boundary.
- Open311 endpoints are not consumed by the SPA directly — they are for external consumers only.

---

### 7. Docker / docker-compose

**Direction:** Deployment  
**Used by:** All features  

**Service definitions:**
```yaml
services:
  db:
    image: postgis/postgis:16-3.4
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
    environment:
      POSTGRES_DB: ureport
      POSTGRES_USER: ureport
      POSTGRES_PASSWORD: <secret>

  api:
    build: ./api
    ports: ["8080:8080"]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/ureport
      APP_JWT_SECRET: <secret>
      APP_MAIL_HOST: mailhog
    volumes: ["mediadata:/app/media"]
    depends_on: [db]

  web:
    build: ./web
    ports: ["3000:80"]
    depends_on: [api]

  mailhog:
    image: mailhog/mailhog
    ports: ["8025:8025", "1025:1025"]
```

**Volumes:**
- `pgdata`: PostgreSQL data directory.
- `mediadata`: Media file storage (`/app/media`), mounted to same path inside container.

**Constraints:**
- Service names (`db`, `api`, `web`) should remain familiar to existing operators.
- Port assignments must match or be documented if changed (legacy: Apache on 80, MySQL on 3306).
- Media volume path `/app/media` must be consistent with `$MEDIA_STORAGE_PATH` config.

---

### 8. Scheduled Jobs (Spring Scheduler)

**Direction:** Internal (replaces PHP cron scripts)  
**Used by:** F16 (Notifications, Auto-Close, Audit), F15 (Geo-Cluster Rebuild)  

| Job | Replaces | Default Schedule | Cron Expression |
|-----|---------|-----------------|----------------|
| DigestNotificationScheduler | digestNotifications.php | Every 5 min | `0 */5 * * * *` |
| AutoCloseScheduler | closeOldTickets.php | Nightly 1 AM | `0 0 1 * * *` |
| AuditScheduler | auditTickets.php | Weekly Sun 3 AM | `0 0 3 * * SUN` |
| GeoClusterScheduler | matchLocationAddresses.php | Nightly 2 AM | `0 0 2 * * *` |
| TokenBlacklistCleanupScheduler | (new) | Hourly | `0 0 * * * *` |

All schedules are configurable via `application.yml`. Jobs log start time, end time, and outcome counters.
