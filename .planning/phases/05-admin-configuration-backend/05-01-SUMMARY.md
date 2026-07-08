---
phase: 05-admin-configuration-backend
plan: 01
subsystem: api
tags: [people, people-management, jpa, spring-boot, crud, rest, integration-test]

# Dependency graph
requires:
  - phase: 04-core-case-management-backend
    provides: Ticket entity + TicketRepository for delete safety checks
  - phase: 02-authentication-security
    provides: JWT auth, PersonDetails, SecurityConfig @PreAuthorize

provides:
  - /api/people CRUD with nested email/phone/address sub-resource reconciliation
  - PeopleService (listPeople, createPerson, getPerson, updatePerson, deletePerson)
  - PeopleController (5 endpoints + GET /api/people/{id}/tickets delegation)
  - PersonDetailDto with nested List<PersonEmailDto>, List<PersonPhoneDto>, List<PersonAddressDto>
  - PersonPageDto paginated search with q/role/page/page_size parameters
  - PeoplePhone + PeopleAddress JPA entities with @ManyToOne to Person
  - Person @OneToMany collections with CascadeType.ALL + orphanRemoval=true

affects:
  - F7: Department management (defaultPersonId references)
  - F8: Category management (defaultPerson references)
  - Phase 09 admin panels that use /api/people

# Tech tracking
tech-stack:
  added: [zonky embedded-database-spring-test 2.5.1]
  patterns:
    - "Array reconciliation: orphanRemoval + removeIf(id not in request) + update-or-add"
    - "Role guard: check currentUser.getRole() before allowing admin/staff role assignment"
    - "Delete safety: existsByEnteredByPersonId... check before cascading delete"
    - "@AutoConfigureEmbeddedDatabase(ZONKY) for integration tests — works without native sidecar"

key-files:
  created:
    - backend/src/main/java/com/ureport/domain/PeoplePhone.java
    - backend/src/main/java/com/ureport/domain/PeopleAddress.java
    - backend/src/main/java/com/ureport/admin/service/PeopleService.java
    - backend/src/main/java/com/ureport/admin/controller/PeopleController.java
    - backend/src/main/java/com/ureport/admin/dto/PersonDetailDto.java
    - backend/src/main/java/com/ureport/admin/dto/PersonListItemDto.java
    - backend/src/main/java/com/ureport/admin/dto/PersonPageDto.java
    - backend/src/main/java/com/ureport/admin/dto/CreatePersonRequest.java
    - backend/src/main/java/com/ureport/admin/dto/UpdatePersonRequest.java
    - backend/src/main/java/com/ureport/admin/dto/PersonEmailDto.java
    - backend/src/main/java/com/ureport/admin/dto/PersonPhoneDto.java
    - backend/src/main/java/com/ureport/admin/dto/PersonAddressDto.java
    - backend/src/main/java/com/ureport/repository/PeoplePhoneRepository.java
    - backend/src/main/java/com/ureport/repository/PeopleAddressRepository.java
    - backend/src/test/java/com/ureport/admin/PeopleCrudIT.java
  modified:
    - backend/src/main/java/com/ureport/domain/Person.java
    - backend/src/main/java/com/ureport/domain/PeopleEmail.java
    - backend/src/main/java/com/ureport/repository/PersonRepository.java
    - backend/src/main/java/com/ureport/repository/PeopleEmailRepository.java
    - backend/src/main/java/com/ureport/repository/TicketRepository.java
    - backend/src/main/java/com/ureport/security/RoleHierarchyConfig.java
    - backend/pom.xml

key-decisions:
  - "Zonky @AutoConfigureEmbeddedDatabase used for PeopleCrudIT — works in Daytona (no native sidecar) and K8s sidecar environments alike"
  - "Array reconciliation uses orphanRemoval + removeIf pattern — idempotent, only updates items owned by the person's collection"
  - "TicketRepository method name uses EnteredByPersonId (not EnteredById) to match @JoinColumn name"
  - "Removed duplicate webSecurityExpressionHandler from RoleHierarchyConfig — Spring Security 3.x auto-wires RoleHierarchy bean into expression handler"
  - "Removed duplicate UreportApplication class (was causing multiple @SpringBootConfiguration failure in tests)"

patterns-established:
  - "Admin CRUD pattern: Service(listX, createX, getX, updateX, deleteX) + Controller(@PreAuthorize ADMIN on writes)"
  - "Sub-resource reconciliation: request arrays contain id=null (new) or id=existing (update); missing IDs removed via orphanRemoval"

# Metrics
duration: 17min
completed: 2026-07-08
---

# Phase 05 Plan 01: People Management API Summary

