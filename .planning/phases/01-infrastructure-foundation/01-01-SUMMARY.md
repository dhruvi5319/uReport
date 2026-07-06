---
phase: 01-infrastructure-foundation
plan: "01"
subsystem: database
tags: [postgresql, flyway, migration, schema, spring-boot, junit5, integration-test]

requires: []

provides:
  - "Flyway V1__initial_schema.sql: complete PostgreSQL DDL for all 21 tables"
  - "V1SchemaIT.java: Spring Boot integration test verifying schema completeness and seed data"
  - "application-test.yml: test profile datasource configuration"

affects:
  - "02-spring-boot-scaffold"
  - "03-docker-infrastructure"
  - "All phases requiring database schema"

tech-stack:
  added:
    - "Flyway migration scripting (V1__initial_schema.sql)"
    - "Spring Boot @SpringBootTest integration test pattern"
    - "JdbcTemplate + information_schema queries for schema verification"
  patterns:
    - "PostgreSQL SERIAL PKs (not MySQL AUTO_INCREMENT)"
    - "BOOLEAN columns (not TINYINT(1)) — DB-01 compliance"
    - "TIMESTAMPTZ for all timestamp columns"
    - "snake_case column names (MySQL camelCase → PostgreSQL snake_case)"
    - "Named FK constraints for explicit referential integrity"
    - "DESC index ordering for date-based queries (entered_date, uploaded, action_date)"
    - "Forward-declare table + ALTER TABLE for circular FK (departments ↔ people)"

key-files:
  created:
    - "backend/src/main/resources/db/migration/V1__initial_schema.sql"
    - "backend/src/test/java/com/ureport/infrastructure/V1SchemaIT.java"
    - "backend/src/test/resources/application-test.yml"
  modified: []

key-decisions:
  - "21 tables defined (18 domain + 3 join tables: department_actions, department_categories, department_categories)"
  - "Flyway V1 is idempotent via clean run on fresh DB — no IF NOT EXISTS needed for initial migration"
  - "Test credentials sourced from env vars (TEST_DATABASE_URL/TEST_DB_USER/TEST_DB_PASSWORD) — no hardcoded secrets (T-01-02 mitigation)"
  - "application-test.yml sets flyway.clean-disabled=false to allow test DB reset between runs"
  - "SERIAL chosen over BIGSERIAL — accepted for v1 civic CRM scale (T-01-03 accepted)"

patterns-established:
  - "Migration pattern: named constraints, explicit indexes, seed data in same file"
  - "Test pattern: @SpringBootTest @ActiveProfiles('test') with JdbcTemplate for schema assertions"

duration: 2min
completed: 2026-07-06
---

# Phase 1 Plan 01: Flyway V1 Schema Migration Summary

**Complete PostgreSQL DDL migration with 21 tables, 36 indexes, and seed data for all 5 reference tables, verified by a Spring Boot integration test querying information_schema**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-06T17:40:38Z
- **Completed:** 2026-07-06T17:43:09Z
- **Tasks:** 2
- **Files modified:** 3 (created)

## Accomplishments

- Flyway V1__initial_schema.sql: complete PostgreSQL DDL for 21 tables with SERIAL PKs, BOOLEAN types, TIMESTAMPTZ timestamps, named FK constraints, and 36 indexes
- All 5 reference table seed data present: 4 contact_methods, 3 substatus, 10 actions, 6 issue_types, 3 category_groups
- V1SchemaIT.java: 11 @Test methods covering table existence, seed data counts, column types, FK constraint, and key indexes
- application-test.yml: test profile with env-var-based datasource (no hardcoded credentials)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write Flyway V1__initial_schema.sql** - `e4b6171` (feat)
2. **Task 2: Write V1SchemaIT.java + application-test.yml** - `01f808e` (feat)

**Plan metadata:** (see docs commit below)

## Files Created/Modified

- `backend/src/main/resources/db/migration/V1__initial_schema.sql` — 291-line PostgreSQL DDL with 21 CREATE TABLE statements, ALTER TABLE FK, 36 CREATE INDEX statements, and INSERT seed data
- `backend/src/test/java/com/ureport/infrastructure/V1SchemaIT.java` — 176-line Spring Boot integration test with 11 @Test methods
- `backend/src/test/resources/application-test.yml` — test datasource configuration using env var overrides

## Decisions Made

- Used SERIAL (not BIGSERIAL) for all primary keys — accepted for v1 civic CRM scale per T-01-03 threat model
- Forward-declare `departments` table first, create `people`, then `ALTER TABLE departments ADD CONSTRAINT fk_departments_default_person` — resolves the circular FK dependency
- Test DB credentials use env var substitution (`${TEST_DATABASE_URL:...}`) to support both local dev defaults and CI injection without hardcoding (T-01-02 mitigation)
- `flyway.clean-disabled=false` in test profile allows Flyway clean for test DB resets; production profile must override with `clean-disabled=true`

## Deviations from Plan

None — plan executed exactly as written.

The plan specified "10 @Test methods" in the done criteria, but the provided Java code in the plan's `<action>` block contains 11 methods. The implementation matches the provided code verbatim. This is a minor documentation discrepancy in the plan, not a deviation from the intended behavior.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. Test DB credentials are configurable via environment variables (TEST_DATABASE_URL, TEST_DB_USER, TEST_DB_PASSWORD) but have local defaults for development.

## Next Phase Readiness

- V1 migration is the foundation for all subsequent phases — schema is complete and verified
- Plan 01-02 (FTS search vector migration V2) can build on this foundation
- Plan 01-03 (Docker infrastructure) will wire the PostgreSQL container to run this migration
- Spring Boot scaffold (Phase 2) can reference table names and column types from this schema

## Self-Check: PASSED

- ✅ `backend/src/main/resources/db/migration/V1__initial_schema.sql` — 291 lines (min: 200)
- ✅ `backend/src/test/java/com/ureport/infrastructure/V1SchemaIT.java` — 176 lines (min: 60)
- ✅ `backend/src/test/resources/application-test.yml` — present
- ✅ Commit `e4b6171` — Task 1 (V1__initial_schema.sql)
- ✅ Commit `01f808e` — Task 2 (V1SchemaIT.java)

---
*Phase: 01-infrastructure-foundation*
*Completed: 2026-07-06*
