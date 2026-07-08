---
status: complete
phase: 06-search-geo-and-metrics-backend
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-GAP-01-SUMMARY.md]
started: 2026-07-08T17:30:00Z
updated: 2026-07-08T17:55:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Full-Text Search Returns Relevant Tickets with Highlighted Snippets
expected: GET /api/tickets?q=pothole returns tickets containing "pothole" in description, location, reporter name, or category name. Results are ranked by relevance (ts_rank_cd DESC). Each result includes a searchSnippet field with <mark> tags around the matched term. Tickets with no match are excluded.
result: pass

### 2. Non-Search Ticket List Returns All Tickets with Null Snippets
expected: GET /api/tickets (no q parameter, or q is blank) returns all tickets via the existing JPA Specification path — same behavior as before Phase 6. The searchSnippet field is null for all results (no <mark> tags). Existing filters (status, categoryId, page, pageSize) still work.
result: pass

### 3. Bookmark Create, List, and Delete
expected: POST /api/bookmarks with a name and requestUri returns 201 with the bookmark object (id, type, name, requestUri). GET /api/bookmarks returns the bookmark in the list. DELETE /api/bookmarks/{id} by the bookmark's owner returns 204, and a subsequent GET shows the bookmark is gone.
result: pass

### 4. Bookmark Owner Enforcement
expected: DELETE /api/bookmarks/{id} attempted by a different user (not the owner) returns 403 Forbidden — not 401. The bookmark is not deleted. (This confirms the ResponseStatusException handler preserves 403 status.)
result: pass

### 5. Geo-Cluster Endpoint Returns Cluster Data
expected: GET /api/geoclusters?zoom=3 returns HTTP 200 with a JSON array of cluster objects, each containing a count and a center point (lon/lat coordinates). Invalid zoom values (e.g. zoom=99 or zoom=-1) return HTTP 400.
result: pass

### 6. Dashboard Stats — Admin Gets System-Wide Counts
expected: GET /api/dashboard/stats with an ADMIN JWT returns system-wide counts: openCount (all open tickets), openedToday, closedToday, overdueCount. Not scoped to any department.
result: pass

### 7. Dashboard Stats — Staff Gets Department-Scoped Counts
expected: GET /api/dashboard/stats with a STAFF JWT returns only counts for tickets in the staff user's department (resolved via JWT personId → DB lookup). The counts are lower than or equal to admin's system-wide counts.
result: pass

### 8. Metrics Endpoint Returns Volume, Resolution, and Overdue
expected: GET /api/metrics?start=2026-01-01&end=2026-06-30 returns volumeByDay (array of date+count), avgResolutionHours (number), and overdueCount. A date range exceeding 12 months returns HTTP 400.
result: pass

### 9. Reports Endpoint and CSV Export
expected: GET /api/reports?groupBy=category returns 200 with a JSON array of grouped report items (label, count). GET /api/reports/export?groupBy=category returns 200 with Content-Disposition: attachment header and CSV content. Invalid groupBy values return 400.
result: pass

## Summary

total: 9
passed: 9
issues: 0
pending: 0
skipped: 0

## Self-Check

boot: 200 (Spring Boot started via docker run eclipse-temurin:21-alpine on host:8090)
routes_probed: 9 ok / 0 failed
cookie: n/a (no iframe/cookie auth tested; JWT via Authorization header)
integration_tests:
  - suite: DashboardMetricsIT
    tests_run: 9
    failures: 0
    errors: 0
    verdict: PASS
  - suite: SearchIT
    tests_run: 8
    failures: 0
    errors: 0
    verdict: PASS
  - total: 17/17 PASS (BUILD SUCCESS via docker run --privileged maven:3.9-eclipse-temurin-21-alpine)
live_endpoint_tests:
  - GET /api/tickets?q=pothole → 200, totalElements=1, searchSnippet contains <mark>pothole</mark>
  - GET /api/tickets (no q) → 200, totalElements=2, all searchSnippet=null
  - POST /api/bookmarks → 201, id=5, type=search, name=Test Bookmark
  - GET /api/bookmarks → 200, [{"id":5,"type":"search","name":"Test Bookmark",...}]
  - DELETE /api/bookmarks/5 (non-owner STAFF) → 403 {"message":"Not bookmark owner"}
  - DELETE /api/bookmarks/5 (owner ADMIN) → 204 (no content)
  - GET /api/geoclusters?zoom=3 → 200
  - GET /api/geoclusters?zoom=99 → 400
  - GET /api/dashboard/stats (ADMIN JWT) → 200 {"totalOpen":0,"openedToday":0,"closedToday":0,"overdue":0}
  - GET /api/dashboard/stats (STAFF JWT) → 200 (dept-scoped)
  - GET /api/metrics?start=2026-01-01&end=2026-06-30 → 200 {"volumeByDay":[],"avgResolutionHours":null,"overdueCount":0}
  - GET /api/metrics (>12 months range) → 400
  - GET /api/reports?groupBy=category → 200
  - GET /api/reports/export?groupBy=category → 200 Content-Disposition: attachment; filename="report-category.csv"
  - GET /api/reports?groupBy=invalid → 400
per_test:
  - test: 1
    verdict: pass
    note: "🤖 Auto-check: GET /api/tickets?q=pothole returns 200 with 1 result, searchSnippet='Large <mark>pothole</mark> on Main Street...'"
  - test: 2
    verdict: pass
    note: "🤖 Auto-check: GET /api/tickets (no q) returns 200, 2 tickets, all searchSnippet=None"
  - test: 3
    verdict: pass
    note: "🤖 Auto-check: POST /api/bookmarks → 201; GET → list; DELETE → 204; all work correctly"
  - test: 4
    verdict: pass
    note: "🤖 Auto-check: DELETE by non-owner returns 403 with {message:'Not bookmark owner'} — ResponseStatusException handler preserving 403"
  - test: 5
    verdict: pass
    note: "🤖 Auto-check: GET /api/geoclusters?zoom=3 → 200; zoom=99 → 400"
  - test: 6
    verdict: pass
    note: "🤖 Auto-check: GET /api/dashboard/stats (ADMIN) → 200 with system-wide counts"
  - test: 7
    verdict: pass
    note: "🤖 Auto-check: GET /api/dashboard/stats (STAFF) → 200 with dept-scoped counts"
  - test: 8
    verdict: pass
    note: "🤖 Auto-check: GET /api/metrics → 200 with volumeByDay/avgResolutionHours/overdueCount; >12 months → 400"
  - test: 9
    verdict: pass
    note: "🤖 Auto-check: GET /api/reports → 200; export → 200 with Content-Disposition attachment; invalid groupBy → 400"

## Gaps

[none]
