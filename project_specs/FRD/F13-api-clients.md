---

## F13: API Client Management

**Description:** External applications that integrate with uReport via the Open311 API are registered as API clients. Each client has a name, URL, a unique API key, a contact person, and an optional default contact method. API keys are validated on Open311 write operations. Tickets submitted via API carry the originating client's ID. Staff manage clients via an admin interface.

---

### Terminology

- **api_key:** A shared secret assigned to a client, used to authenticate Open311 POST requests. Stored hashed at rest.
- **contactPerson:** A `people` record who is the human point of contact for this API integration.
- **contactMethod:** The default contact method applied to tickets submitted by this client.
- **OBSOLETE_API_KEYS:** A server-side configuration list of deprecated keys that trigger the mobile-shutdown notice (see F02).

---

### Sub-features

- Create, read, update, delete API client records
- Generate or assign a unique api_key per client
- Associate client with contact person and optional contact method
- Validate api_key on Open311 write requests
- Associate submitted tickets with their client (tickets.client_id)
- List all registered clients (staff only)

---

### Process

#### Create Client
1. Staff POSTs to `POST /api/v1/clients` with `name`, `url`, optional `contactPerson_id`, optional `contactMethod_id`.
2. If `api_key` not provided, system generates a cryptographically random 32-byte hex string.
3. System hashes the raw key with BCrypt (or SHA-256 + salt) before storing.
4. System returns the raw (unhashed) key **once** in the 201 response — it is not retrievable again.
5. System inserts `clients` row.

#### Update Client
1. Staff PATCHes `/api/v1/clients/{id}`.
2. If `regenerateApiKey = true`, system generates and returns a new raw api_key.
3. System updates `clients` row.

#### Validate API Key (Open311 write)
1. Request arrives at `POST /open311/requests` with `api_key` param.
2. System iterates `clients` table, checking `bcrypt.verify(api_key, clients.api_key_hash)` for each (or uses a lookup-table approach with a salted index for performance).
3. Alternative (preferred for performance): Store a salted SHA-256 hash in a separate indexed column for fast lookup; BCrypt for secure storage.
4. If match found → sets `client_id` on the new ticket.
5. If no match → 403 (see F02).

---

### Inputs

- `name` (string, required): Client/application name; max 200 chars.
- `url` (string, optional): Client's website or integration URL; max 500 chars.
- `api_key` (string, optional): If not provided, auto-generated.
- `contactPerson_id` (integer, optional): FK to `people.id`.
- `contactMethod_id` (integer, optional): FK to `contactMethods.id`.
- `regenerateApiKey` (boolean, optional): On PATCH, triggers new key generation.

---

### Outputs

- **Client object (create/update):** id, name, url, contactPerson_id, contactPerson (name), contactMethod_id, contactMethod (name), rawApiKey (returned once on create/regenerate only).
- **Client object (read/list):** id, name, url, contactPerson_id, contactPerson (name), contactMethod_id, contactMethod (name). `api_key` is NEVER returned in read responses.
- **Clients list:** Paginated array of client objects.

---

### Validation Rules

- `name` required; max 200 chars.
- `api_key` is stored hashed — the raw key is never stored in plaintext.
- Raw API key is returned in the response body only at creation time or key regeneration — never again.
- `contactPerson_id` must reference an existing person if provided.
- `contactMethod_id` must reference an existing contact method if provided.
- Deleting a client is blocked if any `tickets.client_id` references it. Deactivate or reassign first.
- API keys must be unique across all clients (pre-store uniqueness check on hash).
- `url` must be a valid URL format if provided.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Client not found | 404 | CLIENT_NOT_FOUND | "Client not found" |
| Duplicate api_key | 409 | API_KEY_CONFLICT | "API key already in use" |
| Delete blocked by ticket references | 409 | CLIENT_IN_USE | "Client is referenced by existing tickets" |
| Invalid contactPerson | 422 | PERSON_NOT_FOUND | "Contact person not found" |
| Invalid contactMethod | 422 | CONTACT_METHOD_NOT_FOUND | "Contact method not found" |
| name missing | 422 | MISSING_REQUIRED_FIELD | "Client name is required" |

---

### API Surface (this feature)

See full schemas in `Y1a-api-auth-people.md §Clients`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/clients` | staff | List all API clients |
| POST | `/api/v1/clients` | staff | Register new API client |
| GET | `/api/v1/clients/{id}` | staff | Get client detail |
| PATCH | `/api/v1/clients/{id}` | staff | Update client / regenerate key |
| DELETE | `/api/v1/clients/{id}` | staff | Delete client |

---

### Schema Surface (this feature)

Table: `clients`. See `Y0b-schema-people.md §Clients`.

Key columns: id (SERIAL PK), name (VARCHAR 200), url (VARCHAR 500), api_key_hash (VARCHAR 255) — hashed storage, api_key_lookup (VARCHAR 64) — fast-lookup SHA-256 hash (indexed), contactPerson_id (FK people, nullable), contactMethod_id (FK contactMethods, nullable).
