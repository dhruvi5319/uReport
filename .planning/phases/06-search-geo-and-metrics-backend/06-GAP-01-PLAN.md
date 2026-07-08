---
phase: 06-search-geo-and-metrics-backend
plan: GAP-01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/main/java/com/ureport/repository/GeoclusterRepository.java
  - backend/src/main/java/com/ureport/geo/service/GeoclusterService.java
  - backend/src/main/java/com/ureport/metrics/service/MetricsService.java
  - backend/src/main/java/com/ureport/crm/exception/GlobalExceptionHandler.java
autonomous: true
gap_closure: true

features:
  implements: ["F16", "F15", "F11"]
  depends_on: []
  enables: []

must_haves:
  truths:
    - "GET /api/geoclusters?zoom=3 returns 200 with a clusters JSON array"
    - "GET /api/geoclusters?zoom=99 returns 400 (invalid zoom)"
    - "GET /api/reports?groupBy=category returns 200 with a non-empty JSON array"
    - "GET /api/reports/export?groupBy=category returns 200 with Content-Disposition attachment and CSV body"
    - "DELETE /api/bookmarks/{other_user_id} returns 403 (not 401)"
    - "DashboardMetricsIT: all 9 tests pass"
    - "SearchIT: all 8 tests still pass"
  artifacts:
    - path: "backend/src/main/java/com/ureport/repository/GeoclusterRepository.java"
      provides: "Fixed GROUP BY — g.center removed; MIN(CAST(g.center AS TEXT)) AS center_text in SELECT"
      contains: "center_text"
    - path: "backend/src/main/java/com/ureport/geo/service/GeoclusterService.java"
      provides: "Reads center_text (String) from row[3], parses lon/lat from it"
      contains: "center_text"
    - path: "backend/src/main/java/com/ureport/metrics/service/MetricsService.java"
      provides: "buildReportSql avg_hours wrapped in CAST(... AS DOUBLE PRECISION)"
      contains: "CAST"
    - path: "backend/src/main/java/com/ureport/crm/exception/GlobalExceptionHandler.java"
      provides: "@ExceptionHandler(ResponseStatusException.class) preserves status code"
      contains: "ResponseStatusException"
  key_links:
    - from: "GeoclusterRepository.java"
      to: "GeoclusterService.java"
      via: "row[3] now holds center_text String instead of Double lon"
      pattern: "center_text"
    - from: "MetricsService.buildReportSql"
      to: "JdbcTemplate rowMapper"
      via: "avg_hours column must be readable as Double"
      pattern: "CAST.*DOUBLE PRECISION"
    - from: "GlobalExceptionHandler"
      to: "BookmarkController ResponseStatusException"
      via: "@ExceptionHandler before ExceptionTranslationFilter re-maps to 401"
      pattern: "ResponseStatusException"

integration_contracts:
  requires: []
  provides:
    - artifact: "backend/src/main/java/com/ureport/repository/GeoclusterRepository.java"
      exports: ["findClusters0", "findClusters1", "findClusters2", "findClusters3", "findClusters4", "findClusters5", "findClusters6"]
      shape: |
        Each query selects center_text (not lon/lat) and omits g.center from GROUP BY.
        SELECT tg.cluster_id_N as cluster_id, COUNT(*) as count, g.level,
               MIN(CAST(g.center AS TEXT)) AS center_text
        FROM ... GROUP BY tg.cluster_id_N, g.level
      verify: "grep -n 'center_text' backend/src/main/java/com/ureport/repository/GeoclusterRepository.java && echo CONTRACT_OK"
    - artifact: "backend/src/main/java/com/ureport/metrics/service/MetricsService.java"
      exports: ["buildReportSql"]
      shape: |
        avg_hours column uses CAST(AVG(CASE ... EXTRACT(EPOCH FROM ...)/3600 END) AS DOUBLE PRECISION)
      verify: "grep -n 'CAST.*DOUBLE PRECISION' backend/src/main/java/com/ureport/metrics/service/MetricsService.java && echo CONTRACT_OK"
    - artifact: "backend/src/main/java/com/ureport/crm/exception/GlobalExceptionHandler.java"
      exports: ["handleResponseStatus"]
      shape: |
        @ExceptionHandler(ResponseStatusException.class) returning ResponseEntity with preserved status code
      verify: "grep -n 'ResponseStatusException' backend/src/main/java/com/ureport/crm/exception/GlobalExceptionHandler.java && echo CONTRACT_OK"
