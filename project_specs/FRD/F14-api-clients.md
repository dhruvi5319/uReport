---

## F14: API Client Management

**Description:** Third-party Open311 clients (mobile apps, city portals, integrations) are identified by API keys. Administrators manage these client records, associating each key with a client name and contact information for accountability, audit trail attribution, and future rate-limiting. An API key is passed as a query parameter in Open311 requests.

**Terminology:**
- **API Client:** A registered third-party system authorized to submit Open311 requests. Maps to `clients` table.
- **API Key:** A cryptographically random string (UUID v4 or 32-char hex) that identifies a client. Passed as `api_key` in Open311 requests.
- **Revocation:** Deactivating a client so its API key is no longer accepted.

**Sub-features:**
- Create API client record (name, contact email, auto-generated API key)
- List all registered API clients
- View single client detail
- Revoke (deactivate) a client
- Regenerate API key for an existing client
- Validate API key on Open311 requests
- Log client identity in ticket audit trail for Open311-submitted tickets

---

### F14 Process: Create API Client

1. Admin submits `POST /api/clients` with `name` and `contactEmail`.
2. System generates a cryptographically random API key (UUID v4 format).
3. System creates `clients` record with `active = true`.
4. System returns the full client record **including the plain-text API key** (only shown once; not retrievable again).
5. Admin copies the key and distributes to the third-party client owner.

### F14 Process: Validate API Key (Open311 Request)

1. Open311 endpoint receives `api_key` parameter.
2. System looks up `clients` record by `apiKey` value where `active = true`.
3. If found: attach `clientId` to the request context; ticket creation sets `actorClientId`.
4. If not found or `active = false`: if the category permits anonymous posting, proceed without client attribution; otherwise, reject with HTTP 400.
5. If `api_key` not provided: treat as anonymous (no client record attached).

### F14 Process: Regenerate API Key

1. Admin requests `POST /api/clients/{id}/regenerate-key`.
2. System generates a new API key.
3. System updates `clients.apiKey` with the new key.
4. System returns the new key in plain text (only shown once).
5. The old key is immediately invalidated.

---

### F14 Inputs

**Create/Edit Client:**
- `name` (string, required, max 255): Human-readable client name
- `contactEmail` (string, required): Contact email for the client owner
- `notes` (string, optional, max 1000): Admin notes

**API key in Open311 request:**
- `api_key` (string, optional): Passed as query param or form field

---

### F14 Outputs

**Client object (on create / regenerate — includes key):**
```json
{
  "id": 7,
  "name": "City Mobile App",
  "contactEmail": "dev@cityapp.example.com",
  "apiKey": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "active": true,
  "createdAt": "2026-01-10T08:00:00Z"
}
```

**Client object (on list/get — key NOT shown):**
```json
{
  "id": 7,
  "name": "City Mobile App",
  "contactEmail": "dev@cityapp.example.com",
  "apiKeyHint": "f47ac10b…",
  "active": true,
  "createdAt": "2026-01-10T08:00:00Z"
}
```

---

### F14 Validation

- `name` must be non-empty, max 255 chars
- `contactEmail` must be valid RFC 5322 email format
- `name` must be unique across clients (case-insensitive)
- API key is auto-generated — not provided by the caller
- Once created, the plain-text API key is only returned in the create and regenerate responses; subsequent GET requests return only a hint (first 8 chars + "…")

---

### F14 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Duplicate client name | 422 | DUPLICATE_NAME | "A client with this name already exists" |
| Invalid contact email | 422 | INVALID_EMAIL | "Contact email is not valid" |
| Client not found | 404 | NOT_FOUND | "API client not found" |
| Revoke already-inactive client | 409 | ALREADY_INACTIVE | "Client is already inactive" |
| Caller not admin | 403 | FORBIDDEN | "Admin role required to manage API clients" |

---

### F14 API Surface (this feature)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/clients` | admin | List all API clients |
| POST | `/api/clients` | admin | Create API client |
| GET | `/api/clients/{id}` | admin | Get client detail (key hint only) |
| PUT | `/api/clients/{id}` | admin | Update name/contact/notes |
| DELETE | `/api/clients/{id}` | admin | Revoke (deactivate) client |
| POST | `/api/clients/{id}/regenerate-key` | admin | Regenerate API key |

---

### F14 Schema Surface (this feature)

Table: `clients`. See `Y0b-schema-supporting.md` §clients.

Key columns: `id`, `name`, `contactEmail`, `apiKey` (hashed or plain — recommend bcrypt hash + hint), `notes`, `active`, `createdAt`, `updatedAt`

> **Security note:** Consider storing `bcrypt(apiKey)` and a plain-text `apiKeyHint` (first 8 chars) rather than the plain key. On validation, hash the provided key and compare.
