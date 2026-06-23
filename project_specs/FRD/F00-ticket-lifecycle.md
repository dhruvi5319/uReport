---

## F00: Ticket Lifecycle Management

**Description:** The core operational capability of uReport. Staff and (where category permissions allow) citizens create service request tickets, which flow through a defined lifecycle: open → assigned → closed, with optional reopen, merge, and deletion paths. Every state transition is recorded in the immutable audit trail (see F06). All other features orbit the ticket entity.

**Terminology:**
- **Primary Status:** The ticket's top-level state: `open` or `closed`.
- **Substatus:** A finer-grained label applied within the primary status (see F17).
- **Reporter:** The person (citizen or staff) who submitted the ticket. References `people.id`.
- **Assignee:** The staff member responsible for resolving the ticket. References `people.id`.
- **Resolution Response:** The final staff message sent to the reporter when closing a ticket.
- **Reopen Reason:** A required text field explaining why a closed ticket is being reopened.

**Sub-features:**
- Create ticket (staff or public, depending on category permissions)
- View ticket detail (full fields, history, attachments)
- Edit ticket fields (category, description, location, custom fields)
- Assign ticket to department and/or staff member
- Change ticket status (open ↔ closed)
- Apply/change substatus
- Post response (external — sent to reporter via email)
- Post comment (internal — not sent externally)
- Close ticket with resolution response
- Reopen closed ticket with reason
- Delete ticket (staff with `admin` or `staff` role, subject to permissions)
- Merge duplicate tickets (see F18)

---

### F00 Process: Create Ticket

1. Caller (staff, public user, or anonymous via API) submits ticket payload.
2. System validates all required fields and category posting permissions (see F10).
3. System resolves category → department mapping; sets `tickets.departmentId`.
4. System sets `tickets.status = 'open'`, `tickets.datetimeOpened = NOW()`.
5. System applies the default substatus for `open` state if one is configured (see F17).
6. System geocodes or stores the provided lat/long (see F05).
7. System creates an `actions` entry with `type = 'open'`, actor = caller.
8. System indexes the ticket in Solr.
9. System sends confirmation email to reporter (see F08).
10. System returns the created ticket object with HTTP 201.

### F00 Process: Assign Ticket

1. Staff submits assignment request with `assigneeId` and/or `departmentId`.
2. System validates the assignee is an active staff member.
3. System updates `tickets.personId` (assignee) and/or `tickets.departmentId`.
4. System creates an `actions` entry with `type = 'assignment'`.
5. System sends email notification to the new assignee (see F08).
6. System returns updated ticket with HTTP 200.

### F00 Process: Close Ticket

1. Staff submits close request with optional `response` text.
2. System validates caller has `staff` or `admin` role.
3. System sets `tickets.status = 'closed'`, `tickets.datetimeClosed = NOW()`.
4. System applies default closed substatus if configured.
5. System creates an `actions` entry with `type = 'closed'`; if response text provided, also creates `type = 'response'` action.
6. System sends email to reporter with response text (see F08).
7. System updates Solr index.
8. System returns updated ticket with HTTP 200.

### F00 Process: Reopen Ticket

1. Staff submits reopen request with required `reason` text.
2. System validates `tickets.status = 'closed'`.
3. System sets `tickets.status = 'open'`, clears `tickets.datetimeClosed`.
4. System applies default open substatus if configured.
5. System creates an `actions` entry with `type = 'open'`, payload includes `reason`.
6. System updates Solr index.
7. System returns updated ticket with HTTP 200.

### F00 Process: Delete Ticket

1. Staff with `admin` role submits delete request.
2. System soft-deletes by setting `tickets.deletedAt = NOW()` (or hard-deletes per config).
3. System creates `actions` entry with `type = 'deleted'`.
4. System removes ticket from Solr index.
5. System returns HTTP 204.

---

### F00 Inputs

**Create Ticket:**
- `title` (string, required, max 255): Short description of the issue
- `description` (string, optional, max 5000): Detailed description
- `categoryId` (integer, required): Must reference an active category
- `lat` (decimal, optional): Latitude — required if no `address` provided
- `lng` (decimal, optional): Longitude — required if no `address` provided
- `address` (string, optional, max 500): Human-readable address string
- `reporterName` (string, optional, max 255): Reporter's name (anonymous allowed per category)
- `reporterEmail` (string, optional, max 255): Reporter's email for notifications
- `reporterPhone` (string, optional, max 50): Reporter's phone
- `customFields` (object, optional): Key-value map of category-specific custom field values
- `mediaUrls` (array of strings, optional): URLs of pre-uploaded media (Open311 `media_url`)

