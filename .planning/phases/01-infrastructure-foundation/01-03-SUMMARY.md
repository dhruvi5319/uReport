---
phase: 01-infrastructure-foundation
plan: "03"
subsystem: infra
tags: [spring-boot, maven, java21, docker, docker-compose, postgres, flyway, hikaricp, nginx, actuator]

# Dependency graph
requires:
  - phase: 01-infrastructure-foundation
    provides: "V1__initial_schema.sql and V2__search_vector.sql Flyway migrations (plans 01-01, 01-02)"
provides:
  - "backend/pom.xml: Spring Boot 3.3.0 + Java 21 Maven project with all required dependencies"
  - "UReportApplication.java: @SpringBootApplication main class"
  - "application.yml: datasource (env-var-backed), HikariCP pool, Flyway, actuator health/info"
  - "application-docker.yml: docker profile datasource override to jdbc:postgresql://db:5432/ureport"
  - "backend/Dockerfile: multi-stage Maven build + JRE 21 runtime, activates docker profile"
  - "docker-compose.yml: 3-service stack (db/api/web) with healthchecks and dependency ordering"
  - "frontend/nginx.conf: reverse proxy /api/ and /actuator/ to api:8080, SPA fallback"
  - "frontend/Dockerfile: nginx:alpine placeholder until Phase 7 React build"
affects:
  - "02-spring-boot-scaffold — builds on this pom.xml and application.yml"
  - "All phases using docker compose up as dev/deploy environment"
  - "Phase 7 — replace frontend Dockerfile with React build"

# Tech tracking
tech-stack:
  added:
    - "Spring Boot 3.3.0 (spring-boot-starter-parent)"
    - "Java 21 (eclipse-temurin:21)"
    - "Spring Data JPA + Hibernate 6"
    - "Flyway 10.15.0 + flyway-database-postgresql"
    - "HikariCP 5.1.0 connection pool"
    - "Spring Boot Actuator"
    - "PostgreSQL JDBC driver 42.7.3"
    - "Maven 3.9 (multi-stage Docker build)"
    - "nginx:alpine (reverse proxy)"
    - "postgres:16-alpine (DB container)"
  patterns:
    - "Multi-stage Docker build: maven:3.9-eclipse-temurin-21-alpine → eclipse-temurin:21-jre-alpine"
    - "Spring profile activation via Dockerfile ENTRYPOINT (-Dspring.profiles.active=docker)"
    - "HikariCP pool named UReportHikariPool with explicit connection/idle timeouts"
    - "Flyway runs automatically on Spring Boot startup; 2 migrations applied (V1+V2) before API is ready"
    - "depends_on condition service_healthy ensures DB health before api starts"

key-files:
  created:
    - "backend/pom.xml"
    - "backend/src/main/java/com/ureport/UReportApplication.java"
    - "backend/src/main/resources/application.yml"
    - "backend/src/main/resources/application-docker.yml"
    - "backend/Dockerfile"
    - "frontend/nginx.conf"
    - "frontend/Dockerfile"
  modified:
    - "docker-compose.yml (replaced legacy PHP docker-compose with 3-service Spring Boot stack)"

key-decisions:
  - "Spring Boot 3.3.0 with Java 21 — matches TechArch spec; flyway-database-postgresql required for Flyway 10+"
  - "application.yml uses env-var substitution (${DATABASE_URL:...}) for local-dev portability; docker profile overrides to container hostname"
  - "Flyway runs on Spring Boot startup (no separate migration step needed); HikariCP pool confirms connectivity"
  - "frontend Dockerfile is nginx:alpine placeholder — React build deferred to Phase 7; nginx.conf proxy_pass wires /api/ through now"
  - "Legacy PHP docker-compose.yml replaced: old file served PHP/MySQL/Solr; new file serves Spring Boot/PostgreSQL/Nginx"

patterns-established:
  - "Docker profile pattern: application.yml (env-var defaults) + application-docker.yml (container overrides)"
  - "Healthcheck dependency chain: db healthy → api starts → web depends on api"
  - "Nginx proxy_pass preserves Host, X-Real-IP, X-Forwarded-For headers (T-03-02 mitigated)"

# Metrics
duration: 9min
completed: 2026-07-06
---

# Phase 1 Plan 03: Docker Infrastructure Summary

**Spring Boot 3.3.0 + Java 21 Maven project wired to PostgreSQL via HikariCP and Flyway, containerized in 3-service Docker Compose stack (db/api/web), verified live: /actuator/health returns {status:UP} with V1+V2 migrations applied**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-06T17:40:00Z
- **Completed:** 2026-07-06T17:49:25Z
- **Tasks:** 2
- **Files modified:** 8 (7 created, 1 replaced)

## Accomplishments

- Spring Boot Maven project skeleton with all required dependencies (web, data-jpa, actuator, flyway-core, flyway-database-postgresql, postgresql) — compiles and packages to fat JAR
- HikariCP pool (`UReportHikariPool`) connects to PostgreSQL on startup; Flyway runs both V1 (initial schema) and V2 (search vector) migrations automatically
- `GET /actuator/health` returns `{"status":"UP"}` with db, diskSpace, and ping components all healthy
- Nginx reverse proxy forwards `/api/` and `/actuator/` to `api:8080`; Docker Compose dependency ordering prevents race conditions