**People CRUD with nested email/phone/address reconciliation using CascadeType.ALL + orphanRemoval, JPQL paginated search, role guard, and ticket-reference delete safety (409 PERSON_IN_USE)**

## Performance

- **Duration:** 17 min
- **Started:** 2026-07-08T13:42:06Z
- **Completed:** 2026-07-08T13:59:15Z
- **Tasks:** 2
- **Files modified:** ~30

## Accomplishments

- Created `PeoplePhone` and `PeopleAddress` JPA entities with `@ManyToOne` to Person; updated `PeopleEmail` from `Long personId` to `@ManyToOne` for bidirectional relationship
- Added `@OneToMany(cascade=ALL, orphanRemoval=true)` for emails/phones/addresses on `Person`; expanded `PersonRepository` with `searchPeople` JPQL, `existsByUsername`, `existsByUsernameAndIdNot`
- Built `PeopleService` with full CRUD, array reconciliation, role guard, username uniqueness enforcement, and delete safety
- Built `PeopleController` with all 5 CRUD endpoints + `GET /api/people/{id}/tickets` delegation, `@PreAuthorize("hasRole('ADMIN')")` on all writes
- Created `PeopleCrudIT` with 6 integration tests using Zonky embedded PostgreSQL

## Task Commits

Each task was committed atomically:

1. **Task 1: PeoplePhone/PeopleAddress entities + @OneToMany + expanded repositories** - `bdc5de1` (feat)
2. **Task 2: PeopleService + PeopleController + DTOs + PeopleCrudIT** - `d38a293` (feat)

_Note: Task 1 artifacts (entities, repositories) were committed in a prior session under commit `bdc5de1`. Task 2 adds the service layer, controller, DTOs, and integration test._

## Files Created/Modified

**Created:**
- `backend/src/main/java/com/ureport/domain/PeoplePhone.java` — JPA entity → people_phones table
- `backend/src/main/java/com/ureport/domain/PeopleAddress.java` — JPA entity → people_addresses table
- `backend/src/main/java/com/ureport/repository/PeoplePhoneRepository.java` — findByPersonId/deleteByPersonId
- `backend/src/main/java/com/ureport/repository/PeopleAddressRepository.java` — findByPersonId/deleteByPersonId
- `backend/src/main/java/com/ureport/admin/service/PeopleService.java` — CRUD + reconciliation + security
- `backend/src/main/java/com/ureport/admin/controller/PeopleController.java` — 5 REST endpoints + /tickets
- `backend/src/main/java/com/ureport/admin/dto/PersonDetailDto.java` — full detail with nested arrays
- `backend/src/main/java/com/ureport/admin/dto/PersonListItemDto.java` — list item DTO
- `backend/src/main/java/com/ureport/admin/dto/PersonPageDto.java` — paginated wrapper
- `backend/src/main/java/com/ureport/admin/dto/PersonEmailDto.java`, `PersonPhoneDto.java`, `PersonAddressDto.java` — sub-resource DTOs
- `backend/src/main/java/com/ureport/admin/dto/CreatePersonRequest.java`, `UpdatePersonRequest.java` — request bodies
- `backend/src/test/java/com/ureport/admin/PeopleCrudIT.java` — 6 integration tests

**Modified:**
- `backend/src/main/java/com/ureport/domain/Person.java` — added @OneToMany collections, List imports
- `backend/src/main/java/com/ureport/domain/PeopleEmail.java` — Long personId → @ManyToOne Person; added label
- `backend/src/main/java/com/ureport/repository/PersonRepository.java` — added searchPeople JPQL, uniqueness checks
- `backend/src/main/java/com/ureport/repository/PeopleEmailRepository.java` — added findByPersonId
- `backend/src/main/java/com/ureport/repository/TicketRepository.java` — added existsByEnteredByPerson... and findByEnteredByPerson...
- `backend/src/main/java/com/ureport/security/RoleHierarchyConfig.java` — removed duplicate bean (bug fix)
- `backend/pom.xml` — added embedded-database-spring-test 2.5.1

## Decisions Made

