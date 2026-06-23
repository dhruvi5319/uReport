---

### Screen 07: Reports View (Activity, Assignments, SLA)

**Route:** `/reports`  
**Purpose:** Staff/admin download standardized reports with configurable date range and department filters. Primary use case: Marcus generating the weekly city director briefing CSV.  
**User Stories:** US-9.2, US-9.3  
**Personas:** Marcus (PER-02)  
**Journey:** JRN-02.1 (Generate Weekly Report, Paste into Excel)

#### Layout (Desktop — 1280px+)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [Top Nav]                                                                 │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Reports                                                                  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐ │  ← Filter bar
│  │  Date range:  [Jun 17, 2026] to [Jun 23, 2026]  [This week]        │ │
│  │  Department:  [Public Works ▾]   Assignee: [All ▾]   Category: [All]│ │
│  │                                                       [Apply]        │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────┐  ┌──────────────────────────────────────────────┐ │  ← Report nav
│  │  REPORT TYPES      │  │                                              │ │
│  │                    │  │  Activity Report                             │ │
│  │  ● Activity        │  │  ─────────────────────────────────────────  │ │
│  │  ○ Assignments     │  │                                              │ │
│  │  ○ SLA Compliance  │  │  ┌────────┐ ┌────────┐ ┌────────┐           │ │
│  │  ○ Volume Trends   │  │  │Opened  │ │Closed  │ │Open at │           │ │
│  │  ○ Staff Perf.     │  │  │  34    │ │  28    │ │end: 87 │           │ │
│  │  ○ Open Age (SLA)  │  │  └────────┘ └────────┘ └────────┘           │ │
│  │                    │  │                                              │ │
│  └────────────────────┘  │  Daily breakdown                            │ │
│                           │                                              │ │
│                           │  Date       Opened  Closed  Net             │ │
│                           │  Jun 17      6        4      +2             │ │
│                           │  Jun 18      8        5      +3             │ │
│                           │  Jun 19      4        6      -2             │ │
│                           │  Jun 20      7        4      +3             │ │
│                           │  Jun 21      5        5       0             │ │
│                           │  Jun 22      4        4       0             │ │
│                           │  TOTAL      34       28      +6             │ │
│                           │                                              │ │
│                           │  ┌──────────────────────┐                  │ │
│                           │  │  📥  Download CSV     │                  │ │
│                           │  └──────────────────────┘                  │ │
│                           └──────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

#### Assignment Report (sub-view)

```
│  Assignment Report
│  ─────────────────────────────────────────────────────
│
│  Staff Member    Open  Closed  Avg Days to Close
│  Dana R.          18     142      3.2 days
│  Jordan M.         6      67      2.8 days
│  Alex T.          12      98      4.1 days
│  Unassigned        3      —         —
│
│  [Download CSV]
```

#### SLA Compliance Report (sub-view)

```
│  SLA Compliance Report
│  ─────────────────────────────────────────────────────
│
│  Category              Total  On-Time  Late  %
│  Pothole or Road Dmg    145    112      33   77.2%  🔴
│  Broken Streetlight      67     62       5   92.5%  🟢
│  Storm Drain             45     38       7   84.4%  🟡
│
│  [Download CSV]
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Date range filter (defaults to "This week") | Top filter bar |
| Primary | Report output table / metrics | Main content area |
| Primary | Download CSV button | Below each report table |
| Secondary | Report type navigation | Left sidebar |
| Secondary | Department / assignee filters | Top filter bar |
| Tertiary | Summary KPI cards above table | Per-report, optional |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (Activity) | Pre-loaded with "this week" data | N/A |
| Loading | Skeleton table rows | Shimmer |
| No data in range | Empty state | "No tickets found for this date range." |
| Date range too large (>2yr) | Inline error | "Date range cannot exceed 2 years." |
| Downloading | Button spinner | "Preparing CSV..." |
| Download success | Browser file download triggered | N/A |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Date range inputs | Date pickers | Triggers report refresh on Apply |
| "This week" shortcut | Quick-select | Sets dateFrom/dateTo to Mon–today |
| Report type radio | Navigation | Switches report content panel |
| Department dropdown | Select | Filters all reports to department |
| Download CSV | Action | GET /api/reports/{type}?format=csv with current filters |
| Table row (SLA report) | Navigation | Click → /tickets?categoryId={id}&sla=late |

#### Notes
- All date filters default to "this week" (Monday to today) per JRN-02.1: "date range defaults to 'current week'"
- CSV column order is stable and documented (per US-4.2, US-9.2) — Marcus's Excel pivot table relies on this
- Report requires `staff` or `admin` role; public users see 403 (US-9.2 acceptance criteria)
- Maximum report date range: 2 years (US-9.2); exceeding returns error with `DATE_RANGE_TOO_LARGE`
