---
phase: 03-open311-georeport-v2-api
plan: GAP-01
subsystem: infra
tags: [spring-boot, maven, jdk21, dev-server, k8s-sandbox]

# Dependency graph
requires: []
provides:
  - "start-dev.sh launches Spring Boot backend via mvn spring-boot:run (no docker)"
  - "Idempotent JDK 21 + Maven install via apt-get with command -v guards"
  - "dev-script.meta.json with catalog_entry=null (agent-fallback)"
affects: [03-open311-georeport-v2-api]

# Tech tracking
tech-stack:
  added: []
  patterns: ["apt-get idempotent install with command -v guard before apt-get"]

key-files:
  created: []
  modified:
    - .pivota/start-dev.sh
    - .pivota/dev-script.meta.json

key-decisions:
  - "EXEC_CMD changed from docker compose up to mvn spring-boot:run — K8s sandbox has no Docker daemon"
  - "catalog_entry reset to null — docker-compose.yml describes legacy PHP stack, not the Spring Boot backend"
  - "INSTALL_CMD uses command -v guards for idempotency — safe to re-run without reinstalling if already present"

patterns-established:
  - "apt-get idempotent install: check command -v before apt-get install"

# Metrics
duration: 2min
completed: 2026-07-07
---

# Phase 3 GAP-01: Dev Server Gap Closure Summary

**start-dev.sh rewritten from docker-compose to `mvn spring-boot:run` with idempotent JDK 21 + Maven install, unblocking all 9 UAT tests in the K8s sandbox**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-07T02:26:47Z
- **Completed:** 2026-07-07T02:28:17Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Replaced `EXEC_CMD='docker compose up'` with `EXEC_CMD='cd /home/daytona/project/backend && mvn spring-boot:run'` — eliminates the "docker: command not found" failure
- Added idempotent `INSTALL_CMD` that checks `command -v java` and `command -v mvn` before running `apt-get install openjdk-21-jdk-headless maven`
- Set `LOCK_FILE_PATH=backend/pom.xml` and `INSTALL_PRESENCE_CHECK=/root/.m2/repository` for proper sentinel logic
- Added `export SERVER_ADDRESS=0.0.0.0` as safety net for Spring Boot sandbox preview reachability
- Updated `dev-script.meta.json` with `catalog_entry: null` and explanatory `gap_closure_note`

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite .pivota/start-dev.sh for Spring Boot / Maven** - `c16e301` (fix)
2. **Task 2: Update .pivota/dev-script.meta.json to agent-fallback catalog** - `2cb34f3` (chore)

**Plan metadata:** (docs commit pending)

## Files Created/Modified

- `.pivota/start-dev.sh` — EXEC_CMD changed to `mvn spring-boot:run`; INSTALL_CMD added for JDK 21 + Maven; SERVER_ADDRESS export added; all wrapper structure preserved
- `.pivota/dev-script.meta.json` — `catalog_entry` set to `null`, `generated_at` updated, `gap_closure_note` added

## Decisions Made

- Used `command -v java && java -version 2>&1 | grep -q "21"` guard for JDK install idempotency — checks both presence and version
- Kept all wrapper structure (version guard, tee logging, .env seeding, sentinel, retry loop, END PIVOTA PREAMBLE marker) verbatim per plan requirement
- Set `catalog_entry: null` to signal agent-fallback mode — the original compose catalog entry was incorrect for this Spring Boot project

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Gap is closed: `start-dev.sh` will now install JDK 21 + Maven and launch the Spring Boot backend on port 8080 (bound to `0.0.0.0`)
- UAT re-run should unblock Test 1 (dev server starts) and all 8 downstream Open311 endpoint tests
- No blockers for UAT re-run

## Self-Check: PASSED

All key files present on disk. All task commits verified in git history.

---
*Phase: 03-open311-georeport-v2-api*
*Completed: 2026-07-07*
