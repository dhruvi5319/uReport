---

## F16: RESTful JSON API Backend

**Description:** The second primary new deliverable. All data retrieval and mutation operations currently performed by PHP controllers rendering templates are refactored into clean, documented RESTful JSON API endpoints. The Open311 endpoint surface (F1) is preserved verbatim at `/open311/`. The new internal API follows REST conventions, is described by an OpenAPI 3.1 spec, is consumed by the SPA (F15) and authorized API clients, and enforces authentication (F11) and role-based authorization (F10) on every protected endpoint.

**Terminology:**
- **JSON Envelope:** Standard response wrapper `{ "data": any, "meta": { … }, "errors": [] }` used on all non-Open311 endpoints.
- **Repository Pattern:** Database access abstraction; controllers call repository interfaces; repositories execute SQL via PDO or Doctrine DBAL.
- **OpenAPI 3.1 Spec:** The machine-readable API description served at `/api/docs` and used to generate TypeScript client types.
- **Content Negotiation:** `Accept` header or `?format=` param used for CSV/print variants.
- **Middleware Stack:** Auth middleware, RBAC middleware, validation middleware, error handler — applied globally to all `/api/` routes.

**Sub-features:**
- RESTful endpoints for all ticket operations (F00)
- RESTful endpoints for search/filter (F04) and reporting (F09)
- RESTful endpoints for all admin operations: departments, categories, people, templates, API clients, substatuses
- JWT session validation on every protected endpoint (F11)
- RBAC enforcement at controller layer (F10)
- Consistent JSON response envelope
- Correct HTTP status codes
- OpenAPI 3.1 spec served at `/api/docs`
- Field-level validation errors (HTTP 422)
- Repository pattern for all DB access
- CSV and print export via content negotiation
- Preserved Open311 at `/open311/` (not modified here)

---

### F16 Standard Response Shapes

**Success (single resource):**
```json
{
  "data": { "id": 101, "title": "Pothole on Main St", "…": "…" },
  "meta": {},
  "errors": []
}
```

**Success (collection):**
```json
{
  "data": [ { "id": 101, "…": "…" }, { "id": 102, "…": "…" } ],
  "meta": {
    "page": 1,
    "perPage": 25,
    "total": 342,
    "pages": 14
  },
  "errors": []
}
```

**Validation error (HTTP 422):**
```json
{
  "data": null,
  "meta": {},
  "errors": [
    { "field": "categoryId", "message": "Category not found or inactive" },
    { "field": "lat", "message": "Latitude must be between -90 and 90" }
  ]
}
```

**Not found (HTTP 404):**
```json
{
  "data": null,
  "meta": {},
  "errors": [{ "field": null, "message": "Ticket not found", "code": "NOT_FOUND" }]
}
```

---

### F16 HTTP Status Code Contract

| Status | Meaning |
|--------|---------|
| 200 OK | Successful read or update |
| 201 Created | Successful resource creation |
| 204 No Content | Successful delete (no response body) |
| 400 Bad Request | Malformed request (e.g., invalid JSON body) |
| 401 Unauthorized | Missing or invalid authentication |
| 403 Forbidden | Authenticated but insufficient role/permission |
| 404 Not Found | Resource does not exist |
| 405 Method Not Allowed | HTTP verb not supported on this route |
| 409 Conflict | State conflict (e.g., close already-closed ticket) |
| 413 Payload Too Large | File upload or export exceeds size limit |
| 422 Unprocessable Entity | Validation failure (with field-level errors) |
| 500 Internal Server Error | Unhandled server error (logged to Graylog) |
| 503 Service Unavailable | Solr or external service unavailable |

---

### F16 Middleware Stack (applied to all `/api/` routes)

1. **Security Headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options added to every response.
2. **CORS:** Configurable allowed origins; credentials allowed for same-origin SPA.
3. **Auth Middleware:** Extracts and validates JWT from cookie or `Authorization` header (see F11). Sets caller context.
4. **Rate Limiting:** Optional per-IP or per-client rate limiting (configurable; off by default).
5. **Request Validation:** Body and query parameter validation before reaching controller.
6. **Error Handler:** Catches unhandled exceptions; returns 500 envelope; forwards structured error to Graylog.

---

### F16 Repository Pattern

- Each entity has a corresponding repository class: `TicketRepository`, `PersonRepository`, `CategoryRepository`, etc.
- Repositories expose typed methods: `findById(int): ?Ticket`, `findAll(array $filters): TicketCollection`, `save(Ticket): Ticket`, `delete(int): void`.
- No raw SQL in controllers — only repository method calls.
- Repository interfaces enable easy mocking in unit tests.
- PDO (or Doctrine DBAL) used as the underlying database layer.

---

### F16 OpenAPI Spec

- Served at `GET /api/docs` as a Swagger UI HTML page.
- Raw OpenAPI 3.1 JSON/YAML served at `GET /api/openapi.json` and `GET /api/openapi.yaml`.
- All non-Open311 API endpoints documented: paths, parameters, request bodies, response schemas.
- TypeScript client types auto-generated from spec during frontend build (`openapi-typescript` tool).

---

### F16 Inputs

- HTTP request: method, path, headers (Authorization, Content-Type, Accept), query params, JSON body
- JWT session (cookie or header)

---

### F16 Outputs

- JSON response with envelope (all `/api/` routes)
- `text/csv` for export endpoints (content-negotiated)
- HTTP status codes per contract above
- OpenAPI 3.1 spec at `/api/openapi.json`

---

### F16 Validation

- All inputs validated server-side — frontend validation is UX only, not a security gate
- JSON body must be valid JSON; malformed JSON returns HTTP 400
- All `id` path parameters must be positive integers; invalid formats return HTTP 400
- Pagination: `page` ≥ 1; `perPage` 1–100 for lists, 1–5000 for exports
- String fields: length limits enforced per-field (see individual feature specs)
- Enum fields: values strictly validated against allowed sets
- Date fields: ISO 8601 format required

---

### F16 Error States

See `Y2-errors.md` for the cross-feature error catalog. Backend error handling rules:

| Scenario | HTTP | Behavior |
|----------|------|---------|
| Unhandled exception | 500 | Log full stack trace to Graylog; return generic `INTERNAL_ERROR` envelope |
| MySQL connection failure | 503 | Log to Graylog; return `DATABASE_UNAVAILABLE` |
| Solr connection failure | 503 | Log to Graylog; return `SEARCH_UNAVAILABLE` |
| SMTP failure (notifications) | — | Non-fatal; log to Graylog; do not fail the ticket operation |

---

### F16 API Surface (this feature)

All endpoints documented in `Y1a-api-tickets.md` and `Y1b-api-admin.md`. Summary:

- Tickets: CRUD, assign, close, reopen, merge, responses, comments, history, media
- Search: ticket list with filters, clusters
- Reports: 8 report types + metrics endpoint
- Admin: departments, categories, category-groups, people, contact-methods, templates, clients, substatuses
- Auth: login, callback, logout, me
- Docs: openapi.json, openapi.yaml, /api/docs

---

### F16 Schema Surface (this feature)

All tables — full DDL in `Y0a-schema-core.md` and `Y0b-schema-supporting.md`. Repository pattern abstracts all direct DB access.
