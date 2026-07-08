---
phase: 06-search-geo-and-metrics-backend
plan: GAP-01
subsystem: api
tags: [postgresql, geo-clustering, metrics, spring-security, jdbc, exception-handler]

# Dependency graph
requires:
  - phase: 06-search-geo-and-metrics-backend
    provides: GeoclusterRepository, MetricsService, GlobalExceptionHandler, BookmarkController

provides:
  - Fixed GeoclusterRepository — GROUP BY POINT resolved using MIN(CAST(g.center AS TEXT)) aggregate
  - Fixed MetricsService — NUMERIC→Double conversion via CAST(... AS DOUBLE PRECISION)
  - Fixed GlobalExceptionHandler — ResponseStatusException handler preserves 403/400 status codes

affects: [06-search-geo-and-metrics-backend, phase-7-frontend]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Aggregate POINT text: MIN(CAST(g.center AS TEXT)) avoids GROUP BY on non-equality POINT type"
    - "JDBC type cast: CAST(AVG(...) AS DOUBLE PRECISION) ensures Double.class readability"
    - "Spring exception priority: @ExceptionHandler(ResponseStatusException.class) intercepts before ExceptionTranslationFilter"

key-files:
  created: []
  modified:
    - backend/src/main/java/com/ureport/repository/GeoclusterRepository.java
    - backend/src/main/java/com/ureport/geo/service/GeoclusterService.java
    - backend/src/main/java/com/ureport/metrics/service/MetricsService.java
    - backend/src/main/java/com/ureport/crm/exception/GlobalExceptionHandler.java

key-decisions:
  - "MIN(CAST(g.center AS TEXT)) AS center_text used instead of two separate lon/lat CAST+split_part — aggregate function makes POINT valid in SELECT without GROUP BY"
  - "CAST(AVG(...) AS DOUBLE PRECISION) wraps numeric aggregate so JDBC rs.getObject(String, Double.class) works"
  - "@ExceptionHandler(ResponseStatusException.class) added to GlobalExceptionHandler to intercept before Spring Security ExceptionTranslationFilter re-maps to 401"

patterns-established:
  - "GeoclusterService center_text parsing: String.replace + split to extract lon/lat from (x,y) POINT text representation"

# Metrics
duration: 7min
completed: 2026-07-08
---

# Phase 6 Plan GAP-01: Gap Closure Summary

**Fixed 4 UAT gaps: PostgreSQL GROUP BY POINT error, NUMERIC→Double JDBC conversion, and 401 vs 403 status code for ResponseStatusException — all 9 DashboardMetricsIT and 8 SearchIT tests now pass**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-08T17:07:17Z
- **Completed:** 2026-07-08T17:15:12Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Fixed all 7 `findClusters{N}` queries in GeoclusterRepository — removed `g.center` from GROUP BY (POINT has no equality operator), replaced two lon/lat CAST columns with single `MIN(CAST(g.center AS TEXT)) AS center_text` aggregate
- Updated GeoclusterService row mapper to parse lon/lat from `center_text` String `(x,y)` format instead of reading Number from row[3]/row[4]
- Fixed all 3 switch cases in `MetricsService.buildReportSql` — wrapped `AVG(...)` in `CAST(... AS DOUBLE PRECISION)` to resolve PSQLException on NUMERIC→Double conversion
- Added `@ExceptionHandler(ResponseStatusException.class)` to GlobalExceptionHandler — intercepts before Spring Security ExceptionTranslationFilter re-maps status to 401, preserving original 403/400

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix GeoclusterRepository GROUP BY POINT and update GeoclusterService row mapping** - `f56e84d` (fix)
2. **Task 2: Fix MetricsService NUMERIC→Double and add ResponseStatusException handler** - `704aa49` (fix)
3. **Task 3: Run full integration test suite** — no new files (verification only; tests run via `docker --privileged maven:3.9-eclipse-temurin-21-alpine mvn verify`)

**Plan metadata:** (pending) (docs: complete plan)

## Files Created/Modified

