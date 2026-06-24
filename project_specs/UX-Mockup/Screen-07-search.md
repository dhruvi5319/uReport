---

## Screen SCR-10: Search Interface

**Purpose:** Full-text keyword search across all ticket fields; integrated with the main ticket list filter panel. Standalone search view for advanced queries.
**User Stories:** US-11.1, US-11.2, US-11.3, US-0.8
**Journey:** JRN-01.1 Stage 3

**Note:** Ticket search is integrated into SCR-02 (Ticket List) via the filter bar. This screen documents the advanced search affordances and export flows.

### Search Entry Points

| Entry Point | Location | Behavior |
|-------------|----------|---------|
| Global search bar | Top header | Full-text keyword search; navigates to ticket list with `?q=` param |
| Filter bar (SCR-02) | Ticket list | Inline filters; no separate page navigation |
| People search | People Directory (SCR-05) | Searches people directory |

### Advanced Search Panel

The filter bar in SCR-02 supports all search parameters. "More ▾" expands additional filters:

```
BASIC FILTERS (always visible):
  Status: [open ▾]   Category: [Pothole Repair ▾]   Dept: [Streets ▾]
  Assigned To: [Marcus Webb ▾]   Keyword: [_____________]

ADVANCED FILTERS (expanded via "More ▾"):
  ─────────────────────────────────────────────────────────
  Entered From: [2026-01-01]   To: [2026-06-24]
  Closed From:  [__________]   To: [__________]
  Substatus:    [In Progress ▾]
  Contact Method: [Phone ▾]     Issue Type: [Complaint ▾]
  API Client:   [Integra ▾]
  ─────────────────────────────────────────────────────────
  LOCATION SEARCH
  City: [Springfield]   ZIP: [62701]
  Radius (meters): [500]  Center Lat: [__]  Long: [__]
  ─────────────────────────────────────────────────────────
  Entered By: [_______]
```

### Search Results Layout

Results display in SCR-02 ticket list. Key behaviors:
- Results update on filter change (debounced 300ms for text fields)
- URL updates with full filter state (bookmarkable / shareable)
- Total result count shown: "147 tickets"
- Pagination: 25 per page default; configurable

### Map View (US-11.3)

```
[List ⊞] [Map 🗺]  ← Toggle in results header

MAP VIEW:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   [12]                                              │  ← Cluster bubble
│       [3]  [1]  [8]                                 │
│                                                     │
│         [25]                                        │
│                                                     │
└─────────────────────────────────────────────────────┘
Zoom in → clusters split into individual pins
Click pin → Ticket Detail (slide-over or navigate)
```

Map clusters use `ticket_geodata.cluster_id_{level}` data (F15, US-15.2).

### Export (US-0.8, US-18.2)

```
[Export ▾]
  ├── CSV (GET /api/v1/tickets?format=csv&[active filters])
  └── Print View (GET /api/v1/tickets?format=print&[active filters])
```

- Export applies all currently active filters
- Staff only (403 returned for non-staff; Export button hidden for non-staff)
- Export of up to 200 tickets completes within 10 seconds (US-0.8)
- CSV: opens browser download
- Print: opens new tab with print-formatted HTML; browser print dialog auto-triggered

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| No keyword | All tickets matching structural filters shown | — |
| Keyword entered | FTS results sorted by relevance | Results count updates |
| No results | Empty state | "No tickets match your search. [Clear filters]" |
| Loading | Skeleton rows | — |
| Export loading | Export button spinner | "Preparing export…" |
| Export error | Toast | "Export failed. Try again or reduce result set." |
