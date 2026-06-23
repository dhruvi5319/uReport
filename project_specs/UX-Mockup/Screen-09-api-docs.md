---

### Screen 09: Open311 API Client Documentation Page (Swagger UI)

**Route:** `/api/docs`  
**Purpose:** Interactive OpenAPI 3.1 documentation for all internal API endpoints plus the Open311 GeoReport v2 surface. Allows Tomás and API developers to discover field names, request/response schemas, and test endpoints without reading PHP source code.  
**User Stories:** US-16.2, US-1.3  
**Personas:** Tomás (PER-04)  
**Journey:** JRN-04.1 (Read OpenAPI Spec)

#### Layout

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [Top Nav — minimal: uReport logo + "Back to app"]                        │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  uReport API  v2.0.0                                                     │
│  OpenAPI 3.1 Specification · [Download openapi.json] [Download YAML]    │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  🔍 Filter endpoints...                                              │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ▼ Open311 GeoReport v2  (preserved spec)                                │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  GET  /open311/discovery          Discovery document                │ │
│  │  GET  /open311/services           List available services           │ │
│  │  GET  /open311/services/{code}    Service definition + attributes   │ │
│  │  POST /open311/requests           Submit service request ⬤ TRY IT  │ │
│  │  GET  /open311/requests           Query service requests ⬤ TRY IT  │ │
│  │  GET  /open311/requests/{id}      Get single request    ⬤ TRY IT  │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ▼ Tickets                                                               │
│  │  POST /api/tickets                Create ticket                     │ │
│  │  GET  /api/tickets                Search / list tickets             │ │
│  │  GET  /api/tickets/{id}           Get ticket detail                 │ │
│  │  PUT  /api/tickets/{id}           Update ticket fields              │ │
│  │  POST /api/tickets/{id}/assign    Assign ticket                     │ │
│  │  POST /api/tickets/{id}/close     Close ticket                      │ │
│  │  POST /api/tickets/{id}/reopen    Reopen ticket                     │ │
│  │  DELETE /api/tickets/{id}         Delete ticket (admin)             │ │
│  │  POST /api/tickets/{id}/responses Post response (external)          │ │
│  │  POST /api/tickets/{id}/comments  Post comment (internal)           │ │
│  │  GET  /api/tickets/{id}/history   Ticket audit history              │ │
│  │  GET  /api/tickets/{id}/media     List attachments                  │ │
│  │  POST /api/tickets/{id}/media     Upload attachment                 │ │
│  │  GET  /api/tickets/clusters       Geo-cluster data                  │ │
│                                                                           │
│  ▼ Reports & Metrics                                                     │
│  ▼ Admin — Departments, Categories, People, Templates, Clients          │
│  ▼ Authentication                                                        │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Expanded endpoint (e.g. POST /open311/requests):                   │ │
│  │                                                                      │ │
│  │  Description: Submit a new service request via Open311              │ │
│  │  Auth: API key (optional — required for non-anonymous categories)   │ │
│  │                                                                      │ │
│  │  Parameters / Request body:                                          │ │
│  │  api_key         string  optional  "a3f82b91-…"                     │ │
│  │  service_code *  string  required  "1" (maps to category ID)        │ │
│  │  lat             number  optional  43.1234                          │ │
│  │  long            number  optional  -79.5678                         │ │
│  │  address_string  string  optional  "123 Main St"                    │ │
│  │  description     string  optional  "Large pothole..."               │ │
│  │  email           string  optional  "user@example.com"              │ │
│  │  media_url       string  optional  "https://…/photo.jpg"           │ │
│  │  attribute[severity]  string  optional  "high"                     │ │
│  │                                                                      │ │
│  │  Responses:                                                          │ │
│  │  201  [{ service_request_id: "4821", status: "open", … }]          │ │
│  │  400  [{ code: 400, description: "Invalid api_key" }]               │ │
│  │  404  [{ code: 404, description: "service_code not found" }]        │ │
│  │                                                                      │ │
│  │                                   [⬤ Try it out] [Execute]         │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Endpoint list with verb + path + description | Main content, scrollable |
| Primary | Expanded schema: request body, parameters, response shapes | Expanded accordion per endpoint |
| Secondary | "Try it out" / Execute panel | Inside each expanded endpoint |
| Secondary | Filter box | Top of endpoint list |
| Tertiary | Download openapi.json / YAML | Top of page |
| Tertiary | Back to app link | Top nav |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Endpoint collapsed | Single row: verb badge + path + summary | N/A |
| Endpoint expanded | Full schema accordion panel | N/A |
| Try it out active | Input fields populated; Execute button | N/A |
| Request executing | Execute button spinner | "Calling API..." |
| Response received | Response body + status code rendered | JSON/XML syntax-highlighted |
| Auth required for Try it | Bearer token input appears | "Provide your JWT to test protected endpoints" |

#### Notes
- The Swagger UI is served at `/api/docs` and is accessible to `staff` and `admin` roles (US-15.4, US-16.2).
- Raw spec files at `/api/openapi.json` and `/api/openapi.yaml` for tooling integration.
- Open311 endpoints are documented in the same spec with their spec-required error format (`[{code, description}]`) distinguished from the internal envelope format.
- The "Field Mapping" note for each Open311 endpoint cross-references internal field names (e.g., `service_code` = `categories.id`), directly addressing JRN-04.1 pain point: "No API documentation; required reading PHP controllers."
- TypeScript client types auto-generated from this spec during frontend build (per US-16.2 acceptance criteria). Not exposed in the UI but mentioned in the page description.
