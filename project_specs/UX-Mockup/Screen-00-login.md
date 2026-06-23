---

## Screen Designs

### Screen 00: Login / OIDC Redirect Page

**Route:** `/login`  
**Purpose:** Entry point for staff and admin users. Initiates OIDC authentication flow.  
**User Stories:** US-11.1, US-11.2  
**Personas:** Dana (PER-01), Marcus (PER-02), Tomás (PER-04)

#### Layout

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                  [City Logo / uReport]               │
│                                                     │
│         ┌───────────────────────────────┐           │
│         │                               │           │
│         │    uReport                    │           │
│         │    Municipal CRM              │           │
│         │                               │           │
│         │    ┌─────────────────────┐    │           │
│         │    │  Sign in with       │    │           │
│         │    │  City SSO  🔑       │    │           │
│         │    └─────────────────────┘    │           │
│         │                               │           │
│         │    ─── or ───                 │           │
│         │                               │           │
│         │    [Submit a service request] │           │
│         │    (link to /submit)          │           │
│         │                               │           │
│         └───────────────────────────────┘           │
│                                                     │
│         Version 2.0 · AGPL-3.0                      │
└─────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | "Sign in with City SSO" button | Card center, large CTA |
| Secondary | Product name and branding | Card top |
| Tertiary | Citizen form link | Below the SSO button |
| Tertiary | Version / license | Page footer |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Clean card, single CTA | N/A |
| Loading (IdP redirect) | Button → spinner, text: "Redirecting to sign-in..." | Spinner in button |
| IdP unavailable | Error card replaces login card | "Login service temporarily unavailable. [Try again]" |
| Auth failed | Error banner below card | "Authentication failed. Please try again." |
| Signed out | Success banner above card | "You've been signed out successfully." |
| Account deactivated | Error card | "Your account has been deactivated. Contact your system administrator." |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Sign in with City SSO | Primary button | Initiates OIDC flow; shows spinner on click |
| Submit a service request | Text link | Navigates to /submit |
| Try again (error state) | Secondary button | Reloads /login |

#### Notes
- No username/password fields — OIDC only.
- The `/login?redirect=/tickets/123` query param is preserved through the OIDC flow and restored on success.
- The "Submit a service request" link ensures citizens who accidentally navigate to /login can reach their destination.
- Fully functional at 375px (single column, centered card).
