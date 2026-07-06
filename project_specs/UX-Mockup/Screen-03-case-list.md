# Screen-03: Case List

**Route:** `/cases`
**Purpose:** Primary staff workspace — sortable, filterable, searchable data table with bulk operations
**User Stories:** US-3.1–3.6, US-1.5, US-11.1–11.3
**Journeys:** JRN-01.1 (Confirm), JRN-01.2 (all), JRN-01.3 (all), JRN-02.1 (View Cases, Prioritize)

---

## Layout — Desktop (1280 px+)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR + SIDEBAR                                                            │
├──────────────┬──────────────────────────────────────────────────────────────┤
│ SIDEBAR      │  Cases                     Breadcrumb: Cases                 │
│              │  ─────────────────────────────────────────────────────────   │
│              │  TOOLBAR ROW 1                                               │
│              │  [🔍 Search cases...         ]  [⚙ Filters ▼]  [📥 Export]  │
│              │  [💾 Save Search]  [Saved Searches ▼]                        │
│              │                                                              │
│              │  FILTER CHIPS (when active)                                  │
│              │  [Status: Open ×]  [Dept: Public Works ×]  [Clear all]       │
│              │                                                              │
│              │  BULK ACTION TOOLBAR (visible when ≥1 row selected)          │
│              │  ┌──────────────────────────────────────────────────────┐   │
│              │  │  ✓ 33 cases selected  [Assign] [Change Status][Close]│   │
│              │  └──────────────────────────────────────────────────────┘   │
│              │                                                              │
│              │  Showing 1–25 of 142 cases                                  │
│              │                                                              │
│              │  DATA TABLE                                                  │
│              │  ┌──┬──────┬──────────┬──────────┬────────┬──────┬───────┐ │
│              │  │☐ │ ID   │ Date     │ Category │  Dept  │ Assi │Status │ │
│              │  │──│──────│──────────│──────────│────────│──────│───────│ │
│              │  │☐ │#5102 │ Jul 6    │ Pothole  │ Pub Wk │ —    │[OPEN] │ │
│              │  │☐ │#5101 │ Jul 6    │ Graffiti │ Parks  │ Kim  │[OPEN] │ │
│              │  │☑ │#5100 │ Jul 5    │ Tree Down│ Pub Wk │Jones │[OPEN] │ │ ← selected row (blue tint)
│              │  │☐ │#5099 │ Jul 5    │ Streetlt │ Elect  │ Lee  │[CLSD] │ │
│              │  │  │      │          │ ... 21 more rows ...         │      │ │
│              │  └──┴──────┴──────────┴──────────┴────────┴──────┴───────┘ │
│              │                                                              │
│              │  PAGINATION                                                  │
│              │  [← Prev]  [1] [2] [3] ... [6]  [Next →]    [25 per page▼] │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

---

## Layout — Filter Panel (expanded, overlays or pushes table on desktop)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Filters                                                      [×]    │
│  ──────────────────────────────────────────────────────────────      │
│  Status        [Open ▼]                                              │
│  Substatus     [All ▼]                                               │
│  Category Group [All ▼]                                              │
│  Category      [All ▼]                                               │
│  Department    [Public Works ▼]                                      │
│  Assignee      [All ▼]                                               │
│  Issue Type    [All ▼]                                               │
│  Date From     [MM/DD/YYYY]    Date To  [MM/DD/YYYY]                 │
│                                                                      │
│  [Clear All Filters]                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Mobile (375 px)

```
┌────────────────────────────────┐
│ NAVBAR (hamburger)             │
├────────────────────────────────┤
│ [🔍 Search...    ] [Filters ▼] │
│                                │
│ [Status: Open ×] [Clear all]   │
│                                │
│ Showing 1–10 of 142            │
│                                │
│ ┌──────────────────────────┐  │
│ │ #5102 — Pothole          │  │  ← card layout (no table on mobile)
│ │ Public Works  Jul 6      │  │
│ │ Reporter: Santos         │  │
│ │ [OPEN]  2m ago           │  │
│ └──────────────────────────┘  │
│ ┌──────────────────────────┐  │
│ │ #5101 — Graffiti         │  │
│ │ Parks Dept   Jul 6       │  │
│ │ Reporter: Kim            │  │
│ │ [OPEN]  15m ago          │  │
│ └──────────────────────────┘  │
│  ... (10 cards total)         │
│                               │
│ [← Prev]  Page 1 of 15  [Next→]│
└────────────────────────────────┘
```

