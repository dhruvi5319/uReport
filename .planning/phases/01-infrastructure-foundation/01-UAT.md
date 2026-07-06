---
status: complete
phase: 01-infrastructure-foundation
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-GAP-01-SUMMARY.md]
started: 2026-07-06T19:26:30Z
updated: 2026-07-06T19:29:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Dev script starts Spring Boot (not Docker)
expected: `.pivota/start-dev.sh` launches `cd backend && mvn spring-boot:run` (NOT docker compose up). If Java 21 / Maven are missing, they are installed via apt-get first. The Spring Boot process starts and binds to port 8080 on 0.0.0.0.
result: issue
reported: "org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'entityManagerFactory'... Failed to initialize dependency 'flywayInitializer'... Unable to obtain connection from database: Connection to localhost:5432 refused. Check that the hostname and port are correct and that the postmaster is accepting TCP/IP connections."
severity: blocker

### 2. Spring Boot health endpoint responds UP
expected: After startup, `curl http://localhost:8080/actuator/health` returns `{"status":"UP"}` with db, diskSpace, and ping components all reported as UP.
result: skipped
reason: Spring Boot didn't start due to blocker in test 1

### 3. Flyway ran both migrations
expected: Querying `SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank` returns exactly 2 rows — V1 (initial schema) and V2 (search vector) — both with `success = true`.
result: skipped
reason: Can't query the database in this environment

### 4. All 21 tables exist in the database
expected: Querying `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'` returns 21 (plus flyway_schema_history = 22 total). Key tables like `tickets`, `people`, `departments`, `categories` exist.
result: skipped
reason: Server is not up — blocked by test 1 blocker

### 5. Seed data present in reference tables
expected: The 5 reference tables are pre-populated: `contact_methods` has 4 rows, `substatus` has 3 rows, `actions` has 10 rows, `issue_types` has 6 rows, `category_groups` has 3 rows.
result: skipped
reason: Server is not up — blocked by test 1 blocker

### 6. search_vector column and GIN index on tickets
expected: The `tickets` table has a `search_vector` column of type `tsvector`. A GIN index `idx_tickets_search_vector` exists on it. Inserting a ticket row causes the `search_vector` column to be auto-populated by the trigger (not NULL).
result: skipped
reason: Server is not up — blocked by test 1 blocker

## Summary

total: 6
passed: 0
issues: 1
pending: 0
skipped: 5

## Gaps

- truth: "Spring Boot starts successfully and connects to PostgreSQL"
  status: failed
  reason: "User reported: BeanCreationException on flywayInitializer — Connection to localhost:5432 refused. PostgreSQL sidecar not reachable at default address."
  severity: blocker
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
