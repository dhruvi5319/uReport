---
phase: 04-core-case-management-backend
plan: 02
subsystem: api
tags: [java, spring-boot, jpa, postgresql, bulk-operations, sla, tickets]

# Dependency graph
requires:
  - phase: 03-open311-georeport-v2-api
    provides: JPA entities (Ticket, Category, Substatus, Person, TicketHistory) and repositories
provides:
  - TicketBulkService with bulkAssign/bulkClose/bulkChangeStatus (per-ticket isolation)
  - SlaService with isOverdue/computeSlaDueDate/triggerAutoClose
  - POST /api/tickets/bulk endpoint (TicketBulkController)
  - BulkOperationResult DTO with successCount, failureCount, perTicketResults
  - Full Spring Boot backend project: pom.xml, entities, repositories, security (JWT), Flyway V1 migration
affects:
  - 04-01: TicketService can now call SlaService.isOverdue/computeSlaDueDate/triggerAutoClose
  - 04-03: Action logging shares TicketHistory infrastructure built here
  - 04-04: Media upload uses same Ticket/TicketHistory repository layer

# Tech tracking
tech-stack:
  added:
    - Spring Boot 3.2.5 (web, data-jpa, security, validation)
    - PostgreSQL driver + Flyway 10.x
    - jjwt 0.12.5 (JWT auth)
    - jackson-dataformat-xml (Open311 XML support)
    - Maven 3.6.3 build (no wrapper, OpenJDK 17)
  patterns:
    - Per-ticket isolation: NO class-level @Transactional on bulk methods; each ticket in try/catch
    - Audit trail: individual ticket_history row per mutated ticket (T-04-10)
    - Security: JWT httpOnly cookie + Bearer header, @PreAuthorize method-level security
    - DB URL conversion: DatabaseUrlEnvironmentPostProcessor converts postgres:// → jdbc:postgresql://
    - Flyway idempotent migrations (IF NOT EXISTS) wired into app startup

key-files:
  created:
    - backend/pom.xml
    - backend/src/main/java/com/ureport/UReportApplication.java
    - backend/src/main/resources/db/migration/V1__initial_schema.sql
    - backend/src/main/java/com/ureport/domain/{Ticket,TicketHistory,Media,Category,CategoryGroup,Department,Person,Client,ContactMethod,Action,Substatus,IssueType}.java
    - backend/src/main/java/com/ureport/repository/{Ticket,TicketHistory,Media,Client,Person,Category,Substatus,Actions,Department}Repository.java
    - backend/src/main/java/com/ureport/security/{PersonDetails,JwtUtil,JwtAuthenticationFilter,SecurityConfig}.java
    - backend/src/main/java/com/ureport/crm/service/TicketBulkService.java
    - backend/src/main/java/com/ureport/crm/service/SlaService.java
    - backend/src/main/java/com/ureport/crm/controller/TicketBulkController.java
    - backend/src/main/java/com/ureport/crm/dto/{BulkTicketRequest,BulkOperationResult,ApiErrorDto}.java
    - backend/src/main/java/com/ureport/crm/exception/{BusinessException,TicketNotFoundException,GlobalExceptionHandler}.java
    - backend/src/main/java/com/ureport/config/DatabaseUrlEnvironmentPostProcessor.java
    - backend/src/test/java/com/ureport/crm/TicketBulkIT.java
  modified: []

key-decisions:
  - "No class-level @Transactional on bulk methods — per-ticket try/catch ensures one failure doesn't abort others"
  - "Replaced Testcontainers with native sidecar PostgreSQL (no Docker daemon in sandbox)"
  - "SecurityConfig returns 401 (not 403) for unauthenticated requests via custom authenticationEntryPoint"
  - "DatabaseUrlEnvironmentPostProcessor converts postgres:// URL to JDBC format before Spring Boot datasource init"
  - "Flyway migrations use IF NOT EXISTS + ON CONFLICT DO NOTHING for idempotency on every startup"

