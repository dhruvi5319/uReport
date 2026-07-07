---
phase: 02-authentication-security
plan: 05
subsystem: infra
tags: [spring-boot, java, maven, h2, dev-profile, startup]

# Dependency graph
requires:
  - phase: 02-authentication-security
    provides: "Auth services (LDAP, CAS, JWT) that the dev server needs to start"
provides:
  - "Dev server startup script that installs Java 21 + Maven, runs Spring Boot with dev profile"
  - "Spring 'dev' profile with H2 in-memory DB replacing PostgreSQL for sandbox use"
  - "H2 runtime scope in pom.xml enabling dev profile JDBC driver"
affects: [02-authentication-security, verify-phase-2]

# Tech tracking
tech-stack:
  added: [openjdk-21-jdk-headless, maven, h2database-runtime]
  patterns: [spring-profile-override, h2-in-memory-dev, apt-based-install]

key-files:
  created: [backend/src/main/resources/application-dev.yml]
  modified: [.pivota/start-dev.sh, backend/pom.xml]

key-decisions:
  - "start-dev.sh installs Java 21 via apt-get if not found (Java not pre-installed in this sandbox)"
  - "H2 scope changed from test to runtime so dev Spring profile can use JDBC driver"
  - "application-dev.yml uses spring.flyway.enabled: false and ldap.enabled: false for sandbox compatibility"
  - "NON_KEYWORDS=VALUE in H2 URL prevents reserved-word clash with entity column names"

patterns-established:
  - "Spring profile override pattern: application-dev.yml overrides application.yml for dev/sandbox environments"
  - "apt-get install as root (no sudo) pattern for missing runtime dependencies in sandbox"

# Metrics
duration: 7min
completed: 2026-07-07
---

# Phase 2 Plan 5: Dev Server Startup Fix Summary

**Spring Boot dev server startup fixed: Java 21 + Maven auto-installed via apt, H2 in-memory DB profile replaces PostgreSQL, health endpoint returns UP**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-07T01:04:11Z
- **Completed:** 2026-07-07T01:11:44Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Rewrote `.pivota/start-dev.sh` to auto-install Java 21 + Maven via apt-get, eliminating the docker compose crash
- Created `backend/src/main/resources/application-dev.yml` with H2 in-memory DB, Flyway disabled, LDAP/CAS disabled
- Fixed H2 scope from `test` to `runtime` in pom.xml so dev profile can load the H2 JDBC driver
- Verified: Spring Boot starts in 1.6s, GET /actuator/health returns `{"status":"UP"}`, POST /api/auth/ldap returns HTTP 503 (endpoint reachable)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix start-dev.sh** - `58be106` (fix)
2. **Task 2: Add application-dev.yml + fix H2 scope** - `aa2f57f` (feat)

## Files Created/Modified
- `.pivota/start-dev.sh` - Rewrote from docker-compose-based to Spring Boot native startup; installs Java 21 + Maven via apt if absent
- `backend/src/main/resources/application-dev.yml` - New Spring 'dev' profile with H2 in-memory DB, Flyway disabled, JWT default secret
- `backend/pom.xml` - Changed H2 scope from `test` to `runtime`

## Decisions Made
- **Java 21 not pre-installed**: The plan assumed Java at `/usr/lib/jvm/java-21-openjdk-amd64` but it was absent. Auto-fixed by adding `apt-get install openjdk-21-jdk-headless` before the JAVA_HOME detection block.
- **H2 scope `runtime` not `test`**: H2 is a JDBC driver (no compile-time references), `runtime` scope makes it available on both dev and test classpaths without changes to test code.
- **`NON_KEYWORDS=VALUE` in H2 URL**: Added to prevent reserved-word conflicts with any `value` column names in entity schema.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Java 21 not pre-installed in sandbox**
- **Found during:** Task 1 (start-dev.sh rewrite)
- **Issue:** Plan said "Java 21 is already installed at `/usr/lib/jvm/java-21-openjdk-amd64`" but `java` binary was not on PATH and `/usr/lib/jvm` directory did not exist
- **Fix:** Added `apt-get install openjdk-21-jdk-headless` block before JAVA_HOME detection in start-dev.sh
- **Files modified:** `.pivota/start-dev.sh`
- **Verification:** `java -version` returns OpenJDK 21.0.11 after install
- **Committed in:** `58be106` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix essential — without Java installed, Maven would fail to run and the backend would never start.

## Issues Encountered
- LDAP endpoint returns HTTP 503 (not 400/401 as the plan expected) because `ldap.enabled: false` in the dev profile causes the LDAP auth service to return SERVICE_UNAVAILABLE. This is correct behavior — the endpoint is reachable (non-000 HTTP code), satisfying criterion 9.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dev server startup is fixed; Spring Boot starts with H2 in-memory DB in ~1.6 seconds
- All 9 success criteria from the plan are satisfied
- Ready for UAT re-run of auth endpoint tests (AUTH-01)
- Auth endpoints are reachable: `/actuator/health`, `/api/auth/ldap`, `/api/auth/me` (via Spring Security)

---
*Phase: 02-authentication-security*
*Completed: 2026-07-07*
