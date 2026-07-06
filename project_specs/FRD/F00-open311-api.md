---

## F0: Open311 / GeoReport v2 API (Hard Constraint — Frozen)

**Priority:** P0 — Critical  
**Status:** Frozen contract — no path, HTTP method, query parameter, or response format may change.

### Description

The Open311 / GeoReport v2 REST API exposes four endpoints that external clients (mobile apps, municipal 311 aggregators) consume. This API is a hard frozen contract: the Spring Boot implementation must produce byte-level-compatible responses to the existing PHP implementation. Any divergence in field names, response structure, HTTP status codes, or content types constitutes a regression.

Content negotiation is performed via Accept header or format path suffix/query parameter: `.json`/`format=json` → `application/json`; `.xml`/`format=xml` → `application/xml`. HTML is served when Accept is `text/html` (legacy browser fallback only).

### Terminology

- **service_code** — The category ID used as the Open311 service identifier. Maps to `categories.id`.
- **service_request_id** — The ticket ID used as the Open311 request identifier. Maps to `tickets.id`.
- **jurisdiction_id** — Optional query parameter accepted but not required; used by multi-jurisdiction Open311 deployments.
- **api_key** — Required for POST /requests; validated against `clients.api_key`. Also accepted via `X-Api-Key` header.
- **OBSOLETE_API_KEYS** — Configurable list of deprecated API keys that trigger a mobile shutdown notice instead of the real service list. Preserved from existing PHP behavior.

### Sub-features

- `GET /open311/v2/services` — List all postable service categories
- `GET /open311/v2/services/{service_code}` — Get details for a single service
- `GET /open311/v2/requests` — Search/list service requests with filters
- `GET /open311/v2/requests/{service_request_id}` — Get a single service request by ID
- `POST /open311/v2/requests` — Submit a new service request
- Content negotiation: JSON, XML, HTML based on Accept header or format suffix
- API key validation for write operations
- Mobile shutdown notice for OBSOLETE_API_KEYS

---

### F0.1: GET /open311/v2/services

**Process:**
1. Parse `api_key` query parameter (or `X-Api-Key` header).
2. If `api_key` matches a value in the OBSOLETE_API_KEYS configuration list, return the mobile shutdown notice category list (three synthetic categories with instructional names).
3. Query `categories` where `active = true`.
4. Filter by `displayPermissionLevel` and `postingPermissionLevel` relative to the requesting person's session (unauthenticated → anonymous; authenticated staff → staff).
5. Serialize each category as a service object.
6. Return the list in the requested format (JSON array / XML `<services>` / HTML table).

**Inputs:**
- `api_key` [O] (string): Open311 client API key
- `jurisdiction_id` [O] (string): Accepted, ignored — single-jurisdiction deployment
- `service_code` [O] (string/integer): If provided, returns single service info (see F0.1b below)
- `format` [O] (string): `json` or `xml`; overrides Accept header

**Service Object Fields (JSON/XML):**

| Field | Type | Source | Notes |
|---|---|---|---|
| `service_code` | string | `categories.id` | |
| `service_name` | string | `categories.name` | |
| `description` | string | `categories.description` | |
| `metadata` | boolean | `false` | customFields reserved |
| `type` | string | `"realtime"` | Always realtime |
| `keywords` | string | `""` | Empty in current impl |
| `group` | string | `categoryGroups.name` | Category group name |

**Validation:**
- No required parameters for list endpoint.
- If `service_code` is provided and the category does not exist → 404.
- If `service_code` exists but `allowsPosting()` returns false for current person → 403.

**Error States:**

| Scenario | HTTP Status | Response |
|---|---|---|
| Unknown service_code | 404 | `{"errors":[{"code":"open311/unknownService","description":"Unknown service"}]}` |
| Not allowed to post | 403 | `{"errors":[{"code":"noAccessAllowed","description":"Forbidden"}]}` |

---

### F0.2: GET /open311/v2/requests

**Process:**
1. Parse filter parameters from query string.
2. Build ticket search criteria object from valid parameters.
3. Execute paginated `TicketTable.find()` query.
4. Serialize each ticket as a service request object.
5. If response format is HTML, also include pagination navigation block.

**Filter Parameters (Query String):**

| Parameter | Type | Maps To | Notes |
|---|---|---|---|
| `service_code` | integer | `tickets.category_id` | Category filter |
| `status` | string | `tickets.status` | `open` or `closed` |
| `start_date` | ISO 8601 | `tickets.enteredDate >=` | Date range start |
| `end_date` | ISO 8601 | `tickets.enteredDate <=` | Date range end |
| `updated_before` | ISO 8601 | `tickets.lastModified <=` | Last modified range |
| `updated_after` | ISO 8601 | `tickets.lastModified >=` | Last modified range |
| `bbox` | string | spatial filter | `lat_lo,lng_lo,lat_hi,lng_hi` |
| `page_size` | integer | LIMIT | Default 1000; zero treated as default |
| `page` | integer | OFFSET | One-based; page=0 treated as page=1 |

**Service Request Object Fields:**

| Field | Type | Source |
|---|---|---|
| `service_request_id` | string | `tickets.id` |
| `status` | string | `tickets.status` |
| `status_notes` | string | Latest action notes |
| `service_name` | string | `categories.name` |
| `service_code` | string | `tickets.category_id` |
| `description` | string | `tickets.description` |
| `agency_responsible` | string | `departments.name` |
| `service_notice` | string | `""` |
| `requested_datetime` | ISO 8601 | `tickets.enteredDate` |
| `updated_datetime` | ISO 8601 | `tickets.lastModified` |
| `expected_datetime` | ISO 8601 | `enteredDate + slaDays` or `null` |
| `address` | string | `tickets.location` |
| `address_id` | string | `tickets.addressId` |
| `zipcode` | string | `tickets.zip` |
| `lat` | float | `tickets.latitude` |
| `long` | float | `tickets.longitude` |
| `media_url` | string | URL of first media attachment or `""` |

