---

## F05: People / Contact Management

**Description:** The `people` table is the central identity registry for uReport, holding both staff users (who have `username`, `passwordHash`, and `role`) and constituent contacts (who may not have accounts). A person may have multiple email addresses, phone numbers, and physical addresses, each labeled. Staff manage the directory via a CRUD interface; the system also auto-creates person records from Open311 reporter info.

---

### Terminology

- **Staff Person:** A `people` record with `role = 'staff'` and a non-null `username`. Can log in.
- **Constituent Contact:** A `people` record with `role = 'public'` or null role; typically no login credentials.
- **peopleEmails:** Child table of zero-or-more email addresses per person, each with a label and `usedForNotifications` flag.
- **peoplePhones:** Child table of zero-or-more phone numbers per person, each with a label.
- **peopleAddresses:** Child table of zero-or-more addresses per person, each with a label.
- **usedForNotifications:** Flag on `peopleEmails` indicating this email should receive digest notifications for associated tickets.
- **defaultPerson:** A `people` record designated as default assignee for a department or category.

---

### Sub-features

- Create, read, update, delete person records
- Assign person to department
- Assign username, passwordHash, and role to staff users
- Manage multiple email addresses per person
- Manage multiple phone numbers per person
- Manage multiple addresses per person
- Search and filter people
- View all tickets associated with a person
- Auto-create person from Open311 reporter fields (F02)

---

### Process

#### Create Person
1. Staff POSTs to `POST /api/v1/people` with required fields.
2. System validates no existing person shares the same `username` (if username provided).
3. If `passwordHash` is not pre-hashed, system hashes the `password` with BCrypt.
4. System inserts `people` row.
5. If `emails` array provided, inserts `peopleEmails` rows.
6. If `phones` array provided, inserts `peoplePhones` rows.
7. If `addresses` array provided, inserts `peopleAddresses` rows.
8. Returns created person object with 201.

#### Search / List People
1. Staff GETs `/api/v1/people` with optional query params: `q` (name/email search), `role`, `department_id`, `organization`.
2. System performs case-insensitive ILIKE search on `firstname`, `lastname`, `organization` and JOIN email search on `peopleEmails.email`.
3. Returns paginated list.

#### Get Person's Tickets
1. Staff GETs `/api/v1/people/{id}/tickets`.
2. System queries tickets where `reportedByPerson_id = id` OR `assignedPerson_id = id` OR `enteredByPerson_id = id`.
3. Returns paginated ticket list.

#### Auto-Create from Open311
1. On POST /open311/requests, system receives `first_name`, `last_name`, `email`, `phone`.
2. System searches `people` by email (via `peopleEmails.email`).
3. If match found → use existing person_id.
4. If no match → create new `people` record with `role = 'public'`; create `peopleEmails` record.
5. Uses resulting person_id as `reportedByPerson_id` on the new ticket.

---

### Inputs

**Person record:**
- `firstname` (string, required): First name.
- `middlename` (string, optional): Middle name.
- `lastname` (string, required): Last name.
- `organization` (string, optional): Organization/company.
- `address` (string, optional): Primary street address.
- `city` (string, optional): Primary city.
- `state` (string, optional): Primary state (2 chars).
- `zip` (string, optional): Primary ZIP.
- `department_id` (integer, optional): FK to `departments.id`.
- `username` (string, optional): Login username (staff only).
- `password` (string, optional): Plain-text password (BCrypt-hashed before storage).
- `role` (string, optional): `staff`, `public`, or `anonymous`.

**Email sub-record:**
- `email` (string, required): Email address.
- `label` (string, optional): `Home`, `Work`, `Other`.
- `usedForNotifications` (boolean, optional): Default false.

**Phone sub-record:**
- `number` (string, required): Phone number (freeform).
- `label` (string, optional): `Main`, `Mobile`, `Work`, `Home`, `Fax`, `Pager`, `Other`.

