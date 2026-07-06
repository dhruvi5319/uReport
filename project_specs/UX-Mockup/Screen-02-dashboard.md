# Screen-02: Dashboard

**Route:** `/dashboard`
**Purpose:** At-a-glance operational overview; landing screen after authentication
**User Stories:** US-5.1, US-5.2, US-5.3, US-5.4
**Journeys:** JRN-02.1 (Orient, View Cases), JRN-02.3 (Check Dashboard, Surface Overdue)

---

## Layout — Desktop (1280 px+)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ NAVBAR + SIDEBAR (see Screen-01)                                        │
├──────────────┬──────────────────────────────────────────────────────────┤
│ SIDEBAR      │  Dashboard                                               │
│              │  ──────────────────────────────────────────────────      │
│              │  QUICK LINKS                                             │
│              │  [+ New Case]  [All Open Cases]  [Assigned to Me]        │
│              │                                                          │
│              │  STAT CARDS (4-column grid, gap-4)                       │
│              │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│              │  │ TOTAL    │ │ OPENED   │ │ CLOSED   │ │ OVERDUE  │   │
│              │  │ OPEN     │ │ TODAY    │ │ TODAY    │ │ ●        │   │
│              │  │          │ │          │ │          │ │          │   │
│              │  │   142    │ │    18    │ │    24    │ │    4     │   │
│              │  │ open     │ │ since    │ │ resolved │ │ past SLA │   │
│              │  │ cases    │ │ midnight │ │ today    │ │          │   │
│              │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│              │  (each card is a link to /cases with filter applied)     │
│              │                                                          │
│              │  ROW 2: MAP WIDGET (2/3 width) + DONUT CHART (1/3)       │
│              │  ┌──────────────────────────┐ ┌───────────────────────┐ │
│              │  │  Open Cases Map          │ │  Case Status          │ │
│              │  │                          │ │  ┌──────────────────┐ │ │
│              │  │  [Interactive map —      │ │  │   [Donut chart]  │ │ │
│              │  │   Mapbox/Leaflet]        │ │  │   Open: 142      │ │ │
│              │  │                          │ │  │   Closed: 891    │ │ │
│              │  │   ● cluster (24)         │ │  └──────────────────┘ │ │
│              │  │      ● (7)               │ │                       │ │
│              │  │         ● (3)            │ │  [By Category] toggle │ │
│              │  │                          │ │  [By Department]      │ │
│              │  └──────────────────────────┘ └───────────────────────┘ │
│              │                                                          │
│              │  ROW 3: RECENT CASES FEED (full width)                   │
│              │  ┌──────────────────────────────────────────────────┐   │
│              │  │  Recent Cases                                    │   │
│              │  │  ────────────────────────────────────────────    │   │
│              │  │  #5102  Pothole     Santos    OPEN     2m ago    │   │
│              │  │  #5101  Graffiti    Kim       OPEN     15m ago   │   │
│              │  │  #5100  Streetlight Williams  CLOSED   1h ago    │   │
│              │  │  #5099  Tree Down  Johnson   OPEN     2h ago    │   │
│              │  │  ... (10 rows total)                             │   │
│              │  │  ────────────────────────────────────────────    │   │
│              │  │  [View all open cases →]                         │   │
│              │  └──────────────────────────────────────────────────┘   │
└──────────────┴──────────────────────────────────────────────────────────┘
```

---

## Layout — Tablet (768 px)

```
┌──────────────────────────────────────────────────┐
│ NAVBAR (collapsed sidebar — icon only)           │
├──────────────────────────────────────────────────┤
│ [+ New Case] [All Open]  [Assigned to Me]        │
│                                                  │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ 142     │ │ 18      │ │ 24      │ │ 4 ●     ││
│ │ Total   │ │ Today   │ │ Closed  │ │ Overdue ││
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
│                                                  │
│ ┌──────────────────────┐ ┌────────────────────┐ │
│ │  Map Widget          │ │  Donut Chart       │ │
│ │  (full height)       │ │                    │ │
│ └──────────────────────┘ └────────────────────┘ │
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │  Recent Cases (scrollable)                 │  │
│ └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## Layout — Mobile (375 px)

