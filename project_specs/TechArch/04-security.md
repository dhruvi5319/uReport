---

## 5. Security Architecture

### 5.1 Authentication Flow

uReport supports two staff authentication providers: **CAS** (Central Authentication Service) and **LDAP** (Lightweight Directory Access Protocol). Both converge on JWT issuance after successful authentication. Public users interact only with the public submission form and Open311 read endpoints — no authentication is required.

#### CAS Flow

```
Browser          React SPA           Spring Boot          CAS Server
  │                  │                    │                    │
  │──GET /dashboard──▶│                   │                    │
  │                  │  no JWT cookie     │                    │
  │◀─redirect /login─│                   │                    │
  │                  │                    │                    │
  │──click "Sign in with CAS"─────────────────────────────────▶│
  │                  │  (browser redirect to CAS /login)       │
  │                  │                    │                    │
  │◀──────────────────────────────── CAS login form ───────────│
  │──credentials──────────────────────────────────────────────▶│
  │◀───────────────── redirect to /auth/cas/callback?ticket=T ─│
  │                  │                    │                    │
  │──GET /auth/cas/callback?ticket=T──────▶│                   │
  │                  │                    │──validate ticket──▶│
  │                  │                    │◀─username + attrs──│
  │                  │                    │  lookup/create people record
  │                  │                    │  issue JWT (HS256, 8h expiry)
  │                  │                    │  Set-Cookie: auth_token=<JWT>; HttpOnly; SameSite=Strict; Secure
  │◀──────────────────────────── redirect to /dashboard ───────│
  │──GET /dashboard──▶│                   │                    │
  │                  │──GET /api/auth/me─▶│                    │
  │                  │◀─{personId,role}───│                    │
```

#### LDAP Flow

```
Browser          React SPA           Spring Boot          LDAP Server
  │                  │                    │                    │
  │──GET /dashboard──▶│                   │                    │
  │◀─redirect /login─│                   │                    │
  │                  │                    │                    │
  │──enter username+password              │                    │
  │                  │──POST /api/auth/ldap─▶│                 │
  │                  │   {username, password}│                 │
  │                  │                    │──LDAP bind────────▶│
  │                  │                    │◀─success / fail────│
  │                  │                    │  lookup/create people record
  │                  │                    │  issue JWT; Set-Cookie
  │                  │◀─200 {personId...}─│                    │
  │                  │──redirect /dashboard                    │
```

---

### 5.2 JWT Configuration

| Property | Value |
|---|---|
| Algorithm | HS256 (HMAC-SHA256) |
| Storage | httpOnly cookie named `auth_token` |
| Cookie attributes | HttpOnly; SameSite=Strict; Secure (HTTPS only) |
| Expiry | Configurable via `jwt.expiry-seconds`; recommended 28800 (8 hours) |
| Refresh | Separate `refresh_token` httpOnly cookie; server-side store (in-memory or DB) |
| Claims | `sub` (username), `personId`, `role`, `iat`, `exp`, `iss` |
| Issuer | Configurable string (`jwt.issuer`, e.g., `"ureport"`) |
| Rotation | JWT secret in `application.yml` (externalized via Docker env var); short expiry mitigates non-rotation risk |

**JWT Security Filter (`JwtAuthFilter`):**
1. Extracts `auth_token` cookie from every incoming request.
2. Parses and validates signature, expiry, and issuer using JJWT library.
3. On valid token: populates `SecurityContextHolder` with `CustomUserDetails` (personId, role, username).
4. On invalid/expired token: returns `401 Unauthorized` (JSON error body).
5. Skips filter for: public routes (see §5.4 Route Authorization).

**Token Refresh:**
- React proactively calls `POST /api/auth/refresh` 5 minutes before JWT expiry.
- Server validates `refresh_token` cookie (longer-lived, stored server-side or as a signed token).
- On success: issues new JWT and resets `auth_token` cookie.
- On failure: returns 401; React redirects to `/login?returnTo={currentPath}`.

---

### 5.3 Open311 API Key Validation

The Open311 `POST /open311/v2/requests` endpoint requires an `api_key` for write operations. The API key is NOT a JWT — it is a separate credential used by external Open311 clients.

**Validation filter (`Open311ApiKeyFilter`):**
1. Applied only to `POST /open311/v2/requests`.
2. Extracts `api_key` from query string or `X-Api-Key` header.
3. Queries `clients` table: `SELECT id FROM clients WHERE api_key = ?`.
4. If found: attaches `clientId` to request context; proceeds.
5. If not found: returns `403 Forbidden` with `{"errors":[{"code":"clients/unknownClient","description":"Invalid API key"}]}`.

