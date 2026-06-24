---

## F11: Full-Text Search (PostgreSQL FTS replacing Solr)

**Description:** The current system uses Apache Solr 7.4 for ticket indexing and full-text search. The new system replaces Solr with PostgreSQL Full-Text Search (FTS), preserving equivalent search semantics and result equivalence. Ticket search supports filtering by dozens of fields and returns paginated results. Search results power the ticket list view, map view, and CSV/print exports. The search endpoint is the primary data retrieval mechanism for the staff dashboard.

---

### Terminology

- **FTS vector:** A PostgreSQL `tsvector` column stored on `tickets` (or a separate FTS index table) combining all searchable text fields.
- **FTS query:** A `tsquery` built from the user's keyword input (using `plainto_tsquery` or `websearch_to_tsquery`).
- **FTS index:** A `GIN` index on the `tsvector` column for performant full-text search.
- **Facet filter:** A non-text filter parameter that further restricts results (e.g., `category_id`, `status`, date ranges).
- **Radius search:** A geographic filter returning only tickets within N meters of a given lat/long (using PostGIS `ST_DWithin`).
- **Map view:** A query variant returning geo-clustered ticket counts rather than paginated ticket records.

---

### Sub-features

- Index all relevant ticket fields for FTS
- Keyword search across indexed fields
- Filter by: category_id, department_id, assignedPerson_id, enteredByPerson_id, status, substatus_id, contactMethod_id, client_id, issueType_id
- Filter by date ranges: enteredDate, closedDate, lastModified
- Filter by location: city, zip, latitude+longitude+radius
- Paginated result sets (list view)
- Unpaginated results for CSV/print export (staff only)
- Map view with geo-clustered counts
- Maintain search result equivalence with current Solr output

---

### Process

#### Standard Search
1. Client GETs `/api/v1/tickets` with zero or more filter params.
2. System builds a parameterized SQL query:
   a. Applies `WHERE` clauses for each provided facet filter.
   b. If `q` (keyword) is provided, adds `AND tickets.search_vector @@ websearch_to_tsquery('english', :q)`.
   c. If `lat`, `long`, `radius` provided, adds `AND ST_DWithin(tickets.geo_point, ST_MakePoint(:long, :lat)::geography, :radius)`.
3. System applies ORDER BY: `ts_rank(search_vector, query) DESC` if keyword search; else `enteredDate DESC`.
4. System applies `LIMIT :limit OFFSET :offset` for pagination.
5. Returns paginated response: `{ "total": N, "page": P, "limit": L, "tickets": [...] }`.

#### Export (CSV / Print)
1. Client GETs `/api/v1/tickets/export?format=csv` (or `format=print`) with same filter params.
2. System validates caller has `staff` role.
3. System executes same query without LIMIT/OFFSET.
4. For CSV: streams `text/csv` response with header row and one ticket per line.
5. For print: returns HTML-formatted ticket list (no pagination controls).

#### Map View
1. Client GETs `/api/v1/tickets/map` with filter params and optional `zoomLevel` (0–6).
2. System applies same filters.
3. System groups results by `ticket_geodata.cluster_id_{zoomLevel}`.
4. Returns array of cluster objects: `{ "cluster_id": N, "count": N, "lat": f, "long": f }`.

---

### FTS Index Construction

The `search_vector` column is populated by a PostgreSQL trigger or scheduled refresh:

```sql
tickets.search_vector = to_tsvector('english',
  coalesce(tickets.description, '') || ' ' ||
  coalesce(tickets.location, '') || ' ' ||
  coalesce(tickets.city, '') || ' ' ||
  coalesce(tickets.zip, '') || ' ' ||
  coalesce(p_reported.firstname || ' ' || p_reported.lastname, '') || ' ' ||
  coalesce(p_assigned.firstname || ' ' || p_assigned.lastname, '') || ' ' ||
  coalesce(categories.name, '') || ' ' ||
  coalesce(departments.name, '')
)
```

