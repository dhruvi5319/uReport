---

## F13: Admin Panels — Substatus, Issue Types, Response Templates, Contact Methods

**Priority:** P1 — High

### Description

A set of lookup-table admin panels manage configurable system values used throughout ticket creation and case management. These are infrequently-changed CRUD panels for: substatuses (refined ticket closure states), issue types (nature classification), response templates (canned action responses), and contact methods (reporter contact channel). All panels follow the same UX pattern: inline editing, toast notifications, and confirmation dialogs before delete.

### Terminology

- **Substatus** — A refined state applied when closing a ticket. System defaults: Resolved, Duplicate, Bogus. Custom substatuses can be created. Has a `status` field (`open` or `closed`) indicating the parent status it applies to.
- **isDefault** — `substatus.isDefault = true`; one substatus per `status` value can be flagged as the default selection in the close dialog.
- **Issue Type** — Classification of the nature of the service request (Comment, Complaint, Question, Report, Request, Violation). Set on a ticket at creation.
- **Response Template** — Pre-written action note text. Stored at the global level in `actions.template`. Category-specific templates are managed via `category_action_responses` (see F8).
- **Contact Method** — How the reporter contacted the city (Email, Phone, Web Form, Other, custom). Selected on a ticket record.

---

### F13.1: Substatus Management (`/admin/substatus`)

**Sub-features:** List, create, edit, delete substatus values; set isDefault flag.

**Process:**
1. List: `GET /api/substatuses` → table with columns: Name, Description, Status (open/closed), Default.
2. Create: "New Substatus" button opens Sheet form.
3. Edit: inline row editing or Sheet.
4. Delete: confirmation dialog. System prevents delete if `tickets.substatus_id` references this substatus (409).
5. isDefault: toggling to `true` on one substatus automatically sets `false` on all others with the same `status` value.

**Inputs:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | [R] | Max 25 chars; unique |
| `description` | string | [R] | Max 128 chars |
| `status` | enum | [R] | `open` or `closed` |
| `isDefault` | boolean | [O] | Default false |

**Validation:**
- Name max 25 chars; unique.
- Only one substatus per `status` value may have `isDefault = true`; saving with `isDefault = true` clears the flag on others.
- Cannot delete system-seeded substatuses (Resolved, Duplicate, Bogus) — these are essential for existing ticket data integrity.
- Delete blocked if tickets reference this substatus.

**Error States:**

| Scenario | HTTP Status | Message |
|---|---|---|
| Duplicate name | 409 | "Substatus name already in use" |
| Delete blocked | 409 | "Cannot delete: substatus is in use by tickets" |
| Delete system substatus | 403 | "System substatuses cannot be deleted" |

---

### F13.2: Issue Type Management (`/admin/issue-types`)

**Sub-features:** List, create, edit, delete issue types.

**Process:**
1. List: `GET /api/issue-types` → table: Name, Actions.
2. Create: "New Issue Type" → Sheet or inline row append.
3. Edit: click name cell → inline edit → save on blur or Enter.
4. Delete: confirmation dialog. Blocked if `tickets.issueType_id` references this record.

**Inputs:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | [R] | Max 128 chars; unique |

**Validation:**
- Name required; max 128 chars; unique.
- System-seeded issue types (Comment, Complaint, Question, Report, Request, Violation) may be edited but not deleted.
- Delete blocked if tickets reference this issue type.

**Error States:**

| Scenario | HTTP Status | Message |
|---|---|---|
| Duplicate name | 409 | "Issue type name already in use" |
| Delete blocked | 409 | "Cannot delete: issue type is in use by tickets" |

---

### F13.3: Response Template Management (`/admin/actions`)

**Description:** The `actions` table stores both system action types and their optional `template` body text. This panel allows admins to view all actions, edit template text for department-type actions, and set a `replyEmail` for responses.

**Note:** Category-specific response templates are managed under category admin (F8 §F8, category_action_responses). This panel manages the global fallback template on the `actions` record itself.

**Sub-features:** List actions, edit template body and replyEmail for department-type actions.

**Process:**
1. List: `GET /api/actions` → table: Name, Type (system/department), Template (truncated preview), Reply Email.
2. Edit: click row → Sheet with template textarea and replyEmail field.
3. System-type actions: template editable, but `name`, `type`, and `description` are read-only.
4. Department-type actions: all fields editable.
5. Create new department action: "New Action" button → Sheet → `POST /api/actions`.
6. Delete: only department-type actions; system actions cannot be deleted.

**Inputs:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | [R for new] | Max 25 chars; unique |
| `description` | string | [R] | Max 128 chars |
| `type` | enum | [R for new] | `department` only (system set by code) |
| `template` | text | [O] | Free text |
| `replyEmail` | string | [O] | Valid email; max 128 chars |

**Validation:**
- System actions cannot be deleted.
- New actions must have `type = 'department'`.
- `replyEmail` must be valid email format.

---

### F13.4: Contact Method Management (`/admin/contact-methods`)

**Sub-features:** List, create, edit, delete contact methods.

**Process:**
1. List: `GET /api/contact-methods` → table: Name, Actions.
2. Create: "New Contact Method" → inline row append or Sheet.
3. Edit: inline row edit.
4. Delete: confirmation dialog. Blocked if `tickets.contactMethod_id` or `clients.contactMethod_id` references this record.

**Inputs:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | [R] | Max 128 chars; unique |

**Validation:**
- Name required; max 128 chars; unique.
- System-seeded contact methods (Email, Phone, Web Form, Other) may be edited but not deleted.
- Delete blocked if any ticket or client references this contact method.

**Error States:**

| Scenario | HTTP Status | Message |
|---|---|---|
| Duplicate name | 409 | "Contact method name already in use" |
| Delete blocked | 409 | "Cannot delete: contact method is in use" |

---

### Shared UX Pattern for All Lookup Admin Panels

- **Loading:** Skeleton table rows shown during data fetch.
- **Save feedback:** Toast notification "Saved" or "Deleted" on success.
- **Error feedback:** Toast notification with error message on failure.
- **Confirmation dialog:** shadcn/ui `AlertDialog` with destructive button styling for all delete operations.
- **Inline editing:** Optional row-level inline editing for simple single-field records (issue types, contact methods). Sheet drawer used for multi-field records (substatus, actions).

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/substatuses` | List substatuses |
| POST | `/api/substatuses` | Create substatus |
| PUT | `/api/substatuses/{id}` | Update substatus |
| DELETE | `/api/substatuses/{id}` | Delete substatus |
| GET | `/api/issue-types` | List issue types |
| POST | `/api/issue-types` | Create issue type |
| PUT | `/api/issue-types/{id}` | Update issue type |
| DELETE | `/api/issue-types/{id}` | Delete issue type |
| GET | `/api/actions` | List action types |
| POST | `/api/actions` | Create department action |
| PUT | `/api/actions/{id}` | Update action (template, replyEmail) |
| DELETE | `/api/actions/{id}` | Delete department action |
| GET | `/api/contact-methods` | List contact methods |
| POST | `/api/contact-methods` | Create contact method |
| PUT | `/api/contact-methods/{id}` | Update contact method |
| DELETE | `/api/contact-methods/{id}` | Delete contact method |

### Schema Surface

- `substatus` — substatus lookup
- `issueTypes` — issue type lookup
- `actions` — action type lookup with template
- `contactMethods` — contact method lookup