patterns-established:
  - "Per-ticket isolation: wrap each ticket operation in try/catch; never use @Transactional on bulk service methods"
  - "Audit trail: every ticket mutation in bulk produces an individual ticket_history row"
  - "SLA computeSlaDueDate returns null for sla_days=null/0 (no SLA); isOverdue returns false for closed tickets"
  - "triggerAutoClose: WARN + no-op if auto_close_substatus_id is null (T-04-11 compliance)"
  - "Bulk size guard: ticketIds.size() > 100 → 400 BULK_LIMIT_EXCEEDED (T-04-08 DoS mitigation)"

# Metrics
duration: 52min
completed: 2026-07-07
---

# Phase 04 Plan 02: Bulk Ticket Operations + SLA Engine Summary

**Spring Boot backend project bootstrapped with TicketBulkService (per-ticket isolation), SlaService (CASE-01 overdue/autoClose), TicketBulkController (POST /api/tickets/bulk), and 6 passing integration tests against native PostgreSQL sidecar**

## Performance

- **Duration:** ~52 min
- **Started:** 2026-07-07T02:13:00Z
- **Completed:** 2026-07-07T03:04:49Z
- **Tasks:** 2 (plan tasks) + 1 bootstrap (no backend existed)
- **Files modified:** 47 files created

## Accomplishments

- Bootstrapped complete Spring Boot backend project (pom.xml, JPA entities, repositories, security, Flyway migration) from scratch — no prior Java code existed
- TicketBulkService: `bulkAssign`, `bulkClose`, `bulkChangeStatus` with per-ticket try/catch isolation (no class-level @Transactional)
- SlaService: `computeSlaDueDate`, `isOverdue`, `triggerAutoClose` with T-04-11 null-substatus guard
- TicketBulkController: `POST /api/tickets/bulk` with STAFF/ADMIN auth, DoS guard (≤100 tickets), action routing
- All 6 TicketBulkIT integration tests pass against native sidecar PostgreSQL

## Task Commits

Each task was committed atomically:

1. **Task 1: TicketBulkService + DTOs + Spring Boot bootstrap** - `9acb68b` (feat)
2. **Task 2: SlaService + TicketBulkController + TicketBulkIT** - `82daf40` (feat)

**Plan metadata:** *(this commit)*

## Files Created/Modified

- `backend/pom.xml` - Spring Boot 3.2.5 project with JPA, Security, Flyway, JWT
- `backend/src/main/resources/db/migration/V1__initial_schema.sql` - Full PostgreSQL schema (snake_case, 15 tables, seed data)
- `backend/src/main/java/com/ureport/domain/*.java` - 12 JPA entities mapping all domain tables
- `backend/src/main/java/com/ureport/repository/*.java` - 9 Spring Data JPA repositories
- `backend/src/main/java/com/ureport/security/*.java` - JWT filter, PersonDetails, SecurityConfig
- `backend/src/main/java/com/ureport/crm/service/TicketBulkService.java` - Bulk operations service
- `backend/src/main/java/com/ureport/crm/service/SlaService.java` - SLA computation + autoClose
- `backend/src/main/java/com/ureport/crm/controller/TicketBulkController.java` - POST /api/tickets/bulk
- `backend/src/main/java/com/ureport/crm/dto/{BulkTicketRequest,BulkOperationResult,ApiErrorDto}.java` - DTOs
- `backend/src/main/java/com/ureport/config/DatabaseUrlEnvironmentPostProcessor.java` - postgres:// URL converter
- `backend/src/test/java/com/ureport/crm/TicketBulkIT.java` - 6 integration tests, all passing

## Decisions Made

