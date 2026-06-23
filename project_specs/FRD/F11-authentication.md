---

## F11: Authentication (OIDC + JWT)

**Description:** uReport uses OpenID Connect (OIDC) as its authentication protocol. Staff log in via a configured OIDC provider (city SSO, Keycloak, Auth0, etc.). On the modernized stack, the OIDC authorization code flow exchanges tokens for a JWT-backed session stored in an HttpOnly cookie. The JWT is validated on every API request. Role is resolved from `people.role` after matching OIDC identity to a person record.

**Terminology:**
- **OIDC:** OpenID Connect — the authentication protocol layered on top of OAuth 2.0.
- **Authorization Code Flow:** The OIDC flow where the user is redirected to the provider, authenticates, and returns with an authorization code that is exchanged for tokens.
- **ID Token:** The OIDC JWT containing user identity claims (`sub`, `email`, `name`).
- **Access Token:** The OAuth 2.0 token used to call the OIDC provider's userinfo endpoint.
- **Session JWT:** The uReport-issued JWT stored in an HttpOnly cookie, representing the user's session. Distinct from the OIDC access token.
- **OIDC Subject (`sub`):** The unique identifier for the user at the OIDC provider. Stored in `people.oidcSubject`.
- **OIDC Config:** Provider issuer URL, client ID, client secret — stored in `site_config.php` constants.

**Sub-features:**
- OIDC authorization code flow (login redirect + callback)
- JWT session issuance after successful OIDC exchange
- Session JWT validation on every authenticated request
- Person record matching by `oidcSubject` or email claim
- Auto-provisioning of new person records on first login (role = `public`)
- Logout (invalidate session, redirect to OIDC provider logout)
- Unauthenticated access for public/anonymous endpoints
- Secure HttpOnly cookie-based session storage

---

### F11 Process: Staff Login

1. User navigates to `/auth/login` (or unauthenticated redirect).
2. System redirects to the configured OIDC provider's authorization endpoint with `response_type=code`, `scope=openid email profile`, and a `state` nonce.
3. User authenticates with the OIDC provider.
4. Provider redirects back to `/auth/callback?code=…&state=…`.
5. System validates the `state` nonce; exchanges `code` for OIDC tokens via the provider's token endpoint.
6. System validates the ID token signature and claims (`iss`, `aud`, `exp`).
7. System looks up person by `oidcSubject = id_token.sub` OR by `email = id_token.email`.
8. If no person found, system auto-creates with role `public` (see F03 §OIDC Auto-Provision).
9. System issues a uReport session JWT: payload `{ sub: people.id, role: people.role, exp: NOW() + SESSION_TTL }`.
10. System sets the session JWT as an HttpOnly, Secure, SameSite=Lax cookie (`ureport_session`).
11. System redirects to the originally requested URL (or default dashboard).

### F11 Process: Request Authentication

1. Every API request to a protected endpoint passes through auth middleware.
2. Middleware extracts session JWT from `ureport_session` cookie OR `Authorization: Bearer <token>` header.
3. Middleware validates JWT signature with the server's signing secret.
4. Middleware validates `exp` claim (not expired).
5. Middleware loads the person record from DB to confirm `active = true` and get current `role`.
6. Middleware sets caller context (`personId`, `role`) for downstream controllers.
7. If JWT is missing/invalid/expired → HTTP 401.
8. If person is inactive → HTTP 401 with `SESSION_REVOKED` code.

### F11 Process: Logout

1. User calls `POST /auth/logout`.
2. System clears the `ureport_session` cookie.
3. System invalidates any server-side session record (if session table maintained).
4. System redirects to the OIDC provider's end-session endpoint with `id_token_hint` and `post_logout_redirect_uri`.

---

### F11 Inputs

**Login initiation:**
- No direct inputs — user is redirected to OIDC provider

**Callback:**
- `code` (string): OIDC authorization code from provider
- `state` (string): Nonce for CSRF protection

**OIDC Config (site_config.php):**
- `OIDC_ISSUER`: Provider issuer URL
- `OIDC_CLIENT_ID`: Client ID registered with provider
- `OIDC_CLIENT_SECRET`: Client secret
- `OIDC_REDIRECT_URI`: Callback URL (`BASE_URL + '/auth/callback'`)
- `SESSION_TTL`: Session lifetime in seconds (default 28800 = 8 hours)
- `JWT_SECRET`: Signing secret for uReport session JWTs

---

### F11 Outputs

- **Session cookie** `ureport_session`: HttpOnly, Secure, SameSite=Lax, path=/
- **JWT payload**: `{ sub: personId, role: string, iss: "ureport", exp: unix_timestamp }`
- **HTTP 302** redirect on login and logout
- **HTTP 401** on invalid/expired session

---

### F11 Validation

- `state` nonce must match the value stored in the pre-login session (CSRF protection)
- ID token signature must be validated against the provider's JWKS endpoint
- ID token `exp` must be in the future
- ID token `iss` must match `OIDC_ISSUER`; `aud` must match `OIDC_CLIENT_ID`
- Session JWT `exp` must be in the future
- Person record must be `active = true` to accept login
- OIDC `sub` is the primary matching key; email is fallback; never match on name alone

---

### F11 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Invalid/expired session JWT | 401 | UNAUTHENTICATED | "Session expired; please log in again" |
| Person account inactive | 401 | SESSION_REVOKED | "Your account has been deactivated" |
| OIDC state mismatch | 400 | OAUTH_STATE_MISMATCH | "Authentication state mismatch; possible CSRF" |
| OIDC provider unreachable | 503 | IDP_UNAVAILABLE | "Authentication service unavailable; try again later" |
| ID token validation failure | 401 | INVALID_ID_TOKEN | "Identity token could not be verified" |
| OIDC provider returns error | 400 | OIDC_ERROR | Provider error description forwarded |

---

### F11 API Surface (this feature)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auth/login` | None | Initiate OIDC authorization code flow |
| GET | `/auth/callback` | None | OIDC callback; exchange code for session |
| POST | `/auth/logout` | session | Clear session and redirect to provider logout |
| GET | `/auth/me` | session | Return current user's person record + role |

---

### F11 Schema Surface (this feature)

- `people.oidcSubject` (varchar 255): OIDC `sub` claim — used for identity matching
- `people.role`: resolved role for JWT payload
- **Optional:** `sessions` table for server-side session invalidation: `(id, personId, jwtJti, expiresAt, revokedAt)`

See `Y0b-schema-supporting.md` §sessions.