---

<objective>
Close the 4 UAT gaps in Phase 6 (Search, Geo & Metrics Backend):

1. **GeoclusterRepository GROUP BY POINT** (blocker): PostgreSQL rejects GROUP BY on POINT type columns because POINT has no equality operator. Fix the 7 `findClusters{N}` queries.
2. **MetricsService NUMERIC→Double** (major): `buildReportSql` returns a `numeric` column that JDBC cannot auto-convert to `Double`. Fix with `CAST(... AS DOUBLE PRECISION)`.
3. **Bookmark ownership 401 vs 403** (minor): Spring Security's ExceptionTranslationFilter intercepts unhandled exceptions during error dispatch and re-maps them to 401. Fix by handling `ResponseStatusException` in `GlobalExceptionHandler`.
4. **DashboardMetricsIT 3 failures** (major): Covered entirely by fixing gaps 1 and 2.

Purpose: Unblock Phase 6 UAT so all 9 DashboardMetricsIT tests pass and all 3 failing HTTP routes return correct responses.
Output: 3 modified source files + 1 modified exception handler; all tests green.
</objective>

<feature_dependencies>
Implements: F16: Geo-clustering endpoint, F15: Metrics/reporting endpoints, F11: Bookmark ownership enforcement
Depends on: None (all artifacts are within this phase)
Enables: None (gap closure only)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/06-search-geo-and-metrics-backend/06-UAT.md
@.planning/phases/06-search-geo-and-metrics-backend/06-02-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix GeoclusterRepository GROUP BY POINT and update GeoclusterService row mapping</name>
  <files>
    backend/src/main/java/com/ureport/repository/GeoclusterRepository.java
    backend/src/main/java/com/ureport/geo/service/GeoclusterService.java
  </files>
  <action>
**Problem:** All 7 `findClusters{N}` @Query methods in `GeoclusterRepository.java` currently include `g.center` in the GROUP BY clause:

```sql
GROUP BY tg.cluster_id_N, g.center, g.level
```

PostgreSQL POINT type has no equality operator, so GROUP BY rejects it with:
`ERROR: could not identify an equality operator for type point`

**Fix — GeoclusterRepository.java:**

Replace the SELECT + GROUP BY in ALL 7 methods (`findClusters0` through `findClusters6`) as follows.

**BEFORE** (example for zoom 0):
```sql
SELECT tg.cluster_id_0 as cluster_id, COUNT(*) as count,
       g.level,
       CAST(split_part(trim(both '()' from CAST(g.center AS text)), ',', 1) AS double precision) as lon,
       CAST(split_part(trim(both '()' from CAST(g.center AS text)), ',', 2) AS double precision) as lat
FROM ticket_geodata tg
JOIN geoclusters g ON g.id = tg.cluster_id_0
JOIN tickets t ON t.id = tg.ticket_id
WHERE (:status IS NULL OR t.status = :status)
GROUP BY tg.cluster_id_0, g.center, g.level
```

**AFTER** (example for zoom 0):
```sql
SELECT tg.cluster_id_0 as cluster_id, COUNT(*) as count,
       g.level,
       MIN(CAST(g.center AS TEXT)) AS center_text
FROM ticket_geodata tg
JOIN geoclusters g ON g.id = tg.cluster_id_0
JOIN tickets t ON t.id = tg.ticket_id
WHERE (:status IS NULL OR t.status = :status)
GROUP BY tg.cluster_id_0, g.level
```

