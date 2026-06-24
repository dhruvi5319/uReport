---
phase: implement-the-full-ureport-modernization
plan: "03"
type: execute
wave: 2b
depends_on: [1, 2]
files_modified:
  - api/src/main/java/com/ureport/controller/open311/Open311DiscoveryController.java
  - api/src/main/java/com/ureport/controller/open311/Open311ServicesController.java
  - api/src/main/java/com/ureport/controller/open311/Open311RequestsController.java
  - api/src/main/java/com/ureport/service/Open311MappingService.java
  - api/src/main/java/com/ureport/service/Open311XmlSerializer.java
  - api/src/main/java/com/ureport/dto/response/Open311ServiceResponse.java
  - api/src/main/java/com/ureport/dto/response/Open311RequestResponse.java
  - api/src/main/java/com/ureport/dto/response/Open311PostResponse.java
  - api/src/main/java/com/ureport/config/WebMvcConfig.java
  - api/src/main/java/com/ureport/filter/FormatFilter.java
  - api/src/main/java/com/ureport/util/CsvExportUtil.java
  - api/src/main/java/com/ureport/controller/TicketSearchController.java
  - api/src/main/java/com/ureport/service/TicketSearchService.java
  - api/src/main/java/com/ureport/dto/request/TicketSearchParams.java
  - api/src/main/java/com/ureport/dto/response/TicketSummaryResponse.java
  - api/src/main/java/com/ureport/dto/response/MapViewResponse.java
  - api/src/test/java/com/ureport/Open311IntegrationTest.java
  - api/src/test/java/com/ureport/TicketSearchServiceTest.java
autonomous: true

features:
  implements: ["F2", "F11", "F18"]
  depends_on: ["F0", "F1", "F3", "F4"]
  enables: ["F2", "F11", "F18"]

