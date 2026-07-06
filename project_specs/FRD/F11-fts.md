---

## F11: PostgreSQL Full-Text Search (Solr Replacement)

**Priority:** P0 — Critical

### Description

Full-text search across tickets, people, and addresses is currently powered by Apache Solr. This feature replaces Solr with PostgreSQL `tsvector`/`tsquery` search with GIN indexes, delivering functionally equivalent search behavior. The `tickets` table gains a `search_vector` column maintained by a trigger. Search queries use `ts_headline` for highlighted snippets. Live search with 300 ms debounce is exposed via the internal `/api/tickets` endpoint's `q` parameter.

### Terminology

- **tsvector** — PostgreSQL data type representing a document as a weighted lexeme vector. Stored in `tickets.search_vector`.
- **tsquery** — PostgreSQL query type; constructed from user input using `plainto_tsquery()` (safe, handles arbitrary input without injection risk).
- **GIN index** — Generalized Inverted Index; optimal for tsvector columns. Enables sub-100 ms full-text queries.
- **ts_headline** — PostgreSQL function that returns a snippet of the original text with matching terms highlighted using `<b>` tags (or configurable markers).
- **Weight** — tsvector supports A/B/C/D weights to rank fields by importance. Higher-weighted fields rank higher in results.
- **Trigger** — A PostgreSQL trigger on INSERT/UPDATE of `tickets` maintains `search_vector` automatically.

### Sub-features

- `search_vector` tsvector column on `tickets` table (additive; no existing columns removed)
- GIN index on `search_vector` for query performance
- Database trigger to auto-update `search_vector` on ticket INSERT/UPDATE
- Fields included in search vector (with weights)
- Live search via `/api/tickets?q={term}` with 300 ms debounce
- `ts_headline` snippet returned in API response for highlighted matches
- Search combined with filter panel (AND semantics: search results filtered by active filters)
- Saved search bookmark persistence (see F3)

### Fields Included in Search Vector

| Field | Source Table | Weight | Notes |
|---|---|---|---|
| Ticket ID (as text) | `tickets.id` | A | Exact match on ID |
| Description | `tickets.description` | B | Primary content field |
| Address / Location | `tickets.location` | B | Street address search |
| Reporter last name | `people.lastname` | C | Via JOIN in trigger or indexed view |
| Reporter first name | `people.firstname` | C | |
| Category name | `categories.name` | C | Via JOIN |
| Action notes | (optional) | D | From recent ticket_history entries |

**Implementation note:** The trigger updates `search_vector` by JOINing to `people` (reporter) and `categories` when the ticket is inserted or updated. A separate batch job or trigger also updates `search_vector` when the reporter's name changes.

### tsvector Configuration

```sql
-- Trigger function (conceptual — full SQL in Y0-schema.md)
NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.id::text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(reporter_lastname, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(reporter_firstname, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(category_name, '')), 'C');
```

Language: `'english'` (stemming + stop words for English). Configurable via application property.

### Process — Live Search (Case List)

1. Staff types in the search field in the case list.
2. After 300 ms debounce, React issues `GET /api/tickets?q={term}&{other_filters}`.
3. Spring Boot constructs: `WHERE tickets.search_vector @@ plainto_tsquery('english', :q)`.
4. Results are ordered by: `ts_rank_cd(search_vector, query) DESC, enteredDate DESC`.
5. Response includes `searchSnippet` field (ts_headline output) for each result.
6. React renders `<mark>` tags around highlighted terms in the description column.

### tsquery Construction

- User input is passed to `plainto_tsquery('english', :input)` — this function handles multiple words as AND semantics, ignores stop words, and is safe from injection.
- Multi-word queries: all terms must be present (AND).
- No special query syntax is exposed to users (no `AND`, `OR`, `NOT` operators in input).
- Empty search term: `q` parameter absent or blank → no full-text filter applied; all tickets returned (filtered by other active filters only).

### Search + Filter Combination

When both `q` and filter parameters are present, both conditions are applied with AND semantics:

```sql
WHERE search_vector @@ plainto_tsquery('english', :q)
  AND status = :status
  AND category_id = :categoryId
  -- ... other active filters
ORDER BY ts_rank_cd(search_vector, plainto_tsquery('english', :q)) DESC, enteredDate DESC
```

### ts_headline Configuration

```sql
ts_headline('english', description, query,
    'MaxWords=30, MinWords=10, ShortWord=3, StartSel=<mark>, StopSel=</mark>, HighlightAll=false')
```

The `searchSnippet` field in the API response is this ts_headline output. React renders it using `dangerouslySetInnerHTML` with appropriate XSS sanitization (the output is from our own database and is safe, but DOMPurify is applied as defense in depth).

### GIN Index

```sql
CREATE INDEX idx_tickets_search_vector ON tickets USING GIN (search_vector);
```

This index is created in Flyway migration `V2__search_vector.sql` (separate from the initial schema migration).

### People and Address Search

- Ticket search covers reporter names and location address via the `search_vector` (updated by trigger).
- Dedicated `GET /api/people?q={term}` for the people admin panel uses a simpler `ILIKE` search on firstname, lastname, email (low volume; GIN search not needed).

### Performance Requirements

- Full-text search query P95 ≤ 500 ms under representative data volumes (single-city scale: up to ~100K tickets).
- GIN index must exist before going live; Flyway ensures it is created in migration.

### Saved Search / Bookmark

- When a staff member saves a search (see F3), the URL query string (including `q` and filter params) is stored in `bookmarks.requestUri`.
- Recalling a bookmark reconstructs the URL state; React reads params and re-issues the search.

### Validation

- Search term: max 255 characters; excess trimmed before passing to `plainto_tsquery`.
- `plainto_tsquery` handles all special characters safely; no additional escaping needed beyond the JDBC parameterized query.
- Empty/blank `q` is treated as absent (no FTS filter).

### Error States

| Scenario | HTTP Status | User Behavior |
|---|---|---|
| Empty search results | 200 | Empty state component in case list |
| tsquery parse error (malformed input) | 400 | Toast "Search term is invalid" |
| GIN index missing | — | Fallback to sequential scan (degraded performance, not a visible error) |

### API Surface

| Method | Path | Param | Description |
|---|---|---|---|
| GET | `/api/tickets` | `q` (string) | Full-text search in ticket list |
| GET | `/api/people` | `q` (string) | ILIKE search in people admin |

### Schema Surface

- `tickets.search_vector` — tsvector column (added by Flyway `V2__search_vector.sql`)
- GIN index: `idx_tickets_search_vector ON tickets USING GIN (search_vector)`
- Trigger: `update_search_vector` BEFORE INSERT OR UPDATE ON tickets
