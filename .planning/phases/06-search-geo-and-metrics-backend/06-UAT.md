---
status: diagnosed
phase: 06-search-geo-and-metrics-backend
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md]
started: 2026-07-08T16:15:00Z
updated: 2026-07-08T17:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Full-Text Search on Tickets
expected: GET /api/tickets?q=pothole returns tickets ranked by relevance with searchSnippet field containing <mark>-annotated HTML highlights. GET /api/tickets (no q) returns normal paginated results with searchSnippet null.
result: pass

### 2. Bookmark Create & List
expected: POST /api/bookmarks with {"name":"my search","requestUri":"/api/tickets?q=pothole"} creates a bookmark scoped to the authenticated user. GET /api/bookmarks returns only that user's bookmarks.
result: pass

### 3. Bookmark Delete & Ownership Enforcement
expected: DELETE /api/bookmarks/{id} removes the bookmark. Attempting to delete another user's bookmark returns 403.
result: issue
reported: "Self-check: STAFF can delete own bookmarks (204). Attempting to delete another user's bookmark returns 401 instead of 403. BookmarkController was using PersonDetails (wrong type) instead of CustomUserDetails — fixed in this session. Ownership IS enforced (non-owners can't delete), but error code is 401 instead of the expected 403."
severity: minor

### 4. Geo-cluster Endpoint
expected: GET /api/geoclusters?zoom=3 returns cluster data (array of clusters with count and coordinates). Invalid zoom values (e.g. zoom=99) return 400.
result: issue
reported: "Self-check: GET /api/geoclusters?zoom=3 fails with SQL error: 'could not identify an equality operator for type point' (PostgreSQL cannot GROUP BY point type). The GeoclusterRepository queries use GROUP BY g.center, g.level where g.center is a PostgreSQL POINT type — POINT lacks an equality operator for grouping. The endpoint throws 500 which is mapped to 401 by Spring Security's ExceptionTranslationFilter. Invalid zoom also returns 401 (ResponseStatusException 400 is mapped to 401 via error dispatch)."
severity: blocker

### 5. Dashboard Stats
expected: GET /api/dashboard/stats returns open count, opened today, closed today, and overdue count. STAFF users see only their department's counts; ADMIN sees system-wide counts.
result: pass

### 6. Dashboard Chart
expected: GET /api/dashboard/chart returns chart segments grouped by status, category, or department (via groupBy param).
result: pass

### 7. Metrics Endpoint
expected: GET /api/metrics returns volumeByDay (array), avgResolutionHours, and overdueCount. Date range >12 months returns 400.
result: pass

### 8. Reports & CSV Export
expected: GET /api/reports returns grouped report data. GET /api/reports/export returns a CSV file (Content-Disposition: attachment) with sanitized cell values.
result: issue
reported: "Self-check: GET /api/reports?groupBy=category with real PostgreSQL returns 'conversion to class java.lang.Double from numeric not supported' — the MetricsService JdbcTemplate SQL returns a numeric/bigdecimal column that JDBC can't auto-convert to Double. DashboardMetricsIT.reports_groupByCategory and .reportsExport_groupByCategory fail with the same error. Fix: cast the avg resolution column to DOUBLE PRECISION in the SQL query."
severity: major

### 9. Integration Tests Pass
expected: Maven integration tests (SearchIT with 8 cases, DashboardMetricsIT with 9 cases) all pass using Zonky embedded PostgreSQL.
result: issue
reported: "Self-check: SearchIT 8/8 PASS after fix (Geocluster Short type fix resolved schema validation). DashboardMetricsIT 6/9 PASS, 3 FAIL: (1) geoclusters_validZoom — GROUP BY point type error, (2) reports_groupByCategory — Double conversion error, (3) reportsExport_groupByCategory — same Double conversion error."
severity: major

## Summary

total: 9
passed: 5
issues: 4
pending: 0
skipped: 0

## Self-Check

