---
phase: implement-the-full-ureport-modernization
plan: "03"
subsystem: open311-api, fts-search, multi-format-output
tags: [open311, georeport-v2, full-text-search, postgresql-fts, csv-export, xml-serialization, format-filter]
dependency_graph:
  requires:
    - "01-PLAN.md: DB schema (tickets.search_vector GIN index, clients.api_key_lookup, categories, media)"
    - "02-PLAN.md: Ticket entity, TicketRepository, SecurityConfig, ApiKeyAuthenticationFilter, ApiKeyPrincipal"
  provides:
    - "Open311MappingService: toService(Category), toServiceRequest(Ticket)"
    - "Open311XmlSerializer: serializeServices, serializeRequests, serializeDiscovery, serializePostResponse"
    - "FormatFilter: ?format= → Content-Type negotiation + responseFormat request attribute"
    - "TicketSearchService: FTS via websearch_to_tsquery, ST_DWithin geo filter, dynamic SQL"
    - "TicketSearchController: GET /api/v1/tickets, /export (staff), /map"
    - "CsvExportUtil: StreamingResponseBody CSV writer"
  affects:
    - "Wave 3a frontend (TicketListPage, TicketMapPage, Open311 consumers)"
tech_stack:
  added:
    - "Apache Commons CSV 1.11.0 (StreamingResponseBody CSV export)"
  patterns:
    - "Manual StringBuilder XML serializer (GeoReport v2 byte-compatible, no JAXB)"
    - "JdbcTemplate dynamic SQL (FTS + geo + 15+ filters)"
    - "OncePerRequestFilter for content negotiation (FormatFilter)"
    - "SHA-256 lookup + BCrypt verify for api_key authentication"
key_files:
  created:
    - api/src/main/java/com/ureport/controller/open311/Open311DiscoveryController.java
    - api/src/main/java/com/ureport/controller/open311/Open311ServicesController.java
    - api/src/main/java/com/ureport/controller/open311/Open311RequestsController.java
    - api/src/main/java/com/ureport/service/Open311MappingService.java
    - api/src/main/java/com/ureport/service/Open311XmlSerializer.java
    - api/src/main/java/com/ureport/dto/response/Open311ServiceResponse.java
    - api/src/main/java/com/ureport/dto/response/Open311ServiceAttributeResponse.java
    - api/src/main/java/com/ureport/dto/response/Open311RequestResponse.java
    - api/src/main/java/com/ureport/dto/response/Open311PostResponse.java
    - api/src/main/java/com/ureport/repository/CategoryGroupRepository.java
    - api/src/main/java/com/ureport/filter/FormatFilter.java
    - api/src/main/java/com/ureport/util/CsvExportUtil.java
    - api/src/main/java/com/ureport/controller/TicketSearchController.java
    - api/src/main/java/com/ureport/service/TicketSearchService.java
    - api/src/main/java/com/ureport/dto/request/TicketSearchParams.java
    - api/src/main/java/com/ureport/dto/response/TicketSummaryResponse.java
    - api/src/main/java/com/ureport/dto/response/MapViewResponse.java
    - api/src/test/java/com/ureport/Open311IntegrationTest.java
    - api/src/test/java/com/ureport/TicketSearchServiceTest.java
  modified:
    - api/src/main/java/com/ureport/security/ApiKeyAuthenticationFilter.java
    - api/src/main/java/com/ureport/config/WebMvcConfig.java
    - api/pom.xml
decisions:
  - "Used manual StringBuilder XML serializer (not JAXB) for byte-compatible GeoReport v2 output matching legacy PHP"
  - "Used JdbcTemplate (not Spring Data JPA) for TicketSearchService to support dynamic SQL with FTS + geo + multi-param filters"
  - "Obsolete api_key handling split across filter (sets request attribute) and controller (returns shutdown payload) to allow GET requests to bypass api_key check"
  - "ALLOWED_SORT_COLUMNS whitelist in TicketSearchService prevents SQL injection via sortBy param"
  - "Added Apache Commons CSV 1.11.0 dependency for streaming CSV export"
metrics:
  completed_date: "2026-06-24"
  tasks: 2
  files_created: 19
  files_modified: 3
---

# Phase implement-the-full-ureport-modernization Plan 03: Open311 GeoReport v2 API + FTS + Multi-format Output Summary

## One-liner

GeoReport v2 Open311 API (6 endpoints, JSON+XML) with manual StringBuilder XML serializer, PostgreSQL FTS via websearch_to_tsquery, JdbcTemplate dynamic ticket search with geo/multi-filter, and StreamingResponseBody CSV export.

