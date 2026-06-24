---

## F00: Ticket / Case Lifecycle Management

**Description:** The ticket (case) is the core entity of uReport. Staff and public users create tickets for constituent issues, and staff manage them through their full lifecycle from opening through assignment, updates, closure, reopening, and duplicate detection. Every state change is recorded in an immutable history log (`ticketHistory`). Tickets are the primary unit tracked by the Open311 API and the metrics system.

---

### Terminology

- **Open status:** A ticket that has not yet been resolved; `status = 'open'`.
- **Closed status:** A ticket that has been resolved, marked duplicate, or otherwise finalized; `status = 'closed'`.
- **Assigned status:** A ticket with a non-null `assignedPerson_id`; it remains `open`.
- **Substatus:** Fine-grained state within open or closed (see F08).
- **Parent ticket:** A ticket that another ticket (`child`) has been marked a duplicate of; referenced via `parent_id`.
- **Issue Type:** Secondary classification (Comment, Complaint, Question, Report, Request, Violation); see F19.
- **Custom Fields:** Per-category JSON schema values attached to a ticket; stored as JSON in `tickets.customFields`.
- **additionalFields:** Supplementary location/address data from the AddressService, stored as JSON in `tickets.additionalFields`.
- **enteredByPerson:** The staff user who created the ticket record in the system.
- **reportedByPerson:** The constituent who originally reported the issue.
- **assignedPerson:** The staff member currently responsible for resolving the ticket.

---

### Sub-features

- Create ticket (staff or public/anonymous per category permission)
- Assign ticket to a staff person
- Update ticket fields (category, location, description, custom fields, assigned person)
- Close ticket with substatus
- Mark ticket as duplicate of parent ticket
- Reopen closed ticket
- Change ticket category (with history)
- Change ticket location (with history)
- Record free-text comment on ticket
- Filter and search tickets (see F11)
- Export ticket list in CSV, print HTML formats (staff only)
- Display ticket list in list or map view

---

### Process

#### Create Ticket
1. Client submits POST `/api/v1/tickets` with required fields (category_id, description, location fields, reportedByPerson_id or reporter contact info).
2. System validates category is active and caller has posting permission (see F03).
3. System creates `people` record for reporter if not found (by email/name lookup).
4. System creates `tickets` row with `status = 'open'`, `enteredDate = NOW()`, `lastModified = NOW()`.
5. System looks up default substatus for `open` and assigns it.
6. System assigns `assignedPerson_id` to category's `defaultPerson_id` if set.
7. System writes a `ticketHistory` entry with `action_id` = (id of system action "open").
8. System returns created ticket with 201 Created.

#### Assign Ticket
1. Staff submits PATCH `/api/v1/tickets/{id}/assign` with `assignedPerson_id`.
2. System validates ticket is open and target person exists.
3. System updates `tickets.assignedPerson_id` and `lastModified`.
4. System appends `ticketHistory` entry with action "assignment".
5. Digest notification scheduled (see F16).

#### Update Ticket
1. Staff submits PATCH `/api/v1/tickets/{id}` with changed fields.
2. System validates role is `staff`.
3. For category change: records old and new `category_id` in history `data` JSON; appends "changeCategory" history entry.
4. For location change: records old and new address in history `data` JSON; appends "changeLocation" history entry.
5. System updates `tickets` row and `lastModified`.
6. System appends "update" history entry with changed fields in `data`.

#### Close Ticket
1. Staff submits PATCH `/api/v1/tickets/{id}/close` with `substatus_id` (must map to `status = 'closed'`).
2. System validates substatus exists and is `closed`-type.
3. System updates `tickets.status = 'closed'`, `closedDate = NOW()`, `substatus_id`.
4. System appends "closed" history entry.
5. Digest notification scheduled (see F16).

#### Mark Duplicate
1. Staff submits PATCH `/api/v1/tickets/{id}/duplicate` with `parent_id`.
2. System validates parent ticket exists and is not itself a child.
3. System sets `tickets.parent_id = parent_id`, `status = 'closed'`, closes with Duplicate substatus.
4. System appends "duplicate" history entry with `data = { "duplicate": parent_id }`.

#### Reopen Ticket
1. Staff submits PATCH `/api/v1/tickets/{id}/reopen`.
2. System validates ticket is closed.
3. System updates `status = 'open'`, clears `closedDate`, assigns default open substatus.
4. System appends "update" history entry with `notes = 'Reopened'`.

#### Record Comment
1. Staff or permitted user submits POST `/api/v1/tickets/{id}/comments` with `notes`.
2. System appends "comment" history entry with `notes` text.

---

### Inputs

