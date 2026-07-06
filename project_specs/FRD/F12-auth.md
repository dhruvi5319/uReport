---

## F12: Authentication — LDAP and CAS

**Priority:** P0 — Critical

### Description

Staff authenticate via LDAP or CAS (Central Authentication Service). Public users submit cases without authentication. After successful LDAP/CAS authentication, Spring Security issues a JWT to the React frontend; the JWT is stored in an httpOnly cookie or in-memory (not localStorage, for XSS mitigation). Every subsequent internal API call includes the JWT for validation. Branded login screens replace PHP auth views.

### Terminology

- **CAS** — Central Authentication Service; a single sign-on protocol used by the municipality. Spring Security CAS extension handles the redirect/callback flow.
- **LDAP** — Lightweight Directory Access Protocol; alternative authentication for environments without CAS. Spring Security LDAP binds with user credentials.
- **JWT** — JSON Web Token. Issued by Spring Boot after successful auth; signed with HS256 (configurable secret). Contains: `sub` (username), `role`, `person_id`, `exp` (expiry).
- **httpOnly cookie** — Browser cookie not accessible to JavaScript; prevents XSS theft of JWT.
- **Refresh token** — A longer-lived token stored server-side; used to issue new JWTs without re-authentication. Stored in a `refresh_tokens` in-memory store or database table.
- **CAS service URL** — The URL of the uReport application registered with the CAS server; used in the CAS authentication redirect.
- **LDAP bind** — The process of authenticating a user by binding to the LDAP server with their credentials.

### Sub-features

- CAS authentication flow (redirect → callback → JWT issue)
- LDAP authentication flow (form-based → bind → JWT issue)
- Dual provider selection: CAS or LDAP (configurable per deployment)
- JWT issuance and validation on every protected API endpoint
- httpOnly cookie storage of JWT (XSS mitigation)
- JWT expiry: configurable (recommended 8 hours for staff sessions)
- Refresh token flow: silently renew JWT before expiry
- Branded login screen: city logo, CAS/LDAP tabs, loading spinner, error state
- Session expiry: redirect to login with return URL preserved
- Logout: invalidates JWT / refresh token; CAS single sign-out supported
- Account screen (`/account`): view and update own profile fields, notification email preferences
- Protected route guard: React redirects unauthenticated users to login

### Process — CAS Authentication

1. User navigates to a protected route (e.g., `/dashboard`).
2. React detects no valid JWT; redirects to `/login?returnTo={originalPath}`.
3. Login screen renders CAS login option.
4. User clicks "Sign in with CAS".
5. Browser redirects to CAS server URL: `{casServer}/login?service={ureportBaseUrl}/auth/cas/callback`.
6. User authenticates on CAS server (username + password on CAS UI).
7. CAS server redirects back to `{ureportBaseUrl}/auth/cas/callback?ticket={serviceTicket}`.
8. Spring Security CAS filter validates the service ticket with CAS server (`/serviceValidate`).
9. On success: Spring Security resolves the CAS principal (username).
10. System looks up `people` record where `people.username = principal`. If not found, creates a minimal `people` record.
11. Spring Boot issues JWT: `{sub: username, role: person.role, personId: person.id, exp: NOW + jwtExpirySeconds}`.
12. JWT is set as an httpOnly, SameSite=Strict cookie named `auth_token`.
13. Browser is redirected to `returnTo` path (or `/dashboard` if no `returnTo`).
14. React reads the presence of the cookie (not its value) to confirm authentication; loads the current user from `GET /api/auth/me`.

### Process — LDAP Authentication

1. User navigates to a protected route; redirected to `/login?returnTo={path}`.
2. Login screen renders LDAP form (username + password fields).
3. User submits credentials via `POST /api/auth/ldap` (JSON body: `{username, password}`).
4. Spring Security LDAP binds to the LDAP server with provided credentials.
5. On success: system looks up `people` record by username; creates if not found.
6. JWT issued; set as httpOnly cookie (same as step 12 above).
7. Response: `{personId, role, name}` (no JWT in body — only in cookie).
8. React redirects to `returnTo` path.

### Process — JWT Validation (Every Protected API Call)