**Address sub-record:**
- `address` (string, required): Street address.
- `city` (string, optional): City.
- `state` (string, optional): State.
- `zip` (string, optional): ZIP.
- `label` (string, optional): `Home`, `Business`, `Rental`.

---

### Outputs

- **Person object:** id, firstname, middlename, lastname, organization, address, city, state, zip, department_id, department (name), username, role, emails (array), phones (array), addresses (array), createdAt, updatedAt.
- **People list:** Paginated array of person objects (without sub-arrays by default; `?expand=emails,phones,addresses` to include).

---

### Validation Rules

- `firstname` and `lastname` are required; max 100 chars each.
- `username` must be unique across `people` table (case-insensitive).
- `username` must be provided if `role = 'staff'`.
- `role` must be one of: `staff`, `public`, `anonymous` (or null for contacts without a role).
- `email` values in `peopleEmails` must pass RFC 5322 format validation.
- `state` max 2 characters.
- `zip` max 10 characters.
- At most one `peopleEmails` record per person can have `usedForNotifications = true` per label type (soft rule; system does not enforce uniqueness, but digest logic uses all flagged emails).
- Phone `number` is stored as-is (no normalization); max 30 chars.
- Deleting a person is blocked if they are referenced as `reportedByPerson_id`, `assignedPerson_id`, `enteredByPerson_id` on any ticket. Soft-delete (`deletedAt` timestamp) is preferred.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Person not found | 404 | PERSON_NOT_FOUND | "Person not found" |
| Username already taken | 409 | USERNAME_CONFLICT | "Username already in use" |
| Invalid email format | 422 | INVALID_EMAIL | "Invalid email address format" |
| Invalid role value | 422 | INVALID_ROLE | "Role must be staff, public, or anonymous" |
| Delete blocked by ticket references | 409 | PERSON_IN_USE | "Person is referenced by existing tickets" |
| firstname or lastname missing | 422 | MISSING_REQUIRED_FIELD | "First name and last name are required" |

---

### API Surface (this feature)

See full request/response schemas in `Y1a-api-auth-people.md §People`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/people` | staff | List/search people |
| POST | `/api/v1/people` | staff | Create person |
| GET | `/api/v1/people/{id}` | staff | Get person detail |
| PUT | `/api/v1/people/{id}` | staff | Replace person record |
| PATCH | `/api/v1/people/{id}` | staff | Update person fields |
| DELETE | `/api/v1/people/{id}` | staff | Soft-delete person |
| GET | `/api/v1/people/{id}/tickets` | staff | Get tickets associated with person |
| POST | `/api/v1/people/{id}/emails` | staff | Add email to person |
| PUT | `/api/v1/people/{id}/emails/{emailId}` | staff | Update email record |
| DELETE | `/api/v1/people/{id}/emails/{emailId}` | staff | Remove email |
| POST | `/api/v1/people/{id}/phones` | staff | Add phone to person |
| PUT | `/api/v1/people/{id}/phones/{phoneId}` | staff | Update phone record |
| DELETE | `/api/v1/people/{id}/phones/{phoneId}` | staff | Remove phone |
| POST | `/api/v1/people/{id}/addresses` | staff | Add address to person |
| PUT | `/api/v1/people/{id}/addresses/{addrId}` | staff | Update address record |
| DELETE | `/api/v1/people/{id}/addresses/{addrId}` | staff | Remove address |

---

### Schema Surface (this feature)

Primary tables: `people`, `peopleEmails`, `peoplePhones`, `peopleAddresses`. See full DDL in `Y0b-schema-people.md §People`.

Key columns:
- `people`: id (SERIAL PK), firstname, middlename, lastname, organization, address, city, state, zip, department_id (FK), username (UNIQUE), passwordHash, role, deletedAt (TIMESTAMPTZ).
- `peopleEmails`: id (SERIAL PK), person_id (FK), email, label, usedForNotifications (BOOLEAN).
- `peoplePhones`: id (SERIAL PK), person_id (FK), number, label.
- `peopleAddresses`: id (SERIAL PK), person_id (FK), address, city, state, zip, label.