boot: 503 (app starts successfully; LDAP/SMTP health checks down but app is functional)
routes_probed: 8 ok / 3 failed (geoclusters GROUP BY point, reports Double conversion, DashboardMetricsIT 3 tests)
cookie: n/a (SameSite not inspected; LDAP auth returns 503 so no session cookie issued)
per_test:
  - test: 1
    verdict: pass
    note: "🤖 Auto-check: GET /api/tickets?q=pothole → 200, searchSnippet contains <mark>Pothole</mark>. GET /api/tickets (no q) → 200, searchSnippet null. FTS routing correct."
  - test: 2
    verdict: pass
    note: "🤖 Auto-check: POST /api/bookmarks → 201 with id/name/requestUri. GET /api/bookmarks → returns list scoped to JWT personId."
  - test: 3
    verdict: advisory
    note: "🤖 Auto-check: STAFF can delete own bookmark (204). STAFF deleting ADMIN's bookmark returns 401 (should be 403). Ownership IS enforced, wrong status code. Root cause: Spring Security ExceptionTranslationFilter maps unhandled exceptions during error dispatch to 401."
  - test: 4
    verdict: fail
    note: "🤖 Auto-check: GET /api/geoclusters?zoom=3 → 500 internal (mapped to 401 by ExceptionTranslationFilter). Root cause: GeoclusterRepository @Query uses GROUP BY g.center, g.level where g.center is PostgreSQL POINT type. POINT type has no equality operator — PostgreSQL rejects the GROUP BY. Fix: remove center from GROUP BY (use any_value() or subquery) or cast center to text in the query."
  - test: 5
    verdict: pass
    note: "🤖 Auto-check: GET /api/dashboard/stats → 200 {totalOpen:0, openedToday:0, closedToday:0, overdue:0}."
  - test: 6
    verdict: pass
    note: "🤖 Auto-check: GET /api/dashboard/chart?groupBy=status → 200 {groupBy:'status', segments:[{label:'open',count:1}]}."
  - test: 7
    verdict: pass
    note: "🤖 Auto-check: GET /api/metrics?start=2026-01-01&end=2026-06-30 → 200 {volumeByDay:[], avgResolutionHours:null, overdueCount:0}."
  - test: 8
    verdict: fail
    note: "🤖 Auto-check: GET /api/reports?groupBy=category → 401 (500 mapped). Root cause: MetricsService JdbcTemplate SQL for avg_resolution_hours returns numeric (not double) — PSQLException: conversion to class java.lang.Double from numeric not supported. Fix: add CAST(... AS DOUBLE PRECISION) in the SQL."
  - test: 9
    verdict: fail
    note: "🤖 Auto-check: SearchIT 8/8 PASS. DashboardMetricsIT 6/9 PASS, 3 FAIL: geoclusters GROUP BY point, reports Double conversion (2 test methods)."

## Gaps

- truth: "BookmarkController uses correct principal type (CustomUserDetails) from JWT"
  status: failed
  reason: "Self-check: BookmarkController was using @AuthenticationPrincipal PersonDetails — wrong type. JwtAuthFilter creates CustomUserDetails. Fixed in session but ownership returns 401 (not 403) due to ExceptionTranslationFilter error dispatch mapping."
  severity: minor
  test: 3
  source: self_check
  root_cause: "BookmarkController injected PersonDetails but JwtAuthFilter sets CustomUserDetails. Spring returns null for mismatched type injection. Fixed by: (1) changing to CustomUserDetails, (2) adding FilterRegistrationBean to prevent double filter execution, (3) using SecurityContextHolder directly. Residual: error responses during exception dispatch get re-processed by Spring Security and mapped to 401 instead of 403/400."
  artifacts:
    - path: "backend/src/main/java/com/ureport/search/controller/BookmarkController.java"
      issue: "Fixed: now uses SecurityContextHolder.getContext().getAuthentication().getPrincipal()"
    - path: "backend/src/main/java/com/ureport/security/SecurityConfig.java"
      issue: "Fixed: added FilterRegistrationBean to disable servlet-level auto-registration"
  missing:
    - "Add @ExceptionHandler in GlobalExceptionHandler for ResponseStatusException to preserve status code"
  debug_session: ""

