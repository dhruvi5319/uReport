---

## F17: Metrics and Reporting Dashboard

**Description:** uReport provides a metrics endpoint and a set of canned reports for staff. The primary metrics calculation is `onTimePercentage` — the fraction of tickets closed within SLA for a given category over a configurable time window. Reports cover ticket activity, assignments, categories, staff performance, SLA compliance, volume trends, and current/opened/closed ticket counts. All metrics endpoints require `staff` role.

---

### Terminology

- **onTimePercentage:** The percentage of tickets in a category that were closed within `slaDays` of their `enteredDate`, over a given time window.
- **effectiveDate:** The reference date for the metrics calculation window end.
- **numDays:** The lookback window in days for the onTimePercentage calculation.
- **SLA compliance:** A ticket is SLA-compliant if it was closed and `closedDate - enteredDate <= slaDays * 1 day`.

---

### Sub-features

- Metrics: onTimePercentage for a category over a time window
- Activity report: ticket counts over a date range
- Assignments report: tickets grouped by assigned person
- Categories report: tickets grouped by category
- Staff report: per-staff ticket counts
- Person report: tickets for a specific person
- SLA report: tickets grouped by SLA compliance
- Volume report: ticket volume over time
- Current open tickets report: open ticket counts by category/department
- Opened today report: tickets opened in current period
- Closed today report: tickets closed in current period

---

### Process

#### GET /api/v1/metrics
1. Staff GETs `/api/v1/metrics?category_id={id}&numDays={n}&effectiveDate={date}`.
2. System calculates:
   - Denominator: COUNT of tickets in category where `enteredDate >= effectiveDate - numDays DAYS` AND `enteredDate <= effectiveDate` AND `closedDate IS NOT NULL`.
   - Numerator: COUNT of above where `closedDate - enteredDate <= slaDays * 1 day`.
3. `onTimePercentage = (numerator / denominator) * 100` — returns 0 if denominator = 0.
4. Returns `{ "category_id": N, "numDays": N, "effectiveDate": "...", "onTimePercentage": 73.5, "closedCount": 100, "onTimeCount": 73 }`.

#### GET /api/v1/reports/{reportType}
1. Staff GETs `/api/v1/reports/{reportType}` with optional date range and filter params.
2. System executes the report query corresponding to `reportType`.
3. Returns report data object.

#### Report Types

| reportType | Description | Key Output Fields |
|------------|-------------|------------------|
| `activity` | Ticket counts over date range | date, opened, closed, total |
| `assignments` | Tickets by assigned person | person_id, name, openCount, closedCount, totalCount |
| `categories` | Tickets by category | category_id, name, openCount, closedCount, totalCount |
| `staff` | Per-staff activity | person_id, name, openCount, closedCount, assignedCount |
| `person` | Tickets for one person | person_id, name, tickets (array) |
| `sla` | SLA compliance by category | category_id, name, slaDays, onTime, late, percentage |
| `volume` | Volume over time (daily/weekly/monthly) | period, count |
| `current` | Open tickets by category/dept | category_id or dept_id, openCount |
| `opened` | Tickets opened in period | date range, tickets array |
| `closed` | Tickets closed in period | date range, tickets array |

---

### Inputs

**Metrics endpoint:**
- `category_id` (integer, required): Category to calculate metrics for.
- `numDays` (integer, optional): Lookback window; default 30.
- `effectiveDate` (ISO date, optional): Window end date; default today.

**Reports endpoint:**
- `reportType` (string, required): One of the report types above.
- `startDate` (ISO date, optional): Report date range start.
- `endDate` (ISO date, optional): Report date range end.
- `category_id` (integer, optional): Filter by category.
- `department_id` (integer, optional): Filter by department.
- `person_id` (integer, optional): Filter by person (required for `person` report).
- `granularity` (string, optional): `daily`, `weekly`, `monthly` for volume report.

---

### Outputs

**Metrics response:**
```json
{
  "category_id": 5,
  "categoryName": "Pothole",
  "numDays": 30,
  "effectiveDate": "2026-06-24",
  "onTimePercentage": 73.5,
  "closedCount": 40,
  "onTimeCount": 29
}
```

**Report responses:** Structured JSON arrays (see report type table above). All report responses include `reportType`, `generatedAt`, and a `data` array.

---

### Validation Rules

- All metrics/reports endpoints require `staff` role.
- `category_id` for metrics must reference an existing category.
- `numDays` must be a positive integer; max 365.
- `effectiveDate` must be a valid ISO 8601 date if provided; defaults to current server date.
- `reportType` must be one of the defined values; unknown type returns 404.
- Date range for reports: `startDate` must be before or equal to `endDate`.
- `person_id` is required for `person` report type.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Non-staff access | 403 | PERMISSION_DENIED | "Reports require staff role" |
| Category not found (metrics) | 404 | CATEGORY_NOT_FOUND | "Category not found" |
| Unknown reportType | 404 | REPORT_NOT_FOUND | "Unknown report type" |
| Invalid numDays | 422 | INVALID_PARAM | "numDays must be between 1 and 365" |
| Invalid date format | 422 | INVALID_DATE | "Date must be ISO 8601 format" |
| startDate after endDate | 422 | INVALID_DATE_RANGE | "startDate must be before endDate" |
| person_id missing for person report | 422 | MISSING_REQUIRED_FIELD | "person_id is required for person report" |

---

### API Surface (this feature)

See full schemas in `Y1c-api-admin.md §Metrics`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/metrics` | staff | Calculate onTimePercentage for a category |
| GET | `/api/v1/reports/{reportType}` | staff | Run a canned report |

---

### Schema Surface (this feature)

No new tables. All queries run against `tickets`, `ticketHistory`, `categories`, `people`, `departments`. See `Y0a-schema-core.md §Tickets`. SQL queries should use indexed columns (`enteredDate`, `closedDate`, `status`, `category_id`, `assignedPerson_id`) for sub-500ms performance on 500K+ ticket datasets.
