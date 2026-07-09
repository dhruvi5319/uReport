---
phase: 09-admin-panels-and-integration
plan: GGAP-01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/.env.development
  - frontend/src/pages/LoginPage.tsx
  - frontend/src/__tests__/LoginPage.test.tsx
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
  <files>frontend/.env.development, frontend/src/pages/LoginPage.tsx, frontend/src/__tests__/LoginPage.test.tsx</files>
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

**Step 3 — Add vitest tests for the VITE_USE_DEV_LOGIN branch in frontend/src/__tests__/LoginPage.test.tsx:**

Open the existing `LoginPage.test.tsx` file (it already contains accessibility tests). Add the following `describe` block — do **not** replace or remove any existing tests:

```typescript
describe('LoginPage — dev login endpoint selection', () => {
  it('calls /api/auth/dev-login when VITE_USE_DEV_LOGIN is true', async () => {
    // Arrange: set the build-time env flag
    const originalEnv = import.meta.env.VITE_USE_DEV_LOGIN;
    (import.meta.env as Record<string, string>).VITE_USE_DEV_LOGIN = 'true';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ token: 'tok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    render(
      <MemoryRouterWrapper>
        <LoginPage />
      </MemoryRouterWrapper>
    );

    // Act: fill in credentials and submit
    await userEvent.type(screen.getByLabelText(/username/i), 'devadmin');
    await userEvent.type(screen.getByLabelText(/password/i), 'admin123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Assert: fetch was called with the dev endpoint
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/auth/dev-login',
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Cleanup
    (import.meta.env as Record<string, string>).VITE_USE_DEV_LOGIN = originalEnv;
    vi.restoreAllMocks();
  });

  it('calls /api/auth/ldap when VITE_USE_DEV_LOGIN is not set', async () => {
    // Arrange: ensure flag is absent/false
    const originalEnv = import.meta.env.VITE_USE_DEV_LOGIN;
    (import.meta.env as Record<string, string>).VITE_USE_DEV_LOGIN = 'false';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'bad' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    render(
      <MemoryRouterWrapper>
        <LoginPage />
      </MemoryRouterWrapper>
    );

    await userEvent.type(screen.getByLabelText(/username/i), 'someone');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/auth/ldap',
        expect.objectContaining({ method: 'POST' })
      );
    });

    (import.meta.env as Record<string, string>).VITE_USE_DEV_LOGIN = originalEnv;
    vi.restoreAllMocks();
  });
});
```

**Ensure these imports are present** at the top of the test file (add only those not already imported):
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LoginPage from '../pages/LoginPage';
```

**Note:** The new tests use `MemoryRouterWrapper` — the helper already defined at the top of `LoginPage.test.tsx` (it wraps children in `<MemoryRouter initialEntries={['/login']}>` with both `/login` and `/dashboard` routes). Do **not** re-declare it; just reference it as-is.
  </action>
  <verify>
```bash
grep 'VITE_USE_DEV_LOGIN=true' frontend/.env.development && echo ENV_OK
grep "VITE_USE_DEV_LOGIN" frontend/src/pages/LoginPage.tsx && echo FLAG_OK
grep "api/auth/dev-login" frontend/src/pages/LoginPage.tsx && echo ENDPOINT_OK
grep "api/auth/dev-login" frontend/src/__tests__/LoginPage.test.tsx && echo TEST_DEV_ENDPOINT_OK
cd frontend && npx vitest run src/__tests__/LoginPage.test.tsx --reporter=verbose 2>&1 | tail -20 && echo VITEST_PASSED
```
All five echo statements must print.
  </verify>
  <done>
- frontend/.env.development exists with VITE_USE_DEV_LOGIN=true
- LoginPage.tsx reads import.meta.env.VITE_USE_DEV_LOGIN and uses /api/auth/dev-login when true, /api/auth/ldap otherwise
- No other logic changed in LoginPage.tsx
- LoginPage.test.tsx contains two new vitest tests: one asserting fetch('/api/auth/dev-login') when flag is 'true', one asserting fetch('/api/auth/ldap') when flag is 'false'
- `npx vitest run src/__tests__/LoginPage.test.tsx` passes with 0 failing tests
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

# Confirm conditional endpoint logic is exercised by vitest (not just grep)
cd frontend && npx vitest run src/__tests__/LoginPage.test.tsx --reporter=verbose 2>&1 | tail -20 && echo VITEST_PASSED

# Confirm existing accessibility tests still pass
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
