# Flow-00: Staff Authentication

**Trigger:** Staff navigates to any protected route, or directly to `/login`
**User Stories:** F12 (Authentication)
**Journeys:** JRN-02.1 (Login stage), JRN-02.2 (Access stage)

---

## Flow Diagram

```
[Browser opens protected URL]
         │
         ▼
 [Redirect to /login]
         │
         ▼
 [Login Card renders]
  ┌─────────────────┐
  │  CAS button     │──▶ [CAS SSO redirect] ──▶ [CAS authenticates]
  │  LDAP form      │                                    │
  └─────────────────┘                                    ▼
         │                                   [Spring Boot issues JWT]
         │ (LDAP path)                                   │
         ▼                                               ▼
  [Submit credentials]                        [JWT stored (httpOnly cookie)]
         │                                               │
    ┌────┴────┐                                          ▼
    │         │                                [Redirect to /dashboard]
  Error     Success                                      │
    │         │                                          ▼
    ▼         ▼                               [Dashboard renders with
  [Inline  [Loading                            role-scoped widgets]
   error]   spinner]
```

---

## Steps

1. **Entry**: User lands on `/login` (direct or redirect from protected route). The original attempted URL is preserved in redirect state.
2. **CAS path**: Clicking "Sign in with City SSO" redirects to the CAS server. On success, CAS redirects back with a service ticket; Spring Boot validates and issues JWT.
3. **LDAP path**: User enters username + password; form submits to `POST /api/auth/login`. Loading spinner shown during request.
4. **Success**: JWT set in httpOnly cookie. React redirects to originally requested URL (or `/dashboard` if none). Role and department stored in React auth context.
5. **Error**: Inline error message under the failed field or below the form. Form re-enabled for retry.
6. **Session expiry**: Protected API call returns 401 → React clears auth context → redirect to `/login` with toast "Your session has expired. Please sign in again."

---

## Exit Points

| Outcome | Destination |
|---|---|
| Authentication success | `/dashboard` (or originally requested URL) |
| CAS single sign-out | `/login` with success message |
| Session expired (anywhere) | `/login` with expiry toast |

---

*End of Flow-00-auth.md*
