---
status: complete
phase: 09-admin-panels-and-integration
source: [09-01-SUMMARY.md, 09-02-SUMMARY.md, 09-03-SUMMARY.md]
started: 2026-07-09T20:33:57Z
updated: 2026-07-09T21:04:30Z
---

## Current Test

[testing complete]

## Tests

### 1. Login Page Renders with CAS + LDAP Options
expected: Navigate to /login. You should see a branded city card layout with a CAS SSO button and an LDAP form (username + password fields). The page should be centered and styled.
result: pass

### 2. LDAP Login Shows Spinner and Error State
expected: On the login page, enter any username and password and click Submit. During submission, the button should show a loading spinner and be disabled. After rejection, a red error message should appear (e.g., "Invalid credentials" or similar).
result: pass

### 3. Admin Guard Redirects Non-Admin
expected: While logged in as a staff (non-admin) user, navigate to /admin/people. You should be redirected to /dashboard instead of seeing the admin panel.
result: skipped
reason: Dev mock user is admin role, can't easily test non-admin redirect in current dev setup

### 4. People Admin Panel (CRUD)
expected: As an admin user, navigate to /admin/people. You should see a table of people with search toolbar and skeleton loading while data fetches. Clicking a row or "+ New" opens a right-side Sheet (40% width) for creating/editing. Deleting shows an AlertDialog confirmation. Toast notifications appear on success/error.
result: issue
reported: "I am not able to add new people, I fill in details but firstly Department dropdown has nothing to select from. I tried creating department as well but it was not getting created either"
severity: major

### 5. Departments Admin Panel
expected: Navigate to /admin/departments. A table of departments loads. Creating or editing a department in the Sheet should allow searching for a person (combobox) as the default assignee and selecting associated actions. Saving shows a success toast.
result: issue
reported: "I am not able to save department, and I do not have any default person to add to that department"
severity: major

### 6. Categories Admin Panel (Accordion)
expected: Navigate to /admin/categories. Category groups appear as an accordion. Clicking the expand toggle opens the group to show nested category rows. The expand toggle and the Edit/Delete action buttons are separate elements (not nested interactives). Categories show posting permission level and active status.
result: issue
reported: "I do not see any accordion, I see two buttons 'New Category Group' 'New Category', and I am not able to save either of this as well. I fill all the fields I can enter but I cannot save it"
severity: major

### 7. Open311 API Clients Panel (API Key Once)
expected: Navigate to /admin/clients. Creating a new API client shows the generated API key exactly once with a copy button and a warning banner saying it won't be shown again. On subsequent page loads, the API key is masked/hidden.
result: issue
reported: "I am not sure what you want to test about API, but I am not able to save new client, only name is required field but I have filled all the fields yet cannot save it"
severity: major

### 8. Substatus Panel with Default Star
expected: Navigate to /admin/substatus. The default substatus has a star icon. Deleting the default substatus should show a warning. Non-default entries allow normal delete.
result: issue
reported: "Cannot save it, so not able to test it"
severity: major

### 9. Issue Types and Contact Methods Inline Editing
expected: Navigate to /admin/issue-types (and /admin/contact-methods). Clicking a row enables inline editing directly in the table row. Seeded system records (IDs 1-6 for issue types, 1-4 for contact methods) show a Lock icon with a tooltip and have the Delete button disabled.
result: issue
reported: "I don't see any seeded data and cannot save new issue type as well"
severity: major

### 10. Actions Panel (Department vs System)
expected: Navigate to /admin/actions. The "+ New Department Action" button creates DEPARTMENT-type actions only. SYSTEM-type actions open as read-only in the Sheet. The Delete button does not appear for SYSTEM-type actions.
result: issue
reported: "Cannot save it. This issue now lies across all pages, please fix it"
severity: major

### 11. Command Palette Search (Cmd+K)
expected: Press Cmd+K (or Ctrl+K) from any authenticated screen. A search dialog opens. Type at least 2 characters and after 300ms, live results appear showing ticket ID (monospace), category name, and status badge. Clicking a result navigates to /cases/{id}.
result: skipped

### 12. Save Search / Saved Searches Bookmark
expected: On the Case List page (/cases), apply a filter or search. The "Save Search" button becomes active. Clicking it opens a dialog to name and save the search. A "Saved Searches" dropdown recalls previously saved searches — clicking one restores the filter state via the URL.
result: issue
reported: "not able to save any search"
severity: major

