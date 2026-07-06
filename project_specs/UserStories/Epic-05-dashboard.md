## Epic 5: Dashboard (F5)

The dashboard at `/dashboard` is the landing screen for authenticated staff, providing an at-a-glance operational overview with stat cards, a recent cases feed, a geo-clustered map widget, and a status donut chart.

---

### US-5.1: View Operational KPIs on the Dashboard
**As a** Marcus Rivera (311 Operator), **I want to** see stat cards on the dashboard showing total open cases, opened today, closed today, and overdue cases when I arrive each morning, **so that** I can immediately understand the current workload without manually filtering the case list.

**Acceptance Criteria:**
- [ ] Dashboard loads at `/dashboard` after authentication
- [ ] Four stat cards display: Total Open, Opened Today, Closed Today, Overdue
- [ ] Each card shows a numeric count and a descriptive label
- [ ] "Overdue" is calculated as open tickets where `NOW() > enteredDate + slaDays` (tickets in categories with no SLA are excluded)
- [ ] Skeleton loaders appear while stat data is fetching
- [ ] Each card is a link: clicking it navigates to `/cases` with the corresponding filter pre-applied
- [ ] All stat cards load within ≤ 2 seconds
- [ ] On API failure, card shows "—" with a retry icon

**Priority:** P1 | **Feature Ref:** F5

---

### US-5.2: Review the Recent Cases Feed on the Dashboard
**As a** Marcus Rivera (311 Operator), **I want to** see the 10 most recently submitted cases in a feed on the dashboard, **so that** I can spot new incoming cases and navigate to them quickly.

**Acceptance Criteria:**
- [ ] Recent cases feed shows the last 10 tickets ordered by `enteredDate DESC`
- [ ] Each feed row shows: Case ID badge, Category name, Reporter last name, Status badge pill, time-since label (e.g., "2 hours ago")
- [ ] Clicking a feed row navigates to `/cases/{id}`
- [ ] "View all open cases" link at the bottom navigates to `/cases?status=open`
- [ ] Skeleton placeholders display while feed data is loading
- [ ] On API failure, feed shows an error state with a retry button

**Priority:** P1 | **Feature Ref:** F5

---

### US-5.3: View Open Cases on the Dashboard Map Widget
**As a** Marcus Rivera (311 Operator), **I want to** see open cases displayed as clustered pins on the dashboard map, **so that** I can understand the geographic distribution of active cases at a glance.

**Acceptance Criteria:**
- [ ] Map widget renders using Mapbox GL JS (primary) or Leaflet (fallback if Mapbox key absent)
- [ ] Initial view is centered on city center at zoom 11 (configurable)
- [ ] Open case pins are clustered using `geoclusters` table data at low zoom levels
- [ ] Each cluster bubble shows a count of constituent tickets
- [ ] Clicking a cluster zooms in to reveal individual pins
- [ ] Clicking an individual pin shows a popover: ticket ID, category, status, and a link to case detail
- [ ] Map loads within ≤ 2 seconds; shows error tile overlay on map tile load failure
- [ ] If Mapbox key is absent, Leaflet with OSM tiles renders automatically without user-visible error

**Priority:** P1 | **Feature Ref:** F5

---

### US-5.4: Use Quick-Link Buttons to Navigate from the Dashboard
**As a** Diane Kowalski (Department Field Supervisor), **I want to** click quick-link buttons on the dashboard to jump to filtered case views, **so that** I can reach my assigned open cases with a single click instead of re-applying filters.

**Acceptance Criteria:**
- [ ] Three quick-link buttons are visible: "New Case" → `/cases/new`, "All Open Cases" → `/cases?status=open`, "Assigned to Me" → `/cases?status=open&assignedPerson_id={currentUserId}`
- [ ] Buttons are prominently styled and keyboard-accessible
- [ ] Dashboard layout is a responsive grid: 2-column on tablet/desktop, single-column on mobile
- [ ] Status donut chart shows open vs. closed case ratio with a legend
- [ ] Chart can be toggled to group by category or department via a "By Category" / "By Department" button
- [ ] On chart API failure, chart area shows "Chart unavailable" message

**Priority:** P1 | **Feature Ref:** F5

---
