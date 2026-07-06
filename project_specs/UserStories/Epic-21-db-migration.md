## Epic 21: Database Migration — MySQL to PostgreSQL via Flyway (F21)

The existing MySQL schema (18 tables, all data) must be migrated to PostgreSQL using Flyway versioned migration scripts. No data may be lost and no table or column may be dropped.

---

### US-21.1: Migrate the Full MySQL Schema to PostgreSQL via Flyway
**As a** Jordan Calloway (System Administrator), **I want to** bootstrap a fresh PostgreSQL database by running `flyway migrate`, **so that** the system can be installed in any environment without manual SQL scripting or tribal knowledge.

**Acceptance Criteria:**
- [ ] Flyway migration scripts are stored in `src/main/resources/db/migration/` as `V{n}__description.sql`
- [ ] `V1__initial_schema.sql` recreates all 18 MySQL tables in PostgreSQL with equivalent types (INT → INTEGER, VARCHAR → VARCHAR, TINYINT(1) → BOOLEAN, etc.)
- [ ] All foreign key constraints, indexes, and auto-increment sequences are recreated
- [ ] `V2__search_vector.sql` adds the `search_vector` tsvector column and GIN index to `tickets` (additive — no existing columns removed)
- [ ] A clean PostgreSQL instance can be fully bootstrapped from scratch via `flyway migrate`
- [ ] Flyway migration history contains the complete schema evolution

**Priority:** P0 | **Feature Ref:** F21

---

### US-21.2: Migrate All Production Data from MySQL to PostgreSQL with Zero Loss
**As a** Jordan Calloway (System Administrator), **I want to** migrate all existing MySQL data to PostgreSQL and verify row counts match, **so that** every existing ticket, person, and case history entry is preserved after the modernization go-live.

**Acceptance Criteria:**
- [ ] A one-time data migration script handles `mysqldump` → `pg_restore` pipeline for all 18 tables
- [ ] Row count equality is verified between MySQL export and PostgreSQL import for all 18 tables
- [ ] 0 rows lost and 0 foreign key constraint violations in PostgreSQL after migration
- [ ] Existing stored media file paths and database records are preserved (path structure unchanged from PHP implementation)
- [ ] A migration validation script confirms row counts, data type integrity, and constraint satisfaction
- [ ] All data type mapping decisions are documented (e.g., TINYINT(1) as BOOLEAN, TEXT as TEXT)

**Priority:** P0 | **Feature Ref:** F21

---
