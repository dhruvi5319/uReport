---

## F7: Department Management

**Priority:** P1 — High

### Description

Departments are organizational units that own categories and receive ticket assignments. Each department can have a default assignee person. The department admin panel (`/admin/departments`) allows administrators to create, edit, and delete departments, manage their default person assignment, and view associated categories and action types.

### Terminology

- **Default person** — `departments.defaultPerson_id`; the person automatically assigned to new tickets in this department when no specific assignee is designated.
- **Department actions** — The set of action types allowed for this department, stored in `department_actions` (join table). Controls which action types appear in the case detail action log dropdown.
- **Department categories** — Categories associated with this department via `department_categories` (join table; in addition to the primary FK `categories.department_id`).

### Sub-features

- List departments (name, default person, category count)
- Create department
- Edit department (name, default person)
- Delete department (with safety check)
- View categories belonging to department
- Manage department-level action types (department_actions)
- Manage department-category associations (department_categories)
- Confirmation dialogs for delete

### Process — List Departments

1. Staff navigates to `/admin/departments`.
2. `GET /api/departments` returns all departments with name, default person, and category count.
3. Table renders: Department Name, Default Person, Categories count, Actions (Edit / Delete).

### Process — Create Department

1. Staff clicks "New Department".
2. Sheet opens with form: Name (required), Default Person (search/select from people, optional).
3. On save: `POST /api/departments` creates the record.
4. System creates `departments` record.
5. Toast "Department created"; list refreshes.

### Process — Edit Department

1. Staff clicks "Edit" on a department row.
2. Sheet opens pre-filled.
3. Sub-panels:
   - **Default Person**: search/select any person; clear button removes assignment.
   - **Action Types**: checklist of all `actions` records; checked actions saved to `department_actions`.
   - **Categories**: read-only list of categories where `categories.department_id = this department` (link to category admin).
4. On save: `PUT /api/departments/{id}` updates the record and reconciles `department_actions`.
5. Toast "Department updated".

### Process — Delete Department

1. Staff clicks "Delete" on a department row.
2. Confirmation dialog: "Delete {name}? This cannot be undone."
3. Safety check: if any `categories.department_id` references this department, system returns 409: "Cannot delete: department has associated categories."
4. If safe: `DELETE /api/departments/{id}` removes the record and cascades `department_actions` rows (cascade delete).
5. Toast "Department deleted".

### Inputs

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | [R] | Max 128 chars; unique recommended |
| `defaultPerson_id` | integer | [O] | Must reference valid person |
| `action_ids` | integer[] | [O] | Array of action IDs for department_actions |

### Validation Rules

- `name` is required and max 128 chars.
- `defaultPerson_id` must reference an existing person if provided.
- Delete blocked if any category references this department.
- `action_ids` must reference existing action records; unknown IDs rejected with 400.

### Error States

| Scenario | HTTP Status | Message |
|---|---|---|
| Missing name | 400 | "Department name is required" |
| Invalid defaultPerson_id | 400 | "Person not found" |
| Delete blocked by categories | 409 | "Cannot delete: department has categories" |
| Department not found | 404 | "Department not found" |
| Unauthorized | 403 | "Admin role required" |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/departments` | List all departments |
| POST | `/api/departments` | Create department |
| GET | `/api/departments/{id}` | Department detail |
| PUT | `/api/departments/{id}` | Update department |
| DELETE | `/api/departments/{id}` | Delete department |
| GET | `/api/departments/{id}/categories` | Categories for department |

### Schema Surface

- `departments` — core entity
- `department_actions` — allowed action types (join table)
- `department_categories` — category associations (join table)
- `people` — default person FK