A `GIN` index on `tickets.search_vector` ensures sub-500ms full-text queries.

---

### Search Filter Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Keyword query (full-text) |
| `category_id` | integer | Filter by category |
| `department_id` | integer | Filter by department |
| `assignedPerson_id` | integer | Filter by assigned person |
| `enteredByPerson_id` | integer | Filter by staff who entered |
| `reportedByPerson_id` | integer | Filter by reporter |
| `status` | string | `open` or `closed` |
| `substatus_id` | integer | Filter by substatus |
| `contactMethod_id` | integer | Filter by contact method |
| `client_id` | integer | Filter by API client |
| `issueType_id` | integer | Filter by issue type |
| `enteredDateFrom` | ISO date | Ticket opened on or after |
| `enteredDateTo` | ISO date | Ticket opened on or before |
| `closedDateFrom` | ISO date | Ticket closed on or after |
| `closedDateTo` | ISO date | Ticket closed on or before |
| `city` | string | Filter by city (ILIKE) |
| `zip` | string | Filter by ZIP code |
| `lat` | decimal | Center latitude for radius search |
| `long` | decimal | Center longitude for radius search |
| `radius` | integer | Radius in meters (default 1000) |
| `page` | integer | Page number (1-indexed, default 1) |
| `limit` | integer | Page size (default 25, max 500) |
| `sortBy` | string | Field to sort by (default: enteredDate) |
| `sortDir` | string | `asc` or `desc` (default: desc) |

---

### Outputs

**Paginated ticket list:**
```json
{
  "total": 150,
  "page": 1,
  "limit": 25,
  "tickets": [ { ticket object... }, ... ]
}
```

**Map view:**
```json
{
  "clusters": [
    { "cluster_id": 42, "count": 7, "lat": 40.712, "long": -74.006 }
  ]
}
```

**CSV:** `text/csv` stream with headers: id, enteredDate, category, status, substatus, description, location, city, zip, assignedPerson, reportedBy.

---

### Validation Rules

- `status` filter must be `open` or `closed` if provided.
- `lat` must be in [-90, 90]; `long` in [-180, 180] if provided for radius search.
- `radius` must be a positive integer (meters); max 50,000.
- `limit` max is 500 for list; no limit for export (staff only).
- `sortBy` must be a whitelisted field name (prevents SQL injection).
- Keyword `q` is passed through `websearch_to_tsquery` which sanitizes the input.
- Export endpoints require `staff` role (F03).
- Date range parameters must be parseable ISO 8601 date strings.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Export attempted by non-staff | 403 | PERMISSION_DENIED | "Export requires staff role" |
| Invalid status filter | 422 | INVALID_STATUS | "Status must be 'open' or 'closed'" |
| Invalid lat/long | 422 | INVALID_COORDINATES | "Latitude/longitude out of valid range" |
| Invalid date format | 422 | INVALID_DATE | "Date must be ISO 8601 format" |
| limit exceeds maximum | 422 | LIMIT_EXCEEDED | "Page size exceeds maximum allowed" |
| Invalid sortBy field | 422 | INVALID_SORT_FIELD | "Invalid sort field" |

---

### API Surface (this feature)

See full schemas in `Y1b-api-tickets.md §Search`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/tickets` | staff/public/anonymous (per category display) | Search/list tickets |
| GET | `/api/v1/tickets/export` | staff | Export search results (CSV/print) |
| GET | `/api/v1/tickets/map` | staff/public/anonymous | Map view with geo-clusters |

---

### Schema Surface (this feature)

FTS column on `tickets`: `search_vector TSVECTOR`. GIN index: `CREATE INDEX idx_tickets_fts ON tickets USING GIN(search_vector)`. Geo column: `geo_point GEOGRAPHY(POINT, 4326)` indexed with `CREATE INDEX idx_tickets_geo ON tickets USING GIST(geo_point)`.

See `Y0a-schema-core.md §Tickets (FTS extensions)` and `Y0d-schema-geo.md §ticket_geodata`.