Key changes per query:
- **Remove** `g.center` from GROUP BY — only `tg.cluster_id_N` and `g.level` remain
- **Remove** the two separate `CAST(split_part(...))` lon/lat columns from SELECT
- **Add** `MIN(CAST(g.center AS TEXT)) AS center_text` to SELECT — `MIN()` is an aggregate so it is valid when center is not in GROUP BY
- Apply this to all 7 methods: `findClusters0` → `findClusters6` (change `cluster_id_0` through `cluster_id_6` and the corresponding JOIN column accordingly)

**Fix — GeoclusterService.java:**

The current row mapper reads:
```java
dto.setLevel(((Number) row[2]).intValue());        // level   ← row[2]
dto.setLon(((Number) row[3]).doubleValue());       // lon     ← row[3]
dto.setLat(((Number) row[4]).doubleValue());       // lat     ← row[4]
```

After the query change, the SELECT is:
```
row[0] = cluster_id (Number)
row[1] = count      (Number)
row[2] = level      (Number)
row[3] = center_text (String, e.g. "(34.05,-118.24)" — PostgreSQL POINT text form)
```

Update `GeoclusterService.getClustersByZoom` row mapper to:
```java
dto.setId(((Number) row[0]).longValue());
dto.setTicketCount(((Number) row[1]).longValue());
dto.setLevel(((Number) row[2]).intValue());
// Parse lon and lat from center_text "(x,y)"
String centerText = (String) row[3];   // e.g. "(34.05,-118.24)"
String stripped = centerText.replace("(", "").replace(")", "");
String[] parts = stripped.split(",");
dto.setLon(Double.parseDouble(parts[0].trim()));
dto.setLat(Double.parseDouble(parts[1].trim()));
```

Remove the old `row[3]` / `row[4]` Number casts entirely.
  </action>
  <verify>
```bash
cd /home/daytona/project/backend && \
  grep -n 'center_text' src/main/java/com/ureport/repository/GeoclusterRepository.java | head -7 && \
  grep -n 'GROUP BY' src/main/java/com/ureport/repository/GeoclusterRepository.java | grep -v 'g\.center' && \
  grep -n 'centerText' src/main/java/com/ureport/geo/service/GeoclusterService.java && \
  echo "COMPILE CHECK:" && \
  mvn compile -q -pl . 2>&1 | tail -5 && echo "COMPILE OK"
```

Expected: 7 lines containing `center_text` in the repository, all GROUP BY lines contain only `cluster_id_N, g.level`, `centerText` appears in service, `COMPILE OK`.
  </verify>
  <done>
- All 7 `findClusters{N}` queries select `MIN(CAST(g.center AS TEXT)) AS center_text` and GROUP BY only `tg.cluster_id_N, g.level`
- `GeoclusterService` parses lon/lat from the `center_text` String `(x,y)` instead of reading row[3]/row[4] as Numbers
- `mvn compile` succeeds with no errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix MetricsService NUMERIC→Double and add ResponseStatusException handler</name>
  <files>
    backend/src/main/java/com/ureport/metrics/service/MetricsService.java
    backend/src/main/java/com/ureport/crm/exception/GlobalExceptionHandler.java
  </files>
  <action>
**Fix A — MetricsService.java (NUMERIC→Double conversion)**

Problem: `buildReportSql` computes `avg_hours` as:
```sql
AVG(CASE WHEN t.status='closed'
    THEN EXTRACT(EPOCH FROM (t.closed_date - t.entered_date))/3600 END) as avg_hours
```
PostgreSQL returns this as `numeric`, but the JdbcTemplate rowMapper calls `rs.getObject("avg_hours", Double.class)`, which throws:
`PSQLException: conversion to class java.lang.Double from numeric not supported`

In `buildReportSql`, wrap each of the three `avg_hours` expressions (category, department, and assignee cases) with `CAST(... AS DOUBLE PRECISION)`.

**BEFORE** (same in all three switch cases):
```sql
AVG(CASE WHEN t.status='closed'
    THEN EXTRACT(EPOCH FROM (t.closed_date - t.entered_date))/3600 END) as avg_hours
```

**AFTER** (same change in all three switch cases):
```sql
CAST(AVG(CASE WHEN t.status='closed'
    THEN EXTRACT(EPOCH FROM (t.closed_date - t.entered_date))/3600 END) AS DOUBLE PRECISION) as avg_hours
```

