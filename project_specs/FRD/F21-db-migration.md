---

## F21: Database Migration — MySQL to PostgreSQL (Flyway)

**Priority:** P0 — Critical

### Description

The existing MySQL schema (18 tables, all data) is migrated to PostgreSQL using Flyway versioned migration scripts. The PostgreSQL schema preserves all tables, columns, constraints, and relationships from the MySQL schema. No data may be lost; no table or column may be dropped. An additional `search_vector` tsvector column is added to `tickets` (additive, non-destructive). All data from the existing production MySQL database is imported via a one-time migration script.

### Terminology

- **Flyway** — Database schema migration tool. Scans `src/main/resources/db/migration/` for `V{n}__{description}.sql` files; executes each once in version order; tracks applied migrations in `flyway_schema_history` table.
- **V1__initial_schema.sql** — The baseline Flyway migration that creates all 18 tables in PostgreSQL.
- **V2__search_vector.sql** — Adds `search_vector` column, GIN index, and trigger to `tickets` table.
- **Migration validation script** — A script run after data import that verifies row counts between MySQL export and PostgreSQL for all 18 tables.
- **Type mapping** — Converting MySQL data types to PostgreSQL equivalents (see table below).

### Flyway Migration Files

| File | Contents |
|---|---|
| `V1__initial_schema.sql` | All 18 tables with PKs, FKs, unique constraints, indexes |
| `V2__search_vector.sql` | `tickets.search_vector` tsvector column + GIN index + update trigger |
| `V3__seed_data.sql` | Seed data inserts (contactMethods, substatus, actions, issueTypes, categoryGroups) |
| `R__procedures.sql` | Repeatable migration: utility functions if needed |

### Data Type Mapping (MySQL → PostgreSQL)

| MySQL Type | PostgreSQL Type | Notes |
|---|---|---|
| `INT UNSIGNED AUTO_INCREMENT` | `SERIAL` or `INTEGER GENERATED ALWAYS AS IDENTITY` | PK sequences |
| `INT UNSIGNED` (FK) | `INTEGER` | FK columns |
| `TINYINT(1) UNSIGNED` / `BOOL` | `BOOLEAN` | `0`→`false`, `1`→`true` |
| `TINYINT UNSIGNED` | `SMALLINT` | e.g., `categoryGroups.ordering` |
| `VARCHAR(n)` | `VARCHAR(n)` | Direct mapping |
| `TEXT` | `TEXT` | Direct mapping |
| `DATETIME` | `TIMESTAMP` | `enteredDate`, `actionDate` |
| `TIMESTAMP` | `TIMESTAMPTZ` | `lastModified`, `uploaded`, `closedDate` |
| `FLOAT(17,14)` | `DOUBLE PRECISION` | `tickets.latitude`, `tickets.longitude` |
| `ENUM('a','b','c')` | `VARCHAR(n) CHECK (col IN ('a','b','c'))` | Or custom `CREATE TYPE` |
| `POINT` | `POINT` | `geoclusters.center`; native PostgreSQL POINT type |
| `TINYINT UNSIGNED` (ordering) | `SMALLINT` | Non-nullable variants |

### 18 Tables in Scope for Migration

| Table | Notes |
|---|---|
| `people` | Core person entity |
| `departments` | Organizational units |
| `peopleEmails` | Email addresses with notification flag |
| `peoplePhones` | Phone numbers |
| `peopleAddresses` | Physical addresses |
| `contactMethods` | Contact method lookup (seeded) |
| `clients` | Open311 API clients |
| `substatus` | Substatus lookup (seeded) |
| `actions` | Action type lookup (seeded) |
| `categoryGroups` | Category groupings (seeded) |
| `categories` | Service request categories |
| `category_action_responses` | Per-category response templates |
| `department_actions` | Allowed actions per department (join table) |
| `department_categories` | Department-category associations (join table) |
| `tickets` | Core ticket entity |
| `issueTypes` | Issue type lookup (seeded) |
| `ticketHistory` | Ticket action history |
| `media` | Photo attachments |
| `bookmarks` | Saved searches |
| `geoclusters` | Pre-computed geo clusters |
| `ticket_geodata` | Per-ticket cluster membership |

*(Note: `version` table from MySQL is not migrated; Flyway provides its own version tracking.)*