## What Was Built

### Task 1: Open311 GeoReport v2 API

**6 Endpoints implemented:**
- `GET /open311/discovery` — endpoint descriptor with JSON and XML support
- `GET /open311/services` — active public categories as Open311 service objects
- `GET /open311/services/{service_code}` — single service detail with custom field attributes
- `POST /open311/requests` — create service request with api_key auth + obsolete key detection
- `GET /open311/requests` — list/filter requests with status, date, page params
- `GET /open311/requests/{id}` — single request as GeoReport v2 single-element array

**Open311MappingService:**
- `toService(Category, CategoryGroup)` — maps category + group to Open311ServiceResponse with custom field attributes
- `toServiceRequest(Ticket, Category, Substatus, Person, Media)` — full GeoReport v2 field mapping with ISO 8601 datetimes, SLA-based expected_datetime, media_url

**Open311XmlSerializer (manual StringBuilder, no JAXB):**
- `serializeServices()` — `<?xml version="1.0" encoding="utf-8"?>` + `<services>` root with attributes
- `serializeRequests()` — `<service_requests>` root with all 16 GeoReport v2 fields
- `serializeDiscovery()` — `<discovery>` with endpoints
- `serializePostResponse()` — POST response in service_requests format
- XML escaping of `&`, `<`, `>`, `"`, `'` characters
- Null elements omitted (no empty tags)

**DTOs with exact GeoReport v2 field names:**
- `Open311RequestResponse` — `@JsonProperty("long")` for Java `lng` field (Java keyword avoidance)
- `Open311PostResponse` — `service_request_id`, `service_notice`, `account_id` (empty strings by default)

**api_key authentication (ApiKeyAuthenticationFilter fixed):**
- Only intercepts `POST /open311/requests` (GET endpoints are public)
- Checks obsolete keys first; sets `request.setAttribute("obsoleteApiKey", true)` — controller returns shutdown payload
- SHA-256 hash → `clients.api_key_lookup` lookup → BCrypt verify against `clients.api_key_hash`
- Returns 403 JSON for invalid/missing keys

### Task 2: Multi-format Output + Full-text Search

**FormatFilter (OncePerRequestFilter):**
- Reads `?format=` query param
- Sets `request.setAttribute("responseFormat", format)` for controllers
- Pre-sets Content-Type: `application/xml`, `text/csv`, or `text/html` for xml/csv/print
- Registered via WebMvcConfig for `/open311/*`, `/api/v1/tickets/export`, `/api/v1/tickets/map`

**WebMvcConfig (updated):**
- CORS for `/api/v1/**` (configured allowed origins, credentials=true)
- CORS for `/open311/**` (all origins, GET+POST only — public API)
- FormatFilter registration at `HIGHEST_PRECEDENCE + 10`

**CsvExportUtil:**
- `streamTicketsCsv(List<TicketSummaryResponse>)` returns `StreamingResponseBody`
- Apache Commons CSV `CSVPrinter` with 14-field header row
- UTF-8 encoding, streaming prevents OOM on large exports

**TicketSearchService (JdbcTemplate dynamic SQL):**
- `search(params)` — paginated `Page<TicketSummaryResponse>` (default 25/page)
- `searchForExport(params)` — unpaginated `List<TicketSummaryResponse>` (no LIMIT)
- `searchForMap(params, zoomLevel)` — geo-clusters via ticket_geodata + geoclusters JOINs
- FTS: `WHERE t.search_vector @@ websearch_to_tsquery('english', ?)` with ts_rank ORDER BY when q present
- Geo filter: `AND ST_DWithin(t.geo_point, ST_MakePoint(lon, lat)::geography, radius_meters)`
- 22 filter params: q, categoryId, departmentId, assignedPersonId, status, substatusId, contactMethodId, clientId, issueTypeId, enteredDateFrom/To, closedDateFrom/To, city, zip, lat/lon/radius
- `ALLOWED_SORT_COLUMNS` whitelist prevents SQL injection via sortBy param
- Map view: zoom level 0-6 mapped to `cluster_id_{N}` column in ticket_geodata

**TicketSearchController:**
- `GET /api/v1/tickets` — `@ModelAttribute TicketSearchParams` bound from query params
- `GET /api/v1/tickets/export` — `@PreAuthorize("hasRole('STAFF')")`, streams CSV or JSON
- `GET /api/v1/tickets/map` — `?zoom=N` param (default 3), returns MapViewResponse

## Test Coverage

