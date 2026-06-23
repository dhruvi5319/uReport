---

## F09: Reporting & Metrics

**Description:** Supervisors and administrators need visibility into ticket volume, staff performance, SLA compliance, and departmental workload. uReport provides a set of standard parameterized reports and a metrics API endpoint for real-time SLA percentage tracking consumed by external dashboards. All reports support CSV export.

**Terminology:**
- **SLA On-Time:** A ticket is "on-time" if it was closed before `datetimeOpened + category.slaDays` business days elapsed.
- **SLA Late:** A ticket is "late" if it was closed after its expected close date, or if it is still open and the expected close date has passed.
- **Activity Period:** The time range filter applied to a report (default: last 30 days).
- **Metrics Endpoint:** A lightweight API endpoint returning SLA percentages per category, consumed by external monitoring dashboards.

**Sub-features:**
- Activity report (ticket counts by time period)
- Assignment report (tickets per staff member)
- Category report (volume + SLA rates per category)
- Department report (volume + resolution rates)
- Staff performance report (response times, closure rates)
- SLA report (on-time vs. late)
- Volume report (daily/weekly/monthly trends)
- Open ticket age report (tickets open beyond SLA)
- Metrics API endpoint (on-time SLA % per category)
- CSV export for all reports

---

### F09 Process: Generate Report

1. Staff/admin requests a report endpoint with filter parameters.
2. System queries MySQL (no Solr for reports — aggregation queries run against the DB).
3. System computes aggregates: counts, averages, percentages.
4. System returns report data as JSON or CSV (based on `Accept` header or `format` param).

### F09 Process: SLA Calculation

1. For each ticket in the report scope, compute `expectedCloseDatetime = datetimeOpened + (category.slaDays × 8 working hours)`.
2. Compare against `datetimeClosed` (for closed tickets) or `NOW()` (for open tickets).
3. `slaStatus = 'on_time'` if closed before expected; `'late'` if closed after or still open past expected; `'no_sla'` if `slaDays = null`.
4. Aggregate into on-time %, late %, no-SLA % per category.

### F09 Process: Metrics Endpoint (External Dashboard)

1. External system calls `GET /api/metrics/sla`.
2. System computes on-time SLA percentage for each active category over the last 30 days (configurable).
3. System returns lightweight JSON: array of `{ categoryId, categoryName, totalClosed, onTime, late, onTimePct }`.
4. Response is cached for 5 minutes to avoid repeated DB aggregation.

---

### F09 Inputs

**Common report filters:**
- `dateFrom` (ISO 8601 date, optional): Period start (default: 30 days ago)
- `dateTo` (ISO 8601 date, optional): Period end (default: today)
- `categoryId` (integer, optional): Limit to specific category
- `departmentId` (integer, optional): Limit to specific department
- `assigneeId` (integer, optional): Limit to specific staff member
- `format` (string, optional): `json` (default) | `csv`

**Metrics endpoint filters:**
- `days` (integer, optional, default 30): Rolling window in days
- `categoryId` (integer, optional): Limit to specific category

---

### F09 Outputs

**Activity Report:**
```json
{
  "data": {
    "period": { "from": "2026-05-24", "to": "2026-06-23" },
    "totalOpened": 142,
    "totalClosed": 118,
    "openAtPeriodEnd": 24,
    "byDay": [{ "date": "2026-06-01", "opened": 8, "closed": 5 }]
  }
}
```

**SLA Metrics:**
```json
{
  "data": [
    {
      "categoryId": 1,
      "categoryName": "Pothole Repair",
      "totalClosed": 45,
      "onTime": 38,
      "late": 7,
      "onTimePct": 84.4
    }
  ]
}
```

**Assignment Report:** `[{ assigneeId, assigneeName, open, closed, avgDaysToClose }]`

**Volume Report:** `[{ period: "2026-W24", opened: 32, closed: 28 }]`

---

### F09 Validation

- `dateFrom` must be ≤ `dateTo`
- Maximum report range: 2 years
- `days` for metrics endpoint: 1–365
- Caller must have `staff` or `admin` role for all reporting endpoints
- CSV export available for all reports

---

### F09 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Date range too large | 422 | DATE_RANGE_TOO_LARGE | "Report date range cannot exceed 2 years" |
| `dateFrom` after `dateTo` | 422 | INVALID_DATE_RANGE | "Start date must be before end date" |
| Unauthorized (not staff) | 403 | FORBIDDEN | "Staff or admin role required for reports" |
| Invalid `categoryId` or `departmentId` | 422 | INVALID_FILTER | "Category or department not found" |

---

### F09 API Surface (this feature)

Full schemas: see `Y1a-api-tickets.md` §Reporting.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reports/activity` | staff/admin | Activity report |
| GET | `/api/reports/assignments` | staff/admin | Assignment report |
| GET | `/api/reports/categories` | staff/admin | Category volume + SLA |
| GET | `/api/reports/departments` | staff/admin | Department report |
| GET | `/api/reports/staff-performance` | staff/admin | Per-staff metrics |
| GET | `/api/reports/sla` | staff/admin | SLA on-time/late breakdown |
| GET | `/api/reports/volume` | staff/admin | Volume trends |
| GET | `/api/reports/open-age` | staff/admin | Tickets open past SLA |
| GET | `/api/metrics/sla` | Any (public) | External SLA metrics (cached) |

---

### F09 Schema Surface (this feature)

Read-only aggregation over `tickets`, `actions`, `categories`, `departments`, `people`. No dedicated report tables — all computed on demand from normalized schema. Metrics endpoint output cached in memory (or Redis if configured).