Apply this change inside all three cases of the switch: `"category"`, `"department"`, and `"assignee"`.

No other changes to `MetricsService.java`.

---

**Fix B — GlobalExceptionHandler.java (401 vs 403 for ResponseStatusException)**

Problem: When `BookmarkController` (and `GeoclusterService`) throws a `ResponseStatusException` (e.g., 403 Forbidden, 400 Bad Request), Spring Security's `ExceptionTranslationFilter` intercepts the exception during error dispatch and re-maps it to 401 (authentication required) instead of letting the declared status code through.

Fix: Add an `@ExceptionHandler(ResponseStatusException.class)` method to `GlobalExceptionHandler` that reads the exception's status code and returns it directly, bypassing `ExceptionTranslationFilter`.

Add this import to `GlobalExceptionHandler.java`:
```java
import org.springframework.web.server.ResponseStatusException;
```

Add this handler method inside `GlobalExceptionHandler`:
```java
@ExceptionHandler(ResponseStatusException.class)
public ResponseEntity<ApiErrorDto> handleResponseStatus(ResponseStatusException ex) {
    return ResponseEntity.status(ex.getStatusCode())
        .body(new ApiErrorDto("REQUEST_ERROR", ex.getReason() != null ? ex.getReason() : ex.getMessage()));
}
```

This intercepts `ResponseStatusException` before `ExceptionTranslationFilter` can re-process the error response, preserving the original status code (403, 400, etc.).
  </action>
  <verify>
```bash
cd /home/daytona/project/backend && \
  grep -n 'CAST.*DOUBLE PRECISION' src/main/java/com/ureport/metrics/service/MetricsService.java && \
  grep -n 'ResponseStatusException' src/main/java/com/ureport/crm/exception/GlobalExceptionHandler.java && \
  echo "COMPILE CHECK:" && \
  mvn compile -q -pl . 2>&1 | tail -5 && echo "COMPILE OK"
```

Expected: 3 lines with `CAST.*DOUBLE PRECISION` (one per switch case), `ResponseStatusException` appears in GlobalExceptionHandler, `COMPILE OK`.
  </verify>
  <done>
- All three `buildReportSql` switch cases wrap `avg_hours` in `CAST(... AS DOUBLE PRECISION)`
- `GlobalExceptionHandler` has `@ExceptionHandler(ResponseStatusException.class)` that returns `ex.getStatusCode()` directly
- `mvn compile` succeeds
  </done>
</task>

<task type="auto">
  <name>Task 3: Run full integration test suite to confirm all gaps closed</name>
  <files>
    backend/src/test/java/com/ureport/metrics/DashboardMetricsIT.java
    backend/src/test/java/com/ureport/search/SearchIT.java
  </files>
  <action>
Run the two integration test classes that cover the repaired functionality:

1. `DashboardMetricsIT` — covers all 9 scenarios including the 3 previously-failing tests:
   - `geoclusters_validZoom_returns200WithClustersArray` (was failing: GROUP BY POINT)
   - `reports_groupByCategory_returns200WithList` (was failing: numeric→Double)
   - `reportsExport_groupByCategory_returnsCsvAttachment` (was failing: numeric→Double)

2. `SearchIT` — regression guard to confirm that the geo/metrics fixes did not break full-text search or bookmark tests.

Run command:
```bash
cd /home/daytona/project/backend && \
  mvn verify -Dtest=DashboardMetricsIT,SearchIT -pl . 2>&1 | tail -40
```

If any test still fails, diagnose from the Maven output. Common follow-up issues:
- If `geoclusters_validZoom` still fails with a SQL error, re-check that ALL 7 queries in `GeoclusterRepository` were updated (not just zoom 0).
- If `reports_groupByCategory` still fails with conversion error, check that all three `buildReportSql` switch branches were updated.
- If `geoclusters_invalidZoom_returns400` fails (returns 401), verify the `@ExceptionHandler(ResponseStatusException.class)` is present and the import is correct.
  </action>
  <verify>
