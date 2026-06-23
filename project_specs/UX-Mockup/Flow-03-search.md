---

### Flow 03: Search, Filter, Export, and Map View

**Trigger:** Dana or Marcus lands on /tickets or clicks a filter badge from the dashboard  
**User Stories:** US-4.1, US-4.2, US-5.2, US-12.1, US-12.2  
**Personas:** Dana (PER-01), Marcus (PER-02)  
**Journey:** JRN-01.1 (Recall Saved Queue, Prioritize), JRN-02.1 (Drill into SLA Breaches)

```
[/tickets — Ticket List Page]
    │
    ├─▶ [KEYWORD SEARCH]
    │       Search bar at top (always visible)
    │       Queries Solr full-text: title, description, responses, address
    │       Results update with debounce (300ms)
    │       │
    │       └── Solr unavailable ──▶ [banner: "Search temporarily unavailable. Showing all tickets."]
    │                                  HTTP 503 SEARCH_UNAVAILABLE
    │
    ├─▶ [FILTER PANEL — collapsible sidebar on desktop; bottom sheet on mobile]
    │       Status: Open | Closed | All
    │       Substatus: dropdown (multiselect)
    │       Category: grouped multiselect
    │       Department: multiselect
    │       Assignee: person search
    │       Date range: from/to date pickers
    │       Reporter email: text input
    │       │
    │       ├── dateFrom > dateTo ──▶ [inline: "Start date must be before end date"]
    │       └── Apply Filters button → URL params update; results refresh
    │
    ├─▶ [SORT CONTROLS — above results list]
    │       Sort by: Date (newest first ▼) | Date (oldest) | SLA urgency | Assignee | Category
    │       Default: date_desc
    │
    ├─▶ [SAVED BOOKMARKS — US-12.1, US-12.2]
    │       "Bookmarks" dropdown in filter bar
    │       Shows up to 50 personal bookmarks
    │       "Save current filters" button → name prompt (modal)
    │       Clicking a bookmark → instantly restores all filter + sort state
    │       │
    │       ├── Duplicate bookmark name ──▶ [422: "You already have a bookmark with this name"]
    │       └── Bookmark limit ──────────▶ [422: "Bookmark limit reached (50). Delete one to save."]
    │
    ├─▶ [VIEW TOGGLE — List | Map]
    │       Toggle button in results toolbar
    │       Map view → /map with same filters applied (see Screen-10)
    │       List view is default
    │
    ├─▶ [CSV EXPORT — US-4.2]
    │       "Export CSV" button (staff/admin only — hidden for public role)
    │       Triggers GET /api/tickets?export=csv with current filters
    │       Browser downloads tickets.csv
    │       │
    │       ├── > 5000 rows ──▶ [413: "Export too large. Refine your filters to under 5000 results."]
    │       └── Success ──────▶ [download starts; toast: "Downloading tickets.csv"]
    │
    └─▶ [RESULT CLICK]
            Click any ticket row → navigates to /tickets/:id (Ticket Detail)
```

**Facet sidebar content (informational, not actionable):**
After results load, the filter panel displays facet counts:
- Status: Open (280) / Closed (62)
- Top 5 categories with ticket counts
- Top 5 departments with ticket counts

These update in real-time when filters change, giving Marcus a quick workload distribution view.

**SLA urgency indicators in list view:**
- `sla-breach` (red) — ticket is past its expected close date
- `sla-warning` (amber) — ticket closes within 24 hours
- `sla-ok` (green) — within SLA window
- No badge — category has no SLA (`slaDays = null`)

These badge colors are the mechanism for JRN-01.1 "Prioritize" stage and JRN-02.1 "Drill into SLA Breaches".

**Dashboard shortcut integration (JRN-02.1):**
The dashboard's "3 SLA Breached" badge is a link that pre-populates the ticket list with `status=open&sla=breached&departmentId={manager's dept}` filters — one click from dashboard to filtered overdue list.
