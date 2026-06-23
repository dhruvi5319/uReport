---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 05
type: execute
wave: 2
depends_on: [1]
files_modified:
  - crm/src/Controllers/Api/DepartmentController.php
  - crm/src/Controllers/Api/CategoryController.php
  - crm/src/Controllers/Api/CategoryGroupController.php
  - crm/src/Controllers/Api/SubstatusController.php
  - crm/src/Repositories/CategoryGroupRepository.php
autonomous: true

features:
  implements: ["F2", "F17"]
  depends_on: ["F0"]
  enables: ["F15"]

must_haves:
  truths:
    - "GET /api/departments returns paginated list; POST creates; PUT updates; DELETE deactivates"
    - "GET /api/categories lists (public cats visible to all, staff-only filtered by role); POST/PUT/DELETE admin-only"
    - "GET /api/category-groups lists; POST/PUT/DELETE admin-only"
    - "GET /api/substatuses lists with primaryStatus filter; isDefault auto-clear enforced on create/update"
    - "All endpoints return { data, meta, errors } envelope; admin endpoints return 403 for non-admin callers"
    - "Deactivate department with active tickets returns 409 with HAS_ACTIVE_TICKETS error code"
  artifacts:
    - path: "crm/src/Controllers/Api/DepartmentController.php"
      provides: "CRUD endpoints for /api/departments"
      exports: ["DepartmentController"]
    - path: "crm/src/Controllers/Api/CategoryController.php"
      provides: "CRUD endpoints for /api/categories"
      exports: ["CategoryController"]
    - path: "crm/src/Controllers/Api/CategoryGroupController.php"
      provides: "CRUD endpoints for /api/category-groups"
      exports: ["CategoryGroupController"]
    - path: "crm/src/Controllers/Api/SubstatusController.php"
      provides: "CRUD endpoints for /api/substatuses"
      exports: ["SubstatusController"]
    - path: "crm/src/Repositories/CategoryGroupRepository.php"
      provides: "Data access for categoryGroups table"
      exports: ["CategoryGroupRepository"]
  key_links:
    - from: "crm/src/Controllers/Api/DepartmentController.php"
      to: "crm/src/Repositories/DepartmentRepository.php"
      via: "constructor injection"
      pattern: "DepartmentRepository"
    - from: "crm/src/Controllers/Api/CategoryController.php"
      to: "crm/src/Repositories/CategoryRepository.php"
      via: "constructor injection"
      pattern: "CategoryRepository"
    - from: "crm/src/Controllers/Api/SubstatusController.php"
      to: "crm/src/Repositories/SubstatusRepository.php"
      via: "constructor injection"
      pattern: "SubstatusRepository"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "crm/src/Repositories/DepartmentRepository.php"
      exports: ["DepartmentRepository"]
      verify: "grep -n 'class DepartmentRepository' crm/src/Repositories/DepartmentRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "crm/src/Repositories/CategoryRepository.php"
      exports: ["CategoryRepository"]
      verify: "grep -n 'class CategoryRepository' crm/src/Repositories/CategoryRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "crm/src/Repositories/SubstatusRepository.php"
      exports: ["SubstatusRepository"]
      verify: "grep -n 'class SubstatusRepository' crm/src/Repositories/SubstatusRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "crm/src/Repositories/PersonRepository.php"
      exports: ["PersonRepository"]
      verify: "grep -n 'class PersonRepository' crm/src/Repositories/PersonRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "crm/src/Repositories/TicketRepository.php"
      exports: ["TicketRepository"]
      verify: "grep -n 'class TicketRepository' crm/src/Repositories/TicketRepository.php && echo CONTRACT_OK"
  provides:
    - artifact: "crm/src/Controllers/Api/DepartmentController.php"
      exports:
        - "GET /api/departments → list departments"
        - "POST /api/departments → create department"
        - "GET /api/departments/{id} → get department"
        - "PUT /api/departments/{id} → update department"
        - "DELETE /api/departments/{id} → deactivate department"
      shape: |
        Department response shape:
        { id: int, name: string, defaultAssignee: {id,name}|null, active: bool, createdAt: string, updatedAt: string }
        CreateDepartmentBody: { name: string, defaultAssigneeId?: int|null, active?: bool }
      verify: "grep -n 'class DepartmentController' crm/src/Controllers/Api/DepartmentController.php && echo CONTRACT_OK"
    - artifact: "crm/src/Controllers/Api/CategoryController.php"
      exports:
        - "GET /api/categories → list categories"
        - "POST /api/categories → create category (admin)"
        - "GET /api/categories/{id} → get category"
        - "PUT /api/categories/{id} → update category (admin)"
        - "DELETE /api/categories/{id} → deactivate category (admin)"
      shape: |
        Category response shape:
        { id: int, name: string, departmentId: int, groupId: int|null, slaDays: int|null,
          displayPermission: 'public'|'staff'|'anonymous', postingPermission: 'staff'|'public'|'anonymous',
          defaultAssigneeId: int|null, autoCloseDays: int|null, active: bool,
          fields: [{code,label,type,required,options?}], createdAt: string, updatedAt: string }
      verify: "grep -n 'class CategoryController' crm/src/Controllers/Api/CategoryController.php && echo CONTRACT_OK"
    - artifact: "crm/src/Controllers/Api/CategoryGroupController.php"
      exports:
        - "GET /api/category-groups → list groups"
        - "POST /api/category-groups → create group (admin)"
        - "PUT /api/category-groups/{id} → update group (admin)"
        - "DELETE /api/category-groups/{id} → delete group (admin)"
      shape: |
        CategoryGroup response shape:
        { id: int, name: string, sortOrder: int, active: bool }
      verify: "grep -n 'class CategoryGroupController' crm/src/Controllers/Api/CategoryGroupController.php && echo CONTRACT_OK"
    - artifact: "crm/src/Controllers/Api/SubstatusController.php"
      exports:
        - "GET /api/substatuses → list substatuses"
        - "POST /api/substatuses → create substatus (admin)"
        - "GET /api/substatuses/{id} → get substatus"
        - "PUT /api/substatuses/{id} → update substatus (admin)"
        - "DELETE /api/substatuses/{id} → deactivate substatus (admin)"
      shape: |
        Substatus response shape:
        { id: int, label: string, primaryStatus: 'open'|'closed', isDefault: bool,
          active: bool, sortOrder: int, createdAt: string }
        CreateSubstatusBody: { label: string, primaryStatus: 'open'|'closed', isDefault?: bool, active?: bool, sortOrder?: int }
      verify: "grep -n 'class SubstatusController' crm/src/Controllers/Api/SubstatusController.php && echo CONTRACT_OK"
    - artifact: "crm/src/Repositories/CategoryGroupRepository.php"
      exports: ["CategoryGroupRepository"]
      verify: "grep -n 'class CategoryGroupRepository' crm/src/Repositories/CategoryGroupRepository.php && echo CONTRACT_OK"
