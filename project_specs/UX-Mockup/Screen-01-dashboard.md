---

### Screen 01: Staff Dashboard (Post-Login Landing)

**Route:** `/dashboard`  
**Purpose:** Role-appropriate landing page for staff and admin. Surfaces SLA breaches, workload summary, and quick access to personal queue. First thing Dana and Marcus see after login.  
**User Stories:** US-9.1, US-15.1  
**Personas:** Dana (PER-01), Marcus (PER-02)  
**Journey:** JRN-01.1 (Land on Dashboard), JRN-02.1 (Login & Land)

#### Layout (Desktop — Manager view, Marcus)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [uReport logo]  Tickets ▾  Reports  Admin  Map │ 🔔 3  [Marcus Webb ▾]   │  ← Top nav
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Good morning, Marcus.                        [+ New Ticket]             │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │  ← KPI row
│  │  🔴 3        │  │  🟡 8        │  │  📋 127      │  │  ✅ 84%     │  │
│  │  SLA Breached│  │  Due Today   │  │  Open Tickets│  │  SLA On-Time│  │
│  │  [View →]    │  │  [View →]    │  │  [View →]    │  │  (30 days)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────┐  ┌───────────────────────────────┐  │
│  │  Staff Workload                 │  │  My Bookmarks                 │  │  ← Row 2
│  │                                 │  │                               │  │
│  │  Dana R.    ████████ 18 open    │  │  📌 My Open Tickets          │  │
│  │  Jordan M.  ████ 6 open         │  │  📌 Unassigned — Public Works │  │
│  │  Alex T.    ██████ 12 open      │  │  📌 SLA Breaches Today       │  │
│  │  Unassigned ██ 3 open           │  │                               │  │
│  │                                 │  │  [+ Save current filters]    │  │
│  │  [Reassign overloaded staff →]  │  │  [Manage bookmarks →]        │  │
│  └─────────────────────────────────┘  └───────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Recent Tickets (last 24 hours)                      [See all →]   │  │  ← Recent row
│  │                                                                     │  │
│  │  #4821 Pothole on Oak Ave      Open  🔴 Breached   Dana R.  2h ago │  │
│  │  #4820 Broken streetlight      Open  🟡 Due today  Jordan  4h ago  │  │
│  │  #4819 Storm drain collapse    Open  🟢 On track   Dana R.  5h ago │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

#### Layout (Desktop — Staff view, Dana)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [uReport logo]  Tickets ▾  Reports  Map │ 🔔 1  [Dana Reyes ▾]           │  ← Top nav
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Good morning, Dana.                          [+ New Ticket]             │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │
│  │  🔴 2        │  │  🟡 5        │  │  📋 45       │                    │
│  │  SLA Breached│  │  Due Today   │  │  Assigned    │                    │
│  │  [View →]    │  │  [View →]    │  │  to me       │                    │
│  └──────────────┘  └──────────────┘  └──────────────┘                    │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  My Queue  (bookmark: "My Open Tickets")           [Edit filters]  │   │
│  │  Sorted by: SLA Urgency ▾                          [View as map]   │   │
│  │                                                                    │   │
│  │  #4821 Pothole on Oak Ave    Open  🔴 Breached  1 day overdue     │   │
│  │  #4815 Broken manhole cover  Open  🔴 Breached  3 hrs overdue     │   │
│  │  #4819 Storm drain collapse  Open  🟡 Due 4pm   5 hrs left        │   │
│  │  #4812 Fallen tree limb      Open  🟢 On track  3 days left       │   │
│  │  ...                                                                │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement | Role |
|----------|---------|-----------|------|
| Primary | SLA breach count + "SLA Breached" badge (red) | KPI card row, first card | Both |
| Primary | Personal queue (bookmark-restored) | Main content, Dana view | Staff |
| Primary | Staff workload chart | Main content, Marcus view | Manager |
| Secondary | Due today count | KPI card row, second card | Both |
| Secondary | Total open tickets | KPI card row, third card | Both |
| Secondary | SLA on-time % | KPI card row, fourth card | Manager |
| Tertiary | Recent tickets list | Bottom of page | Both |
| Tertiary | My Bookmarks panel | Right column | Both |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Full dashboard as shown | N/A |
| Loading | Skeleton loaders in KPI cards and table rows | Shimmer animation |
| No breaches | SLA card shows green "✅ 0 SLA Breached" | N/A |
| No tickets assigned | Empty state in queue: "No tickets assigned to you" | Add "Create ticket" CTA |
| Metrics stale (cache) | Small "Last updated 3m ago" note under SLA % | N/A |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| KPI card "View →" links | Navigation | Pre-filters /tickets with card's filter params |
| Staff workload bar chart | Interactive | Click a staff member's bar → /tickets?assigneeId={id} |
| Bookmark items | Navigation | Loads bookmark filter state into /tickets |
| "+ Save current filters" | Button | Opens name prompt modal |
| Recent ticket rows | Navigation | Opens /tickets/:id |
| "+ New Ticket" | Primary CTA | Navigates to /tickets/new |
| Top nav "Tickets" | Dropdown | My Queue / All Tickets / Map View |
