## Epic 8: Category and Category Group Management (F8)

The category admin panel at `/admin/categories` manages the full taxonomy of service request types, their groupings, department assignments, permission levels, SLA configuration, and response templates.

---

### US-8.1: Create a New Category Group
**As a** Jordan Calloway (System Administrator), **I want to** create a new category group with a name and display order, **so that** related service types are organized together in the public submission form and Open311 API.

**Acceptance Criteria:**
- [ ] `/admin/categories` shows category groups in `ordering` sequence with expand/collapse to show child categories
- [ ] "New Group" button opens a form: name (required, max 50 chars), ordering (optional positive integer)
- [ ] `POST /api/category-groups` creates the group; toast "Category group saved"; list refreshes
- [ ] Delete group button shows confirmation dialog; delete is blocked with 409 if the group has associated categories
- [ ] Editing an existing group via "Edit" updates name/ordering via `PUT /api/category-groups/{id}`

**Priority:** P1 | **Feature Ref:** F8

---

### US-8.2: Create and Fully Configure a New Category
**As a** Jordan Calloway (System Administrator), **I want to** create a new service category with department assignment, permission levels, SLA, and response templates in a single form, **so that** 311 operators can classify tickets in the new category within 10 minutes of setup.

**Acceptance Criteria:**
- [ ] "New Category" button opens a Sheet with sections: Basic, Permissions, Assignment, SLA, Auto-close, Response Templates
- [ ] Required fields: name (max 50 chars), department (dropdown)
- [ ] Optional fields: description, category group, active flag, featured flag, default person, SLA days, notification reply email, auto-close substatus
- [ ] `displayPermissionLevel` and `postingPermissionLevel` must each be one of: staff, public, anonymous
- [ ] `postingPermissionLevel` must be ≥ permissive as `displayPermissionLevel` (validated on save)
- [ ] `autoCloseSubstatus_id` is required when `autoCloseIsActive = true`
- [ ] Response Templates sub-panel allows adding/editing/removing `category_action_responses` entries (action type selector + template body + reply email)
- [ ] On save: `POST /api/categories` with nested response templates array; system reconciles
- [ ] Toast "Category saved"; sheet closes; list refreshes

**Priority:** P1 | **Feature Ref:** F8

---

### US-8.3: Delete a Category with Safety Check
**As a** Jordan Calloway (System Administrator), **I want to** delete a category with a confirmation dialog and a ticket safety check, **so that** I cannot remove a category that still has associated service requests.

**Acceptance Criteria:**
- [ ] Clicking "Delete" on a category shows confirmation dialog
- [ ] If any ticket references this category (`tickets.category_id`), delete is blocked with 409: "Cannot delete: category has associated tickets."
- [ ] If safe: `DELETE /api/categories/{id}` removes the category and cascades `category_action_responses`
- [ ] Toast "Category deleted"; list refreshes

**Priority:** P1 | **Feature Ref:** F8

---