- `category_id` (integer, required): Category this ticket belongs to.
- `description` (text, required): Free-text description of the issue.
- `location` (string, optional): Human-readable address string.
- `city` (string, optional): City of the reported location.
- `state` (string, optional): State abbreviation (2 chars).
- `zip` (string, optional): ZIP code.
- `latitude` (decimal, optional): Latitude coordinate.
- `longitude` (decimal, optional): Longitude coordinate.
- `reportedByPerson_id` (integer, optional): FK to `people.id`; if absent, reporter info fields used.
- `reporterFirstname` (string, optional): Used if no existing person found.
- `reporterLastname` (string, optional): Used if no existing person found.
- `reporterEmail` (string, optional): Used if no existing person found; creates `peopleEmails` record.
- `assignedPerson_id` (integer, optional): Staff person to assign ticket to.
- `issueType_id` (integer, optional): FK to `issueTypes.id`.
- `contactMethod_id` (integer, optional): FK to `contactMethods.id`.
- `responseMethod_id` (integer, optional): FK to `contactMethods.id` (preferred response channel).
- `substatus_id` (integer, optional): FK to `substatus.id`; applied on close.
- `parent_id` (integer, optional): FK to `tickets.id`; set when marking duplicate.
- `customFields` (JSON, optional): Values matching category's `customFields` schema.
- `additionalFields` (JSON, optional): Supplementary address fields from AddressService.
- `client_id` (integer, optional): FK to `clients.id`; set when ticket arrives via API client.

---

### Outputs

- **201 Created:** Full ticket object (see API spec `Y1b-api-tickets.md §POST /api/v1/tickets`).
- **200 OK:** Updated/closed ticket object.
- **Ticket object fields:** id, parent_id, category_id, category (name), issueType_id, client_id, enteredByPerson_id, reportedByPerson_id, assignedPerson_id, contactMethod_id, responseMethod_id, enteredDate (ISO 8601), lastModified (ISO 8601), addressId, latitude, longitude, location, city, state, zip, status, closedDate, substatus_id, substatus (name), additionalFields, customFields, description, historyCount, mediaCount.

---

### Validation Rules

- `category_id` must reference an active category (`categories.active = true`).
- Caller's role must satisfy category's `postingPermissionLevel` (anonymous ≤ public ≤ staff).
- `description` must be non-empty; max 65,535 characters.
- `status` transitions: open → open (update/assign), open → closed (close/duplicate), closed → open (reopen).
- Closing requires a `substatus_id` whose `status = 'closed'`.
- `substatus_id` used on reopen must reference a substatus with `status = 'open'`.
- `assignedPerson_id` must reference a person with `role = 'staff'`.
- `parent_id` must reference an existing ticket; circular parentage is forbidden.
- `latitude` must be in range [-90, 90]; `longitude` in range [-180, 180].
- `customFields` JSON must conform to the schema defined in `categories.customFields` for the ticket's category.
- `issueType_id` must reference a valid `issueTypes.id` if provided.
- `contactMethod_id` must reference a valid `contactMethods.id` if provided.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Category not found or inactive | 404 | CATEGORY_NOT_FOUND | "Category not found or inactive" |
| Insufficient posting permission | 403 | PERMISSION_DENIED | "Insufficient permission to post to this category" |
| Ticket not found | 404 | TICKET_NOT_FOUND | "Ticket not found" |
| Invalid substatus for close (wrong type) | 422 | INVALID_SUBSTATUS | "Substatus must be a closed-type substatus" |
| Invalid status transition (e.g., close already-closed) | 422 | INVALID_TRANSITION | "Invalid status transition" |
| Circular duplicate parentage | 422 | CIRCULAR_DUPLICATE | "Ticket cannot be its own ancestor" |
| assignedPerson not staff | 422 | INVALID_ASSIGNEE | "Assigned person must have staff role" |
| Invalid lat/long range | 422 | INVALID_COORDINATES | "Latitude/longitude out of valid range" |
| description empty | 422 | DESCRIPTION_REQUIRED | "Description is required" |

---

### API Surface (this feature)

See full request/response schemas in `Y1b-api-tickets.md`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/tickets` | staff/public/anonymous (per category) | Create ticket |
| GET | `/api/v1/tickets/{id}` | staff/public (per display permission) | Get ticket detail |
| PATCH | `/api/v1/tickets/{id}` | staff | Update ticket fields |
| PATCH | `/api/v1/tickets/{id}/assign` | staff | Assign ticket |
| PATCH | `/api/v1/tickets/{id}/close` | staff | Close ticket |
| PATCH | `/api/v1/tickets/{id}/reopen` | staff | Reopen ticket |
| PATCH | `/api/v1/tickets/{id}/duplicate` | staff | Mark as duplicate |
| POST | `/api/v1/tickets/{id}/comments` | staff | Add comment |
| DELETE | `/api/v1/tickets/{id}` | staff | Delete ticket (admin only) |

---

### Schema Surface (this feature)

Primary table: `tickets`. See full DDL in `Y0a-schema-core.md §tickets`.

Key columns: id (BIGSERIAL PK), parent_id (FK tickets), category_id (FK categories), issueType_id (FK issueTypes), client_id (FK clients), enteredByPerson_id (FK people), reportedByPerson_id (FK people), assignedPerson_id (FK people), contactMethod_id (FK contactMethods), responseMethod_id (FK contactMethods), enteredDate (TIMESTAMPTZ), lastModified (TIMESTAMPTZ), addressId (FK locations), latitude (NUMERIC 9,6), longitude (NUMERIC 9,6), location (TEXT), city (VARCHAR 100), state (VARCHAR 2), zip (VARCHAR 10), status (VARCHAR 20 CHECK IN ('open','closed')), closedDate (TIMESTAMPTZ), substatus_id (FK substatus), additionalFields (JSONB), customFields (JSONB), description (TEXT).
