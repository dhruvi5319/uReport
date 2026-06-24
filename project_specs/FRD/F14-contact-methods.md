---

## F14: Contact Method Tracking

**Description:** uReport tracks how tickets were submitted and how constituents prefer to receive responses via the `contactMethods` lookup table. Four system contact methods are seeded at installation (Email, Phone, Web Form, Other). Tickets reference a `contactMethod_id` for the submission channel and a `responseMethod_id` for the preferred response channel. Contact methods are also associated with API clients.

---

### Terminology

- **contactMethod_id:** FK on `tickets` — the channel through which this ticket was submitted.
- **responseMethod_id:** FK on `tickets` — the constituent's preferred response channel.
- **System contact method:** One of the four seeded methods (Email, Phone, Web Form, Other). Cannot be deleted.

---

### Sub-features

- Seed four system contact methods: Email, Phone, Web Form, Other
- Record submission contact method on a ticket
- Record preferred response method on a ticket
- Filter ticket searches by contact method (F11)
- Associate API clients with a contact method (F13)

---

### Seed Data

| ID | Name |
|----|------|
| 1 | Email |
| 2 | Phone |
| 3 | Web Form |
| 4 | Other |

*(IDs are stable seeds; must not be altered post-installation)*

---

### Process

#### List Contact Methods
1. Client GETs `/api/v1/contact-methods`.
2. System returns all contact methods ordered by ID.
3. No authentication required (reference data).

#### Create Contact Method (admin)
1. Staff POSTs to `POST /api/v1/contact-methods` with `name`.
2. System validates `name` is non-empty and unique.
3. System inserts `contactMethods` row.
4. Returns created method with 201.

#### Delete Contact Method
1. Staff DELETEs `/api/v1/contact-methods/{id}`.
2. System blocks delete of system contact methods (IDs 1–4).
3. System blocks delete if any `tickets.contactMethod_id` or `tickets.responseMethod_id` references it.
4. Returns 204.

---

### Inputs

- `name` (string, required): Contact method name; max 100 chars.

---

### Outputs

- **Contact method object:** id, name, isSystem (boolean).
- **Contact methods list:** Array of all contact method objects.

---

### Validation Rules

- `name` required; max 100 chars; must be unique (case-insensitive).
- System contact methods (IDs 1–4) cannot be deleted or renamed.
- Deleting a contact method referenced by any ticket is blocked.
- `contactMethod_id` and `responseMethod_id` on tickets must reference valid `contactMethods.id` values.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Contact method not found | 404 | CONTACT_METHOD_NOT_FOUND | "Contact method not found" |
| Delete system contact method | 403 | SYSTEM_CONTACT_METHOD | "System contact methods cannot be deleted" |
| Delete blocked by ticket references | 409 | CONTACT_METHOD_IN_USE | "Contact method is referenced by existing tickets" |
| Duplicate name | 409 | CONTACT_METHOD_CONFLICT | "Contact method name already exists" |

---

### API Surface (this feature)

See schemas in `Y1c-api-admin.md §ContactMethods`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/contact-methods` | none | List all contact methods |
| POST | `/api/v1/contact-methods` | staff | Create contact method |
| DELETE | `/api/v1/contact-methods/{id}` | staff | Delete contact method |

---

### Schema Surface (this feature)

Table: `contactMethods`. See `Y0b-schema-people.md §ContactMethods`.

Key columns: id (SERIAL PK), name (VARCHAR 100 UNIQUE), isSystem (BOOLEAN DEFAULT false).
