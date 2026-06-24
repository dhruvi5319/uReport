---

## F08: Substatus System

**Description:** The substatus table provides fine-grained lifecycle states beyond the binary `open`/`closed` ticket status. Each substatus maps to either `open` or `closed` parent status, carries a name and description, and may be flagged as the default for that parent status. Three system substatuses are seeded at installation; staff may define additional custom substatuses. Substatuses are used on ticket close, auto-close rules, and as search filters.

---

### Terminology

- **Parent Status:** The binary ticket status this substatus belongs to — either `open` or `closed`.
- **isDefault:** Boolean flag indicating this substatus is the system default for its parent status. Exactly one substatus per parent status should have `isDefault = true`.
- **System substatus:** A pre-seeded substatus that cannot be deleted (Resolved, Duplicate, Bogus — all `closed`-type).
- **Auto-close substatus:** The substatus applied when the category auto-close job fires (must be `closed`-type).

---

### Sub-features

- Create, read, update, delete substatus records
- Associate each substatus with parent status (open/closed)
- Mark one substatus as default per parent status
- Assign substatus on ticket close
- Use substatus as ticket search filter
- Seed system substatuses (Resolved, Duplicate, Bogus)
- Use substatus as auto-close target in category config

---

### Seed Data (System Substatuses)

| Name | Description | Status | isDefault |
|------|-------------|--------|-----------|
| Open | Ticket is open | open | true |
| Resolved | Issue has been resolved | closed | true |
| Duplicate | Ticket is a duplicate | closed | false |
| Bogus | Ticket was invalid/bogus | closed | false |

---

### Process

#### Create Substatus
1. Staff POSTs to `POST /api/v1/substatus` with `name`, `description`, `status`, `isDefault`.
2. System validates `status` is `open` or `closed`.
3. If `isDefault = true`, system clears `isDefault` on any existing substatus with the same `status`.
4. System inserts `substatus` row.
5. Returns created substatus with 201.

#### Update Substatus
1. Staff PATCHes `/api/v1/substatus/{id}`.
2. Same isDefault uniqueness rule applies.
3. System blocks update of `name` on system substatuses (Resolved, Duplicate, Bogus, Open).

#### Delete Substatus
1. Staff DELETEs `/api/v1/substatus/{id}`.
2. System blocks delete of system substatuses.
3. System blocks delete if any `tickets.substatus_id` references it.
4. System blocks delete if any `categories.autoCloseSubstatus_id` references it.
5. On success, returns 204.

---

### Inputs

- `name` (string, required): Substatus name; max 100 chars.
- `description` (text, optional): Longer description.
- `status` (string, required): `open` or `closed`.
- `isDefault` (boolean, optional): Default false.

---

### Outputs

- **Substatus object:** id, name, description, status, isDefault, isSystem (boolean — true for seeded records).
- **Substatus list:** Array of all substatus records (not paginated — expected to be a small set).

---

### Validation Rules

- `status` must be exactly `open` or `closed`.
- `name` is required; max 100 chars; should be unique (case-insensitive) per `status`.
- At most one substatus per `status` value should have `isDefault = true`; setting `isDefault = true` on a new or updated record must clear the previous default for that status.
- System substatuses (Resolved, Duplicate, Bogus, Open) cannot be deleted.
- System substatus names cannot be modified.
- A substatus cannot be deleted if referenced by `tickets.substatus_id` or `categories.autoCloseSubstatus_id`.
- A `closed`-type substatus is required when closing a ticket (F00).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Substatus not found | 404 | SUBSTATUS_NOT_FOUND | "Substatus not found" |
| Invalid status value | 422 | INVALID_STATUS | "Status must be 'open' or 'closed'" |
| Delete of system substatus | 403 | SYSTEM_SUBSTATUS | "System substatuses cannot be deleted" |
| Modify name of system substatus | 403 | SYSTEM_SUBSTATUS | "System substatus names cannot be modified" |
| Delete blocked by ticket references | 409 | SUBSTATUS_IN_USE | "Substatus is referenced by existing tickets" |
| Delete blocked by category auto-close | 409 | SUBSTATUS_IN_USE | "Substatus is used by a category auto-close rule" |

---

### API Surface (this feature)

See full schemas in `Y1c-api-admin.md §Substatus`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/substatus` | staff | List all substatuses |
| POST | `/api/v1/substatus` | staff | Create substatus |
| GET | `/api/v1/substatus/{id}` | staff | Get substatus detail |
| PATCH | `/api/v1/substatus/{id}` | staff | Update substatus |
| DELETE | `/api/v1/substatus/{id}` | staff | Delete substatus |

---

### Schema Surface (this feature)

Table: `substatus`. See `Y0c-schema-categories.md §Substatus`.

Key columns: id (SERIAL PK), name (VARCHAR 100), description (TEXT), status (VARCHAR 10 CHECK IN ('open','closed')), isDefault (BOOLEAN DEFAULT false), isSystem (BOOLEAN DEFAULT false).