**OBSOLETE_API_KEYS behavior:**
- Configurable list in `application.yml`: `open311.obsolete-api-keys: ["key1", "key2"]`.
- If incoming `api_key` matches an obsolete key on `GET /open311/v2/services`: return a synthetic "mobile shutdown" category list (three instructional entries).
- Normal 403 for obsolete key on POST.

---

### 5.4 Route Authorization

| Route / Endpoint Pattern | Requirement |
|---|---|
| `GET /open311/v2/*` | Public — no auth |
| `POST /open311/v2/requests` | Open311 api_key required |
| `POST /api/auth/ldap` | Public — credential submission |
| `GET /auth/cas/callback` | Public — CAS redirect target |
| `POST /api/auth/refresh` | Refresh token cookie |
| `POST /api/auth/logout` | JWT or anonymous (clear cookies) |
| `GET /api/categories/public` | Public |
| `POST /api/tickets/public` | Public |
| `GET /api/geocode` | Public |
| `GET /api/media/{id}` | JWT for staff categories; public for anonymous categories |
| All other `GET /api/*` | JWT required; any authenticated role |
| `POST /api/tickets`, `PATCH /api/tickets/{id}`, lifecycle ops | JWT; role `staff` or `admin` |
| `DELETE /api/people/{id}`, `POST /api/departments`, admin CRUD | JWT; role `admin` |
| Bulk operations | JWT; role `staff` or `admin` |
| `/v3/api-docs`, `/swagger-ui.html` | Public (developer reference) |

**Spring Security role hierarchy:**
```
ROLE_ADMIN > ROLE_STAFF > ROLE_PUBLIC
```

Authorization implemented via `@PreAuthorize` annotations on service methods and HTTP security matchers in `SecurityConfig`. Role is stored in JWT `role` claim and mapped to Spring `GrantedAuthority` on JWT validation.

---

### 5.5 CSRF Protection

Because JWTs are stored in httpOnly SameSite=Strict cookies:
- Cross-site requests cannot include the cookie (SameSite=Strict blocks cross-site requests from other origins).
- JavaScript on a different domain cannot read the httpOnly cookie.

For defense in depth, Spring Security's CSRF protection is enabled for state-changing requests (`POST`, `PATCH`, `PUT`, `DELETE`) on the `/api/*` path, using the Double-Submit Cookie pattern:
- Spring provides a CSRF token as a non-httpOnly cookie (`XSRF-TOKEN`).
- React reads this cookie and includes the value in the `X-XSRF-TOKEN` request header.
- Spring validates the header value matches the cookie.

**Exception:** Open311 endpoints (`/open311/v2/*`) are CSRF-exempt (stateless external API; authenticated by api_key).

---

### 5.6 Data Protection

| Concern | Implementation |
|---|---|
| Passwords | Never stored — delegated entirely to LDAP/CAS |
| JWT secret | Environment variable (`JWT_SECRET`); never in source code |
| API keys | Stored as plain text in DB (UUID format; sufficient entropy); considered non-secret but restricted to admin UI |
| Media files | Stored on filesystem; path includes ticket ID (hard to enumerate); staff-only categories require JWT |
| HTTPS | Enforced by Nginx; HTTP → HTTPS redirect; HSTS header |
| SQL injection | Prevented by Spring Data JPA parameterized queries; `plainto_tsquery()` for FTS (injection-safe) |
| XSS | React DOM escapes values by default; `dangerouslySetInnerHTML` used only for `ts_headline` output sanitized with DOMPurify |
| Open redirect | `returnTo` parameter restricted to relative paths on same origin (validated server-side) |
| File upload | MIME validated by magic bytes; size capped at 10 MB; stored with UUID filename (not original name) |
| Logging | Passwords, JWT secrets, and API keys are never written to logs (MDC exclusion list) |

---

### 5.7 Authorization Model (Role-Based)

| Operation | admin | staff | public |
|---|---|---|---|
| View tickets (own department) | ✓ | ✓ | — |
| View all tickets | ✓ | ✓ | — |
| Create ticket | ✓ | ✓ | Via /public |
| Close/reopen ticket | ✓ | ✓ | — |
| Edit closed ticket fields | ✓ | — | — |
| Assign ticket | ✓ | ✓ | — |
| Bulk operations | ✓ | ✓ | — |
| Create/edit/delete people | ✓ | — | Own record |
| Set role to admin/staff | ✓ | — | — |
| Create/edit departments | ✓ | — | — |
| Create/edit categories | ✓ | — | — |
| Manage substatus/issueType/contactMethod | ✓ | — | — |
| Manage Open311 clients | ✓ | — | — |
| Log action on any department's ticket | ✓ | dept match | — |
| View metrics/reports | ✓ | ✓ | — |
| Access Swagger UI | any | any | any |

---
