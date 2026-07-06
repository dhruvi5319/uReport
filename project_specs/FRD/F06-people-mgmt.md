---

## F6: People Management

**Priority:** P1 — High

### Description

The people management admin panel (`/admin/people`) allows administrators to manage all individuals in the system: staff, reporters, and contacts. A person record stores name, organization, address, department affiliation, role, and username. Related records manage multiple emails (with notification flags), phones, and addresses. Person records are used throughout the system as reporters and assignees on tickets.

### Terminology

- **Staff person** — A person with `role = 'admin'` or `role = 'staff'`; eligible for ticket assignment.
- **Reporter** — Any person who has submitted a ticket; may have `role = 'public'` or null.
- **Notification email** — `peopleEmails.usedForNotifications = true`; used for all automated email sends.
- **LDAP/CAS linkage** — `people.username` stores the LDAP UID or CAS principal name used for SSO login.

### Sub-features

- List all people with search (name, email, username) and role filter
- Create new person record
- Edit person record (inline)
- Delete person record (with confirmation and safety check)
- Manage multiple email addresses per person (with notification flag)
- Manage multiple phone numbers per person (with label)
- Manage multiple addresses per person (with label)
- Assign person to department
- Set username and role
- View all tickets reported by or assigned to a person (linked list)

### Process — List People

1. Staff navigates to `/admin/people`.
2. React issues `GET /api/people` with optional `q` (search) and `role` filter params.
3. Table renders: Name, Organization, Department, Role, Username, Email count, Actions (Edit / Delete).
4. Search input (300 ms debounce) filters by name, email, or username.
5. Role filter dropdown: All, Admin, Staff, Public.

### Process — Create Person

1. Staff clicks "New Person" button.
2. A Sheet (side drawer) opens with the create form.
3. Staff fills: first name, last name (or organization name), department, role, username.
4. Optionally adds email, phone, address records.
5. On save: `POST /api/people` with person data and nested email/phone/address arrays.
6. System creates `people` record and related `peopleEmails`, `peoplePhones`, `peopleAddresses` records.
7. Sheet closes; toast "Person created"; list refreshes.

### Process — Edit Person

1. Staff clicks "Edit" on a person row.
2. Sheet opens pre-filled with person data.
3. Staff modifies fields; sub-panels allow adding/removing emails, phones, addresses.
4. On save: `PUT /api/people/{id}` (full replace) or `PATCH /api/people/{id}` (partial update).
5. Related records sent as nested arrays; system reconciles (add new, update existing, delete removed).
6. Toast "Person updated"; sheet closes.

### Process — Delete Person

1. Staff clicks "Delete" on a person row.
2. Confirmation dialog: "Are you sure you want to delete {name}?"
3. If person is referenced as `enteredByPerson_id`, `reportedByPerson_id`, or `assignedPerson_id` on any ticket, system returns 409 and shows: "Cannot delete: this person is associated with {N} tickets."
4. If safe to delete: `DELETE /api/people/{id}` cascades to remove related email/phone/address records.
5. Toast "Person deleted"; list refreshes.

### Inputs — Person Record

| Field | Type | Required | Validation |
|---|---|---|---|
| `firstname` | string | [O] | Max 128 chars |
| `middlename` | string | [O] | Max 128 chars |
| `lastname` | string | [O] | Max 128 chars |
| `organization` | string | [O] | Max 128 chars |
| `address` | string | [O] | Max 128 chars (primary address on people record) |
| `city` | string | [O] | Max 128 chars |
| `state` | string | [O] | Max 128 chars |
| `zip` | string | [O] | Max 20 chars |
| `department_id` | integer | [O] | Must reference valid department |
| `username` | string | [O] | Max 40 chars; unique across all people |
| `role` | string | [O] | Enum: `admin`, `staff`, `public`, or null |

### Inputs — Email Record (peopleEmails)

| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | string | [R] | Valid email format; max 255 chars |
| `label` | enum | [R] | Home, Work, Other |
| `usedForNotifications` | boolean | [R] | Default false |

### Inputs — Phone Record (peoplePhones)

| Field | Type | Required | Validation |
|---|---|---|---|
| `number` | string | [R] | Max 20 chars |
| `label` | enum | [R] | Main, Mobile, Work, Home, Fax, Pager, Other |

### Inputs — Address Record (peopleAddresses)

| Field | Type | Required | Validation |
|---|---|---|---|
| `address` | string | [R] | Max 128 chars |
| `city` | string | [O] | Max 128 chars |
| `state` | string | [O] | Max 128 chars |
| `zip` | string | [O] | Max 20 chars |
| `label` | enum | [R] | Home, Business, Rental |

### Validation Rules

- At least one of `firstname`, `lastname`, or `organization` must be provided.
- `username` must be unique; system returns 409 if duplicate.
- Emails with `usedForNotifications = true` must be valid email format.
- `role` must be one of the defined enum values or null.
- Only `admin` role users may set another user's role to `admin` or `staff`.
- Delete blocked if person has associated ticket records.

### Error States

| Scenario | HTTP Status | Message |
|---|---|---|
| Duplicate username | 409 | "Username already in use" |
| Invalid email format | 400 | "Invalid email address" |
| Delete blocked by tickets | 409 | "Cannot delete: person has associated cases" |
| Person not found | 404 | "Person not found" |
| Unauthorized | 403 | "Admin role required" |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/people` | List people (search, role filter, paginated) |
| POST | `/api/people` | Create person |
| GET | `/api/people/{id}` | Get person detail |
| PUT | `/api/people/{id}` | Update person (full replace) |
| DELETE | `/api/people/{id}` | Delete person |
| GET | `/api/people/{id}/tickets` | Tickets reported by or assigned to person |

### Schema Surface

- `people` — core entity
- `peopleEmails` — email addresses with notification flag
- `peoplePhones` — phone numbers
- `peopleAddresses` — physical addresses
- `departments` — department affiliation FK
