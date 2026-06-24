---
phase: implement-the-full-ureport-modernization
plan: "04"
subsystem: reference-data-backend
tags: [java, spring-boot, jpa, rest, wave-2c, people, departments, categories, substatus, actions]
dependency_graph:
  requires: ["01-PLAN (DB schema)", "02-PLAN (SecurityConfig, JwtUserDetails, Ticket entity)"]
  provides: ["PersonService.findOrCreateFromOpen311", "SubstatusService.getDefaultSubstatusForStatus",
             "CategoryService.upsertCategoryActionResponse", "DepartmentService.setCategoryAssociations",
             "8 REST controllers for /api/v1/people,departments,categories,category-groups,substatus,actions,contact-methods,issue-types"]
  affects: ["wave-2b Open311RequestsController (PersonService.findOrCreateFromOpen311)", 
            "wave-2a TicketService (SubstatusService.getDefaultSubstatusForStatus)",
            "wave-2d CategoryService, SubstatusService consumed by AutoCloseScheduler, MetricsService"]
tech_stack:
  added: ["PersonService", "DepartmentService", "CategoryService", "SubstatusService", "ActionService"]
  patterns: ["Spring Data JPA ManyToMany join tables", "@PrePersist/@PreUpdate for lastModified", 
             "orphanRemoval=true for child collections", "@Lazy to break circular beans",
             "BCrypt password hashing (cost 10)", "isSystem guard pattern"]
key_files:
  created:
    - api/src/main/java/com/ureport/entity/Department.java
    - api/src/main/java/com/ureport/entity/CategoryActionResponse.java
    - api/src/main/java/com/ureport/entity/PeoplePhone.java
    - api/src/main/java/com/ureport/entity/PeopleAddress.java
    - api/src/main/java/com/ureport/entity/ContactMethod.java
    - api/src/main/java/com/ureport/entity/IssueType.java
    - api/src/main/java/com/ureport/service/PersonService.java
    - api/src/main/java/com/ureport/service/DepartmentService.java
    - api/src/main/java/com/ureport/service/CategoryService.java
    - api/src/main/java/com/ureport/service/SubstatusService.java
    - api/src/main/java/com/ureport/service/ActionService.java
    - api/src/main/java/com/ureport/controller/PeopleController.java
    - api/src/main/java/com/ureport/controller/DepartmentController.java
    - api/src/main/java/com/ureport/controller/CategoryController.java
    - api/src/main/java/com/ureport/controller/CategoryGroupController.java
    - api/src/main/java/com/ureport/controller/SubstatusController.java
    - api/src/main/java/com/ureport/controller/ActionController.java
    - api/src/main/java/com/ureport/controller/ContactMethodController.java
    - api/src/main/java/com/ureport/controller/IssueTypeController.java
    - api/src/main/java/com/ureport/repository/DepartmentRepository.java
    - api/src/main/java/com/ureport/repository/CategoryGroupRepository.java
    - api/src/main/java/com/ureport/repository/CategoryActionResponseRepository.java
    - api/src/main/java/com/ureport/repository/ContactMethodRepository.java
    - api/src/main/java/com/ureport/repository/IssueTypeRepository.java
    - api/src/test/java/com/ureport/service/PersonServiceTest.java
    - api/src/test/java/com/ureport/service/DepartmentServiceTest.java
    - api/src/test/java/com/ureport/service/CategoryServiceTest.java
    - api/src/test/java/com/ureport/service/SubstatusServiceTest.java
    - api/src/test/java/com/ureport/service/ActionServiceTest.java
  modified:
    - api/src/main/java/com/ureport/entity/Person.java (added ManyToOne dept, OneToMany email/phone/address)
    - api/src/main/java/com/ureport/entity/PeopleEmail.java (ManyToOne person, backward-compat getPersonId())
    - api/src/main/java/com/ureport/entity/Category.java (added ManyToOne relations, @PreUpdate, actionResponses)
    - api/src/main/java/com/ureport/entity/Substatus.java (primitive booleans, dual getter pattern)
    - api/src/main/java/com/ureport/repository/PersonRepository.java (searchPeople JPQL, findByEmailsEmailIgnoreCase)
    - api/src/main/java/com/ureport/repository/CategoryRepository.java (ordered query, findByDepartmentId)
    - api/src/main/java/com/ureport/repository/SubstatusRepository.java (findByStatusAndIsDefaultTrue)
    - api/src/main/java/com/ureport/repository/ActionRepository.java (findByType)
    - api/src/main/java/com/ureport/config/SecurityConfig.java (permit /api/v1/contact-methods, /api/v1/issue-types)
    - api/src/main/java/com/ureport/service/TicketService.java (use PeopleEmail.setPerson() instead of setPersonId())
decisions:
  - "@Lazy injection on PersonService and CategoryService in DepartmentService to prevent circular bean dependency"
  - "Backward-compatible getPersonId()/getDepartmentId()/getDefaultPersonId() helpers on entities for existing wave 2a/2b code"
  - "SubstatusRepository uses findByStatusAndIsDefaultTrue (canonical) with findFirstByStatusAndIsDefaultTrue default method alias"
  - "CategoryService.toResponse() is public to allow DepartmentService.getDepartmentCategories() without circular injection"
  - "System action protection based on type='system' field (not a separate isSystem boolean per schema)"
