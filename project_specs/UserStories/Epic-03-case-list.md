## Epic 3: Case List with Search, Filtering, and Sorting (F3)

The case list at `/cases` is the primary staff workspace — a sortable, filterable, paginated data grid with live search, filter chips, bulk selection, and saved searches.

---

### US-3.1: Search for a Case Using Live Full-Text Search
**As a** Marcus Rivera (311 Operator), **I want to** type a search term into the case list and see filtered results appear automatically, **so that** I can locate any specific case in under 30 seconds without submitting a separate search form.

**Acceptance Criteria:**
- [ ] A search input field is present above the case list table
- [ ] After 300 ms of inactivity (debounce), the list auto-refreshes with matching results
- [ ] Search covers: ticket ID, description, reporter name, address, category name
- [ ] Matching description text is highlighted with `<mark>` elements (from `ts_headline` API response)
- [ ] Search term of max 255 characters is enforced; excess is trimmed
- [ ] Empty search term returns the full unfiltered list (with other active filters preserved)
- [ ] Skeleton loader rows appear during search fetch
- [ ] Empty state renders "No cases match your filters" when search returns zero results
- [ ] Search state is encoded in the URL query string for shareability

**Priority:** P0 | **Feature Ref:** F3

---

### US-3.2: Filter the Case List by Multiple Criteria
**As a** Diane Kowalski (Department Field Supervisor), **I want to** filter the case list by department, status, and date range simultaneously, **so that** I can immediately see only the open cases assigned to my department without sorting through irrelevant records.

**Acceptance Criteria:**
- [ ] A filter panel exposes controls for: status, substatus, category group, category, department, assignee, date range (start/end), issue type
- [ ] Each applied filter generates a filter chip above the table showing the active value with an "×" remove button
- [ ] Removing a filter chip immediately re-fetches the list with that filter cleared
- [ ] "Clear all filters" button removes all active filters at once
- [ ] Filter state is encoded in the URL query string (bookmarkable, shareable)
- [ ] `start_date` must be ≤ `end_date` when both are provided; inline error shown otherwise
- [ ] Filter changes take effect immediately (no "Apply" button needed)
- [ ] Status badge pills are color-coded: open=blue, closed-resolved=green, closed-duplicate=gray, closed-bogus=red, closed-other=purple

**Priority:** P0 | **Feature Ref:** F3

---

### US-3.3: Sort the Case List by Column
**As a** Marcus Rivera (311 Operator), **I want to** click column headers to sort the case list, **so that** I can prioritize by date submitted, category, or status without building a manual query.

**Acceptance Criteria:**
- [ ] Clicking a column header sorts ascending; clicking again sorts descending
- [ ] Sortable columns: Case ID, Date Submitted, Category, Department, Assignee, Status, Location
- [ ] Active sort column shows a directional arrow indicator
- [ ] Sort state is encoded in URL query parameters (`sort`, `dir`)
- [ ] Unknown sort column value defaults to `enteredDate DESC`
- [ ] Sort and filter state are preserved together in the URL

**Priority:** P0 | **Feature Ref:** F3

---

### US-3.4: Paginate Through the Case List
**As a** Marcus Rivera (311 Operator), **I want to** navigate pages of cases and choose how many results per page, **so that** I can work efficiently through large queues without the browser slowing down.

**Acceptance Criteria:**
- [ ] Pagination controls show: previous, next, and page number buttons
- [ ] Page size selector offers options: 10, 25, 50, 100
- [ ] A "Showing X–Y of Z cases" indicator is displayed above or below the table
- [ ] Page state is encoded in the URL (`page`, `pageSize`)
- [ ] Invalid `pageSize` values default to 10

**Priority:** P0 | **Feature Ref:** F3

---

### US-3.5: Save a Search as a Bookmark for Quick Recall
**As a** Diane Kowalski (Department Field Supervisor), **I want to** save my department's filter configuration as a named bookmark, **so that** I can recall it with one click every time I open the case list instead of re-applying filters each session.

**Acceptance Criteria:**
- [ ] A "Save Search" button is available when filters or a search term are active
- [ ] Clicking "Save Search" opens a dialog prompting for a bookmark name
- [ ] On save, a `bookmarks` record is created: `person_id = current user`, `name = entered name`, `requestUri = current URL query string`
- [ ] Saved searches appear in a "Saved Searches" dropdown for quick recall
- [ ] Recalling a bookmark navigates to the saved URL, restoring all filter and search state
- [ ] Saved searches can be deleted individually
- [ ] Toast "Search saved" confirms the bookmark creation

**Priority:** P0 | **Feature Ref:** F3

---

### US-3.6: Export Case List Results to CSV
**As a** Marcus Rivera (311 Operator), **I want to** export the current filtered case list to CSV, **so that** I can share or process the data outside the application.

**Acceptance Criteria:**
- [ ] An "Export" button is present in the case list toolbar
- [ ] Export applies all current search, filter, and sort parameters
- [ ] Exporting an empty result set shows toast "No cases to export" (HTTP 400)
- [ ] Downloaded file is a valid CSV with column headers matching the table columns
- [ ] Export preserves existing report formats from the PHP implementation

**Priority:** P0 | **Feature Ref:** F3

---
