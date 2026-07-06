## Epic 0: Open311 / GeoReport v2 API (F0)

The Open311 / GeoReport v2 API is a hard frozen contract consumed by external mobile apps and 311 aggregators. The Spring Boot backend must produce byte-level-compatible responses to the existing PHP implementation.

---

### US-0.1: List Available Services
**As a** mobile app developer (external client), **I want to** call `GET /open311/v2/services` and receive the same response structure as the existing PHP implementation, **so that** my app can display the city's available service categories without modification.

**Acceptance Criteria:**
- [ ] `GET /open311/v2/services` returns all active categories as a JSON array by default
- [ ] Each service object includes: `service_code`, `service_name`, `description`, `metadata`, `type`, `keywords`, `group`
- [ ] `format=xml` query parameter returns valid GeoReport v2 XML `<services>` document
- [ ] `Accept: application/xml` header also triggers XML response
- [ ] When `api_key` matches an OBSOLETE_API_KEYS entry, the mobile shutdown notice category list is returned instead
- [ ] `jurisdiction_id` parameter is accepted and ignored (single-jurisdiction deployment)
- [ ] Response is identical in field names and structure to the PHP reference implementation

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.2: Retrieve Service Requests with Filters
**As a** 311 aggregator developer, **I want to** call `GET /open311/v2/requests` with filter parameters (status, service_code, date range), **so that** I can retrieve a filtered list of service requests for display in my application.

**Acceptance Criteria:**
- [ ] Accepts filter parameters: `service_code`, `status`, `start_date`, `end_date`, `updated_before`, `updated_after`, `bbox`, `page_size`, `page`
- [ ] Each service request object includes all GeoReport v2 fields: `service_request_id`, `status`, `status_notes`, `service_name`, `service_code`, `description`, `agency_responsible`, `requested_datetime`, `updated_datetime`, `expected_datetime`, `address`, `lat`, `long`, `media_url`
- [ ] Malformed ISO 8601 date parameters return HTTP 400 with errors array
- [ ] Unknown `service_code` returns HTTP 404 with errors array
- [ ] `page_size=0` defaults to 1000; `page=0` treated as `page=1`
- [ ] JSON and XML responses available via format negotiation
- [ ] Results are paginated and match PHP implementation behavior

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.3: Submit a New Service Request via Open311
**As a** mobile app user, **I want to** submit a service request via `POST /open311/v2/requests` with my API key, **so that** I can report a civic issue through a third-party app and receive a case ID back.

**Acceptance Criteria:**
- [ ] `POST /open311/v2/requests` requires a valid `api_key` (query param or `X-Api-Key` header); missing/invalid key returns HTTP 403
- [ ] Required field `service_code` must reference an active category; unknown code returns HTTP 400
- [ ] Accepts optional fields: `lat`, `long`, `address_string`, `email`, `first_name`, `last_name`, `phone`, `description`, `account_id`, `media` (multipart)
- [ ] Open311 field names are mapped to internal ticket fields (`service_code` → `category_id`, `address_string` → `location`, etc.)
- [ ] Returns HTTP 200 with a single-element array containing the created service request object
- [ ] `service_request_id` in response contains the new ticket ID
- [ ] Media upload failure is silently ignored — ticket is still created and returned
- [ ] Email format is validated if provided

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.4: Retrieve a Single Service Request by ID
**As a** mobile app developer, **I want to** call `GET /open311/v2/requests/{service_request_id}`, **so that** I can show a constituent the current status of their specific report.

**Acceptance Criteria:**
- [ ] Returns HTTP 200 with a single-element array containing the service request object
- [ ] Response field schema matches `GET /open311/v2/requests` list items exactly
- [ ] Non-existent ticket ID returns HTTP 404 with errors array
- [ ] Ticket with `allowsDisplay() = false` for the requesting context returns HTTP 403
- [ ] Format negotiation (JSON/XML) works identically to other Open311 endpoints
- [ ] Response is byte-level compatible with PHP implementation for same ticket ID

**Priority:** P0 | **Feature Ref:** F0

---
