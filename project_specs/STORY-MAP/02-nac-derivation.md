---

## NaC Derivation Table

> Full traceability: JTBD outcome → journey stage → NaC → story. Every NaC is derived from a specific JTBD outcome at a specific journey stage.

| JTBD-ID | JTBD Outcome (Success Measure) | Journey Stage | NaC Statement | Mapped Story | SM-ID |
|---|---|---|---|---|---|
| JTBD-01.1 | Case created in ≤ 90 s without page reload | JRN-01.1: Receive | Clicking "New Case" in the persistent navbar loads `/cases/new` client-side with zero full-page reload | US-18.1 | SM-18.01 |
| JTBD-01.1 | Case created in ≤ 90 s without page reload | JRN-01.1: Enter Details | On form submit, success toast appears within 2 s and new case ID is visible without full-page reload | US-1.1 | SM-1.01 |
| JTBD-01.1 | Case created in ≤ 90 s without page reload | JRN-01.1: Assign | Selecting a department triggers auto-assignment; email notification is sent in the same API call | US-1.4, US-9.2 | SM-1.02, SM-9.02 |
| JTBD-01.1 | Case created in ≤ 90 s without page reload | JRN-01.1: Submit | Success toast "Case #id created" appears within 2 s; no full-page reload | US-1.2 | SM-1.03 |
| JTBD-01.1 | Case created in ≤ 90 s without page reload | JRN-01.1: Confirm | Toast link to `/cases/{id}` shows all metadata and timeline on one screen | US-4.1 | SM-4.01 |
| JTBD-01.2 | Any case located in ≤ 30 s via live search | JRN-01.2: Trigger | Global search input in navbar triggers live search; typing begins immediately without a form submit | US-3.1 | SM-3.01 |
| JTBD-01.2 | Any case located in ≤ 30 s via live search | JRN-01.2: Search | After 300 ms debounce with 3+ characters, PostgreSQL FTS returns results covering reporter name, description, address in ≤ 500 ms | US-11.1 | SM-11.01 |
| JTBD-01.2 | Any case located in ≤ 30 s via live search | JRN-01.2: Search | Matched text is highlighted with `<mark>` elements in result rows | US-11.2 | SM-11.02 |
| JTBD-01.2 | Any case located in ≤ 30 s via live search | JRN-01.2: Refine | Filter chips combinable with live search; adding a chip narrows results without clearing the search term | US-3.2, US-11.3 | SM-3.02, SM-11.03 |
| JTBD-01.2 | Any case located in ≤ 30 s via live search | JRN-01.2: Identify | Status badges are color-coded; category and date visible in row without opening each record | US-3.2 | SM-3.04 |
| JTBD-01.2 | Any case located in ≤ 30 s via live search | JRN-01.2: Respond | Split-pane case detail shows full timeline on right panel without additional navigation | US-4.1 | SM-4.02 |
| JTBD-01.3 | 10+ cases bulk-actioned in single click ≤ 60 s | JRN-01.3: Identify Cluster | Date + category filter chips surface the cluster of duplicates without page reload | US-3.2 | SM-3.05 |
| JTBD-01.3 | 10+ cases bulk-actioned in single click ≤ 60 s | JRN-01.3: Select Batch | "Select All on Page" checkbox appears; bulk action toolbar shows selected count on ≥ 1 selection | US-1.5 | SM-3.06 |
| JTBD-01.3 | 10+ cases bulk-actioned in single click ≤ 60 s | JRN-01.3: Choose Action | Bulk Close with substatus option available; a confirmation dialog shows exact case count before commit | US-1.5 | SM-1.04 |
| JTBD-01.3 | 10+ cases bulk-actioned in single click ≤ 60 s | JRN-01.3: Confirm | Single Confirm click closes all selected cases in one API call — no per-record reload | US-1.2 | SM-1.05 |
| JTBD-01.3 | 10+ cases bulk-actioned in single click ≤ 60 s | JRN-01.3: Verify | Toast "N cases closed"; case list refreshes without full-page reload showing remaining open cases | US-3.4 | SM-3.07 |
| JTBD-02.1 | Dept case list reached in ≤ 2 clicks after login | JRN-02.1: Login | After CAS/LDAP auth, session persists department filter and user lands on My Department view | US-12.1, US-12.2 | SM-12.01, SM-12.02 |
| JTBD-02.1 | Dept case list reached in ≤ 2 clicks after login | JRN-02.1: Orient | Dashboard Overdue stat card is scoped to Diane's department and is a clickable link to filtered list | US-5.1 | SM-5.01 |
| JTBD-02.1 | Dept case list reached in ≤ 2 clicks after login | JRN-02.1: View Cases | Pre-filtered "My Department" case list shows only Public Works open cases with filter chip visible | US-3.2 | SM-3.10 |
| JTBD-02.1 | Dept case list reached in ≤ 2 clicks after login | JRN-02.1: Prioritize | Overdue badge (red pill) on cases exceeding configured SLA threshold; days-overdue visible in row | US-3.2 | SM-3.12 |
| JTBD-02.1 | Dept case list reached in ≤ 2 clicks after login | JRN-02.1: Plan | Assignee update from case list row saves in one click with toast confirmation | US-1.4 | SM-1.06 |
| JTBD-02.2 | Case closed with photo on mobile in ≤ 3 min | JRN-02.2: Access | Application renders correctly at 375 px; no horizontal scroll; all touch targets ≥ 44 px | US-19.3 | SM-19.01 |
| JTBD-02.2 | Case closed with photo on mobile in ≤ 3 min | JRN-02.2: Access | JWT is silently refreshed 5 min before expiry during field use | US-12.3 | SM-12.03 |
| JTBD-02.2 | Case closed with photo on mobile in ≤ 3 min | JRN-02.2: Find Case | Pre-filtered mobile case list shows department's cases; tap opens case detail without extra navigation | US-3.2 | SM-3.13 |
| JTBD-02.2 | Case closed with photo on mobile in ≤ 3 min | JRN-02.2: Review | Case detail stacks vertically on mobile; location and status visible above the fold | US-4.1 | SM-4.03 |
| JTBD-02.2 | Case closed with photo on mobile in ≤ 3 min | JRN-02.2: Log Resolution | Action log form is fully usable at 375 px; notes textarea auto-expands; Submit button is thumb-reachable | US-4.3 | SM-4.04 |
| JTBD-02.2 | Case closed with photo on mobile in ≤ 3 min | JRN-02.2: Attach Photos | Native file picker opens camera roll on mobile; thumbnails confirm photo selection; upload succeeds | US-10.2 | SM-10.01 |
| JTBD-02.2 | Case closed with photo on mobile in ≤ 3 min | JRN-02.2: Submit | Case status changes to Closed; reporter email is dispatched; success toast appears without redirect | US-1.2 | SM-1.07 |
| JTBD-02.3 | Overdue cases visible in ≤ 60 s from dashboard | JRN-02.3: Check Dashboard | Overdue stat card on dashboard is scoped to Diane's department; count renders within ≤ 2 s | US-5.1 | SM-5.04 |
| JTBD-02.3 | Overdue cases visible in ≤ 60 s from dashboard | JRN-02.3: Surface Overdue | Clicking overdue stat card opens case list pre-filtered to overdue + department — no manual filter setup | US-5.4 | SM-5.05 |
| JTBD-02.3 | Overdue cases visible in ≤ 60 s from dashboard | JRN-02.3: Review Overdue List | Days-overdue shown in case list rows via badge or tooltip without opening each case | US-3.2 | SM-3.14 |
| JTBD-02.3 | Overdue cases visible in ≤ 60 s from dashboard | JRN-02.3: Investigate | Case detail timeline shows all history chronologically; last action date is prominent on load | US-4.1 | SM-4.06 |
| JTBD-02.3 | Overdue cases visible in ≤ 60 s from dashboard | JRN-02.3: Escalate | Inline reassignment + response note submitted in a single form action — two history entries created | US-4.2, US-4.3 | SM-4.07, SM-4.08 |
| JTBD-03.1 | New category configured in ≤ 10 min via admin UI | JRN-03.1: Navigate | Admin sidebar "Category Groups" link accessible in one click; breadcrumb confirms location | US-18.1 | SM-18.05 |
| JTBD-03.1 | New category configured in ≤ 10 min via admin UI | JRN-03.1: Create Group | Category group panel shows child categories inline with "Add Category" action visible in context | US-8.1 | SM-8.01 |
| JTBD-03.1 | New category configured in ≤ 10 min via admin UI | JRN-03.1: Configure Category | Inline validation confirms department exists; save is blocked if required fields are empty | US-8.2 | SM-8.02 |
| JTBD-03.1 | New category configured in ≤ 10 min via admin UI | JRN-03.1: Add Templates | Templates created in-context from the category edit sheet without navigating to a separate panel | US-8.2 | SM-8.03 |
| JTBD-03.1 | New category configured in ≤ 10 min via admin UI | JRN-03.1: Verify | New category appears in public form and case creation dropdowns immediately after save — no restart | US-2.1 | SM-2.01 |
| JTBD-03.1 | New category configured in ≤ 10 min via admin UI | JRN-03.1: Confirm Security | Confirmation dialog appears before any destructive admin operation | US-8.3 | SM-8.04 |
| JTBD-03.2 | Open311 client registered and key delivered ≤ 5 min | JRN-03.2: Navigate | Admin sidebar "API Clients" link accessible directly; no database access needed | US-18.1 | SM-18.06 |
| JTBD-03.2 | Open311 client registered and key delivered ≤ 5 min | JRN-03.2: Create Client | New Client form auto-generates UUID API key on save; no manual UUID creation required | US-14.1 | SM-14.01 |
| JTBD-03.2 | Open311 client registered and key delivered ≤ 5 min | JRN-03.2: Save & Retrieve Key | Generated key displayed once in a copyable field labeled "shown only once" on confirmation screen | US-14.1 | SM-14.02 |
| JTBD-03.2 | Open311 client registered and key delivered ≤ 5 min | JRN-03.2: Verify Activation | API key is immediately active for POST /open311/v2/requests; 201 response returned without restart | US-0.3 | SM-0.01 |
| JTBD-03.2 | Open311 client registered and key delivered ≤ 5 min | JRN-03.2: Deliver | Swagger UI at `/swagger-ui.html` documents all Open311 endpoints with GeoReport v2 descriptions | US-20.1 | SM-20.01 |
| JTBD-03.3 | Vendor API question answered via Swagger in ≤ 5 min | JRN-03.2: Deliver | All controllers annotated; spec covers 100% of endpoints; exportable as JSON/YAML | US-20.1, US-20.2 | SM-20.01, SM-20.02 |
| JTBD-04.1 | Anonymous submission on 375 px in ≤ 5 min | JRN-04.1: Discover | Public form loads at 375 px with no horizontal scroll; progress indicator and correct touch targets | US-19.3 | SM-19.03 |
| JTBD-04.1 | Anonymous submission on 375 px in ≤ 5 min | JRN-04.1: Discover | Step 1 of 5 progress indicator renders; Framer Motion step transitions ≤ 300 ms | US-2.1 | SM-2.02 |
| JTBD-04.1 | Anonymous submission on 375 px in ≤ 5 min | JRN-04.1: Contact | All contact fields optional; advancing without any contact info is permitted — zero friction | US-2.1 | SM-2.03 |
| JTBD-04.1 | Anonymous submission on 375 px in ≤ 5 min | JRN-04.1: Category | Two-level category selection renders with large touch targets; subcategory list appears after group tap | US-2.1 | SM-2.04 |
| JTBD-04.1 | Anonymous submission on 375 px in ≤ 5 min | JRN-04.1: Description & Photos | Native file picker opens camera roll; thumbnails confirm selection; textarea auto-expands on mobile | US-2.3 | SM-2.06 |
| JTBD-04.2 | Map pin placed in ≤ 60 s without address typing | JRN-04.1: Location | Tapping the map places a draggable pin; reverse-geocoding auto-fills address field within 1 s | US-2.2 | SM-2.05 |
| JTBD-04.3 | Case ID on confirmation screen in ≤ 3 s | JRN-04.1: Review & Submit | Confirmation screen displays "Case #id" prominently within 3 s; no auth wall; screenshot-friendly | US-2.4 | SM-2.08 |
| JTBD-04.3 | Case ID on confirmation screen in ≤ 3 s | JRN-04.1: Review & Submit | If email provided, acknowledgment email with case ID sent within 2 min | US-9.2 | SM-9.04 |

---
