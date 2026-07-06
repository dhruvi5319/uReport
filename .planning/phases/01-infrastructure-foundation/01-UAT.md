---
status: diagnosed
phase: 01-infrastructure-foundation
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md]
started: 2026-07-06T18:17:58Z
updated: 2026-07-06T18:25:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Docker Compose stack starts healthy
expected: Run `docker compose up --build` (or `docker compose up` if already built). All three containers — db (postgres:16-alpine), api (Spring Boot), and web (nginx) — reach "healthy" status. Running `docker compose ps` shows all three as "healthy" or "running".
result: issue
reported: "It failed. Don't use docker in dev start script"
severity: major

### 2. Spring Boot health endpoint responds UP
expected: After the stack is running, `curl http://localhost:8080/actuator/health` (or via nginx at `curl http://localhost/actuator/health`) returns `{"status":"UP"}` with db, diskSpace, and ping components all healthy.
result: skipped
reason: Can't reach the endpoint in this environment

### 3. Flyway ran both migrations
expected: After startup, querying `SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank` returns exactly 2 rows — V1 (initial schema) and V2 (search vector) — both with `success = true`.
result: skipped
reason: Can't query the database in this environment

### 4. All 21 tables exist in the database
expected: Querying `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'` returns 21 (or more, including flyway_schema_history). Key tables like `tickets`, `people`, `departments`, `categories`, `contact_methods`, `substatus` all exist.
result: skipped
reason: Can't query the database

### 5. Seed data present in reference tables
expected: The 5 reference tables are pre-populated: `contact_methods` has 4 rows, `substatus` has 3 rows, `actions` has 10 rows, `issue_types` has 6 rows, `category_groups` has 3 rows.
result: skipped
reason: Can't query the database

### 6. search_vector column and GIN index on tickets
expected: The `tickets` table has a `search_vector` column of type `tsvector`. A GIN index `idx_tickets_search_vector` exists on it. Inserting a ticket row causes the `search_vector` column to be auto-populated by the trigger (not NULL).
result: skipped
reason: Can't query the database

## Summary

total: 6
passed: 0
issues: 1
pending: 0
skipped: 5

## Gaps

- truth: "docker compose up --build starts all three containers (db, api, web) in healthy state"
  status: failed
  reason: "User reported: It failed. Don't use docker in dev start script"
  severity: major
  test: 1
  root_cause: "Daytona K8s sandbox has no Docker daemon — `docker compose up` fails unconditionally. The .pivota/start-dev.sh was generated with catalog_entry=compose because docker-compose.yml exists, but this is the wrong exec strategy for a no-Docker sandbox. The correct approach is to run Spring Boot directly via Maven (`mvn spring-boot:run` in backend/), relying on the platform-injected DATABASE_URL for PostgreSQL."
  artifacts:
    - path: ".pivota/start-dev.sh"
      issue: "EXEC_CMD='docker compose up' — requires Docker daemon which is absent in Daytona K8s; should use mvn spring-boot:run in backend/ instead"
    - path: ".pivota/dev-script.meta.json"
      issue: "catalog_entry=compose is wrong for this environment; should be agent-synthesized (java-spring without mvnw)"
  missing:
    - "Replace EXEC_CMD with Maven-based Spring Boot launch in backend/ directory"
    - "Add PRE_EXEC_SNIPPET to install Java 21 + Maven via apt-get (not on PATH by default)"
    - "Ensure DATABASE_URL env var points to a valid jdbc:postgresql:// URL (platform may inject mysql:// scheme)"
    - "Update dev-script.meta.json catalog_entry from compose to null (agent-synthesized)"
  debug_session: ".planning/debug/docker-compose-dev-script.md"