must_haves:
  truths:
    - "GET /open311/services returns JSON array with service_code, service_name, metadata, type, keywords, group fields"
    - "GET /open311/services?format=xml returns valid GeoReport v2 XML with <?xml version=\"1.0\" encoding=\"utf-8\"?> declaration"
    - "GET /open311/requests/{id} returns the Open311 request object including status_notes, agency_responsible, requested_datetime, updated_datetime, expected_datetime, media_url"
    - "POST /open311/requests validates api_key via SHA-256 lookup + BCrypt verify, creates ticket, returns [{service_request_id, service_notice, account_id}]"
    - "Obsolete api_key returns 200 {shutdown: true, message: ...} without creating any ticket"
    - "GET /api/v1/tickets?q=pothole returns FTS results using websearch_to_tsquery against search_vector GIN index"
    - "GET /api/v1/tickets supports all filter params: category_id, department_id, assignedPerson_id, status, substatus_id, enteredDate range, lat+long+radius"
    - "GET /api/v1/tickets/export?format=csv (staff) returns StreamingResponseBody CSV without OOM"
    - "?format=xml on Open311 endpoints sets Content-Type: application/xml and FormatFilter is applied"
    - "?format=csv on /api/v1/tickets/export returns text/csv with header row"
  artifacts:
    - path: "api/src/main/java/com/ureport/controller/open311/Open311RequestsController.java"
      provides: "POST /open311/requests, GET /open311/requests, GET /open311/requests/{id}"
      exports: ["Open311RequestsController"]
    - path: "api/src/main/java/com/ureport/service/Open311MappingService.java"
      provides: "Ticket-to-Open311 field mapping"
      exports: ["Open311MappingService"]
    - path: "api/src/main/java/com/ureport/service/Open311XmlSerializer.java"
      provides: "Byte-compatible GeoReport v2 XML serialization"
      exports: ["Open311XmlSerializer"]
    - path: "api/src/main/java/com/ureport/filter/FormatFilter.java"
      provides: "?format= param → Content-Type negotiation"
      exports: ["FormatFilter"]
    - path: "api/src/main/java/com/ureport/service/TicketSearchService.java"
      provides: "FTS keyword + multi-field filter + pagination + map view + CSV export"
      exports: ["TicketSearchService"]
    - path: "api/src/main/java/com/ureport/controller/TicketSearchController.java"
      provides: "GET /api/v1/tickets, GET /api/v1/tickets/export, GET /api/v1/tickets/map"
      exports: ["TicketSearchController"]
    - path: "api/src/main/java/com/ureport/util/CsvExportUtil.java"
      provides: "StreamingResponseBody CSV writer"
      exports: ["CsvExportUtil"]
  key_links:
    - from: "Open311RequestsController"
      to: "Open311MappingService.toServiceRequest(Ticket)"
      via: "service injection"
      pattern: "Open311MappingService.*toServiceRequest"
    - from: "Open311RequestsController"
      to: "Open311XmlSerializer.serialize(List<Open311RequestResponse>)"
      via: "FormatFilter sets format=xml, controller calls serializer"
      pattern: "Open311XmlSerializer.*serialize"
    - from: "TicketSearchController"
      to: "TicketSearchService.search(TicketSearchParams)"
      via: "service injection"
      pattern: "TicketSearchService.*search"
    - from: "TicketSearchService"
      to: "tickets.search_vector @@ websearch_to_tsquery"
      via: "JPA native query / JdbcTemplate"
      pattern: "websearch_to_tsquery"
    - from: "Open311RequestsController.createRequest"
      to: "ClientRepository.findByApiKeyLookup(sha256Hash)"
      via: "ApiKeyAuthenticationFilter sets ApiKeyPrincipal OR controller validates inline"
      pattern: "api_key_lookup"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "db/init/02-schema.sql"
      exports: ["tickets", "categories", "categoryGroups", "clients", "people", "media", "substatus"]
      verify: "grep -n 'CREATE TABLE tickets' db/init/02-schema.sql && grep -n 'search_vector' db/init/02-schema.sql && grep -n 'api_key_lookup' db/init/02-schema.sql && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "api/src/main/java/com/ureport/entity/Ticket.java"
      exports: ["Ticket", "TicketRepository", "SecurityConfig", "JwtAuthenticationFilter", "ApiKeyAuthenticationFilter", "ApiKeyPrincipal"]
      verify: "grep -rn 'class Ticket' api/src/main/java/com/ureport/entity/ && grep -rn 'ApiKeyPrincipal' api/src/main/java/com/ureport/security/ && echo CONTRACT_OK"
  provides:
    - artifact: "api/src/main/java/com/ureport/service/Open311MappingService.java"
      exports: ["Open311MappingService", "toService(Category)", "toServiceRequest(Ticket)"]
      shape: |
        Open311MappingService.toService(Category c): Open311ServiceResponse
          - service_code = String.valueOf(c.getId())
          - service_name = c.getName()
          - description = c.getDescription()
          - metadata = c.getCustomFields() != null && !c.getCustomFields().isEmpty() ? "true" : "false"
          - type = "realtime"
          - keywords = c.getName()
          - group = categoryGroup.getName() (nullable)
          - attributes = customFields map to Open311ServiceAttribute list (variable=true, code=key, datatype, required, description, order, values)

        Open311MappingService.toServiceRequest(Ticket t, Category c, Substatus s, Person assigned, Media firstMedia): Open311RequestResponse
          - service_request_id = String.valueOf(t.getId())
          - status = t.getStatus()
          - status_notes = s != null ? s.getName() : null
          - service_name = c.getName()
          - service_code = String.valueOf(c.getId())
          - description = t.getDescription()
          - agency_responsible = assigned != null ? assigned.getFirstname() + " " + assigned.getLastname() : null
          - requested_datetime = ISO 8601 of t.getEnteredDate()
          - updated_datetime = ISO 8601 of t.getLastModified()
          - expected_datetime = c.getSlaDays() != null ? ISO 8601 of enteredDate + slaDays : null
          - lat = t.getLatitude() != null ? t.getLatitude().toPlainString() : null
          - long = t.getLongitude() != null ? t.getLongitude().toPlainString() : null
          - address = t.getLocation()
          - address_id = t.getAddressId() != null ? String.valueOf(t.getAddressId()) : null
          - zipcode = t.getZip()
          - media_url = firstMedia != null ? "/api/v1/media/" + firstMedia.getInternalFilename() : null
      verify: "grep -n 'class Open311MappingService' api/src/main/java/com/ureport/service/Open311MappingService.java && grep -n 'toServiceRequest' api/src/main/java/com/ureport/service/Open311MappingService.java && echo CONTRACT_OK"
    - artifact: "api/src/main/java/com/ureport/service/Open311XmlSerializer.java"
      exports: ["Open311XmlSerializer", "serializeServices(List<Open311ServiceResponse>)", "serializeRequests(List<Open311RequestResponse>)"]
      shape: |
        Produces XML with:
          <?xml version="1.0" encoding="utf-8"?>
          <services> ... <service> ... </service> </services>
          <?xml version="1.0" encoding="utf-8"?>
          <service_requests> ... <request> ... </request> </service_requests>
        No JAXB. Manual StringBuilder writer. Text-only elements (no attributes).
        Element names match GeoReport v2 spec exactly.
      verify: "grep -n 'class Open311XmlSerializer' api/src/main/java/com/ureport/service/Open311XmlSerializer.java && grep -n 'service_requests' api/src/main/java/com/ureport/service/Open311XmlSerializer.java && echo CONTRACT_OK"
    - artifact: "api/src/main/java/com/ureport/filter/FormatFilter.java"
      exports: ["FormatFilter"]
      shape: |
        OncePerRequestFilter. Reads ?format= param. If format=xml: sets response Content-Type=application/xml.
        If format=csv: sets Content-Type=text/csv. Passes format value in request attribute "responseFormat".
      verify: "grep -n 'class FormatFilter' api/src/main/java/com/ureport/filter/FormatFilter.java && grep -n 'responseFormat' api/src/main/java/com/ureport/filter/FormatFilter.java && echo CONTRACT_OK"
    - artifact: "api/src/main/java/com/ureport/service/TicketSearchService.java"
      exports: ["TicketSearchService", "search(TicketSearchParams)", "searchForExport(TicketSearchParams)", "searchForMap(TicketSearchParams, int)"]
      shape: |
        search(params): Page<TicketSummaryResponse>  — paginated, 25 default
        searchForExport(params): List<TicketSummaryResponse>  — unpaginated, staff only
        searchForMap(params, zoomLevel): MapViewResponse  — clusters from ticket_geodata JOIN geoclusters
        FTS query: WHERE t.search_vector @@ websearch_to_tsquery('english', ?)
        Geo filter: AND ST_DWithin(t.geo_point, ST_MakePoint(?, ?)::geography, ?)
        Sort: ts_rank DESC when q present, otherwise enteredDate DESC
      verify: "grep -n 'class TicketSearchService' api/src/main/java/com/ureport/service/TicketSearchService.java && grep -n 'websearch_to_tsquery' api/src/main/java/com/ureport/service/TicketSearchService.java && echo CONTRACT_OK"
    - artifact: "api/src/main/java/com/ureport/controller/TicketSearchController.java"
      exports: ["TicketSearchController", "GET /api/v1/tickets", "GET /api/v1/tickets/export", "GET /api/v1/tickets/map"]
      shape: |
        GET /api/v1/tickets — paginated search; any authenticated user (per category displayPermissionLevel)
        GET /api/v1/tickets/export — staff only; streams CSV or print HTML based on ?format=
        GET /api/v1/tickets/map — geo-cluster view; ?zoom=N (0-6); returns MapViewResponse
      verify: "grep -n 'class TicketSearchController' api/src/main/java/com/ureport/controller/TicketSearchController.java && grep -n '/api/v1/tickets' api/src/main/java/com/ureport/controller/TicketSearchController.java && echo CONTRACT_OK"
    - artifact: "api/src/main/java/com/ureport/util/CsvExportUtil.java"
      exports: ["CsvExportUtil", "streamTicketsCsv(List<TicketSummaryResponse>, OutputStream)"]
      shape: |
        Uses StreamingResponseBody. Header row: id,status,category,description,location,city,enteredDate,lastModified,assignedPerson
        One row per ticket. Apache Commons CSV format.
      verify: "grep -n 'class CsvExportUtil' api/src/main/java/com/ureport/util/CsvExportUtil.java && grep -n 'StreamingResponseBody' api/src/main/java/com/ureport/util/CsvExportUtil.java && echo CONTRACT_OK"
---

<objective>
Implement the three P0 cross-cutting backend features for Wave 2b: Open311 GeoReport v2 API
(F2), Multi-format output (F18), and Full-Text Search (F11).

Purpose: These three features together form the primary external-facing API surface and the
core ticket discovery mechanism. Open311 external consumers cannot function without F2+F18.
The ticket list workflow is impossible without F11. Wave 3a (frontend SPA) directly depends
on all three being available.

Output:
- Open311 controllers (discovery, services, requests) with byte-compatible JSON + XML
- Open311MappingService (field mapping) + Open311XmlSerializer (manual XML writer)
- FormatFilter + WebMvcConfig for content negotiation
- CsvExportUtil for StreamingResponseBody CSV export
- TicketSearchController + TicketSearchService with FTS, multi-field filters, map view, CSV export
- Integration tests for Open311 endpoints and TicketSearchService
</objective>

