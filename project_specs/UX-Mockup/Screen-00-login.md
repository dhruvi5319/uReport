---

## Screen SCR-01: Login

**Purpose:** Authenticate staff users via JWT; redirect to dashboard or post-login target.
**User Stories:** US-4.1, US-4.3
**Journey:** JRN-01.1 Stage 1, JRN-03.1 Stage 3

### Layout

```
┌────────────────────────────────────────────────┐
│                                                │
│         [uReport Logo]                         │
│         Municipal Issue Tracker                │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │               Sign In                   │  │
│  │                                         │  │
│  │  Username                               │  │
│  │  [_____________________________________]│  │
│  │                                         │  │
│  │  Password                               │  │
│  │  [_____________________________________]│  │
│  │                                         │  │
│  │  ⚠ Invalid username or password         │  │  ← Error (hidden until error)
│  │                                         │  │
│  │  [         Sign In          ]           │  │
│  │                                         │  │
│  └──────────────────────────────────────────┘  │
│                                                │
└────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Sign-in form | Center card |
| Secondary | Application name + logo | Above card |
| Tertiary | Error message | Below password field (conditional) |

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Empty form, Sign In button enabled | None |
| Loading | Button disabled, spinner inside button | "Signing in…" |
| Error (401) | Error message visible below fields | "Invalid username or password" (no field enumeration) |
| Empty field | Field border turns red on submit | "Username is required" / "Password is required" |
| Success | Brief flash, then redirect | Redirect to `/tickets` (or target URL) |
| Session expired | Pre-filled login page | Toast: "Your session has expired. Please sign in again." |

### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Username field | Text input | Autofocus on page load |
| Password field | Password input | Show/hide toggle icon |
| Sign In button | Primary CTA | Submits form, shows spinner during POST |
| Error message | Inline alert | Appears on 401 response; clears on next submit attempt |

### Notes

- No "Remember Me" checkbox — JWT refresh token handles session persistence
- No "Forgot Password" link in scope (staff accounts managed by admin)
- Redirect to OAuth callback URL if configured (US-4.4)
- Form accessible via keyboard tab order; Enter submits
