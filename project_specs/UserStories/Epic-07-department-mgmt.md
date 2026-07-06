## Epic 7: Department Management (F7)

Departments at `/admin/departments` are organizational units that own categories and receive ticket assignments. Admins manage department records, default assignees, action types, and category associations.

---

### US-7.1: List, Create, and Edit Departments
**As a** Jordan Calloway (System Administrator), **I want to** create and edit department records with a name and optional default assignee, **so that** new organizational units can be configured and tickets routed to them correctly.

**Acceptance Criteria:**
- [ ] `/admin/departments` shows a table: Department Name, Default Person, Category Count, Actions (Edit / Delete)
- [ ] "New Department" button opens a side Sheet with form fields: name (required, max 128 chars), default person (search/select, optional)
- [ ] On save: `POST /api/departments` creates the record; toast "Department created"; list refreshes
- [ ] Clicking "Edit" opens the Sheet pre-filled with department data
- [ ] Edit sheet includes sub-panels: Default Person (search/select with clear button), Action Types (checklist of all `actions` records), Categories (read-only list linking to category admin)
- [ ] Saving edit: `PUT /api/departments/{id}` updates the record and reconciles `department_actions` join table
- [ ] Missing department name shows inline validation error "Department name is required"

**Priority:** P1 | **Feature Ref:** F7

---

### US-7.2: Delete a Department with Safety Check
**As a** Jordan Calloway (System Administrator), **I want to** delete a department with a confirmation dialog and a safety check for associated categories, **so that** I cannot accidentally orphan categories that belong to it.

**Acceptance Criteria:**
- [ ] Clicking "Delete" shows confirmation dialog: "Delete {name}? This cannot be undone."
- [ ] If any category references this department (`categories.department_id`), delete is blocked with: "Cannot delete: department has associated categories."
- [ ] If safe: `DELETE /api/departments/{id}` removes the record; `department_actions` rows cascade-deleted
- [ ] Toast "Department deleted"; list refreshes
- [ ] Only admin role users can delete departments

**Priority:** P1 | **Feature Ref:** F7

---
