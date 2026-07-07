---
status: diagnosed
phase: 02-authentication-security
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md]
started: 2026-07-07T00:44:13Z
updated: 2026-07-07T00:48:00Z
---

## Current Test

[testing complete]

## Tests

### 1. LDAP Login returns JWT cookie
expected: POST /api/auth/ldap with valid LDAP credentials returns HTTP 200 and sets an httpOnly auth_token cookie containing a valid JWT. Invalid credentials return 401.
result: issue
reported: "dev server log shows: sudo: command not found; then JAVA_HOME: unbound variable — start-dev.sh crashes before the app starts"
severity: blocker

### 2. GET /api/auth/me returns user info
expected: With a valid auth_token cookie, GET /api/auth/me returns 200 with JSON containing personId, username, role, firstname, lastname, and expiresAt (ISO 8601 UTC). Without a cookie, returns 401.
result: skipped
reason: Dev server not running — blocked by Test 1 startup failure

### 3. Token refresh and logout
expected: POST /api/auth/refresh with a valid JWT cookie issues a new JWT cookie (HTTP 200). POST /api/auth/logout clears the auth_token cookie and returns 200.
result: skipped
reason: Dev server not running — blocked by Test 1 startup failure

### 4. CAS redirect initiates SSO flow
expected: GET /auth/cas returns a 302 redirect to the CAS server login URL with a properly encoded service= parameter pointing back to /auth/cas/callback.
result: skipped
reason: Dev server not running — blocked by Test 1 startup failure

### 5. Protected routes block unauthenticated requests
expected: Accessing a staff-protected endpoint (e.g., POST /api/tickets) without an auth_token cookie returns 401 JSON (not an HTML redirect). The JSON body should indicate unauthorized.
result: skipped
reason: Dev server not running — blocked by Test 1 startup failure

### 6. Admin-only routes enforce role
expected: A request authenticated with a staff-role JWT to an admin-only endpoint (e.g., DELETE /api/people/{id}) returns 403 Forbidden. An admin-role JWT on the same endpoint succeeds (or returns 404/405 if not yet implemented).
result: skipped
reason: Dev server not running — blocked by Test 1 startup failure

### 7. Public routes accessible without auth
expected: GET /actuator/health and GET /open311/v2/services (even if not yet implemented, should not return 401 — should return 404 or 200) are accessible without any auth_token cookie.
result: skipped
reason: Dev server not running — blocked by Test 1 startup failure

### 8. Role hierarchy: admin can access staff routes
expected: A JWT with role=admin can access staff-protected endpoints (demonstrating ROLE_ADMIN > ROLE_STAFF hierarchy) — returns 200/404/405 rather than 403.
result: skipped
reason: Dev server not running — blocked by Test 1 startup failure

### 9. All 32 phase 2 tests pass
expected: Running `mvn test` in the backend/ directory completes with BUILD SUCCESS and shows 32 tests run (SecurityConfigTest: 5, CasAuthServiceTest: 5, AuthorizationIT: 22), 0 failures, 0 errors.
result: skipped
reason: Deferring until dev server startup is fixed; mvn test can be run separately

## Summary

total: 9
passed: 0
issues: 1
pending: 0
skipped: 8

## Gaps

- truth: "Dev server starts successfully so the Spring Boot backend is reachable for testing"
  status: failed
  reason: "User reported: dev server log shows: sudo: command not found; then JAVA_HOME: unbound variable — start-dev.sh crashes before the app starts"
  severity: blocker
  test: 1
  root_cause: "Sandbox runs as root (uid=0) — sudo is not installed. The JDK install snippet used sudo apt-get, which exits non-zero immediately. Because the install command was chained with &&, the subsequent JAVA_HOME= assignment never ran, leaving JAVA_HOME unset. The next line `export PATH=${JAVA_HOME}/bin:$PATH` then triggered bash `set -u` unbound variable abort."
  artifacts:
    - path: ".pivota/start-dev.sh"
      issue: "sudo apt-get used in JDK install block; JAVA_HOME referenced unconditionally after potentially-failed install"
  missing:
    - "Replace sudo apt-get with direct apt-get (root has direct access)"
    - "Guard JAVA_HOME/PATH export behind a successful java install check"
  debug_session: ""