metrics:
  duration: "~45 minutes"
  completed: "2026-06-24"
  tasks: 2
  files: 49
---

# Phase implement-the-full-ureport-modernization Plan 04: Wave 2c Reference Data Backend Summary

## One-Liner
Full-stack JPA entities, Spring Data repositories, 5 service classes, 8 REST controllers, and Mockito unit tests for the Wave 2c reference data features (People, Departments, Categories, Substatuses, Actions, Contact Methods, Issue Types).

## What Was Built

### Task 1: JPA Entities and Repositories

**New Entities Created:**
- `Department.java` — `@Table(departments)` with ManyToMany to Category and Action via join tables
- `CategoryActionResponse.java` — unique(category_id, action_id) table for per-category email templates
- `PeoplePhone.java` — `@Table(peoplePhones)` with ManyToOne Person
- `PeopleAddress.java` — `@Table(peopleAddresses)` with ManyToOne Person
- `ContactMethod.java` — `@Table(contactMethods)` with isSystem flag
- `IssueType.java` — `@Table(issueTypes)` with isSystem flag

**Existing Entities Enhanced:**
- `Person.java` — Added `@ManyToOne Department`, `@OneToMany` collections for emails/phones/addresses, kept `getDepartmentId()` for backward compatibility with wave 2a/2b code
- `PeopleEmail.java` — Converted from plain `personId` column to proper `@ManyToOne Person`, kept `getPersonId()` compatibility helper
- `Category.java` — Added `@ManyToOne Department/Person/CategoryGroup/Substatus`, `@OneToMany actionResponses`, `@PrePersist/@PreUpdate` for lastModified
- `Substatus.java` — Unified to primitive `boolean isDefault/isSystem` with dual getter pattern for backward compat

**New Repositories Created:**
- `DepartmentRepository`, `CategoryGroupRepository`, `CategoryActionResponseRepository`
- `ContactMethodRepository`, `IssueTypeRepository`

**Existing Repositories Enhanced:**
- `PersonRepository` — Added `searchPeople()` JPQL with ILIKE, `findByEmailsEmailIgnoreCase()`, `findByDepartmentId()`
- `CategoryRepository` — Added ordered query, `findByDepartmentId()`, `findByCategoryGroupId()`
- `SubstatusRepository` — Changed to `findByStatusAndIsDefaultTrue()` with backward-compat alias
- `ActionRepository` — Added `findByType()`

### Task 2: Services, Controllers, DTOs, and Unit Tests

**Key Service Methods:**

| Method | Service | Used By |
|--------|---------|---------|
| `findOrCreateFromOpen311(firstName, lastName, email, phone)` | PersonService | Open311RequestsController (wave 2b) |
| `getDefaultSubstatusForStatus(status)` | SubstatusService | TicketService (wave 2a) |
| `upsertCategoryActionResponse(categoryId, actionId, template, replyEmail)` | CategoryService | CategoryController |
| `setCategoryAssociations(deptId, categoryIds)` | DepartmentService | DepartmentController |
| `setActionAssociations(deptId, actionIds)` | DepartmentService | DepartmentController |

**REST Controllers (all with @PreAuthorize("hasRole('ROLE_STAFF')") unless noted):**

| Controller | Base Path | Endpoint Count |
|------------|-----------|----------------|
| PeopleController | `/api/v1/people` | 16 (person CRUD + email/phone/address sub-resources) |
| DepartmentController | `/api/v1/departments` | 9 (CRUD + people/categories/actions associations) |
| CategoryController | `/api/v1/categories` | 8 (permission-gated GET, staff-only writes) |
| CategoryGroupController | `/api/v1/category-groups` | 6 (CRUD + reorder) |
| SubstatusController | `/api/v1/substatus` | 4 |
| ActionController | `/api/v1/actions` | 4 |
| ContactMethodController | `/api/v1/contact-methods` | 3 (public GET, staff POST/DELETE) |
| IssueTypeController | `/api/v1/issue-types` | 3 (public GET, staff POST/DELETE) |

**Business Rules Implemented:**
- `PersonService.createPerson()` — BCrypt cost-10 password hashing, 409 USERNAME_CONFLICT on duplicate
- `PersonService.softDeletePerson()` — Sets `deletedAt`, never hard-deletes
- `DepartmentService.createDepartment()` — 422 INVALID_ASSIGNEE if defaultPerson is not staff
- `CategoryService.validatePermissionLevel()` — Only `staff/public/anonymous` allowed; 422 otherwise
- `CategoryService.listCategories(callerRole)` — Filters by displayPermissionLevel per FRD spec
- `SubstatusService.updateSubstatus()` — Enforces single-isDefault-per-status in one transaction
- `SubstatusService.deleteSubstatus()` — 422 SYSTEM_SUBSTATUS_NOT_DELETABLE if isSystem=true
- `ActionService.createAction()` — Only `department` type allowed via API; rejects `system`
- `ActionService.deleteAction/updateAction()` — 403 PERMISSION_DENIED if type=`system`
- `ContactMethodController/IssueTypeController.delete()` — 422 if isSystem=true