- `backend/src/main/java/com/ureport/repository/GeoclusterRepository.java` — All 7 findClusters{N} queries updated: g.center removed from GROUP BY, two lon/lat CAST columns replaced with MIN(CAST(g.center AS TEXT)) AS center_text
- `backend/src/main/java/com/ureport/geo/service/GeoclusterService.java` — Row mapper updated: reads center_text (String) from row[3], parses lon/lat via String split
- `backend/src/main/java/com/ureport/metrics/service/MetricsService.java` — CAST(AVG(...) AS DOUBLE PRECISION) added to all 3 buildReportSql switch cases (category, department, assignee)
- `backend/src/main/java/com/ureport/crm/exception/GlobalExceptionHandler.java` — @ExceptionHandler(ResponseStatusException.class) added with handleResponseStatus() method

## Decisions Made

- **MIN(CAST aggregate)**: PostgreSQL POINT type has no equality operator, so GROUP BY on `g.center` fails. `MIN(CAST(g.center AS TEXT))` is valid as an aggregate — all points in the same cluster have the same center, so MIN is deterministic and correct.
- **CAST AS DOUBLE PRECISION**: PostgreSQL `AVG()` on a numeric expression returns `numeric` type. JDBC's `rs.getObject(col, Double.class)` throws `PSQLException: conversion to Double from numeric not supported`. Adding `CAST(... AS DOUBLE PRECISION)` tells PostgreSQL to return `float8` which maps directly to `Double`.
- **@ExceptionHandler ordering**: Spring MVC's `@RestControllerAdvice` intercepts exceptions before `ExceptionTranslationFilter` in the security filter chain runs during error dispatch. This ensures the handler's status code (from `ex.getStatusCode()`) is used, not the 401 that ExceptionTranslationFilter would assign.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

The only deviation was execution environment: Maven was not available natively (no JVM installed in Daytona sandbox). Tests were run via `docker run --privileged maven:3.9-eclipse-temurin-21-alpine mvn verify` as a workaround. This is a `[Rule 3 - Blocking]` deviation handled automatically:
- **Found during:** Task 3 (run integration tests)
- **Issue:** `mvn: command not found` — no Java/Maven installed natively in Daytona sandbox
- **Fix:** Used Maven Docker image with `--privileged` flag (required for Zonky embedded PostgreSQL's `initdb` process)
- **Verification:** All 17 tests pass (9 DashboardMetricsIT + 8 SearchIT), BUILD SUCCESS
- **Impact:** No code changes needed; build infrastructure only

---

**Total deviations:** 1 auto-handled (Rule 3 - Blocking: Maven not available natively)
**Impact on plan:** No scope creep; test execution fully verified via Docker Maven.

## Issues Encountered

None — all 4 gaps closed, all 17 integration tests pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 6 UAT gaps closed: DashboardMetricsIT 9/9, SearchIT 8/8
- `GET /api/geoclusters?zoom=3` returns HTTP 200 with clusters array (was HTTP 500)
- `GET /api/reports?groupBy=category` returns HTTP 200 with JSON array (was HTTP 500)
- `GET /api/reports/export?groupBy=category` returns HTTP 200 with Content-Disposition attachment (was HTTP 500)
- `DELETE /api/bookmarks/{other_user_id}` returns HTTP 403 (was 401)
- Phase 6 is complete and ready for transition to Phase 7 (Frontend)

## Self-Check: PASSED

- ✅ `GeoclusterRepository.java` — exists, contains `center_text` in all 7 SELECT queries
- ✅ `GeoclusterService.java` — exists, parses `centerText` from `row[3]` as String
- ✅ `MetricsService.java` — exists, contains `DOUBLE PRECISION` in all 3 switch cases
- ✅ `GlobalExceptionHandler.java` — exists, contains `ResponseStatusException` handler
- ✅ `06-GAP-01-SUMMARY.md` — this file
- ✅ Commit `f56e84d` — Task 1 fix in git history
- ✅ Commit `704aa49` — Task 2 fix in git history
- ✅ Contract verify: `center_text` present in GeoclusterRepository
- ✅ Contract verify: `DOUBLE PRECISION` present in MetricsService
- ✅ Contract verify: `ResponseStatusException` present in GlobalExceptionHandler

---
*Phase: 06-search-geo-and-metrics-backend*
*Completed: 2026-07-08*