<feature_dependencies>
Implements: F2: Open311 GeoReport v2 REST API — all 6 endpoints with JSON+XML, api_key
  validation, obsolete key detection, field mapping from tickets/categories/people/media/substatus
F18: Multi-Format Output Feeds — FormatFilter, WebMvcConfig content negotiation,
  CsvExportUtil (StreamingResponseBody), Open311XmlSerializer (byte-compatible GeoReport v2 XML)
F11: Full-Text Search (PostgreSQL FTS replacing Solr) — TicketSearchService with
  websearch_to_tsquery GIN index queries, all filter fields, pagination, map view, CSV export

Depends on: F0 (Ticket entity + TicketRepository from Wave 2a),
  F1 (TicketHistory entity from Wave 2a),
  F3 (SecurityConfig, RBAC guards, @PreAuthorize from Wave 2a),
  F4 (JWT filter chain, ApiKeyAuthenticationFilter, ApiKeyPrincipal from Wave 2a),
  DB schema Wave 1 (tickets.search_vector GIN index, clients.api_key_lookup, categories, media)

Enables: F2: Open311 API available to external consumers immediately after Wave 2b
  F11: Frontend ticket search (Wave 3a TicketListPage, TicketMapPage)
  F18: CSV export controls in Wave 3a; Open311 XML consumers unblocked
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/implement-the-full-ureport-modernization/WAVE-SCHEDULE.md
@project_specs/TechArch-uReport.md   (Sections 01–04 and 06: Component architecture, API spec, Security, Search)
@project_specs/FRD-uReport.md        (F02 — Open311, F11 — FTS, F18 — Multi-format)
@project_specs/PRD-uReport.md        (F2, F11, F18 feature descriptions and capabilities)
@.planning/express/implement-the-full-ureport-modernization/01-PLAN.md  (DB schema contracts — search_vector, api_key_lookup)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Open311 GeoReport v2 API — controllers, mapping service, XML serializer, DTOs</name>
  <files>
    api/src/main/java/com/ureport/controller/open311/Open311DiscoveryController.java
    api/src/main/java/com/ureport/controller/open311/Open311ServicesController.java
    api/src/main/java/com/ureport/controller/open311/Open311RequestsController.java
    api/src/main/java/com/ureport/service/Open311MappingService.java
    api/src/main/java/com/ureport/service/Open311XmlSerializer.java
    api/src/main/java/com/ureport/dto/response/Open311ServiceResponse.java
    api/src/main/java/com/ureport/dto/response/Open311RequestResponse.java
    api/src/main/java/com/ureport/dto/response/Open311PostResponse.java
    api/src/test/java/com/ureport/Open311IntegrationTest.java
  </files>
  <action>
Implement the full Open311 GeoReport v2 API. All six endpoints must be byte-compatible with
the legacy PHP output. The `Open311XmlSerializer` must use a manual XML writer (NOT JAXB)
to exactly match element names. Field names in JSON must match GeoReport v2 spec exactly
(use Jackson @JsonProperty annotations where field names use underscores).

---

### DTOs (exact field names — byte-compatible with GeoReport v2)

**Open311ServiceResponse.java** (`@JsonProperty` annotations required for underscore fields):
```java
public class Open311ServiceResponse {
    @JsonProperty("service_code")   String serviceCode;
    @JsonProperty("service_name")   String serviceName;
    String description;
    String metadata;       // "true" or "false" — string, not boolean
    String type;           // always "realtime"
    String keywords;
    String group;          // nullable
    @JsonInclude(JsonInclude.Include.NON_NULL)
    List<Open311ServiceAttributeResponse> attributes;
}

public class Open311ServiceAttributeResponse {
    boolean variable;
    String code;
    String datatype;
    boolean required;
    String description;
    int order;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    List<Map<String,String>> values;  // [{key, name}] for list types
}
```

**Open311RequestResponse.java** (all underscore field names via @JsonProperty):
```java
public class Open311RequestResponse {
    @JsonProperty("service_request_id")  String serviceRequestId;
    String status;
    @JsonProperty("status_notes")        String statusNotes;
    @JsonProperty("service_name")        String serviceName;
    @JsonProperty("service_code")        String serviceCode;
    String description;
    @JsonProperty("agency_responsible")  String agencyResponsible;
    @JsonProperty("requested_datetime")  String requestedDatetime;
    @JsonProperty("updated_datetime")    String updatedDatetime;
    @JsonProperty("expected_datetime")   String expectedDatetime;
    String lat;
    @JsonProperty("long")                String lng;  // Java field != JSON field
    String address;
    @JsonProperty("address_id")          String addressId;
    String zipcode;
    @JsonProperty("media_url")           String mediaUrl;
}
```

**Open311PostResponse.java**:
```java
public class Open311PostResponse {
    @JsonProperty("service_request_id")  String serviceRequestId;
    @JsonProperty("service_notice")      String serviceNotice;   // "" by default
    @JsonProperty("account_id")          String accountId;       // "" by default
}
```

---

### Open311MappingService.java

`@Service` class with two primary methods:

**toService(Category category, CategoryGroup group):**
- `service_code` = `String.valueOf(category.getId())`
- `service_name` = `category.getName()`
- `description` = `category.getDescription()` (may be null)
- `metadata` = `category.getCustomFields() != null && !category.getCustomFields().isEmpty() ? "true" : "false"`
- `type` = `"realtime"` (always)
- `keywords` = `category.getName()`
- `group` = `group != null ? group.getName() : null`
- `attributes` = if customFields non-null: iterate JSONB keys, map each to `Open311ServiceAttributeResponse`:
  - `variable = true`
  - `code` = field key
  - `datatype` = field type from schema (string/number/singlevaluelist/multivaluelist/datetime)
  - `required` = field.required
  - `description` = field.label
  - `order` = field.order
  - `values` = field.options mapped to [{key: opt, name: opt}] for list types

