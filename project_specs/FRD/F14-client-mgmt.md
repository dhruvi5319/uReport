---

## F14: Client / API Key Management

**Priority:** P1 — High

### Description

External Open311 clients (mobile apps, third-party 311 aggregators) are registered in the system with a name, URL, API key, contact person, and contact method. The admin panel at `/admin/clients` manages these client records. The API key is validated by the Spring Boot Open311 controller on every `POST /open311/v2/requests` call.

### Terminology

- **Client** — An external organization or application that integrates with the uReport Open311 API. Stored in `clients` table.
- **API key** — A unique secret string (UUID format) stored in `clients.api_key`. Required for Open311 write operations. Passed via `api_key` query parameter or `X-Api-Key` header.
- **OBSOLETE_API_KEYS** — A configurable list (application config) of deprecated API keys that trigger the mobile shutdown notice (see F0). These keys are not deleted from the database but are listed in config.
- **Contact person** — A `people` record associated with the client as the technical contact (`clients.contactPerson_id`).

### Sub-features

- List all client records (name, URL, API key masked, contact person, contact method)
- Create new client (generate API key)
- Edit client record
- Delete client record (with confirmation)
- Display full API key (reveal button, with copy to clipboard)
- Regenerate API key (generates new UUID, old key immediately invalidated)
- API key validation in Spring Security filter for POST /open311/v2/requests

### Process — List Clients

1. Staff navigates to `/admin/clients`.
2. `GET /api/clients` returns all client records.
3. Table columns: Name, URL, API Key (masked: `{first6}...{last4}`), Contact Person, Contact Method, Actions (Edit / Delete).

### Process — Create Client

1. Staff clicks "New Client".
2. Sheet opens with form.
3. Staff fills: name (required), URL, contact person (search/select from people), contact method.
4. API key is auto-generated as a UUID on save (not entered by staff).
5. `POST /api/clients` creates the record.
6. Sheet closes; the newly generated API key is displayed in a one-time reveal dialog with a "Copy" button.
7. Toast "Client created. Copy the API key — it will be masked after this dialog."

### Process — Edit Client

1. Staff clicks "Edit" on a client row.
2. Sheet opens pre-filled with name, URL, contact person, contact method.
3. API key field: shown masked with a "Reveal" button (requires confirming intent).
4. "Regenerate API Key" button available; confirmation dialog: "This will invalidate the existing API key. Continue?"
5. On regenerate confirm: new UUID generated; displayed once; old key immediately invalid.
6. `PUT /api/clients/{id}` saves changes.

### Process — Delete Client

1. Staff clicks "Delete" on a client row.
2. Confirmation dialog: "Delete client {name}? Their API key will immediately stop working."
3. `DELETE /api/clients/{id}` removes the record.
4. Any future request with the deleted key returns 403.
5. Toast "Client deleted".

### API Key Validation (Spring Security Filter)

1. On `POST /open311/v2/requests`: Spring Security filter extracts `api_key` query param or `X-Api-Key` header.
2. Queries `SELECT id FROM clients WHERE api_key = :key` (with a prepared statement; exact match required).
3. If found: sets `client_id` on the request context; allows the request.
4. If not found: returns `HTTP 403 Forbidden` with error body `{"errors":[{"code":"clients/unknownClient","description":"Invalid API key"}]}`.
5. OBSOLETE_API_KEYS check: if the key is in the configured obsolete list, request proceeds but the service list will return the shutdown notice (handled in F0 §F0.1).

### Inputs

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | [R] | Max 128 chars |
| `url` | string | [O] | Valid URL; max 255 chars |
| `api_key` | string | auto-generated | UUID (v4); unique |
| `contactPerson_id` | integer | [R] | Must reference existing person |
| `contactMethod_id` | integer | [O] | Must reference existing contact method |

### Validation Rules

- `name` is required; max 128 chars.
- `contactPerson_id` must reference an existing `people` record.
- `api_key` is generated server-side as a UUID; staff cannot set it manually.
- `url` must be a valid URL if provided.
- API key uniqueness enforced by database unique constraint on `clients.api_key`.

### Error States

| Scenario | HTTP Status | Message |
|---|---|---|
| Missing name | 400 | "Client name is required" |
| Invalid contactPerson_id | 400 | "Contact person not found" |
| Invalid URL | 400 | "Invalid URL format" |
| Client not found | 404 | "Client not found" |
| Unauthorized | 403 | "Admin role required" |
| Invalid API key (Open311) | 403 | "Invalid API key" |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/clients` | List all clients |
| POST | `/api/clients` | Create client (API key auto-generated) |
| GET | `/api/clients/{id}` | Client detail |
| PUT | `/api/clients/{id}` | Update client |
| POST | `/api/clients/{id}/regenerate-key` | Regenerate API key |
| DELETE | `/api/clients/{id}` | Delete client |

### Schema Surface

- `clients` — core entity (name, url, api_key, contactPerson_id, contactMethod_id)
- `people` — contact person FK
- `contactMethods` — contact method FK
