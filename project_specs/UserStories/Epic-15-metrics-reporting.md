## Epic 15: Metrics and Reporting (F15)

The metrics and reporting screens give administrators and supervisors quantitative insight into case volume, response times, and category distribution — preserving the same calculated fields as the PHP Reports and Metrics screens.

---

### US-15.1: View Case Volume Over Time
**As a** Jordan Calloway (System Administrator), **I want to** view a chart of case volume over time (daily, weekly, monthly) with a date range filter, **so that** I can identify trends and report on service request activity to city leadership.

**Acceptance Criteria:**
- [ ] A Metrics screen displays case volume charts: daily, weekly, and monthly breakdowns
- [ ] A date range filter applies to all report sections
- [ ] Chart data matches the PHP implementation's calculated fields exactly (no regression in numbers)
- [ ] Metrics page route is preserved from the existing PHP application route structure
- [ ] Page loads within ≤ 2 seconds

**Priority:** P2 | **Feature Ref:** F15

---

### US-15.2: View Resolution Time and Case Breakdown Reports
**As a** Jordan Calloway (System Administrator), **I want to** view average resolution time by category and department, and open vs. closed ratios, **so that** I can identify departments with performance gaps and resource needs.

**Acceptance Criteria:**
- [ ] Reports screen displays: average resolution time by category, average resolution time by department, open vs. closed ratio, cases by category breakdown, cases by department breakdown, cases by assignee breakdown
- [ ] All breakdowns are filterable by date range
- [ ] Reports page route is distinct from Metrics page (preserving existing PHP route structure)
- [ ] Results can be exported to CSV
- [ ] Export of empty result set shows "No data to export" toast

**Priority:** P2 | **Feature Ref:** F15

---
