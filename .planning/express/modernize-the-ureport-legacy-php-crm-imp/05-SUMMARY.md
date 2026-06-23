---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: "05"
subsystem: api-controllers
tags: [php, rest-api, crud, rbac, categories, departments, substatuses]

dependency_graph:
  requires:
    - plan: "01"
      artifacts: [DepartmentRepository, CategoryRepository, SubstatusRepository, PersonRepository, TicketRepository]
    - plan: "03"
      artifacts: [ApiController base, RbacMiddleware, JsonResponse, Request]
  provides:
    - artifact: crm/src/Controllers/Api/ApiController.php
      exports: [ApiController]
    - artifact: crm/src/Repositories/CategoryGroupRepository.php
      exports: [CategoryGroupRepository]
    - artifact: crm/src/Controllers/Api/DepartmentController.php
      exports: [DepartmentController]
    - artifact: crm/src/Controllers/Api/CategoryGroupController.php
      exports: [CategoryGroupController]
    - artifact: crm/src/Controllers/Api/CategoryController.php
      exports: [CategoryController]
    - artifact: crm/src/Controllers/Api/SubstatusController.php
      exports: [SubstatusController]
  affects:
    - crm/src/Repositories/AbstractPdoRepository.php (added getRawPdo())
    - crm/src/Repositories/TicketRepository.php (added countByDepartment())
    - crm/src/Repositories/CategoryRepository.php (extended findAll with excludeStaffOnly)
    - crm/src/Repositories/SubstatusRepository.php (extended findAll with primaryStatus filter; added clearDefaults())

tech_stack:
  added: []
  patterns:
    - ApiController base class pattern with setRequest()/helpers wrapping JsonResponse+RbacMiddleware
    - Role-aware visibility filter on CategoryController.index() for anonymous vs staff callers
    - isDefault auto-clear pattern (clearDefaults() before save) for single-default-per-primaryStatus invariant
    - HAS_ACTIVE_TICKETS deactivation guard using countByDepartment() before soft-delete

key_files:
  created:
    - crm/src/Controllers/Api/ApiController.php
    - crm/src/Repositories/CategoryGroupRepository.php
    - crm/src/Controllers/Api/DepartmentController.php
    - crm/src/Controllers/Api/CategoryGroupController.php
    - crm/src/Controllers/Api/CategoryController.php
    - crm/src/Controllers/Api/SubstatusController.php
  modified:
    - crm/src/Repositories/AbstractPdoRepository.php
    - crm/src/Repositories/TicketRepository.php
    - crm/src/Repositories/CategoryRepository.php
    - crm/src/Repositories/SubstatusRepository.php

decisions:
  - ApiController base class created from scratch (Wave 2a did not produce one); wraps JsonResponse and RbacMiddleware with instance methods so plan 05 controllers can call requireRole()/jsonResponse()/notFound() etc.
  - CategoryController uses role-aware visibility filter: getCurrentRole() == null for anonymous → excludeStaffOnly=true passed to CategoryRepository.findAll()
  - SubstatusController clears isDefault atomically via SubstatusRepository.clearDefaults() before saving, enforcing single-default-per-primaryStatus invariant
  - DepartmentController deactivation guard checks live open-ticket count via TicketRepository.countByDepartment(); returns 409 HAS_ACTIVE_TICKETS if > 0
  - getRawPdo() added to AbstractPdoRepository (inherited by all repos) for ad-hoc uniqueness SQL in controllers

metrics:
  duration: ~30 minutes
  completed: 2026-06-23
  tasks_completed: 2
  files_created: 6
  files_modified: 4
---

# Phase modernize-the-ureport-legacy-php-crm-imp Plan 05: Admin Taxonomy API Controllers Summary

**One-liner:** Wave 2b admin REST API controllers for departments, categories, category groups, and substatuses with role-enforced CRUD, visibility filtering, isDefault auto-clear, and deactivation guards.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | CategoryGroupRepository + DepartmentController + CategoryGroupController | ecf2b66 | ApiController.php, CategoryGroupRepository.php, DepartmentController.php, CategoryGroupController.php, AbstractPdoRepository.php (getRawPdo), TicketRepository.php (countByDepartment) |
| 2 | CategoryController + SubstatusController | 257b75d | CategoryController.php, SubstatusController.php, CategoryRepository.php (findAll extended), SubstatusRepository.php (findAll + clearDefaults) |

## What Was Built

### ApiController Base Class (`src/Controllers/Api/ApiController.php`)
A new abstract base class created because Wave 2a (plan 03) produced `RbacMiddleware`, `JsonResponse`, and `Request` infrastructure but no controller base class. `ApiController` provides:
- `requireRole(string)` — wraps `RbacMiddleware::callerHasRole()`, aborts 401/403
- `getCurrentRole(): ?string` — returns null for anonymous callers
- `parseJsonBody(): array` — delegates to `Request::all()`
- `jsonResponse(mixed, int, array)` — wraps `JsonResponse::success()`
- `notFound(string)` — wraps `JsonResponse::error()` with 404
- `validationError(array)` — wraps `JsonResponse::error()` with 422
- `conflictError(string, string)` — wraps `JsonResponse::error()` with 409
- `emptyResponse()` — emits 204 No Content

