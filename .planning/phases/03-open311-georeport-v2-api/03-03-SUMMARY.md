---
phase: 03-open311-georeport-v2-api
plan: 03
subsystem: api
tags: [springdoc, openapi, swagger, open311, georeport, golden-file, integration-tests]

# Dependency graph
requires:
  - phase: 03-open311-georeport-v2-api
    provides: "Open311ServicesController (03-01), Open311RequestsController (03-02), springdoc-openapi dependency in pom.xml"
provides:
  - "OpenAPI 3.0 spec at /v3/api-docs with JWT Bearer security scheme"
  - "Swagger UI at /swagger-ui.html"
  - "Golden-file integration tests for Open311 JSON response shape (8 tests)"
  - "Reference golden files for services (7 fields) and requests (18 fields incl. 'long')"
affects: [phase-4-internal-crm-api, phase-9-testing]

# Tech tracking
tech-stack:
  added: [springdoc-openapi-starter-webmvc-ui (already added in 03-01)]
  patterns: [golden-file testing, OpenAPI @Operation/@Tag/@Parameter annotation-driven docs, JWT Bearer SecurityScheme]

key-files:
  created:
    - backend/src/main/java/com/ureport/config/OpenApiConfig.java
    - backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java
    - backend/src/test/resources/open311-golden/services-response.json
    - backend/src/test/resources/open311-golden/requests-response.json
  modified:
    - backend/src/main/java/com/ureport/open311/controller/Open311ServicesController.java
    - backend/src/main/java/com/ureport/open311/controller/Open311RequestsController.java

key-decisions:
  - "Golden-file tests use H2 in-memory DB with @TestPropertySource + JPA @BeforeEach setup (same pattern as Open311RequestsIT) — avoids data.sql complications with native-sidecar PostgreSQL"
  - "Golden-file tests check SHAPE (field name presence), not VALUES — test DB data varies but field structure must be stable"

patterns-established:
  - "OpenAPI annotations: @Tag on class, @Operation+@Parameter+@ApiResponses on each endpoint method"
  - "Golden-file IT pattern: ClassPathResource loads JSON template, Iterator<String> walks fieldNames(), assertThat(actualFirst.has(fieldName)) validates shape"

# Metrics
duration: 3min
completed: 2026-07-07
---

# Phase 3 Plan 3: OpenAPI/Swagger Docs + Golden-File Integration Tests Summary

**OpenAPI 3.0 configuration with JWT Bearer SecurityScheme, @Operation annotations on all 5 Open311 endpoints, and golden-file shape tests verifying GeoReport v2 JSON field compliance**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-07T01:40:10Z
- **Completed:** 2026-07-07T01:43:16Z
- **Tasks:** 2
- **Files modified:** 6 (1 created config, 2 modified controllers, 3 created test files)

## Accomplishments

- Created `OpenApiConfig.java` with JWT Bearer `SecurityScheme` for OpenAPI 3.0 — springdoc auto-discovers via `@Configuration`
- Added `@Tag`, `@Operation`, `@Parameter`, `@ApiResponses` to all 5 Open311 endpoint methods across both controllers
- Created `Open311GoldenFileIT.java` with 8 integration tests covering JSON shape, XML content negotiation, POST response shape, and `/v3/api-docs` endpoint
- Created golden reference files for services (7-field GeoReport v2 structure) and requests (18-field structure with `long` not `longitude`)

## Task Commits

Each task was committed atomically:

1. **Task 1: OpenApiConfig bean + @Operation annotations** - `303e9ce` (feat)
2. **Task 2: Golden-file integration tests** - `79eea3e` (feat)

**Plan metadata:** (to be added)

## Files Created/Modified

- `backend/src/main/java/com/ureport/config/OpenApiConfig.java` — `@Configuration` bean with `customOpenAPI()` declaring JWT Bearer `SecurityScheme`; springdoc auto-discovers via classpath scan
- `backend/src/main/java/com/ureport/open311/controller/Open311ServicesController.java` — Added `@Tag`, `@Operation`, `@Parameter`, `@ApiResponses` to class and `getServices()`/`getService()` methods
- `backend/src/main/java/com/ureport/open311/controller/Open311RequestsController.java` — Added `@Tag`, `@Operation`, `@Parameter`, `@ApiResponses` to class and `getRequests()`/`getRequest()`/`createRequest()` methods
- `backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java` — 8 integration tests: shape tests for services and requests, XML content negotiation (suffix, format param, Accept header, no hint), POST response shape, api-docs endpoint test
- `backend/src/test/resources/open311-golden/services-response.json` — Golden reference: 7-field GeoReport v2 service structure (service_code, service_name, description, metadata, type, keywords, group)
- `backend/src/test/resources/open311-golden/requests-response.json` — Golden reference: 18-field GeoReport v2 service_request structure including `long` (not `longitude`)

## Decisions Made

- **Golden-file tests use H2 + @TestPropertySource + JPA setup**: The test environment uses native-sidecar PostgreSQL by default. For the POST test that requires specific test data (Client + Category), we follow the same pattern as `Open311RequestsIT` (H2 in-memory with `@TestPropertySource` + JPA repositories in `@BeforeEach`). This avoids the `data.sql` complications noted in the plan.
- **Shape tests not value tests**: Golden-file tests check that required JSON field NAMES are present in the response; they do not check values. This makes tests robust against different test DB states while still catching structural regressions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used @BeforeEach JPA setup instead of data.sql for POST test**
- **Found during:** Task 2 (golden-file test implementation)
- **Issue:** The plan suggested adding a `data.sql` to `src/test/resources/`. However, `application-test.yml` uses native-sidecar PostgreSQL (not H2), and the plan itself notes this is the case. Adding `data.sql` would work for H2 but break the existing test configuration that uses real PostgreSQL. `Open311RequestsIT` already uses the `@TestPropertySource` + JPA repository pattern to create test data.
- **Fix:** Applied the same `@TestPropertySource` pattern from `Open311RequestsIT` — H2 in-memory with `create-drop` DDL and `@BeforeEach` JPA setup instead of `data.sql`.
- **Files modified:** `Open311GoldenFileIT.java` (uses repositories, not data.sql)
- **Verification:** All 8 golden file tests pass
- **Committed in:** 79eea3e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix aligns the test with the existing pattern from `Open311RequestsIT`. No scope creep, no behavior change to production code.

## Issues Encountered

None — tests passed on first run.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 3 is **complete**: all 3 plans executed with commits
  - 03-01: Open311 Services endpoints (GET /services, GET /services/{code})
  - 03-02: Open311 Requests endpoints (GET /requests, GET /requests/{id}, POST /requests)
  - 03-03: OpenAPI/Swagger docs + golden-file integration tests
- GET /v3/api-docs returns OpenAPI 3.0 JSON (verified by `apiDocs_containsOpen311Endpoints` test)
- GET /swagger-ui.html returns Swagger UI HTML (springdoc auto-configured)
- All 5 Open311 endpoints documented in OpenAPI spec
- Golden-file regression guards in place for future refactors

---
*Phase: 03-open311-georeport-v2-api*
*Completed: 2026-07-07*

## Self-Check: PASSED

- FOUND: backend/src/main/java/com/ureport/config/OpenApiConfig.java
- FOUND: backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java
- FOUND: backend/src/test/resources/open311-golden/services-response.json
- FOUND: backend/src/test/resources/open311-golden/requests-response.json
- FOUND: commit 303e9ce (feat(03-03): add OpenApiConfig bean and @Operation annotations)
- FOUND: commit 79eea3e (feat(03-03): add golden-file integration tests)
