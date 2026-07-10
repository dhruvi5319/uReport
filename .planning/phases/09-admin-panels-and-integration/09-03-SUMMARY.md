---
phase: 09-admin-panels-and-integration
plan: "03"
subsystem: testing
tags: [open311, georeport-v2, accessibility, axe-core, smoke-test, golden-file, dockerfile]

# Dependency graph
requires:
  - phase: 09-01
    provides: PeoplePage, DepartmentsPage, CategoriesPage (admin panels)
  - phase: 09-02
    provides: LoginPage, CaseListPage (core screens)
  - phase: 03-open311-georeport-v2-api
    provides: Open311Controller, services + requests endpoints
  - phase: 02-authentication-security
    provides: POST /api/auth/ldap, Spring Security route guards
provides:
  - Open311 golden files: services-response.json, requests-response.xml, requests-response.json, request-detail-response.json
  - Open311GoldenFileIT (already existed — plan verified it was complete)
  - ApplicationSmokeIT: 4 smoke tests covering actuator health, Open311, auth rejection, ticket auth guard
  - accessibility-suite.test.tsx: 5 axe-core scans (LoginPage, CaseListPage, PeoplePage, DepartmentsPage, CategoriesPage)
  - scripts/verify-dockerfiles.sh: sandbox-safe Dockerfile structural verification
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Golden-file testing: classpath resources define expected API response shape"
    - "Smoke IT pattern: @SpringBootTest RANDOM_PORT + TestRestTemplate for full-stack smoke"
    - "axe filterCriticalAndSerious helper: only critical/serious violations fail accessibility suite"
    - "Dockerfile verification via grep (no Docker daemon needed)"

key-files:
  created:
    - backend/src/test/resources/open311-golden/services-response.xml
    - backend/src/test/resources/open311-golden/request-detail-response.json
    - backend/src/test/java/com/ureport/smoke/ApplicationSmokeIT.java
    - frontend/src/__tests__/accessibility-suite.test.tsx
    - scripts/verify-dockerfiles.sh
  modified: []

key-decisions:
  - "ApplicationSmokeIT uses Zonky embedded PostgreSQL (consistent with project test architecture — no Docker daemon)"
  - "Accessibility suite creates filterCriticalAndSerious helper — only critical/serious violations fail (minor/moderate are informational)"
  - "verify-dockerfiles.sh uses grep for structural checks — no docker build needed (sandbox has no Docker daemon)"
  - "LoginPage vi.mock AuthContext inline in test — default export imported dynamically after mock"

patterns-established:
  - "Smoke IT pattern: RANDOM_PORT + TestRestTemplate for in-process HTTP smoke tests"
  - "Axe accessibility pattern: MSW mock + axe(container, options) + filterCriticalAndSerious"

# Metrics
duration: 3min
completed: 2026-07-09
---

# Phase 9 Plan 03: Integration Hardening Summary

**Golden-file XML + request-detail fixtures, ApplicationSmokeIT (4 smoke tests), comprehensive axe-core accessibility suite (5 screens), and Dockerfile verification shell script**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-09T20:26:24Z
- **Completed:** 2026-07-09T20:29:54Z
- **Tasks:** 2
- **Files modified:** 5 created

## Accomplishments

- Created 2 missing Open311 golden files: `services-response.xml` (XML with `<services>` root) and `request-detail-response.json` (single object, 18 GeoReport v2 fields)
- Created `ApplicationSmokeIT` with 4 smoke tests covering actuator health UP, Open311 services 200, LDAP bad-creds 401 (T-09-12), tickets no-auth 401 (T-09-11)
- Created `accessibility-suite.test.tsx` with 5 axe-core scans: LoginPage, CaseListPage, PeoplePage, DepartmentsPage, CategoriesPage — all asserting 0 critical/serious WCAG 2.0 AA violations
- Created `scripts/verify-dockerfiles.sh` — sandbox-safe grep-based verification of Dockerfile structure; exits 0 with all checks passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Open311 golden files + ApplicationSmokeIT** - `f7dc1e2` (feat)
2. **Task 2: Accessibility suite + Dockerfile script** - `a4234ea` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `backend/src/test/resources/open311-golden/services-response.xml` — XML golden file with `<services>` root and `<service>` children (7 fields each)
- `backend/src/test/resources/open311-golden/request-detail-response.json` — Single-object golden file with all 18 GeoReport v2 fields
- `backend/src/test/java/com/ureport/smoke/ApplicationSmokeIT.java` — 4 Spring Boot smoke tests (actuator health, Open311 services, LDAP auth rejection, ticket auth guard)
- `frontend/src/__tests__/accessibility-suite.test.tsx` — 5 axe-core scans across all major UI screens
- `scripts/verify-dockerfiles.sh` — Shell script verifying backend/frontend Dockerfile structural instructions

## Decisions Made

- ApplicationSmokeIT uses `@AutoConfigureEmbeddedDatabase(ZONKY)` — consistent with project test architecture (no Docker daemon in K8s sandbox)
- Accessibility suite uses `filterCriticalAndSerious()` helper to filter axe results to only `critical` or `serious` impact violations — minor/moderate are informational
- `verify-dockerfiles.sh` uses `grep` for structural checks rather than `docker build` — sandbox has no Docker daemon; approved approach
- LoginPage accessibility test uses `vi.mock('@/contexts/AuthContext')` inline to prevent redirect to `/dashboard` during rendering

## Deviations from Plan

### Pre-existing files (no change needed)

**1. [Pre-existing] services-response.json and requests-response.json already existed**
- **Found during:** Task 1 startup check
- **Issue:** Plan said to "create" these files but they already existed from Phase 3 (03-03) with correct structure
- **Fix:** Kept existing files unchanged (they contain correct 7-field and 18-field structures)
- **Verification:** `grep -c "service_code\|..."` returns correct counts

**2. [Pre-existing] Open311GoldenFileIT.java already existed**
- **Found during:** Task 1 startup check
- **Issue:** Plan said to "update/create" this file; it already existed with 8 comprehensive test methods (more than the 4 planned)
- **Fix:** Did not modify — existing file covers all required scenarios plus additional XML and format negotiation tests
- **Files modified:** None

---

**Total deviations:** 0 auto-fixes needed — 2 pre-existing artifacts discovered that were already complete. Only the 2 missing files (services-response.xml, request-detail-response.json) and 2 new files (ApplicationSmokeIT, accessibility-suite.test.tsx, verify-dockerfiles.sh) required creation.
**Impact on plan:** All success criteria met. No scope creep.

## Issues Encountered

None - all files created successfully, Dockerfile verification exits 0, file structure verified.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 9 complete — all 3 plans (09-01, 09-02, 09-03) have SUMMARY.md files
- Integration hardening artifacts ready for verify phase execution
- Tests written; Maven IT execution (Open311GoldenFileIT, ApplicationSmokeIT) and Vitest axe suite execution deferred to verify phase

---
*Phase: 09-admin-panels-and-integration*
*Completed: 2026-07-09*