---

## Column Definitions

| Column | Sortable | Mobile visible | Notes |
|---|---|---|---|
| ☐ (checkbox) | — | Hidden (bulk select N/A on mobile) | Select All on page via header |
| Case ID | ✓ | Card title | JetBrains Mono; link to `/cases/{id}` |
| Date Submitted | ✓ | Card subtitle | Formatted: "Jul 6, 2026" |
| Category | ✓ | Card line | Category name |
| Department | ✓ | Card line | Department name |
| Assignee | ✓ | Card line | Last name or "—" if unassigned |
| Status | ✓ | Card badge | Color-coded pill (see below) |
| Location | ✓ | Hidden (collapsed on mobile) | Address text |

---

## Status Badge Colors

| Status | Substatus | Badge | CSS class |
|---|---|---|---|
| open | any | `OPEN` | `bg-blue-100 text-blue-800` |
| closed | Resolved | `RESOLVED` | `bg-green-100 text-green-800` |
| closed | Duplicate | `DUPLICATE` | `bg-gray-100 text-gray-700` |
| closed | Bogus | `BOGUS` | `bg-red-100 text-red-700` |
| closed | other | `CLOSED` | `bg-purple-100 text-purple-800` |
| open, overdue | — | `OVERDUE` badge (separate, red) | `bg-red-500 text-white` |

---

## Search Behavior

- Search input is in the toolbar — always visible above the table
- 300 ms debounce after last keypress
- Skeleton rows appear immediately on keypress (before debounce fires)
- `<mark>` highlighting on matched text in Description/Reporter column (from `ts_headline`)
- Search term encoded in URL: `/cases?q=maria+santos`
- Clearing search: "×" button inside search input; restores unfiltered list

---

## Skeleton Loading State

```
┌──┬──────────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│  │░░░░░░░░░░│░░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│
│  │░░░░░░░░░░│░░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│
│  │░░░░░░░░░░│░░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│
│  │░░░░░░░░░░│░░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│
│  │░░░░░░░░░░│░░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│
└──┴──────────┴───────────┴──────────┴──────────┴──────────┴──────────┘
5 skeleton rows, shimmer animation, column widths preserved
```

---

## Empty State

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              [Empty mailbox illustration]                   │
│                                                             │
│           No cases match your filters                       │
│                                                             │
│   Try adjusting your search or clearing some filters.       │
│                                                             │
│              [Clear all filters]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Bulk Action Toolbar (appears on ≥1 selection)

```
┌─────────────────────────────────────────────────────────────────┐
│  ☑  33 cases selected         [Assign]  [Change Status]  [Close] │
└─────────────────────────────────────────────────────────────────┘
```

- Slides up with Framer Motion (200 ms) when first checkbox selected
- Slides down when all checkboxes cleared
- "X cases selected" counter updates live with each checkbox change
- Selected rows have `bg-blue-50 dark:bg-blue-900/20` tint

---

## Saved Searches

| Action | Behavior |
|---|---|
| "Save Search" button visible when | search term or filters are active |
| Click "Save Search" | Dialog prompts for bookmark name |
| "Saved Searches ▼" dropdown | Lists user's bookmarks; click recalls filter state |
| Delete bookmark | "×" next to each saved search in dropdown |
| Toast on save | "Search saved" |

---

## States Summary

| State | Appearance |
|---|---|
| Loading | 5 skeleton rows; toolbar disabled |
| Default (no search/filter) | Full table; all rows |
| Search active | `<mark>` highlights; skeleton on debounce |
| Filters active | Filter chips above table |
| Row(s) selected | Blue tint; bulk toolbar visible |
| Empty | Empty state illustration |
| API error | Error toast + "Retry" button |
| Export loading | Button shows spinner; disabled |

---

*End of Screen-03-case-list.md*
