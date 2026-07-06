# Screen-00: Authentication (Login)

**Route:** `/login`
**Purpose:** Branded staff login via CAS SSO or LDAP credentials
**User Stories:** F12 (Authentication)
**Journeys:** JRN-02.1 (Login), JRN-02.2 (Access)

---

## Layout — Desktop

```
┌─────────────────────────────────────────────────────────────────┐
│                    [City Logo / uReport wordmark]               │
│                    "311 Service Request Management"             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              ┌─────────────────────────────────┐               │
│              │        Sign In to uReport        │               │
│              │                                 │               │
│              │  ┌─────────────────────────────┐│               │
│              │  │  Sign in with City SSO      ││  (CAS)        │
│              │  │  [City Logo]  CAS Login     ││               │
│              │  └─────────────────────────────┘│               │
│              │                                 │               │
│              │         ── or ──                │               │
│              │                                 │               │
│              │  Username                       │               │
│              │  [________________________]     │               │
│              │                                 │               │
│              │  Password                       │               │
│              │  [________________________]     │               │
│              │                                 │               │
│              │  [        Sign In         ]     │  (primary btn)│
│              │                                 │               │
│              │  [Error message area]           │               │
│              └─────────────────────────────────┘               │
│                                                                 │
│              Shadow-md card, max-w-sm, centered                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layout — Mobile (375 px)

```
┌────────────────────────────────┐
│  [City Logo — centered]        │
│  uReport                       │
│  311 Service Request Mgmt      │
├────────────────────────────────┤
│                                │
│ ┌────────────────────────────┐ │
│ │  Sign In to uReport        │ │
│ │                            │ │
│ │ [City SSO — full width]    │ │
│ │                            │ │
│ │  ── or ──                  │ │
│ │                            │ │
│ │ Username                   │ │
│ │ [__________________]       │ │
│ │                            │ │
│ │ Password                   │ │
│ │ [__________________]       │ │
│ │                            │ │
│ │ [      Sign In       ]     │ │
│ │                            │ │
│ │ [Error message area]       │ │
│ └────────────────────────────┘ │
│                                │
└────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Sign-in actions (SSO button, LDAP form) | Card center |
| Primary | Error messages | Below form fields |
| Secondary | City branding / logo | Above card |
| Tertiary | "uReport" product name | Below logo |

---

## States

| State | Appearance | User Feedback |
|---|---|---|
| Default | Clean card, both sign-in options | N/A |
| CAS loading | SSO button shows spinner; disabled | "Redirecting to City SSO…" |
| LDAP loading | Sign In button shows spinner; form disabled | Loading spinner inside button |
| LDAP error | Red border on failed field; error message below form | "Invalid username or password" |
| CAS error | Error banner below SSO button | "SSO login failed. Please try again or use username/password." |
| Session expired (redirected) | Toast at top of card | "Your session has expired. Please sign in again." |
| Success | Brief loading spinner | (redirect to dashboard) |

---

## Interactive Elements

| Element | Type | Behavior |
|---|---|---|
| City SSO button | Primary action | Redirects to CAS; shows loading state |
| Username input | Text input | Autofocus on page load |
| Password input | Password input | Enter key submits form |
| Sign In button | Primary button | Submits LDAP form; shows spinner |
| Error message | Alert region | ARIA role="alert"; announced by screen readers |

---

## Accessibility Notes

- `aria-live="polite"` on error message region
- Autofocus on username input on page load
- Enter key submits form (keyboard-only flow)
- Loading state disables all interactive elements to prevent double-submit
- Color contrast: error red on white ≥ 4.5:1
- Skip-to-main is unnecessary on this route (no nav shell)

---

*End of Screen-00-auth.md*
