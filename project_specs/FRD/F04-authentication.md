---

## F04: Authentication — JWT / Spring Security

**Description:** The legacy PHP session-based authentication is replaced with stateless JWT-based authentication via Spring Security. Staff users log in with username/password and receive a short-lived access token plus a refresh token. External API clients authenticate via API key on Open311 write endpoints. An OAuth callback endpoint supports external identity provider flows.

---

### Terminology

- **Access Token:** A short-lived JWT (default 1-hour expiry) encoding the user's identity and role.
- **Refresh Token:** A longer-lived token (default 24-hour expiry) stored server-side (or as a secure HttpOnly cookie) used to obtain new access tokens without re-login.
- **JWT Claims:** Payload fields in the JWT — `sub` (person_id), `role`, `iat`, `exp`, `iss`.
- **Spring Security:** The Java framework handling filter chains, token validation, and method-level authorization.
- **Token Blacklist:** A server-side store (e.g., Redis or DB table) of invalidated token JTIs for logout support.
- **OAuth Callback:** `GET /callback` — receives an authorization code from an external identity provider and maps it to a local `people` record.
- **MSAL / OIDC:** External identity providers optionally used for SSO login (callback endpoint only).

---

### Sub-features

- Staff login with username + password
- JWT access token issuance
- Refresh token issuance and rotation
- Token validation middleware (Spring Security filter)
- Logout / token invalidation
- OAuth/external identity callback handler
- API key authentication (Open311 write, validated against clients table)
- Role loading from `people.role` into JWT claims

---

### Process

#### Staff Login
1. Client POSTs to `POST /api/v1/auth/login` with `username` and `password`.
2. System looks up `people` record by `username`.
3. System verifies password against `people.passwordHash` using BCrypt.
4. If credentials invalid → 401.
5. System generates JWT with claims: `sub = people.id`, `role = people.role`, `iat = now`, `exp = now + 1h`, `iss = "ureport"`, `jti = UUID`.
6. System generates refresh token: `UUID`, stored in `refresh_tokens` table with `person_id`, `expiresAt = now + 24h`, `revoked = false`.
7. Returns `{ "accessToken": "<jwt>", "refreshToken": "<uuid>", "expiresIn": 3600, "role": "staff" }`.

#### Token Refresh
1. Client POSTs to `POST /api/v1/auth/refresh` with `refreshToken`.
2. System looks up refresh token in `refresh_tokens`; validates not revoked and not expired.
3. System revokes the old refresh token (rotation).
4. System issues new access token and new refresh token.
5. Returns same shape as login response.

#### Logout
1. Client POSTs to `POST /api/v1/auth/logout` with `refreshToken` (or reads from cookie).
2. System marks refresh token as revoked in `refresh_tokens`.
3. System adds the access token's `jti` to a token blacklist (TTL = remaining exp).
4. Returns 200 OK.

#### Token Validation (Every Request)
1. Spring Security `JwtAuthenticationFilter` intercepts every request.
2. Extracts Bearer token from `Authorization` header.
3. Validates signature, expiry, and issuer.
4. Checks `jti` against blacklist (if blacklist enabled).
5. If valid, sets `SecurityContextHolder` with authenticated principal (person_id + role).
6. If invalid/expired → 401.

#### OAuth Callback
1. External IdP redirects to `GET /callback?code=<auth_code>&state=<csrf_state>`.
2. System validates CSRF state.
3. System exchanges auth code for IdP token.
4. System extracts identity claim (email or sub) from IdP token.
5. System looks up `people` by email or external ID.
6. If not found → 404 (no auto-registration; staff must pre-exist).
7. System issues local JWT + refresh token as in login flow.
8. Redirects to SPA with tokens.

#### API Key Authentication (Open311)
1. Request to `POST /open311/requests` includes `api_key` parameter.
2. Spring Security `ApiKeyAuthenticationFilter` (separate from JWT filter) intercepts Open311 routes.
3. Looks up `clients` by hashed `api_key`.
4. If found → sets an `ApiKeyPrincipal` in security context with `client_id`.
5. If not found → 403.
6. Obsolete key check occurs before client lookup (F02).

---

### Inputs

**Login:**
- `username` (string, required): Person's username.
- `password` (string, required): Plain-text password (never logged).

**Refresh:**
- `refreshToken` (string, required): Refresh token UUID.

**Logout:**
- `refreshToken` (string, required): Refresh token to invalidate.

**OAuth Callback:**
- `code` (string, required): Authorization code from IdP.
- `state` (string, required): CSRF state token.

---

### Outputs

**Login/Refresh Response:**
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<uuid>",
  "expiresIn": 3600,
  "role": "staff",
  "personId": 42
}
```

**Logout Response:** `200 OK`, empty body.

**OAuth Callback:** Redirect to SPA with query params or cookie set.

---

### Validation Rules

- `username` must be non-empty and exist in `people` table.
- `password` must match BCrypt hash in `people.passwordHash`.
- JWT signing algorithm: HS256 or RS256 (configurable via `app.jwt.algorithm`).
- JWT secret key min length: 256 bits for HS256.
- Access token expiry: configurable, default 3600 seconds.
- Refresh token expiry: configurable, default 86400 seconds.
- Refresh tokens are single-use (rotated on each refresh).
- On logout, both the refresh token and the access token `jti` are invalidated.
- `people.passwordHash` must be stored as BCrypt (cost factor ≥ 10).
- API keys are stored hashed in `clients.api_key` (BCrypt or SHA-256 + salt).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Invalid username or password | 401 | AUTH_FAILED | "Invalid username or password" |
| Account not found | 401 | AUTH_FAILED | "Invalid username or password" |
| Expired access token | 401 | TOKEN_EXPIRED | "Access token has expired" |
| Invalid/malformed token | 401 | TOKEN_INVALID | "Invalid token" |
| Blacklisted token (post-logout) | 401 | TOKEN_REVOKED | "Token has been revoked" |
| Expired/revoked refresh token | 401 | REFRESH_TOKEN_INVALID | "Refresh token is invalid or expired" |
| Invalid OAuth state (CSRF) | 400 | OAUTH_STATE_INVALID | "Invalid OAuth state parameter" |
| OAuth identity not found | 404 | PERSON_NOT_FOUND | "No account found for this identity" |
| Missing api_key | 403 | API_KEY_REQUIRED | "API key is required" |
| Invalid api_key | 403 | API_KEY_INVALID | "Invalid API key" |

---

### API Surface (this feature)

See full request/response schemas in `Y1a-api-auth-people.md §Auth`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/login` | none | Authenticate with username/password |
| POST | `/api/v1/auth/refresh` | none (refresh token) | Rotate access + refresh tokens |
| POST | `/api/v1/auth/logout` | Bearer JWT | Revoke tokens |
| GET | `/callback` | none (OAuth code) | OAuth identity provider callback |

---

### Schema Surface (this feature)

New tables: `refresh_tokens`, `token_blacklist`. See `Y0b-schema-people.md §Auth`.

`people.passwordHash` (VARCHAR 255): BCrypt hash of password. `people.username` (VARCHAR 100 UNIQUE).
`refresh_tokens`: id (UUID PK), person_id (FK people), createdAt, expiresAt, revoked (BOOLEAN).
`token_blacklist`: jti (VARCHAR 36 PK), expiresAt (TIMESTAMPTZ) — cleaned up after expiry by scheduler.
