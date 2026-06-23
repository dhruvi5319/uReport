---

## User Flows

### Flow 00: Authentication (Login / Logout)

**Trigger:** User navigates to any protected route, or clicks Login  
**User Stories:** US-11.1, US-11.2, US-3.2  
**Personas:** Dana (PER-01), Marcus (PER-02), Tomás (PER-04)  
**Journey:** JRN-01.1 (Login stage), JRN-04.1 (Test Staff Login stage)

```
[User visits /tickets or any protected route]
    │
    ▼
[/login page — "Sign in with City SSO" button]
    │
    ▼
[Redirect → OIDC Provider (Keycloak / Auth0 / city SSO)]
    │
    ├── OIDC Provider Unreachable ──▶ [Error screen: "Login service unavailable"]
    │                                   HTTP 503 IDP_UNAVAILABLE
    │
    ▼
[User completes IdP auth; callback to /auth/callback]
    │
    ├── Invalid token / CSRF ──▶ [Error: "Authentication failed. Please try again."]
    │                              HTTP 401 INVALID_ID_TOKEN
    │
    ▼
[System looks up person record by oidcSubject or email]
    │
    ├── Person not found ──▶ [Auto-provision: create person with role=public]
    │                         (US-3.2)
    │
    ▼
[System issues JWT cookie (ureport_session)]
    │
    ▼
[Redirect to originally-requested URL or role-default dashboard]
    │
    ├── role=admin/staff ──▶ [/dashboard]
    └── role=public ──────▶ [/submit or /track/:id]

─────────────────────────────────
LOGOUT FLOW
─────────────────────────────────
[User clicks "Sign out" in user menu]
    │
    ▼
[POST /auth/logout — clears ureport_session cookie]
    │
    ▼
[Redirect to OIDC provider end-session endpoint]
    │
    ▼
[/login page with "Signed out successfully" banner]

─────────────────────────────────
SESSION EXPIRY FLOW
─────────────────────────────────
[Any API request with expired JWT]
    │
    ▼
[HTTP 401 UNAUTHENTICATED returned]
    │
    ▼
[SPA detects 401 → save current URL → redirect to /login]
    │
    ▼
[After re-auth → restore saved URL]
```

**Steps:**
1. `/login` page renders with a single CTA: "Sign in with City SSO". No username/password fields (OIDC only).
2. Clicking the button initiates OIDC authorization code flow with a `state` nonce stored in session for CSRF protection.
3. IdP redirects back to `/auth/callback?code=…&state=…`. System validates `state`, exchanges code for tokens.
4. JWT is set as `HttpOnly; Secure; SameSite=Lax` cookie named `ureport_session`. No token in localStorage.
5. System checks for an existing `people` record matched by `oidcSubject` (or fallback: email claim).
6. Auto-provisioned users get `role=public` until an admin elevates the role (US-3.2).
7. Role-based redirect delivers the user directly to their contextually appropriate landing page.
8. On logout, cookie is cleared and OIDC end-session redirect ensures IdP session is also terminated.

**Error Handling:**
| Scenario | User-facing message | Recovery action |
|----------|--------------------|-|
| IdP unreachable | "Login service is temporarily unavailable. Please try again." | Retry button |
| Invalid/expired token | "Authentication failed. Please try again." | Back to /login |
| Account deactivated | "Your account has been deactivated. Contact your administrator." | No retry; show contact info |
| Session expired (mid-session) | Toast: "Session expired — please sign in again." | Auto-redirect to /login |
