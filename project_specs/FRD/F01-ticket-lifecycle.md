---

## F1: Ticket / Case Lifecycle Management

**Priority:** P0 — Critical

### Description

The ticket (civic 311 service request) is the core domain entity. Staff create tickets via the internal CRM UI, manage assignments, update fields, log responses, and transition the ticket through its lifecycle. Every state transition is recorded as an immutable history entry in `ticket_history`. The lifecycle is: `open` → (assigned) → (in-progress) → `closed`, with substatus applied at close. Tickets can be reopened from `closed` → `open`.

### Terminology

- **Status** — Binary field: `open` or `closed`. Stored in `tickets.status`.
- **Substatus** — Refinement applied when closing a ticket (Resolved, Duplicate, Bogus, or custom). Stored in `tickets.substatus_id`.
- **Assignee** — The staff person responsible for resolving the ticket (`tickets.assignedPerson_id`).
- **Reporter** — The constituent who submitted the ticket (`tickets.reportedByPerson_id`).
- **EnteredBy** — The staff person who created the ticket in the CRM (`tickets.enteredByPerson_id`).
- **Parent ticket** — A ticket may be marked as a duplicate of another via `tickets.parent_id`.
- **SLA** — `categories.slaDays` defines the expected resolution window; `expected_datetime` is `enteredDate + slaDays days`.
- **Overdue** — A ticket is overdue when `NOW() > enteredDate + slaDays` and the ticket is still open.

### Sub-features

- Create ticket (manual staff entry)
- View ticket detail
- Assign ticket to person and/or department
- Update ticket fields (category, location, description, substatus, issueType, contactMethod)
- Transition: open → closed (with substatus)
- Transition: closed → open (reopen)
- Mark as duplicate (set parent_id + substatus = Duplicate)
- Log actions and responses (see F9)
- Attach media (see F10)
- Bulk operations: assign, close, change status on multiple selected tickets
- SLA tracking: expose overdue flag on ticket

### Process — Create Ticket (Staff)

1. Staff navigates to New Case form (route: `/cases/new`).
2. Staff fills required fields: category, location (address or lat/lon), description.
3. Staff optionally fills: reporter person (search/select or create inline), assignee person, issue type, contact method, custom fields.
4. System validates all required fields and field formats.
5. On submit, system creates `tickets` record with `status = 'open'`, `enteredDate = NOW()`, `enteredByPerson_id = current user`.
6. System creates `ticket_history` entry with `action_id` = "open" action, `enteredByPerson_id = current user`, `actionDate = NOW()`.
7. If `assignedPerson_id` is set, system creates a second `ticket_history` entry with `action_id` = "assignment" action.
8. System triggers email notification to assignee (if notification is configured).
9. System redirects to Case Detail screen for the new ticket (route: `/cases/{id}`).

### Process — Status Transition: Open → Closed

1. Staff clicks "Close" button on Case Detail screen.
2. System shows confirmation dialog with substatus selector (required).
3. Staff selects substatus (Resolved, Duplicate, Bogus, or other configured substatus).
4. If substatus = Duplicate, staff must provide parent ticket ID.
5. Staff optionally adds closing notes.
6. On confirm: system sets `tickets.status = 'closed'`, `tickets.closedDate = NOW()`, `tickets.substatus_id = selected`.
7. If Duplicate: system sets `tickets.parent_id = specified parent ticket ID`.
8. System creates `ticket_history` entry with `action_id` = "closed" action, notes = closing notes.
9. System sends email notification to reporter (if notification toggle enabled).

### Process — Status Transition: Closed → Open (Reopen)

1. Staff clicks "Reopen" button on Case Detail screen of a closed ticket.
2. System shows confirmation dialog with optional notes field.
3. On confirm: system sets `tickets.status = 'open'`, `tickets.closedDate = NULL`, `tickets.substatus_id = NULL`.
4. System creates `ticket_history` entry with `action_id` = "open" (reopen).
5. System notifies assignee (if configured).

### Process — Assign Ticket

