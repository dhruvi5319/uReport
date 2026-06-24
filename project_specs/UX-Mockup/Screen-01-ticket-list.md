---

## Screen SCR-02: Staff Dashboard / Ticket List

**Purpose:** Primary working view for case workers. Browse, filter, search, and prioritize tickets.
**User Stories:** US-0.1, US-11.1, US-11.2, US-11.3, US-12.2, US-0.8
**Journey:** JRN-01.1, JRN-01.3

### Layout

```
┌──────────────┬──────────────────────────────────────────────────────┐
│  Sidebar     │  TOP BAR: [🔍 Search...] [New Ticket] [Export ▾]     │
│              ├──────────────────────────────────────────────────────┤
│  ■ Tickets   │  FILTER BAR (collapsible)                            │
│  ○ Reports   │  Status[open▾] Category[─▾] Dept[─▾] Assigned[─▾]   │
│  ○ Admin ▾   │  Date From[──] To[──] Substatus[─▾] [More ▾] [Clear] │
│              ├──────────────────────────────────────────────────────┤
│  ─────────── │  RESULTS HEADER                                      │
│  Bookmarks   │  147 tickets   [List ⊞] [Map 🗺]   Sort: SLA Due ▾   │
│  ─────────── │  ─────────────────────────────────────────────────── │
│  My Streets  │  ┌──────────────────────────────────────────────────┐│
│  Queue       │  │🔴 #5821 Pothole - Main St  OPEN/In Progress       ││
│  Assigned    │  │   Streets | Assigned: Marcus W. | SLA: OVERDUE   ││
│  Open        │  │   Reported: 2026-06-14  |  Jane Smith            ││
│              │  ├──────────────────────────────────────────────────┤│
│  [+ Save     │  │🟡 #5832 Street Light Out  OPEN/New               ││
│   Search]    │  │   Streets | Unassigned | SLA: Due Today          ││
│              │  │   Reported: 2026-06-23  |  Bob Jones             ││
│              │  ├──────────────────────────────────────────────────┤│
│              │  │⚪ #5840 Graffiti - Park Ave  OPEN/Assigned        ││
│              │  │   Parks | Assigned: Priya T. | SLA: 4 days left  ││
│              │  │   Reported: 2026-06-22  |  City Inspector        ││
│              │  └──────────────────────────────────────────────────┘│
│              │  [< Prev]  Page 1 of 6  [Next >]                     │
└──────────────┴──────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Ticket ID, category, title fragment, status badge | Row left/top |
| Primary | SLA indicator (color + label) | Row right, always visible |
| Secondary | Department, assigned person, entered date | Row middle |
| Secondary | Reporter name | Row bottom-right |
| Tertiary | Contact method, substatus detail | Expanded row / tooltip |

### SLA Color Coding

| SLA State | Visual Treatment | Trigger |
|-----------|-----------------|---------|
| Overdue | 🔴 Red left border + "OVERDUE" badge | closedDate null AND enteredDate + slaDays < today |
| Due today | 🟡 Amber left border + "Due Today" badge | Due within 24 hours |
| Due soon | 🟠 Orange indicator | Due within 3 days |
| On track | ⚪ No special treatment | > 3 days remaining |
| No SLA | — | Category has no slaDays configured |

### Filter Panel

| Filter | Control Type | API Param |
|--------|-------------|-----------|
| Status | Select (open/closed/all) | `status` |
| Category | Multi-select dropdown | `category_id` |
| Department | Select | `department_id` |
| Assigned To | Person picker (searchable) | `assignedPerson_id` |
| Entered By | Person picker | `enteredByPerson_id` |
| Date From / To | Date picker pair | `enteredDate` range |
| Substatus | Multi-select | `substatus_id` |
| Keyword | Text | `q` |
| Contact Method | Select | `contactMethod_id` |
| Issue Type | Select | `issueType_id` |
| City / ZIP | Text | `city`, `zip` |

All filters combined with AND logic (US-11.2). Filter state serialized to URL query params.

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Paginated list, default sort | — |
| Loading | Skeleton rows (shimmer) | — |
| Empty results | Illustration + message | "No tickets match your filters. [Clear filters]" |
| Filtered | Active filter chips shown below filter bar | Filter count badge on collapsed panel |
| Error | Alert banner | "Could not load tickets. [Retry]" |

### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Ticket row | Clickable row | Opens SCR-03 Ticket Detail |
| New Ticket | Primary button | Opens SCR-04 Create Form |
| Export | Dropdown | CSV / Print options (staff only; calls format=csv / format=print) |
| List/Map toggle | Toggle button group | Switches result rendering; no new search |
| Sort selector | Dropdown | Re-sorts current result set |
| Save Search | Link button (sidebar) | Opens bookmark save dialog if filters active |
| Bookmark item | Sidebar link | Navigates to stored requestUri |
| Delete bookmark | Icon button | Confirm dialog → DELETE |

### Map View

When map view is active:
- Leaflet map replaces ticket rows
- Geo-clustered circles show ticket counts at current zoom (US-11.3)
- Clicking cluster zooms in; clicking individual pin opens Ticket Detail drawer
- Filter bar remains active; map updates on filter change
