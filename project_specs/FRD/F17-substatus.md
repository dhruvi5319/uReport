---

## F17: Substatus Management

**Description:** Tickets have a primary status of `open` or `closed`, but municipalities often need finer-grained state tracking (e.g., "Pending Parts", "Scheduled", "Referred to Third Party"). Substatuses allow administrators to define additional state labels that can be applied within either primary status, with one substatus configurable as the default for each primary state.

**Terminology:**
- **Substatus:** A named label providing more detail about a ticket's state within its primary status. Maps to `substatus` table.
- **Primary Status Association:** Each substatus is associated with either `open` or `closed` primary status.
- **Default Substatus:** The substatus automatically applied when a ticket transitions to open or closed state.

**Sub-features:**
- Create, edit, and deactivate substatus records
- Associate each substatus with `open` or `closed` primary status
- Configure a default substatus for new open tickets
- Configure a default substatus for newly closed tickets
- Assign/change substatus on a ticket at any point
- Filter ticket search by substatus (see F04)
- Display substatus alongside primary status in ticket list and detail views
- Record substatus changes in ticket audit trail (see F06)

---

### F17 Process: Create Substatus

1. Admin submits `POST /api/substatuses` with `label` and `primaryStatus`.
2. System validates `label` uniqueness within the same `primaryStatus`.
3. System saves with `active = true`.
4. System returns created substatus with HTTP 201.

### F17 Process: Set Default Substatus

1. Admin submits `PUT /api/substatuses/{id}` with `isDefault = true`.
2. System clears `isDefault` from any other substatus of the same `primaryStatus`.
3. System sets this substatus as default.
4. Going forward, all newly created `open` (or `closed`) tickets auto-receive this substatus.

### F17 Process: Assign Substatus to Ticket

1. Staff submits `PATCH /api/tickets/{id}` with `substatusId`.
2. System validates substatus is active and matches the ticket's current `primaryStatus`.
3. System updates `tickets.substatusId`.
4. System creates an `actions` entry with `type = 'substatus'`, `payload.previousSubstatusId`, `payload.newSubstatusId`.
5. System returns updated ticket with HTTP 200.

---

### F17 Inputs

**Create/Edit Substatus:**
- `label` (string, required, max 100): Display label (e.g., "Pending Parts")
- `primaryStatus` (enum, required): `open` | `closed`
- `isDefault` (boolean, optional, default false): Set as default for this primary status
- `active` (boolean, optional, default true)
- `sortOrder` (integer, optional): Display order in UI dropdowns

**Assign to Ticket:**
- `substatusId` (integer, required): ID of the substatus to apply (or null to clear)

---

### F17 Outputs

**Substatus object:**
```json
{
  "id": 4,
  "label": "Pending Parts",
  "primaryStatus": "open",
  "isDefault": false,
  "active": true,
  "sortOrder": 2,
  "createdAt": "2026-01-05T10:00:00Z"
}
```

**Ticket object** includes `substatus: { id, label, primaryStatus }`.

---

### F17 Validation

- `label` must be non-empty, max 100 chars
- `label` must be unique within the same `primaryStatus` (case-insensitive)
- `primaryStatus` must be `open` or `closed`
- Only one substatus per `primaryStatus` may have `isDefault = true`
- When assigning to a ticket: substatus `primaryStatus` must match ticket's current `status`
- Deactivating a substatus does not change tickets currently assigned that substatus; they retain it until explicitly changed

---

### F17 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Duplicate label for same primary status | 422 | DUPLICATE_LABEL | "A substatus with this label already exists for this status" |
| Substatus/ticket primary status mismatch | 422 | STATUS_MISMATCH | "Substatus does not match the ticket's current primary status" |
| Substatus not found | 404 | NOT_FOUND | "Substatus not found" |
| Caller not admin (for create/edit/delete) | 403 | FORBIDDEN | "Admin role required to manage substatuses" |

---

### F17 API Surface (this feature)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/substatuses` | staff/admin | List all substatuses |
| POST | `/api/substatuses` | admin | Create substatus |
| GET | `/api/substatuses/{id}` | staff/admin | Get substatus detail |
| PUT | `/api/substatuses/{id}` | admin | Update substatus |
| DELETE | `/api/substatuses/{id}` | admin | Deactivate substatus |

Substatus assignment to ticket: `PATCH /api/tickets/{id}` with `{ "substatusId": n }` — see `Y1a-api-tickets.md`.

---

### F17 Schema Surface (this feature)

Table: `substatus`. See `Y0b-schema-supporting.md` §substatus.

Key columns: `id`, `label`, `primaryStatus` (enum open/closed), `isDefault`, `active`, `sortOrder`, `createdAt`, `updatedAt`

`tickets.substatusId` (FK → substatus, nullable) — references the currently applied substatus.