## Task Commits

Each task was committed atomically:

1. **Task 1: Generate Spring Boot Maven project** - `c92d77b` (feat)
2. **Task 2: Write docker-compose.yml and Nginx config** - `dca1b8e` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `backend/pom.xml` — Spring Boot 3.3.0 parent, Java 21, 6 required dependencies, spring-boot-maven-plugin (83 lines)
- `backend/src/main/java/com/ureport/UReportApplication.java` — `@SpringBootApplication` main class (12 lines)
- `backend/src/main/resources/application.yml` — datasource (env-var-backed), HikariCP pool config, Flyway classpath scan, actuator health/info (42 lines)
- `backend/src/main/resources/application-docker.yml` — docker profile override to `jdbc:postgresql://db:5432/ureport`
- `backend/Dockerfile` — multi-stage build: `maven:3.9-eclipse-temurin-21-alpine` → `eclipse-temurin:21-jre-alpine`, activates docker profile
- `docker-compose.yml` — 3 services: db (postgres:16-alpine + pg_isready healthcheck), api (Spring Boot build + wget actuator healthcheck), web (nginx build); dependency ordering via `depends_on condition service_healthy` (replaces legacy PHP compose)
- `frontend/nginx.conf` — proxy_pass `/api/` and `/actuator/` to `api:8080` with proper header forwarding; SPA fallback for `/`
- `frontend/Dockerfile` — `nginx:alpine` with placeholder index.html (Phase 7 will replace with React build)

## Decisions Made

- Used `flyway-database-postgresql` (separate artifact required for Flyway 10+) alongside `flyway-core` — critical for PostgreSQL dialect support
- `application.yml` uses `${DATABASE_URL:jdbc:postgresql://localhost:5432/ureport}` default — works for local dev; `application-docker.yml` overrides to `db:5432` for container hostname
- Legacy `docker-compose.yml` (PHP/MySQL/Solr) replaced with new Spring Boot stack — old file had MySQL `DB_HOST: db` pointing at wrong database type
- Nginx proxy configured with `proxy_set_header Host $host; X-Real-IP $remote_addr` — satisfies T-03-02 mitigation from threat model

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Legacy docker-compose.yml replaced (not merged)**
- **Found during:** Task 2 (Write docker-compose.yml)
- **Issue:** Project had an existing `docker-compose.yml` serving PHP/MySQL/Solr from the legacy CRM. The plan required a new 3-service Spring Boot stack — the old file was incompatible and would conflict.
- **Fix:** Replaced the entire `docker-compose.yml` with the new Spring Boot stack (db/api/web). The legacy PHP services are no longer part of the Docker Compose workflow; they live in the original `crm/` source directory for reference.
- **Files modified:** `docker-compose.yml`
- **Verification:** `docker compose config --quiet` exits 0; all 3 containers start and reach healthy state
- **Committed in:** `dca1b8e` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — legacy compose file replacement)
**Impact on plan:** Necessary infrastructure replacement. The plan correctly specified the new compose stack; the existing file had to be overwritten. No scope creep.

## Issues Encountered

None — Docker build succeeded first attempt, all containers started and reached healthy state, both Flyway migrations applied successfully.

Note: `mvn compile` verification step in the plan required local Maven/Java installation which is not present in this sandbox. The `backend/Dockerfile` multi-stage build performed the equivalent compile+package inside Docker during `docker compose up --build` — Maven compilation was verified via Docker build success and container startup.

## User Setup Required

None — no external service configuration required. Development stack runs entirely via `docker compose up --build`.

## Next Phase Readiness

- Phase 1 infrastructure foundation is complete: schema (V1+V2) + Spring Boot scaffold + Docker Compose stack all operational
- Phase 2 (Spring Boot scaffold with JPA entities/repositories) can extend `backend/pom.xml` and `application.yml` directly
- `docker compose up --build` is the canonical development workflow — runs Flyway migrations automatically on startup
- Phase 7 will replace `frontend/Dockerfile` with a React build that copies static assets into the nginx container

---
*Phase: 01-infrastructure-foundation*
*Completed: 2026-07-06*

## Self-Check: PASSED

- ✅ `backend/pom.xml` — FOUND (83 lines, min: 80)
- ✅ `backend/src/main/java/com/ureport/UReportApplication.java` — FOUND (12 lines, min: 12)
- ✅ `backend/src/main/resources/application.yml` — FOUND (42 lines, min: 30)
- ✅ `backend/Dockerfile` — FOUND
- ✅ `docker-compose.yml` — FOUND (60+ lines with 3 services)
- ✅ `frontend/nginx.conf` — FOUND (32 lines, min: 15)
- ✅ Commit `c92d77b` — Task 1 (feat(01-03): generate Spring Boot Maven project skeleton)
- ✅ Commit `dca1b8e` — Task 2 (feat(01-03): add docker-compose.yml 3-service stack and nginx reverse proxy)
- ✅ `GET /actuator/health` → `{"status":"UP"}` — verified live
- ✅ `flyway_schema_history` → 2 rows (V1 + V2, both success=true) — verified live
- ✅ `HikariPool - Start completed` — verified in container logs