1. **No @Transactional on bulk methods**: Per-spec requirement — one ticket failure must not roll back others. Each ticket is in its own try/catch block.
2. **Native sidecar DB for tests**: Testcontainers requires Docker daemon (unavailable in K8s sandbox). Tests use injected DATABASE_URL directly.
3. **Custom authenticationEntryPoint**: Spring Security's default for unauthenticated @PreAuthorize hits returns 403; configured explicit 401.
4. **Flyway idempotent SQL**: All DDL uses `IF NOT EXISTS`; all seed inserts use `ON CONFLICT DO NOTHING` for safe restarts.
5. **DatabaseUrlEnvironmentPostProcessor**: Platform injects `postgres://user:pass@host/db`; converted to `jdbc:postgresql://host/db` with extracted credentials before Spring datasource init.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced Testcontainers with native sidecar PostgreSQL**
- **Found during:** Task 2 (TicketBulkIT test run)
- **Issue:** `docker: command not found` — no Docker daemon in native-sidecar K8s sandbox; Testcontainers requires Docker to spin up PostgreSQL container
- **Fix:** Changed `application-test.properties` to use native sidecar `DATABASE_URL`; removed Testcontainers JDBC URL; added `DatabaseUrlEnvironmentPostProcessor` to convert `postgres://` to JDBC format; tests run against live sidecar DB
- **Files modified:** `application-test.properties`, `application.properties`, added `DatabaseUrlEnvironmentPostProcessor.java`
- **Verification:** All 6 TicketBulkIT tests pass against PostgreSQL 16.14 sidecar
- **Committed in:** `82daf40`

**2. [Rule 1 - Bug] SecurityConfig returns 401 instead of 403 for unauthenticated requests**
- **Found during:** Task 2 (Test 4: no JWT → expected 401 but got 403)
- **Issue:** Spring Security's default behavior when an unauthenticated principal hits a `@PreAuthorize` method returns 403 via `AccessDeniedException`
- **Fix:** Added `exceptionHandling().authenticationEntryPoint()` to return HTTP 401 for all unauthenticated `/api/**` requests
- **Files modified:** `SecurityConfig.java`
- **Verification:** Test 4 now passes (401 received)
- **Committed in:** `82daf40`

**3. [Rule 1 - Bug] Category display_permission_level NOT NULL constraint violated in tests**
- **Found during:** Task 2 (SLA test helper createCategory)
- **Issue:** V1 schema declares `display_permission_level VARCHAR(20) NOT NULL`; test helper didn't set this field
- **Fix:** Added `cat.setDisplayPermissionLevel("staff")`, `cat.setPostingPermissionLevel("staff")`, `cat.setLastModified(LocalDateTime.now())` to test `createCategory()` helper
- **Files modified:** `TicketBulkIT.java`
- **Verification:** SLA tests 5 and 6 now pass
- **Committed in:** `82daf40`

**4. [Rule 2 - Missing Critical] Spring Boot backend project bootstrap**
- **Found during:** Before Task 1 (no backend/ directory existed)
- **Issue:** Plans 04-01 through 04-04 reference `backend/` with `mvn compile` verification, but the backend project didn't exist — no `pom.xml`, no entities, no Spring Boot application
- **Fix:** Created complete Spring Boot 3.2.5 project: `pom.xml`, `UReportApplication.java`, V1 Flyway migration (all 15 tables), 12 JPA entities, 9 repositories, JWT security layer
- **Files modified:** 36 new files in `backend/`
- **Verification:** `mvn compile` exits 0
- **Committed in:** `9acb68b`

---

**Total deviations:** 4 auto-fixed (2 blocking, 2 bugs/missing critical)
**Impact on plan:** All auto-fixes essential for compilation, test execution, and correct HTTP semantics. No scope creep.

## Issues Encountered

- PostgreSQL 16.14 sidecar (Flyway warns about version 15 being the last tested — non-blocking; migrations succeed)
- Maven 3.6.3 (installed via apt); no mvnw wrapper generated due to Maven version compatibility — used `mvn` directly; plan's `./mvnw` references work once a wrapper is generated

## User Setup Required

None - no external service configuration required. Native sidecar PostgreSQL is used.

## Next Phase Readiness

- SlaService is ready for TicketService (04-01) to call `isOverdue()`, `computeSlaDueDate()`, and `triggerAutoClose()` after `createTicket`
- TicketBulkController POST /api/tickets/bulk endpoint is live and tested
- Domain entities (Ticket, Category, Substatus, Person, TicketHistory, etc.) and repositories are established — ready for 04-01 TicketService implementation
- Flyway migration V1 is applied and idempotent — safe for all subsequent plan runs

## Self-Check: PASSED

All key files found on disk. Both task commits (9acb68b, 82daf40) confirmed in git log.
All 6 TicketBulkIT tests pass.

---
*Phase: 04-core-case-management-backend*
*Completed: 2026-07-07*
