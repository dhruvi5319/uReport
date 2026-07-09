---
phase: 09-admin-panels-and-integration
plan: GGAP-01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/.env.development
  - frontend/src/pages/LoginPage.tsx
autonomous: true
gap_closure: true

features:
  implements: ["AUTH-03"]
  depends_on: []
  enables: []

must_haves:
  truths:
    - "Submitting devadmin/admin123 on the LoginPage calls /api/auth/dev-login (not /api/auth/ldap) and succeeds with a redirect to /dashboard"
    - "When VITE_USE_DEV_LOGIN is not set (or false), LoginPage still calls /api/auth/ldap (production path unchanged)"
    - "A non-200 response from the login endpoint shows a red error message below the form"
  artifacts:
    - path: "frontend/.env.development"
      provides: "VITE_USE_DEV_LOGIN=true environment flag for Vite dev builds"
    - path: "frontend/src/pages/LoginPage.tsx"
      provides: "Conditional endpoint: /api/auth/dev-login in dev, /api/auth/ldap in prod"
  key_links:
    - from: "frontend/.env.development"
      to: "frontend/src/pages/LoginPage.tsx"
      via: "import.meta.env.VITE_USE_DEV_LOGIN"
      pattern: "VITE_USE_DEV_LOGIN"

integration_contracts:
  requires: []
  provides:
    - artifact: "frontend/src/pages/LoginPage.tsx"
      exports: ["LoginPage (default)"]
      shape: |
        const useDevLogin = import.meta.env.VITE_USE_DEV_LOGIN === 'true';
        const endpoint = useDevLogin ? '/api/auth/dev-login' : '/api/auth/ldap';
      verify: "grep -n 'VITE_USE_DEV_LOGIN' frontend/src/pages/LoginPage.tsx && grep -n 'api/auth/dev-login' frontend/src/pages/LoginPage.tsx && echo CONTRACT_OK"
---

<objective>
Wire LoginPage to POST /api/auth/dev-login in development mode so devadmin/admin123 authenticates successfully without LDAP.

Purpose: The LDAP endpoint returns 503 when ldap.enabled=false (dev default). DevLoginController (added in 09-PGAP-02) handles BCrypt password validation and JWT issuance correctly, but LoginPage.tsx always calls /api/auth/ldap. A one-line endpoint switch gated by VITE_USE_DEV_LOGIN fixes the login flow for all UAT tests blocked by Test 1.
Output: frontend/.env.development with VITE_USE_DEV_LOGIN=true, LoginPage.tsx with conditional endpoint.
</objective>

<feature_dependencies>
Implements: AUTH-03: Auth screens branded with loading spinner and error state
Depends on: None (DevLoginController already exists from 09-PGAP-02)
Enables: None (all downstream tests now unblocked)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/09-admin-panels-and-integration/09-PGAP-02-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add VITE_USE_DEV_LOGIN flag and wire LoginPage to dev endpoint</name>
  <files>frontend/.env.development, frontend/src/pages/LoginPage.tsx</files>
  <action>
**Step 1 — Create frontend/.env.development:**

```
VITE_USE_DEV_LOGIN=true
```

(Vite automatically loads .env.development for `vite` and `vite build --mode development`. This file should NOT be committed with production credentials — it is dev-only.)

**Step 2 — Update frontend/src/pages/LoginPage.tsx:**

At the top of the `LoginPage` function body (before the hooks), add:

```typescript
const useDevLogin = import.meta.env.VITE_USE_DEV_LOGIN === 'true';
```

Then inside `handleLdapSubmit`, replace the hardcoded endpoint:

OLD:
```typescript
const res = await fetch('/api/auth/ldap', {
```

NEW:
```typescript
const endpoint = useDevLogin ? '/api/auth/dev-login' : '/api/auth/ldap';
const res = await fetch(endpoint, {
```

No other changes. The rest of the handler (credentials body, cookie, navigation, error handling) is identical for both endpoints — both accept `{"username", "password"}` JSON and return the same response shape.

**Why:** LoginPage currently hardcodes `/api/auth/ldap` (line ~35). LdapAuthService.authenticate() throws IllegalStateException when ldap.enabled=false → AuthController returns 503. DevLoginController (POST /api/auth/dev-login, @Profile("dev")) validates BCrypt against the seeded devadmin and returns a JWT cookie with 200. Switching the endpoint in dev mode allows authentication to succeed without an LDAP server.
  </action>
  <verify>
```bash
grep 'VITE_USE_DEV_LOGIN=true' frontend/.env.development && echo ENV_OK
grep "VITE_USE_DEV_LOGIN" frontend/src/pages/LoginPage.tsx && echo FLAG_OK
grep "api/auth/dev-login" frontend/src/pages/LoginPage.tsx && echo ENDPOINT_OK
```
All three echo statements must print.
  </verify>
  <done>
- frontend/.env.development exists with VITE_USE_DEV_LOGIN=true
- LoginPage.tsx reads import.meta.env.VITE_USE_DEV_LOGIN and uses /api/auth/dev-login when true, /api/auth/ldap otherwise
- No other logic changed in LoginPage.tsx
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→API | LoginPage submits username/password JSON to backend auth endpoint |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-09-G1-01 | Elevation of privilege | VITE_USE_DEV_LOGIN flag in .env.development | accept | Flag is build-time only (Vite inlines at bundle time); .env.development is never deployed to production. DevLoginController is @Profile("dev") — not registered in prod Spring context. Residual risk: dev .env accidentally committed. Owner: developer. |
| T-09-G1-02 | Spoofing | LoginPage open-redirect via returnTo param | mitigate | `navigate(returnTo \|\| '/dashboard')` uses React Router navigate() — path is relative, cannot redirect to external origin. Guard already present in LoginPage.tsx handleLdapSubmit. |
</threat_model>

<verification>
```bash
# Confirm .env.development flag
grep 'VITE_USE_DEV_LOGIN=true' frontend/.env.development

# Confirm LoginPage uses conditional endpoint
grep 'VITE_USE_DEV_LOGIN' frontend/src/pages/LoginPage.tsx
grep 'api/auth/dev-login' frontend/src/pages/LoginPage.tsx

# Confirm existing tests still pass (LoginPage accessibility test)
cd frontend && npx vitest run src/__tests__/accessibility-suite.test.tsx --reporter=verbose 2>&1 | tail -20
```
</verification>

<success_criteria>
- frontend/.env.development present with VITE_USE_DEV_LOGIN=true
- LoginPage.tsx: `const useDevLogin = import.meta.env.VITE_USE_DEV_LOGIN === 'true'` present
- LoginPage.tsx: endpoint conditionally selects `/api/auth/dev-login` vs `/api/auth/ldap`
- UAT Test 1 gap resolved: devadmin/admin123 will succeed against /api/auth/dev-login (which already works per Test 12 pass)
</success_criteria>

<output>
After completion, create `.planning/phases/09-admin-panels-and-integration/09-GGAP-01-SUMMARY.md`
</output>
