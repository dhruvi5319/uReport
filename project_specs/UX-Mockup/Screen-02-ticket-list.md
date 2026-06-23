---

### Screen 02: Ticket List / Search Results (Staff View)

**Route:** `/tickets`  
**Purpose:** Primary workspace for staff. Search, filter, sort, and take bulk actions on tickets. Entry point to individual ticket detail.  
**User Stories:** US-4.1, US-4.2, US-12.1, US-12.2, US-5.2  
**Personas:** Dana (PER-01), Marcus (PER-02)  
**Journey:** JRN-01.1 (Recall Saved Queue, Prioritize), JRN-02.1 (Drill into SLA Breaches, Select Tickets for Reassignment)

#### Layout (Desktop — 1280px+)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [Top Nav: logo | Tickets ▾ | Reports | Admin | Map] [🔔] [User ▾]             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │ 🔍 Search tickets...                            [📌 Bookmarks ▾] [⊞ Map]│   │  ← Search bar row
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│ ┌──────────────────────┐  ┌──────────────────────────────────────────────────┐  │
│ │ FILTERS              │  │  127 results  Sort: SLA Urgency ▾  [Export CSV]  │  │  ← Filter + Results
│ │                      │  │  [☐ Select all]                                   │  │
│ │ Status               │  │  ──────────────────────────────────────────────── │  │
│ │ ○ All ● Open ○ Closed│  │  ☐ #4821 Pothole on Oak Ave                       │  │
│ │                      │  │     🔴 SLA Breach   Public Works   Dana R.  2h   │  │
│ │ Substatus            │  │     Oak Ave @ Main St, Downtown                   │  │
│ │ [Pending Parts   ▾]  │  │                                                   │  │
│ │                      │  │  ☐ #4815 Broken manhole cover                     │  │
│ │ Category             │  │     🔴 SLA Breach   Public Works   Dana R.  6h   │  │
│ │ [All categories  ▾]  │  │                                                   │  │
│ │                      │  │  ☐ #4819 Storm drain collapse                     │  │
│ │ Department           │  │     🟡 Due today    Public Works   Dana R.  5h   │  │
│ │ [Public Works    ▾]  │  │                                                   │  │
│ │                      │  │  ☐ #4812 Fallen tree limb                         │  │
│ │ Assignee             │  │     🟢 On track     Parks Dept     Jordan  3d    │  │
│ │ [Any assignee    ▾]  │  │                                                   │  │
│ │                      │  │  ...                                              │  │
│ │ Date range           │  │                                                   │  │
│ │ [From] → [To]        │  │  ──────────────────────────────────────────────── │  │
│ │                      │  │  ← 1  2  3  4  5  →   (25 per page)               │  │
│ │ Reporter email       │  └──────────────────────────────────────────────────┘  │
│ │ [_______________]    │                                                         │
│ │                      │   Facet summary:                                        │
│ │ [Apply Filters]      │   Status: Open (119) / Closed (8)                      │
│ │ [Clear All]          │   Top categories: Pothole (45), Lighting (30)...        │
│ └──────────────────────┘                                                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Bulk Action Bar (appears when 1+ rows selected)

```
┌──────────────────────────────────────────────────────────────────┐
│  3 tickets selected   [Assign to... ▾]  [Change status ▾]  [✕]  │
│                                                                   │
│  Assign to... search: [Search by name...]                         │
│  ● Dana R.     18 open tickets                                    │
│  ● Jordan M.    6 open tickets  ← workload count shown           │
│  ● Alex T.     12 open tickets                                    │
│                                         [Reassign 3 tickets]     │
└──────────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Search bar | Top of content area, full width |
| Primary | Ticket rows with SLA badge, title, department, assignee | Main list |
| Secondary | Filter panel | Left sidebar (collapsible) |
| Secondary | Result count + sort control | Above list |
| Secondary | Facet summary | Below filter panel |
| Tertiary | Pagination | Below list |
| Tertiary | Export CSV button | Above list, right side |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default / loaded | Full list as shown | N/A |
| Loading / searching | Row skeleton loaders | Shimmer animation while Solr query runs |
| No results | Empty state illustration | "No tickets match your filters. [Clear filters]" |
| Solr unavailable | Warning banner above list | "Search is temporarily unavailable. Showing recent tickets." |
| Multi-select active | Checkboxes visible; bulk action bar fixed at bottom | Bulk action bar with count |
| Export downloading | Export button shows spinner | "Preparing export..." |
| Export too large | Error toast | "Export exceeds 5,000 rows. Refine your filters." |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Search input | Text search | Triggers Solr query with 300ms debounce |
| Bookmarks dropdown | Dropdown | Lists personal bookmarks; click to restore |
| Map toggle (⊞) | View toggle | Switches to /map with same filters |
| Filter fields | Form controls | Apply on change (with Apply button as fallback) |
| Ticket row | Navigation | Click → /tickets/:id |
| Row checkbox | Selection | Adds to bulk selection set |
| Sort dropdown | Sort control | Re-orders results |
| Export CSV | Action button | Downloads tickets.csv |
| Pagination | Navigation | ARIA-labeled prev/next + page numbers |

#### SLA Badge Color Semantics

| Badge | Color | Meaning |
|-------|-------|---------|
| 🔴 SLA Breach | Red (#EF4444) | Ticket past expected close date |
| 🟡 Due today | Amber (#F59E0B) | Closes within 24 hours |
| 🟢 On track | Green (#22C55E) | Within SLA window |
| — | None | No SLA configured for this category |
