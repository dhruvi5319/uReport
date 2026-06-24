---

## Flow FLW-01: Staff Login & Session Restore

**User Stories:** US-4.1, US-4.2, US-4.3
**Personas:** All staff (PER-01, PER-02, PER-03)
**Journey:** JRN-01.1 Stage 1, JRN-03.1 Stages 3–4

```
[/login page]
    │
    ▼
[Enter username + password]
    │
    ├── Valid credentials ──▶ POST /api/v1/auth/login
    │                              │
    │                              ├── 200 OK ──▶ Store accessToken + refreshToken
    │                              │                   │
    │                              │                   └── Redirect → /tickets
    │                              │                        (or last saved URL / bookmark)
    │                              │
    │                              └── 401 ──▶ Inline error: "Invalid username or password"
    │                                           (no field enumeration)
    │
    └── Empty fields ──▶ Inline validation: required field indicators

[Existing session / accessToken present]
    │
    ▼
[JwtAuthFilter validates token]
    │
    ├── Valid ──▶ Resume last route (no login page shown)
    │
    └── Expired ──▶ Silent refresh via POST /api/v1/auth/refresh
                         │
                         ├── Success ──▶ Continue seamlessly
                         │
                         └── Refresh expired/revoked ──▶ Redirect → /login
                                                          Toast: "Your session has expired"

[Logout]
    │
    ▼
[Click logout in header]
    │
    └── POST /api/v1/auth/logout ──▶ Clear tokens ──▶ Redirect → /login
```

**Steps:**
1. User navigates to `/login`; if a valid JWT exists in storage, skip to dashboard
2. Credentials form: username + password; "Sign In" button; no "remember me" (JWT handles session length)
3. On 401, display error below form; do not reveal which field is wrong (US-4.1 security requirement)
4. On success, redirect to `/tickets` or the URL the user was attempting to reach (post-login redirect)
5. Token refresh runs silently in the background before expiry; user is never interrupted (US-4.2)
6. Logout clears tokens from storage and blacklists access token jti (US-4.3)

---

## Flow FLW-08: API Client Registration & Key Rotation

**User Stories:** US-13.1, US-13.2
**Persona:** PER-03 Jordan (System Administrator)
**Journey:** JRN-03.2

```
[/admin/clients — API Client List]
    │
    ├── "New Client" button ──▶ [Client Create Form]
    │                               │
    │                               ├── Fill: name, URL, contact person, contact method
    │                               │
    │                               └── Save ──▶ POST /api/v1/clients
    │                                               │
    │                                               ├── 201 ──▶ [Key Reveal Modal]
    │                                               │           "Copy this key — it won't be shown again"
    │                                               │           [Copy to Clipboard] [Done]
    │                                               │           Redirect → Client List
    │                                               │
    │                                               └── 422 ──▶ Inline validation errors
    │
    └── Click existing client ──▶ [Client Detail View]
                                      │
                                      ├── Edit metadata ──▶ PUT /api/v1/clients/{id}
                                      │
                                      └── "Rotate Key" button ──▶ [Confirm Dialog]
                                                                    "This will invalidate the current key immediately."
                                                                    [Confirm Rotation]
                                                                         │
                                                                         └── PUT /api/v1/clients/{id} (new api_key)
                                                                              │
                                                                              ├── 200 ──▶ [Key Reveal Modal]
                                                                              │           New key shown once
                                                                              │
                                                                              └── Error ──▶ Toast error
```

**Key UX Notes (JRN-03.2):**
- API key is shown in plaintext **once only** at creation/rotation — copy-to-clipboard button is prominent
- After dismissing the key reveal modal, only a masked key is shown (e.g., `••••••••ab3f`)
- "Rotate Key" requires a confirmation step to prevent accidental rotation
- Key rotation takes effect immediately with no service restart required (US-13.2)