**toServiceRequest(Ticket ticket, Category category, Substatus substatus, Person assignedPerson, Media firstMedia):**
Exact field mapping per FRD F02 and TechArch Section 06:
- `service_request_id` = `String.valueOf(ticket.getId())`
- `status` = `ticket.getStatus()`
- `status_notes` = `substatus != null ? substatus.getName() : null`
- `service_name` = `category.getName()`
- `service_code` = `String.valueOf(category.getId())`
- `description` = `ticket.getDescription()`
- `agency_responsible` = `assignedPerson != null ? assignedPerson.getFirstname() + " " + assignedPerson.getLastname() : null`
- `requested_datetime` = ISO 8601 of `ticket.getEnteredDate()` (use `DateTimeFormatter.ISO_OFFSET_DATE_TIME`)
- `updated_datetime` = ISO 8601 of `ticket.getLastModified()`
- `expected_datetime` = if `category.getSlaDays() != null`: ISO 8601 of `ticket.getEnteredDate().plusDays(category.getSlaDays())`, else null
- `lat` = `ticket.getLatitude() != null ? ticket.getLatitude().toPlainString() : null`
- `long` = `ticket.getLongitude() != null ? ticket.getLongitude().toPlainString() : null`
- `address` = `ticket.getLocation()`
- `address_id` = `ticket.getAddressId() != null ? String.valueOf(ticket.getAddressId()) : null`
- `zipcode` = `ticket.getZip()`
- `media_url` = `firstMedia != null ? "/api/v1/media/" + firstMedia.getInternalFilename() : null`

---

### Open311XmlSerializer.java

`@Service` class producing GeoReport v2 byte-compatible XML. NO JAXB. Manual StringBuilder writer.

**serializeServices(List<Open311ServiceResponse> services):**
```
<?xml version="1.0" encoding="utf-8"?>
<services>
  <service>
    <service_code>{service_code}</service_code>
    <service_name>{service_name}</service_name>
    <description>{description}</description>
    <metadata>{metadata}</metadata>
    <type>{type}</type>
    <keywords>{keywords}</keywords>
    <group>{group}</group>
    <attributes>  <!-- only if attributes present -->
      <attribute>
        <variable>{variable}</variable>
        <code>{code}</code>
        <datatype>{datatype}</datatype>
        <required>{required}</required>
        <description>{description}</description>
        <order>{order}</order>
        <values> <!-- only for list types -->
          <value><key>{key}</key><name>{name}</name></value>
        </values>
      </attribute>
    </attributes>
  </service>
</services>
```

**serializeRequests(List<Open311RequestResponse> requests):**
```
<?xml version="1.0" encoding="utf-8"?>
<service_requests>
  <request>
    <service_request_id>{serviceRequestId}</service_request_id>
    <status>{status}</status>
    <status_notes>{statusNotes}</status_notes>
    <service_name>{serviceName}</service_name>
    <service_code>{serviceCode}</service_code>
    <description>{description}</description>
    <agency_responsible>{agencyResponsible}</agency_responsible>
    <requested_datetime>{requestedDatetime}</requested_datetime>
    <updated_datetime>{updatedDatetime}</updated_datetime>
    <expected_datetime>{expectedDatetime}</expected_datetime>
    <lat>{lat}</lat>
    <long>{lng}</long>
    <address>{address}</address>
    <address_id>{addressId}</address_id>
    <zipcode>{zipcode}</zipcode>
    <media_url>{mediaUrl}</media_url>
  </request>
</service_requests>
```

