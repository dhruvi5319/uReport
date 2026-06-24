---

## F18: Multi-Format Output Feeds

**Description:** The legacy PHP template system renders responses in multiple formats by switching template files based on a `format` request parameter or `Accept` header. The new Spring Boot system must support equivalent multi-format output for all endpoints that currently support it. Open311 endpoints must support JSON and XML with byte-compatible response shapes. The React SPA consumes JSON; CSV and print-HTML are staff export formats; XML is required for legacy Open311 consumers.

---

### Terminology

- **format param:** `?format=json`, `?format=xml`, `?format=csv`, `?format=print`, `?format=txt` — controls output format.
- **Content negotiation:** Spring `HttpMessageConverter` selection; `format` query param takes precedence over `Accept` header for Open311 compatibility.
- **Byte-compatible XML:** The XML response shapes must exactly match the current PHP Laminas XML template output — same element names, same attribute structure, same encoding.
- **CSV export:** A downloadable `text/csv` file for ticket search results (staff only).
- **Print HTML:** A server-rendered HTML page optimized for browser print, served for ticket search results.

---

### Sub-features

- JSON output (default for all API endpoints)
- XML output for Open311 endpoints (byte-compatible)
- CSV export for ticket search (staff only)
- Print-friendly HTML for ticket search (staff only)
- TXT output where currently supported
- `format` query param overrides Accept header
- Open311 endpoints: `format=json` and `format=xml`

---

### Format Support Matrix

| Endpoint Group | JSON | XML | CSV | Print HTML | TXT |
|---------------|------|-----|-----|------------|-----|
| Open311 /discovery | ✓ | ✓ | ✗ | ✗ | ✗ |
| Open311 /services | ✓ | ✓ | ✗ | ✗ | ✗ |
| Open311 /requests | ✓ | ✓ | ✗ | ✗ | ✗ |
| GET /api/v1/tickets | ✓ | ✗ | ✓ (staff) | ✓ (staff) | ✗ |
| GET /api/v1/tickets/export | ✗ | ✗ | ✓ | ✓ | ✗ |
| All other /api/v1/* | ✓ | ✗ | ✗ | ✗ | ✗ |

---

### Process

#### Format Resolution
1. Request arrives at any endpoint.
2. Spring filter checks `?format=` query param.
3. If `format=xml` → sets response `Content-Type: application/xml; charset=UTF-8`.
4. If `format=csv` → sets `Content-Type: text/csv; charset=UTF-8`; adds `Content-Disposition: attachment; filename="tickets.csv"`.
5. If `format=print` → returns HTML template (server-rendered via Thymeleaf or similar; or delegates to React print route).
6. If no `format` param → uses `Accept` header negotiation; defaults to `application/json`.

#### Open311 XML Output
1. Open311 controller serializes response using dedicated XML message converter.
2. XML must use exact GeoReport v2 element structure:
   - `<services>` containing `<service>` elements.
   - `<service_requests>` containing `<request>` elements.
   - Field names must match JSON field names as XML element names (e.g., `<service_code>`, `<service_request_id>`).
3. XML declaration: `<?xml version="1.0" encoding="utf-8"?>`.
4. No XML attributes — all values as text content of elements.

#### CSV Export (Tickets)
1. Staff requests `/api/v1/tickets/export?format=csv` with filter params (F11).
2. System queries all matching tickets (no pagination limit for staff export).
3. System writes CSV rows with headers matching legacy export columns.
4. Streams response without buffering entire result set (use Spring `StreamingResponseBody`).

**CSV Column Order:**
id, enteredDate, lastModified, closedDate, status, substatus, category, department, issueType, description, location, city, state, zip, latitude, longitude, assignedPerson, reportedBy, contactMethod, client, customFields

---

### Inputs

- `format` (string, optional query param): `json` | `xml` | `csv` | `print` | `txt`. Defaults to `json`.
- `Accept` header (optional): Used if `format` not specified. `application/json`, `application/xml`, `text/csv`, `text/html`.

---

### Outputs

- **JSON:** `application/json` — standard REST response bodies.
- **XML:** `application/xml` — GeoReport v2 compliant XML for Open311 endpoints.
- **CSV:** `text/csv` — streaming comma-separated values with header row.
- **Print HTML:** `text/html` — print-optimized ticket list.

---

### Validation Rules

- `format` param must be one of the supported values for the endpoint; unsupported combinations return 400.
- CSV and print formats require `staff` role (enforced by F03 permission check).
- XML output for Open311 must be validated against GeoReport v2 fixture files in CI (NFR-1).
- The `format` query param takes precedence over the `Accept` header to preserve legacy behavior.
- XML character encoding must be UTF-8.
- XML must use no XML attributes — all data as element text content (matches legacy PHP template output).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Unsupported format for endpoint | 400 | UNSUPPORTED_FORMAT | "Format 'txt' is not supported for this endpoint" |
| CSV/print requested by non-staff | 403 | PERMISSION_DENIED | "Export formats require staff role" |
| format param value unrecognized | 400 | INVALID_FORMAT | "Unknown format: {value}" |

---

### API Surface (this feature)

Cross-cutting — applies to all endpoints. No dedicated API surface. Format is a query parameter modifier on existing endpoints. See `Y1b-api-tickets.md §Export` for CSV/print endpoint specs.

---

### Schema Surface (this feature)

No database tables. Format selection is a presentation-layer concern handled by Spring `HttpMessageConverter` configuration and `ContentNegotiationStrategy`.
