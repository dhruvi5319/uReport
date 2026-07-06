# Screen-06: Search Results

**Route:** `/cases?q={term}&...` (search is embedded in the Case List view)
**Purpose:** Live full-text search with highlighted keyword matches, filter chip combination, empty state
**User Stories:** US-3.1, US-11.1, US-11.2, US-11.3
**Journeys:** JRN-01.2 (Search, Refine, Identify stages)

---

## Layout — Search Active State (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR + SIDEBAR                                                            │
│ Breadcrumb: Cases > Search: "maria santos"                                  │
├──────────────┬──────────────────────────────────────────────────────────────┤
│ SIDEBAR      │  Cases                                                       │
│              │                                                              │
│              │  ┌──────────────────────────────────────────────────────┐  │
│              │  │🔍 [maria santos                               ×]      │  │
│              │  │                                         [Filters ▼]  │  │
│              │  └──────────────────────────────────────────────────────┘  │
│              │                                                              │
│              │  ACTIVE FILTER CHIPS                                         │
│              │  [Search: "maria santos" ×]  [Address: Elm Ave ×]           │
│              │  [Clear all filters]                                         │
│              │                                                              │
│              │  Showing 1 of 3 cases (search results)                      │
│              │                                                              │
│              │  ┌──┬──────┬──────────────────────────────────┬──────────┐ │
│              │  │☐ │ ID   │ Description / Reporter            │ Status   │ │
│              │  │──│──────│──────────────────────────────────│──────────│ │
│              │  │☐ │#4892 │ Reported by: Maria Santos        │ [OPEN]   │ │
│              │  │  │      │ "Broken streetlight on           │          │ │
│              │  │  │      │  <mark>Elm Avenue</mark> near    │ Jul 4    │ │
│              │  │  │      │  Oak Street. Light has been      │ Streetlt │ │
│              │  │  │      │  out for 2 weeks."               │ Electric │ │
│              │  └──┴──────┴──────────────────────────────────┴──────────┘ │
│              │                                                              │
│              │  [← Prev]  Page 1 of 1  [Next →]    [10 per page ▼]        │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

---

## Search-Specific Column Behavior

When search is active, the **Description** column expands to show the `ts_headline` snippet:

```
Normal (no search):
┌───────────────────────────────────────────────────────────────────┐
│ #4892  │ Streetlight │ Electric Dept │ Santos, M. │ [OPEN] │ Elm  │
└───────────────────────────────────────────────────────────────────┘

Search active ("elm avenue"):
┌─────────────────────────────────────────────────────────────────────────┐
│ #4892 — Streetlight — Maria Santos — [OPEN] — Jul 4                    │
│                                                                         │
│ "Broken streetlight on <mark>Elm Avenue</mark> near Oak Street. Light   │
│  has been out for two weeks causing traffic concerns..."                 │
│                                                                         │
│ Reporter: <mark>Maria Santos</mark>   Location: <mark>Elm Ave</mark>    │
└─────────────────────────────────────────────────────────────────────────┘
```

- `<mark>` elements: `background-color: yellow` (light mode) / `background-color: #854d0e` (dark mode)
- Sanitized via DOMPurify before rendering (XSS prevention)
- Multiple matches per snippet: all highlighted
- When search is cleared: `<mark>` elements removed; normal description column resumes

---

## Search Input Behavior

| Event | Behavior |
|---|---|
| User types | Skeleton rows appear after first keypress (before debounce) |
| 300 ms inactivity | API call fires; results update |
| Enter key | Same as 300 ms debounce (immediate) |
| "×" in search box | Search cleared; full list returns; other filters preserved |
| Cmd+K / Ctrl+K | Focus jumps to search input from anywhere on the page |
| 255+ characters typed | Input truncates silently (browser maxlength) |

---

## Combined Search + Filter State

```
FILTER CHIPS ROW (when both search and filters active):
[Search: "pothole" ×]  [Status: Open ×]  [Dept: Public Works ×]  [Clear all]
```

- Search term chip and filter chips coexist
- Removing one does not clear the others
- URL encodes both: `/cases?q=pothole&status=open&department_id=3`
- "Clear all filters" removes ALL chips including search

---

## Skeleton State During Search (300 ms debounce)

```
┌──────────────────────────────────────────────────────┐
│ [🔍 maria santos ...]                                 │
│                                                      │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  ← shimmer row 1
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  ← shimmer row 2
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  ← shimmer row 3
└──────────────────────────────────────────────────────┘
```

Skeleton appears instantly on keypress — the user sees visual feedback before results arrive.

---

## Empty State (Zero Search Results)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              [Magnifying glass illustration]                │
│                                                             │
│         No cases match "pterodactyl report"                 │
│                                                             │
│   Try a different search term or adjust your filters.       │
│                                                             │
│   [Clear search]          [Clear all filters]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Shows the actual search term in the empty state message
- "Clear search" removes only the search term (preserves filters)
- "Clear all filters" removes everything

---

## Saved Search Integration

```
SAVE SEARCH BUTTON (visible when search or filters are active):
[💾 Save Search]

CLICK → Dialog:
┌──────────────────────────────────────────┐
│  Save this search                        │
│  ────────────────────────────────────    │
│  Search name                             │
│  [Maria Santos - Elm Ave streetlight]    │
│                                          │
│  This will save: q=maria santos,         │
│  address=Elm Ave                         │
│                                          │
│  [Cancel]              [Save Search]     │
└──────────────────────────────────────────┘

SAVED SEARCHES DROPDOWN:
[📚 Saved Searches ▼]
  Maria Santos - Elm Ave streetlight  [×]
  My Dept Open Cases                  [×]
  Overdue Potholes                    [×]
```

---

## Mobile Search Layout (375 px)

```
┌────────────────────────────────┐
│ [🔍 Search...         ×]       │
│ [Filters ▼]                    │
│                                │
│ [Search: "elm ave" ×]          │
│ [Clear all]                    │
│                                │
│ 1 result                       │
│                                │
│ ┌──────────────────────────┐  │
│ │ #4892 — Streetlight      │  │
│ │ [OPEN]  Jul 4            │  │
│ │ Reporter: Maria Santos   │  │
│ │ "Broken streetlight on   │  │
│ │  Elm Avenue near Oak..." │  │
│ │ (mark highlighted)       │  │
│ └──────────────────────────┘  │
└────────────────────────────────┘
```

- Card layout on mobile (same as Case List mobile)
- Search snippet visible within the card
- `<mark>` highlighting preserved in card view

---

## States

| State | Appearance |
|---|---|
| No search term | Normal case list; no filter chip for search |
| Typing (< 300 ms) | Skeleton rows immediately; previous results still visible underneath |
| Loading (API call) | Skeleton rows; spinner in search input right side |
| Results returned | Rows with `<mark>` highlights; count updated |
| Zero results | Empty state component |
| Search cleared | Normal list resumes; marks disappear; count resets |
| API error | Error toast; previous results preserved |

---

*End of Screen-06-search-results.md*