### 13. Open311 Services Endpoint
expected: The backend returns a list of service categories from GET /open311/v2/services (JSON format). The response contains service_code, service_name, description, type, group fields. XML format should also be returned when format=xml is added to the URL.
result: issue
reported: "https://5173-z7elxdtdvijearvx.daytonaproxy01.net/open311/2/services: I use this url and it says refused to connect"
severity: minor

### 14. Dockerfile Verification Script
expected: Run `bash scripts/verify-dockerfiles.sh` from the project root. The script should exit 0 and print passing checks for both backend/Dockerfile and frontend/Dockerfile structural instructions (FROM, COPY, RUN, EXPOSE, etc.).
result: pass
reason: Auto-check confirmed script exits 0 with all checks passing; user confirmed no additional concerns

### 15. Axe Accessibility (0 Critical/Serious Violations)
expected: The admin pages (PeoplePage, DepartmentsPage, CategoriesPage) and core screens (LoginPage, CaseListPage) pass WCAG 2.1 AA axe-core scans with 0 critical or serious violations. This can be confirmed by running `npm test -- --testPathPattern=accessibility-suite` in the frontend directory.
result: pass
reason: Auto-check: npx vitest run accessibility-suite → 5 tests passed, 0 critical/serious violations found

## Summary

total: 15
passed: 4
issues: 9
pending: 0
skipped: 2
skipped: 0

## Self-Check

boot: frontend=200 (5173) backend=401→UP (8080/actuator/health={"status":"UP"})
routes_probed: 6 ok / 0 failed (advisory: LDAP 503 is expected — ldap.enabled=false in dev profile per application-dev.yml)
cookie: n/a (no successful login to produce session cookie)
per_test:
  - test: 1
    verdict: pass (provisional)
    note: "🤖 Auto-check: GET http://127.0.0.1:5173/login → 200 OK. Login page route exists and is served."
  - test: 2
    verdict: advisory
    note: "🤖 Auto-check: POST /api/auth/ldap → 503. This is EXPECTED — ldap.enabled=false in application-dev.yml. The LoginPage LDAP form will show an error state; spinner behavior needs human confirmation."
  - test: 13
    verdict: pass (provisional)
    note: "🤖 Auto-check: GET /open311/v2/services → 200 with valid JSON array containing service_code, service_name, description, type, group fields. Response shape confirmed."

## Gaps

- truth: "Admin can create a new person with a department assignment via /admin/people"
  status: failed
  reason: "User reported: I am not able to add new people, I fill in details but firstly Department dropdown has nothing to select from. I tried creating department as well but it was not getting created either"
  severity: major
  test: 4
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Admin can create a department with a default assignee person via /admin/departments"
  status: failed
  reason: "User reported: I am not able to save department, and I do not have any default person to add to that department"
  severity: major
  test: 5
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Admin can view category groups in an accordion and create new category groups and categories via /admin/categories"
  status: failed
  reason: "User reported: I do not see any accordion, I see two buttons 'New Category Group' 'New Category', and I am not able to save either of this as well. I fill all the fields I can enter but I cannot save it"
  severity: major
  test: 6
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Admin can create a new API client via /admin/clients and the generated API key is shown once"
  status: failed
  reason: "User reported: I am not able to save new client, only name is required field but I have filled all the fields yet cannot save it"
  severity: major
  test: 7
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Admin can create/edit substatus entries via /admin/substatus; default substatus has star icon"
  status: failed
  reason: "User reported: Cannot save it, so not able to test it"
  severity: major
  test: 8
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Seeded issue types (IDs 1-6) are visible with Lock icons, and new issue types can be created via /admin/issue-types"
  status: failed
  reason: "User reported: I don't see any seeded data and cannot save new issue type as well"
  severity: major
  test: 9
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Admin can create department actions and system actions are read-only via /admin/actions"
  status: failed
  reason: "User reported: Cannot save it. This issue now lies across all pages, please fix it"
  severity: major
  test: 10
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "User can save a search as a bookmark from the Case List page and recall it from the Saved Searches dropdown"
  status: failed
  reason: "User reported: not able to save any search"
  severity: major
  test: 12
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Open311 services endpoint returns correct GeoReport v2 JSON and XML via /open311/v2/services"
  status: failed
  reason: "User reported: accessed /open311/2/services (missing 'v') via external preview URL and got refused to connect. Auto-check confirmed /open311/v2/services → 200 locally. May be URL typo or external proxy routing issue."
  severity: minor
  test: 13
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
