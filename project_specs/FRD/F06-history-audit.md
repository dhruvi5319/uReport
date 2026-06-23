---

## F06: Ticket History & Audit Trail

**Description:** Every mutation to a ticket is recorded as an immutable action entry in the `actions` table. The history gives staff, supervisors, and auditors a complete chronological record of what happened to a ticket, who did it, and when. Action types are enumerated and structured. History is displayed in the ticket detail view and is accessible via API.

**Terminology:**
- **Action:** An immutable event record for a ticket mutation. Maps to `actions` table.
- **Action Type:** An enumerated string identifying the kind of mutation: `open`, `assignment`, `closed`, `reopen`, `response`, `comment`, `upload`, `deleted`, `merged`, `substatus`.
- **Actor:** The person or API client who caused the action.
- **Payload:** A JSON blob containing action-specific data (e.g., previous/new assignee, response text, media ID).
- **Visibility:** Whether the action is visible to the ticket reporter (`external`) or only to staff (`internal`).

**Sub-features:**
- Record action on every ticket mutation
- Action types: open, assignment, closed, reopen, response, comment, upload, deleted, merged, substatus
- Capture actor, timestamp, and payload per action
- Display chronological history in ticket detail view
- Expose history via API endpoint
- Filter history by action type in API

---

### F06 Process: Record Action

1. Triggered internally by ticket lifecycle operations (F00, F17, F18).
2. System constructs the action record: `ticketId`, `type`, `actorPersonId` (or `actorClientId` for API clients), `datetimeCreated = NOW()`, `payload` (JSON), `visibility` (internal/external).
3. System inserts into `actions` — no update or delete ever; records are append-only.
4. For `response` type: `payload.body` = response text; `visibility = 'external'`.
5. For `comment` type: `payload.body` = comment text; `visibility = 'internal'`.
6. For `assignment` type: `payload.previousAssigneeId`, `payload.newAssigneeId`.
7. For `substatus` type: `payload.previousSubstatusId`, `payload.newSubstatusId`.
8. For `upload` type: `payload.mediaId` array referencing `media` records.
9. For `merged` type: `payload.mergedFromTicketId` or `payload.mergedIntoTicketId`.

### F06 Process: Retrieve History

1. Client requests `GET /api/tickets/{id}/history`.
2. System fetches all `actions` for the ticket, ordered by `datetimeCreated ASC`.
3. System filters: if caller is not staff/admin, `internal` visibility actions are excluded.
4. System resolves actor names from `people` (for `actorPersonId`) or `clients` (for `actorClientId`).
5. System returns paginated action list.

---

### F06 Inputs

**History list query parameters:**
- `type` (enum, optional): Filter by action type
- `visibility` (enum, optional): `external` | `internal` (staff/admin only)
- `page` (integer, optional, default 1)
- `perPage` (integer, optional, default 50, max 200)

---

### F06 Outputs

**Action object:**
```json
{
  "id": 4521,
  "ticketId": 101,
  "type": "response",
  "visibility": "external",
  "actor": { "id": 5, "name": "Jane Smith", "type": "person" },
  "datetimeCreated": "2026-06-23T14:32:00Z",
  "payload": {
    "body": "We have scheduled a repair crew for Wednesday."
  }
}
```

**Assignment action payload:**
```json
{
  "previousAssigneeId": null,
  "newAssigneeId": 5,
  "previousDepartmentId": 2,
  "newDepartmentId": 2
}
```

---

### F06 Validation

- Action records are **append-only** — no PUT or DELETE on `actions` is permitted
- `type` must be one of the enumerated action types
- `actorPersonId` or `actorClientId` must be non-null (system cannot record anonymous actor; use a system account for automated actions)
- `payload` must be valid JSON; schema depends on `type`
- `visibility` defaults to `internal` for `comment` type; `external` for `response` and `open` types; `internal` for all others

---

### F06 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Ticket not found | 404 | NOT_FOUND | "Ticket not found" |
| Attempt to modify action record | 405 | METHOD_NOT_ALLOWED | "Action records cannot be modified" |
| Invalid `type` filter | 422 | INVALID_ACTION_TYPE | "Invalid action type filter" |

---

### F06 API Surface (this feature)

Full schemas: see `Y1a-api-tickets.md` §History.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tickets/{id}/history` | Any (visibility-filtered) | Get ticket action history |
| POST | `/api/tickets/{id}/responses` | staff/admin | Post response (creates action type=response) |
| POST | `/api/tickets/{id}/comments` | staff/admin | Post comment (creates action type=comment) |

> Note: POST to responses/comments are also listed under F00 — they route to the same action creation logic.

---

### F06 Schema Surface (this feature)

Primary table: `actions`. See `Y0a-schema-core.md` §actions.

Key columns:
- `id`, `ticketId` (FK → tickets), `type` (enum), `visibility` (enum: external/internal)
- `actorPersonId` (FK → people, nullable), `actorClientId` (FK → clients, nullable)
- `datetimeCreated`, `payload` (JSON)
- No `updatedAt` — records are immutable
