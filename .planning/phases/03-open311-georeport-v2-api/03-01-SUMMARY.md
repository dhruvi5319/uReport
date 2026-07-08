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
  - Open311ServicesIT: 6 integration tests using Zonky embedded PostgreSQL

affects: [03-02, 03-03, 04-01, 04-02]

# Tech tracking
tech-stack:
  added:
    - jackson-dataformat-xml (Spring Boot 3.3.0 managed)
    - springdoc-openapi-starter-webmvc-ui 2.5.0
    - flyway-core 10.15.0
    - flyway-database-postgresql 10.15.0
  patterns:
    - Content negotiation via path variable {ext} + format query param + Accept header
    - @JacksonXmlRootElement + @JacksonXmlProperty for XML serialization of DTOs
    - @Value("${open311.obsolete-api-keys:}") for env-backed configuration
    - ResponseStatusException for 404 with JSON error body via @ExceptionHandler
    - @AutoConfigureEmbeddedDatabase(ZONKY) for integration tests (no Docker daemon)

key-files:
  created:
    - backend/src/main/java/com/ureport/domain/Category.java
    - backend/src/main/java/com/ureport/domain/CategoryGroup.java
    - backend/src/main/java/com/ureport/domain/Department.java
    - backend/src/main/java/com/ureport/repository/CategoryRepository.java
    - backend/src/main/java/com/ureport/repository/CategoryGroupRepository.java
    - backend/src/main/java/com/ureport/open311/dto/Open311ServiceDto.java
    - backend/src/main/java/com/ureport/open311/dto/Open311ErrorDto.java
    - backend/src/main/java/com/ureport/open311/service/Open311ServiceService.java
    - backend/src/main/java/com/ureport/open311/controller/Open311ServicesController.java
    - backend/src/test/java/com/ureport/open311/Open311ServicesIT.java
  modified:
    - backend/pom.xml (jackson-dataformat-xml, springdoc-openapi)
    - backend/src/main/resources/application.yml (open311.obsolete-api-keys, springdoc)
    - backend/src/test/resources/application-test.yml (open311.obsolete-api-keys for test)

key-decisions:
  - "Content negotiation via path variable {ext} priority over format query param priority over Accept header"
  - "Open311ServiceDto uses both @JsonProperty (snake_case JSON) and @JacksonXmlProperty for dual format support"
  - "Tests use @AutoConfigureEmbeddedDatabase(ZONKY) — no Docker daemon required in K8s sandbox"
  - "CategoryRepository.findByActiveTrue() uses Spring Data JPA method name derivation"
  - "obsolete api_key returns exactly 3 synthetic mobile shutdown service objects"

patterns-established:
  - "Open311 DTO pattern: @JacksonXmlRootElement on single item DTO + @JacksonXmlProperty on each field"
  - "Content negotiation pattern: resolveMediaType(ext, formatParam) helper returning null = let Spring negotiate"
  - "Error response pattern: Open311ErrorDto.of(code, description) + @ExceptionHandler(ResponseStatusException)"

# Metrics
duration: 10min
completed: 2026-07-08
---

# Phase 3 Plan 1: Open311 Services Endpoints Summary

**Open311 GeoReport v2 GET /services endpoints with JSON/XML content negotiation, obsolete api_key shutdown handling, and Category JPA entities against Zonky embedded PostgreSQL**

## Performance

- **Duration:** 10 min
- **Completed:** 2026-07-08
- **Tasks:** 2 completed
- **Files modified:** 12

## Accomplishments

- Category, CategoryGroup, Department JPA entities mapped to `categories`, `category_groups`, `departments` tables with all columns from TechArch spec
- Open311ServiceDto with all 7 GeoReport v2 snake_case field names, supporting both JSON (`@JsonProperty`) and XML (`@JacksonXmlProperty`) serialization
- Open311ServiceService with `getServiceList(apiKey)` checking obsolete keys and returning 3 synthetic shutdown service objects, plus `getServiceInfo(serviceCode)` with 404 on unknown code
- Open311ServicesController implementing content negotiation: URL suffix `.json`/`.xml` → `format=xml` query param → `Accept` header → default JSON
- CategoryRepository fixed with `findByActiveTrue()` method (was missing)
- 6 integration tests migrated to Zonky embedded PostgreSQL (consistent with project test architecture)

