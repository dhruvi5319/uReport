---

## F02: Open311 GeoReport v2 REST API

**Description:** uReport exposes a fully Open311 GeoReport v2 compliant REST API consumed by external municipality systems, mobile apps, and third-party integrators. All six Open311 endpoints must produce byte-compatible JSON and XML responses compared to the current PHP implementation. API key authentication is required for write operations; read operations may be anonymous or authenticated.

---

### Terminology

- **Open311 / GeoReport v2:** An open standard for civic issue reporting APIs. See http://wiki.open311.org/GeoReport_v2/.
- **service_code:** The Open311 identifier for a service type — maps to `categories.id` in uReport.
- **service_request_id:** The Open311 identifier for a submitted request — maps to `tickets.id`.
- **service:** An Open311 service definition — maps to a uReport `category`.
- **api_key:** A shared secret required for POST /requests; validated against `clients.api_key`.
- **Obsolete API key:** A key in the server-side `OBSOLETE_API_KEYS` list that triggers a mobile-app-shutdown JSON response instead of a normal error.
- **discovery:** The Open311 discovery endpoint returning API metadata (endpoint URLs, changeset, formats).
- **format:** Response format; `json` (default) or `xml`. Passed as `?format=xml` or HTTP Accept header.

---

### Sub-features

- GET /open311/discovery — API metadata
- GET /open311/services — list all active postable services
- GET /open311/services/{service_code} — single service with attribute schema
- POST /open311/requests — submit a new service request
- GET /open311/requests — search/list service requests
- GET /open311/requests/{service_request_id} — retrieve a single request
- JSON and XML format support for all endpoints
- API key validation for POST
- Obsolete API key detection
- Category posting permission level enforcement

---

### Process

#### GET /open311/discovery
1. System reads configured endpoint URLs, jurisdiction_id, changeset date from config.
2. Returns discovery object with `changeset`, `contact`, `key_service`, and `endpoints` array.
3. Supports `format=json` and `format=xml`.

#### GET /open311/services
1. System queries all categories where `active = true` AND `postingPermissionLevel IN ('public','anonymous')`.
2. Maps each category to an Open311 service object (see field mapping below).
3. Returns array ordered by `categoryGroups.ordering`, then `categories.name`.
4. If `service_code` query param present, filters to that single service (equivalent to GET /services/{code}).
5. Supports `format=json` and `format=xml`.

#### GET /open311/services/{service_code}
1. System looks up category by `id = service_code`.
2. If not found → 404.
3. Returns single service definition including `attributes` array from `categories.customFields` schema.
4. Supports `format=json` and `format=xml`.

#### POST /open311/requests
1. System validates `api_key` against `clients.api_key` (hashed comparison).
2. If key is in OBSOLETE_API_KEYS list → return 200 with mobile-shutdown JSON payload (no ticket created).
3. If key invalid or missing → 403.
4. System resolves `service_code` to a category; validates category exists and is postable.
5. System creates or matches a `people` record from `first_name`, `last_name`, `email`, `phone`.
6. System creates ticket via same logic as F00 Create Ticket (steps 4–8).
7. Sets `tickets.client_id` to the authenticated client's id.
8. Returns array with single Open311 service request object containing `service_request_id` and `token` (same as id).
9. Appends "open" history entry with `enteredByPerson_id = null` (API-submitted).
10. Schedules digest notification (F16).

#### GET /open311/requests
1. Supports filter params: `service_request_id`, `service_code`, `status`, `start_date`, `end_date`, `lat`, `long`, `radius` (meters), `keyword`, `page`, `per_page` (default 50, max 200).
2. System builds query joining `tickets` with `categories`, `people`, `media`.
3. Returns array of Open311 request objects.
4. `status` filter maps: `open` → `tickets.status = 'open'`; `closed` → `tickets.status = 'closed'`.
5. Supports `format=json` and `format=xml`.

#### GET /open311/requests/{service_request_id}
1. System looks up ticket by id.
2. If not found → 404.
3. Returns array with single Open311 request object.
4. Includes `media_url` if ticket has attachments (first image URL).
5. Supports `format=json` and `format=xml`.

---

### Open311 Service Object Field Mapping (category → service)

| Open311 Field | uReport Source |
|---------------|---------------|
| service_code | categories.id |
| service_name | categories.name |
| description | categories.description |
| metadata | "true" if customFields non-empty, else "false" |
| type | "realtime" |
| keywords | categories.name |
| group | categoryGroups.name |

---

### Open311 Service Attributes (customFields → attributes)

Each key in `categories.customFields` maps to an Open311 attribute:

| Open311 Attribute Field | customFields Source |
|------------------------|-------------------|
| variable | true |
| code | field key |
| datatype | field type (string/number/singlevaluelist/multivaluelist/datetime) |
| required | field.required |
| description | field.label |
| order | field.order |
| values | field.options (for list types) |

---

### Open311 Request Object Field Mapping (ticket → request)

| Open311 Field | uReport Source |
|---------------|---------------|
| service_request_id | tickets.id |
| status | tickets.status |
| status_notes | substatus.name |
| service_name | categories.name |
| service_code | categories.id |
| description | tickets.description |
| agency_responsible | people.firstname + lastname (assignedPerson) |
| requested_datetime | tickets.enteredDate (ISO 8601) |
| updated_datetime | tickets.lastModified (ISO 8601) |
| expected_datetime | enteredDate + category.slaDays (ISO 8601, if slaDays set) |
| lat | tickets.latitude |
| long | tickets.longitude |
| address | tickets.location |
| address_id | tickets.addressId |
| zipcode | tickets.zip |
| media_url | First media URL if attachments exist |

---

### Inputs (POST /open311/requests)

- `api_key` (string, required): Client API key.
- `service_code` (string, required): Category ID.
- `lat` (decimal, optional): Latitude.
- `long` (decimal, optional): Longitude.
- `address_string` (string, optional): Street address.
- `address_id` (string, optional): Canonical address ID.
- `email` (string, optional): Reporter email.
- `device_id` (string, optional): Mobile device identifier (logged, not persisted).
- `account_id` (string, optional): External account identifier.
- `first_name` (string, optional): Reporter first name.
- `last_name` (string, optional): Reporter last name.
- `phone` (string, optional): Reporter phone.
- `description` (string, optional): Issue description.
- `media_url` (string, optional): URL of attached media (linked, not downloaded).
- `attribute[key]` (string, optional): Custom field values, one per attribute code.

---

### Outputs

- **GET /open311/services:** JSON array of service objects or XML `<services>` document.
- **POST /open311/requests:** JSON array `[{"service_request_id": "123", "service_notice": "", "account_id": ""}]` or XML equivalent.
- **GET /open311/requests:** JSON array of request objects or XML `<service_requests>` document.
- **GET /open311/requests/{id}:** JSON array (single element) or XML `<service_requests>` (single element).
- **GET /open311/discovery:** JSON discovery object or XML equivalent.
- **Obsolete key response:** `{"shutdown": true, "message": "<shutdown notice>"}` (200 OK).

---

### Validation Rules

- `api_key` on POST must match an active `clients.api_key` (stored hashed; compared via bcrypt).
- Obsolete API keys return shutdown notice before any other processing.
- `service_code` must reference a category with `active = true` and `postingPermissionLevel` that permits anonymous/public posting.
- `lat` must be [-90, 90]; `long` must be [-180, 180] if provided.
- At least one of `lat`+`long` or `address_string` should be provided (soft validation — system does not reject if missing, matching legacy behavior).
- `per_page` maximum is 200; minimum is 1.
- `start_date` and `end_date` must be ISO 8601 datetime strings if provided.
- `format` must be `json` or `xml`; defaults to `json`.
- XML output must use exact element names as defined in GeoReport v2 spec (byte-compatible).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Missing or invalid api_key | 403 | API_KEY_INVALID | "Invalid or missing api_key" |
| Obsolete api_key | 200 | — | Shutdown JSON payload |
| service_code not found | 404 | SERVICE_NOT_FOUND | "Service not found" |
| Category not postable (permission) | 403 | PERMISSION_DENIED | "Service does not allow public posting" |
| Invalid lat/long | 422 | INVALID_COORDINATES | "Invalid coordinates" |
| Invalid format param | 400 | INVALID_FORMAT | "Format must be json or xml" |
| service_request_id not found | 404 | REQUEST_NOT_FOUND | "Service request not found" |

---

### API Surface (this feature)

Full request/response schemas in `Y1b-api-tickets.md §Open311`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/open311/discovery` | none | Discovery metadata |
| GET | `/open311/services` | none | List all services |
| GET | `/open311/services/{service_code}` | none | Single service with attributes |
| POST | `/open311/requests` | api_key | Submit service request |
| GET | `/open311/requests` | none | List/filter service requests |
| GET | `/open311/requests/{service_request_id}` | none | Get single service request |

---

### Schema Surface (this feature)

Uses: `tickets`, `categories`, `categoryGroups`, `people`, `clients`, `media`, `substatus`. No new tables. See `Y0a-schema-core.md` and `Y0c-schema-categories.md`.
