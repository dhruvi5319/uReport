---

## F8: Category and Category Group Management

**Priority:** P1 — High

### Description

Categories classify service request types (e.g., "Pothole", "Graffiti"). Categories are grouped into Category Groups (e.g., "Streets", "Sanitation"). Each category belongs to a department, has permission levels controlling visibility, and can have a default assignee, SLA configuration, response templates, and auto-close behavior. The admin panel at `/admin/categories` manages the full taxonomy.

### Terminology

- **Category Group** (`categoryGroups`) — Top-level grouping of related categories. Used in the Open311 `group` field and in the public submission form's category picker.
- **displayPermissionLevel** — Controls who can *view* cases in this category: `staff`, `public`, `anonymous`.
- **postingPermissionLevel** — Controls who can *submit* cases in this category: `staff`, `public`, `anonymous`.
- **Featured** — `categories.featured = true`; highlights the category in the public submission form.
- **autoClose** — When `categories.autoCloseIsActive = true` and the system-configured auto-close interval elapses, tickets in this category are automatically closed with `autoCloseSubstatus_id`.
- **Category action response** — A response template body associated with a specific category + action type combination (`category_action_responses`). Used to pre-fill action notes on the case detail.

### Sub-features

- List category groups (with category count)
- Create / edit / delete category groups
- List categories within a group (or all categories)
- Create / edit / delete categories
- Assign category to department
- Set default person (assignee) for category
- Set display and posting permission levels
- Set active / featured flags
- Set SLA days
- Set notification reply email
- Configure auto-close substatus
- Manage category-level response templates (category_action_responses)
- Inline editing with toast notifications

### Process — List Category Groups

1. Staff navigates to `/admin/categories`.
2. `GET /api/category-groups` returns all groups with ordering and category count.
3. Groups are shown in `ordering` sequence with expand/collapse to show their categories.

### Process — Create/Edit Category Group

1. Staff clicks "New Group" or "Edit" on a group.
2. Form fields: `name` (required, max 50 chars), `ordering` (optional integer).
3. `POST /api/category-groups` or `PUT /api/category-groups/{id}`.
4. Toast "Category group saved"; list refreshes.

### Process — Delete Category Group

1. Confirmation dialog.
2. Safety check: if any `categories.categoryGroup_id` references this group → 409 "Cannot delete: group has categories."
3. If safe: `DELETE /api/category-groups/{id}`.

### Process — Create/Edit Category

1. Staff clicks "New Category" or "Edit" on a category row.
2. Sheet opens with full category form.
3. Sections:
   - **Basic**: name, description, department (required), category group, active, featured
   - **Permissions**: displayPermissionLevel, postingPermissionLevel
   - **Assignment**: defaultPerson_id
   - **SLA**: slaDays, notificationReplyEmail
   - **Auto-close**: autoCloseIsActive toggle, autoCloseSubstatus_id selector
   - **Response Templates**: list of `category_action_responses` — each row: action type selector + template textarea + replyEmail
4. On save: `POST /api/categories` or `PUT /api/categories/{id}`. Response templates sent as nested array; system reconciles.

### Process — Delete Category

1. Confirmation dialog.
2. Safety check: if any `tickets.category_id` references this category → 409 "Cannot delete: category has associated tickets."
3. If safe: `DELETE /api/categories/{id}`. Cascades `category_action_responses` rows.

### Inputs — Category Group

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | [R] | Max 50 chars |
| `ordering` | integer | [O] | Positive integer; sets display order |

### Inputs — Category

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | [R] | Max 50 chars |
| `description` | string | [O] | Max 512 chars |
| `department_id` | integer | [R] | Must reference valid department |
| `defaultPerson_id` | integer | [O] | Must reference valid person |
| `categoryGroup_id` | integer | [O] | Must reference valid category group |
| `active` | boolean | [O] | Default true |
| `featured` | boolean | [O] | Default false |
| `displayPermissionLevel` | enum | [R] | staff, public, anonymous; default staff |
| `postingPermissionLevel` | enum | [R] | staff, public, anonymous; default staff |
| `customFields` | text | [O] | JSON definition of custom form fields |
| `slaDays` | integer | [O] | Positive integer; days for SLA resolution |
| `notificationReplyEmail` | string | [O] | Max 128 chars; valid email format |
| `autoCloseIsActive` | boolean | [O] | Default false |
| `autoCloseSubstatus_id` | integer | [O] | Required if autoCloseIsActive is true |

### Inputs — Category Action Response (category_action_responses)

| Field | Type | Required | Validation |
|---|---|---|---|
| `action_id` | integer | [R] | Must reference valid action |
| `template` | text | [O] | Response body text |
| `replyEmail` | string | [O] | Max 128 chars; valid email format |

### Validation Rules

- Category `name` is required; max 50 chars.
- `department_id` is required for category; must exist.
- `displayPermissionLevel` must be one of: `staff`, `public`, `anonymous`.
- `postingPermissionLevel` must be one of: `staff`, `public`, `anonymous`.
- `postingPermissionLevel` must be ≥ permissive as `displayPermissionLevel` (cannot post without displaying).
- `autoCloseSubstatus_id` required when `autoCloseIsActive = true`.
- `notificationReplyEmail` must be valid email format if provided.
- Delete blocked if tickets reference the category.

### Error States

| Scenario | HTTP Status | Message |
|---|---|---|
| Missing name | 400 | "Category name is required" |
| Invalid department_id | 400 | "Department not found" |
| Delete blocked by tickets | 409 | "Cannot delete: category has associated tickets" |
| Invalid permission level | 400 | "Invalid permission level value" |
| Category not found | 404 | "Category not found" |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/category-groups` | List category groups |
| POST | `/api/category-groups` | Create category group |
| PUT | `/api/category-groups/{id}` | Update category group |
| DELETE | `/api/category-groups/{id}` | Delete category group |
| GET | `/api/categories` | List categories (filterable by group/department) |
| POST | `/api/categories` | Create category |
| GET | `/api/categories/{id}` | Category detail |
| PUT | `/api/categories/{id}` | Update category |
| DELETE | `/api/categories/{id}` | Delete category |
| GET | `/api/categories/public` | Public-postable categories (no auth) |

### Schema Surface

- `categories` — core entity
- `categoryGroups` — grouping
- `category_action_responses` — response templates per category+action
- `department_categories` — department-category associations
