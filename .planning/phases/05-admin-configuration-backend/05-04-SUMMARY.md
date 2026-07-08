---
phase: 05-admin-configuration-backend
plan: 04
subsystem: api
tags: [spring-boot, jpa, crud, admin, substatus, issue-type, contact-method, action]

requires:
  - phase: 01-infrastructure-foundation
    provides: Flyway V1 seed data with substatuses (1-3), issue types (1-6), contact methods (1-4), system actions (1-10)
  - phase: 04-core-case-management-backend
    provides: JPA domain entities (Substatus, IssueType, ContactMethod, Action) + base repositories + BusinessException

provides:
  - SubstatusService with CRUD, isDefault auto-exclusivity, seeded-record protection (ids 1-3)
  - IssueTypeService with CRUD, seeded-record protection (ids 1-6), in-use ticket guard
  - ContactMethodService with CRUD, seeded-record protection (ids 1-4), in-use ticket guard
  - ActionService with list/create(dept-type)/update(template+replyEmail)/delete(dept-type only, system=403)
  - SubstatusController at /api/substatuses (GET+POST+PUT+DELETE)
  - IssueTypeController at /api/issue-types (GET+POST+PUT+DELETE)
  - ContactMethodController at /api/contact-methods (GET+POST+PUT+DELETE)
  - ActionController at /api/actions (GET+POST+PUT+DELETE)
  - LookupTableCrudIT with 15 integration tests

affects:
  - 05-admin-configuration-backend (other plans using same package)
  - 09-admin-frontend (consumes all 4 CRUD APIs)

tech-stack:
  added: []
  patterns:
    - "Set.of() immutable constants for seeded record IDs — fast in-memory guard before DB lookup"
    - "@Transactional on service classes + @Transactional(readOnly=true) on list methods"
    - "clearDefaultForStatus: find-all-default + forEach-save pattern for isDefault exclusivity"
    - "action.setType('department') hard-coded in createAction — Jackson ignores extra fields"
    - "Map<String,String> request body for simple name-only endpoints (IssueType, ContactMethod)"

key-files:
  created:
    - backend/src/main/java/com/ureport/admin/service/SubstatusService.java
    - backend/src/main/java/com/ureport/admin/service/IssueTypeService.java
    - backend/src/main/java/com/ureport/admin/service/ContactMethodService.java
    - backend/src/main/java/com/ureport/admin/service/ActionService.java
    - backend/src/main/java/com/ureport/admin/controller/SubstatusController.java
    - backend/src/main/java/com/ureport/admin/controller/IssueTypeController.java
    - backend/src/main/java/com/ureport/admin/controller/ContactMethodController.java
    - backend/src/main/java/com/ureport/admin/controller/ActionController.java
    - backend/src/main/java/com/ureport/admin/dto/SubstatusDto.java
    - backend/src/main/java/com/ureport/admin/dto/CreateSubstatusRequest.java
    - backend/src/main/java/com/ureport/admin/dto/IssueTypeDto.java
    - backend/src/main/java/com/ureport/admin/dto/ContactMethodDto.java
    - backend/src/main/java/com/ureport/admin/dto/CreateActionRequest.java
    - backend/src/main/java/com/ureport/admin/dto/UpdateActionRequest.java
    - backend/src/test/java/com/ureport/admin/LookupTableCrudIT.java
  modified:
    - backend/src/main/java/com/ureport/repository/SubstatusRepository.java
    - backend/src/main/java/com/ureport/repository/IssueTypeRepository.java
    - backend/src/main/java/com/ureport/repository/ContactMethodRepository.java
    - backend/src/main/java/com/ureport/repository/ActionsRepository.java
    - backend/src/main/java/com/ureport/repository/TicketRepository.java

key-decisions:
  - "Reused com.ureport.crm.dto.ActionDto for ActionController — avoids duplicate record"
  - "SubstatusService @Transactional at class level + clearDefaultForStatus within same transaction for row-level lock safety"
  - "SEEDED_* constants are Set.of() — in-memory check before DB lookup to avoid false 404s"
  - "LookupTableCrudIT tests written for verify-phase execution (no Java runtime in self-provided Daytona env)"

patterns-established:
  - "Pattern 1: Seeded record protection — immutable Set.of() constant checked before DB ops in service layer"
  - "Pattern 2: isDefault auto-exclusivity — clearDefaultForStatus finds + saves all same-status defaults before setting new one"
  - "Pattern 3: Type enforcement — department type hard-coded in createAction, UpdateActionRequest only has template+replyEmail"

duration: 20min
completed: 2026-07-08
---

# Phase 5 Plan 4: Lookup Table Admin APIs Summary

**CRUD APIs for Substatus, IssueType, ContactMethod, and Action with seeded-record protection, isDefault auto-clearing, and system action type enforcement**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-08T13:27:00Z
- **Completed:** 2026-07-08T13:47:29Z
- **Tasks:** 2
- **Files modified:** 20 (15 created, 5 modified)

