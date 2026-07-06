---

## F15: Metrics and Reporting

**Priority:** P2 — Medium

### Description

The metrics and reporting screens give administrators and supervisors quantitative insight into 311 service request volume, response times, and category distribution. The modernized reporting preserves the existing PHP Reports and Metrics screens with the same calculated fields and route structure. Routes: `/metrics` and `/reports`.

### Terminology

- **Resolution time** — Time from `tickets.enteredDate` to `tickets.closedDate` for closed tickets (in hours or days).
- **Volume** — Count of tickets in a given time period.
- **Date range filter** — Applies to `enteredDate` for all volume/resolution metrics.
- **Export** — CSV download of the current report dataset.

### Sub-features

- Case volume over time (daily, weekly, monthly counts)
- Average resolution time by category and department
- Open vs. closed case ratio
- Cases by category breakdown
- Cases by department breakdown
- Cases by assignee breakdown
- Date range filter for all reports
- Export to CSV
- Metrics page (`/metrics`) distinct from Reports page (`/reports`)

### Process — Metrics Page (`/metrics`)

1. Staff navigates to `/metrics`.
2. Date range picker defaults to "Last 30 days".
3. React issues `GET /api/metrics?start={date}&end={date}`.
4. Response includes:
   - `volumeByDay`: array of `{date, count}` for chart
   - `openCount`: current open ticket count
   - `closedCount`: tickets closed in date range
   - `avgResolutionHours`: average resolution time in hours for closed tickets in range
   - `overdueCount`: currently open tickets past SLA
5. Volume chart renders as a line/bar chart (SVG or Recharts).
6. KPI tiles show the aggregate numbers.
7. Date range change triggers re-fetch.

### Process — Reports Page (`/reports`)

1. Staff navigates to `/reports`.
2. Report type selector: By Category / By Department / By Assignee.
3. Date range filter.
4. `GET /api/reports?groupBy={category|department|assignee}&start={date}&end={date}`.
5. Response: array of `{groupName, openCount, closedCount, avgResolutionHours}`.
6. Renders as a sortable table.
7. "Export CSV" button: `GET /api/reports/export?groupBy=...&start=...&end=...` → downloads CSV.

### Metrics API Response Schema

```json
{
  "volumeByDay": [{"date": "2026-07-01", "count": 12}, ...],
  "openCount": 145,
  "closedCount": 87,
  "avgResolutionHours": 48.5,
  "overdueCount": 23,
  "dateRange": {"start": "2026-06-06", "end": "2026-07-06"}
}
```

### Reports API Response Schema

```json
{
  "groupBy": "category",
  "rows": [
    {"groupId": 3, "groupName": "Pothole", "openCount": 12, "closedCount": 45, "avgResolutionHours": 72.0},
    ...
  ],
  "dateRange": {"start": "2026-06-06", "end": "2026-07-06"}
}
```

### SQL Patterns

**Volume by day:**
```sql
SELECT DATE(entered_date) as date, COUNT(*) as count
FROM tickets
WHERE entered_date BETWEEN :start AND :end
GROUP BY DATE(entered_date)
ORDER BY date ASC;
```

**Average resolution time:**
```sql
SELECT AVG(EXTRACT(EPOCH FROM (closed_date - entered_date))/3600) as avg_hours
FROM tickets
WHERE status = 'closed'
  AND entered_date BETWEEN :start AND :end;
```

**By category:**
```sql
SELECT c.name, 
       SUM(CASE WHEN t.status='open' THEN 1 ELSE 0 END) as open_count,
       SUM(CASE WHEN t.status='closed' THEN 1 ELSE 0 END) as closed_count,
       AVG(CASE WHEN t.status='closed' THEN EXTRACT(EPOCH FROM (t.closed_date - t.entered_date))/3600 END) as avg_hours
FROM tickets t JOIN categories c ON t.category_id = c.id
WHERE t.entered_date BETWEEN :start AND :end
GROUP BY c.id, c.name
ORDER BY open_count DESC;
```

### Inputs

| Parameter | Type | Required | Validation |
|---|---|---|---|
| `start` | date (YYYY-MM-DD) | [R] | Must be ≤ `end` |
| `end` | date (YYYY-MM-DD) | [R] | Must be ≥ `start` |
| `groupBy` | string | [O on /metrics] | `category`, `department`, or `assignee` |

### Outputs

- Metrics: KPI numbers + volumeByDay array for charting
- Reports: grouped table data + sortable table rendering
- CSV export file (Content-Disposition: attachment)

### Validation

- Date range: `start` ≤ `end`; both required.
- Max date range: 12 months (to prevent excessively expensive queries); if exceeded, return 400 with message.
- `groupBy` must be one of: `category`, `department`, `assignee`.

### Error States

| Scenario | HTTP Status | Message |
|---|---|---|
| start > end | 400 | "Start date must be before end date" |
| Date range > 12 months | 400 | "Date range cannot exceed 12 months" |
| Invalid groupBy | 400 | "Invalid groupBy value" |
| No data in range | 200 | Empty dataset; table shows "No data for this period" |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/metrics` | KPI metrics + volume by day |
| GET | `/api/reports` | Grouped report data |
| GET | `/api/reports/export` | CSV export |

### Schema Surface

- `tickets` — primary query source (enteredDate, closedDate, status, category_id, assignedPerson_id)
- `categories` — groupBy category join
- `departments` — groupBy department join (via categories.department_id)
- `people` — groupBy assignee join
