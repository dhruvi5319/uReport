## Epic 6: People Management (F6)

The people management admin panel at `/admin/people` allows administrators to manage staff, reporters, and contacts — including multiple emails, phones, and addresses per person, with role and department assignment.

---

### US-6.1: List and Search People
**As a** Jordan Calloway (System Administrator), **I want to** list all people in the system with search and role filtering, **so that** I can quickly find any staff member or reporter record without scrolling through hundreds of entries.

**Acceptance Criteria:**
- [ ] `/admin/people` shows a table of all people: Name, Organization, Department, Role, Username, Email count, Actions (Edit / Delete)
- [ ] A search input (300 ms debounce) filters by name, email, or username
- [ ] A role filter dropdown offers: All, Admin, Staff, Public
- [ ] Table paginates for large people lists
- [ ] Skeleton loader rows show while data is fetching

**Priority:** P1 | **Feature Ref:** F6

---

### US-6.2: Create a New Staff Person Record
**As a** Jordan Calloway (System Administrator), **I want to** create a new person record with name, role, department, and username, **so that** a new staff hire can log in and be assigned tickets on their first day.

**Acceptance Criteria:**
- [ ] A "New Person" button opens a side Sheet (shadcn/ui) with the create form
- [ ] Required: at least one of first name, last name, or organization name
- [ ] Optional fields: middle name, organization, department (dropdown), role (Admin/Staff/Public), username (max 40 chars, must be unique)
- [ ] Sub-panels allow adding email addresses (each with label and `usedForNotifications` flag), phone numbers (with label), and mailing addresses (with label)
- [ ] On save: `POST /api/people` creates the person and all nested contact records
- [ ] Duplicate username returns toast "Username already in use" without closing the form
- [ ] Toast "Person created" and sheet closes on success; list refreshes

**Priority:** P1 | **Feature Ref:** F6

---

### US-6.3: Edit a Person and Manage Their Contact Records
**As a** Jordan Calloway (System Administrator), **I want to** edit an existing person's details and add, edit, or remove their email addresses, **so that** their notification preferences and contact information stay current.

**Acceptance Criteria:**
- [ ] Clicking "Edit" on a person row opens the Sheet pre-filled with all person data
- [ ] Email sub-panel allows adding new email records, editing existing ones (label, notification flag), and removing emails
- [ ] Phone and address sub-panels allow the same add/edit/remove pattern
- [ ] `usedForNotifications = true` emails must be valid email format; invalid format shows inline error
- [ ] On save: `PUT /api/people/{id}` sends the full updated record including nested contact arrays
- [ ] System reconciles contact records: adds new, updates existing, removes deleted ones
- [ ] Toast "Person updated" confirms success; form closes

**Priority:** P1 | **Feature Ref:** F6

---

### US-6.4: Delete a Person with Safety Check
**As a** Jordan Calloway (System Administrator), **I want to** delete a person record with a confirmation dialog and a system safety check, **so that** I can remove departed employees without accidentally corrupting ticket data.

**Acceptance Criteria:**
- [ ] Clicking "Delete" on a person row shows a confirmation dialog: "Are you sure you want to delete {name}?"
- [ ] If the person is referenced as a reporter, assignee, or enteredBy on any ticket, the delete is blocked with: "Cannot delete: this person is associated with {N} tickets."
- [ ] If safe to delete: `DELETE /api/people/{id}` removes the person and cascades related email/phone/address records
- [ ] Toast "Person deleted"; list refreshes
- [ ] Only admin role users can delete person records

**Priority:** P1 | **Feature Ref:** F6

---
