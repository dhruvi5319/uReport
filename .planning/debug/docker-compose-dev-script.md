---
status: diagnosed
trigger: "docker compose up --build fails; user says don't use docker in dev start script"
created: 2026-07-06T00:00:00Z
updated: 2026-07-06T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — Docker daemon is unavailable in Daytona K8s sandbox; start-dev.sh uses `docker compose up` which cannot run without a Docker daemon; correct approach is to start Spring Boot directly via `mvn spring-boot:run` using the platform-injected DATABASE_URL
test: checked `docker info`, env vars, pom.xml, application.yml, mvnw presence
expecting: fix changes EXEC_CMD from `docker compose up` to `cd backend && mvn spring-boot:run` and catalog_entry from "compose" to "mvn"
next_action: DIAGNOSED — return ROOT CAUSE FOUND

## Symptoms

expected: Run `docker compose up --build`. All three containers (db, api, web) reach "healthy" status.
actual: docker compose up failed; user explicitly said "Don't use docker in dev start script"
errors: None reported verbally; failure is structural — no Docker daemon in K8s sandbox
reproduction: Run .pivota/start-dev.sh in Daytona sandbox
started: Discovered during UAT Phase 1, Test 1

## Eliminated

- hypothesis: docker-compose.yml service misconfiguration
  evidence: docker-compose.yml is syntactically correct (3 services: db/api/web with healthchecks); the problem is the daemon not being present, not the file content
  timestamp: 2026-07-06T00:00:00Z

- hypothesis: missing backend/Dockerfile
  evidence: backend/Dockerfile exists (ls confirms); build file is present; irrelevant since Docker can't run at all
  timestamp: 2026-07-06T00:00:00Z

## Evidence

- timestamp: 2026-07-06T00:00:00Z
  checked: start-dev.sh line 132
  found: EXEC_CMD='docker compose up' — the script unconditionally runs Docker Compose
  implication: Every invocation attempts to contact the Docker daemon

- timestamp: 2026-07-06T00:00:00Z
  checked: `docker info` in sandbox
  found: "Docker not available" — no Docker daemon running; `which docker` returned nothing
  implication: `docker compose up` will fail at first invocation with "Cannot connect to the Docker daemon" or similar; all 3 retry attempts will also fail

- timestamp: 2026-07-06T00:00:00Z
  checked: dev-script.meta.json
  found: catalog_entry = "compose"; inspection_inputs matched on docker-compose.yml presence
  implication: The init-dev-server generator incorrectly selected the "compose" catalog entry. In a Daytona K8s sandbox, the compose glob match should be ignored when there is no Docker daemon. The meta file must be updated alongside start-dev.sh.

- timestamp: 2026-07-06T00:00:00Z
  checked: backend/mvnw
  found: NOT FOUND — no Maven wrapper in backend/
  implication: Cannot use `./mvnw spring-boot:run`; must use system `mvn` instead

- timestamp: 2026-07-06T00:00:00Z
  checked: `which mvn`, `which java`, PATH
  found: Neither mvn nor java is on PATH in current session; PATH=/root/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
  implication: Java and Maven are not pre-installed; a PRE_EXEC_SNIPPET will be needed in start-dev.sh to install them (e.g. via SDKMAN or apt) before running `mvn spring-boot:run`

- timestamp: 2026-07-06T00:00:00Z
  checked: backend/src/main/resources/application.yml datasource URL
  found: url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/ureport} — reads DATABASE_URL from environment with fallback
  implication: Spring Boot will correctly consume the platform-injected DATABASE_URL. No application config change needed.

- timestamp: 2026-07-06T00:00:00Z
  checked: env | grep DATABASE_URL
  found: DATABASE_URL=mysql://ureport:ureport@localhost:3306/ureport
  implication: CRITICAL SECONDARY ISSUE — the platform has injected a MySQL DATABASE_URL, but the application is PostgreSQL-only (PostgreSQL JDBC driver, Flyway PostgreSQL module, postgres dialect). The injected DATABASE_URL uses the mysql:// scheme, which the PostgreSQL JDBC driver cannot parse. The PRE_EXEC_SNIPPET or application config will need to handle this mismatch (either override DATABASE_URL to the correct PostgreSQL sidecar, or ensure the platform injects the correct value).

- timestamp: 2026-07-06T00:00:00Z
  checked: backend/pom.xml dependencies
  found: spring-boot-starter-web, spring-boot-starter-data-jpa, spring-boot-starter-actuator, flyway-core 10.15.0, flyway-database-postgresql, postgresql JDBC driver, spring-boot-maven-plugin
  implication: Confirmed pure PostgreSQL stack. No MySQL driver. A mysql:// DATABASE_URL will cause startup failure.

## Resolution

root_cause: The Daytona K8s sandbox has no Docker daemon (confirmed: `docker info` returns nothing; `which docker` finds nothing). The start-dev.sh script uses EXEC_CMD='docker compose up' — which requires a Docker daemon — so it fails on every attempt. The dev-script.meta.json also records catalog_entry="compose", which is the wrong catalog type for this environment. The correct approach is to run the Spring Boot backend directly via `mvn spring-boot:run` inside the backend/ directory, relying on the platform-injected DATABASE_URL for PostgreSQL connectivity. Two secondary issues compound this: (1) backend/mvnw is absent so a system mvn must be used, and (2) the platform has injected a MySQL DATABASE_URL (mysql://) but the app requires a PostgreSQL JDBC URL (jdbc:postgresql://), requiring either a platform fix or a DATABASE_URL override in the script.

fix: NOT APPLIED (goal: find_root_cause_only)

verification: NOT APPLIED

files_changed: []
