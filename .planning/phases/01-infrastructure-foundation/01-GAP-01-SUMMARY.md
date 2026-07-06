---
phase: 01-infrastructure-foundation
plan: GAP-01
subsystem: infra
tags: [spring-boot, maven, java, postgresql, bash, daytona, k8s]

# Dependency graph
requires: []
provides:
  - ".pivota/start-dev.sh rewritten to launch Spring Boot via mvn spring-boot:run"
  - "Java 21 + Maven apt-get pre-exec installed on first boot"
  - "DATABASE_URL normalization: mysql:// or raw postgresql:// → jdbc:postgresql://"
  - ".pivota/dev-script.meta.json updated with catalog_entry=null and agent_synthesis_reason"
affects: [all-phases]

# Tech tracking
tech-stack:
  added: [openjdk-21-jdk-headless (apt), maven (apt)]
  patterns: [native-sidecar-postgres, jdbc-url-normalization, mvn-spring-boot-run]

key-files:
  created: []
  modified:
    - .pivota/start-dev.sh
    - .pivota/dev-script.meta.json

key-decisions:
  - "Use mvn spring-boot:run (not docker compose up) — K8s sandbox has no Docker daemon"
  - "DATABASE_URL normalization: platform injects mysql:// scheme; script converts to jdbc:postgresql:// from PG* vars or application.yml default"
  - "SERVER_ADDRESS=0.0.0.0 env preamble ensures preview iframe can reach port 8080"
  - "apt-get installs openjdk-21-jdk-headless + maven in pre-exec if not present"
  - "catalog_entry=null in meta.json — this is agent-synthesized, not a catalog entry"

patterns-established:
  - "PRE_EXEC_SNIPPET pattern: idempotent apt-get installs for Java 21 + Maven"
  - "DATABASE_URL normalization pattern: detect non-jdbc:postgresql:// and reconstruct from PG* vars"

# Metrics
duration: 2min
completed: 2026-07-06
---

# Phase 1 GAP-01: Infrastructure Foundation GAP-01 Summary

**Rewrote `.pivota/start-dev.sh` from docker-compose to `mvn spring-boot:run` with Java 21 apt-get pre-exec and DATABASE_URL normalization for the Daytona K8s sandbox**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-06T18:44:37Z
- **Completed:** 2026-07-06T18:46:52Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Replaced `docker compose up` with `cd backend && mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.address=0.0.0.0"` in the EXEC_CMD retry loop
- Added PRE_EXEC_SNIPPET that installs `openjdk-21-jdk-headless` and `maven` via apt-get when not present on PATH
- Added DATABASE_URL normalization block that detects non-`jdbc:postgresql://` schemes (e.g. platform-injected `mysql://`) and constructs the correct JDBC URL from PG* environment variables, falling back to `application.yml` default
- Updated `dev-script.meta.json` with `catalog_entry=null`, correct inspection inputs (including `backend/pom.xml`), SHA-256 hash, and `agent_synthesis_reason` documenting the rationale

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite .pivota/start-dev.sh for Maven Spring Boot launch** - `4e9cbb0` (chore)
2. **Task 2: Update .pivota/dev-script.meta.json and commit both files** - `4e9cbb0` (chore — both files in one commit per plan spec)

**Plan metadata:** _(docs commit — see below)_

## Files Created/Modified

- `.pivota/start-dev.sh` — Rewrote from compose to Spring Boot native launch; added Java 21 + Maven pre-exec, DATABASE_URL normalization, SERVER_ADDRESS=0.0.0.0 binding
- `.pivota/dev-script.meta.json` — Updated: catalog_entry=null, inspection_inputs includes backend/pom.xml, agent_synthesis_reason explains compose→java-spring-direct switch

## Decisions Made

- **mvn spring-boot:run strategy:** The Daytona K8s sandbox has no Docker daemon, so `docker compose up` fails unconditionally. Running Spring Boot natively via the Maven plugin is the correct approach.
- **DATABASE_URL normalization:** The platform injects `DATABASE_URL=mysql://ureport:ureport@localhost:3306/ureport` (MySQL sidecar), but the Spring Boot app uses HikariCP with `org.postgresql.Driver` requiring `jdbc:postgresql://` scheme. The normalization block detects any non-`jdbc:postgresql://` value and reconstructs the URL from PG* env vars; with no PG* vars set, it falls back to `application.yml` default `jdbc:postgresql://localhost:5432/ureport`.
- **SERVER_ADDRESS=0.0.0.0:** Spring Boot reads `server.address` from this env var so the preview iframe (reaching the sandbox via external hostname) can connect to port 8080 past the loopback.
- **catalog_entry=null:** This script is agent-synthesized (not from the catalog), so catalog_entry must be null per the meta-format spec.

## Deviations from Plan

None — plan executed exactly as written. The DATABASE_URL normalization logic in the plan was already written to handle the `mysql://` injection scenario encountered in this environment.

## Issues Encountered

None - all verification checks passed on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- GAP-01 closure complete: EXEC_CMD no longer uses `docker compose up`
- Start-dev.sh passes `bash -n`, is chmod 755, and contains all required sections
- The DATABASE_URL normalization will correctly handle the platform's MySQL injection by falling back to the PostgreSQL application default
- Ready for Phase 2 or further verification via `01-UAT.md`

---
*Phase: 01-infrastructure-foundation*
*Completed: 2026-07-06*