1. React includes the httpOnly cookie automatically in every same-origin request.
2. Spring Security JWT filter extracts and validates the `auth_token` cookie on every request.
3. Validation: signature, expiry (`exp`), issuer (configured).
4. If valid: populates Spring Security `SecurityContext` with the authenticated principal.
5. If invalid or expired: returns 401 response.
6. React intercepts 401 response; redirects to `/login?returnTo={currentPath}`.

### Process — Token Refresh

1. React tracks JWT expiry time (from `GET /api/auth/me` response which includes `expiresAt`).
2. 5 minutes before expiry, React proactively calls `POST /api/auth/refresh`.
3. Spring Boot validates the refresh token (stored server-side or encoded in a second httpOnly cookie).
4. On success: issues a new JWT cookie with refreshed expiry.
5. If refresh fails (refresh token expired): React redirects to login.

### Process — Logout

1. User clicks "Sign Out" in the user menu.
2. React calls `POST /api/auth/logout`.
3. Spring Boot clears the `auth_token` cookie (Set-Cookie: expires=past) and invalidates the refresh token.
4. If CAS is in use: Spring Boot redirects to CAS logout URL for single sign-out: `{casServer}/logout?service={ureportBaseUrl}`.
5. React clears local auth state; redirects to `/login`.

### Protected vs. Public Routes

| Route Pattern | Auth Required |
|---|---|
| `/login` | Public |
| `/submit` | Public |
| `/open311/*` | Public (api_key for writes) |
| `/api/tickets/public` | Public |
| `/api/categories/public` | Public |
| `/api/geocode` | Public |
| `/dashboard`, `/cases/*`, `/admin/*`, `/account` | JWT Required |
| All other `/api/*` | JWT Required |

### Account Screen (`/account`)

- Shows current user's person record: name, email, phone, department, role.
- Editable fields: name fields, notification email preference (which email to use for notifications).
- `PATCH /api/people/{currentPersonId}` to save changes.
- Password change not managed here (handled by CAS/LDAP systems).

### JWT Claims

| Claim | Type | Description |
|---|---|---|
| `sub` | string | Username (LDAP UID or CAS principal) |
| `personId` | integer | `people.id` of the authenticated user |
| `role` | string | `admin`, `staff`, or `public` |
| `exp` | integer | Unix timestamp of expiry |
| `iat` | integer | Unix timestamp of issue time |
| `iss` | string | Issuer string (configurable; e.g., "ureport") |

### Inputs — LDAP Login

| Field | Type | Required | Validation |
|---|---|---|---|
| `username` | string | [R] | Max 40 chars |
| `password` | string | [R] | Min 1 char; never logged |

### Validation Rules

- JWT must be signed with the configured HS256 secret; tampered tokens are rejected.
- JWT expiry is enforced server-side; expired tokens return 401 regardless of cookie presence.
- LDAP bind errors (wrong password, account locked, server unavailable) return 401.
- CAS ticket must be validated with the CAS server; local ticket reuse is rejected by CAS.
- `returnTo` parameter must be a relative path on the same origin; absolute URLs rejected (open redirect prevention).

### Error States

| Scenario | HTTP Status | User Behavior |
|---|---|---|
| Invalid LDAP credentials | 401 | Login form shows "Invalid username or password" |
| LDAP server unavailable | 503 | Login form shows "Authentication service unavailable. Try again later." |
| CAS ticket validation failure | 401 | Redirect back to login with "Authentication failed" message |
| JWT expired | 401 | React redirects to login; returnTo preserved |
| Role insufficient for route | 403 | Shows "Access denied" page with link to dashboard |
| CAS server unavailable | 503 | Login page shows error; LDAP form still available |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/login` | Branded login page (React route) |
| POST | `/api/auth/ldap` | LDAP credential authentication |
| GET | `/auth/cas/callback` | CAS service ticket callback (Spring) |
| POST | `/api/auth/refresh` | Refresh JWT |
| POST | `/api/auth/logout` | Logout (clear cookie, invalidate refresh) |
| GET | `/api/auth/me` | Current user info + expiresAt |
| GET | `/account` | Account screen (React route) |
| PATCH | `/api/people/{id}` | Update own profile |

### Schema Surface

- `people` — user account records (username, role, department_id)
- `peopleEmails` — notification email preferences
- No dedicated auth tables required (JWT is stateless; refresh tokens stored in application memory or a simple in-process cache)
