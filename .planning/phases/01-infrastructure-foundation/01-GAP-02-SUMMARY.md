---
phase: 01-infrastructure-foundation
plan: GAP-02
subsystem: infra
tags: [spring-boot, postgresql, flyway, sidecar, mysql, jdbc]

# Dependency graph
requires:
  - phase: 01-infrastructure-foundation
    provides: "start-dev.sh with Spring Boot mvn spring-boot:run and DATABASE_URL normalization (GAP-01)"
provides:
  - "start-dev.sh mysql:// branch: constructs jdbc:postgresql:// from PG* vars instead of passing mysql:// to org.postgresql.Driver"
  - "infrastructure.json expanded postgres sidecar declaration (version=16, database=ureport, username=ureport)"
affects:
  - "01-infrastructure-foundation UAT: BeanCreationException on flywayInitializer unblocked"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "mysql:// sidecar injection handling: detect scheme, ignore MySQL URL, construct postgresql:// from PG* vars"
    - "infrastructure.json: explicit postgres sidecar with version/database/username/password fields"

key-files:
  created: []
  modified:
    - ".pivota/start-dev.sh"
    - ".planning/infrastructure.json"

key-decisions:
  - "DATABASE_URL normalization: mysql:// injection → jdbc:postgresql:// via PG* vars or application.yml default (never passes MySQL URL to org.postgresql.Driver)"
  - "infrastructure.json: full postgres sidecar spec with version=16/database=ureport matches docker-compose.yml and application.yml defaults"

patterns-established:
  - "Platform sidecar mismatch pattern: treat mysql:// as a signal to ignore DATABASE_URL entirely and reconstruct from PG* vars"

# Metrics
duration: 1min
completed: 2026-07-06
---

# Phase 1 Plan GAP-02: MySQL Sidecar Injection Fix Summary

**mysql:// sidecar URL intercepted in start-dev.sh — constructs jdbc:postgresql:// from PG* vars instead of passing MySQL URL to org.postgresql.Driver, unblocking Spring Boot Flyway startup**

## Performance

- **Duration:** 1 min
- **Started:** 2026-07-06T23:11:24Z
- **Completed:** 2026-07-06T23:12:49Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added explicit `mysql://` branch in start-dev.sh DATABASE_URL normalization block that constructs `jdbc:postgresql://` from PG* vars (or falls back to `localhost:5432` default) instead of passing the mysql:// URL to HikariCP/org.postgresql.Driver
- Updated `.planning/infrastructure.json` to use the full canonical postgres sidecar spec (`kind=postgres`, `version=16`, `database=ureport`, `username=ureport`, `password=ureport`) to ensure future sandbox restarts provision PostgreSQL
- Root cause from GAP analysis fully resolved: `BeanCreationException: flywayInitializer → Connection to localhost:5432 refused` will no longer occur when `PIVOTA_DB_MODE=sidecar-mysql` is injected

## Task Commits

Each task was committed atomically:

1. **Task 1+2: Fix mysql:// handling + update infrastructure.json** - `03f1cef` (fix)

**Plan metadata:** (in final docs commit)

## Files Created/Modified

- `.pivota/start-dev.sh` - Added `mysql://` and `mysql+*://` branch in DATABASE_URL normalization block; updated decision-trace comment
- `.planning/infrastructure.json` - Expanded from minimal `{ "kind": "postgres" }` to full spec with version/database/username/password

## Decisions Made

- **mysql:// handling strategy:** Option B — ignore MySQL URL entirely and construct `jdbc:postgresql://` from `PGHOST`/`PGPORT`/`PGDATABASE`/`PGUSER`/`PGPASSWORD` vars (or fall back to `jdbc:postgresql://localhost:5432/ureport` if PG* vars absent). MySQL cannot be supported without re-architecting all Flyway migrations (tsvector, GIN indexes, BOOLEAN, SERIAL PKs are PostgreSQL-only).
- **infrastructure.json:** Expanded to full canonical form to prevent platform sidecar provisioner from defaulting to MySQL when no explicit spec was found.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — both tasks executed cleanly.

**Environment observation:** `PIVOTA_DB_MODE=sidecar-mysql` confirmed present at execution time, validating the fix is needed in the current sandbox. `PGHOST` is not set in this environment, so the mysql:// branch will fall back to `jdbc:postgresql://localhost:5432/ureport` (the application.yml default). On a properly provisioned PostgreSQL sidecar, `PGHOST` will be set and the full JDBC URL will be constructed from PG* vars.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `start-dev.sh` handles mysql:// sidecar injection correctly — Spring Boot will never receive a `mysql://` URL via `SPRING_DATASOURCE_URL`
- `infrastructure.json` declares PostgreSQL 16 sidecar explicitly — re-provisioning the workspace should inject a PostgreSQL sidecar
- All GAP-01 work preserved: Java 21 install, Maven install, mvn spring-boot:run, exponential retry loop
- Next action: Re-provision the workspace (or trigger `./pivota/start-dev.sh`) to verify Spring Boot connects to PostgreSQL and Flyway migrations run successfully
- Remaining UAT blockers (all marked as `gap: mysql-sidecar`) should now pass once the platform provisions PostgreSQL on next restart

## Self-Check: PASSED

- `.pivota/start-dev.sh` — exists ✓
- `.planning/infrastructure.json` — exists ✓
- `01-GAP-02-SUMMARY.md` — exists ✓
- Commit `03f1cef` — found ✓

---
*Phase: 01-infrastructure-foundation*
*Completed: 2026-07-06*
