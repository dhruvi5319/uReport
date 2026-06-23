---

## F02: Department & Category Management

**Description:** Tickets are routed to departments via category assignment. Administrators configure the category taxonomy — including SLA days, display and posting permissions, custom fields, default assignees, and auto-close rules — that governs how tickets flow through the system. Department management defines the organizational units that own ticket queues. Both entities use soft-deactivation to preserve historical data integrity.

**Terminology:**
- **Category Group:** A named grouping of categories for organizational display. Maps to `categoryGroups` table.
- **Custom Field:** A category-specific extra input field (text, select, date, checkbox) configured per category. Stored in a JSON column or `categoryFields` table.
- **SLA Days:** Number of business days from ticket creation to expected closure for a given category (`categories.slaDays`).
- **Display Permission:** Whether ticket list items in this category are visible to the public, staff only, or anonymous.
- **Posting Permission:** Whether new tickets in this category can be submitted by staff only, authenticated public, or anonymous.
- **Default Assignee:** The staff person automatically assigned to new tickets in this category or department.
- **Auto-Close:** A rule to automatically close tickets in a category after N days of inactivity.

**Sub-features:**
- Create, edit, and deactivate departments
- Create, edit, and deactivate categories
- Assign categories to departments
- Group categories under category groups
- Configure per-category SLA days
- Configure per-category display and posting permissions
- Define per-category custom fields
- Configure per-category auto-close rules
- Assign default staff member per category and per department

---

### F02 Process: Create Category

1. Admin submits category payload.
2. System validates `departmentId` references an active department.
3. System validates `groupId` if provided references an active category group.
4. System saves category with `active = true`.
5. System returns created category with HTTP 201.

### F02 Process: Deactivate Department or Category

1. Admin requests deactivation.
2. System checks: if any active tickets are assigned to this department or category, warn the admin (proceed requires confirmation).
3. System sets `active = false`; does not delete.
4. Deactivated categories are hidden from public submission forms and Open311 services list.
5. Existing tickets in the category are unaffected.

### F02 Process: Update Category Custom Fields

1. Admin submits updated `fields` array with field definitions.
2. System validates each field: `name`, `type` (text|select|date|checkbox), `required` flag, `options` array (for select type).
3. System persists field definitions; existing ticket custom field values are preserved (orphaned if field removed).
4. System returns updated category with HTTP 200.

---

### F02 Inputs

**Create/Edit Department:**
- `name` (string, required, max 255): Department name
- `defaultAssigneeId` (integer, optional): Default staff person for new tickets
- `active` (boolean, optional, default true)

**Create/Edit Category:**
- `name` (string, required, max 255): Category name
- `departmentId` (integer, required): Owning department
- `groupId` (integer, optional): Category group
- `slaDays` (integer, optional, min 0): Business days for SLA
- `displayPermission` (enum, required): `public` | `staff` | `anonymous`
- `postingPermission` (enum, required): `staff` | `public` | `anonymous`
- `defaultAssigneeId` (integer, optional): Overrides department default
- `autoCloseDays` (integer, optional, min 0): Days of inactivity before auto-close (0 = disabled)
- `active` (boolean, optional, default true)
- `fields` (array, optional): Custom field definitions

**Custom Field Definition Object:**
- `code` (string, required, max 50): Machine-readable key (URL-safe, unique within category)
- `label` (string, required, max 255): Display label
- `type` (enum, required): `text` | `select` | `date` | `checkbox`
- `required` (boolean, default false)
- `options` (array of strings, required when type = `select`): Allowed values

---

### F02 Outputs

- **Department object**: `{ id, name, defaultAssigneeId, active, createdAt, updatedAt }`
- **Category object**: `{ id, name, departmentId, groupId, slaDays, displayPermission, postingPermission, defaultAssigneeId, autoCloseDays, active, fields[], createdAt, updatedAt }`
- **HTTP 201** on create; **HTTP 200** on update; **HTTP 204** on deactivate (or 200 with updated record)

---

### F02 Validation

- `name` must be unique within departments (case-insensitive)
- `name` must be unique within categories (case-insensitive)
- `departmentId` must reference an active department
- `slaDays` ≥ 0; null means "no SLA" (not displayed/tracked)
- `displayPermission` must be one of: `public`, `staff`, `anonymous`
- `postingPermission` must be one of: `staff`, `public`, `anonymous`
- `displayPermission = 'anonymous'` implies `postingPermission` may also be `anonymous`
- `postingPermission = 'anonymous'` requires `displayPermission` to be `public` or `anonymous`
- Custom field `code` must match `/^[a-z0-9_]+$/` and be unique within the category
- `type = 'select'` requires at least one option in `options`
- `defaultAssigneeId` must reference an active person with role `staff` or `admin`
- `autoCloseDays` = 0 or null means auto-close is disabled

---

### F02 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Duplicate department name | 422 | DUPLICATE_NAME | "A department with this name already exists" |
| Duplicate category name | 422 | DUPLICATE_NAME | "A category with this name already exists" |
| Invalid `departmentId` | 422 | INVALID_DEPARTMENT | "Department not found or inactive" |
| Invalid `groupId` | 422 | INVALID_GROUP | "Category group not found" |
| Invalid `defaultAssigneeId` | 422 | INVALID_ASSIGNEE | "Assignee not found or not active staff" |
| Select field with no options | 422 | FIELD_OPTIONS_REQUIRED | "Select-type fields require at least one option" |
| Deactivate department with active tickets | 409 | HAS_ACTIVE_TICKETS | "Department has active tickets; confirm to proceed" |
| Department/category not found | 404 | NOT_FOUND | "Department/category not found" |
| Caller not admin | 403 | FORBIDDEN | "Admin role required" |

---

### F02 API Surface (this feature)

Full schemas: see `Y1b-api-admin.md` §Departments and §Categories.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/departments` | staff/admin | List all departments |
| POST | `/api/departments` | admin | Create department |
| GET | `/api/departments/{id}` | staff/admin | Get department detail |
| PUT | `/api/departments/{id}` | admin | Update department |
| DELETE | `/api/departments/{id}` | admin | Deactivate department |
| GET | `/api/categories` | staff/admin (or public for active) | List categories |
| POST | `/api/categories` | admin | Create category |
| GET | `/api/categories/{id}` | Any (visibility-checked) | Get category detail |
| PUT | `/api/categories/{id}` | admin | Update category |
| DELETE | `/api/categories/{id}` | admin | Deactivate category |
| GET | `/api/category-groups` | staff/admin | List category groups |
| POST | `/api/category-groups` | admin | Create category group |
| PUT | `/api/category-groups/{id}` | admin | Update category group |
| DELETE | `/api/category-groups/{id}` | admin | Delete category group |

---

### F02 Schema Surface (this feature)

Tables: `departments`, `categories`, `categoryGroups`. See `Y0a-schema-core.md` §departments and §categories.

Key columns:
- `departments`: `id`, `name`, `defaultAssigneeId` (FK → people), `active`
- `categories`: `id`, `name`, `departmentId` (FK → departments), `groupId` (FK → categoryGroups), `slaDays`, `displayPermission`, `postingPermission`, `defaultAssigneeId`, `autoCloseDays`, `active`, `fields` (JSON)
- `categoryGroups`: `id`, `name`, `sortOrder`, `active`
