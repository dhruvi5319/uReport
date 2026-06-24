---

## F06: Department Administration

**Description:** Departments represent organizational units within the municipality (e.g., Streets, Sanitation, Parks). Each department has a name and an optional default person (default assignee for tickets routed to that department). Departments are linked to categories via `department_categories` and to available action types via `department_actions`. Staff members belong to departments via `people.department_id`.

---

### Terminology

- **defaultPerson:** The staff member automatically assigned as the default assignee for tickets belonging to this department's categories.
- **department_actions:** A join table mapping departments to the action types available to them (custom + inherited system actions).
- **department_categories:** A join table mapping departments to the categories they are responsible for.

---

### Sub-features

- Create, read, update, delete department records
- Assign a default person to a department
- Associate departments with categories
- Associate departments with action types
- View staff members belonging to a department
- View categories assigned to a department

---

### Process

#### Create Department
1. Staff POSTs to `POST /api/v1/departments` with `name` and optional `defaultPerson_id`.
2. System validates `name` is non-empty and unique.
3. System validates `defaultPerson_id` references a staff person if provided.
4. System inserts `departments` row.
5. Returns created department with 201.

#### Associate Categories
1. Staff PUTs to `PUT /api/v1/departments/{id}/categories` with array of `category_id` values.
2. System replaces the `department_categories` rows for this department (delete-and-reinsert).
3. Returns updated category list.

#### Associate Actions
1. Staff PUTs to `PUT /api/v1/departments/{id}/actions` with array of `action_id` values.
2. System replaces `department_actions` rows for this department.
3. Returns updated action list.

#### List Staff in Department
1. Staff GETs `/api/v1/departments/{id}/people`.
2. System queries `people WHERE department_id = id AND role = 'staff'`.
3. Returns paginated list.

---

### Inputs

- `name` (string, required): Department name; max 100 chars.
- `defaultPerson_id` (integer, optional): FK to `people.id`; must be a staff person.
- `category_ids` (array of integers, optional): Used when setting category associations.
- `action_ids` (array of integers, optional): Used when setting action associations.

---

### Outputs

- **Department object:** id, name, defaultPerson_id, defaultPerson (name), categoryCount, staffCount.
- **Department list:** Paginated array of department objects.
- **Categories list:** Array of category objects belonging to the department.
- **People list:** Array of staff person objects in the department.

---

### Validation Rules

- `name` is required; max 100 chars; must be unique (case-insensitive) across departments.
- `defaultPerson_id` must reference a person with `role = 'staff'` if provided.
- Deleting a department is blocked if any `categories.department_id` references it. Must reassign or delete categories first.
- `category_ids` must all reference existing categories.
- `action_ids` must all reference existing actions.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Department not found | 404 | DEPT_NOT_FOUND | "Department not found" |
| Duplicate department name | 409 | DEPT_NAME_CONFLICT | "Department name already exists" |
| defaultPerson not staff | 422 | INVALID_DEFAULT_PERSON | "Default person must have staff role" |
| Delete blocked by categories | 409 | DEPT_IN_USE | "Department has assigned categories" |
| Invalid category_id in list | 422 | CATEGORY_NOT_FOUND | "One or more category IDs not found" |
| Invalid action_id in list | 422 | ACTION_NOT_FOUND | "One or more action IDs not found" |

---

### API Surface (this feature)

See full schemas in `Y1a-api-auth-people.md §Departments`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/departments` | staff | List all departments |
| POST | `/api/v1/departments` | staff | Create department |
| GET | `/api/v1/departments/{id}` | staff | Get department detail |
| PUT | `/api/v1/departments/{id}` | staff | Update department |
| DELETE | `/api/v1/departments/{id}` | staff | Delete department |
| GET | `/api/v1/departments/{id}/people` | staff | List staff in department |
| GET | `/api/v1/departments/{id}/categories` | staff | List categories in department |
| PUT | `/api/v1/departments/{id}/categories` | staff | Set categories for department |
| PUT | `/api/v1/departments/{id}/actions` | staff | Set actions for department |

---

### Schema Surface (this feature)

Tables: `departments`, `department_actions`, `department_categories`. See `Y0c-schema-categories.md §Departments`.

- `departments`: id (SERIAL PK), name (VARCHAR 100 UNIQUE), defaultPerson_id (FK people, nullable).
- `department_actions`: department_id (FK), action_id (FK), PRIMARY KEY (department_id, action_id).
- `department_categories`: department_id (FK), category_id (FK), PRIMARY KEY (department_id, category_id).
