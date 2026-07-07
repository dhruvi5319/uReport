---
status: complete
phase: 02-authentication-security
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md]
started: 2026-07-07T00:44:13Z
updated: 2026-07-07T01:16:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Spring Boot starts and health endpoint responds
expected: Running start-dev.sh (or manually: cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev) starts the Spring Boot backend. GET /actuator/health returns {"status":"UP"} within ~60s. The log shows no "JAVA_HOME: unbound variable" crash and no "sudo: command not found" error.
result: pass

### 2. LDAP login endpoint is reachable
expected: POST /api/auth/ldap with JSON body {"username":"test","password":"test"} returns an HTTP response (400, 401, 503, or 200 — anything except connection refused / no response). The endpoint exists and the server handles the request.
result: pass

### 3. GET /api/auth/me requires auth
expected: GET /api/auth/me without an auth_token cookie returns 401 (not a 404 or 500). This confirms the JWT security filter is active on protected routes.
result: pass

### 4. Public routes accessible without auth
expected: GET /actuator/health is accessible without any auth_token cookie (returns 200, not 401). GET /open311/v2/services without a cookie returns 200 or 404 — not 401. Public routes are not blocked by the JWT filter.
result: pass

### 5. Admin-only route returns 403 for missing/invalid JWT
expected: DELETE /api/people/1 without an auth_token cookie returns 401 (no token) or 403 (wrong role). It should NOT return 200 or 500. This confirms admin-only route protection is in place.
result: pass

### 6. All 32 phase 2 tests pass
expected: Running `mvn test` in the backend/ directory completes with BUILD SUCCESS and shows 32 tests run (SecurityConfigTest: 5, CasAuthServiceTest: 5, AuthorizationIT: 22), 0 failures, 0 errors.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
