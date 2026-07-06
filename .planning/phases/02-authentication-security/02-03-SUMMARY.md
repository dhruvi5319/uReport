---
phase: 02-authentication-security
plan: 03
subsystem: auth
tags: [cas, sso, jwt, spring-security, xml-parsing, xxe-prevention]

# Dependency graph
requires:
  - phase: 02-01
    provides: JwtService.generateToken/validateToken, SecurityConfig route table, auth_token cookie pattern
provides:
  - CasAuthService: CAS service ticket validation via HTTP /serviceValidate + JWT issuance
  - CasAuthController: GET /auth/cas (CAS login redirect) + GET /auth/cas/callback (ticket → JWT cookie → /dashboard)
  - CasAuthService.CasAuthException: typed exception for CAS ticket failures
  - XXE-safe XML parsing of CAS serviceValidate responses
  - Auto-creation of Person with role=staff for new CAS users
affects: [02-04, 03-open311, 04-core-case-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CAS browser redirect flow: /auth/cas → CAS server login → /auth/cas/callback?ticket=
    - CAS service ticket validation: server-to-server HTTP GET to {casServer}/serviceValidate
    - XXE prevention in DocumentBuilderFactory (disallow-doctype-decl, external-general-entities=false)
    - Auto-create Person with role=staff on first CAS login (same pattern as LDAP auto-create in 02-02)
    - RestTemplate injected constructor for unit testability without Spring context

key-files:
  created:
    - backend/src/main/java/com/ureport/auth/CasAuthService.java
    - backend/src/main/java/com/ureport/auth/CasAuthController.java
    - backend/src/test/java/com/ureport/auth/CasAuthServiceTest.java
  modified: []

key-decisions:
  - "XXE prevention via DocumentBuilderFactory.setFeature() with disallow-doctype-decl + external entity features disabled — mitigates T-02-14"
  - "CasAuthService has two constructors: primary (production, creates RestTemplate) + secondary (testing, accepts injected RestTemplate) — enables pure unit testing without Spring context"
  - "Only hard-coded relative URIs in CasAuthController redirect targets (/dashboard, /login?error=cas) — prevents open redirect T-02-16"
  - "cas.enabled=false guard throws IllegalStateException → controller returns 503 SERVICE_UNAVAILABLE (plan spec: returns 503 when disabled)"

patterns-established:
  - "Pattern 1: CAS ticket validation via REST call to /serviceValidate with namespace-aware DOM parsing"
  - "Pattern 2: Auto-create Person with role=staff for external auth providers (CAS, LDAP) — admin role never auto-granted"

# Metrics
duration: 2min
completed: 2026-07-06
---

# Phase 2 Plan 3: CAS Authentication Summary

**CAS SSO browser redirect flow with service ticket validation via /serviceValidate HTTP call, namespace-aware XXE-safe XML parsing, and JWT cookie issuance — 5 unit tests passing**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-06T23:39:16Z
- **Completed:** 2026-07-06T23:41:16Z
- **Tasks:** 2 completed
- **Files modified:** 3

## Accomplishments
- CasAuthService: validates CAS service tickets via server-to-server HTTP call to `{casServer}/serviceValidate`, parses namespace-aware CAS XML (success/failure), auto-creates Person with role=staff for new CAS users, issues JWT via JwtService
- CasAuthController: GET /auth/cas (302 → CAS login with encoded service URL), GET /auth/cas/callback (ticket → JWT cookie → /dashboard or /login?error=cas)
- XXE prevention: `disallow-doctype-decl=true`, `external-general-entities=false`, `external-parameter-entities=false` in DocumentBuilderFactory
- All 5 CasAuthServiceTest unit tests pass (valid ticket → JWT, invalid ticket → exception, CAS disabled → 503, new user auto-created, buildCasLoginUrl URL format)

## Task Commits

Each task was committed atomically:

1. **Task 1: CasAuthService — ticket validation via /serviceValidate HTTP call + JWT issuance** - `d68ebfd` (feat)
2. **Task 2: CasAuthController (GET /auth/cas, GET /auth/cas/callback) + unit tests** - `90350c5` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `backend/src/main/java/com/ureport/auth/CasAuthService.java` - CAS ticket validation, XML parsing, JWT issuance, XXE prevention
- `backend/src/main/java/com/ureport/auth/CasAuthController.java` - GET /auth/cas redirect, GET /auth/cas/callback with cookie + redirect
- `backend/src/test/java/com/ureport/auth/CasAuthServiceTest.java` - 5 unit tests with mocked RestTemplate/PersonRepository/JwtService

## Decisions Made
- Used dual constructor pattern (primary + RestTemplate-injecting) for testability without Spring context load
- Only hard-coded relative URIs for redirect targets in controller — no user-controlled redirect possible (mitigates T-02-16 open redirect)
- XXE prevention matches plan threat model T-02-14 exactly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CAS authentication complete: CasAuthService + CasAuthController + unit tests
- Combined with 02-02 (LDAP), all authentication mechanisms are now implemented
- Ready for 02-04: Route-level authorization enforcement (AUTH-02)
- SecurityConfig in 02-01 already has route authorization table — 02-04 adds integration tests validating enforcement

## Self-Check: PASSED

- ✅ `backend/src/main/java/com/ureport/auth/CasAuthService.java` — exists
- ✅ `backend/src/main/java/com/ureport/auth/CasAuthController.java` — exists
- ✅ `backend/src/test/java/com/ureport/auth/CasAuthServiceTest.java` — exists
- ✅ Commit `d68ebfd` — feat(02-03): Task 1 (CasAuthService)
- ✅ Commit `90350c5` — feat(02-03): Task 2 (CasAuthController + tests)
- ✅ 5/5 CasAuthServiceTest tests pass (BUILD SUCCESS)

---
*Phase: 02-authentication-security*
*Completed: 2026-07-06*