### CategoryGroupRepository (`src/Repositories/CategoryGroupRepository.php`)
Full CRUD repository for `categoryGroups` table: `findById`, `findAll(bool $activeOnly)`, `findByName`, `save` (INSERT/UPDATE), `delete` (hard delete — caller guards FK integrity).

### DepartmentController (`src/Controllers/Api/DepartmentController.php`)
Five endpoints for `/api/departments`:
- **GET** (staff): returns list with `defaultAssignee: {id, name}|null` (hydrated from PersonRepository)
- **POST/PUT** (admin): validates unique name (case-insensitive via raw PDO), valid active-staff assignee (INVALID_ASSIGNEE)
- **DELETE** (admin): checks `TicketRepository::countByDepartment($id, statusOpen: true)` → 409 HAS_ACTIVE_TICKETS if any open tickets exist

### CategoryGroupController (`src/Controllers/Api/CategoryGroupController.php`)
Four endpoints for `/api/category-groups`:
- **GET**: no auth required; returns all groups
- **POST/PUT/DELETE** (admin): DUPLICATE_NAME validation via `findByName()`

### CategoryController (`src/Controllers/Api/CategoryController.php`)
Five endpoints for `/api/categories` with full complexity:
- **Role-aware visibility**: anonymous callers get `excludeStaffOnly=true` → filtered by `displayPermission != 'staff'`
- **Custom field validation**: code regex `/^[a-z0-9_]+$/`, unique codes within category, select type requires options (FIELD_OPTIONS_REQUIRED)
- **Rich validation**: DUPLICATE_NAME, INVALID_DEPARTMENT, INVALID_GROUP, INVALID_ASSIGNEE, displayPermission/postingPermission enum checks

### SubstatusController (`src/Controllers/Api/SubstatusController.php`)
Five endpoints for `/api/substatuses`:
- **GET**: optional `?primaryStatus=open|closed` query filter via named param to `SubstatusRepository::findAll()`
- **isDefault auto-clear**: `clearDefaults($primaryStatus)` called before save when `isDefault=true`; on update, clears others only when transitioning from false→true (excludes self via `excludeId`)
- **Duplicate detection**: PDOException with "Duplicate entry" → 422 DUPLICATE_NAME (covers UNIQUE KEY on `label+primaryStatus`)

## Repository Extensions

| Repository | Change | Reason |
|------------|--------|--------|
| AbstractPdoRepository | Added `getRawPdo(): PDO` | DepartmentController and CategoryController need raw PDO for case-insensitive uniqueness queries |
| TicketRepository | Added `countByDepartment(int, bool): int` | DepartmentController HAS_ACTIVE_TICKETS guard |
| CategoryRepository | Extended `findAll()` with `excludeStaffOnly` param | CategoryController anonymous visibility filter |
| SubstatusRepository | Extended `findAll()` with optional `primaryStatus` filter; added `clearDefaults(string, ?int)` | SubstatusController.index filter + isDefault auto-clear |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created ApiController base class not produced by Wave 2a**
- **Found during:** Task 1 setup
- **Issue:** Plan 05 controllers extend `ApiController`, but Wave 2a (plan 03) produced middleware and JSON infrastructure without a controller base class. The `Controllers/Api/` directory was empty.
- **Fix:** Created `src/Controllers/Api/ApiController.php` as an abstract base providing all required instance helpers. The class wraps existing `JsonResponse` (static) and `RbacMiddleware::callerHasRole()` into instance methods, plus stores the `Request` object via `setRequest()`.
- **Files modified:** `crm/src/Controllers/Api/ApiController.php` (created)
- **Commit:** ecf2b66

## Self-Check

**Files exist:**
- ✅ `crm/src/Repositories/CategoryGroupRepository.php`
- ✅ `crm/src/Controllers/Api/DepartmentController.php`
- ✅ `crm/src/Controllers/Api/CategoryGroupController.php`
- ✅ `crm/src/Controllers/Api/CategoryController.php`
- ✅ `crm/src/Controllers/Api/SubstatusController.php`
- ✅ `crm/src/Controllers/Api/ApiController.php` (deviation fix)

**Key contracts verified:**
- ✅ `class CategoryGroupRepository` at line 7
- ✅ `class DepartmentController extends ApiController` at line 10
- ✅ `class CategoryGroupController extends ApiController` at line 8
- ✅ `class CategoryController extends ApiController` at line 11
- ✅ `class SubstatusController extends ApiController` at line 8
- ✅ `clearDefaults` called in SubstatusController at lines 36 and 87
- ✅ `FIELD_OPTIONS_REQUIRED` in CategoryController at line 256
- ✅ `HAS_ACTIVE_TICKETS` + `countByDepartment` in DepartmentController at lines 96-100
- ✅ `excludeStaffOnly` visibility filter in CategoryController.index() at line 25

**Commits verified:**
- ✅ ecf2b66: Task 1 (CategoryGroupRepository + DepartmentController + CategoryGroupController + ApiController)
- ✅ 257b75d: Task 2 (CategoryController + SubstatusController + repo extensions)

## Self-Check: PASSED
