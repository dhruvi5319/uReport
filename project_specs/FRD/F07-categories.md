---

## F07: Category and Category-Group Management

**Description:** Categories are the service type taxonomy for uReport (equivalent to Open311 services). They are grouped into named, ordered category groups. Each category carries rich configuration: posting/display permission levels, a custom field schema, SLA days, auto-close rules, a default assignee, per-action response templates, and notification reply email. Categories are the primary ticket routing mechanism.

---

### Terminology

- **Category Group:** A named container that groups related categories for display ordering. Has an `ordering` integer.
- **customFields:** A JSON schema stored on a category defining the structured data fields constituents must/may fill in when submitting a ticket. Values are stored on the ticket's `customFields` JSONB column.
- **slaDays:** Service Level Agreement — number of calendar days by which a ticket in this category should be closed. Used in SLA reporting (F17) and `expected_datetime` in Open311 responses.
- **autoClose:** When `autoCloseIsActive = true`, stale open tickets in this category are automatically closed to `autoCloseSubstatus_id` by the scheduled job (F16).
- **notificationReplyEmail:** The reply-to address used in outbound notification emails for tickets in this category.
- **featured:** Boolean flag indicating this category should be displayed prominently on the public submission form.
- **active:** Boolean flag; inactive categories are hidden from public and excluded from Open311 services list.
- **category_action_responses:** Per-category overrides for action description templates and reply emails (see F09).

---

### Sub-features

- Create, read, update, delete category records
- Assign category to department and optional default person
- Assign category to a category group
- Set active and featured flags
- Configure display and posting permission levels
- Define customFields JSON schema
- Set slaDays
- Set notificationReplyEmail
- Configure autoClose rule (isActive + substatus target)
- Create, read, update, delete category group records
- Set ordering on category groups
- View all categories within a group
- Manage category_action_responses (see F09)

---

### Process

#### Create Category
1. Staff POSTs to `POST /api/v1/categories` with required fields.
2. System validates `name` is non-empty; `department_id` references existing department.
3. System validates `displayPermissionLevel` and `postingPermissionLevel` are valid values.
4. System validates `autoCloseSubstatus_id` references a closed-type substatus if `autoCloseIsActive = true`.
5. System validates `customFields` is valid JSON if provided.
6. System inserts `categories` row.
7. System sets `lastModified = NOW()`.
8. Returns created category with 201.

#### Update Category
1. Staff PATCHes `/api/v1/categories/{id}`.
2. System validates changed fields as in Create.
3. System updates `categories` row and `lastModified = NOW()`.
4. Returns updated category.

#### Create Category Group
1. Staff POSTs to `POST /api/v1/category-groups` with `name` and `ordering`.
2. System inserts `categoryGroups` row.
3. Returns created group with 201.

#### Reorder Category Groups
1. Staff PUTs to `PUT /api/v1/category-groups/order` with array of `{id, ordering}` pairs.
2. System updates `ordering` on each group.

#### List Categories for Open311
- Returns all categories where `active = true` AND `postingPermissionLevel IN ('public','anonymous')`, ordered by group ordering then name. (See F02.)

---

### customFields JSON Schema Format

The `customFields` column stores a JSON array of field definition objects:

```json
[
  {
    "key": "field_key",
    "label": "Field Label",
    "type": "string|number|singlevaluelist|multivaluelist|datetime|text",
    "required": true,
    "order": 1,
    "options": ["Option A", "Option B"]
  }
]
```

- `key` must be unique within the category's fields.
- `type` values map to Open311 attribute `datatype` values.
- `options` is required for `singlevaluelist` and `multivaluelist` types.
- Ticket `customFields` JSONB stores `{ "field_key": "user_value" }` pairs.

---

### Inputs

**Category:**
- `name` (string, required): Category name; max 200 chars.
- `description` (text, optional): Description shown to constituents.
- `department_id` (integer, optional): FK to `departments.id`.
- `defaultPerson_id` (integer, optional): FK to `people.id` (staff).
- `categoryGroup_id` (integer, optional): FK to `categoryGroups.id`.
- `active` (boolean, optional): Default true.
- `featured` (boolean, optional): Default false.
- `displayPermissionLevel` (string, required): `anonymous`, `public`, or `staff`.
- `postingPermissionLevel` (string, required): `anonymous`, `public`, or `staff`.
- `customFields` (JSON array, optional): Field schema (see above).
- `slaDays` (integer, optional): SLA target days; null = no SLA.
- `notificationReplyEmail` (string, optional): Reply-to email for notifications.
- `autoCloseIsActive` (boolean, optional): Default false.
- `autoCloseSubstatus_id` (integer, optional): FK to `substatus.id` (must be closed-type).