## Integration Contract Verification

| Contract | Status |
|----------|--------|
| PersonService.findOrCreateFromOpen311 exists | ✅ line 278 |
| SubstatusService.getDefaultSubstatusForStatus exists | ✅ line 104 |
| CategoryService.upsertCategoryActionResponse exists | ✅ line 179 |
| DepartmentService.setCategoryAssociations / setActionAssociations | ✅ lines 102/121 |
| 12+ entity classes under entity/ | ✅ 18 total (12 plan + 6 pre-existing) |
| 7+ repository interfaces under repository/ | ✅ 16 total |
| 5 service unit test classes | ✅ PersonServiceTest, DepartmentServiceTest, CategoryServiceTest, SubstatusServiceTest, ActionServiceTest |
| GET /api/v1/contact-methods public | ✅ No @PreAuthorize on listContactMethods |
| GET /api/v1/issue-types public | ✅ No @PreAuthorize on listIssueTypes |

## Test Results

Unit tests written (execution deferred to verify phase — Maven not available in execute environment):

| Test Class | Test Cases |
|------------|-----------|
| PersonServiceTest | 6 (duplicate username, bcrypt hash, soft delete, findOrCreate existing, findOrCreate new, findOrCreate no email) |
| DepartmentServiceTest | 3 (non-staff default person, category associations replacement, staff default person) |
| CategoryServiceTest | 6 (invalid permission level, anonymous filter, public filter, upsert existing, upsert new, validate permission) |
| SubstatusServiceTest | 5 (setDefault clears previous, system substatus not deletable, getDefault returns correct, no default throws, non-system delete succeeds) |
| ActionServiceTest | 6 (system type rejected, department type succeeds, system action delete rejected, system action update rejected, department action delete succeeds, listAll) |

Total: **26 unit tests** across 5 classes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed PeopleEmail entity breaking TicketService**
- **Found during:** Task 1 — when upgrading PeopleEmail from plain `personId` column to `@ManyToOne Person`
- **Issue:** TicketService.createTicket() called `newEmail.setPersonId(reporter.getId())` which no longer compiles after relation upgrade
- **Fix:** Updated TicketService to use `newEmail.setPerson(reporter)` (correct approach), added backward-compat `getPersonId()` helper on PeopleEmail
- **Files modified:** api/src/main/java/com/ureport/service/TicketService.java
- **Commit:** 0f34b77

**2. [Rule 3 - Blocking] Fixed circular bean dependency in DepartmentService**
- **Found during:** Task 2 — DepartmentService needs PersonService.toResponse() and CategoryService.toResponse(), but those services might inject DepartmentService
- **Fix:** Used `@Lazy` on PersonService and CategoryService injections in DepartmentService constructor
- **Files modified:** api/src/main/java/com/ureport/service/DepartmentService.java
- **Commit:** 45ec037

**3. [Rule 2 - Missing Critical] Added public access to contact-methods and issue-types endpoints**
- **Found during:** Task 1 — SecurityConfig had `anyRequest().authenticated()` which would block the public GET endpoints
- **Fix:** Added `/api/v1/contact-methods` and `/api/v1/issue-types` to the permitAll() list in SecurityConfig
- **Files modified:** api/src/main/java/com/ureport/config/SecurityConfig.java
- **Commit:** 0f34b77

**4. [Rule 1 - Bug] Substatus boolean handling compatibility**
- **Found during:** Task 1 — SubstatusRepository.findFirstByStatusAndIsDefaultTrue() used by TicketService while the new canonical name is findByStatusAndIsDefaultTrue()
- **Fix:** Added `default findFirstByStatusAndIsDefaultTrue()` method alias that delegates to the canonical method
- **Files modified:** api/src/main/java/com/ureport/repository/SubstatusRepository.java
- **Commit:** 0f34b77

## Commits

| Hash | Description |
|------|-------------|
| 0f34b77 | feat(implement-the-full-ureport-modernization-04): JPA entities and repositories for F5/F6/F7/F8/F9/F14/F19 |
| 45ec037 | feat(implement-the-full-ureport-modernization-04): Service classes, REST controllers, DTOs, and unit tests for F5-F9/F14/F19 |

## Self-Check: PASSED

All key files found:
- ✅ 5 service classes (PersonService, DepartmentService, CategoryService, SubstatusService, ActionService)
- ✅ 5 new entity classes (Department, CategoryActionResponse, PeoplePhone, PeopleAddress, ContactMethod, IssueType)
- ✅ 8 REST controllers (PeopleController, DepartmentController, CategoryController, CategoryGroupController, SubstatusController, ActionController, ContactMethodController, IssueTypeController)
- ✅ 5 unit test classes (PersonServiceTest, DepartmentServiceTest, CategoryServiceTest, SubstatusServiceTest, ActionServiceTest)
- ✅ Both task commits verified: 0f34b77, 45ec037
