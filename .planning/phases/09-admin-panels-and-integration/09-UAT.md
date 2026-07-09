---
status: complete
phase: 09-admin-panels-and-integration
source: 09-01-SUMMARY.md, 09-02-SUMMARY.md, 09-03-SUMMARY.md, 09-PGAP-01-SUMMARY.md, 09-PGAP-02-SUMMARY.md
started: 2026-07-09T21:34:14Z
updated: 2026-07-09T22:42:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Login Page - LDAP Authentication
expected: Navigate to /login. You see a branded city card layout with a CAS SSO button and an LDAP username/password form. Enter credentials (devadmin / admin123) and submit. A loading spinner appears on the button while the request is in flight. On success, you are redirected to /dashboard. On wrong credentials, a red error message appears below the form.
result: issue
reported: "Used the same credential but it says invalid credentials"
severity: major

### 2. Admin Guard - Non-Admin Redirect
expected: While logged in as a non-admin user (or logged out), attempt to navigate to any /admin/* route (e.g. /admin/people). You should be immediately redirected to /dashboard (if authenticated) or /login (if not). An admin user can access the route normally.
result: skipped

### 3. People Admin Panel - CRUD
expected: Navigate to /admin/people as an admin. You see a table of people with a search toolbar and skeleton loading. Click "New" to open a right-side Sheet (40% width) with a create form. Fill in details and save — the table refreshes with the new person. Click a row to edit. Click the delete icon — an AlertDialog confirmation appears. Confirm — the person is removed. A Toast notification appears for each successful action.
result: skipped
reason: Cannot access admin panels — login fails (Test 1 gap blocks access)

### 4. Departments Admin Panel - CRUD
expected: Navigate to /admin/departments. You can create/edit/delete departments using the same Sheet+AlertDialog+Toast pattern. The edit Sheet includes a combobox for searching and selecting a default assignee (person), and a multi-select for department actions.
result: skipped
reason: Cannot access admin panels — login fails (Test 1 gap blocks access)

### 5. Categories Admin Panel - Accessible Accordion
expected: Navigate to /admin/categories. Category groups are shown as an accordion. Clicking the expand toggle (a proper button) opens the group to show nested category rows. Edit and Delete buttons are separate from the expand toggle. No nested-interactive accessibility issue.
result: skipped
reason: Cannot access admin panels — login fails (Test 1 gap blocks access)

### 6. API Clients Panel - Key Shown Once
expected: Navigate to /admin/clients. Click "New" to create a new API client. After saving, the generated API key is shown exactly once in the Sheet with a copy button and a warning that it won't be shown again. Closing and reopening the Sheet shows the key masked. The table lists clients without exposing the full key.
result: skipped
reason: Cannot access admin panels — login fails (Test 1 gap blocks access)

### 7. Substatus Panel - Default Star
expected: Navigate to /admin/substatus. One substatus shows a star icon indicating it is the default. Clicking to set a different substatus as default unsets the previous star. Attempting to delete the current default substatus shows a warning.
result: skipped
reason: Cannot access admin panels — login fails (Test 1 gap blocks access)

### 8. Issue Types & Contact Methods - Inline Editing + Lock
expected: Navigate to /admin/issue-types (and /admin/contact-methods). Click a row to edit it inline (in place, not in a Sheet). Seeded system records (IDs 1-6 for issue types, 1-4 for contact methods) show a Lock icon and have their Delete button disabled with a tooltip.
result: skipped
reason: Cannot access admin panels — login fails (Test 1 gap blocks access)

### 9. Actions Panel - Department vs System Actions
expected: Navigate to /admin/actions. The "+ New Department Action" button creates DEPARTMENT-type actions only. System actions open in a read-only Sheet with no edit capability. System-type actions have no Delete button.
result: skipped
reason: Cannot access admin panels — login fails (Test 1 gap blocks access)

### 10. Command Palette Search (Cmd+K)
expected: Press Cmd+K (or Ctrl+K) from any page. A Command palette dialog opens. Type at least 2 characters. After 300ms debounce, results appear showing ticket ID (monospace), category name, and status Badge. Clicking a result navigates to /cases/{id}. Closing the dialog clears the query.
result: skipped
reason: Cannot test — requires authenticated session (login fails, Test 1 gap blocks access)

### 11. Bookmark Save & Recall
expected: On the Case List page (/cases), apply a filter (e.g. status=open). Click "Save Search" — a Dialog appears to name the bookmark. Submit — it's saved via POST /api/bookmarks. Open the "Saved Searches" dropdown — your saved search appears. Click it — the filter is restored via URL search params. A trash icon next to each saved search triggers an AlertDialog to confirm deletion.
result: skipped
reason: Cannot test — requires authenticated session (login fails, Test 1 gap blocks access)

### 12. Dev Login Endpoint
expected: The backend (when running with dev profile) accepts POST /api/auth/dev-login with {"username":"devadmin","password":"admin123"} and responds with 200 + Set-Cookie: auth_token=<jwt>. Wrong credentials return 401. This endpoint does not exist in production (404).
result: pass
note: "🤖 Auto-check confirmed: POST /api/auth/dev-login devadmin/admin123 → 200+JWT. Bad password → 401."

### 13. Open311 Golden File Tests
expected: The Open311 golden file test suite (Open311GoldenFileIT) passes — all four endpoints (GET /open311/v2/services JSON+XML, GET /open311/v2/requests, POST /open311/v2/requests, GET /open311/v2/requests/{id}) return responses matching the golden fixture files in shape and field structure.
result: issue
reported: "🤖 Auto-check: All 8 Open311GoldenFileIT tests fail with DataIntegrityViolationException — null value in column 'contact_person_id' of relation 'clients'. Test fixture setup inserts Client records without a required FK to Person."
severity: major

### 14. Application Smoke Tests
expected: ApplicationSmokeIT passes all 4 smoke tests: actuator /health returns UP, GET /open311/v2/services returns 200, POST /api/auth/ldap with bad credentials returns 401, GET /api/tickets without auth returns 401.
result: issue
reported: "🤖 Auto-check: 2 of 4 smoke tests fail. actuatorHealth_returnsUp → 503 (DB health check failing in test context). ldapAuth_withBadCredentials_returns401 → 503 (LDAP disabled returns 503 not 401 per AuthController). open311Services_returnsOk → passes. ticketsEndpoint_withNoAuth_returns401 → passes."
severity: major

### 15. Accessibility - Zero Critical Violations
expected: The accessibility suite (accessibility-suite.test.tsx) passes all 5 axe-core scans with 0 critical or serious WCAG 2.0 AA violations across LoginPage, CaseListPage, PeoplePage, DepartmentsPage, and CategoriesPage.
result: pass
note: "🤖 Auto-check confirmed: All 5 axe-core tests pass (5/5). 0 critical/serious WCAG 2.0 AA violations across all 5 screens."

## Summary

total: 15
passed: 2
issues: 3
pending: 0
skipped: 10

## Self-Check

boot: 000 (did-not-boot — dev server still initializing: Maven dependency cache warming per /tmp/pivota-dev-server.log; no port in meta)
routes_probed: 0 ok / 0 failed (app unreachable)
cookie: n/a (no server to probe)
per_test:
  - test: 1
    verdict: skipped (needs human)
    note: "App not yet running. Tests 1-11 require the running UI. Tests 12-15 are backend/test-suite checks that can be driven once the server starts."
  - test: 12
    verdict: skipped (needs human)
    note: "Backend dev server not yet running. Will need to probe once up."
  - test: 13
    verdict: skipped (needs human)
    note: "Maven IT cannot be run while server is warming cache."
  - test: 14
    verdict: skipped (needs human)
    note: "Maven IT cannot be run while server is warming cache."
  - test: 15
    verdict: skipped (needs human)
    note: "Vitest frontend test suite — can be run independently of dev server."

## Gaps

- truth: "LoginPage allows staff to authenticate with devadmin/admin123 credentials and reach /dashboard"
  status: failed
  reason: "User reported: Used the same credential but it says invalid credentials. Root cause: LoginPage calls POST /api/auth/ldap which returns 503 (no LDAP server in dev). The dev-login endpoint (POST /api/auth/dev-login) works correctly but is not wired into the LoginPage UI."
  severity: major
  test: 1
  source: user
  root_cause: "LoginPage.tsx hardcodes POST /api/auth/ldap; LDAP returns 503 in sandbox (no LDAP server). DevLoginController exists at /api/auth/dev-login and works, but LoginPage never calls it."
  artifacts:
    - path: "frontend/src/pages/LoginPage.tsx:35"
      issue: "fetch('/api/auth/ldap') — hardcoded; should use /api/auth/dev-login in dev mode"
    - path: "backend/src/main/java/com/ureport/auth/AuthController.java:55"
      issue: "LDAP disabled returns 503 (IllegalStateException catch) — not 401"
  missing:
    - "Wire LoginPage to POST /api/auth/dev-login in dev profile (e.g. env var VITE_AUTH_ENDPOINT or dual-mode form)"
  debug_session: ""

- truth: "Open311GoldenFileIT all 8 tests pass — four endpoints match golden fixture shapes"
  status: failed
  reason: "🤖 Auto-check: All 8 Open311GoldenFileIT tests fail with DataIntegrityViolationException: null value in column 'contact_person_id' of relation 'clients'. Test @BeforeEach fixture creates Client records without seeding a Person first."
  severity: major
  test: 13
  source: self_check
  root_cause: "Open311GoldenFileIT @BeforeEach inserts a Client entity but clients.contact_person_id is NOT NULL; no Person is seeded before the Client insert."
  artifacts:
    - path: "backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java"
      issue: "@BeforeEach missing Person seed before Client insert"
    - path: "backend/src/main/resources/db/migration"
      issue: "clients table has NOT NULL contact_person_id FK constraint"
  missing:
    - "Add Person seed (INSERT INTO people ...) in @BeforeEach before the Client insert, or make contact_person_id nullable"
  debug_session: ""

- truth: "ApplicationSmokeIT all 4 smoke tests pass (actuator health, Open311, LDAP rejection, ticket auth guard)"
  status: failed
  reason: "🤖 Auto-check: 2 of 4 smoke tests fail. (1) actuatorHealth_returnsUp → 503: DB health check failing in test context (datasource unhealthy or management config issue). (2) ldapAuth_withBadCredentials_returns401 → 503: AuthController returns 503 on IllegalStateException (LDAP disabled), but test expects 401."
  severity: major
  test: 14
  source: self_check
  root_cause: "Two separate issues: (a) Actuator health 503 in test context — likely DB component reports DOWN when using Zonky embedded DB without management config override; (b) LDAP disabled (ldap.enabled=false in application-test.yml) causes AuthController to throw IllegalStateException → 503, but the smoke test expects 401."
  artifacts:
    - path: "backend/src/main/java/com/ureport/auth/AuthController.java:55"
      issue: "catch (IllegalStateException e) → 503; smoke test expects 401 for bad creds when LDAP disabled"
    - path: "backend/src/test/resources/application-test.yml"
      issue: "ldap.enabled: false — causes LDAP endpoint to return 503, not 401"
    - path: "backend/src/test/java/com/ureport/smoke/ApplicationSmokeIT.java:46"
      issue: "actuatorHealth_returnsUp expects 200 but gets 503 — management health endpoint returns SERVICE_UNAVAILABLE in test profile"
  missing:
    - "Fix actuator health 503: add management.endpoint.health.show-details=always + ensure DB health shows UP (or disable DB health component in test profile)"
    - "Fix LDAP disabled 503→401: smoke test should expect 503 when ldap.enabled=false, OR the test should use a different endpoint (dev-login bad creds → 401)"
  debug_session: ""
