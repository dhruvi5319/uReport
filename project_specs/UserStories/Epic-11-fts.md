## Epic 11: PostgreSQL Full-Text Search — Solr Replacement (F11)

Full-text search across tickets is migrated from Apache Solr to PostgreSQL tsvector/tsquery with GIN indexes, delivering equivalent search behavior with sub-500 ms response times and highlighted keyword snippets.

---

### US-11.1: Search Tickets with PostgreSQL Full-Text Search
**As a** Marcus Rivera (311 Operator), **I want to** search tickets using the same fields I could search before (description, address, reporter name, category, ticket ID), **so that** the Solr replacement is transparent and my search workflows are uninterrupted.

**Acceptance Criteria:**
- [ ] `GET /api/tickets?q={term}` performs full-text search using `search_vector @@ plainto_tsquery('english', :q)`
- [ ] Search vector covers (with weights): ticket ID (A), description (B), location/address (B), reporter last name (C), reporter first name (C), category name (C)
- [ ] Results are ordered by relevance: `ts_rank_cd(search_vector, query) DESC`, then `enteredDate DESC`
- [ ] Empty or blank `q` returns the full unfiltered list (no FTS filter applied)
- [ ] Search term max 255 characters; excess trimmed before passing to `plainto_tsquery`
- [ ] Multi-word queries apply AND semantics; no special query syntax is exposed to users
- [ ] Full-text search query P95 ≤ 500 ms at up to ~100K tickets (GIN index required)

**Priority:** P0 | **Feature Ref:** F11

---

### US-11.2: See Highlighted Keyword Matches in Search Results
**As a** Marcus Rivera (311 Operator), **I want to** see the matching portion of the ticket description highlighted in the search results list, **so that** I can immediately confirm that the right case was found without opening each one.

**Acceptance Criteria:**
- [ ] API response includes a `searchSnippet` field (PostgreSQL `ts_headline` output) for each search result
- [ ] `ts_headline` configuration: MaxWords=30, MinWords=10, StartSel=`<mark>`, StopSel=`</mark>`
- [ ] React renders the `searchSnippet` field using sanitized HTML (`DOMPurify` applied) in the description column
- [ ] `<mark>` elements visually highlight matching terms in the case list description column
- [ ] When search is cleared, `<mark>` highlighting disappears and normal description text renders

**Priority:** P0 | **Feature Ref:** F11

---

### US-11.3: Search and Filter Can Be Combined
**As a** Diane Kowalski (Department Field Supervisor), **I want to** apply a text search AND department/status filters simultaneously, **so that** I can find "pothole" cases that are specifically open and assigned to my department.

**Acceptance Criteria:**
- [ ] When both `q` and filter parameters (`status`, `department_id`, etc.) are present, both conditions are applied with AND semantics
- [ ] SQL: `WHERE search_vector @@ plainto_tsquery('english', :q) AND status = :status AND ...`
- [ ] Active filter chips and search term coexist without clearing each other
- [ ] Saving a search bookmark with both a search term and active filters preserves the full URL query string

**Priority:** P0 | **Feature Ref:** F11

---

### US-11.4: Search Vector Auto-Maintained by Database Trigger
**As a** Jordan Calloway (System Administrator), **I want to** know that the `search_vector` column on tickets is automatically kept up to date by a database trigger, **so that** search results are always current without requiring manual re-indexing jobs (unlike Solr).

**Acceptance Criteria:**
- [ ] A PostgreSQL trigger `update_search_vector` fires on BEFORE INSERT OR UPDATE of `tickets`
- [ ] Trigger updates `tickets.search_vector` by joining to `people` (reporter) and `categories` to include all weighted fields
- [ ] GIN index `idx_tickets_search_vector ON tickets USING GIN (search_vector)` is created by Flyway migration `V2__search_vector.sql`
- [ ] No external indexing job or cron task is required to keep search current
- [ ] When a reporter's name changes in the `people` table, the corresponding `search_vector` entries are updated (via trigger or batch job)
- [ ] Flyway ensures the GIN index exists before the application goes live

**Priority:** P0 | **Feature Ref:** F11

---
