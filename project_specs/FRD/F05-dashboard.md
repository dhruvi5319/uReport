---

## F5: Dashboard

**Priority:** P1 — High

### Description

The dashboard is the landing screen for authenticated staff at route `/dashboard`. It provides an at-a-glance operational overview through stat cards, a recent cases feed, a map widget with geo-clustered open case pins, and a status breakdown donut chart. All widgets link into the case list with pre-applied filters for drill-down.

### Terminology

- **Stat card** — A summary tile showing a single KPI metric (count, ratio, etc.).
- **Overdue threshold** — Configurable application setting: number of days after which an open ticket without resolution is considered overdue. Default: derived from `categories.slaDays`.
- **Recent cases feed** — A scrollable list of the most recently created or updated tickets.
- **Map widget** — An interactive Mapbox GL JS / Leaflet map showing open ticket pins clustered by `geoclusters`.
- **Donut chart** — A React SVG chart showing proportional breakdown of case statuses.

### Sub-features

- Stat cards: total open, opened today, closed today, overdue
- Recent cases feed (last 10 tickets by `enteredDate DESC`)
- Map widget: clustered open case pins
- Status donut chart (open vs. closed, breakable by category or department)
- Quick-link action buttons: New Case, All Open Cases, Assigned to Me
- Skeleton loading for all widgets
- Responsive grid: 2-column on tablet/desktop; single-column on mobile

### Process

1. Staff authenticates and lands on `/dashboard` (or is redirected here after login).
2. React dispatches parallel data requests on mount:
   - `GET /api/dashboard/stats` — stat card counts
   - `GET /api/tickets?status=open&page=1&pageSize=10&sort=enteredDate&dir=desc` — recent cases feed
   - `GET /api/dashboard/chart?groupBy=status` — donut chart data
   - `GET /api/geoclusters?zoom=10` — map cluster data
3. All four widgets display skeleton loaders while data is in flight.
4. As each response resolves, the corresponding widget renders.
5. Clicking a stat card navigates to `/cases` with the corresponding filter pre-applied.
6. Clicking a recent case row navigates to `/cases/{id}`.
7. Clicking a map cluster zooms in to show constituent pins.
8. Clicking a map pin opens a popover showing ticket ID, category, and status, with a link to the case detail.

### Stat Card Definitions

| Card | Query Logic | Filter Link |
|---|---|---|
| **Total Open** | `COUNT(*) WHERE status='open'` | `/cases?status=open` |
| **Opened Today** | `COUNT(*) WHERE status='open' AND enteredDate >= today` | `/cases?status=open&start_date={today}` |
| **Closed Today** | `COUNT(*) WHERE status='closed' AND closedDate >= today` | `/cases?status=closed&start_date={today}` |
| **Overdue** | `COUNT(*) WHERE status='open' AND enteredDate + slaDays < NOW()` (JOIN categories on slaDays) | `/cases?status=open&overdue=true` |

### Recent Cases Feed

- Shows last 10 tickets ordered by `enteredDate DESC`.
- Each row: Case ID (badge), Category name, Reporter last name, Status badge pill, time-since label ("2 hours ago").
- Clicking a row navigates to `/cases/{id}`.
- "View all open cases" link at the bottom navigates to `/cases?status=open`.

### Donut Chart

- Data endpoint `GET /api/dashboard/chart` returns counts by status (and optionally by `category_id` or `department_id` when `groupBy` param is set).
- Default: open vs. closed ratio.
- Toggling "By Category" or "By Department" re-fetches with different `groupBy` param.
- Chart uses a legend with status/category labels and counts.
- Accessible: chart is accompanied by a data table (visually hidden but available to screen readers).

### Map Widget

- Renders Mapbox GL JS (primary) or Leaflet (fallback if Mapbox key absent).
- Initial view: city center coordinates at zoom 11 (configurable).
- Cluster pins from `geoclusters` table at low zoom; individual ticket pins at high zoom.
- Cluster bubble shows count of constituent tickets.
- Clicking cluster zooms in one level.
- Clicking individual pin shows popover: ticket ID, category, status + link to case detail.
- Map is interactive (pan, zoom) but not used for data entry on the dashboard.

### Quick-Link Buttons

| Button | Route |
|---|---|
| New Case | `/cases/new` |
| All Open Cases | `/cases?status=open` |
| Assigned to Me | `/cases?status=open&assignedPerson_id={currentUserId}` |

### Inputs

- None (dashboard is read-only).
- `groupBy` query param on chart endpoint: `status` (default), `category`, `department`.

### Outputs

- Stat card counts (4 numbers)
- Recent cases list (10 rows)
- Donut chart (SVG, with accessible data table)
- Map with cluster / pin markers

### Validation

- All data endpoints must respond in ≤ 2 s; widgets showing stale/no data show an error state with retry link.
- Overdue calculation requires JOIN to `categories.slaDays`; tickets in categories with `slaDays = NULL` are excluded from the overdue count.

### Error States

| Scenario | User Behavior |
|---|---|
| Stat API failure | Card shows "—" with retry icon |
| Recent cases API failure | Feed shows error state with retry button |
| Chart API failure | Chart area shows "Chart unavailable" |
| Map tile load failure | Map shows error tile; pin data may still load |
| Mapbox key absent | Leaflet / OSM tiles render automatically |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Stat card counts |
| GET | `/api/dashboard/chart` | Donut chart data |
| GET | `/api/geoclusters` | Cluster data for map widget |

### Schema Surface

- `tickets` — stat queries and recent feed
- `categories` — slaDays for overdue calculation
- `geoclusters`, `ticket_geodata` — map cluster data
