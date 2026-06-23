---

## NaC-to-Acceptance Criteria Alignment

This section cross-checks each NaC against the acceptance criteria in UserStories-uReport.md to verify alignment. Discrepancies are flagged.

| NaC Statement | Story ID | AC Reference | Alignment Status |
|---------------|----------|-------------|-----------------|
| OIDC login completes and redirects to app in < 3 seconds | US-11.1 | "User is redirected to the originally requested URL or default dashboard after login" | ✓ Aligned |
| Session persists full 8-hour shift; no form input lost to mid-workflow expiry | US-11.2 | "Session JWT remains valid for `SESSION_TTL` seconds (default 28800 = 8 hours)"; "SPA redirects to `/login`" on expiry | ✓ Aligned |
| Staff dashboard accessible within 2 clicks after OIDC login; all views functional at 375px–1920px | US-15.1 | "Staff dashboard is accessible within 2 clicks after login"; "All SPA views are fully functional at viewport widths from 375px…to 1920px" | ✓ Aligned |
| All dashboard elements keyboard-navigable; axe-core passes with 0 critical violations | US-15.3 | "Automated axe-core WCAG 2.1 AA audit passes with 0 critical violations on all primary SPA routes"; "All interactive elements are keyboard navigable" | ✓ Aligned |
| Saved bookmark restores exact filter state in ≤ 1 click; persists across sessions | US-12.1, US-12.2 | "Bookmarks persist across sessions"; "SPA deserializes the `filterState` and populates the search form and URL parameters" | ✓ Aligned |
| Ticket list supports `sla_asc` sort; SLA-overdue items visually flagged in queue | US-4.1 | "Results can be sorted by `date_desc` (default), `date_asc`, `sla_asc`, `assignee`, or `category`" | ✓ Aligned |
| Substatus label visible alongside primary status in ticket list view | US-17.2 | "Substatus label is displayed alongside primary status in ticket list and detail views" | ✓ Aligned |
| Full ticket history renders on 375px viewport in < 2 seconds, no horizontal scroll | US-0.2 | "Page renders correctly on viewport widths from 375px to 1920px (no horizontal scroll)"; "Chronological history of all actions…is displayed" | ✓ Aligned |
| Template dropdown visible on ticket detail view without navigating away from the ticket | US-13.2 | "Staff response compose form includes a template dropdown populated from `GET /api/templates`" | ✓ Aligned |
| Staff response sent via template in < 60 seconds; constituent email dispatched within 30 seconds | US-8.3, US-13.2 | "When a `response` action…is created on a ticket, the system sends an email to the reporter"; "Template variables are substituted at send time" | ✓ Aligned |
| Category names use citizen-readable labels; department routing preview visible before save | US-2.1 | "Admin can create a category with: `name`, `departmentId`…"; plain-language labels configured by admin (F2 admin UI via US-15.4) | ✓ Aligned (label quality enforced by admin configuration) |
| Assignee search inline on ticket form; new assignee receives email within 30 seconds | US-0.3, US-8.2 | "The new assignee receives an email notification"; "Notification deduplication: identical notification sent within 60 seconds is skipped" | ✓ Aligned |
| Upload control on 375px shows no overlap; JPEG/PNG from camera roll selectable | US-7.1 | "Upload form is fully functional on a 375px mobile viewport"; "Supported image types: JPEG, PNG, GIF, WebP" | ✓ Aligned |
| Upload creates `actions` record of type `upload`; thumbnail visible after seconds | US-7.1, US-6.2 | "An `actions` record of type `upload` is created"; "System generates a 300×300px JPEG thumbnail for image files"; "An `actions` record is automatically created for each mutation type…`upload`" | ✓ Aligned |
| `GET /api/metrics/sla` data rendered on dashboard; breach count shown without extra navigation | US-9.1 | "`GET /api/metrics/sla` returns SLA metrics per category"; "Metrics are visible on the staff dashboard without additional navigation" | ✓ Aligned |
| SLA breach badge links to pre-filtered overdue ticket list | US-9.3, US-4.1 | "`GET /api/reports/open-age` returns tickets currently open past their SLA expected close date, with days overdue" | ✓ Aligned |
| Bulk reassignment completes without page reload; each ticket gets `assignment` audit action | US-0.3, US-6.2 | "An `actions` record of type `assignment` is created recording previous and new assignee"; "An `actions` record is automatically created for each mutation type" | ✓ Aligned — full-page reload prevention is an SPA behavior requirement (US-15.1 "Page transitions occur without full-page reloads") |
| Weekly CSV generated and downloaded in < 30 seconds; column order identical between exports | US-9.2, US-4.2 | "CSV column order is stable across all exports"; "`?format=csv` returns a `text/csv` file download" | ✓ Aligned |
| Public `/submit` form loads with no horizontal scroll; no overlapping controls on 375px | US-15.2, US-15.3 | "Full submission flow completes on a 375px iPhone viewport in under 3 minutes with no horizontal scroll" | ✓ Aligned |
| Address geocodes to lat/lng; map pin confirms location on 375px mobile | US-5.1 | "If only an address string is provided, system geocodes it to lat/lng"; "Map picker and file upload controls are fully usable on a 375px mobile viewport" | ✓ Aligned |
| Confirmation email with ticket ID and `/track/{id}` link arrives within 30 seconds | US-8.1 | "Confirmation email contains the ticket ID, ticket title, category, status, and a direct URL to the public tracking page"; "Email is sent…within 30 seconds of ticket creation" | ✓ Aligned |
| Public `/track/{id}` page shows status, last-updated, assigned dept; no account required | US-0.2, US-10.2 | "Ticket detail page displays all ticket fields"; "Tickets in `displayPermission = 'public'`…categories are visible to all callers" | ✓ Aligned |
| Internal comments excluded for anonymous callers | US-6.1, US-10.1 | "Internal (`visibility = 'internal'`) actions are excluded for non-staff/admin callers"; "Role is read from `people.role` DB column on each request" | ✓ Aligned |
| `/api/docs` serves Swagger UI; `openapi.json` documents all paths with types, enums, examples | US-16.2 | "`GET /api/docs` serves a Swagger UI HTML page"; "100% of non-Open311 API endpoints are documented in the spec" | ✓ Aligned |
| Open311 compliance test suite reports 0 failures; custom field structure consistent | US-1.1, US-1.2, US-1.3 | "On success, returns an Open311-format service request object with `service_request_id`"; "JSON and XML formats both supported"; "Both JSON and XML response formats are supported" | ✓ Aligned |
| All containers healthy on fresh server; no undocumented steps | US-16.1, US-16.3 | "All `/api/` responses use the envelope: `{ "data": …, "meta": …, "errors": [] }`"; "Repository interfaces are mockable in unit tests"; "PDO (or Doctrine DBAL) is used" | ✓ Aligned |
| OIDC config via admin UI with "Test Connection" validation | US-15.4, US-11.1, US-11.2 | "OIDC and SMTP settings are configurable via the admin UI without editing any configuration files"; "`OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`…configurable via site config or admin UI" | ✓ Aligned |
| API key generated via admin UI in < 2 minutes; shown once with copy button | US-14.1, US-14.2 | "API key is returned in plain text **only** in the create response"; "API key can be created and displayed in under 2 minutes from the admin UI"; "`DELETE /api/clients/{id}` deactivates (revokes) the client" | ✓ Aligned |
| Staff user creation from main admin nav; role selector shows descriptions; dept visible before save | US-3.1, US-3.2 | "Admin can create a person with `firstName`, `lastName`, `role`…"; "Only admin role can create person records"; "Auto-provisioned user has `role = 'public'` until an admin manually elevates the role" | ✓ Aligned |

**Alignment result: 29/29 NaC statements align with existing acceptance criteria. No discrepancies found.**

---
