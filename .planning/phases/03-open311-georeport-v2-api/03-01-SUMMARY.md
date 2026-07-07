---
phase: 03-open311-georeport-v2-api
plan: 01
subsystem: api
tags: [open311, georeport-v2, spring-boot, jpa, postgresql, flyway, jackson-xml, content-negotiation]

# Dependency graph
requires:
  - phase: 01-infrastructure-foundation
    provides: Spring Boot Maven skeleton, PostgreSQL schema via Flyway
  - phase: 02-authentication-security
    provides: SecurityConfig permitting /open311/v2/** as public routes

provides:
  - Category, CategoryGroup, Department JPA entities mapped to PostgreSQL tables
  - CategoryRepository with findByActiveTrue() and CategoryGroupRepository
  - Open311ServiceDto with 7 snake_case GeoReport v2 fields + @JacksonXmlProperty
  - Open311ServiceService with obsolete api_key handling and toDto() mapping
  - Open311ServicesController: GET /open311/v2/services and GET /open311/v2/services/{code}
  - Content negotiation via URL suffix (.json/.xml), format query param, and Accept header
  - V1__initial_schema.sql: Full PostgreSQL DDL for 21 tables with indexes and seed data
  - Open311ServicesIT: 6 integration tests verified against PostgreSQL native sidecar

affects: [03-02, 03-03, 04-01, 04-02]

# Tech tracking
tech-stack:
  added:
    - jackson-dataformat-xml (Spring Boot 3.3.0 managed)
    - springdoc-openapi-starter-webmvc-ui 2.6.0
    - flyway-core 10.15.0
    - flyway-database-postgresql 10.15.0
  patterns:
    - Content negotiation via path variable {ext} + format query param + Accept header
    - @JacksonXmlRootElement + @JacksonXmlProperty for XML serialization of DTOs
    - @Value("${open311.obsolete-api-keys:}") for env-backed configuration
    - ResponseStatusException for 404 with JSON error body via @ExceptionHandler

key-files:
  created:
    - backend/src/main/resources/db/migration/V1__initial_schema.sql
    - backend/src/test/java/com/ureport/open311/Open311ServicesIT.java
  modified:
    - backend/src/test/resources/application-test.yml
    - backend/pom.xml (jackson-dataformat-xml, springdoc-openapi)
    - backend/src/main/resources/application.yml (open311.obsolete-api-keys, springdoc)
    - backend/src/main/java/com/ureport/domain/Category.java
    - backend/src/main/java/com/ureport/domain/CategoryGroup.java
    - backend/src/main/java/com/ureport/domain/Department.java
    - backend/src/main/java/com/ureport/repository/CategoryRepository.java
    - backend/src/main/java/com/ureport/repository/CategoryGroupRepository.java
    - backend/src/main/java/com/ureport/open311/dto/Open311ServiceDto.java
    - backend/src/main/java/com/ureport/open311/dto/Open311ErrorDto.java
    - backend/src/main/java/com/ureport/open311/service/Open311ServiceService.java
    - backend/src/main/java/com/ureport/open311/controller/Open311ServicesController.java

key-decisions:
  - "Content negotiation via path variable {ext} priority over format query param priority over Accept header"
  - "Open311ServiceDto uses both @JsonProperty (snake_case JSON) and @JacksonXmlProperty for dual format support"
  - "Tests run against native-sidecar PostgreSQL (not H2) since DATABASE_URL is injected by platform"
  - "V1__initial_schema.sql uses SERIAL PKs, BOOLEAN, snake_case columns per TechArch §3.4 migration rules"
  - "baseline-on-migrate=true in test profile allows Flyway to run on pre-existing PostgreSQL schema"

patterns-established:
  - "Open311 DTO pattern: @JacksonXmlRootElement on single item DTO + @JacksonXmlProperty on each field"
  - "Content negotiation pattern: resolveMediaType(ext, formatParam) helper returning null = let Spring negotiate"
  - "Error response pattern: Open311ErrorDto.of(code, description) + @ExceptionHandler(ResponseStatusException)"

# Metrics
duration: 8min
completed: 2026-07-07
---

# Phase 3 Plan 1: Open311 Services Endpoints Summary

**Open311 GeoReport v2 GET /services endpoints with JSON/XML content negotiation, obsolete api_key shutdown handling, and Category JPA entities against native PostgreSQL sidecar**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-07T01:28:02Z
- **Completed:** 2026-07-07T01:36:46Z
- **Tasks:** 2 completed
- **Files modified:** 15

## Accomplishments

- Category, CategoryGroup, Department JPA entities mapped to `categories`, `category_groups`, `departments` tables with all columns from TechArch spec
- Open311ServiceDto with all 7 GeoReport v2 snake_case field names, supporting both JSON (`@JsonProperty`) and XML (`@JacksonXmlProperty`) serialization
- Open311ServiceService with `getServiceList(apiKey)` checking obsolete keys and returning 3 synthetic shutdown service objects, plus `getServiceInfo(serviceCode)` with 404 on unknown code
- Open311ServicesController implementing content negotiation: URL suffix `.json`/`.xml` → `format=xml` query param → `Accept` header → default JSON
- V1__initial_schema.sql: full PostgreSQL DDL for 21 tables converted from MySQL with SERIAL PKs, BOOLEAN columns, snake_case names, foreign keys, indexes, and seed data
- 6 integration tests passing against native PostgreSQL sidecar (public access, JSON array, XML suffix, format param, obsolete key, 404)

## Task Commits

Each task was committed atomically:

1. **Task 1: JPA entities, repos, DTOs, Flyway V1 migration, and test config** - `f3bdac4` (feat)
2. **Task 2: Open311ServicesController, Open311ServiceService, Open311ServicesIT** - `81d3a33` (feat)

**Plan metadata:** `(docs commit below)` (docs: complete plan)

_Note: `feat(03-02)` commit `4108138` by previous agent also contributed source files for both 03-01 and 03-02 as pre-scaffolding_

## Files Created/Modified

- `backend/src/main/resources/db/migration/V1__initial_schema.sql` — Full PostgreSQL schema: 21 tables, constraints, indexes, seed data
- `backend/src/test/java/com/ureport/open311/Open311ServicesIT.java` — 6 integration tests for GET /services and GET /services/{code}
- `backend/src/test/resources/application-test.yml` — Updated to use native-sidecar PostgreSQL (not H2)
- `backend/pom.xml` — jackson-dataformat-xml, springdoc-openapi-starter-webmvc-ui added
- `backend/src/main/resources/application.yml` — open311.obsolete-api-keys and springdoc config added
- `backend/src/main/java/com/ureport/domain/Category.java` — JPA entity with id, name, description, categoryGroup, department, active, displayPermissionLevel, postingPermissionLevel, slaDays
- `backend/src/main/java/com/ureport/domain/CategoryGroup.java` — Maps category_groups table
- `backend/src/main/java/com/ureport/domain/Department.java` — Maps departments table
- `backend/src/main/java/com/ureport/repository/CategoryRepository.java` — findByActiveTrue() Spring Data method
- `backend/src/main/java/com/ureport/repository/CategoryGroupRepository.java` — Basic JPA repository
- `backend/src/main/java/com/ureport/open311/dto/Open311ServiceDto.java` — 7-field GeoReport v2 DTO
- `backend/src/main/java/com/ureport/open311/dto/Open311ErrorDto.java` — Error response matching PHP format
- `backend/src/main/java/com/ureport/open311/service/Open311ServiceService.java` — Business logic with obsolete key handling
- `backend/src/main/java/com/ureport/open311/controller/Open311ServicesController.java` — REST controller with content negotiation

## Decisions Made

1. **Content negotiation strategy**: Used path variable `{ext}` with priority: ext → format param → Accept header → default JSON. This matches TechArch §4.1 exactly and avoids ContentNegotiationStrategy complexity.

2. **XML serialization**: Used `@JacksonXmlRootElement(localName="service")` on the DTO with `@JacksonXmlProperty` on each field. This avoids custom XML serializers while matching the exact field names GeoReport v2 requires.

3. **Test database**: Switched from H2 (application-test.yml committed by previous agent) to native PostgreSQL sidecar since `DATABASE_URL` env var is injected by the platform. H2 was being overridden by the env var causing `Driver org.h2.Driver claims to not accept jdbcUrl: jdbc:postgresql://...` errors.

4. **Flyway in tests**: Used `baseline-on-migrate: true` in test profile to allow Flyway to run on a PostgreSQL instance that may already have tables from the V1 migration. `clean-disabled: false` only in test profile for safe test re-runs.

## Deviations from Plan

### Pre-existing Committed Code

**1. [Rule 3 - Blocking] Backend scaffold pre-committed by parallel agent**
- **Found during:** Task 1 start — discovered `feat(03-02)` commit (`4108138`) already existed with all production source files
- **Issue:** A previous agent committed the entire backend Spring Boot project as prep for plan 03-02, including all 03-01 source files (Category.java, CategoryGroup.java, Department.java, repositories, DTOs, service, controller, pom.xml, application.yml)
- **Fix:** Treated existing committed code as correct (verified it matches plan specifications), added only the missing files (V1__initial_schema.sql, Open311ServicesIT.java, application-test.yml fixes) and committed those
- **Files added:** V1__initial_schema.sql, Open311ServicesIT.java, application-test.yml
- **Committed in:** f3bdac4 (Task 1), 81d3a33 (Task 2)

**2. [Rule 2 - Missing Critical] H2 test config incompatible with native-sidecar PostgreSQL**
- **Found during:** Task 2 (running Open311ServicesIT)
- **Issue:** `application-test.yml` committed by previous agent configured H2 in-memory DB, but platform injects `DATABASE_URL=postgres://...` env var which overrides the H2 URL — Spring tried to use H2 driver with PostgreSQL URL, causing `Driver org.h2.Driver claims to not accept jdbcUrl` failure
- **Fix:** Updated `application-test.yml` to use native PostgreSQL sidecar directly (`jdbc:postgresql://localhost:5432/ureport`) with Flyway enabled and `baseline-on-migrate: true`
- **Files modified:** backend/src/test/resources/application-test.yml
- **Verification:** All 6 Open311ServicesIT tests pass
- **Committed in:** f3bdac4

---

**Total deviations:** 2 auto-fixed (1 blocking - pre-committed code, 1 missing critical - test DB config)
**Impact on plan:** Both deviations were necessary for correctness. No scope creep — the pre-committed code matches plan specifications exactly. The H2→PostgreSQL test fix was required by the native-sidecar runtime environment contract.

## Issues Encountered

- **Java not pre-installed**: Java 21 and Maven required `apt-get install -y openjdk-21-jdk-headless maven` — added as [Rule 3 - Blocking] fix automatically
- **Duplicate Application class**: Deleting the committed `UreportApplication.java` (lowercase) caused a conflict before discovering the pre-existing committed codebase; restored with `git restore`

## User Setup Required

None - no external service configuration required. Uses native PostgreSQL sidecar via injected `DATABASE_URL`.

## Next Phase Readiness

- Plan 03-01 complete: Category JPA entities, Open311ServiceService, Open311ServicesController all verified
- Plan 03-02 (Open311 requests endpoint) was simultaneously implemented by another agent — verify 03-02 separately
- Plan 03-03 (OpenAPI/Swagger integration) can proceed — springdoc-openapi already added to pom.xml

---
*Phase: 03-open311-georeport-v2-api*
*Completed: 2026-07-07*

## Self-Check: PASSED

All required files exist on disk. All commits present in git log. All 6 integration tests pass.