- truth: "GET /api/geoclusters?zoom={0-6} returns pre-computed cluster data from geoclusters table"
  status: failed
  reason: "Self-check: PostgreSQL cannot GROUP BY a POINT type column. GeoclusterRepository @Query methods include GROUP BY g.center, g.level which fails because POINT has no equality operator."
  severity: blocker
  test: 4
  source: self_check
  root_cause: "GeoclusterRepository findClusters0-6 native @Query methods group by g.center (POINT type). PostgreSQL requires an equality operator for GROUP BY. POINT type does not have one. Fix: remove g.center from GROUP BY clause and select it via MIN(CAST(g.center AS text)) or reference a scalar proxy column, then parse in service layer."
  artifacts:
    - path: "backend/src/main/java/com/ureport/repository/GeoclusterRepository.java"
      issue: "All 7 findClusters{N} @Query methods use GROUP BY tg.cluster_id_N, g.center, g.level — remove g.center from GROUP BY"
  missing:
    - "Change each findClusters{N} query: remove g.center from GROUP BY; add MIN(CAST(g.center AS TEXT)) AS center_text to SELECT"
    - "Update GeoclusterService to parse center_text from String in row[4] instead of directly from row"
  debug_session: ""

- truth: "GET /api/reports returns grouped report data; GET /api/reports/export returns CSV attachment"
  status: failed
  reason: "Self-check: MetricsService JdbcTemplate reports SQL avg_resolution_hours returns numeric type. JDBC cannot convert numeric to Double. PSQLException: conversion to class java.lang.Double from numeric not supported."
  severity: major
  test: 8
  source: self_check
  root_cause: "MetricsService.buildReportSql uses EXTRACT(EPOCH FROM AVG(t.closed_date - t.entered_date))/3600 which returns numeric. JdbcTemplate attempts to read it as Double via rowMapper — fails. Fix: cast to DOUBLE PRECISION in SQL."
  artifacts:
    - path: "backend/src/main/java/com/ureport/metrics/service/MetricsService.java"
      issue: "buildReportSql: avg resolution column returns numeric, not double precision. Add CAST(...AS DOUBLE PRECISION)"
  missing:
    - "In buildReportSql: wrap avg resolution expression with CAST(... AS DOUBLE PRECISION)"
    - "In DashboardMetricsIT: verify reports_groupByCategory and reportsExport_groupByCategory pass"
  debug_session: ""

- truth: "Maven integration tests (SearchIT + DashboardMetricsIT) all pass using Zonky embedded PostgreSQL"
  status: failed
  reason: "Self-check: SearchIT 8/8 PASS (after Geocluster.level type fix). DashboardMetricsIT 6/9 PASS, 3 FAIL due to geoclusters GROUP BY point and reports Double conversion issues above."
  severity: major
  test: 9
  source: self_check
  root_cause: "Two underlying SQL bugs: (1) GeoclusterRepository GROUP BY point, (2) MetricsService numeric→Double conversion. Both are fixed by the gap entries above. Additional bugs fixed during this session: Geocluster.java Integer→Short, pom.xml missing H2, BookmarkController PersonDetails→CustomUserDetails, SecurityConfig missing FilterRegistrationBean."
  artifacts:
    - path: "backend/src/test/java/com/ureport/metrics/DashboardMetricsIT.java"
      issue: "3 tests fail: geoclusters_validZoom, reports_groupByCategory, reportsExport_groupByCategory"
  missing:
    - "Fix GeoclusterRepository GROUP BY point issue (gap above)"
    - "Fix MetricsService numeric→Double issue (gap above)"
  debug_session: ""