**Validation:**
- `start_date` / `end_date` must parse as ISO 8601 datetime; if malformed, return 400.
- `page_size` must be a positive integer; 0 treated as default (1000).
- If `service_code` provided but unknown → 404.
- If `service_code` exists but `allowsDisplay()` returns false → 404 (per existing behavior).

**Error States:**

| Scenario | HTTP Status | Response |
|---|---|---|
| Unknown service_code | 404 | errors array |
| Malformed date parameter | 400 | errors array |
| Category not displayable | 404 | errors array |

---

### F0.3: POST /open311/v2/requests

**Process:**
1. Validate `api_key` parameter (query string or `X-Api-Key` header) against `clients.api_key`. If missing or invalid → 403.
2. Validate required fields: `service_code`, optionally `lat`+`long` or `address_string`.
3. Translate the Open311 POST field names to internal Ticket field names via `Open311Client.translatePostArray()`.
4. Create and persist a new `Ticket` record.
5. If `media` file is present in the multipart request, attach it to the new ticket (Media record created; file stored on disk). Media errors are silently swallowed — the ticket is still created.
6. Return a single-element service request object for the created ticket (same schema as GET /requests response).

**Inputs (multipart/form-data or application/x-www-form-urlencoded):**

| Field | Type | Required | Notes |
|---|---|---|---|
| `api_key` | string | [R] | Must match `clients.api_key` |
| `service_code` | integer | [R] | Category ID |
| `lat` | float | [O] | Latitude; required if no address_string |
| `long` | float | [O] | Longitude |
| `address_string` | string | [O] | Street address |
| `address_id` | integer | [O] | Address service ID |
| `email` | string | [O] | Reporter email |
| `first_name` | string | [O] | Reporter first name |
| `last_name` | string | [O] | Reporter last name |
| `phone` | string | [O] | Reporter phone |
| `description` | string | [O] | Issue description |
| `account_id` | string | [O] | Reporter account ID (mapped to person) |
| `media` | file | [O] | Photo attachment (multipart) |

**Field Mapping (Open311 → Internal):**

| Open311 Field | Internal Field |
|---|---|
| `service_code` | `category_id` |
| `lat` | `latitude` |
| `long` | `longitude` |
| `address_string` | `location` |
| `first_name` | `reportedByPerson.firstname` |
| `last_name` | `reportedByPerson.lastname` |
| `email` | `reportedByPerson.email` |
| `phone` | `reportedByPerson.phone` |
| `account_id` | `reportedByPerson_id` |

**Outputs:**
- HTTP 200 with service request object for the created ticket (wrapped in array for JSON: `[{...}]`)
- `service_request_id` contains the new ticket ID

**Validation:**
- `api_key` must match an existing `clients.api_key` → 403 if missing/invalid
- `service_code` must reference an existing, active category → 400 if unknown
- At least one of `lat`+`long` or `address_string` should be provided (soft validation; ticket can be created without location)
- Email format validated if provided

**Error States:**

| Scenario | HTTP Status | Error Code |
|---|---|---|
| Missing or invalid api_key | 403 | `clients/unknownClient` |
| Missing required field | 400 | `missingRequiredField` |
| Unknown service_code | 400 | `categories/unknownCategory` |
| Media upload failure | 200 | (silently ignored; ticket still created) |

---

### F0.4: GET /open311/v2/requests/{service_request_id}

**Process:**
1. Parse `service_request_id` from URL path.
2. Load `Ticket` by ID. If not found → 404.
3. Check `ticket.allowsDisplay(person)`. If denied → 403.
4. Serialize and return single service request object (same schema as GET /requests list item, wrapped in array).

**Inputs:**
- `service_request_id` [R] (integer): Ticket ID (URL path parameter)
- `format` [O] (string): `json` or `xml`

**Outputs:**
- HTTP 200 with single-element array containing the service request object
- Same field schema as GET /requests list items

**Error States:**

| Scenario | HTTP Status | Response |
|---|---|---|
| Ticket not found | 404 | errors array |
| Access denied | 403 | errors array |

---

### Content Negotiation Rules

The Spring Boot Open311 controller must implement the following negotiation logic:

1. Check URL path for format suffix: `.json` → force JSON; `.xml` → force XML.
2. Check `format` query parameter: `json` → JSON; `xml` → XML.
3. Check `Accept` header: `application/json` → JSON; `application/xml` → XML; `text/html` → HTML.
4. Default (no hint): JSON.

XML responses must use the GeoReport v2 XML element names. JSON responses must use snake_case field names as defined by GeoReport v2 spec.

---

### API Surface Summary

Full endpoint specifications are in `Y1-api.md` §Open311. The four endpoints are:

| Method | Path | Auth |
|---|---|---|
| GET | `/open311/v2/services` | None (api_key optional) |
| GET | `/open311/v2/services/{service_code}` | None |
| GET | `/open311/v2/requests` | None |
| GET | `/open311/v2/requests/{service_request_id}` | None |
| POST | `/open311/v2/requests` | api_key [R] |

### Schema Surface

- `tickets` — core request entity
- `categories` — service definitions
- `categoryGroups` — service groupings
- `departments` — agency responsible
- `clients` — API key registry
- `media` — photo attachments

See `Y0-schema.md` for full DDL.
