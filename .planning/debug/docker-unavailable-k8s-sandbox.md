---
status: diagnosed
trigger: "Docker unavailable in K8s sandbox — start-dev.sh runs docker compose up but sandbox has no Docker daemon"
created: 2026-07-07T00:00:00Z
updated: 2026-07-07T00:00:00Z
---

## Current Focus

hypothesis: start-dev.sh was generated under the "compose" catalog entry which hardcodes EXEC_CMD='docker compose up'; the K8s sandbox has no Docker daemon, so the command fails immediately. The fix is to regenerate/patch the script to run the Spring Boot app directly via Maven.
test: confirmed by reading EXEC_CMD line 132 and verifying `docker` binary absence in sandbox
expecting: replacing EXEC_CMD with Maven spring-boot:run invocation (after installing JDK 21 + Maven) will allow the app to start
next_action: COMPLETE — structured diagnosis produced

## Symptoms

expected: dev server starts and binds to 0.0.0.0:8080
actual: bash exits with "docker: command not found" on all 3 retry attempts
errors: "bash: line 1: docker: command not found"
reproduction: run .pivota/start-dev.sh in Daytona K8s sandbox
started: always broken in this sandbox environment (Docker never available)

## Eliminated

- hypothesis: Maven wrapper (mvnw) could be used directly
  evidence: `ls backend/mvnw` returns nothing — no mvnw present in repo
  timestamp: 2026-07-07T00:00:00Z

- hypothesis: System Maven or Java already installed
  evidence: `command -v mvn` and `command -v java` both return nothing
  timestamp: 2026-07-07T00:00:00Z

- hypothesis: docker-compose.yml app service is a Spring Boot container
  evidence: docker-compose.yml shows the `app` service builds from `.` with Apache2 PHP setup (volumes mount /var/www/html, command is apache2-foreground); it is a legacy PHP/Apache layer, NOT the Spring Boot backend. The Spring Boot backend in `backend/` is a separate artifact entirely.
  timestamp: 2026-07-07T00:00:00Z

## Evidence

- timestamp: 2026-07-07T00:00:00Z
  checked: .pivota/start-dev.sh line 132
  found: EXEC_CMD='docker compose up' — hardcoded, no fallback
  implication: script will always fail when docker binary is absent

- timestamp: 2026-07-07T00:00:00Z
  checked: .pivota/dev-script.meta.json
  found: catalog_entry="compose" — generator picked "compose" catalog because docker-compose.yml was detected
  implication: the wrong catalog entry was used; backend is Spring Boot, not a raw compose project in this sandbox

- timestamp: 2026-07-07T00:00:00Z
  checked: backend/pom.xml
  found: Spring Boot 3.3.0, java.version=21, spring-boot-maven-plugin present, no mvnw in repo
  implication: app is buildable via system Maven; spring-boot:run is the correct exec target

- timestamp: 2026-07-07T00:00:00Z
  checked: backend/src/main/resources/application.yml
  found: datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/ureport}; server.port=8080; server.address=0.0.0.0
  implication: platform-injected DATABASE_URL is consumed directly — no translation needed. App already binds to 0.0.0.0:8080 by config.

- timestamp: 2026-07-07T00:00:00Z
  checked: apt-cache (after apt-get update)
  found: openjdk-21-jdk-headless available; maven 3.6.3-5 available
  implication: INSTALL_CMD can use apt-get to install both in one step

- timestamp: 2026-07-07T00:00:00Z
  checked: docker-compose.yml services
  found: app=PHP/Apache (MariaDB+Solr), db=mariadb:10.4 — NOT PostgreSQL. Backend uses PostgreSQL via injected DATABASE_URL sidecar.
  implication: docker-compose.yml is irrelevant to Spring Boot backend startup; it describes a separate legacy PHP CRM stack

## Resolution

root_cause: start-dev.sh was generated with catalog_entry="compose" because docker-compose.yml was detected at repo root, hardcoding EXEC_CMD='docker compose up'. The K8s sandbox has no Docker daemon, and the actual backend to run is a Spring Boot 3.3 Maven project in backend/ that requires JDK 21 + Maven — neither of which are installed yet.
fix: patch start-dev.sh to (1) set INSTALL_CMD to install openjdk-21-jdk-headless + maven via apt-get, (2) set LOCK_FILE_PATH to backend/pom.xml, (3) set INSTALL_PRESENCE_CHECK to ~/.m2/repository, (4) set EXEC_CMD to run spring-boot:run from the backend/ directory binding to 0.0.0.0:8080
verification: pending
files_changed: [".pivota/start-dev.sh"]