**Open311IntegrationTest (8 tests):**
1. `GET /open311/services` returns JSON array (200)
2. `GET /open311/services?format=xml` returns `application/xml` with `<?xml` + `<services>` root
3. `GET /open311/requests/999999999` returns 404 + `{"error":"REQUEST_NOT_FOUND"}`
4. `POST /open311/requests` with invalid api_key returns 403
5. `GET /open311/services?format=xml` contains `<services>` element
6. `GET /open311/discovery` returns changeset + endpoints fields
7. `GET /open311/discovery?format=xml` returns XML with `<discovery>` root
8. XML serializer produces all GeoReport v2 required elements (unit test of serializer)

**TicketSearchServiceTest (8 tests):**
1. `search()` with no params returns paginated result (empty DB OK)
2. `search()` with `q="pothole"` executes websearch_to_tsquery SQL without error
3. `search()` with `status="open"` adds status filter
4. `search()` with lat/lon/radius adds ST_DWithin geo filter
5. `search()` with SQL injection in sortBy falls back to safe default
6. `searchForExport()` ignores pagination limit
7. `search()` with multiple combined filters executes without error
8. Default pagination params (page=1, limit=25) applied correctly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ApiKeyAuthenticationFilter to support obsolete key detection and GET requests**
- **Found during:** Task 1
- **Issue:** Filter blocked ALL `/open311/requests` URIs (GET + POST) and had no obsolete key handling. Controller checked `request.getAttribute("obsoleteApiKey")` but filter never set it — obsolete keys would hit "invalid" branch and return 403 instead of the 200 shutdown payload.
- **Fix:** Filter now only intercepts `POST /open311/requests` (GET requests pass through). Obsolete key check runs first — sets `request.setAttribute("obsoleteApiKey", true)` and authenticates as `ApiKeyPrincipal(-1)` to let the request reach the controller. Controller then returns `{shutdown: true, message: ...}`.
- **Files modified:** `api/src/main/java/com/ureport/security/ApiKeyAuthenticationFilter.java`
- **Commit:** 5bfca69

**2. [Rule 3 - Blocking] Added CategoryGroupRepository (missing dependency for Open311ServicesController)**
- **Found during:** Task 1
- **Issue:** `Open311ServicesController` imported and used `CategoryGroupRepository` but the repository class didn't exist.
- **Fix:** Created `CategoryGroupRepository extends JpaRepository<CategoryGroup, Integer>`.
- **Files modified:** `api/src/main/java/com/ureport/repository/CategoryGroupRepository.java` (new)
- **Commit:** 5bfca69

**3. [Rule 3 - Blocking] Added Apache Commons CSV dependency to pom.xml**
- **Found during:** Task 2
- **Issue:** `CsvExportUtil` requires `org.apache.commons.csv.CSVPrinter` but the dependency was absent from `pom.xml`.
- **Fix:** Added `org.apache.commons:commons-csv:1.11.0` to pom.xml.
- **Files modified:** `api/pom.xml`
- **Commit:** f6a8d8f

## Self-Check: PASSED

Files verified to exist:
- ✅ `api/src/main/java/com/ureport/controller/open311/Open311DiscoveryController.java`
- ✅ `api/src/main/java/com/ureport/controller/open311/Open311ServicesController.java`
- ✅ `api/src/main/java/com/ureport/controller/open311/Open311RequestsController.java`
- ✅ `api/src/main/java/com/ureport/service/Open311MappingService.java`
- ✅ `api/src/main/java/com/ureport/service/Open311XmlSerializer.java`
- ✅ `api/src/main/java/com/ureport/dto/response/Open311RequestResponse.java` (with `@JsonProperty("long")`)
- ✅ `api/src/main/java/com/ureport/filter/FormatFilter.java`
- ✅ `api/src/main/java/com/ureport/config/WebMvcConfig.java` (updated with FormatFilter registration)
- ✅ `api/src/main/java/com/ureport/util/CsvExportUtil.java`
- ✅ `api/src/main/java/com/ureport/service/TicketSearchService.java`
- ✅ `api/src/main/java/com/ureport/controller/TicketSearchController.java`
- ✅ `api/src/main/java/com/ureport/dto/request/TicketSearchParams.java`
- ✅ `api/src/main/java/com/ureport/dto/response/TicketSummaryResponse.java`
- ✅ `api/src/main/java/com/ureport/dto/response/MapViewResponse.java`
- ✅ `api/src/test/java/com/ureport/Open311IntegrationTest.java`
- ✅ `api/src/test/java/com/ureport/TicketSearchServiceTest.java`

Commits verified:
- ✅ 5bfca69: Task 1 — Open311 GeoReport v2 API
- ✅ f6a8d8f: Task 2 — Multi-format output + FTS
