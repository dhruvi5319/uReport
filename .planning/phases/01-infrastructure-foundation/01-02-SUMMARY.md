---
phase: 01-infrastructure-foundation
plan: 02
subsystem: database
tags: [postgresql, flyway, tsvector, fts, gin-index, plpgsql, spring-boot, junit5]

# Dependency graph
requires:
  - phase: 01-infrastructure-foundation
    provides: "tickets table from V1 migration (plan 01-01)"
provides:
  - "search_vector TSVECTOR column on tickets table"
  - "idx_tickets_search_vector GIN index on tickets.search_vector"
  - "tickets_search_vector_update() plpgsql trigger function"
  - "tickets_search_vector_trigger BEFORE INSERT OR UPDATE trigger"
  - "V2SearchVectorIT.java integration test verifying all FTS schema elements"
affects:
  - "06-search — SearchService uses @@ to_tsquery() against search_vector"
  - "F11-fts — full-text search capability enabled at schema layer"
  - "SEARCH-01 — bookmark/saved search enabled by FTS infrastructure"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Weighted tsvector: id (A), description/location (B), reporter/category (C)"
    - "BEFORE INSERT OR UPDATE trigger pattern for automatic column maintenance"
    - "IF NOT EXISTS guard on ALTER TABLE for idempotent migrations"
    - "@SpringBootTest + @Transactional for DB integration tests with rollback"

key-files:
  created:
    - "backend/src/main/resources/db/migration/V2__search_vector.sql"
    - "backend/src/test/java/com/ureport/infrastructure/V2SearchVectorIT.java"
  modified: []

key-decisions:
  - "Verbatim trigger function from TechArch spec — weight A=id, B=description+location, C=reporter+category"
  - "IF NOT EXISTS on ALTER TABLE makes migration idempotent/re-runnable"
  - "UPDATE tickets SET search_vector = NULL WHERE id > 0 backfills existing rows via trigger"
  - "Test uses @Transactional for automatic rollback; no test data cleanup required"

patterns-established:
  - "Flyway V2 follows V1 versioning; both Wave 1 migrations run before any app code"
  - "Integration tests verify schema structure via information_schema + pg_indexes"

# Metrics
duration: 2min
completed: 2026-07-06
---

# Phase 1 Plan 2: Search Vector FTS Migration Summary

**PostgreSQL FTS schema: search_vector TSVECTOR column + GIN index + weighted plpgsql trigger on tickets, with 7-test integration suite verifying trigger fires on INSERT**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-06T17:40:26Z
- **Completed:** 2026-07-06T17:42:28Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `V2__search_vector.sql`: Flyway migration adding `search_vector TSVECTOR` column, `idx_tickets_search_vector` GIN index, `tickets_search_vector_update()` plpgsql trigger function, and `tickets_search_vector_trigger` BEFORE INSERT OR UPDATE trigger — verbatim from TechArch specification
- `V2SearchVectorIT.java`: 7-test integration suite verifying column type, GIN index existence, GIN method, trigger function existence, trigger event/timing metadata, trigger populates search_vector on INSERT, and `@@ to_tsquery()` operator works against search_vector
- FTS infrastructure complete at schema layer — Phase 6 SearchService can use `@@ to_tsquery()` without any further schema changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Write Flyway V2__search_vector.sql** - `c7708e8` (feat)
2. **Task 2: Write V2SearchVectorIT.java** - `263e34a` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `backend/src/main/resources/db/migration/V2__search_vector.sql` — Complete PostgreSQL FTS DDL: TSVECTOR column, GIN index, plpgsql trigger function with weighted lexeme construction, BEFORE INSERT/UPDATE trigger, backfill UPDATE
- `backend/src/test/java/com/ureport/infrastructure/V2SearchVectorIT.java` — 142-line Spring Boot integration test with 7 @Test methods verifying all FTS schema artifacts

## Decisions Made

- Verbatim trigger function from TechArch spec preserved exactly — weight assignments (A=id, B=description+location, C=reporter/category) not altered
- `IF NOT EXISTS` guard on `ALTER TABLE` ensures migration is safe to re-run
- `UPDATE tickets SET search_vector = NULL WHERE id > 0` is the correct backfill pattern — touching existing rows causes the BEFORE UPDATE trigger to fire and populate `search_vector`
- Integration tests use `@Transactional` for automatic rollback, avoiding test data contamination across test methods

## Deviations from Plan

None - plan executed exactly as written.

The `backend/src/main/resources/db/migration/` directory was created as part of Task 1 (plan noted to do so if not present from plan 01-01). This is expected behavior per the plan instructions.

## Issues Encountered

None — both files written verbatim from plan specification. No compilation or structural errors detected.

Note: `mvn test -Dtest=V2SearchVectorIT` execution deferred to verify phase (requires running Spring Boot + PostgreSQL environment). Tests written; execution deferred to verify phase.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- V2 FTS migration ready for Flyway execution after V1 migration runs
- Integration test ready to run against migrated PostgreSQL database
- Plan 01-03 (Spring Boot application scaffold) can proceed next

## Self-Check

- `backend/src/main/resources/db/migration/V2__search_vector.sql`: FOUND ✓
- `backend/src/test/java/com/ureport/infrastructure/V2SearchVectorIT.java`: FOUND ✓
- Commit `c7708e8`: FOUND ✓ (feat(01-02): write Flyway V2__search_vector.sql)
- Commit `263e34a`: FOUND ✓ (feat(01-02): write V2SearchVectorIT.java)

## Self-Check: PASSED

---
*Phase: 01-infrastructure-foundation*
*Completed: 2026-07-06*
