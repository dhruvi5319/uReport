---

## F01: Ticket History and Action Log

**Description:** Every change to a ticket is recorded as an immutable `ticketHistory` entry linked to an action type. Action description templates use `{variable}` placeholder substitution so descriptions are rendered dynamically at read time rather than stored as static strings. Each history entry also records which email notifications were dispatched, supporting the digest notification system (F16).

---

### Terminology

- **History Entry:** A single record in `ticketHistory` representing one event on a ticket.
- **Action:** A named event type from the `actions` table (see F09). System actions are fixed; departments may define custom actions.
- **Template Variable:** A `{placeholder}` token in an action's `description` or `template` field resolved at render time (e.g., `{actionPerson}`, `{original:category_id}`).
- **enteredByPerson:** The person who performed the action (e.g., the staff member who closed the ticket).
- **actionPerson:** The person the action was performed *on* (e.g., the newly assigned staff member).
- **sentNotifications:** Serialized list of email addresses that received notifications for this history entry.
- **data (JSON):** Structured field-level change data stored per history entry (e.g., `{"original": {"category_id": 5}, "updated": {"category_id": 12}}`).
- **notes:** Free-text annotation attached to a history entry (e.g., staff comment text).

---

### Sub-features

- Append history entry for any ticket lifecycle event
- Store action performer, action subject, timestamps
- Store free-text notes and structured JSON data per entry
- Store sent notification recipients per entry
- Render action description by interpolating template variables at read time
- Display full history log on ticket detail view
- Support all system action types
- Support department-defined custom action types

---

### System Action Types (seed data)

| Action Name | Type | Template (example) |
|-------------|------|--------------------|
| open | system | "Ticket opened by {enteredByPerson}" |
| assignment | system | "Assigned to {actionPerson} by {enteredByPerson}" |
| closed | system | "Closed by {enteredByPerson}" |
| changeCategory | system | "Category changed from {original:category_id} to {updated:category_id} by {enteredByPerson}" |
| changeLocation | system | "Location changed from {original:location} to {updated:location} by {enteredByPerson}" |
| response | system | "Response recorded by {enteredByPerson}" |
| duplicate | system | "Marked as duplicate of #{duplicate:ticket_id} by {enteredByPerson}" |
| update | system | "Updated by {enteredByPerson}" |
| comment | system | "Comment added by {enteredByPerson}" |
| upload_media | system | "Media uploaded by {enteredByPerson}" |

---

### Process

#### Appending a History Entry
1. A ticket lifecycle action occurs (create, assign, close, update, comment, upload, etc.).
2. The service layer calls `TicketHistoryService.append(ticketId, actionId, enteredByPersonId, actionPersonId, notes, data)`.
3. System resolves `enteredDate = NOW()` and `actionDate = NOW()` (may differ if backfilling; default both to NOW).
4. System inserts a row into `ticketHistory`.
5. System queues any pending notifications (see F16) using the action's template and the category's `notificationReplyEmail`.
6. After notifications sent, system updates `ticketHistory.sentNotifications` with the list of email addresses notified.

#### Rendering History Descriptions
1. Client requests GET `/api/v1/tickets/{id}/history` or ticket detail view.
2. System fetches all `ticketHistory` rows for the ticket, joined with `actions`.
3. For each entry, system interpolates template variables:
   - `{enteredByPerson}` → full name from `people` lookup by `enteredByPerson_id`.
   - `{actionPerson}` → full name from `people` lookup by `actionPerson_id`.
   - `{reportedByPerson_id}` → full name from `people` lookup on ticket.
   - `{original:field}` → value from `data.original.field`.
   - `{updated:field}` → value from `data.updated.field`.
   - `{duplicate:ticket_id}` → ticket ID from `data.duplicate`.
   - Unknown variable tokens are left as-is (no exception thrown).
4. System returns rendered history list to client.

#### Displaying History
- History entries are ordered by `enteredDate ASC` (oldest first) on ticket detail.
- Staff see full history including internal notes.
- Public/anonymous users see only history entries associated with public-facing action types.

---

### Inputs

- `ticket_id` (BIGINT, required): The ticket this history entry belongs to.
- `action_id` (INTEGER, required): FK to `actions.id`.
- `enteredByPerson_id` (INTEGER, optional): FK to `people.id`; null for system-generated entries.
- `actionPerson_id` (INTEGER, optional): FK to `people.id`; the person acted upon.
- `enteredDate` (TIMESTAMPTZ, optional): Defaults to NOW().
- `actionDate` (TIMESTAMPTZ, optional): Defaults to NOW().
- `notes` (TEXT, optional): Free-text annotation.
- `data` (JSONB, optional): Structured change data with `original` and `updated` keys.
- `sentNotifications` (TEXT, optional): Serialized email list (comma-separated or JSON array).

---

### Outputs

- **History entry object:** id, ticket_id, action_id, action (name, type, template), enteredByPerson_id, enteredByPerson (name), actionPerson_id, actionPerson (name), enteredDate, actionDate, notes, data, sentNotifications, renderedDescription.
- **History list:** Array of history entry objects, ordered by `enteredDate ASC`.

---

### Validation Rules

- `ticket_id` must reference an existing ticket.
- `action_id` must reference an existing action.
- `enteredByPerson_id` must reference an existing person if provided.
- `actionPerson_id` must reference an existing person if provided.
- History entries are **immutable** after insert — no UPDATE or DELETE is permitted by the application layer.
- `data` must be valid JSON (JSONB constraint enforced by PostgreSQL).
- System action templates must not be modified by the application (read-only in the system).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Ticket not found | 404 | TICKET_NOT_FOUND | "Ticket not found" |
| Action not found | 422 | ACTION_NOT_FOUND | "Action type not found" |
| enteredByPerson not found | 422 | PERSON_NOT_FOUND | "Entered-by person not found" |
| actionPerson not found | 422 | PERSON_NOT_FOUND | "Action person not found" |
| Attempt to modify history entry | 405 | METHOD_NOT_ALLOWED | "Ticket history entries are immutable" |

---

### API Surface (this feature)

See full request/response schemas in `Y1b-api-tickets.md`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/tickets/{id}/history` | staff | Get full history for a ticket |
| GET | `/api/v1/tickets/{id}/history/{historyId}` | staff | Get single history entry |

*(History entries are written internally by the service layer, not directly via API.)*

---

### Schema Surface (this feature)

Primary table: `ticketHistory`. See full DDL in `Y0a-schema-core.md §ticketHistory`.

Key columns: id (BIGSERIAL PK), ticket_id (FK tickets), enteredByPerson_id (FK people), actionPerson_id (FK people), action_id (FK actions), enteredDate (TIMESTAMPTZ), actionDate (TIMESTAMPTZ), notes (TEXT), data (JSONB), sentNotifications (TEXT).