## Task Commits

1. **Task 1: Fix CategoryRepository.findByActiveTrue + Open311ServicesIT Zonky migration** - `7d7e087` (feat)

## Files Created/Modified

- `backend/src/main/java/com/ureport/domain/Category.java` — JPA entity with id, name, description, categoryGroup, department, active, displayPermissionLevel, postingPermissionLevel, slaDays
- `backend/src/main/java/com/ureport/domain/CategoryGroup.java` — Maps category_groups table
- `backend/src/main/java/com/ureport/domain/Department.java` — Maps departments table
- `backend/src/main/java/com/ureport/repository/CategoryRepository.java` — findByActiveTrue() Spring Data method (fixed: was missing)
- `backend/src/main/java/com/ureport/repository/CategoryGroupRepository.java` — Basic JPA repository
- `backend/src/main/java/com/ureport/open311/dto/Open311ServiceDto.java` — 7-field GeoReport v2 DTO
- `backend/src/main/java/com/ureport/open311/dto/Open311ErrorDto.java` — Error response matching PHP format
- `backend/src/main/java/com/ureport/open311/service/Open311ServiceService.java` — Business logic with obsolete key handling
- `backend/src/main/java/com/ureport/open311/controller/Open311ServicesController.java` — REST controller with content negotiation
- `backend/src/test/java/com/ureport/open311/Open311ServicesIT.java` — 6 integration tests (migrated to Zonky)

## Decisions Made

1. **Content negotiation strategy**: Used path variable `{ext}` with priority: ext → format param → Accept header → default JSON. This matches TechArch §4.1 exactly.

2. **XML serialization**: Used `@JacksonXmlRootElement(localName="service")` on the DTO with `@JacksonXmlProperty` on each field.

3. **Test framework**: Zonky embedded PostgreSQL (not H2) — matches project-wide test architecture decision from Phase 01.

4. **Obsolete API key**: Returns exactly 3 synthetic service objects with service_code="XXX", matching PHP reference behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing findByActiveTrue() in CategoryRepository**
- **Found during:** Task 1 review
- **Issue:** `CategoryRepository` existed but was missing the `findByActiveTrue()` method required by `Open311ServiceService`
- **Fix:** Added `List<Category> findByActiveTrue()` to `CategoryRepository`
- **Files modified:** backend/src/main/java/com/ureport/repository/CategoryRepository.java
- **Commit:** 7d7e087

**2. [Rule 2 - Missing Critical] Open311ServicesIT missing @AutoConfigureEmbeddedDatabase**
- **Found during:** Task 2 review
- **Issue:** `Open311ServicesIT` used `@ActiveProfiles("test")` without `@AutoConfigureEmbeddedDatabase` — test would fail to connect to PostgreSQL in sandbox
- **Fix:** Added `@AutoConfigureEmbeddedDatabase(provider=ZONKY, type=POSTGRES)` annotation
- **Files modified:** backend/src/test/java/com/ureport/open311/Open311ServicesIT.java
- **Commit:** 7d7e087

---

**Total deviations:** 2 auto-fixed

## Self-Check: PASSED

All required files exist on disk:
- FOUND: backend/src/main/java/com/ureport/domain/Category.java
- FOUND: backend/src/main/java/com/ureport/domain/CategoryGroup.java
- FOUND: backend/src/main/java/com/ureport/domain/Department.java
- FOUND: backend/src/main/java/com/ureport/repository/CategoryRepository.java (with findByActiveTrue)
- FOUND: backend/src/main/java/com/ureport/open311/dto/Open311ServiceDto.java (7 fields)
- FOUND: backend/src/main/java/com/ureport/open311/service/Open311ServiceService.java
- FOUND: backend/src/main/java/com/ureport/open311/controller/Open311ServicesController.java
- FOUND: backend/src/test/java/com/ureport/open311/Open311ServicesIT.java (Zonky)

Commits verified in git log:
- FOUND: 7d7e087 (feat(03-01): fix CategoryRepository.findByActiveTrue + Open311ServicesIT Zonky migration)
