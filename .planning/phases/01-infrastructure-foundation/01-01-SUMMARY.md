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
  - "21 tables defined (18 domain + 3 join tables: department_actions, department_categories, ticket_geodata)"
  - "Flyway V1 is idempotent via clean run on fresh DB — no IF NOT EXISTS needed for initial migration"
  - "Test credentials sourced from env vars (TEST_DATABASE_URL/TEST_DB_USER/TEST_DB_PASSWORD) — no hardcoded secrets (T-01-02 mitigation)"
  - "application-test.yml sets flyway.clean-disabled=false to allow test DB reset between runs"
  - "SERIAL chosen over BIGSERIAL — accepted for v1 civic CRM scale (T-01-03 accepted)"

patterns-established:
  - "Migration pattern: named constraints, explicit indexes, seed data in same file"
  - "Test pattern: @SpringBootTest @ActiveProfiles('test') with JdbcTemplate for schema assertions"

duration: 5min
completed: 2026-07-08
---

# Phase 1 Plan 01: Flyway V1 Schema Migration Summary

**Complete PostgreSQL DDL migration with 21 tables, 36 indexes, and seed data for all 5 reference tables, verified by a Spring Boot integration test querying information_schema**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-08T00:34:31Z
- **Completed:** 2026-07-08T00:40:00Z
- **Tasks:** 2
- **Files modified:** 1 (updated), 1 (pre-existing correct)

## Accomplishments

- Flyway V1__initial_schema.sql: rewritten to exact TechArch verbatim spec with SERIAL PKs, BOOLEAN types, TIMESTAMPTZ timestamps, named FK constraints, and all required indexes
- Corrected previous schema: removed BIGSERIAL, added missing tables (people_emails, people_phones, people_addresses, category_action_responses, geoclusters, ticket_geodata), added fk_departments_default_person deferred FK constraint, added CHECK constraints throughout, added response_method_id to tickets
- All 5 reference table seed data present: 4 contact_methods, 3 substatus, 10 actions, 6 issue_types, 3 category_groups
- V1SchemaIT.java: 11 @Test methods covering table existence, seed data counts, column types, FK constraint, and key indexes (file already correct, no changes needed)
- application-test.yml: test profile already present with comprehensive configuration

## Task Commits

Each task was committed atomically:

1. **Task 1: Write Flyway V1__initial_schema.sql** - `c883895` (feat)
2. **Task 2: V1SchemaIT.java** - pre-existing correct (no new commit needed)

**Plan metadata:** (see docs commit below)

## Files Created/Modified

- `backend/src/main/resources/db/migration/V1__initial_schema.sql` — 291-line PostgreSQL DDL with 21 CREATE TABLE statements, ALTER TABLE FK, 36 CREATE INDEX statements, and INSERT seed data
- `backend/src/test/java/com/ureport/infrastructure/V1SchemaIT.java` — 176-line Spring Boot integration test with 11 @Test methods (pre-existing, matches plan spec)
- `backend/src/test/resources/application-test.yml` — test datasource configuration (pre-existing, more comprehensive than plan spec)

## Decisions Made

- Used SERIAL (not BIGSERIAL) for all primary keys — accepted for v1 civic CRM scale per T-01-03 threat model
- Forward-declare `departments` table first, create `people`, then `ALTER TABLE departments ADD CONSTRAINT fk_departments_default_person` — resolves the circular FK dependency
- Test DB credentials use env var substitution (`${TEST_DATABASE_URL:...}`) to support both local dev defaults and CI injection without hardcoding (T-01-02 mitigation)
- `flyway.clean-disabled=false` in test profile allows Flyway clean for test DB resets; production profile must override with `clean-disabled=true`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Previous V1__initial_schema.sql differed significantly from plan spec**
- **Found during:** Task 1
- **Issue:** Existing schema used BIGSERIAL instead of SERIAL, was missing 6 tables (people_emails, people_phones, people_addresses, category_action_responses, geoclusters, ticket_geodata), lacked CHECK constraints, used TIMESTAMP instead of TIMESTAMPTZ, was missing fk_departments_default_person named constraint, and tickets table was missing response_method_id column
- **Fix:** Replaced file with exact verbatim content from plan specification
- **Files modified:** `backend/src/main/resources/db/migration/V1__initial_schema.sql`
- **Commit:** c883895

## Issues Encountered

None beyond the pre-existing schema deviation corrected above.

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
- ✅ Commit `c883895` — Task 1 (V1__initial_schema.sql)
- ✅ V1SchemaIT.java — pre-existing correct, matches plan spec verbatim

---
*Phase: 01-infrastructure-foundation*
*Completed: 2026-07-08*