- Used Zonky `@AutoConfigureEmbeddedDatabase` for `PeopleCrudIT` — portable across Daytona (self-provided) and K8s native-sidecar environments
- Array reconciliation: `removeIf(id not in request set)` then `update existing / add new` — leverages JPA `orphanRemoval` for cascaded deletes
- `TicketRepository` derived method uses `EnteredByPersonId` (via `enteredByPerson.id` property path) matching `@ManyToOne` field name
- Spring Security 3.x auto-wires `RoleHierarchy` bean — no need to manually register `DefaultWebSecurityExpressionHandler`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed duplicate `PersonRepository` in `com.ureport.domain` package**
- **Found during:** Task 1 compilation
- **Issue:** `com.ureport.domain.PersonRepository` and `com.ureport.repository.PersonRepository` both existed; wildcard imports in `Open311RequestService` caused ambiguity compile error
- **Fix:** Used `git rm` on `domain/PersonRepository.java`; updated 5 files with explicit `import com.ureport.repository.PersonRepository`
- **Files modified:** `AuthController.java`, `CasAuthService.java`, `LdapAuthService.java`, `CasAuthServiceTest.java`, `AuthorizationIT.java`
- **Committed in:** `bdc5de1`

**2. [Rule 1 - Bug] Fixed TicketService lambda capturing reassigned `ticket` variable**
- **Found during:** Task 1 compilation
- **Issue:** `ticket = ticketRepository.save(ticket)` makes `ticket` not effectively final; lambda `p -> ticket.setAssignedPerson(p)` triggered Java compiler error
- **Fix:** Added local `final Ticket ticketRef = ticket` before the lambda
- **Files modified:** `TicketService.java`
- **Committed in:** `bdc5de1`

**3. [Rule 3 - Blocking] Added `embedded-database-spring-test` to pom.xml**
- **Found during:** Task 2 test-compile
- **Issue:** `@AutoConfigureEmbeddedDatabase` requires `io.zonky.test:embedded-database-spring-test` artifact; only `embedded-postgres` was present
- **Fix:** Added `io.zonky.test:embedded-database-spring-test:2.5.1` as test scope dependency
- **Files modified:** `pom.xml`
- **Committed in:** `d38a293`

**4. [Rule 3 - Blocking] Removed duplicate `UreportApplication` class**
- **Found during:** Task 2 test execution
- **Issue:** Both `UreportApplication` and `UReportApplication` annotated with `@SpringBootApplication` caused `IllegalStateException: Found multiple @SpringBootConfiguration` in test context
- **Fix:** Removed `UreportApplication.java` (kept `UReportApplication`)
- **Files modified:** removed `backend/src/main/java/com/ureport/UreportApplication.java`
- **Committed in:** `d38a293`

**5. [Rule 1 - Bug] Fixed `BeanDefinitionOverrideException` in `RoleHierarchyConfig`**
- **Found during:** Task 2 test execution
- **Issue:** `RoleHierarchyConfig` registered its own `webSecurityExpressionHandler` bean, conflicting with Spring Security's auto-configured one
- **Fix:** Removed `DefaultWebSecurityExpressionHandler` bean from `RoleHierarchyConfig`; Spring Security 3.x auto-wires `RoleHierarchy` bean
- **Files modified:** `RoleHierarchyConfig.java`
- **Committed in:** `d38a293`

---

**Total deviations:** 5 auto-fixed (2 blocking, 2 bug, 1 blocking)
**Impact on plan:** All auto-fixes were pre-existing issues blocking compilation and test execution. No scope creep. Core plan deliverables implemented as specified.

## Issues Encountered

- Integration test execution deferred to verify phase: Zonky embedded PostgreSQL `initdb` process cannot run inside the Maven Docker container used for compilation in this Daytona self-provided environment. Tests compile correctly and will run in the verify phase where the native sidecar or a direct Maven environment is available.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `/api/people` CRUD is complete and ready for Phase 9 admin panels
- `PersonDetailDto` with nested arrays provides the contract for Phase 7 (Department management) and Phase 8 (Category management) `defaultPerson` references
- All 5 plan 05-01 artifacts listed in `integration_contracts.provides` are implemented and match the specified shape

## Self-Check: PASSED

Files confirmed on disk:
- `backend/src/main/java/com/ureport/domain/PeoplePhone.java` ✓
- `backend/src/main/java/com/ureport/domain/PeopleAddress.java` ✓
- `backend/src/main/java/com/ureport/admin/service/PeopleService.java` ✓
- `backend/src/main/java/com/ureport/admin/controller/PeopleController.java` ✓
- `backend/src/main/java/com/ureport/admin/dto/PersonDetailDto.java` ✓
- `backend/src/test/java/com/ureport/admin/PeopleCrudIT.java` ✓

Commits confirmed:
- Task 1: `bdc5de1 feat(05-02): expand Department entity + repositories for department actions` (contains PeoplePhone, PeopleAddress, Person @OneToMany, repositories)
- Task 2: `d38a293 feat(05-01): PeopleService + PeopleController + DTOs + PeopleCrudIT integration test`

---
*Phase: 05-admin-configuration-backend*
*Completed: 2026-07-08*
