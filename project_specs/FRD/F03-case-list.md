---

## F3: Case List with Search, Filtering, and Sorting

**Priority:** P0 — Critical

### Description

The case list is the primary staff workspace. It is a sortable, filterable, paginated data table of tickets with status badge pills, multi-column filter panel, live search with debounce, filter chips, and bulk selection. It replaces the PHP-rendered table with a fully interactive React data grid backed by PostgreSQL full-text search. Staff access it at route `/cases`.

### Terminology

- **Filter panel** — A collapsible left or top panel with filter controls (dropdowns, date pickers, checkboxes) for narrowing the ticket list.
- **Filter chip** — A small pill tag showing an active filter with an individual "×" remove button.
- **Sort column** — Clicking a column header toggles ascending/descending sort on that column.
- **Skeleton loader** — Animated placeholder rows shown while data is loading (shadcn/ui Skeleton).
- **Empty state** — A full-area graphic/message shown when no tickets match the current filters and search.
- **Bulk selection** — Checkbox column allowing multiple tickets to be selected for batch operations.
- **Bookmark** — A saved search/filter combination persisted to the `bookmarks` table for the current user.
- **Debounce** — Search input waits 300 ms after the user stops typing before issuing the API call.

### Sub-features

- Sortable column headers (case ID, date, category, department, assignee, status, location)
- Multi-column filter panel (status, substatus, category group, category, department, assignee, date range, issue type)
- Status badge pills (color-coded: open=blue, closed-resolved=green, closed-duplicate=gray, closed-bogus=red)
- Live search with 300 ms debounce
- Highlighted keyword matches in description and reporter name
- Filter chips with individual remove buttons
- Bulk selection (checkbox per row + select-all header checkbox)
- Bulk actions: assign, close, change status
- Skeleton loading placeholders during fetch
- Empty state with "No cases match your filters" guidance
- Pagination with configurable page size (10, 25, 50, 100)
- Saved search / bookmark creation and management
- Export results (CSV format)

### Process — Loading the List

1. Staff navigates to `/cases` (authenticated route).
2. React reads current URL query parameters to initialize filter state (supports bookmarkable/shareable filter URLs).
3. React issues `GET /api/tickets` with current filter, sort, search, and page parameters.
4. While fetching: skeleton loader rows are shown (5 placeholder rows).
5. On response: ticket rows render with status badge pills and all column data.
6. If zero results: empty state component renders.

### Process — Live Search

1. Staff types in the search input field.
2. After 300 ms of inactivity (debounce), React issues `GET /api/tickets?q={term}&...` with current filters preserved.
3. Response includes highlighted `ts_headline` snippet for matching description text.
4. Keyword matches are highlighted in description and reporter name columns using `<mark>` elements.

### Process — Filtering

1. Staff opens the filter panel (button or collapsible panel).
2. Staff selects filter values (dropdowns, date range pickers, checkboxes).
3. Each filter change is immediately reflected as a filter chip above the table.
4. Filter chip "×" removes that filter and re-fetches.
5. "Clear all filters" button removes all filters at once.
6. Filter state is encoded in the URL query string (React Router) for bookmarkability.

### Process — Bulk Operations

1. Staff selects tickets via checkboxes (or "Select all on this page" header checkbox).
2. Bulk action toolbar appears with available actions: Assign, Close, Change Status.
3. Staff selects action; a dialog appears for action-specific input (e.g., assignee selector, substatus).
4. On confirm: system sends `POST /api/tickets/bulk` with selected IDs and action details.
5. System applies action to each ticket (see F1 §Bulk Operations Process).
6. Case list refreshes; toast shows "X cases updated successfully".

### Process — Save Search / Bookmark

1. Staff clicks "Save Search" button after configuring filters/search.
2. A dialog prompts for a bookmark name.
3. System saves a `bookmarks` record: `person_id = current user`, `type = 'search'`, `name = entered name`, `requestUri = current URL query string`.
4. Saved searches appear in a "Saved Searches" dropdown for quick recall.

### Inputs (Query Parameters for GET /api/tickets)

| Parameter | Type | Description |
|---|---|---|
| `q` | string | Full-text search term |
| `status` | string | `open` or `closed` |
| `substatus_id` | integer | Substatus filter |
| `category_id` | integer | Category filter |
| `categoryGroup_id` | integer | Category group filter |
| `department_id` | integer | Department filter |
| `assignedPerson_id` | integer | Assignee filter |
| `issueType_id` | integer | Issue type filter |
| `start_date` | date | `enteredDate >=` filter (YYYY-MM-DD) |
| `end_date` | date | `enteredDate <=` filter (YYYY-MM-DD) |
| `sort` | string | Column name to sort by |
| `dir` | string | `asc` or `desc` |
| `page` | integer | Page number (1-based) |
| `pageSize` | integer | Items per page (10/25/50/100) |

### Sortable Columns

| Column | DB Field |
|---|---|
| Case ID | `tickets.id` |
| Date Submitted | `tickets.enteredDate` |
| Category | `categories.name` |
| Department | `departments.name` |
| Assignee | `people.lastname` (assignee) |
| Status | `tickets.status` |
| Location | `tickets.location` |

### Outputs

- Paginated list of ticket rows with columns: Case ID, Date, Category, Department, Assignee, Status badge, Location
- Filter chips showing active filters
- Total count indicator ("Showing X–Y of Z cases")
- Pagination controls (prev/next + page number buttons)
- Search term highlighted in description/reporter columns

### Status Badge Colors

| Status | Substatus | Badge Color / Style |
|---|---|---|
| open | any | Blue pill |
| closed | Resolved | Green pill |
| closed | Duplicate | Gray pill |
| closed | Bogus | Red pill |
| closed | (other) | Purple pill |

### Validation

- Search term: max 255 characters; special characters are escaped before passing to tsquery.
- Date filters: `start_date` must be ≤ `end_date` when both provided.
- `pageSize` must be one of [10, 25, 50, 100].
- Sort column values are validated against whitelist; unknown sort column defaults to `enteredDate DESC`.

### Error States

| Scenario | HTTP Status | User Behavior |
|---|---|---|
| API error on load | 500 | Error toast; retry button shown |
| Zero results | 200 | Empty state component rendered |
| Invalid filter combo | 400 | Inline validation message on filter |
| Bulk action partial failure | 207 | Toast shows "X succeeded, Y failed" |
| Export empty result set | 400 | Toast "No cases to export" |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/tickets` | Paginated filtered ticket list |
| POST | `/api/tickets/bulk` | Bulk operations |
| GET | `/api/tickets/export` | CSV export |
| GET | `/api/bookmarks` | List user's saved searches |
| POST | `/api/bookmarks` | Create saved search |
| DELETE | `/api/bookmarks/{id}` | Delete saved search |

### Schema Surface

- `tickets` — main query target with `search_vector` tsvector column
- `bookmarks` — saved search persistence
- `ticket_history` — not queried on list; used in detail