### V1 Schema Notes (PostgreSQL-Specific)

1. **ENUM types**: MySQL ENUMs are converted to PostgreSQL `VARCHAR(n)` columns with `CHECK` constraints. Example:
   ```sql
   role VARCHAR(30) CHECK (role IN ('admin', 'staff', 'public'))
   ```
2. **AUTO_INCREMENT**: Replaced by PostgreSQL `SERIAL` or `GENERATED ALWAYS AS IDENTITY`:
   ```sql
   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
   ```
3. **FK circular dependency** (`departments` ↔ `people`): Handled by creating both tables, then adding the FK in a subsequent `ALTER TABLE` (same order as MySQL script using `foreign_key_checks=0` equivalent).
4. **`POINT` type**: PostgreSQL native `POINT` type used. Spatial index: `CREATE INDEX idx_geoclusters_center ON geoclusters USING GIST (center)`.
5. **`CURRENT_TIMESTAMP`**: Same in PostgreSQL; `DEFAULT CURRENT_TIMESTAMP` works as-is.
6. **`bool` type**: PostgreSQL `BOOLEAN` with default `false` or `true` as appropriate.
7. **Case sensitivity**: PostgreSQL unquoted identifiers are lowercase. All column names in the PHP app were mixed-case; the Spring Boot JPA entity field mappings use `@Column(name = "camelCaseName")` to preserve the original column names with quoted identifiers.

### V2 Search Vector Migration

```sql
-- V2__search_vector.sql
ALTER TABLE tickets ADD COLUMN search_vector tsvector;

CREATE INDEX idx_tickets_search_vector ON tickets USING GIN (search_vector);

CREATE OR REPLACE FUNCTION update_ticket_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.id::text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_vector
BEFORE INSERT OR UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION update_ticket_search_vector();

-- Backfill search_vector for existing rows
UPDATE tickets SET search_vector =
    setweight(to_tsvector('english', coalesce(id::text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'B');
```

### One-Time Data Migration Process

1. **Export MySQL data:** `mysqldump --no-create-info --complete-insert {database} > data_export.sql`
2. **Convert SQL:** A Python/sed conversion script translates MySQL INSERT syntax to PostgreSQL-compatible syntax:
   - Remove MySQL backtick quoting → double-quote or no quotes
   - Convert `\0` TINYINT to `false`/`true` boolean literals
   - Convert `0000-00-00 00:00:00` dates to `NULL`
   - Handle MySQL-specific functions (`NOW()` is compatible; others handled case-by-case)
3. **Import to PostgreSQL:** `psql {database} < data_converted.sql`
4. **Backfill search_vector:** Run UPDATE statement (see V2 above).
5. **Run validation script:** Compare row counts table by table between MySQL and PostgreSQL; fail if any mismatch.

### Validation Script Requirements

```
For each of the 18 tables:
  mysql_count = SELECT COUNT(*) FROM {table} [on source MySQL]
  pg_count    = SELECT COUNT(*) FROM {table} [on target PostgreSQL]
  assert mysql_count == pg_count, "Row count mismatch on {table}: MySQL={mysql_count}, PG={pg_count}"

FK integrity check: SELECT COUNT(*) should be 0 for each FK relationship where referenced ID does not exist.
```

### Constraints

- Zero rows lost: row count equality required for all 18 tables.
- Zero columns dropped: every column in mysql.sql must exist in the PostgreSQL schema.
- Zero FK violations: all foreign key constraints must be satisfied after data import.
- Flyway `baseline` is not used; clean PostgreSQL instance bootstrapped purely from `flyway migrate`.
- All future schema changes must be implemented as new Flyway versioned migrations (`V4__`, `V5__`, etc.).

### Error States

| Scenario | Resolution |
|---|---|
| Row count mismatch on table | Investigate conversion script; re-run import |
| FK constraint violation in PostgreSQL | Find orphaned row; either fix reference or null the FK (data quality issue) |
| Flyway checksum mismatch | Never modify applied migration files; create a new migration to fix |
| ENUM conversion error | Verify CHECK constraint values match all values in source data |
| POINT conversion error | Verify geoclusters.center data format; may need coordinate extraction |

### API Surface

None — migration is infrastructure/ops only.

### Schema Surface

All 18 tables — full PostgreSQL DDL in `Y0-schema.md`.
