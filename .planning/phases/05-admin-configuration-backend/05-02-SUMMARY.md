---
phase: 05-admin-configuration-backend
plan: 02
subsystem: api
tags: [java, spring-boot, jpa, postgresql, departments, crud, admin]

# Dependency graph
requires:
  - phase: 04-core-case-management-backend
    provides: JPA entities (Department, DepartmentAction, Category, Person, Action), repositories, BusinessException, SecurityConfig
provides:
  - DepartmentService with listDepartments, createDepartment, getDepartment, updateDepartment, deleteDepartment, getDepartmentCategories
  - DepartmentController: 6 REST endpoints at /api/departments
  - DepartmentDetailDto with actionIds, categoryCount, PersonRef
  - DepartmentCrudIT: 6 integration tests covering full CRUD + safety checks
  - CategoryRepository.existsByDepartmentId/findByDepartmentId/countByDepartmentId
  - DepartmentActionRepository.findByDepartmentId/@Modifying deleteByDepartmentId
affects:
  - 05-03: Category management can now do FK validation against department references
  - future: Any feature needing Department → Action associations (reporting, ticket routing)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - action reconciliation via orphanRemoval: getDepartmentActions().clear() + add new entries
    - delete safety: existsByDepartmentId check → 409 DEPT_IN_USE before delete
    - validateActionIds: iterate req.actionIds, throw 404 for any missing Action (T-05-08)
    - JWT required for GETs, @PreAuthorize(ADMIN) for POST/PUT/DELETE (T-05-07)
    - Integration tests with native sidecar PostgreSQL (no Zonky/Testcontainers)

key-files:
  created:
    - backend/src/main/java/com/ureport/admin/controller/DepartmentController.java
    - backend/src/main/java/com/ureport/admin/service/DepartmentService.java
    - backend/src/main/java/com/ureport/admin/dto/DepartmentDetailDto.java
    - backend/src/main/java/com/ureport/admin/dto/DepartmentListItemDto.java
    - backend/src/main/java/com/ureport/admin/dto/CreateDepartmentRequest.java
    - backend/src/main/java/com/ureport/admin/dto/UpdateDepartmentRequest.java
    - backend/src/test/java/com/ureport/admin/DepartmentCrudIT.java
  modified:
    - backend/src/main/java/com/ureport/domain/Department.java
    - backend/src/main/java/com/ureport/repository/DepartmentRepository.java
    - backend/src/main/java/com/ureport/repository/DepartmentActionRepository.java
    - backend/src/main/java/com/ureport/repository/CategoryRepository.java

key-decisions:
  - "Action reconciliation via orphanRemoval: clear getDepartmentActions() then add new entries — avoids manual delete + insert dance"
  - "Department.departmentActions uses @JoinColumn (not mappedBy) because DepartmentAction uses composite @IdClass without @ManyToOne back-reference"
  - "Integration tests written without Zonky — follow ClientCrudIT / TicketControllerIT pattern using native PostgreSQL sidecar"
  - "CategoryRef returned as a record nested in DepartmentService (not a separate top-level DTO) for co-location with the service method"

patterns-established:
  - "Department action reconciliation: dept.getDepartmentActions().clear() → add new DepartmentAction objects → save (orphanRemoval handles DB)"
  - "Delete safety for FK-constrained parent entities: existsByChildForeignKey → 409 CONFLICT before delete"
  - "personRef PersonRef includes firstname + lastname separately (not combined name string) matching DepartmentDetailDto contract"

# Metrics
duration: 6min
completed: 2026-07-08
---

# Phase 05 Plan 02: Department CRUD API Summary

**Department management REST API at /api/departments with actionIds reconciliation, delete safety checks, and GET /categories sub-endpoint**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-08T13:41:19Z
- **Completed:** 2026-07-08T13:48:18Z
- **Tasks:** 2
- **Files modified:** 11 (4 modified, 7 created)

## Accomplishments
- Full Department CRUD API: GET list, POST create, GET single, PUT update, DELETE with safety, GET categories
- DepartmentAction join table reconciliation: orphanRemoval-backed clear+rebuild on PUT
- Security enforcement: @PreAuthorize(ADMIN) on POST/PUT/DELETE; GET endpoints require JWT only
- 6 DepartmentCrudIT integration tests written covering all must_have scenarios

## Task Commits

Each task was committed atomically:

1. **Task 1: Expand Department.java + DepartmentRepository + DepartmentActionRepository** - `bdc5de1` (feat)
2. **Task 2: DepartmentService + DepartmentController + DTOs + DepartmentCrudIT** - `55bd26a` (feat)

**Plan metadata:** (docs commit - see final_commit section)

## Files Created/Modified
- `backend/src/main/java/com/ureport/domain/Department.java` - Added @OneToMany DepartmentAction collection via @JoinColumn
- `backend/src/main/java/com/ureport/repository/DepartmentRepository.java` - Added findAllByOrderByNameAsc()
- `backend/src/main/java/com/ureport/repository/DepartmentActionRepository.java` - Added findByDepartmentId, @Modifying deleteByDepartmentId
- `backend/src/main/java/com/ureport/repository/CategoryRepository.java` - Added existsByDepartmentId, findByDepartmentId, countByDepartmentId
- `backend/src/main/java/com/ureport/admin/controller/DepartmentController.java` - 6 REST endpoints with @PreAuthorize(ADMIN) on write methods
- `backend/src/main/java/com/ureport/admin/service/DepartmentService.java` - Full CRUD service with action reconciliation and delete safety
- `backend/src/main/java/com/ureport/admin/dto/DepartmentDetailDto.java` - DTO with PersonRef, categoryCount, actionIds
- `backend/src/main/java/com/ureport/admin/dto/DepartmentListItemDto.java` - Lightweight list item DTO
- `backend/src/main/java/com/ureport/admin/dto/CreateDepartmentRequest.java` - @NotBlank @Size(max=128) validated request
- `backend/src/main/java/com/ureport/admin/dto/UpdateDepartmentRequest.java` - Full-replace request for PUT
- `backend/src/test/java/com/ureport/admin/DepartmentCrudIT.java` - 6 integration tests

## Decisions Made
- Action reconciliation uses orphanRemoval: `getDepartmentActions().clear()` + add new DepartmentAction entries. This is the cleanest JPA approach without needing to manually call `deleteByDepartmentId` (which would conflict with orphanRemoval).
- `Department.departmentActions` uses `@JoinColumn(name="department_id")` instead of `mappedBy` because DepartmentAction uses a composite @IdClass with plain Long fields (no @ManyToOne back-reference).
- Integration tests follow native sidecar PostgreSQL pattern (same as ClientCrudIT) — no Zonky @AutoConfigureEmbeddedDatabase.
- `CategoryRef` is a record nested in DepartmentService, not a standalone DTO file, to keep the category-listing concept co-located.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Java not available natively in sandbox. Compilation verified via Docker (`maven:3.9-eclipse-temurin-21-alpine`). Integration test execution deferred to verify phase (same pattern as all Phase 4/5 integration tests).

Pre-existing test compilation errors in Open311/infrastructure tests (missing `embedded-database-spring-test` artifact for `@AutoConfigureEmbeddedDatabase`) are out of scope — not introduced by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Department API complete. Category management (05-03) can proceed with FK validation against departments.
- DepartmentCrudIT tests are written; run via `./mvnw test -Dtest=DepartmentCrudIT` against native PostgreSQL sidecar.
- Plans 05-01 and 05-04 were executed in parallel (wave 1) and are also complete.

---
*Phase: 05-admin-configuration-backend*
*Completed: 2026-07-08*