Escape XML special chars (&, <, >, ', ") in text content. Omit null-valued elements (empty tag or skip).

**serializeDiscovery(Map<String,Object> discoveryData):**
```
<?xml version="1.0" encoding="utf-8"?>
<discovery>
  <changeset>{changeset}</changeset>
  <contact>{contact}</contact>
  <key_service>{key_service}</key_service>
  <endpoints>
    <endpoint>
      <specification>{spec}</specification>
      <url>{url}</url>
      <changeset>{changeset}</changeset>
      <type>{type}</type>
      <formats>
        <format>text/json</format>
        <format>text/xml</format>
      </formats>
    </endpoint>
  </endpoints>
</discovery>
```

**serializePostResponse(Open311PostResponse r):**
```
<?xml version="1.0" encoding="utf-8"?>
<service_requests>
  <request>
    <service_request_id>{serviceRequestId}</service_request_id>
    <service_notice>{serviceNotice}</service_notice>
    <account_id>{accountId}</account_id>
  </request>
</service_requests>
```

---

### Open311DiscoveryController.java

```
@GetMapping("/open311/discovery")
```
No auth required. Reads `app.open311.*` config values. Returns discovery object with:
- `changeset`: current date (ISO 8601)
- `contact`: `app.open311.contact`
- `key_service`: `app.open311.keyService`
- `endpoints`: array of 5 endpoint descriptors (services, requests, etc.)

Supports `?format=xml`: call `Open311XmlSerializer.serializeDiscovery(...)`, return `ResponseEntity<String>` with `Content-Type: application/xml`. Default: return JSON map.

---

### Open311ServicesController.java

```
@GetMapping("/open311/services")
@GetMapping("/open311/services/{service_code}")
```
No auth required.

**GET /open311/services:**
1. Query `categories WHERE active = true AND postingPermissionLevel IN ('public','anonymous')`
2. JOIN `categoryGroups` on `categories.categoryGroup_id`
3. ORDER BY `categoryGroups.ordering ASC NULLS LAST, categories.name ASC`
4. If `?service_code=` param present: filter to single category
5. Map each to `Open311ServiceResponse` via `Open311MappingService.toService()`
6. If `?format=xml`: return `Open311XmlSerializer.serializeServices(list)` as `text/xml`
7. Default: return JSON array

**GET /open311/services/{service_code}:**
1. Lookup `category WHERE id = service_code`; if not found → 404 `SERVICE_NOT_FOUND`
2. Return single service with `attributes` array populated from `categories.customFields`
3. Support `?format=xml`

---

### Open311RequestsController.java

```
@PostMapping("/open311/requests")
@GetMapping("/open311/requests")
@GetMapping("/open311/requests/{service_request_id}")
```

**POST /open311/requests:**
1. Check `api_key` param against `app.open311.obsoleteApiKeys` list — if match, return 200 `{"shutdown": true, "message": "<config message>"}` immediately (no ticket created).
2. Compute `SHA-256(api_key)` → lookup in `clients.api_key_lookup` via `ClientRepository.findByApiKeyLookup(sha256Hex)`.
3. If not found → 403 `API_KEY_INVALID`. If found, BCrypt verify `api_key` against `clients.api_key_hash`. If mismatch → 403.
4. Resolve `service_code` to `Category`; validate `active=true` and `postingPermissionLevel` permits anonymous/public.
5. Find or create `Person` from `first_name`, `last_name`, `email`, `phone` fields (email lookup first).
6. Create `Ticket` via `TicketService.createTicket(...)` with `client_id = client.getId()`, `enteredByPerson_id = null` (API-submitted).
7. Append "open" history entry (`action_id = 1`) with `enteredByPerson_id = null`.
8. Return `[{"service_request_id": "123", "service_notice": "", "account_id": ""}]` as JSON array or XML.
9. Support `?format=xml`.

**GET /open311/requests:**
Filter params: `service_request_id`, `service_code`, `status`, `start_date`, `end_date`, `lat`, `long`, `radius`, `keyword`, `page`, `per_page` (default 50, max 200).
Build query JOIN tickets + categories + substatus + people(assignedPerson) + media.
Map results via `Open311MappingService.toServiceRequest()`.
Support `?format=xml`.

**GET /open311/requests/{service_request_id}:**
1. Lookup ticket by ID; if not found → 404 `REQUEST_NOT_FOUND`.
2. Fetch first `media` row for the ticket.
3. Map to `Open311RequestResponse` via `Open311MappingService.toServiceRequest()`.
4. Return as single-element array `[{...}]` (GeoReport v2 spec requires array).
5. Support `?format=xml`.

---

### Open311IntegrationTest.java

`@SpringBootTest + @AutoConfigureMockMvc` integration test. Use `@Transactional` with rollback.

Test cases (minimum):
1. `GET /open311/services` returns 200 JSON array (even with empty DB — empty array is valid).
2. `GET /open311/services?format=xml` returns Content-Type `application/xml` with `<?xml` declaration and `<services>` root element.
3. `GET /open311/requests/{id}` for existing ticket returns 200 array with correct `service_request_id`, `status`.
4. `POST /open311/requests` with invalid `api_key` returns 403.
5. `GET /open311/requests/{id}` for nonexistent ID returns 404 with `{"error":"REQUEST_NOT_FOUND"}`.
6. `GET /open311/services` with `?format=xml` has `<service_code>`, `<service_name>`, `<metadata>`, `<type>` elements in response body.
  </action>
  <verify>
grep -n 'class Open311MappingService' api/src/main/java/com/ureport/service/Open311MappingService.java &&
grep -n 'toServiceRequest' api/src/main/java/com/ureport/service/Open311MappingService.java &&
grep -n 'class Open311XmlSerializer' api/src/main/java/com/ureport/service/Open311XmlSerializer.java &&
grep -n 'service_requests' api/src/main/java/com/ureport/service/Open311XmlSerializer.java &&
grep -n 'service_request_id' api/src/main/java/com/ureport/dto/response/Open311RequestResponse.java &&
grep -n '@GetMapping.*open311/services' api/src/main/java/com/ureport/controller/open311/Open311ServicesController.java &&
grep -n '@PostMapping.*open311/requests' api/src/main/java/com/ureport/controller/open311/Open311RequestsController.java &&
grep -n 'api_key_lookup' api/src/main/java/com/ureport/controller/open311/Open311RequestsController.java &&
grep -n 'obsolete' api/src/main/java/com/ureport/controller/open311/Open311RequestsController.java &&
echo OPEN311_CHECKS_PASSED
  </verify>
  <done>
- Open311DiscoveryController, Open311ServicesController, Open311RequestsController exist under controller/open311/
- Open311MappingService.java exists with toService() and toServiceRequest() methods
- Open311XmlSerializer.java exists, produces output with <service_requests> root and all GeoReport v2 field elements
- Open311RequestResponse uses @JsonProperty annotations for all underscore-named fields including "long"
- POST /open311/requests validates api_key via SHA-256 lookup + BCrypt verify; obsolete key returns 200 shutdown payload
- All 6 Open311 endpoints support ?format=xml producing valid GeoReport v2 XML
- Open311IntegrationTest.java contains at minimum 6 test cases covering JSON/XML format, auth failure, 404, and field names
  </done>
</task>

<feature_dependencies>
Implements: F2: Open311 GeoReport v2 REST API — all 6 endpoints (discovery, services list,
  service detail, POST requests, GET requests, GET requests/{id}), JSON+XML formats,
  api_key authentication, obsolete key detection, Open311MappingService field mapping,
  Open311XmlSerializer byte-compatible XML output
F18: Multi-Format Output — Open311XmlSerializer for XML format; JSON default via Jackson
  with exact @JsonProperty field names

Depends on: Wave 2a Ticket entity, TicketRepository, TicketService (ticket creation in POST /requests),
  ApiKeyAuthenticationFilter infrastructure, SecurityConfig (/open311/** permitAll),
  Wave 1 clients table (api_key_lookup column), categories, categoryGroups, people, media, substatus tables

Enables: F2 (external Open311 consumers can integrate immediately),
  F18 partial (XML output complete; CSV export enabled by Task 2)
  Wave 3a frontend can display Open311 service list
</feature_dependencies>

<task type="auto">
  <name>Task 2: Multi-format output infrastructure + Full-text search (TicketSearchService, TicketSearchController, FormatFilter, CsvExportUtil)</name>
  <files>
    api/src/main/java/com/ureport/config/WebMvcConfig.java
    api/src/main/java/com/ureport/filter/FormatFilter.java
    api/src/main/java/com/ureport/util/CsvExportUtil.java
    api/src/main/java/com/ureport/controller/TicketSearchController.java
    api/src/main/java/com/ureport/service/TicketSearchService.java
    api/src/main/java/com/ureport/dto/request/TicketSearchParams.java
    api/src/main/java/com/ureport/dto/response/TicketSummaryResponse.java
    api/src/main/java/com/ureport/dto/response/MapViewResponse.java
    api/src/test/java/com/ureport/TicketSearchServiceTest.java
  </files>
  <action>
Implement the multi-format output infrastructure (F18) and the full-text ticket search (F11).

---

### FormatFilter.java

`@Component` extending `OncePerRequestFilter`. Applied globally via `WebMvcConfig`.

```java
@Override
protected void doFilterInternal(HttpServletRequest request,
                                 HttpServletResponse response,
                                 FilterChain chain) throws IOException, ServletException {
    String format = request.getParameter("format");
    if (format != null) {
        request.setAttribute("responseFormat", format);
        switch (format) {
            case "xml"   -> response.setContentType("application/xml; charset=utf-8");
            case "csv"   -> response.setContentType("text/csv; charset=utf-8");
            case "print" -> response.setContentType("text/html; charset=utf-8");
            case "json"  -> {}   // Jackson default — do nothing
            default      -> {}   // invalid format rejected by controllers
        }
    }
    chain.doFilter(request, response);
}
```

---

### WebMvcConfig.java

`@Configuration` implementing `WebMvcConfigurer`.

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowedOrigins:http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/v1/**")
            .allowedOrigins(allowedOrigins)
            .allowedMethods("GET","POST","PUT","PATCH","DELETE","OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true);
        // Open311 endpoints allow all origins (public API)
        registry.addMapping("/open311/**")
            .allowedOrigins("*")
            .allowedMethods("GET","POST","OPTIONS");
    }

    @Bean
    public FilterRegistrationBean<FormatFilter> formatFilterRegistration(FormatFilter formatFilter) {
        FilterRegistrationBean<FormatFilter> reg = new FilterRegistrationBean<>(formatFilter);
        reg.addUrlPatterns("/open311/*", "/api/v1/tickets/export", "/api/v1/tickets/map");
        reg.setOrder(Ordered.HIGHEST_PRECEDENCE + 10);
        return reg;
    }
}
```

Note: Do NOT duplicate `SecurityConfig` from Wave 2a here. `WebMvcConfig` handles only CORS
and filter registration.

---

### CsvExportUtil.java

`@Component` for streaming CSV output. Uses `StreamingResponseBody` to prevent OOM on large exports.

```java
@Component
public class CsvExportUtil {

    private static final String[] HEADERS = {
        "id", "status", "substatus", "category", "description",
        "location", "city", "state", "zip", "enteredDate",
        "lastModified", "closedDate", "assignedPerson", "contactMethod"
    };

    public StreamingResponseBody streamTicketsCsv(List<TicketSummaryResponse> tickets) {
        return outputStream -> {
            try (
                OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
                CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader(HEADERS))
            ) {
                for (TicketSummaryResponse t : tickets) {
                    printer.printRecord(
                        t.getId(), t.getStatus(), t.getSubstatusName(), t.getCategoryName(),
                        t.getDescription(), t.getLocation(), t.getCity(), t.getState(), t.getZip(),
                        t.getEnteredDate(), t.getLastModified(), t.getClosedDate(),
                        t.getAssignedPersonName(), t.getContactMethodName()
                    );
                }
                printer.flush();
            }
        };
    }
}
```

Uses `org.apache.commons.csv.CSVPrinter` (Apache Commons CSV on classpath).

---

### TicketSearchParams.java

POJO (or Java record) for all search query params:

```java
public class TicketSearchParams {
    String q;                    // FTS keyword query
    Integer categoryId;
    Integer departmentId;        // JOIN categories.department_id = ?
    Integer assignedPersonId;
    Integer enteredByPersonId;
    Integer reportedByPersonId;
    String status;               // 'open' or 'closed'
    Integer substatusId;
    Integer contactMethodId;
    Integer clientId;
    Integer issueTypeId;
    String enteredDateFrom;      // ISO date string
    String enteredDateTo;
    String closedDateFrom;
    String closedDateTo;
    String city;
    String zip;
    BigDecimal lat;
    BigDecimal lon;
    Integer radius;              // meters — for ST_DWithin
    int page = 1;
    int limit = 25;
    String sortBy = "enteredDate";
    String sortDir = "desc";
}
```

---

### TicketSummaryResponse.java

Response DTO for list/search results:

```java
public class TicketSummaryResponse {
    Long id;
    String status;
    String substatusName;
    Integer categoryId;
    String categoryName;
    String description;
    String location;
    String city;
    String state;
    String zip;
    BigDecimal latitude;
    BigDecimal longitude;
    String enteredDate;          // ISO 8601
    String lastModified;         // ISO 8601
    String closedDate;           // ISO 8601, nullable
    Integer assignedPersonId;
    String assignedPersonName;
    String contactMethodName;
    Integer mediaCount;
}
```

---

### MapViewResponse.java

```java
public class MapViewResponse {
    List<MapCluster> clusters;

    public static class MapCluster {
        Long clusterId;
        Long count;
        Double lat;
        Double lon;
    }
}
```

---

### TicketSearchService.java

`@Service` class using `JdbcTemplate` for native SQL queries (Spring Data JPA is insufficient
for dynamic parameterized FTS + geo queries — use `JdbcTemplate` directly).

**SORTBY WHITELIST** (prevent SQL injection via sort param):
```java
private static final Set<String> ALLOWED_SORT_COLUMNS = Set.of(
    "enteredDate", "lastModified", "closedDate", "status", "category_id"
);
```

**Core query construction:**

```java
public Page<TicketSummaryResponse> search(TicketSearchParams params) {
    StringBuilder sql = new StringBuilder("""
        SELECT t.id, t.status,
               s.name AS substatus_name,
               t.category_id, c.name AS category_name,
               t.description, t.location, t.city, t.state, t.zip,
               t.latitude, t.longitude,
               t.enteredDate, t.lastModified, t.closedDate,
               t.assignedPerson_id,
               p.firstname || ' ' || p.lastname AS assigned_person_name,
               cm.name AS contact_method_name,
               (SELECT COUNT(*) FROM media m WHERE m.ticket_id = t.id) AS media_count
        FROM tickets t
        JOIN categories c ON t.category_id = c.id
        LEFT JOIN substatus s ON t.substatus_id = s.id
        LEFT JOIN people p ON t.assignedPerson_id = p.id
        LEFT JOIN contactMethods cm ON t.contactMethod_id = cm.id
        LEFT JOIN departments d ON c.department_id = d.id
        WHERE 1=1
        """);

    List<Object> paramList = new ArrayList<>();

    // FTS keyword search
    if (params.getQ() != null && !params.getQ().isBlank()) {
        sql.append("AND t.search_vector @@ websearch_to_tsquery('english', ?) ");
        paramList.add(params.getQ());
    }
    // Status filter
    if (params.getStatus() != null) {
        sql.append("AND t.status = ? ");
        paramList.add(params.getStatus());
    }
    // Category filter
    if (params.getCategoryId() != null) {
        sql.append("AND t.category_id = ? ");
        paramList.add(params.getCategoryId());
    }
    // Department filter (via category join)
    if (params.getDepartmentId() != null) {
        sql.append("AND c.department_id = ? ");
        paramList.add(params.getDepartmentId());
    }
    // Assigned person
    if (params.getAssignedPersonId() != null) {
        sql.append("AND t.assignedPerson_id = ? ");
        paramList.add(params.getAssignedPersonId());
    }
    // Substatus
    if (params.getSubstatusId() != null) {
        sql.append("AND t.substatus_id = ? ");
        paramList.add(params.getSubstatusId());
    }
    // Contact method
    if (params.getContactMethodId() != null) {
        sql.append("AND t.contactMethod_id = ? ");
        paramList.add(params.getContactMethodId());
    }
    // Client
    if (params.getClientId() != null) {
        sql.append("AND t.client_id = ? ");
        paramList.add(params.getClientId());
    }
    // Issue type
    if (params.getIssueTypeId() != null) {
        sql.append("AND t.issueType_id = ? ");
        paramList.add(params.getIssueTypeId());
    }
    // Date ranges
    if (params.getEnteredDateFrom() != null) {
        sql.append("AND t.enteredDate >= ?::timestamptz ");
        paramList.add(params.getEnteredDateFrom());
    }
    if (params.getEnteredDateTo() != null) {
        sql.append("AND t.enteredDate <= ?::timestamptz ");
        paramList.add(params.getEnteredDateTo());
    }
    if (params.getClosedDateFrom() != null) {
        sql.append("AND t.closedDate >= ?::timestamptz ");
        paramList.add(params.getClosedDateFrom());
    }
    if (params.getClosedDateTo() != null) {
        sql.append("AND t.closedDate <= ?::timestamptz ");
        paramList.add(params.getClosedDateTo());
    }
    // Location string filters
    if (params.getCity() != null) {
        sql.append("AND LOWER(t.city) = LOWER(?) ");
        paramList.add(params.getCity());
    }
    if (params.getZip() != null) {
        sql.append("AND t.zip = ? ");
        paramList.add(params.getZip());
    }
    // Geo radius (ST_DWithin)
    if (params.getLat() != null && params.getLon() != null && params.getRadius() != null) {
        sql.append("AND ST_DWithin(t.geo_point, ST_MakePoint(?, ?)::geography, ?) ");
        paramList.add(params.getLon());  // ST_MakePoint(longitude, latitude)
        paramList.add(params.getLat());
        paramList.add(params.getRadius());
    }

    // ORDER BY
    String sortCol = ALLOWED_SORT_COLUMNS.contains(params.getSortBy()) ? params.getSortBy() : "enteredDate";
    String sortDir = "asc".equalsIgnoreCase(params.getSortDir()) ? "ASC" : "DESC";
    if (params.getQ() != null && !params.getQ().isBlank()) {
        // FTS rank takes precedence
        sql.append("ORDER BY ts_rank(t.search_vector, websearch_to_tsquery('english', ?)) DESC ");
        paramList.add(params.getQ());
    } else {
        sql.append("ORDER BY t.").append(sortCol).append(" ").append(sortDir).append(" ");
    }

    // COUNT query for pagination total
    // ... (wrap sql in COUNT(*) subquery before adding LIMIT/OFFSET)

    // Pagination
    int offset = (params.getPage() - 1) * params.getLimit();
    sql.append("LIMIT ? OFFSET ?");
    paramList.add(params.getLimit());
    paramList.add(offset);

    // Execute with JdbcTemplate.query(sql, rowMapper, paramList.toArray())
    // Return Page<TicketSummaryResponse>
}
```

**searchForExport(TicketSearchParams params):**
Same query WITHOUT `LIMIT ? OFFSET ?` (unpaginated). Staff permission checked by controller.

**searchForMap(TicketSearchParams params, int zoomLevel):**
```sql
SELECT g.id AS cluster_id,
       COUNT(tgd.ticket_id) AS count,
       ST_Y(g.center::geometry) AS lat,
       ST_X(g.center::geometry) AS long
FROM ticket_geodata tgd
JOIN geoclusters g ON tgd.cluster_id_{zoomLevel} = g.id
JOIN tickets t ON tgd.ticket_id = t.id
JOIN categories c ON t.category_id = c.id
[same WHERE filters from TicketSearchParams except pagination]
GROUP BY g.id, g.center
ORDER BY count DESC
```
Note: `cluster_id_{zoomLevel}` is dynamic — use a switch/map to build the correct JOIN column name for levels 0–6.

---

### TicketSearchController.java

```java
@RestController
public class TicketSearchController {

    // GET /api/v1/tickets — paginated search
    // Auth: any authenticated; per-category display permission enforced in service
    @GetMapping("/api/v1/tickets")
    public ResponseEntity<?> search(@ModelAttribute TicketSearchParams params, ...) { ... }

    // GET /api/v1/tickets/export — CSV or print export (staff only)
    @GetMapping("/api/v1/tickets/export")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<?> export(@ModelAttribute TicketSearchParams params,
                                     HttpServletRequest request) {
        String format = (String) request.getAttribute("responseFormat");
        List<TicketSummaryResponse> results = ticketSearchService.searchForExport(params);
        if ("csv".equals(format)) {
            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=tickets.csv")
                .body(csvExportUtil.streamTicketsCsv(results));
        }
        // else return JSON list for print view
        return ResponseEntity.ok(results);
    }

    // GET /api/v1/tickets/map — geo-cluster map view
    @GetMapping("/api/v1/tickets/map")
    public ResponseEntity<MapViewResponse> mapView(
            @ModelAttribute TicketSearchParams params,
            @RequestParam(defaultValue = "3") int zoom) {
        return ResponseEntity.ok(ticketSearchService.searchForMap(params, zoom));
    }
}
```

Invalid `?format=` value (not json/xml/csv/print): return 400 `{"error":"INVALID_FORMAT","message":"Format must be json or xml"}`.

---

### TicketSearchServiceTest.java

`@SpringBootTest + @Transactional` unit/integration tests:

1. `search()` with no params returns paginated results (empty list OK in test).
2. `search()` with `q="pothole"` generates SQL containing `websearch_to_tsquery` (verify via spy or captured SQL).
3. `search()` with `status="open"` adds status filter.
4. `search()` with `lat/lon/radius` adds `ST_DWithin` clause.
5. `search()` with invalid `sortBy` value falls back to safe default (no SQL injection).
6. `searchForExport()` with `limit` set still returns all results (no pagination applied).
  </action>
  <verify>
grep -n 'class FormatFilter' api/src/main/java/com/ureport/filter/FormatFilter.java &&
grep -n 'responseFormat' api/src/main/java/com/ureport/filter/FormatFilter.java &&
grep -n 'class CsvExportUtil' api/src/main/java/com/ureport/util/CsvExportUtil.java &&
grep -n 'StreamingResponseBody' api/src/main/java/com/ureport/util/CsvExportUtil.java &&
grep -n 'class TicketSearchService' api/src/main/java/com/ureport/service/TicketSearchService.java &&
grep -n 'websearch_to_tsquery' api/src/main/java/com/ureport/service/TicketSearchService.java &&
grep -n 'ST_DWithin' api/src/main/java/com/ureport/service/TicketSearchService.java &&
grep -n 'ALLOWED_SORT_COLUMNS' api/src/main/java/com/ureport/service/TicketSearchService.java &&
grep -n 'class TicketSearchController' api/src/main/java/com/ureport/controller/TicketSearchController.java &&
grep -n '/api/v1/tickets/export' api/src/main/java/com/ureport/controller/TicketSearchController.java &&
grep -n 'PreAuthorize.*STAFF' api/src/main/java/com/ureport/controller/TicketSearchController.java &&
echo SEARCH_FORMAT_CHECKS_PASSED
  </verify>
  <done>
- FormatFilter.java exists, reads ?format= param, sets request attribute "responseFormat" and response Content-Type
- WebMvcConfig.java exists with CORS config for /api/v1/** and /open311/**, registers FormatFilter
- CsvExportUtil.java exists, uses StreamingResponseBody + Apache Commons CSV, header row matches spec
- TicketSearchParams.java exists with all filter fields (q, categoryId, departmentId, status, substatus, dates, geo, pagination)
- TicketSummaryResponse.java exists, MapViewResponse.java exists
- TicketSearchService.java exists with JdbcTemplate-based dynamic SQL, websearch_to_tsquery for FTS, ST_DWithin for geo, ALLOWED_SORT_COLUMNS whitelist
- TicketSearchController.java exists with GET /api/v1/tickets, GET /api/v1/tickets/export (@PreAuthorize STAFF), GET /api/v1/tickets/map
- TicketSearchServiceTest.java contains at minimum 6 test cases
  </done>
</task>

<feature_dependencies>
Implements: F18: Multi-Format Output — FormatFilter (content negotiation via ?format= param),
  WebMvcConfig (CORS + filter registration), CsvExportUtil (StreamingResponseBody for tickets CSV),
  Open311XmlSerializer already provides XML format (Task 1)
F11: Full-Text Search — TicketSearchService with websearch_to_tsquery against
  tickets.search_vector GIN index, multi-field filter (15+ params), pagination,
  unpaginated export mode, geo-cluster map view via ticket_geodata + geoclusters

Depends on: Wave 1 DB schema (tickets.search_vector TSVECTOR + GIN index, tickets.geo_point GEOGRAPHY,
  ticket_geodata.cluster_id_0..6, geoclusters.center GEOGRAPHY), Wave 2a Ticket entity + SecurityConfig
  + @PreAuthorize infrastructure

Enables: F11 (frontend TicketListPage, TicketMapPage use GET /api/v1/tickets and /tickets/map),
  F18 (CSV export button in Wave 3a; Open311 XML already complete from Task 1),
  Wave 3a frontend can build ticket search, list, map, and export UI
</feature_dependencies>

</tasks>

<verification>
After both tasks complete:

1. Verify Open311 controllers exist:
```bash
ls api/src/main/java/com/ureport/controller/open311/
# Expected: Open311DiscoveryController.java, Open311ServicesController.java, Open311RequestsController.java
```

2. Verify byte-compatible XML field names:
```bash
grep -n 'service_requests\|service_request_id\|status_notes\|agency_responsible\|requested_datetime\|updated_datetime\|expected_datetime\|media_url' \
  api/src/main/java/com/ureport/service/Open311XmlSerializer.java
# Expected: all 8 GeoReport v2 field names present
```

3. Verify api_key dual-hash validation:
```bash
grep -n 'api_key_lookup\|BCrypt\|SHA-256\|obsolete' \
  api/src/main/java/com/ureport/controller/open311/Open311RequestsController.java
# Expected: SHA-256 lookup, BCrypt verify, obsolete key check
```

4. Verify FTS query:
```bash
grep -n 'websearch_to_tsquery\|ST_DWithin\|ALLOWED_SORT_COLUMNS' \
  api/src/main/java/com/ureport/service/TicketSearchService.java
# Expected: all 3 present
```

5. Verify CSV streaming:
```bash
grep -n 'StreamingResponseBody' api/src/main/java/com/ureport/util/CsvExportUtil.java &&
grep -n 'CSVPrinter\|CSVFormat' api/src/main/java/com/ureport/util/CsvExportUtil.java
# Expected: both present
```

6. Verify staff-only export gate:
```bash
grep -n 'PreAuthorize.*STAFF' api/src/main/java/com/ureport/controller/TicketSearchController.java
# Expected: @PreAuthorize annotation present on export endpoint
```

7. Compile check (if Gradle available):
```bash
./gradlew compileJava 2>&1 | tail -20 && echo COMPILE_OK
```
</verification>

<success_criteria>
- All 6 Open311 endpoints exist and handle both JSON (default) and ?format=xml
- Open311XmlSerializer produces output with <?xml version="1.0" encoding="utf-8"?> declaration,
  <service_requests> root, and all GeoReport v2 element names (service_request_id, status_notes,
  agency_responsible, requested_datetime, updated_datetime, expected_datetime, lat, long,
  address, address_id, zipcode, media_url)
- POST /open311/requests validates api_key via SHA-256 lookup + BCrypt verify;
  obsolete key returns 200 shutdown JSON without creating a ticket
- Open311RequestResponse uses @JsonProperty("long") for the longitude field to avoid Java keyword conflict
- FormatFilter intercepts ?format= param, sets request attribute "responseFormat",
  sets correct Content-Type for xml/csv/print
- TicketSearchService uses JdbcTemplate with dynamic SQL; FTS via websearch_to_tsquery;
  geo filter via ST_DWithin; ALLOWED_SORT_COLUMNS whitelist prevents injection
- GET /api/v1/tickets/export is @PreAuthorize("hasRole('STAFF')") and streams CSV via StreamingResponseBody
- GET /api/v1/tickets/map returns MapViewResponse with cluster_id, count, lat, long
- Open311IntegrationTest.java and TicketSearchServiceTest.java both exist with coverage tests
- All integration_contracts.provides.verify commands exit 0
</success_criteria>

<output>
After completion, create `.planning/express/implement-the-full-ureport-modernization/03-SUMMARY.md`
summarizing:
- Files created: list all 17+ files
- Open311 endpoints implemented: 6
- XML serializer approach: manual StringBuilder (not JAXB), element names listed
- FTS implementation: JdbcTemplate + websearch_to_tsquery + GIN index
- Multi-format: FormatFilter registered for /open311/* and /api/v1/tickets/export paths
- CSV export: StreamingResponseBody via CsvExportUtil, Apache Commons CSV
- Test files: Open311IntegrationTest, TicketSearchServiceTest
- Any conflicts or deviations from spec (flag rather than silently diverge)
</output>
