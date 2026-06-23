## 5. Security Architecture

### 5.1 Authentication Flow

```
   Browser                 Next.js                PHP API               OIDC IdP
      │                       │                       │                      │
      │  GET /login            │                       │                      │
      ├──────────────────────►│                       │                      │
      │                       │  GET /auth/login       │                      │
      │                       ├──────────────────────►│                      │
      │                       │  302 → IdP auth URL    │                      │
      │◄──────────────────────┤◄──────────────────────┤                      │
      │                       │                       │                      │
      │  Authenticate with IdP                                               │
      ├────────────────────────────────────────────────────────────────────►│
      │◄────────────────────────────────────────────────────────────────────┤
      │  302 /auth/callback?code=…&state=…            │                      │
      │                       │                       │                      │
      │  GET /auth/callback   │                       │                      │
      ├──────────────────────►│                       │                      │
      │                       │  POST /auth/callback   │                      │
      │                       ├──────────────────────►│                      │
      │                       │  (code, state)         │  POST token endpoint │
      │                       │                       ├────────────────────►│
      │                       │                       │◄────────────────────┤
      │                       │                       │  id_token, access_token
      │                       │                       │                      │
      │                       │                       │  Validate id_token    │
      │                       │                       │  Lookup/create person │
      │                       │                       │  Issue session JWT    │
      │                       │◄──────────────────────┤                      │
      │  Set-Cookie: ureport_session (HttpOnly)       │                      │
      │◄──────────────────────┤                       │                      │
      │  302 /dashboard       │                       │                      │
```

### 5.2 Session JWT

**Issued by:** PHP `AuthService::issueJwt()` after successful OIDC code exchange.

**Payload:**
```json
{
  "iss": "ureport",
  "sub": 5,
  "role": "staff",
  "jti": "uuid-v4-for-revocation",
  "iat": 1750000000,
  "exp": 1750028800
}
```

**Storage:** HttpOnly, Secure, SameSite=Lax cookie named `ureport_session`. Never in `localStorage`.

**Signing:** HMAC-SHA256 with `JWT_SECRET` (min 32 bytes, configured in `site_config.php`).

**Validation on every API request:**
1. Extract JWT from `ureport_session` cookie OR `Authorization: Bearer <token>` header.
2. Verify HMAC signature.
3. Check `exp` not expired.
4. Load `people` record from DB: confirm `active = true` and retrieve current `role`.
5. *(Optional, if `sessions` table enabled)* Check `sessions.revokedAt IS NULL` for `jti`.
6. Set caller context `(personId, role)` for downstream controllers.

**Session TTL:** Configurable via `SESSION_TTL` constant (default: 28800 seconds / 8 hours).

### 5.3 Role-Based Access Control

**Role hierarchy:** `admin` > `staff` > `public` > `anonymous`.

**Role storage:** `people.role` column — JWT role claim is cross-validated against this column on every request. A stale JWT with an outdated role will be corrected at the DB lookup step.

**Category-level permissions (second dimension):**

| Category Setting | `anonymous` | `public` | `staff` | `admin` |
|-----------------|:-----------:|:--------:|:-------:|:-------:|
| `displayPermission=anonymous` | ✓ | ✓ | ✓ | ✓ |
| `displayPermission=public` | ✓ | ✓ | ✓ | ✓ |
| `displayPermission=staff` | ✗ | ✗ | ✓ | ✓ |
| `postingPermission=anonymous` | ✓ | ✓ | ✓ | ✓ |
| `postingPermission=public` | ✗ | ✓ | ✓ | ✓ |
| `postingPermission=staff` | ✗ | ✗ | ✓ | ✓ |

**Open311 authorization:** API key (`api_key` parameter) validated against `clients.apiKeyHash`. No JWT required. Missing key is not an error for public categories — ticket is attributed as anonymous.

### 5.4 HTTP Security Headers

Applied by `SecurityHeadersMiddleware` to all responses from the PHP API and by Apache for the Next.js proxy:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
```

> **Note:** `geolocation=(self)` allows the SPA map picker to access the browser's geolocation API for address lookup.

### 5.5 Input Validation & Injection Prevention

- All SQL executed via **PDO prepared statements with bound parameters** — no raw string interpolation. Repository layer enforces this; controllers never construct SQL.
- All user-supplied HTML/text output is **escaped at render time** in Next.js (React auto-escapes JSX expressions).
- Full-text search query (`q`) has HTML and script tags stripped before passing to Solr's query parser.
- MIME type validation on file uploads uses `finfo_file()` (reads magic bytes), not just the `Content-Type` header.
- File upload paths are validated to prevent path traversal (stored under `UPLOAD_ROOT`; filenames are UUID-based, not user-supplied).

### 5.6 CSRF Protection

- **SPA** (Next.js): SameSite=Lax cookie provides primary CSRF protection. State-mutating API routes additionally require the `X-Requested-With: XMLHttpRequest` header (double-submit pattern).
- **OIDC callback**: `state` nonce stored in a pre-login session (PHP `$_SESSION` or signed cookie); validated on callback to prevent CSRF in the OAuth flow.

### 5.7 API Key Security

- API keys are cryptographically random (UUID v4 format).
- Only `apiKeyHash` (bcrypt, cost ≥ 12) is stored in the `clients` table.
- The plain-text key is returned **once** — on create (`POST /api/clients`) and on regenerate (`POST /api/clients/{id}/regenerate-key`). All other `GET` responses return only `apiKeyHint` (first 8 chars + "…").
- On Open311 validation, the provided `api_key` is hashed and compared with the stored `apiKeyHash`.

### 5.8 Data Protection

| Concern | Approach |
|---------|---------|
| Passwords | No local passwords — authentication is OIDC-only |
| API keys | bcrypt hash stored; plain key ephemeral |
| JWT secrets | `JWT_SECRET` in `site_config.php`; excluded from VCS |
| OIDC client secret | `OIDC_CLIENT_SECRET` in `site_config.php`; excluded from VCS |
| SMTP credentials | `SMTP_PASS` in `site_config.php`; excluded from VCS |
| PII (reporter email) | Stored in `tickets.reporterEmail`; accessible only to staff/admin via API |
| File uploads | Stored under `UPLOAD_ROOT` (outside web root); served via Apache with access controls |
| SQL injection | PDO prepared statements throughout; no raw SQL in controllers |
| XSS | React auto-escaping; server-side strip of HTML from user text fields |
| Log data | Graylog logs structured events; PII minimized (ticket IDs, not raw emails, in default log fields) |

### 5.9 Dependency Security

- `license-checker` runs in CI to detect GPL-incompatible or unacceptable licenses.
- `composer audit` and `npm audit` run on every PR to flag known vulnerabilities.
- PHPStan at level 8+ enforced in CI — catches type-unsafe patterns before they reach production.
- TypeScript strict mode (`noImplicitAny`, `strictNullChecks`) enforced on frontend build.

---