---

<objective>
Implement Wave 2b admin REST API controllers for departments (F2), categories + category groups (F2), and substatuses (F17). These are the five admin entity controllers that the Wave 3b frontend admin screens depend on.

Purpose: Provide fully functional CRUD API surface for the administrative taxonomy (departments → categories → category groups) and fine-grained ticket state management (substatuses). All endpoints enforce the admin-only role check from Wave 2a's RbacMiddleware.

Output:
- `crm/src/Controllers/Api/DepartmentController.php` — 5 endpoints
- `crm/src/Controllers/Api/CategoryController.php` — 5 endpoints (with custom fields JSON validation)
- `crm/src/Controllers/Api/CategoryGroupController.php` — 4 endpoints
- `crm/src/Controllers/Api/SubstatusController.php` — 5 endpoints (isDefault auto-clear logic)
- `crm/src/Repositories/CategoryGroupRepository.php` — data access for categoryGroups table
</objective>

<feature_dependencies>
Implements: F2: Department & Category Management (departments CRUD, categories CRUD with SLA/custom-fields/permissions/auto-close, category groups CRUD), F17: Substatus Management (substatus CRUD with isDefault auto-clear and primaryStatus validation)
Depends on: F0 (Wave 1 schema — departments, categories, categoryGroups, substatus tables + repositories)
Enables: F15: SPA Frontend — specifically Wave 3b admin screens (/admin/departments, /admin/categories, /admin/substatuses)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/WAVE-SCHEDULE.md
@project_specs/TechArch-uReport.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/01-PLAN.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/02-PLAN.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: CategoryGroupRepository + DepartmentController + CategoryGroupController</name>
  <files>
    crm/src/Repositories/CategoryGroupRepository.php
    crm/src/Controllers/Api/DepartmentController.php
    crm/src/Controllers/Api/CategoryGroupController.php
  </files>
  <action>
All controllers follow the same pattern established by Wave 2a controllers:
- Extend a base `ApiController` (or use a shared response helper) that produces `{ data, meta, errors }` envelope
- Inject repositories via constructor
- Call `RbacMiddleware::requireRole('admin')` for mutating endpoints; `requireRole('staff')` for read endpoints
- Return typed JSON responses with correct HTTP status codes per TechArch §4.1

**IMPORTANT:** Check whether a base ApiController exists at `crm/src/Controllers/Api/ApiController.php` from Wave 2a. If it exists, extend it. If not, replicate the JSON envelope helper pattern from existing Wave 2a controllers (TicketController or AuthController). Do NOT create a new base class — reuse what Wave 2a created.

All SQL uses the Domain objects from Wave 1 Plan 02 (`Domain\Department`, `Domain\Category`, `Domain\CategoryGroup`, etc.) via the typed repositories.

---

**Step 1: `crm/src/Repositories/CategoryGroupRepository.php`**

Maps to `categoryGroups` table (TechArch §3.2 DDL):
```sql
CREATE TABLE categoryGroups (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL,
  sortOrder   INT UNSIGNED NOT NULL DEFAULT 0,
  active      TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_group_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

```php
<?php
declare(strict_types=1);
namespace Repositories;

use Domain\CategoryGroup;

class CategoryGroupRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?CategoryGroup
    {
        $stmt = $this->pdo->prepare('SELECT * FROM categoryGroups WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? CategoryGroup::fromRow($row) : null;
    }

    /** @return CategoryGroup[] */
    public function findAll(bool $activeOnly = false): array
    {
        $sql = $activeOnly
            ? 'SELECT * FROM categoryGroups WHERE active = 1 ORDER BY sortOrder ASC, name ASC'
            : 'SELECT * FROM categoryGroups ORDER BY sortOrder ASC, name ASC';
        return $this->fetchAll($sql, [], fn($row) => CategoryGroup::fromRow($row));
    }

    public function findByName(string $name): ?CategoryGroup
    {
        $stmt = $this->pdo->prepare('SELECT * FROM categoryGroups WHERE name = :name LIMIT 1');
        $stmt->execute(['name' => $name]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? CategoryGroup::fromRow($row) : null;
    }

    public function save(object $entity): CategoryGroup
    {
        /** @var CategoryGroup $entity */
        $data = [
            'name'      => $entity->name,
            'sortOrder' => $entity->sortOrder,
            'active'    => (int) $entity->active,
        ];

        if ($entity->id > 0) {
            $set  = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
            $stmt = $this->pdo->prepare("UPDATE categoryGroups SET $set WHERE id = :id");
            $data['id'] = $entity->id;
            $stmt->execute($data);
            return $this->findById($entity->id) ?? $entity;
        } else {
            $cols = implode(', ', array_keys($data));
            $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
            $stmt = $this->pdo->prepare("INSERT INTO categoryGroups ($cols) VALUES ($vals)");
            $stmt->execute($data);
            return $this->findById((int) $this->pdo->lastInsertId()) ?? $entity;
        }
    }

    public function delete(int $id): void
    {
        // Hard delete — only if no categories reference this group
        $stmt = $this->pdo->prepare("DELETE FROM categoryGroups WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
}
```

---

**Step 2: `crm/src/Controllers/Api/DepartmentController.php`**

Endpoints from TechArch §4.3:
```
GET    /api/departments        → list; auth: staff/admin
POST   /api/departments        → create; auth: admin; body: CreateDepartmentBody
GET    /api/departments/{id}   → get; auth: staff/admin
PUT    /api/departments/{id}   → update; auth: admin; body: CreateDepartmentBody (all optional)
DELETE /api/departments/{id}   → deactivate; auth: admin
```

TypeScript interface from TechArch §4.2 (source of truth for response shape):
```typescript
export interface Department {
  id: number;
  name: string;
  defaultAssignee: PersonRef | null;  // { id: number, name: string }
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentBody {
  name: string;
  defaultAssigneeId?: number | null;
  active?: boolean;
}
```

Tables involved:
- `departments` (id, name, defaultAssigneeId, active, createdAt, updatedAt)
- `people` (joined to resolve defaultAssigneeId → PersonRef)

FRD §F02 validation rules:
- `name` must be unique within departments (case-insensitive) → 422 DUPLICATE_NAME
- `defaultAssigneeId` must reference an active person with role `staff` or `admin` → 422 INVALID_ASSIGNEE
- Deactivate with active tickets → 409 HAS_ACTIVE_TICKETS (check `tickets` table WHERE departmentId = id AND deletedAt IS NULL AND status = 'open')

```php
<?php
declare(strict_types=1);
namespace Controllers\Api;

use Domain\Department;
use Repositories\DepartmentRepository;
use Repositories\PersonRepository;
use Repositories\TicketRepository;

class DepartmentController extends ApiController
{
    public function __construct(
        private readonly DepartmentRepository $departments,
        private readonly PersonRepository     $people,
        private readonly TicketRepository     $tickets,
    ) {}

    /** GET /api/departments */
    public function index(): void
    {
        $this->requireRole('staff');
        $list = $this->departments->findAll(activeOnly: false);
        $this->jsonResponse($this->hydrateList($list), meta: ['total' => count($list)]);
    }

    /** POST /api/departments */
    public function create(): void
    {
        $this->requireRole('admin');
        $body = $this->parseJsonBody();

        $errors = $this->validateDepartmentBody($body, existingId: null);
        if (!empty($errors)) {
            $this->validationError($errors);
            return;
        }

        $dept = new Department(
            id:                0,
            name:              trim($body['name']),
            defaultAssigneeId: $body['defaultAssigneeId'] ?? null,
            active:            $body['active'] ?? true,
            createdAt:         '',
            updatedAt:         '',
        );

        $created = $this->departments->save($dept);
        $this->jsonResponse($this->hydrate($created), status: 201);
    }

    /** GET /api/departments/{id} */
    public function show(int $id): void
    {
        $this->requireRole('staff');
        $dept = $this->departments->findById($id);
        if (!$dept) { $this->notFound('Department not found'); return; }
        $this->jsonResponse($this->hydrate($dept));
    }

    /** PUT /api/departments/{id} */
    public function update(int $id): void
    {
        $this->requireRole('admin');
        $dept = $this->departments->findById($id);
        if (!$dept) { $this->notFound('Department not found'); return; }

        $body   = $this->parseJsonBody();
        $errors = $this->validateDepartmentBody($body, existingId: $id);
        if (!empty($errors)) {
            $this->validationError($errors);
            return;
        }

        $updated = new Department(
            id:                $id,
            name:              trim($body['name'] ?? $dept->name),
            defaultAssigneeId: array_key_exists('defaultAssigneeId', $body)
                                   ? $body['defaultAssigneeId']
                                   : $dept->defaultAssigneeId,
            active:            $body['active'] ?? $dept->active,
            createdAt:         $dept->createdAt,
            updatedAt:         '',
        );

        $saved = $this->departments->save($updated);
        $this->jsonResponse($this->hydrate($saved));
    }

    /** DELETE /api/departments/{id} — deactivates (soft) */
    public function destroy(int $id): void
    {
        $this->requireRole('admin');
        $dept = $this->departments->findById($id);
        if (!$dept) { $this->notFound('Department not found'); return; }

        // F02: warn if active open tickets exist
        $openCount = $this->tickets->countByDepartment($id, statusOpen: true);
        if ($openCount > 0) {
            $this->conflictError('HAS_ACTIVE_TICKETS',
                "Department has {$openCount} active ticket(s); confirm deactivation separately.");
            return;
        }

        $this->departments->delete($id);
        $this->emptyResponse();
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private function hydrate(Department $d): array
    {
        $assignee = null;
        if ($d->defaultAssigneeId) {
            $p = $this->people->findById($d->defaultAssigneeId);
            if ($p) {
                $assignee = ['id' => $p->id, 'name' => $p->fullName()];
            }
        }
        return [
            'id'              => $d->id,
            'name'            => $d->name,
            'defaultAssignee' => $assignee,
            'active'          => (bool) $d->active,
            'createdAt'       => $d->createdAt,
            'updatedAt'       => $d->updatedAt,
        ];
    }

    private function hydrateList(array $departments): array
    {
        return array_map(fn($d) => $this->hydrate($d), $departments);
    }

    private function validateDepartmentBody(array $body, ?int $existingId): array
    {
        $errors = [];

        if (isset($body['name'])) {
            $name = trim($body['name']);
            if ($name === '') {
                $errors[] = ['field' => 'name', 'message' => 'Name is required'];
            } else {
                // Uniqueness check (case-insensitive)
                $stmt = $this->departments->getRawPdo()->prepare(
                    'SELECT id FROM departments WHERE LOWER(name) = LOWER(:name) AND id != :id'
                );
                $stmt->execute(['name' => $name, 'id' => $existingId ?? 0]);
                if ($stmt->fetch()) {
                    $errors[] = ['field' => 'name', 'code' => 'DUPLICATE_NAME',
                                 'message' => 'A department with this name already exists'];
                }
            }
        } elseif ($existingId === null) {
            // name is required on create
            $errors[] = ['field' => 'name', 'message' => 'Name is required'];
        }

        if (array_key_exists('defaultAssigneeId', $body) && $body['defaultAssigneeId'] !== null) {
            $assignee = $this->people->findById((int) $body['defaultAssigneeId']);
            if (!$assignee || !$assignee->active || !in_array($assignee->role, ['staff', 'admin'])) {
                $errors[] = ['field' => 'defaultAssigneeId', 'code' => 'INVALID_ASSIGNEE',
                             'message' => 'Assignee not found or not active staff'];
            }
        }

        return $errors;
    }
}
```

NOTE: `$this->departments->getRawPdo()` — add a `getRawPdo(): \PDO` method on `AbstractPdoRepository` that returns `$this->pdo` (protected field). Alternatively use a dedicated `findByName` helper if the repository provides one. Use whichever approach is already established by Wave 2a controllers.

NOTE: `$this->tickets->countByDepartment(int $deptId, bool $statusOpen)` — add this method to `TicketRepository` if it does not already exist:
```php
public function countByDepartment(int $deptId, bool $statusOpen = false): int
{
    $sql    = 'SELECT COUNT(*) FROM tickets WHERE departmentId = :deptId AND deletedAt IS NULL';
    $params = ['deptId' => $deptId];
    if ($statusOpen) {
        $sql .= " AND status = 'open'";
    }
    $stmt = $this->pdo->prepare($sql);
    $stmt->execute($params);
    return (int) $stmt->fetchColumn();
}
```

---

**Step 3: `crm/src/Controllers/Api/CategoryGroupController.php`**

Endpoints from TechArch §4.3:
```
GET    /api/category-groups        → list all; auth: any
POST   /api/category-groups        → create; auth: admin
PUT    /api/category-groups/{id}   → update; auth: admin
DELETE /api/category-groups/{id}   → delete; auth: admin
```

TypeScript interface (TechArch §4.2):
```typescript
export interface CategoryGroup {
  id: number;
  name: string;
  sortOrder: number;
  active: boolean;
}
```

FRD §F02 validation: `name` must be unique within category groups.

```php
<?php
declare(strict_types=1);
namespace Controllers\Api;

use Domain\CategoryGroup;
use Repositories\CategoryGroupRepository;

class CategoryGroupController extends ApiController
{
    public function __construct(
        private readonly CategoryGroupRepository $groups,
    ) {}

    /** GET /api/category-groups */
    public function index(): void
    {
        $list = $this->groups->findAll(activeOnly: false);
        $this->jsonResponse(array_map(fn($g) => $this->hydrate($g), $list),
                            meta: ['total' => count($list)]);
    }

    /** POST /api/category-groups */
    public function create(): void
    {
        $this->requireRole('admin');
        $body = $this->parseJsonBody();

        $errors = [];
        if (empty($body['name'])) {
            $errors[] = ['field' => 'name', 'message' => 'Name is required'];
        } else {
            $existing = $this->groups->findByName(trim($body['name']));
            if ($existing) {
                $errors[] = ['field' => 'name', 'code' => 'DUPLICATE_NAME',
                             'message' => 'A category group with this name already exists'];
            }
        }
        if (!empty($errors)) { $this->validationError($errors); return; }

        $group = new CategoryGroup(
            id:        0,
            name:      trim($body['name']),
            sortOrder: (int) ($body['sortOrder'] ?? 0),
            active:    $body['active'] ?? true,
        );
        $created = $this->groups->save($group);
        $this->jsonResponse($this->hydrate($created), status: 201);
    }

    /** PUT /api/category-groups/{id} */
    public function update(int $id): void
    {
        $this->requireRole('admin');
        $group = $this->groups->findById($id);
        if (!$group) { $this->notFound('Category group not found'); return; }

        $body   = $this->parseJsonBody();
        $errors = [];
        if (isset($body['name'])) {
            $existing = $this->groups->findByName(trim($body['name']));
            if ($existing && $existing->id !== $id) {
                $errors[] = ['field' => 'name', 'code' => 'DUPLICATE_NAME',
                             'message' => 'A category group with this name already exists'];
            }
        }
        if (!empty($errors)) { $this->validationError($errors); return; }

        $updated = new CategoryGroup(
            id:        $id,
            name:      trim($body['name'] ?? $group->name),
            sortOrder: (int) ($body['sortOrder'] ?? $group->sortOrder),
            active:    $body['active'] ?? $group->active,
        );
        $this->jsonResponse($this->hydrate($this->groups->save($updated)));
    }

    /** DELETE /api/category-groups/{id} */
    public function destroy(int $id): void
    {
        $this->requireRole('admin');
        if (!$this->groups->findById($id)) { $this->notFound('Category group not found'); return; }
        $this->groups->delete($id);
        $this->emptyResponse();
    }

    private function hydrate(CategoryGroup $g): array
    {
        return ['id' => $g->id, 'name' => $g->name,
                'sortOrder' => $g->sortOrder, 'active' => (bool) $g->active];
    }
}
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/crm && composer dump-autoload --quiet && echo "AUTOLOAD OK"
grep -n 'class CategoryGroupRepository' src/Repositories/CategoryGroupRepository.php && echo "REPO OK"
grep -n 'class DepartmentController' src/Controllers/Api/DepartmentController.php && echo "DEPT CTRL OK"
grep -n 'class CategoryGroupController' src/Controllers/Api/CategoryGroupController.php && echo "CG CTRL OK"
php -l src/Repositories/CategoryGroupRepository.php src/Controllers/Api/DepartmentController.php src/Controllers/Api/CategoryGroupController.php && echo "SYNTAX OK"
```
  </verify>
  <done>
- `CategoryGroupRepository.php` exists with `findById`, `findAll`, `findByName`, `save`, `delete`
- `DepartmentController.php` exists with `index`, `create`, `show`, `update`, `destroy` methods
- `CategoryGroupController.php` exists with `index`, `create`, `update`, `destroy` methods
- All three files pass `php -l` syntax check
- `DepartmentController.destroy` checks for active open tickets and returns 409 before deactivating
- `DepartmentController` response shape includes `defaultAssignee: {id, name}|null` (not raw `defaultAssigneeId`)
  </done>
</task>

<task type="auto">
  <name>Task 2: CategoryController + SubstatusController</name>
  <files>
    crm/src/Controllers/Api/CategoryController.php
    crm/src/Controllers/Api/SubstatusController.php
  </files>
  <action>
**Step 1: `crm/src/Controllers/Api/CategoryController.php`**

Endpoints from TechArch §4.3:
```
GET    /api/categories        → list; auth: Any (active public cats visible to all; staff-only hidden from anonymous)
POST   /api/categories        → create; auth: admin
GET    /api/categories/{id}   → get; auth: Any (visibility-checked)
PUT    /api/categories/{id}   → update; auth: admin
DELETE /api/categories/{id}   → deactivate; auth: admin
```

TypeScript interface (TechArch §4.2 — EXACT response shape):
```typescript
export interface CategoryField {
  code: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'checkbox';
  required: boolean;
  options?: string[];
}

export interface Category {
  id: number;
  name: string;
  departmentId: number;
  groupId: number | null;
  slaDays: number | null;
  displayPermission: DisplayPermission;   // 'public'|'staff'|'anonymous'
  postingPermission: PostingPermission;   // 'staff'|'public'|'anonymous'
  defaultAssigneeId: number | null;
  autoCloseDays: number | null;
  active: boolean;
  fields: CategoryField[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryBody {
  name: string;
  departmentId: number;
  groupId?: number;
  slaDays?: number;
  displayPermission: DisplayPermission;
  postingPermission: PostingPermission;
  defaultAssigneeId?: number;
  autoCloseDays?: number;
  active?: boolean;
  fields?: CategoryField[];
}
```

Database table `categories` columns (TechArch §3.2 DDL):
```sql
id, name, departmentId (FK→departments), groupId (FK→categoryGroups, nullable),
slaDays (nullable), displayPermission ENUM('public','staff','anonymous'),
postingPermission ENUM('staff','public','anonymous'),
defaultAssigneeId (FK→people, nullable), autoCloseDays (nullable),
active, fields JSON (nullable), createdAt, updatedAt
```

FRD §F02 validation rules:
- `name` unique within categories (case-insensitive) → 422 DUPLICATE_NAME
- `departmentId` must reference active department → 422 INVALID_DEPARTMENT
- `groupId` must reference existing categoryGroup if provided → 422 INVALID_GROUP
- `defaultAssigneeId` must reference active staff/admin person → 422 INVALID_ASSIGNEE
- `displayPermission` ∈ {'public','staff','anonymous'} → 422
- `postingPermission` ∈ {'staff','public','anonymous'} → 422
- Custom field `code` must match `/^[a-z0-9_]+$/` and be unique within the category → 422
- `type = 'select'` requires at least one option → 422 FIELD_OPTIONS_REQUIRED
- `autoCloseDays` = 0 or null means disabled

Visibility rule for GET /api/categories list:
- Anonymous callers (no auth): return only categories where `displayPermission != 'staff'`
- `staff`/`admin`: return all
- Apply same filter on GET /api/categories/{id}

```php
<?php
declare(strict_types=1);
namespace Controllers\Api;

use Domain\Category;
use Repositories\CategoryRepository;
use Repositories\DepartmentRepository;
use Repositories\CategoryGroupRepository;
use Repositories\PersonRepository;

class CategoryController extends ApiController
{
    public function __construct(
        private readonly CategoryRepository      $categories,
        private readonly DepartmentRepository    $departments,
        private readonly CategoryGroupRepository $groups,
        private readonly PersonRepository        $people,
    ) {}

    /** GET /api/categories */
    public function index(): void
    {
        $role      = $this->getCurrentRole(); // null for anonymous
        $staffOnly = !in_array($role, ['staff', 'admin'], true);
        $list      = $this->categories->findAll(activeOnly: false, excludeStaffOnly: $staffOnly);
        $this->jsonResponse(array_map(fn($c) => $this->hydrate($c), $list),
                            meta: ['total' => count($list)]);
    }

    /** POST /api/categories */
    public function create(): void
    {
        $this->requireRole('admin');
        $body   = $this->parseJsonBody();
        $errors = $this->validateCategoryBody($body, existingId: null);
        if (!empty($errors)) { $this->validationError($errors); return; }

        $cat = new Category(
            id:                0,
            name:              trim($body['name']),
            departmentId:      (int) $body['departmentId'],
            groupId:           isset($body['groupId']) ? (int) $body['groupId'] : null,
            slaDays:           isset($body['slaDays']) ? (int) $body['slaDays'] : null,
            displayPermission: $body['displayPermission'],
            postingPermission: $body['postingPermission'],
            defaultAssigneeId: isset($body['defaultAssigneeId']) ? (int) $body['defaultAssigneeId'] : null,
            autoCloseDays:     isset($body['autoCloseDays']) ? (int) $body['autoCloseDays'] : null,
            active:            $body['active'] ?? true,
            fields:            !empty($body['fields'])
                                   ? json_encode($body['fields'], JSON_THROW_ON_ERROR)
                                   : null,
            createdAt:         '',
            updatedAt:         '',
        );

        $created = $this->categories->save($cat);
        $this->jsonResponse($this->hydrate($created), status: 201);
    }

    /** GET /api/categories/{id} */
    public function show(int $id): void
    {
        $cat  = $this->categories->findById($id);
        $role = $this->getCurrentRole();
        if (!$cat
            || ($cat->displayPermission === 'staff' && !in_array($role, ['staff', 'admin'], true))
        ) {
            $this->notFound('Category not found');
            return;
        }
        $this->jsonResponse($this->hydrate($cat));
    }

    /** PUT /api/categories/{id} */
    public function update(int $id): void
    {
        $this->requireRole('admin');
        $cat = $this->categories->findById($id);
        if (!$cat) { $this->notFound('Category not found'); return; }

        $body   = $this->parseJsonBody();
        $errors = $this->validateCategoryBody($body, existingId: $id);
        if (!empty($errors)) { $this->validationError($errors); return; }

        $updated = new Category(
            id:                $id,
            name:              trim($body['name'] ?? $cat->name),
            departmentId:      (int) ($body['departmentId'] ?? $cat->departmentId),
            groupId:           array_key_exists('groupId', $body)
                                   ? (isset($body['groupId']) ? (int) $body['groupId'] : null)
                                   : $cat->groupId,
            slaDays:           array_key_exists('slaDays', $body)
                                   ? (isset($body['slaDays']) ? (int) $body['slaDays'] : null)
                                   : $cat->slaDays,
            displayPermission: $body['displayPermission'] ?? $cat->displayPermission,
            postingPermission: $body['postingPermission'] ?? $cat->postingPermission,
            defaultAssigneeId: array_key_exists('defaultAssigneeId', $body)
                                   ? (isset($body['defaultAssigneeId']) ? (int) $body['defaultAssigneeId'] : null)
                                   : $cat->defaultAssigneeId,
            autoCloseDays:     array_key_exists('autoCloseDays', $body)
                                   ? (isset($body['autoCloseDays']) ? (int) $body['autoCloseDays'] : null)
                                   : $cat->autoCloseDays,
            active:            $body['active'] ?? $cat->active,
            fields:            array_key_exists('fields', $body)
                                   ? (!empty($body['fields']) ? json_encode($body['fields'], JSON_THROW_ON_ERROR) : null)
                                   : $cat->fields,
            createdAt:         $cat->createdAt,
            updatedAt:         '',
        );

        $saved = $this->categories->save($updated);
        $this->jsonResponse($this->hydrate($saved));
    }

    /** DELETE /api/categories/{id} — deactivates */
    public function destroy(int $id): void
    {
        $this->requireRole('admin');
        if (!$this->categories->findById($id)) { $this->notFound('Category not found'); return; }
        $this->categories->delete($id);  // soft deactivate: set active = 0
        $this->emptyResponse();
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private function hydrate(Category $c): array
    {
        $fields = [];
        if ($c->fields) {
            $decoded = json_decode($c->fields, true);
            $fields  = is_array($decoded) ? $decoded : [];
        }
        return [
            'id'                => $c->id,
            'name'              => $c->name,
            'departmentId'      => $c->departmentId,
            'groupId'           => $c->groupId,
            'slaDays'           => $c->slaDays,
            'displayPermission' => $c->displayPermission,
            'postingPermission' => $c->postingPermission,
            'defaultAssigneeId' => $c->defaultAssigneeId,
            'autoCloseDays'     => $c->autoCloseDays,
            'active'            => (bool) $c->active,
            'fields'            => $fields,
            'createdAt'         => $c->createdAt,
            'updatedAt'         => $c->updatedAt,
        ];
    }

    private function validateCategoryBody(array $body, ?int $existingId): array
    {
        $errors      = [];
        $validDisplay = ['public', 'staff', 'anonymous'];
        $validPost    = ['staff', 'public', 'anonymous'];

        // name
        if ($existingId === null && empty($body['name'])) {
            $errors[] = ['field' => 'name', 'message' => 'Name is required'];
        }
        if (!empty($body['name'])) {
            $stmt = $this->categories->getRawPdo()->prepare(
                'SELECT id FROM categories WHERE LOWER(name) = LOWER(:name) AND id != :id'
            );
            $stmt->execute(['name' => trim($body['name']), 'id' => $existingId ?? 0]);
            if ($stmt->fetch()) {
                $errors[] = ['field' => 'name', 'code' => 'DUPLICATE_NAME',
                             'message' => 'A category with this name already exists'];
            }
        }

        // departmentId
        if (isset($body['departmentId'])) {
            $dept = $this->departments->findById((int) $body['departmentId']);
            if (!$dept || !$dept->active) {
                $errors[] = ['field' => 'departmentId', 'code' => 'INVALID_DEPARTMENT',
                             'message' => 'Department not found or inactive'];
            }
        } elseif ($existingId === null) {
            $errors[] = ['field' => 'departmentId', 'message' => 'Department is required'];
        }

        // groupId
        if (!empty($body['groupId'])) {
            if (!$this->groups->findById((int) $body['groupId'])) {
                $errors[] = ['field' => 'groupId', 'code' => 'INVALID_GROUP',
                             'message' => 'Category group not found'];
            }
        }

        // permissions
        if (isset($body['displayPermission']) && !in_array($body['displayPermission'], $validDisplay, true)) {
            $errors[] = ['field' => 'displayPermission',
                         'message' => 'displayPermission must be public, staff, or anonymous'];
        }
        if (isset($body['postingPermission']) && !in_array($body['postingPermission'], $validPost, true)) {
            $errors[] = ['field' => 'postingPermission',
                         'message' => 'postingPermission must be staff, public, or anonymous'];
        }
        if ($existingId === null) {
            if (empty($body['displayPermission'])) {
                $errors[] = ['field' => 'displayPermission', 'message' => 'displayPermission is required'];
            }
            if (empty($body['postingPermission'])) {
                $errors[] = ['field' => 'postingPermission', 'message' => 'postingPermission is required'];
            }
        }

        // defaultAssigneeId
        if (!empty($body['defaultAssigneeId'])) {
            $assignee = $this->people->findById((int) $body['defaultAssigneeId']);
            if (!$assignee || !$assignee->active || !in_array($assignee->role, ['staff', 'admin'])) {
                $errors[] = ['field' => 'defaultAssigneeId', 'code' => 'INVALID_ASSIGNEE',
                             'message' => 'Assignee not found or not active staff'];
            }
        }

        // custom fields
        if (!empty($body['fields'])) {
            $codes = [];
            foreach ($body['fields'] as $i => $field) {
                $prefix = "fields[$i]";
                if (empty($field['code'])) {
                    $errors[] = ['field' => "$prefix.code", 'message' => 'Field code is required'];
                } elseif (!preg_match('/^[a-z0-9_]+$/', $field['code'])) {
                    $errors[] = ['field' => "$prefix.code",
                                 'message' => 'Field code must match /^[a-z0-9_]+$/'];
                } elseif (in_array($field['code'], $codes, true)) {
                    $errors[] = ['field' => "$prefix.code",
                                 'message' => 'Field codes must be unique within a category'];
                } else {
                    $codes[] = $field['code'];
                }
                if (empty($field['label'])) {
                    $errors[] = ['field' => "$prefix.label", 'message' => 'Field label is required'];
                }
                $validTypes = ['text', 'select', 'date', 'checkbox'];
                if (!in_array($field['type'] ?? '', $validTypes, true)) {
                    $errors[] = ['field' => "$prefix.type",
                                 'message' => 'Field type must be text, select, date, or checkbox'];
                }
                if (($field['type'] ?? '') === 'select' && empty($field['options'])) {
                    $errors[] = ['field' => "$prefix.options", 'code' => 'FIELD_OPTIONS_REQUIRED',
                                 'message' => 'Select-type fields require at least one option'];
                }
            }
        }

        return $errors;
    }
}
```

NOTE: `CategoryRepository` needs these additional methods if not already present from Wave 1:
- `findAll(bool $activeOnly, bool $excludeStaffOnly): array` — if `$excludeStaffOnly` is true, adds `AND displayPermission != 'staff'` to WHERE clause
- `save(object $entity): Category` — INSERT/UPDATE based on `$entity->id > 0`
- `delete(int $id): void` — soft deactivate: `UPDATE categories SET active = 0 WHERE id = :id`
- `getRawPdo(): \PDO` — exposes `$this->pdo` for uniqueness checks (or use a named-query helper)

---

**Step 2: `crm/src/Controllers/Api/SubstatusController.php`**

Endpoints from TechArch §4.3:
```
GET    /api/substatuses        → list; auth: staff/admin
POST   /api/substatuses        → create; auth: admin
GET    /api/substatuses/{id}   → get; auth: staff/admin
PUT    /api/substatuses/{id}   → update; auth: admin
DELETE /api/substatuses/{id}   → deactivate; auth: admin
```

TypeScript interface (TechArch §4.2 — EXACT response shape):
```typescript
export interface Substatus {
  id: number;
  label: string;
  primaryStatus: TicketStatus;   // 'open'|'closed'
  isDefault: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CreateSubstatusBody {
  label: string;
  primaryStatus: TicketStatus;
  isDefault?: boolean;
  active?: boolean;
  sortOrder?: number;
}
```

Database table `substatus` columns (TechArch §3.2 DDL):
```sql
id, label VARCHAR(100), primaryStatus ENUM('open','closed'),
isDefault TINYINT(1) DEFAULT 0, active TINYINT(1) DEFAULT 1,
sortOrder INT UNSIGNED DEFAULT 0, createdAt, updatedAt
UNIQUE KEY uq_substatus_label_status (label, primaryStatus)
```

FRD §F17 validation rules:
- `label` must be non-empty
- `primaryStatus` must be `open` or `closed`
- `isDefault = true`: only ONE substatus per `primaryStatus` may be isDefault at a time — when setting a new default, **clear** `isDefault` on all others with the same `primaryStatus` in one UPDATE before inserting/updating the target record
- `label` + `primaryStatus` uniqueness enforced by DB UNIQUE KEY; catch PDOException duplicate entry → 422 DUPLICATE_NAME

```php
<?php
declare(strict_types=1);
namespace Controllers\Api;

use Domain\Substatus;
use Repositories\SubstatusRepository;

class SubstatusController extends ApiController
{
    public function __construct(
        private readonly SubstatusRepository $substatuses,
    ) {}

    /** GET /api/substatuses */
    public function index(): void
    {
        $this->requireRole('staff');
        $primaryStatus = $_GET['primaryStatus'] ?? null;
        $list          = $this->substatuses->findAll(
            primaryStatus: in_array($primaryStatus, ['open', 'closed'], true) ? $primaryStatus : null
        );
        $this->jsonResponse(array_map(fn($s) => $this->hydrate($s), $list),
                            meta: ['total' => count($list)]);
    }

    /** POST /api/substatuses */
    public function create(): void
    {
        $this->requireRole('admin');
        $body   = $this->parseJsonBody();
        $errors = $this->validateSubstatusBody($body);
        if (!empty($errors)) { $this->validationError($errors); return; }

        try {
            if (!empty($body['isDefault'])) {
                $this->substatuses->clearDefaults($body['primaryStatus']);
            }

            $sub = new Substatus(
                id:            0,
                label:         trim($body['label']),
                primaryStatus: $body['primaryStatus'],
                isDefault:     (bool) ($body['isDefault'] ?? false),
                active:        $body['active'] ?? true,
                sortOrder:     (int) ($body['sortOrder'] ?? 0),
                createdAt:     '',
                updatedAt:     '',
            );
            $created = $this->substatuses->save($sub);
            $this->jsonResponse($this->hydrate($created), status: 201);
        } catch (\PDOException $e) {
            if (str_contains($e->getMessage(), 'Duplicate entry')) {
                $this->validationError([['field' => 'label', 'code' => 'DUPLICATE_NAME',
                    'message' => 'A substatus with this label and primaryStatus already exists']]);
            } else {
                throw $e;
            }
        }
    }

    /** GET /api/substatuses/{id} */
    public function show(int $id): void
    {
        $this->requireRole('staff');
        $sub = $this->substatuses->findById($id);
        if (!$sub) { $this->notFound('Substatus not found'); return; }
        $this->jsonResponse($this->hydrate($sub));
    }

    /** PUT /api/substatuses/{id} */
    public function update(int $id): void
    {
        $this->requireRole('admin');
        $sub = $this->substatuses->findById($id);
        if (!$sub) { $this->notFound('Substatus not found'); return; }

        $body   = $this->parseJsonBody();
        $errors = $this->validateSubstatusBody($body, isUpdate: true);
        if (!empty($errors)) { $this->validationError($errors); return; }

        try {
            $newPrimary   = $body['primaryStatus'] ?? $sub->primaryStatus;
            $newIsDefault = $body['isDefault'] ?? $sub->isDefault;

            // Clear other defaults for this primaryStatus when setting isDefault = true
            if ($newIsDefault && !$sub->isDefault) {
                $this->substatuses->clearDefaults($newPrimary, excludeId: $id);
            }

            $updated = new Substatus(
                id:            $id,
                label:         trim($body['label'] ?? $sub->label),
                primaryStatus: $newPrimary,
                isDefault:     (bool) $newIsDefault,
                active:        $body['active'] ?? $sub->active,
                sortOrder:     (int) ($body['sortOrder'] ?? $sub->sortOrder),
                createdAt:     $sub->createdAt,
                updatedAt:     '',
            );
            $saved = $this->substatuses->save($updated);
            $this->jsonResponse($this->hydrate($saved));
        } catch (\PDOException $e) {
            if (str_contains($e->getMessage(), 'Duplicate entry')) {
                $this->validationError([['field' => 'label', 'code' => 'DUPLICATE_NAME',
                    'message' => 'A substatus with this label and primaryStatus already exists']]);
            } else {
                throw $e;
            }
        }
    }

    /** DELETE /api/substatuses/{id} — deactivates */
    public function destroy(int $id): void
    {
        $this->requireRole('admin');
        if (!$this->substatuses->findById($id)) { $this->notFound('Substatus not found'); return; }
        $this->substatuses->delete($id);
        $this->emptyResponse();
    }

    private function hydrate(Substatus $s): array
    {
        return [
            'id'            => $s->id,
            'label'         => $s->label,
            'primaryStatus' => $s->primaryStatus,
            'isDefault'     => (bool) $s->isDefault,
            'active'        => (bool) $s->active,
            'sortOrder'     => $s->sortOrder,
            'createdAt'     => $s->createdAt,
        ];
    }

    private function validateSubstatusBody(array $body, bool $isUpdate = false): array
    {
        $errors = [];
        if (!$isUpdate && empty($body['label'])) {
            $errors[] = ['field' => 'label', 'message' => 'Label is required'];
        }
        if (!$isUpdate && empty($body['primaryStatus'])) {
            $errors[] = ['field' => 'primaryStatus', 'message' => 'primaryStatus is required'];
        }
        if (isset($body['primaryStatus']) && !in_array($body['primaryStatus'], ['open', 'closed'], true)) {
            $errors[] = ['field' => 'primaryStatus',
                         'message' => 'primaryStatus must be open or closed'];
        }
        return $errors;
    }
}
```

NOTE: `SubstatusRepository` needs these additional methods if not already present from Wave 1:
- `findAll(?string $primaryStatus): array` — if `$primaryStatus` is set, adds `WHERE primaryStatus = :ps`; orders by `sortOrder ASC, label ASC`
- `save(object $entity): Substatus` — INSERT/UPDATE based on `$entity->id > 0`; returns hydrated Substatus
- `delete(int $id): void` — soft deactivate: `UPDATE substatus SET active = 0 WHERE id = :id`
- `clearDefaults(string $primaryStatus, ?int $excludeId = null): void` — `UPDATE substatus SET isDefault = 0 WHERE primaryStatus = :ps` (and if `$excludeId` is set, add `AND id != :excludeId`)
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/crm && composer dump-autoload --quiet && echo "AUTOLOAD OK"
grep -n 'class CategoryController' src/Controllers/Api/CategoryController.php && echo "CAT CTRL OK"
grep -n 'class SubstatusController' src/Controllers/Api/SubstatusController.php && echo "SUB CTRL OK"
grep -n 'clearDefaults' src/Controllers/Api/SubstatusController.php && echo "ISDEFAULT LOGIC OK"
grep -n 'FIELD_OPTIONS_REQUIRED' src/Controllers/Api/CategoryController.php && echo "FIELD_OPT OK"
grep -n 'HAS_ACTIVE_TICKETS\|countByDepartment' src/Controllers/Api/DepartmentController.php && echo "DEPT_DEACT OK"
php -l src/Controllers/Api/CategoryController.php src/Controllers/Api/SubstatusController.php && echo "SYNTAX OK"
```
  </verify>
  <done>
- `CategoryController.php` exists with `index`, `create`, `show`, `update`, `destroy` methods
- `SubstatusController.php` exists with `index`, `create`, `show`, `update`, `destroy` methods
- `CategoryController.index` filters out `displayPermission=staff` categories for non-staff callers
- `CategoryController` validates custom fields: unique codes, `/^[a-z0-9_]+$/` pattern, select type requires options
- `SubstatusController.create` and `update` call `clearDefaults()` before saving when `isDefault = true`
- `SubstatusController` catches PDOException for duplicate `(label, primaryStatus)` UNIQUE KEY violation and returns 422
- All files pass `php -l` syntax check
- `composer dump-autoload` exits 0
  </done>
</task>

</tasks>

<verification>
```bash
cd /app/workspaces/pivota/uReport/crm

# All 5 files exist
ls src/Repositories/CategoryGroupRepository.php \
   src/Controllers/Api/DepartmentController.php \
   src/Controllers/Api/CategoryGroupController.php \
   src/Controllers/Api/CategoryController.php \
   src/Controllers/Api/SubstatusController.php && echo "ALL FILES PRESENT"

# Syntax check all 5 files
for f in src/Repositories/CategoryGroupRepository.php \
          src/Controllers/Api/DepartmentController.php \
          src/Controllers/Api/CategoryGroupController.php \
          src/Controllers/Api/CategoryController.php \
          src/Controllers/Api/SubstatusController.php; do
  php -l "$f" || exit 1
done && echo "ALL SYNTAX OK"

# Autoloader resolves all new classes
composer dump-autoload --quiet && echo "COMPOSER AUTOLOAD OK"

# Key contracts
grep -n 'class CategoryGroupRepository' src/Repositories/CategoryGroupRepository.php && echo CONTRACT_OK
grep -n 'class DepartmentController' src/Controllers/Api/DepartmentController.php && echo CONTRACT_OK
grep -n 'class CategoryGroupController' src/Controllers/Api/CategoryGroupController.php && echo CONTRACT_OK
grep -n 'class CategoryController' src/Controllers/Api/CategoryController.php && echo CONTRACT_OK
grep -n 'class SubstatusController' src/Controllers/Api/SubstatusController.php && echo CONTRACT_OK

# F17 isDefault auto-clear
grep -n 'clearDefaults' src/Controllers/Api/SubstatusController.php && echo "SUBSTATUS_ISDEFAULT_OK"

# F02 custom fields validation
grep -n 'FIELD_OPTIONS_REQUIRED' src/Controllers/Api/CategoryController.php && echo "CUSTOM_FIELDS_OK"

# F02 deactivation guard
grep -n 'HAS_ACTIVE_TICKETS' src/Controllers/Api/DepartmentController.php && echo "DEPT_DEACT_GUARD_OK"

# Visibility filter for categories
grep -n 'excludeStaffOnly\|displayPermission' src/Controllers/Api/CategoryController.php && echo "CAT_VISIBILITY_OK"
```
</verification>

<success_criteria>
- Five files created: `CategoryGroupRepository`, `DepartmentController`, `CategoryGroupController`, `CategoryController`, `SubstatusController`
- `GET /api/departments` → returns `[{ id, name, defaultAssignee: {id,name}|null, active, createdAt, updatedAt }]` for staff/admin callers
- `POST /api/departments` → 201 on success; 422 on duplicate name or invalid assignee; 403 for non-admin
- `DELETE /api/departments/{id}` → 409 HAS_ACTIVE_TICKETS if open tickets exist; 204 otherwise
- `GET /api/categories` → filters out `displayPermission=staff` categories for anonymous callers
- `POST /api/categories` → validates custom field codes match `/^[a-z0-9_]+$/`; select fields require options; returns 422 FIELD_OPTIONS_REQUIRED
- `POST /api/substatuses` with `isDefault: true` → clears `isDefault` on all other substatuses with same `primaryStatus` before inserting
- All endpoints use `{ data, meta, errors }` JSON envelope
- All admin-only endpoints return 403 for `staff` or anonymous callers
- `composer dump-autoload` exits 0; all files pass `php -l`
</success_criteria>

<output>
After completion, create `.planning/express/modernize-the-ureport-legacy-php-crm-imp/05-SUMMARY.md` following the summary template with:
- Files created: 5
- Key decisions: CategoryController uses role-aware visibility filter; SubstatusController clears isDefault atomically; DepartmentController deactivation guard checks live open-ticket count
- Integration contracts fulfilled: DepartmentRepository, CategoryRepository, SubstatusRepository, PersonRepository, TicketRepository consumed from Wave 1
</output>