```bash
cd /home/daytona/project/backend && \
  mvn verify -Dtest=DashboardMetricsIT,SearchIT -pl . 2>&1 | grep -E 'Tests run|BUILD|FAILED|ERROR' | tail -20
```

Expected output pattern:
```
Tests run: 9, Failures: 0, Errors: 0, Skipped: 0 -- DashboardMetricsIT
Tests run: 8, Failures: 0, Errors: 0, Skipped: 0 -- SearchIT
BUILD SUCCESS
```
  </verify>
  <done>
- `DashboardMetricsIT`: 9/9 tests pass (0 failures, 0 errors)
- `SearchIT`: 8/8 tests pass (0 failures, 0 errors)
- `BUILD SUCCESS` from Maven
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→API | HTTP request parameters (zoom, groupBy, start, end) crossing into Spring MVC handlers |
| handler→SQL | Service-layer values flowing into JdbcTemplate / JPA @Query SQL |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-06-GAP-01 | Tampering | GeoclusterRepository @Query — GROUP BY fix | mitigate | `MIN(CAST(g.center AS TEXT))` is a pure aggregate expression; zoom dispatch remains in `GeoclusterService.getClustersByZoom` via Java switch over a `Set<Integer>` whitelist — zoom value is NEVER interpolated into SQL (pre-existing T-06-06 mitigation preserved) |
| T-06-GAP-02 | Tampering | MetricsService.buildReportSql — CAST addition | mitigate | `CAST(... AS DOUBLE PRECISION)` wraps an already-hardcoded SQL literal; `groupBy` value is NEVER concatenated (pre-existing T-06-07 whitelist + switch mitigation preserved); only the return type cast changes |
| T-06-GAP-03 | Elevation of privilege | GlobalExceptionHandler — ResponseStatusException handler | mitigate | `@ExceptionHandler(ResponseStatusException.class)` in `GlobalExceptionHandler` intercepts the exception before `ExceptionTranslationFilter` can re-map it to 401; the handler reads `ex.getStatusCode()` (set by application code, not by client input) and `ex.getReason()` (a controlled string); no client-supplied value is reflected back into the status code |
| T-06-GAP-04 | Information disclosure | GlobalExceptionHandler — error message in ApiErrorDto | accept | `ex.getReason()` may reveal internal route/parameter names in the error body. Risk accepted: the field is already present on all other `ApiErrorDto` responses in the codebase; no stack traces or DB details are exposed; disclosure is consistent with existing handler conventions. Owner: backend team. |
</threat_model>

<verification>
After all tasks complete, verify the following manually or via CI:

1. `mvn verify -Dtest=DashboardMetricsIT -pl backend` → 9/9 PASS
2. `mvn verify -Dtest=SearchIT -pl backend` → 8/8 PASS
3. No `GROUP BY` clause in `GeoclusterRepository.java` references `g.center`
4. All three `buildReportSql` switch cases contain `CAST(... AS DOUBLE PRECISION)`
5. `GlobalExceptionHandler` contains `@ExceptionHandler(ResponseStatusException.class)`
6. Confirming `DELETE /api/bookmarks/{other_user_bookmark_id}` returns 403 (not 401) when authenticated as a different staff user
</verification>

<success_criteria>
- `DashboardMetricsIT`: all 9 tests pass (was 6/9)
- `SearchIT`: all 8 tests pass (regression guard)
- `GET /api/geoclusters?zoom=3` returns HTTP 200 with `{"clusters":[...]}` (was HTTP 500/401)
- `GET /api/reports?groupBy=category` returns HTTP 200 with JSON array (was HTTP 500/401)
- `GET /api/reports/export?groupBy=category` returns HTTP 200 with `Content-Disposition: attachment` and CSV body
- `DELETE /api/bookmarks/{other_user_id}` returns HTTP 403 (was 401)
- `mvn verify` BUILD SUCCESS with no regressions in other IT classes
</success_criteria>

<output>
After completion, create `.planning/phases/06-search-geo-and-metrics-backend/06-GAP-01-SUMMARY.md`
</output>