**Assign Ticket:**
- `assigneeId` (integer, optional): Person ID of staff assignee (null to unassign)
- `departmentId` (integer, optional): Department ID override

**Close Ticket:**
- `response` (string, optional, max 5000): Resolution message sent to reporter

**Reopen Ticket:**
- `reason` (string, required, max 1000): Explanation for reopening

**Update Ticket Fields:**
- `title` (string, optional)
- `description` (string, optional)
- `categoryId` (integer, optional)
- `address` (string, optional)
- `lat` (decimal, optional)
- `lng` (decimal, optional)
- `customFields` (object, optional)

---

### F00 Outputs

- **Ticket object** (on create, read, update): Full ticket record including resolved department, category, assignee, substatus, and SLA data
- **HTTP 201** on successful create
- **HTTP 200** on successful update/assign/close/reopen
- **HTTP 204** on successful delete
- **Action log entry** created for every mutation (see F06)
- **Solr index** updated on every mutation

---

### F00 Validation

- `categoryId` must reference an existing, active category
- Category posting permissions must allow the caller's role (see F10)
- Either `lat`/`lng` pair OR `address` must be provided (both recommended)
- `lat` must be in range −90 to +90; `lng` in range −180 to +180
- `reporterEmail` must be valid RFC 5322 email format if provided
- `assigneeId` must reference an active person with role `staff` or `admin`
- `departmentId` must reference an active department
- `reason` (reopen) must be non-empty string, max 1000 chars
- Callers with role `anonymous` may only create; they may not edit, assign, close, delete, or reopen
- Delete requires `admin` role; soft-delete is the default behavior

---

### F00 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Invalid `categoryId` | 422 | INVALID_CATEGORY | "Category not found or inactive" |
| Category does not permit caller's role | 403 | POSTING_FORBIDDEN | "This category does not allow posting by your role" |
| Location missing (no lat/lng and no address) | 422 | LOCATION_REQUIRED | "Either coordinates or an address must be provided" |
| Invalid lat/lng range | 422 | INVALID_COORDINATES | "Latitude must be −90 to +90; longitude −180 to +180" |
| Assignee not found or inactive | 422 | INVALID_ASSIGNEE | "Assignee not found or not an active staff member" |
| Reopen with missing reason | 422 | REASON_REQUIRED | "A reason is required to reopen a ticket" |
| Delete without admin role | 403 | FORBIDDEN | "Ticket deletion requires admin role" |
| Ticket not found | 404 | NOT_FOUND | "Ticket not found" |
| Close already-closed ticket | 409 | ALREADY_CLOSED | "Ticket is already closed" |
| Reopen already-open ticket | 409 | ALREADY_OPEN | "Ticket is already open" |

---

### F00 API Surface (this feature)

Full request/response schemas: see `Y1a-api-tickets.md` §Tickets.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/tickets` | Any (role-checked) | Create ticket |
| GET | `/api/tickets/{id}` | Any (visibility-checked) | Get ticket detail |
| PUT | `/api/tickets/{id}` | staff/admin | Update ticket fields |
| POST | `/api/tickets/{id}/assign` | staff/admin | Assign ticket |
| POST | `/api/tickets/{id}/close` | staff/admin | Close ticket |
| POST | `/api/tickets/{id}/reopen` | staff/admin | Reopen ticket |
| DELETE | `/api/tickets/{id}` | admin | Delete ticket |
| POST | `/api/tickets/{id}/responses` | staff/admin | Post response (external) |
| POST | `/api/tickets/{id}/comments` | staff/admin | Post comment (internal) |

---

### F00 Schema Surface (this feature)

Primary table: `tickets`. Also writes to `actions`, `ticket_geodata`. See `Y0a-schema-core.md` §tickets and §actions.

Key columns on `tickets`:
- `id`, `title`, `description`, `status` (enum open/closed), `datetimeOpened`, `datetimeClosed`
- `categoryId` (FK → categories), `departmentId` (FK → departments)
- `personId` (FK → people, assignee), `reporterPersonId` (FK → people, reporter)
- `substatusId` (FK → substatus), `deletedAt`
- `address`, `lat`, `lng`
