---

### Screen 06: Department / SLA Dashboard (Manager View)

**Route:** `/reports/sla` (also surfaced via dashboard KPI cards)  
**Purpose:** Real-time SLA compliance metrics per department and category. Manager's primary accountability tool. Answers: "Which categories are breaching SLA? Which staff are overloaded?"  
**User Stories:** US-9.1, US-9.3  
**Personas:** Marcus (PER-02)  
**Journey:** JRN-02.1 (Login & Land, Drill into SLA Breaches)

#### Layout (Desktop — 1280px+)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [Top Nav]                                                                 │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  SLA Compliance Dashboard                    Period: [Last 30 days ▾]    │
│                                              Department: [All ▾]          │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │  ← KPIs
│  │  Total Closed│  │  On Time     │  │  Late        │  │  On-Time %  │  │
│  │     342      │  │    287       │  │    55        │  │    83.9%    │  │
│  │  (last 30d)  │  │              │  │              │  │             │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │  ← Category breakdown
│  │  SLA Performance by Category                                        │  │
│  │                                                                     │  │
│  │  Category              Total  On-Time  Late  On-Time%  SLA Days    │  │
│  │  ──────────────────────────────────────────────────────────────── │  │
│  │  Pothole or Road Dmg    145     112      33    77.2%   🔴  5 days  │  │
│  │  Broken Streetlight      67      62       5    92.5%   🟢  3 days  │  │
│  │  Storm Drain             45      38       7    84.4%   🟡  5 days  │  │
│  │  Parks Maintenance       38      35       3    92.1%   🟢  7 days  │  │
│  │  Missed Garbage          28      26       2    92.9%   🟢  2 days  │  │
│  │  Other                   19      14       5    73.7%   🔴  5 days  │  │
│  │                                                                     │  │
│  │  [Download as CSV]                                                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │  ← Open tickets past SLA
│  │  Open Tickets Past SLA  (55 tickets)                    [View all →]│  │
│  │                                                                     │  │
│  │  #4821 Pothole on Oak Ave    +1 day overdue   Dana R.   [Reassign] │  │
│  │  #4815 Broken manhole        +1 day overdue   Dana R.   [Reassign] │  │
│  │  #4808 Sidewalk crack        +3 days overdue  Unassigned [Assign]  │  │
│  │  ... (showing 5 of 55)  [Show all overdue tickets]                 │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │  ← Staff workload
│  │  Staff Workload (open tickets)                                      │  │
│  │                                                                     │  │
│  │  Dana R.   ████████████████████ 18  (3 breached)                   │  │
│  │  Alex T.   ████████████ 12  (1 breached)                           │  │
│  │  Jordan M. ██████ 6  (0 breached)                                  │  │
│  │  Unassigned██ 3  (2 breached)                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | On-Time % KPI (large number) | KPI row, last card |
| Primary | Late / breach count | KPI row, third card |
| Primary | Open tickets past SLA (actionable list) | Middle panel |
| Secondary | SLA per-category table | Main content |
| Secondary | Staff workload chart | Bottom panel |
| Tertiary | Period and department filter | Top right |
| Tertiary | CSV download | Inside category table |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Full dashboard | N/A |
| Loading | Skeleton placeholders | Shimmer |
| No breaches | On-Time % = 100%; breach panel shows "✅ No SLA breaches" | Success callout |
| Stale cache | Note: "Last updated 3 minutes ago" | Small timestamp |
| Period filter applied | All numbers refresh | N/A |
| No SLA configured | Category row shows "—" in SLA Days; excluded from % calc | Tooltip: "No SLA configured" |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Period dropdown | Select | Triggers GET /api/metrics/sla?days={n} |
| Department dropdown | Select | Filters all panels to selected department |
| Category table row | Navigation | Click → /tickets?categoryId={id}&sla=late |
| "View all →" link | Navigation | /tickets?sla=breach&departmentId={id} |
| Inline Reassign/Assign | Quick action | Opens assignee search inline; assigns and removes from list |
| Download as CSV | Action | Downloads SLA report as CSV |
| Staff workload bar | Navigation | Click → /tickets?assigneeId={id} |

#### Notes
- The SLA metrics endpoint (`GET /api/metrics/sla`) is public (no auth required) and cached for 5 minutes per US-9.1. The UI shows a "Last updated" timestamp.
- The on-time percentage color coding: ≥90% = green, 75–89% = amber, <75% = red.
- "Open Tickets Past SLA" panel is the direct output of `GET /api/reports/open-age` (US-9.3).
- Inline quick-assign within the breach list enables JRN-02.1 bulk reassignment without navigating away.
