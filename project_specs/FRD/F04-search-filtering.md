---

## F04: Full-Text Search & Filtering

**Description:** Staff can search across all tickets using keywords and apply multi-dimensional filters to narrow results. Apache Solr powers the full-text index and geo-spatial clustering. The search system is the primary way staff navigate the ticket queue; it supports CSV export, print rendering, saved bookmarks, and a map visualization mode.

**Terminology:**
- **Solr Index:** The Apache Solr search index that mirrors ticket fields for fast full-text and faceted queries.
- **Facet:** A Solr-computed count breakdown by a dimension (e.g., tickets per status, per category).
- **Sort:** The ordering of results — by date (default desc), SLA status, assignee, category, etc.
- **Bookmark:** A saved search filter state per user (see F12).
- **Export:** Download of search results as a CSV file.
- **Cluster:** A geo-density group of tickets for map visualization (see F05).

**Sub-features:**
- Keyword full-text search
- Filter by status, substatus, category, department, assignee, date range, location
- Sort results (date, SLA, assignee, etc.)
- Paginate results
- Map view of results with geo-clustering (see F05)
- CSV export of current result set
- Print-friendly rendering
- Saved search bookmarks (see F12)
- Solr index synchronization on ticket mutations

---

### F04 Process: Execute Search

1. Client submits search request with optional `q` (keyword) and filter parameters.
2. System builds a Solr query: full-text match on `q` (if provided) across indexed fields (title, description, responses, address).
3. System applies filter facets: status, categoryId, departmentId, assigneeId, substatusId, dateRange, geoBox/radius.
4. System executes Solr query; retrieves matching ticket IDs and computed facet counts.
5. System loads full ticket records from MySQL for the current page (ID-based lookup, not full Solr payload).
6. System returns paginated result list with facet counts and pagination meta.

### F04 Process: CSV Export

1. Client requests export with same filter parameters plus `export=csv`.
2. System executes Solr query without page size cap (up to a configurable maximum, default 5000 rows).
3. System streams CSV response with headers: `Content-Disposition: attachment; filename="tickets.csv"`.
4. CSV columns: Ticket ID, Title, Status, Substatus, Category, Department, Assignee, Reporter, Address, Date Opened, Date Closed, SLA Days, Late.
5. Response is `text/csv` format.

### F04 Process: Solr Index Sync

1. Any ticket create/update/close/reopen/delete triggers an async Solr index update.
2. System calls Solr update API with the full document for the ticket.
3. On delete, system removes the document from Solr.
4. A full re-index CLI command must be available for recovery.

---

### F04 Inputs

- `q` (string, optional): Keyword search string (max 500 chars)
- `status` (enum, optional): `open` | `closed`
- `substatusId` (integer, optional): Filter by specific substatus
- `categoryId` (integer or array, optional): One or more category IDs
- `departmentId` (integer or array, optional): One or more department IDs
- `assigneeId` (integer, optional): Filter by assignee person ID
- `reporterEmail` (string, optional): Filter by reporter email
- `dateFrom` (ISO 8601 date, optional): Opened on or after
- `dateTo` (ISO 8601 date, optional): Opened on or before
- `lat` (decimal, optional): Geo center latitude
- `lng` (decimal, optional): Geo center longitude
- `radius` (integer, optional): Radius in meters
- `bbox` (string, optional): Bounding box `minLat,minLng,maxLat,maxLng`
- `sort` (string, optional): `date_desc` (default) | `date_asc` | `sla_asc` | `assignee` | `category`
- `page` (integer, optional, default 1)
- `perPage` (integer, optional, default 25, max 100)
- `export` (string, optional): `csv` to trigger export mode

---

### F04 Outputs

**Search result envelope:**
```json
{
  "data": [{ ticket objects }],
  "meta": {
    "total": 342,
    "page": 1,
    "perPage": 25,
    "pages": 14,
    "facets": {
      "status": { "open": 280, "closed": 62 },
      "category": { "1": 45, "2": 30 },
      "department": { "3": 120 }
    }
  },
  "errors": []
}
```

**CSV export:** `text/csv` file with columns as listed in process above.

---

### F04 Validation

- `q` max 500 characters; HTML and script tags stripped before Solr query
- `status` must be `open` or `closed` if provided
- `dateFrom` and `dateTo` must be parseable ISO 8601 dates
- `dateFrom` must be ≤ `dateTo` if both provided
- `lat`/`lng` must be valid coordinate ranges; `radius` must be positive integer
- `bbox` must be exactly 4 comma-separated decimals in correct order
- `perPage` capped at 100 for list view, 5000 for CSV export
- Caller must have at minimum anonymous access; staff-only categories are excluded from results for non-staff callers

---

### F04 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Solr unavailable | 503 | SEARCH_UNAVAILABLE | "Search service is temporarily unavailable" |
| Invalid date format | 422 | INVALID_DATE | "Date must be ISO 8601 format (YYYY-MM-DD)" |
| Invalid `bbox` format | 422 | INVALID_BBOX | "Bounding box must be minLat,minLng,maxLat,maxLng" |
| `dateFrom` after `dateTo` | 422 | INVALID_DATE_RANGE | "Start date must be before end date" |
| Export exceeds row cap | 413 | EXPORT_TOO_LARGE | "Export exceeds maximum 5000 rows; refine filters" |

---

### F04 API Surface (this feature)

Full schemas: see `Y1a-api-tickets.md` §Search.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tickets` | Any (role-filtered) | Search/list tickets |
| GET | `/api/tickets?export=csv` | staff/admin | CSV export |
| GET | `/api/tickets/clusters` | Any (role-filtered) | Geo-cluster data for map view |

---

### F04 Schema Surface (this feature)

Reads `tickets`, `categories`, `departments`, `people`, `ticket_geodata`. Solr index is the primary search engine; MySQL is used for full record hydration. Writes to Solr on every ticket mutation. No new tables.