1. Staff opens ticket assignment control (inline on Case Detail or from case list bulk assign).
2. Staff selects an assignee from the people list (filtered to staff roles).
3. On save: system updates `tickets.assignedPerson_id`.
4. System creates `ticket_history` entry with `action_id` = "assignment", `actionPerson_id` = new assignee.
5. System sends email to new assignee (if notification configured).

### Process — Bulk Operations

1. Staff selects multiple tickets via checkbox column in case list.
2. Staff clicks bulk action button (Assign, Close, or Change Status) in the action bar.
3. System displays a bulk action dialog with appropriate fields (assignee selector for assign; substatus selector for close).
4. On confirm: system applies the action to each selected ticket sequentially.
5. Each ticket gets an individual `ticket_history` record for the action.
6. System shows a toast notification with success count and any failure count.

### Inputs — Create Ticket

| Field | Type | Required | Validation |
|---|---|---|---|
| `category_id` | integer | [R] | Must reference active category |
| `description` | text | [R] | Min 1 character |
| `location` | string | [R*] | Required if lat/lon not provided |
| `latitude` | float | [O] | -90.0 to 90.0 |
| `longitude` | float | [O] | -180.0 to 180.0 |
| `reportedByPerson_id` | integer | [O] | Must reference existing person |
| `assignedPerson_id` | integer | [O] | Must reference staff person |
| `issueType_id` | integer | [O] | Must reference existing issue type |
| `contactMethod_id` | integer | [O] | Must reference existing contact method |
| `enteredByPerson_id` | integer | [R] | Auto-set to current authenticated user |

*[R*] = At least location string OR lat+lon required.

### Outputs

- Created ticket record with auto-generated `id`
- `ticket_history` record(s) for open and optional assignment actions
- Redirect to `/cases/{id}`
- Toast notification: "Case #{id} created successfully"
- Email notification to assignee (if assigned and notification configured)

### Validation Rules

- `category_id` must reference an active category (`categories.active = true`).
- `latitude` must be in range [-90, 90]; `longitude` must be in range [-180, 180].
- At least one location signal (address string or lat/lon coordinates) is recommended; system warns but does not block if no location provided.
- `status` field is not user-editable on create; always initialized to `'open'`.
- `substatus_id` is only settable when status is `'closed'`.
- `parent_id` is only settable when substatus = Duplicate.
- Bulk close requires substatus selection for all tickets being closed.
- Staff role check: only users with role `admin` or `staff` may create, update, or close tickets.

### Error States

| Scenario | HTTP Status | Error Code | User Message |
|---|---|---|---|
| Unknown category_id | 400 | `INVALID_CATEGORY` | "Invalid category selected" |
| Invalid lat/lon range | 400 | `INVALID_COORDINATES` | "Coordinates out of valid range" |
| Missing description | 400 | `MISSING_REQUIRED` | "Description is required" |
| Unauthorized (not logged in) | 401 | `UNAUTHORIZED` | Redirect to login |
| Forbidden (wrong role) | 403 | `FORBIDDEN` | "Insufficient permissions" |
| Ticket not found | 404 | `NOT_FOUND` | "Case not found" |
| Close without substatus | 400 | `MISSING_SUBSTATUS` | "Substatus required to close a case" |

### API Surface

See `Y1-api.md` §Tickets. Key endpoints:

| Method | Path | Description |
|---|---|---|
| POST | `/api/tickets` | Create ticket |
| GET | `/api/tickets/{id}` | Get ticket detail |
| PATCH | `/api/tickets/{id}` | Update ticket fields |
| POST | `/api/tickets/{id}/close` | Close ticket with substatus |
| POST | `/api/tickets/{id}/reopen` | Reopen ticket |
| POST | `/api/tickets/{id}/assign` | Assign ticket |
| POST | `/api/tickets/bulk` | Bulk operations |

### Schema Surface

- `tickets` — core entity
- `ticket_history` — immutable audit trail
- `substatus` — substatus lookup
- `actions` — action type lookup

See `Y0-schema.md` §Tickets for full DDL.
