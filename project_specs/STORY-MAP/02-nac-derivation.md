---

## NaC Derivation Table

Full traceability chain: **JTBD Outcome → Journey Stage → NaC → User Story**

| JTBD-ID | Outcome (from JTBD hiring criterion) | Journey Stage | NaC (testable criterion) | Story ID(s) |
|---------|--------------------------------------|---------------|--------------------------|-------------|
| JTBD-01.1 | Personal ticket queue reachable in ≤ 2 clicks after login with filters pre-applied | JRN-01.1: Login | OIDC login completes and redirects to app in < 3 seconds | US-11.1 |
| JTBD-01.1 | Page loads in under 2 seconds so the first click of the day is not a wait | JRN-01.1: Land on Dashboard | Staff dashboard accessible within 2 clicks after login; all views functional at 375px–1920px | US-15.1 |
| JTBD-01.1 | Named filter bookmarks persist across sessions; never re-enters same combination | JRN-01.1: Recall Saved Queue | Saved bookmark restores exact filter state in ≤ 1 click; persists across sessions | US-12.1, US-12.2 |
| JTBD-01.1 | Queue sorted by SLA urgency by default; overdue tickets surfaced first | JRN-01.1: Prioritize | Ticket list supports `sla_asc` sort; SLA-overdue items visually flagged in queue | US-4.1, US-17.2 |
| JTBD-01.1 | Full ticket history readable in detail view within 2 seconds | JRN-01.1: Open First Ticket | Ticket detail renders chronological action history on 375px viewport in < 2 seconds, no horizontal scroll | US-0.2, US-6.1 |
| JTBD-01.2 | Template selector available on same screen as response compose box | JRN-01.2: Select Template | Template dropdown visible on ticket detail view without navigating away from the ticket | US-13.2 |
| JTBD-01.2 | Composed response and email dispatch complete in single save action with no full-page reload | JRN-01.2: Send Response | Staff response sent via template in < 60 seconds; constituent email dispatched within 30 seconds | US-8.3, US-13.2 |
| JTBD-01.2 | Plain-language category labels prevent wrong-department routing at intake | JRN-01.2: Enter Details | Category names use citizen-readable labels; department routing preview visible before save | US-2.1 |
| JTBD-01.2 | Inline assignee search completes without leaving ticket create form | JRN-01.2: Assign Ticket | Assignee search inline on ticket form; new assignee receives email within 30 seconds of assignment | US-0.3, US-8.2 |
| JTBD-01.3 | File upload control fully usable on 375px mobile viewport with no overlap | JRN-01.2 / JRN-03.1: Upload Photo | Upload control on 375px shows no overlap with map picker; JPEG/PNG from camera roll selectable | US-7.1 |
| JTBD-01.3 | Upload associates attachment with active ticket's audit trail automatically | JRN-01.2: Save Ticket | Upload creates `actions` record of type `upload`; thumbnail visible in ticket detail within seconds | US-7.1, US-6.2 |
| JTBD-02.1 | SLA breach count and near-breach tickets visible on post-login screen | JRN-02.1: Login & Land | `GET /api/metrics/sla` data rendered on dashboard; breach count badge shown without extra navigation | US-9.1 |
| JTBD-02.1 | Filtered overdue ticket list opens in 1 click from dashboard badge | JRN-02.1: Drill into SLA Breaches | SLA breach badge links to pre-filtered overdue ticket list; no manual filter re-entry | US-9.3, US-4.1 |
| JTBD-02.1 | Bulk ticket reassignment completes without full-page reload; audit trail updated per ticket | JRN-02.1: Reassign Bulk | Multi-select + bulk reassign completes without page reload; each ticket gets `assignment` audit action | US-0.3, US-6.2 |
| JTBD-02.2 | CSV downloaded within 30 seconds with stable column schema | JRN-02.1: Generate Weekly Report | Weekly CSV generated and downloaded in < 30 seconds; column order identical between exports | US-9.2, US-4.2 |
| JTBD-02.2 | Stable column schema means Excel pivot table requires zero manual fixes between exports | JRN-02.1: Paste into Excel | CSV column order is documented and never changes between versions; import to Excel is idempotent | US-9.2 |
| JTBD-02.3 | Category SLA days and auto-close rules editable from self-service admin UI | JRN (config flow) | Marcus updates SLA days for a category via admin UI; change reflected for new tickets immediately | US-2.3, US-2.1 |
| JTBD-03.1 | Submission form fully functional on 375px iPhone with no horizontal scrolling | JRN-03.1: Discover Form | Public `/submit` form loads with no horizontal scroll; no overlapping controls on 375px | US-15.2, US-15.3 |
| JTBD-03.1 | Category names use plain-language labels; no government jargon | JRN-03.1: Select Category | Category dropdown shows "Pothole or Road Damage" style labels; no internal codes visible to citizens | US-2.1 |
| JTBD-03.1 | Location can be entered as street address or selected on interactive map on mobile | JRN-03.1: Enter Location | Address geocodes to lat/lng automatically; map pin confirms location on 375px mobile | US-5.1 |
| JTBD-03.1 | Confirmation email with ticket number and status link arrives within 30 seconds of submission | JRN-03.1: Submit Form | Email sent via `ticket_created` template within 30 seconds; email contains ticket ID and `/track/{id}` link | US-8.1 |
| JTBD-03.2 | Status lookup accepts confirmation number or email without requiring account login | JRN-03.1: Receive Email & Check Status | Public `/track/{id}` page shows current status, last-updated, assigned department; no account required | US-0.2, US-10.2 |
| JTBD-03.2 | Status page shows current status, when last updated, and assigned department | JRN-03.1: Receive Email & Check Status | Ticket detail renders public-visible actions; internal comments excluded for anonymous callers | US-6.1, US-10.1 |
| JTBD-04.1 | OpenAPI 3.1 spec served at `/api/docs` covering 100% of non-Open311 endpoints | JRN-04.1: Read OpenAPI Spec | `/api/docs` serves Swagger UI; `openapi.json` documents all paths with types, enums, and examples | US-16.2 |
| JTBD-04.1 | Open311 GeoReport v2 endpoints pass full compliance test suite with 0 failures | JRN-04.1: Run Open311 Compliance Test | Open311 compliance test suite reports 0 failures; custom field structure consistent across categories | US-1.1, US-1.2, US-1.3 |
| JTBD-04.2 | Deployment completes end-to-end without errors using only the documented runbook | JRN-04.1: Docker Compose Up | Docker Compose up with `.env` from runbook starts all containers healthy; no undocumented steps | US-16.1, US-16.3 |
| JTBD-04.2 | OIDC settings configurable via admin UI or environment variable, not hardcoded PHP constants | JRN-04.1: Configure OIDC in Admin UI | OIDC issuer, client ID, client secret configurable via admin UI with "Test Connection" validation | US-15.4, US-11.1, US-11.2 |
| JTBD-04.3 | API client keys created and revoked from admin UI without database access | JRN-04.2: Create New API Client | API key generated via admin UI in < 2 minutes; shown once with copy button; stored with audit record | US-14.1, US-14.2 |
| JTBD-04.3 | Staff user accounts created and role-assigned from admin UI without SSH or hidden URLs | JRN-04.2: Assign Role and Save | Staff user creation available from main admin nav; role selector shows descriptions; department visible before save | US-3.1, US-3.2 |

---