```
┌────────────────────────────────┐
│ NAVBAR (hamburger)             │
├────────────────────────────────┤
│ [+ New Case] (full width btn)  │
│ [All Open Cases] (full width)  │
│ [Assigned to Me] (full width)  │
├────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐     │
│ │ 142 Open │ │ 4 Overdue│     │
│ └──────────┘ └──────────┘     │
│ ┌──────────┐ ┌──────────┐     │
│ │ 18 Today │ │ 24 Closed│     │
│ └──────────┘ └──────────┘     │
├────────────────────────────────┤
│ ┌──────────────────────────┐  │
│ │  Map Widget (h-48)        │  │
│ └──────────────────────────┘  │
├────────────────────────────────┤
│ ┌──────────────────────────┐  │
│ │  Donut Chart (compact)   │  │
│ └──────────────────────────┘  │
├────────────────────────────────┤
│  Recent Cases (list)           │
│  #5102  Pothole  OPEN  2m ago │
│  #5101  Graffiti OPEN  15m    │
│  ...                          │
│  [View all open cases →]      │
└────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement | Rationale |
|---|---|---|---|
| Primary | Overdue count (red) | Stat card row, rightmost | Actionable — requires immediate attention |
| Primary | Quick-link buttons | Top of content area | 1-click navigation to most common workflows |
| Secondary | Total Open, Today counts | Stat card row | Workload context |
| Secondary | Map widget | Row 2, left | Geographic awareness |
| Secondary | Recent cases feed | Row 3 | Incoming work queue |
| Tertiary | Donut chart | Row 2, right | Trend overview |

---

## Stat Card Design

```
┌────────────────────────────────────────┐
│  [Trend icon ↑]              OVERDUE   │
│                                        │
│         4                              │  ← large number, bold
│   cases past SLA                       │  ← label, text-muted-sm
│                                        │
│  ────────────────────────────────────  │
│  Click to view overdue cases →         │  ← hover state
└────────────────────────────────────────┘
Shadow-sm → shadow-md on hover; entire card is a link
```

**Overdue card**: Red accent border-left or red icon. Badge-style "●" indicator.

---

## Map Widget Interactions

| Action | Result |
|---|---|
| Cluster click (low zoom) | Zoom in; cluster expands |
| Pin click (high zoom) | Popover: Case ID, Category, Status, "View Case →" link |
| Map load error | Overlay: "Map unavailable. Try refreshing." |
| No Mapbox key | Leaflet with OSM tiles renders; user-visible experience unchanged |

---

## Donut Chart Interactions

| Element | Behavior |
|---|---|
| Chart segment hover | Tooltip with count and percentage |
| "By Category" button | Re-queries chart API; chart transitions |
| "By Department" button | Re-queries chart API; chart transitions |
| Chart API failure | "Chart unavailable" text + retry icon in chart area |

---

## Recent Cases Feed — Row Design

```
┌────────────────────────────────────────────────────────────────┐
│  [#5102]  Pothole         Santos, M.   [OPEN]      2 min ago  │
│           Category name   Reporter     Status pill  Time-since │
└────────────────────────────────────────────────────────────────┘
```

- Case ID in JetBrains Mono
- Status pill: color-coded (open=blue, closed-resolved=green, etc.)
- Time-since: human-readable relative (uses `date-fns formatDistanceToNow`)
- Entire row is a link to `/cases/{id}`
- Hover: row background lightens; cursor pointer

---

## States

| Widget | Loading State | Error State | Empty State |
|---|---|---|---|
| Stat cards | 4 skeleton cards (shimmer) | "—" with retry icon | N/A (zero is valid) |
| Map widget | Skeleton rectangle (h-64) | "Map unavailable" overlay | No pins shown (no open cases) |
| Donut chart | Skeleton circle | "Chart unavailable" message | Empty ring shown |
| Recent cases feed | 5 skeleton rows | Error message + retry | "No recent cases" |

---

## Quick Link Buttons

| Button | Route | Aria Label |
|---|---|---|
| + New Case | `/cases/new` | "Create a new case" |
| All Open Cases | `/cases?status=open` | "View all open cases" |
| Assigned to Me | `/cases?status=open&assignedPerson_id={userId}` | "View cases assigned to me" |

Buttons are secondary/outlined style; not primary — they should not visually compete with the stat cards.

---

*End of Screen-02-dashboard.md*