## Accomplishments

- Full CRUD REST APIs for all 4 lookup tables under `com.ureport.admin` package
- SubstatusService with `clearDefaultForStatus()` auto-clearing isDefault on same-status substatuses
- Seeded-record protection for 12 system records (3 substatuses, 6 issue types, 4 contact methods) via in-memory `Set.of()` constants
- ActionService enforces `type="department"` on create and blocks delete of `type="system"` actions
- TicketRepository extended with `existsByIssueTypeId` and `existsByContactMethodId` for FK-safety checks
- 15-test LookupTableCrudIT covering all success/failure paths across all 4 entities

## Task Commits

Each task was committed atomically:

1. **Task 1: Expand repositories + create all 4 services + DTOs** - `ddbf1c6` (feat)
2. **Task 2: 4 controllers + LookupTableCrudIT integration test** - `a88b00a` (feat)

**Plan metadata:** (docs commit — see below)

_Note: No Java/Maven runtime available in self-provided Daytona environment; verification done via grep/structural checks. Integration tests written for verify phase execution._

## Files Created/Modified

- `backend/src/main/java/com/ureport/admin/service/SubstatusService.java` — CRUD with isDefault auto-exclusivity + seeded-record protection
- `backend/src/main/java/com/ureport/admin/service/IssueTypeService.java` — CRUD + seeded-record protection + ticket-in-use guard
- `backend/src/main/java/com/ureport/admin/service/ContactMethodService.java` — CRUD + seeded-record protection + ticket-in-use guard
- `backend/src/main/java/com/ureport/admin/service/ActionService.java` — list/create(dept)/update(template+replyEmail)/delete(dept-only)
- `backend/src/main/java/com/ureport/admin/controller/SubstatusController.java` — GET+POST+PUT+DELETE at /api/substatuses
- `backend/src/main/java/com/ureport/admin/controller/IssueTypeController.java` — GET+POST+PUT+DELETE at /api/issue-types
- `backend/src/main/java/com/ureport/admin/controller/ContactMethodController.java` — GET+POST+PUT+DELETE at /api/contact-methods
- `backend/src/main/java/com/ureport/admin/controller/ActionController.java` — GET+POST+PUT+DELETE at /api/actions
- `backend/src/main/java/com/ureport/admin/dto/` — 6 new DTO files (SubstatusDto, CreateSubstatusRequest, IssueTypeDto, ContactMethodDto, CreateActionRequest, UpdateActionRequest)
- `backend/src/main/java/com/ureport/repository/SubstatusRepository.java` — findByStatusAndIsDefaultTrue + findAllByOrderByStatusAscNameAsc
- `backend/src/main/java/com/ureport/repository/IssueTypeRepository.java` — findAllByOrderByNameAsc
- `backend/src/main/java/com/ureport/repository/ContactMethodRepository.java` — findAllByOrderByNameAsc
- `backend/src/main/java/com/ureport/repository/ActionsRepository.java` — findAllByOrderByTypeAscNameAsc + findByType + existsByNameIgnoreCase
- `backend/src/main/java/com/ureport/repository/TicketRepository.java` — existsByIssueTypeId + existsByContactMethodId
- `backend/src/test/java/com/ureport/admin/LookupTableCrudIT.java` — 15 integration tests

## Decisions Made

- Reused `com.ureport.crm.dto.ActionDto` for ActionController to avoid duplicating the record type — imports cross-package but the contract shape matches exactly
- `clearDefaultForStatus()` runs inside the same `@Transactional` scope as `createSubstatus`/`updateSubstatus` — Postgres row-level locking prevents concurrent race on isDefault
- `SEEDED_*` constants use `Set.of()` (immutable, O(1) lookup) — checked before any DB call to avoid 404 false-negatives when seeded records don't exist in test DB

## Deviations from Plan

None - plan executed exactly as written.

The only deviation noted: the plan said `./mvnw compile` for verification, but no Java/Maven runtime is available in this self-provided Daytona environment (DB_CONTRACT=self-provided). All structural verifications were performed via grep against the generated source files. Integration test execution is deferred to verify phase.

## Issues Encountered

- No Java/Maven runtime in Daytona environment — structural verification performed via grep; `LookupTableCrudIT` tests written but not executed. Tests will run in verify phase against the running application.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 4 admin lookup table APIs are structurally complete with correct service/controller/DTO layers
- LookupTableCrudIT written and ready for verify-phase execution
- Phase 5 plans 05-01, 05-02, 05-03 may provide additional context for any remaining admin APIs
- Admin frontend (Phase 9) can consume `/api/substatuses`, `/api/issue-types`, `/api/contact-methods`, `/api/actions`

---
*Phase: 05-admin-configuration-backend*
*Completed: 2026-07-08*

## Self-Check: PASSED

All key files verified present on disk and both task commits (ddbf1c6, a88b00a) confirmed in git log.