**Category Group:**
- `name` (string, required): Group name; max 100 chars.
- `ordering` (integer, required): Display sort order.

---

### Outputs

- **Category object:** id, name, description, department_id, department (name), defaultPerson_id, defaultPerson (name), categoryGroup_id, categoryGroup (name), active, featured, displayPermissionLevel, postingPermissionLevel, customFields, slaDays, notificationReplyEmail, autoCloseIsActive, autoCloseSubstatus_id, lastModified.
- **Category Group object:** id, name, ordering, categoryCount, categories (array of category summaries).

---

### Validation Rules

- `name` required; max 200 chars.
- `displayPermissionLevel` and `postingPermissionLevel` must each be `anonymous`, `public`, or `staff`.
- `autoCloseSubstatus_id` must reference a substatus with `status = 'closed'` if `autoCloseIsActive = true`.
- `defaultPerson_id` must reference a person with `role = 'staff'` if provided.
- `customFields` must be valid JSON array conforming to field schema format.
- `slaDays` must be a positive integer if provided.
- `notificationReplyEmail` must be valid RFC 5322 email format if provided.
- Deleting a category is blocked if any tickets reference it. Deactivate (`active = false`) instead.
- Category group `ordering` values need not be unique; ties are broken by name.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Category not found | 404 | CATEGORY_NOT_FOUND | "Category not found" |
| Invalid permission level | 422 | INVALID_PERMISSION_LEVEL | "Permission level must be anonymous, public, or staff" |
| autoCloseSubstatus not closed-type | 422 | INVALID_SUBSTATUS | "Auto-close substatus must be a closed-type substatus" |
| defaultPerson not staff | 422 | INVALID_DEFAULT_PERSON | "Default person must have staff role" |
| Delete blocked by tickets | 409 | CATEGORY_IN_USE | "Category has associated tickets; deactivate instead" |
| Category group not found | 404 | GROUP_NOT_FOUND | "Category group not found" |
| Invalid customFields JSON | 422 | INVALID_CUSTOM_FIELDS | "customFields must be a valid JSON array" |

---

### API Surface (this feature)

See full schemas in `Y1c-api-admin.md §Categories`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/categories` | staff/public/anonymous (per permission) | List categories |
| POST | `/api/v1/categories` | staff | Create category |
| GET | `/api/v1/categories/{id}` | staff/public/anonymous | Get category detail |
| PUT | `/api/v1/categories/{id}` | staff | Update category |
| DELETE | `/api/v1/categories/{id}` | staff | Delete category |
| GET | `/api/v1/category-groups` | staff | List category groups |
| POST | `/api/v1/category-groups` | staff | Create category group |
| GET | `/api/v1/category-groups/{id}` | staff | Get group with categories |
| PUT | `/api/v1/category-groups/{id}` | staff | Update category group |
| DELETE | `/api/v1/category-groups/{id}` | staff | Delete group |
| PUT | `/api/v1/category-groups/order` | staff | Reorder groups |

---

### Schema Surface (this feature)

Tables: `categories`, `categoryGroups`. See `Y0c-schema-categories.md §Categories`.

Key columns:
- `categoryGroups`: id (SERIAL PK), name (VARCHAR 100), ordering (INTEGER).
- `categories`: id (SERIAL PK), name (VARCHAR 200), description (TEXT), department_id (FK), defaultPerson_id (FK people, nullable), categoryGroup_id (FK categoryGroups), active (BOOLEAN DEFAULT true), featured (BOOLEAN DEFAULT false), displayPermissionLevel (VARCHAR 20), postingPermissionLevel (VARCHAR 20), customFields (JSONB), lastModified (TIMESTAMPTZ), slaDays (INTEGER), notificationReplyEmail (VARCHAR 255), autoCloseIsActive (BOOLEAN DEFAULT false), autoCloseSubstatus_id (FK substatus, nullable).
