## Epic 12: Authentication — LDAP and CAS (F12)

Staff authenticate via LDAP or CAS. Spring Security issues a JWT stored in an httpOnly cookie. Public users access the submission form without authentication. Branded login screens replace PHP auth views.

---

### US-12.1: Log In via CAS Single Sign-On
**As a** Marcus Rivera (311 Operator), **I want to** log in using my city SSO (CAS) credentials with a single click on the branded login screen, **so that** I don't need to remember a separate uReport password.

**Acceptance Criteria:**
- [ ] Navigating to a protected route while unauthenticated redirects to `/login?returnTo={originalPath}`
- [ ] Login screen shows the city logo, a "Sign in with CAS" button, a loading spinner on redirect, and an error state if auth fails
- [ ] Clicking "Sign in with CAS" redirects to the CAS server: `{casServer}/login?service={ureportBaseUrl}/auth/cas/callback`
- [ ] After CAS authenticates, browser is redirected to `/auth/cas/callback?ticket={serviceTicket}`
- [ ] Spring Security validates the service ticket; on success, looks up `people.username = principal` (creates minimal record if not found)
- [ ] JWT is issued: `{sub, role, personId, exp}` and set as an httpOnly, SameSite=Strict cookie named `auth_token`
- [ ] Browser is redirected to `returnTo` path (or `/dashboard` if none)
- [ ] React loads current user from `GET /api/auth/me` to confirm authentication

**Priority:** P0 | **Feature Ref:** F12

---

### US-12.2: Log In via LDAP Credentials
**As a** Diane Kowalski (Department Field Supervisor), **I want to** log in with my LDAP username and password on the uReport login screen, **so that** I can access my department's case queue in environments where CAS is not available.

**Acceptance Criteria:**
- [ ] Login screen shows a username and password form (LDAP tab or fallback)
- [ ] Submitting credentials via `POST /api/auth/ldap` (JSON body) triggers Spring Security LDAP bind
- [ ] Successful bind creates/looks up `people` record by username; issues JWT httpOnly cookie
- [ ] Response body returns `{personId, role, name}` — JWT is in cookie only, not response body (XSS mitigation)
- [ ] React redirects to `returnTo` path after successful login
- [ ] Failed LDAP bind (wrong password/unknown user) shows error state on login screen
- [ ] LDAP and CAS are independently configurable per deployment

**Priority:** P0 | **Feature Ref:** F12

---

### US-12.3: Session Expiry and Automatic Token Refresh
**As a** Marcus Rivera (311 Operator), **I want to** continue working without being abruptly logged out mid-shift, and to be redirected to login gracefully when my session does expire, **so that** call center work is not interrupted by unexpected authentication failures.

**Acceptance Criteria:**
- [ ] JWT expiry is configurable (recommended 8 hours for staff sessions)
- [ ] React reads `expiresAt` from `GET /api/auth/me` response and tracks expiry time
- [ ] 5 minutes before expiry, React calls `POST /api/auth/refresh` to silently renew the JWT
- [ ] Successful refresh issues a new JWT cookie with refreshed expiry
- [ ] If refresh fails (refresh token expired), React redirects to `/login?returnTo={currentPath}`
- [ ] Any 401 response from a protected API endpoint redirects to login with return URL preserved
- [ ] All API calls automatically include the httpOnly cookie (same-origin requests; no JavaScript access to JWT)

**Priority:** P0 | **Feature Ref:** F12

---

### US-12.4: Sign Out and Invalidate the Session
**As a** Marcus Rivera (311 Operator), **I want to** sign out securely from the user menu, **so that** my session is fully terminated when I leave my workstation.

**Acceptance Criteria:**
- [ ] A "Sign Out" option is accessible in the user menu in the top navbar
- [ ] Clicking "Sign Out" calls `POST /api/auth/logout`
- [ ] Spring Boot clears the `auth_token` cookie (Set-Cookie: expires=past) and invalidates the refresh token
- [ ] If CAS is in use, browser is redirected to CAS logout URL for single sign-out
- [ ] React clears local auth state; redirects to `/login`
- [ ] After logout, navigating to any protected route redirects to login

**Priority:** P0 | **Feature Ref:** F12

---

### US-12.5: View and Update Own Profile on the Account Screen
**As a** Marcus Rivera (311 Operator), **I want to** view and update my profile information and notification email preferences at `/account`, **so that** I receive case notification emails at the correct address.

**Acceptance Criteria:**
- [ ] `/account` route shows the current user's name, email, username, department, and role
- [ ] User can update their profile fields (name, notification email preferences)
- [ ] Notification email with `usedForNotifications = true` is clearly indicated and editable
- [ ] Changes save via `PATCH /api/people/{currentUserId}`; toast "Profile updated" on success
- [ ] Account screen is accessible to all authenticated staff roles

**Priority:** P0 | **Feature Ref:** F12

---
