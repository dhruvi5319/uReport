---

## F03: People & Contact Management

**Description:** uReport maintains a unified people/contacts directory covering both municipal staff and constituents. Each person record holds identity data, role, and one or more contact methods (email addresses, phone numbers, physical addresses). Staff persons are linked to departments; constituent persons are linked as ticket reporters.

**Terminology:**
- **Contact Method:** An email address, phone number, or physical address record associated with a person. Maps to `contactMethods` table.
- **Primary Email:** The designated primary email address for a person; used for notifications.
- **Role:** The access level of the person — `admin`, `staff`, or `public`. Stored in `people.role`. Anonymous users have no `people` record.
- **Active:** Whether the person record is enabled. Inactive staff cannot log in; inactive reporters are preserved for history.

**Sub-features:**
- Create person record (staff-created or auto-created on first OIDC login)
- View person detail with all contact methods
- Edit person fields (name, role, department association)
- Add/edit/remove contact methods (emails, phones, addresses)
- Deactivate person record
- Search and filter people by name, email, role, department
- Link person as ticket reporter
- Link person as ticket assignee

---

### F03 Process: Create Person

1. Admin submits person payload with at least one contact method (email recommended).
2. System validates email uniqueness across all `contactMethods` of type `email`.
3. System creates `people` record with `active = true`.
4. System creates associated `contactMethods` records.
5. System returns created person with HTTP 201.

### F03 Process: OIDC Auto-Provision

1. Staff completes OIDC login flow (see F11).
2. System looks up `people` record by `oidcSubject` or primary email from OIDC claims.
3. If no record found, system auto-creates a person record with role `public` and data from OIDC claims.
4. Admin must manually elevate role to `staff` or `admin` after first login.
5. Subsequent logins update the person's name/email from fresh OIDC claims.

### F03 Process: Add Contact Method

1. Staff or admin submits new contact method (type + value + optional `isPrimary` flag).
2. System validates the value format per type.
3. If `isPrimary = true` and another primary of the same type already exists, the existing primary is demoted.
4. System creates `contactMethods` record linked to the person.
5. System returns updated person with HTTP 200.

---

### F03 Inputs

**Create/Edit Person:**
- `firstName` (string, required, max 100)
- `lastName` (string, required, max 100)
- `role` (enum, required): `admin` | `staff` | `public`
- `departmentId` (integer, optional): Staff department affiliation
- `active` (boolean, optional, default true)
- `oidcSubject` (string, optional, max 255): OIDC `sub` claim for SSO matching

**Contact Method Object:**
- `type` (enum, required): `email` | `phone` | `address`
- `value` (string, required): The email address, phone number, or address string
- `phoneType` (enum, optional, when type=phone): `mobile` | `office` | `home`
- `isPrimary` (boolean, default false)
- `label` (string, optional, max 100): Friendly label (e.g., "Work Email")

**Search/Filter:**
- `q` (string, optional): Free-text search over name, email
- `role` (enum, optional): Filter by role
- `departmentId` (integer, optional): Filter by department
- `active` (boolean, optional, default true): Include/exclude inactive

---

### F03 Outputs

- **Person object**: `{ id, firstName, lastName, fullName, role, departmentId, active, oidcSubject, contactMethods[], createdAt, updatedAt }`
- **Contact method object**: `{ id, personId, type, value, phoneType, isPrimary, label }`
- **Paginated list** on search endpoints
- **HTTP 201** on create; **HTTP 200** on update; **HTTP 204** on deactivate

---

### F03 Validation

- `firstName` and `lastName` must be non-empty strings
- `role` must be one of: `admin`, `staff`, `public`
- Email `value` must be valid RFC 5322 format
- Email `value` must be unique across all active `contactMethods` of type `email`
- Phone `value` should match a reasonable phone pattern (digits, spaces, dashes, parentheses, +)
- `departmentId` must reference an active department if provided
- Cannot set role `admin` or `staff` on a person without a valid email contact method
- Deactivating a person does not delete their tickets or actions
- Cannot delete a person record (only deactivate) — preserves historical references

---

### F03 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Duplicate email across persons | 422 | DUPLICATE_EMAIL | "This email address is already registered" |
| Invalid email format | 422 | INVALID_EMAIL | "Email address is not valid" |
| Invalid role value | 422 | INVALID_ROLE | "Role must be admin, staff, or public" |
| Invalid `departmentId` | 422 | INVALID_DEPARTMENT | "Department not found or inactive" |
| Person not found | 404 | NOT_FOUND | "Person not found" |
| Caller not admin | 403 | FORBIDDEN | "Admin role required to manage people" |

---

### F03 API Surface (this feature)

Full schemas: see `Y1b-api-admin.md` §People.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/people` | staff/admin | List/search people |
| POST | `/api/people` | admin | Create person |
| GET | `/api/people/{id}` | staff/admin | Get person detail |
| PUT | `/api/people/{id}` | admin | Update person |
| DELETE | `/api/people/{id}` | admin | Deactivate person |
| GET | `/api/people/{id}/contact-methods` | staff/admin | List contact methods |
| POST | `/api/people/{id}/contact-methods` | admin | Add contact method |
| PUT | `/api/people/{id}/contact-methods/{cmId}` | admin | Update contact method |
| DELETE | `/api/people/{id}/contact-methods/{cmId}` | admin | Remove contact method |

---

### F03 Schema Surface (this feature)

Tables: `people`, `contactMethods`. See `Y0a-schema-core.md` §people.

Key columns:
- `people`: `id`, `firstName`, `lastName`, `role` (enum admin/staff/public), `departmentId` (FK), `active`, `oidcSubject`, `createdAt`, `updatedAt`
- `contactMethods`: `id`, `personId` (FK → people), `type` (enum email/phone/address), `value`, `phoneType`, `isPrimary`, `label`
