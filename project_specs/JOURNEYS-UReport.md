# User Journey Maps — uReport CRM Modernization

| Field | Value |
|---|---|
| **Product** | uReport Civic CRM (311 Service Request Management) |
| **Version** | 1.0 |
| **Date** | 2026-07-06 |
| **Related Personas** | PERSONAS-UReport.md |
| **Related JTBD** | JTBD-UReport.md |
| **Related PRD** | PRD-UReport.md |
| **Status** | Active |

---

## Journey Index

| JRN-ID | Persona | Scenario | Key JTBD | Stages |
|---|---|---|---|---|
| JRN-01.1 | PER-01 Marcus (311 Operator) | Live-call case intake — creating a new ticket during an active phone call | JTBD-01.1 | 5 |
| JRN-01.2 | PER-01 Marcus (311 Operator) | Caller status inquiry — locating a specific case while the caller waits | JTBD-01.2 | 5 |
| JRN-01.3 | PER-01 Marcus (311 Operator) | Storm event bulk cleanup — closing dozens of duplicate reports in one action | JTBD-01.3 | 5 |
| JRN-02.1 | PER-02 Diane (Dept Supervisor) | Morning triage — reviewing and prioritizing department cases to brief the crew | JTBD-02.1 | 5 |
| JRN-02.2 | PER-02 Diane (Dept Supervisor) | Field closure — closing a resolved case and attaching photo evidence from a job site | JTBD-02.2 | 6 |
| JRN-02.3 | PER-02 Diane (Dept Supervisor) | Overdue escalation — surfacing and acting on cases that have exceeded the service threshold | JTBD-02.3 | 5 |
| JRN-03.1 | PER-03 Jordan (Admin) | New service category — configuring a brand-new category end-to-end in the admin UI | JTBD-03.1 | 6 |
| JRN-03.2 | PER-03 Jordan (Admin) | API client onboarding — registering a new Open311 client and issuing credentials | JTBD-03.2 | 5 |
| JRN-04.1 | PER-04 Priya (Citizen) | Mobile submission — reporting a pothole from a smartphone without creating an account | JTBD-04.1, JTBD-04.2, JTBD-04.3 | 6 |

---

## PER-01: Marcus Rivera — 311 Operator

---

### JRN-01.1: Live-Call Case Intake

**Persona:** PER-01 (Marcus Rivera)

**Scenario:** A constituent calls the 311 line to report a large pothole on Oak Street that is damaging vehicles. Marcus has the caller on the line and needs to open a new ticket, capture all required information, and submit it — all without losing call focus, triggering a page reload, or asking the caller to wait while a page spins.

**Related Jobs:** JTBD-01.1

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **Receive** | Picks up the 311 call; keeps existing case list open on second monitor; moves to the "New Case" action | Navigation Shell (F18) / Quick-link button (F5) | "Let me open a new case before she finishes her description" | Alert, focused | In the old system, clicking New Case triggers a full-page reload that breaks his place in the list | Persistent shell with a New Case button always visible; no navigation required |
| **Enter Details** | Fills in category, location (Oak Street), description, and reporter name while listening | Case creation form (F1, F17) | "Is this all on one screen? I don't want to miss a field while she's talking" | Concentrated, slightly anxious | Multi-step page loads interrupt recall; inconsistent field placement causes errors | Single-scrollable form; all required fields visible; auto-suggest for category and address (F8, F11) |
| **Assign** | Selects "Public Works" department from department dropdown; assignee auto-populates | Case creation form → Department selector (F1, F7) | "I know this goes to Public Works — let me make sure the notification fires automatically" | Confident | Has to remember which department owns potholes; no auto-routing by category | Category-to-department auto-assignment on category selection; visible confirmation that notification is queued (F9) |
| **Submit** | Clicks Submit; stays on the call | Case creation form (F1, F17) | "Please don't reload the whole page… I need to confirm this worked" | Tense | Full-page reload in legacy system; loses state on slow connections | SPA form submission with success toast within 2 s; newly created case ID displayed inline without navigating away (F1, F17) |
| **Confirm** | Reads the new case ID to the caller; returns to case list on second monitor | Case detail (F4) / Case list (F3) | "Case 4,821 created. She has her number and I'm back on the list" | Relieved, satisfied | Old system requires re-navigating through menu to find the new record | Immediate link to the new case record in the success toast; breadcrumb returns to case list in one click (F18) |

#### Key Moments

- **Decision Point:** Enter Details stage — if any required field is ambiguous or missing from the visible form, Marcus must interrupt the caller to ask again, damaging the experience for both parties.
- **Risk of Abandonment:** Submit stage — a full-page reload at this moment can cause Marcus to fall back to paper notepad logging, defeating the system's purpose.
- **Delight Opportunity:** Confirm stage — reading the case ID to the caller in real time ("Your case number is 4,821") is a moment of visible competence; the system enables this only if the ID appears instantly.

#### Success Outcome

Marcus creates a complete new case in under 90 seconds while maintaining an active phone call, measured from first keystroke to confirmation of case ID (JTBD-01.1 success measure).

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Receive | F5 (Dashboard quick-link), F18 (Navigation Shell) |
| Enter Details | F1 (Case Lifecycle), F17 (Design System), F8 (Category Mgmt) |
| Assign | F1 (Case Lifecycle), F7 (Department Mgmt), F9 (Email Notification) |
| Submit | F1 (Case Lifecycle), F17 (Design System) |
| Confirm | F4 (Case Detail), F3 (Case List), F18 (Breadcrumbs) |

---

### JRN-01.2: Caller Status Inquiry — Instant Case Lookup

**Persona:** PER-01 (Marcus Rivera)

**Scenario:** A caller says she reported a broken streetlight three weeks ago and wants to know if it has been fixed. She cannot remember her case number but gives Marcus her name ("Maria Santos") and the street ("Elm Avenue"). Marcus needs to find the record before the caller's patience runs out.

**Related Jobs:** JTBD-01.2

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **Trigger** | Caller asks for status; Marcus moves focus to the case list on his second monitor | Case list (F3) | "Name, address — let me start typing" | Calm but aware the clock is ticking | Legacy system requires submitting a filter form and waiting for full-page reload before seeing any results | Live global search bar always visible in navbar; typing begins immediately (F18, F11) |
| **Search** | Types "Maria Santos" into the live search bar | Case list search (F3, F11) | "Am I spelling this right? Results should appear as I type…" | Focused | No live feedback in current system forces multiple form submissions to refine a query | Debounced live search (≤300 ms) returns results after 3 characters; matched name is highlighted (F11) |
| **Refine** | Search returns 3 results; Marcus adds an address filter "Elm Ave" using a filter chip | Filter panel (F3) | "Three results — let me narrow it down by street" | Methodical | No combined search-plus-filter in current system; requires starting over with a different query | Filter chips usable alongside live search; combined query narrows results without a new page load (F3) |
| **Identify** | Scans result rows; spots the correct record by matching category "Streetlight" and date | Case list row (F3, F17) | "There it is — submitted three weeks ago, still Open. She'll want to know that." | Relieved | Dense undifferentiated rows make visual scanning hard in the current list | Status badge pills color-coded per status; category and date visible in row without opening the record (F3, F17) |
| **Respond** | Opens the case record; reads the timeline to get the latest action note; relays status to caller | Case detail timeline (F4) | "The last action says 'Scheduled for repair week of July 14' — I can tell her that" | Confident | Current system requires navigating to a separate history page; takes too long on an active call | Split-pane case detail with timeline always visible; no additional navigation required (F4) |

#### Key Moments

- **Decision Point:** Search stage — if the live search does not return results quickly, Marcus must decide whether to ask the caller for more information (potentially embarrassing) or put her on hold to run a manual filter.
- **Risk of Abandonment:** Refine stage — if search and filters cannot be combined without a reload, Marcus may give up and tell the caller he'll call back, which increases callbacks and reduces caller satisfaction.
- **Delight Opportunity:** Identify stage — keyword highlighting lets Marcus visually confirm the correct record in under 3 seconds, making the response feel authoritative and fast.

#### Success Outcome

Marcus locates the specific case within 30 seconds of starting a search, including applying one filter, without any full-page reload (JTBD-01.2 success measure).

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Trigger | F3 (Case List), F18 (Navigation Shell) |
| Search | F3 (Case List), F11 (Full-Text Search) |
| Refine | F3 (Filter Panel) |
| Identify | F3 (Case List), F17 (Design System — badge pills) |
| Respond | F4 (Case Detail — timeline panel) |

---

### JRN-01.3: Storm Event Bulk Cleanup

**Persona:** PER-01 (Marcus Rivera)

**Scenario:** A major storm overnight generated 34 separate case reports all describing the same downed tree on Maple Boulevard. Marcus needs to close all duplicates with the "Duplicate" substatus and leave a single canonical case open — without spending an hour opening and saving 33 individual records.

**Related Jobs:** JTBD-01.3

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **Identify Cluster** | Filters case list by yesterday's date and "Fallen Tree" category; visually spots the cluster of 34 near-identical rows | Case list filter panel (F3) | "All of these are the same tree. I need to mark 33 of them as Duplicate" | Exasperated | Current system has no bulk operation; each record requires a separate open-save-reload cycle | Filter chips surface the cluster quickly; dense list with visible location column makes duplicates obvious (F3) |
| **Select Batch** | Checks the "Select All on Page" checkbox; deselects the one canonical case he wants to keep open | Case list bulk selection (F3, F1) | "Select all, then uncheck the one I'm keeping… now I have 33 selected" | Deliberate | No checkbox selection exists in the current UI; bulk operations are impossible without third-party tooling | Checkbox per row + Select All header; row count shown in bulk action toolbar as selections are made (F3) |
| **Choose Action** | Clicks "Bulk Close" in the toolbar that appeared; selects substatus "Duplicate" from the dropdown | Bulk action toolbar (F1, F3) | "I want to close all 33 with 'Duplicate' — is there a way to add a note too?" | Focused | No bulk action in current system; supervisor escalation is the only relief valve | Bulk action toolbar appears on ≥2 selections; options: Close (with substatus), Reassign, Change Status; optional note field (F1) |
| **Confirm** | Reads the confirmation dialog ("Close 33 cases with substatus: Duplicate?"); clicks Confirm | Confirmation dialog (F1, F17) | "33 cases — yes, that's right. Let me confirm." | Cautious | No confirmation step in current system; a misclick closes the wrong records with no undo | Confirmation dialog shows exact count and chosen action; Cancel is equally prominent to Confirm (F1, F17) |
| **Verify** | Bulk operation executes; sees success toast "33 cases closed"; returns to filtered list showing 1 remaining open case | Case list (F3, F17) | "Done. One open case remaining, 33 closed. That took 2 minutes." | Satisfied, relieved | Current approach takes 30+ minutes of repetitive edits | Single API call for all 33; toast confirms count; updated list loads without page reload (F1, F3, F17) |

#### Key Moments

- **Decision Point:** Select Batch stage — Marcus must carefully keep the canonical case unselected; if the UI doesn't make selection state obvious (e.g., highlighted rows, count in toolbar), he may accidentally close all 34.
- **Risk of Abandonment:** Identify Cluster stage — if filtering does not surface the cluster clearly, Marcus may give up and ask a supervisor to handle it, creating a bottleneck.
- **Delight Opportunity:** Verify stage — completing 33 closures in one confirmation click in under 2 minutes is a dramatic productivity improvement that Marcus will immediately notice and appreciate.

#### Success Outcome

Marcus bulk-closes 33 duplicate cases in a single confirmation action in under 60 seconds total from first checkbox to success toast (JTBD-01.3 success measure).

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Identify Cluster | F3 (Case List + Filter Panel) |
| Select Batch | F3 (Bulk Selection), F1 (Case Lifecycle) |
| Choose Action | F1 (Bulk Operations), F3 (Bulk Toolbar) |
| Confirm | F1 (Case Lifecycle), F17 (Design System — Dialog) |
| Verify | F3 (Case List), F17 (Design System — Toast) |

---

## PER-02: Diane Kowalski — Department Field Supervisor

---

### JRN-02.1: Morning Department Triage

**Persona:** PER-02 (Diane Kowalski)

**Scenario:** Diane arrives at her office at 7:45 AM before her crew's morning briefing at 8:00 AM. She has 15 minutes to review everything assigned to Public Works, identify the highest-priority items, and decide which crew members to dispatch. She does not want to deal with filters, irrelevant records from other departments, or manual date calculations.

**Related Jobs:** JTBD-02.1

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **Login** | Opens uReport on her laptop; authenticates via CAS single sign-on | Login screen (F12), Navigation Shell (F18) | "Let me get to my cases before the team arrives" | Purposeful, time-pressured | Old system drops her on a global case list after login; she must re-apply department filter every session | Authenticated session persists filter preference; lands directly on My Department view after login (F3, F5) |
| **Orient** | Lands on the dashboard; scans stat cards for her department's totals | Dashboard (F5) | "14 open, 2 overdue — I need to deal with those overdue ones first" | Alert | Dashboard shows system-wide totals, not department-specific, in the legacy system | Stat cards scoped to the logged-in user's department by default; overdue count is a clickable link (F5) |
| **View Cases** | Clicks "All Open Cases" quick-link; case list is pre-filtered to Public Works open cases | Case list (F3) | "Good — these are all mine. No other department noise." | Relieved | Current system requires manually selecting department from filter and reloading before seeing the right set | Pre-filtered "My Department" view; filter chip shows "Department: Public Works" with the option to remove it (F3) |
| **Prioritize** | Scans the list; notes overdue badge on two records and high-volume category "Pothole" | Case list (F3, F17) | "The two overdue ones need to go to my senior crew. The potholes can wait until afternoon." | Determined | No overdue visual indicator; Diane must manually calculate date differences to find late cases | Overdue badge (red pill) on any case exceeding the configured threshold; visible without opening the record (F3, F17) |
| **Plan** | Notes case IDs for the overdue jobs; navigates to the crew dispatch tool (external); closes her laptop for the briefing | Case list (F3) | "Dispatching Carlos and Jenna to the overdue ones. I'm ready for the briefing." | Confident | No way to flag or annotate cases for crew assignment within uReport without logging a full action | Optional quick-note or flag on a row; assignee update takes one click from the case list row (F1, F3) |

#### Key Moments

- **Decision Point:** Prioritize stage — Diane's entire morning dispatch depends on the visual overdue signal. If it is absent, she may send crews to lower-priority work and let SLA-breaching cases slip further.
- **Risk of Abandonment:** Login stage — if Diane lands on a global, unfiltered list and must re-apply filters under time pressure, she is likely to ask Marcus to email her a daily summary instead of using the system.
- **Delight Opportunity:** Orient stage — seeing department-scoped stat cards on the dashboard saves Diane a full navigation step and makes her feel the system was built for her role.

#### Success Outcome

Diane reaches her department's pre-filtered open case list within 2 clicks of logging in and identifies priority items within 30 seconds of landing on the list (JTBD-02.1 success measure).

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Login | F12 (Authentication), F18 (Navigation Shell) |
| Orient | F5 (Dashboard) |
| View Cases | F3 (Case List — filtered view) |
| Prioritize | F3 (Case List), F17 (Design System — overdue badge) |
| Plan | F1 (Case Lifecycle — assignee), F3 (Case List) |

---

### JRN-02.2: Field Resolution Closure with Photo Evidence

**Persona:** PER-02 (Diane Kowalski)

**Scenario:** Diane is standing at the corner of Oak and 3rd Street where her crew just finished filling a large pothole. She wants to close the case, log what was done ("Pothole filled with cold patch asphalt, area secured"), attach two photos she just took on her phone, and trigger the notification to the reporter — all before driving to the next job site, which is 10 minutes away.

**Related Jobs:** JTBD-02.2

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **Access** | Opens uReport in her phone's mobile browser; logs in via CAS | Login screen (F12), Navigation Shell (F18, F19) | "Please just work on mobile this time. I don't want to drive back to the office." | Anxious, hopeful | Current system is completely unusable on mobile — horizontal scroll, tiny text, broken layout | Mobile-first responsive layout at 375 px; CAS SSO remembers session for the shift (F12, F19) |
| **Find Case** | Navigates to My Department view; taps the pothole case she assigned to the crew this morning | Case list (F3, F19) | "There it is — Case 4,812, Pothole, Oak & 3rd. Let me open it." | Focused | Mobile case list has no touch-optimized controls; tap targets are too small in the legacy system | Pre-filtered mobile case list; large touch targets (≥44 px); row tap opens case detail without extra navigation (F3, F19) |
| **Review** | Case detail opens; confirms it's the right record by checking the location and category | Case detail (F4, F19) | "Yes — Oak & 3rd, Pothole, assigned to Carlos. This is the one." | Reassured | Case detail on mobile requires horizontal scrolling to find key metadata in the legacy system | Responsive split-pane stacks vertically on mobile; location and status visible above the fold without scrolling (F4, F19) |
| **Log Resolution** | Taps "Log Response"; types resolution note in the text area; selects "Resolved" substatus; toggles "Notify reporter" | Action log form (F9, F19) | "I'll type what we did, mark it Resolved, and make sure the reporter gets an email" | Deliberate | On mobile, the response form is cut off and the Send button is unreachable without zooming | Full action log form accessible on 375 px; textarea auto-expands; toggle and submit button within thumb reach (F9, F19) |
| **Attach Photos** | Taps "Add Photos"; selects 2 photos from her camera roll; previews thumbnails | Media upload (F10, F19) | "Two photos should be enough. I can see the thumbnails — looks right." | Satisfied | Photo upload non-functional on mobile in the current system; requires returning to a desktop | Native file picker accesses camera roll on mobile; thumbnail previews confirm correct photos selected (F10, F19) |
| **Submit** | Taps Submit; sees success toast "Case 4,812 closed. Reporter notified."; puts phone away | Case detail (F1, F17) | "Done. Reporter gets the update. On to the next one." | Relieved, accomplished | Full-page reload on submit sends her back to the homepage, losing context on mobile | Single-submission closure; success toast with case number and notification confirmation; no redirect required (F1, F17) |

#### Key Moments

- **Decision Point:** Access stage — if the mobile layout is broken at the first screen, Diane will abandon the attempt immediately and revert to batch-closing from her desk at end of day, which inflates open case metrics.
- **Risk of Abandonment:** Attach Photos stage — if photo upload fails on mobile (as it does in the current system), the entire field-closure workflow fails and Diane must return to the office to complete the record.
- **Delight Opportunity:** Submit stage — receiving the success toast "Reporter notified" while standing at the completed job site gives Diane immediate confirmation of the full workflow closing end-to-end in the field.

#### Success Outcome

Diane closes a case, logs a resolution note, attaches two photos, and triggers reporter notification from a 375 px mobile browser in under 3 minutes while standing at the field site (JTBD-02.2 success measure).

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Access | F12 (Authentication), F18 (Navigation Shell), F19 (Responsive Design) |
| Find Case | F3 (Case List), F19 (Responsive Design) |
| Review | F4 (Case Detail), F19 (Responsive Design) |
| Log Resolution | F9 (Action Logging + Email), F19 (Responsive Design) |
| Attach Photos | F10 (Media Upload), F19 (Responsive Design) |
| Submit | F1 (Case Lifecycle), F17 (Design System — Toast) |

---

### JRN-02.3: Overdue Case Escalation

**Persona:** PER-02 (Diane Kowalski)

**Scenario:** It is Wednesday mid-morning. Diane received a call from a department director asking why three constituent complaints have gone unresolved for over 10 days. She needs to find all overdue cases in her department immediately, understand what is blocking each one, and escalate or reassign before the director's afternoon briefing.

**Related Jobs:** JTBD-02.3

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **Check Dashboard** | Logs into uReport; lands on dashboard; scans stat cards | Dashboard (F5) | "Director mentioned overdue cases. How many do I actually have?" | Stressed, defensive | Dashboard shows total counts only; no overdue breakdown in the legacy system | Overdue stat card scoped to Diane's department; number is a clickable link to pre-filtered list (F5) |
| **Surface Overdue** | Clicks the overdue count card ("4 overdue") on the dashboard | Dashboard → Case list (F5, F3) | "4 overdue. OK — which ones and how late are they?" | Anxious | Current system requires exporting to a spreadsheet and manually calculating days-open to find overdue cases | Click on stat card opens case list pre-filtered to overdue + department; no manual filter setup required (F5, F3) |
| **Review Overdue List** | Scans the 4 overdue cases; reads category, reporter, and days-overdue in the list rows | Case list with overdue badge (F3, F17) | "10 days, 12 days, 8 days, 9 days. Two of these are the director's complaints." | Worried | No days-overdue column; Diane must open each record to compare submission date with today | Days overdue shown in list row (or overdue badge with tooltip showing elapsed days); no case-opening required (F3, F17) |
| **Investigate** | Opens the 10-day overdue case; reads the action timeline to understand the blocker | Case detail timeline (F4) | "No action since it was assigned 10 days ago — Carlos never picked this up" | Frustrated with crew, empathetic toward reporter | Timeline in current system is buried; requires navigating away from the list and back | Split-pane case detail; timeline immediately visible on open; last action date prominent (F4) |
| **Escalate** | Reassigns the case to a senior crew member; adds a response note "Escalated — priority dispatch Friday" | Case detail inline edit + action log (F1, F4, F9) | "I'm reassigning this to Jenna and logging that it's been escalated" | Taking control | Reassignment and response logging require two separate form submissions in the current system | Inline reassignment + action note on one form; single submit records both the reassignment and the log (F1, F4, F9) |

#### Key Moments

- **Decision Point:** Surface Overdue stage — if Diane cannot reach the overdue list from the dashboard in one click, she must navigate to the case list and manually build a filter under time pressure, likely calling Marcus instead.
- **Risk of Abandonment:** Review Overdue List stage — without a days-overdue column or badge, Diane must open each record individually to calculate elapsed time, making a quick pre-meeting review impossible.
- **Delight Opportunity:** Check Dashboard stage — seeing a department-scoped overdue count on the first screen she opens tells Diane the system already knows the answer to the director's question, giving her immediate situational awareness.

#### Success Outcome

Diane identifies all overdue department cases within 60 seconds of opening the dashboard without manual calculations or data export (JTBD-02.3 success measure).

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Check Dashboard | F5 (Dashboard — overdue stat card) |
| Surface Overdue | F5 (Dashboard), F3 (Case List — pre-filtered) |
| Review Overdue List | F3 (Case List), F17 (Design System — overdue badge) |
| Investigate | F4 (Case Detail — timeline) |
| Escalate | F1 (Case Lifecycle), F4 (Case Detail inline edit), F9 (Action Logging) |

---

## PER-03: Jordan Calloway — City IT System Administrator

---

### JRN-03.1: New Service Category Configuration

**Persona:** PER-03 (Jordan Calloway)

**Scenario:** The city's Mobility & Transportation department has just launched an e-scooter program. Residents are already calling 311 to report blocked scooters. Jordan needs to create a new service category "E-Scooter Obstruction" under the category group "Transportation", assign it to the Mobility department, and add two response templates — before operators start routing calls the next morning.

**Related Jobs:** JTBD-03.1

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **Navigate** | Logs into uReport as admin; opens the Admin sidebar; clicks "Category Groups" | Navigation Shell / Admin sidebar (F18) | "Categories, then I'll add the group first if needed. Let me check if 'Transportation' exists." | Methodical | Admin sidebar navigation is inconsistent across legacy panels; Jordan re-learns it each time | Collapsible admin sidebar with clear section groupings (Cases, People, Admin); breadcrumb confirms location (F18) |
| **Create Group** | Checks category group list; "Transportation" already exists; navigates to Categories under it | Category Group admin panel (F8) | "Good — Transportation is there. Now I'll add E-Scooter Obstruction as a category." | Efficient | Admin panels in legacy system open in separate tabs with no hierarchy; easy to lose context | Category group panel shows child categories inline; "Add Category" action visible in context (F8) |
| **Configure Category** | Opens "New Category" form; enters name, selects category group "Transportation", assigns department "Mobility" | Category admin panel (F8, F7) | "Name, group, department — that's the core. I need to assign Mobility, which is new. Is it there?" | Careful | Foreign key errors can occur silently if department is not yet in the system; no validation feedback | Inline validation confirms department exists; dropdown shows available departments; Save blocked if required fields empty (F8, F7) |
| **Add Response Templates** | Navigates to Response Templates; adds two templates linked to the new category | Admin panel — Response Templates (F13) | "Template 1: 'Scooter has been reported to the vendor.' Template 2: 'Obstruction cleared.' Done." | Focused | Templates are stored in a separate panel with no link to category context; Jordan must remember to go there | Contextual "Add Template" action from the category record; templates created in-context without losing the category panel (F13, F8) |
| **Verify** | Navigates to the public submission form in a separate tab; confirms "E-Scooter Obstruction" appears in the category dropdown | Public submission form (F2) | "There it is in the dropdown. Marcus will be able to select it tomorrow morning." | Satisfied | Legacy system requires a cache flush or server restart to reflect new category data in the UI | New category available immediately after save, no restart required; Jordan can verify in a separate tab within seconds (F8, F2) |
| **Confirm Security** | Returns to admin panel; double-checks the delete button for the new category has a confirmation dialog before leaving | Category admin panel (F8, F17) | "I'm not going to delete it, but I want to make sure there's a confirm step — one wrong click in the old system corrupted data" | Cautious | No confirmation dialog on delete in legacy system; a misclick can corrupt the lookup table silently | Confirmation dialog on all destructive operations; delete requires typing the category name or clicking a second confirmation (F8, F17) |

#### Key Moments

- **Decision Point:** Configure Category stage — if the department "Mobility" does not yet exist in the system, Jordan must create it first. The UI should surface this dependency clearly rather than letting him save an invalid category.
- **Risk of Abandonment:** Add Response Templates stage — if templates must be created in a completely separate, context-free admin panel, Jordan may skip this step for "now" and never return, leaving operators without canned responses.
- **Delight Opportunity:** Verify stage — immediately seeing the new category appear in the public submission form in real time (without a cache flush) validates Jordan's work instantly and builds confidence in the admin UI.

#### Success Outcome

Jordan creates a fully configured new service category including group assignment, department link, and two response templates in under 10 minutes without consulting documentation or writing any SQL (JTBD-03.1 success measure).

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Navigate | F18 (Navigation Shell — admin sidebar) |
| Create Group | F8 (Category Group Management) |
| Configure Category | F8 (Category Management), F7 (Department Management) |
| Add Response Templates | F13 (Admin Panels — Response Templates), F8 |
| Verify | F2 (Public Submission Form), F8 |
| Confirm Security | F8 (Category Management), F17 (Design System — Dialog) |

---

### JRN-03.2: Open311 API Client Onboarding

**Persona:** PER-03 (Jordan Calloway)

**Scenario:** A vendor building a city mobile app has emailed Jordan asking for API access to submit 311 requests via the Open311 endpoint. The vendor gave Jordan their company name ("CivicPath Inc."), a contact name ("Ravi Patel"), and an email address. Jordan needs to register the client and send Ravi a working API key before the vendor's sprint ends on Friday.

**Related Jobs:** JTBD-03.2

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **Navigate** | Opens Admin sidebar; navigates to "API Clients" panel | Navigation Shell / Admin sidebar (F18) | "API Clients — let me create the record for CivicPath" | Purposeful | Legacy system requires direct database insert; Jordan must know the table schema and UUID format | Admin sidebar link "API Clients" leads directly to the client list panel; no database access needed (F14, F18) |
| **Create Client** | Clicks "New Client"; fills in name ("CivicPath Inc."), contact name, email, contact method | Client admin form (F14) | "Name, contact, email — that's all I need. The system generates the key." | Focused | Current process requires manually crafting a SQL INSERT with a UUID; prone to syntax errors | Simple form with Name, Contact Person, Contact Method fields; API key auto-generated on save; no manual UUID creation (F14) |
| **Save and Retrieve Key** | Clicks Save; confirmation screen displays the generated UUID API key in a prominent copyable field | Client creation confirmation (F14, F17) | "There's the key. Let me copy it now — I know it's only shown once." | Alert | Current process shows no confirmation; Jordan must query the database table to retrieve the generated key | API key displayed once on the confirmation screen in a copyable text input with a "Copy" button; one-time display is clearly labeled (F14, F17) |
| **Verify Activation** | Tests the key by sending a POST /requests call from his terminal using curl; receives a valid 201 response | Open311 API (F0) | "curl -X POST… 201 Created. The key is live immediately — no restart needed." | Relieved | Legacy system sometimes requires a service restart to activate new API key records | API key active immediately after save via Spring Security filter; no restart required; Jordan can test within seconds of creation (F0, F14) |
| **Deliver** | Copies the key from his clipboard; pastes it into a reply email to Ravi Patel with integration instructions link | Email (external) / Swagger UI (F20) | "Key copied. I'll include the Swagger UI link so they know the endpoint structure." | Helpful, efficient | No structured delivery workflow; key was previously emailed in plain text body with no context | Key copy action plus optional link to Swagger UI in the confirmation screen; Jordan delivers the key and docs in one step (F14, F20) |

#### Key Moments

- **Decision Point:** Save and Retrieve Key stage — the one-time display of the API key is a critical UX moment. If Jordan navigates away before copying it, he must invalidate the key and generate a new one, delaying the vendor.
- **Risk of Abandonment:** Navigate stage — if Jordan cannot find the API Clients panel in the admin sidebar, he will fall back to the database insert approach (his current workaround), bypassing the UI entirely.
- **Delight Opportunity:** Verify Activation stage — the key working immediately without a service restart is a concrete improvement over the legacy process and will be instantly noticed by Jordan on his first use.

#### Success Outcome

Jordan registers a new Open311 client and delivers a valid, immediately active API key to the vendor in under 5 minutes entirely through the admin UI with no database access (JTBD-03.2 success measure).

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Navigate | F18 (Navigation Shell — admin sidebar) |
| Create Client | F14 (Client / API Key Management) |
| Save and Retrieve Key | F14 (Client Management), F17 (Design System — copyable field) |
| Verify Activation | F0 (Open311 API), F14 |
| Deliver | F14 (Client Management), F20 (Swagger UI) |

---

## PER-04: Priya Nair — Constituent / Citizen Reporter

---

### JRN-04.1: Mobile Service Request Submission

**Persona:** PER-04 (Priya Nair)

**Scenario:** Priya is walking to the bus stop and notices a large pothole at the intersection of Cedar Street and 7th Avenue that has been there for two weeks. She takes out her phone, searches "311 report pothole [city name]", lands on the city's 311 portal, and tries to submit a report before her bus arrives in 7 minutes. She has never used this system before and does not want to create an account.

**Related Jobs:** JTBD-04.1, JTBD-04.2, JTBD-04.3

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **Discover** | Finds the city 311 portal from a search result; taps the link; the submission form loads on her phone | Public submission form (F2, F19) | "Is this the right site? Will this actually work on my phone or will it be a mess?" | Uncertain, impatient | Current form loads a desktop-width layout on mobile; she immediately sees horizontal scrollbars and tiny fields | Mobile-first form loads immediately; progress indicator ("Step 1 of 5") sets expectations; no horizontal scroll at 375 px (F2, F19) |
| **Contact** | Step 1 asks if she wants to provide contact info (optional); she enters her email for status updates; taps Next | Step 1 — Contact Info (F2) | "I'll give my email so I know when it's fixed. But I'm glad it's optional." | Mildly relieved | Current form gates submission behind account creation; Priya cannot submit without registering | Anonymous submission with optional email field; no account creation required; clear label "Optional — for status updates" (F2) |
| **Category** | Step 2 shows category groups; she taps "Roads & Sidewalks"; subcategory list appears; she selects "Pothole" | Step 2 — Category (F2, F8) | "Roads and sidewalks — yes. Pothole — yes. Easy." | Confident | Legacy form shows all categories in an unorganized flat list; hard to find the right option on mobile | Two-level category selection (group → category); large tap targets; filtered by group to reduce options shown at once (F2, F8) |
| **Location** | Step 3 shows an interactive map; she taps the map near Cedar & 7th to drop a pin; the address field auto-fills | Step 3 — Location / Map pin (F2, F16) | "I don't know the exact address — I'll just tap where the hole is and the app will figure it out" | Curious, then pleased | Current form requires typing a precise street address; Priya doesn't know the number for this intersection | Interactive map with draggable pin; reverse-geocoding auto-fills address field; no typing required; map loads within 3 s on mobile (F2, F16) |
| **Description & Photos** | Step 4 prompts for description and photos; she types a brief note and uploads 1 photo from her camera roll | Step 4 — Description + Photos (F2, F10) | "Let me add a photo — it'll show how bad this is. Just one is enough." | Practical | Photo upload non-functional on mobile in current system; description textarea is too small to use with a phone keyboard | Large textarea with auto-expand; native file picker opens camera roll; thumbnail preview confirms photo selection; multiple files supported (F2, F10) |
| **Review & Submit** | Step 5 shows a summary of all inputs; she confirms and taps Submit; confirmation screen appears with Case ID | Step 5 — Review → Confirmation screen (F2, F9, F17) | "Case #5,102. I'll take a screenshot. And they said an email confirmation is coming." | Satisfied, relieved | Current system shows no confirmation; Priya has no proof the report was received | Dedicated confirmation screen with prominent case ID in a readable format; success message; screenshot-friendly (no auth wall); email sent within 2 min (F2, F9, F17) |

#### Key Moments

- **Decision Point:** Discover stage — if the form is visibly broken or unresponsive on her phone within the first 3 seconds, Priya will close the tab immediately. The first impression is load speed and layout correctness.
- **Decision Point:** Location stage — the map is the pivotal moment for Priya. Dropping a pin removes the single largest barrier (not knowing the exact address). If the map fails to load or is unresponsive, she will type a wrong address or give up.
- **Risk of Abandonment:** Description & Photos stage — if photo upload is broken on mobile, Priya may complete the form without a photo and feel her report is less compelling, or she may abandon and call 311 instead.
- **Delight Opportunity:** Review & Submit stage — seeing a unique case ID on the confirmation screen is the moment Priya knows her report "worked". An email confirmation arriving minutes later reinforces trust in the city's responsiveness.

#### Success Outcome

Priya completes a full anonymous service request submission on a 375 px mobile viewport in under 5 minutes, receives a confirmation screen with a unique case ID within 3 seconds, and receives an email acknowledgment within 2 minutes (JTBD-04.1, JTBD-04.2, JTBD-04.3 success measures).

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Discover | F2 (Public Submission Form), F19 (Responsive Design) |
| Contact | F2 (Public Submission Form — anonymous flow) |
| Category | F2 (Public Submission Form), F8 (Category Taxonomy) |
| Location | F2 (Public Submission Form), F16 (Map / Geo), F19 |
| Description & Photos | F2 (Public Submission Form), F10 (Media Upload) |
| Review & Submit | F2 (Public Submission Form), F9 (Email Notification), F17 (Design System) |

---

## Cross-Journey Patterns

### CP-01: Full-Page Reload as Universal Pain Point

**Journeys affected:** JRN-01.1, JRN-01.2, JRN-01.3, JRN-02.1, JRN-02.2

The single most common pain point across all staff journeys is the legacy system's full-page reload on every save or filter action. This disrupts call flow for Marcus, prevents mobile use for Diane, and forces repetitive re-navigation. The React SPA architecture (F17, F1, F3) eliminates this in all five journeys simultaneously through client-side routing and API-driven state updates.

**Design Implication:** Every form submit, filter change, and status transition in the new system must complete without a full-page reload. Success is confirmed via toast notification; the user's position in the UI is preserved.

---

### CP-02: Mobile Unusability as a Field Workflow Blocker

**Journeys affected:** JRN-02.2, JRN-04.1

Both Diane (closing cases in the field) and Priya (submitting reports from the street) are completely blocked by the legacy system's non-responsive layout. These are different personas but they share the exact same root cause: no responsive CSS and no mobile-optimized touch targets.

**Design Implication:** Responsive design (F19) is a prerequisite feature that unlocks two distinct user workflows. Priority should be given to the case detail + action log form (for Diane) and the public submission wizard (for Priya) at the 375 px breakpoint.

---

### CP-03: Overdue Visibility as a Decision-Making Dependency

**Journeys affected:** JRN-02.1, JRN-02.3

In both Diane's morning triage and her mid-week escalation review, the absence of an overdue visual indicator forces manual date math that consumes time she does not have. This is a shared opportunity: a configurable overdue threshold (F5, F3) with a visual badge in the case list solves both journeys with a single implementation.

**Design Implication:** The overdue badge in the case list row and the overdue stat card on the dashboard should be implemented together. Clicking either surface should land the user on a pre-filtered list of overdue cases for their department.

---

### CP-04: Confirmation Dialogs as Trust Infrastructure

**Journeys affected:** JRN-01.3 (bulk close), JRN-03.1 (category delete), JRN-03.2 (API key one-time display)

Both Marcus and Jordan need explicit confirmation before irreversible actions. Marcus needs a count-confirmation before bulk-closing cases; Jordan needs a confirmation before deleting admin records; and both need visible success states after committing. These are not three separate design decisions — they reflect a single system-wide pattern.

**Design Implication:** A unified confirmation dialog pattern (shadcn/ui Dialog, F17) should be applied consistently across: bulk operations, admin record deletion, and any action that cannot be easily reversed. The dialog must always show what will be affected before asking for confirmation.

---

### CP-05: Pre-Filtered Views as Onboarding Shortcuts

**Journeys affected:** JRN-02.1, JRN-02.3, JRN-03.1, JRN-03.2

Diane benefits from a "My Department" pre-filtered view; Jordan benefits from sidebar navigation landing him directly in the right admin panel without relearning the menu. Both represent the same design principle: the system should infer context from the logged-in user's role and department and reduce the number of clicks required to reach the relevant data.

**Design Implication:** Role-based default views should be configured: staff see their assigned cases first; supervisors see their department's cases first; admins see the admin panel they last visited. These preferences should persist across sessions (localStorage or user profile).

---

## Journey-to-JTBD Traceability

| JRN-ID | Stage | JTBD-ID | Expected Outcome |
|---|---|---|---|
| JRN-01.1 | Enter Details | JTBD-01.1 | Case creation form submits without page reload; all required fields reachable on one screen |
| JRN-01.1 | Submit | JTBD-01.1 | Success toast appears within 2 s of submit; newly created case accessible without menu re-navigation |
| JRN-01.1 | Confirm | JTBD-01.1 | Marcus creates complete new case in ≤90 s from first keystroke to case ID confirmation |
| JRN-01.2 | Search | JTBD-01.2 | Live search returns results with ≤300 ms debounce after 3 characters typed |
| JRN-01.2 | Refine | JTBD-01.2 | Filter chips combinable with live search without triggering a new page load |
| JRN-01.2 | Respond | JTBD-01.2 | Marcus locates any specific case within 30 s including at least one filter applied |
| JRN-01.3 | Select Batch | JTBD-01.3 | Checkbox per row + Select All; selected count visible in bulk action toolbar |
| JRN-01.3 | Choose Action | JTBD-01.3 | Bulk action toolbar appears on ≥2 selections with Close (with substatus), Reassign, Change Status options |
| JRN-01.3 | Confirm | JTBD-01.3 | Confirmation dialog shows exact count of affected records before committing |
| JRN-01.3 | Verify | JTBD-01.3 | 10+ cases bulk-closed in single confirmation click in ≤60 s total |
| JRN-02.1 | Login | JTBD-02.1 | Session persists department filter preference; Diane lands on My Department view after login |
| JRN-02.1 | View Cases | JTBD-02.1 | My Department pre-filtered case list reachable within 2 clicks of login in ≤30 s |
| JRN-02.1 | Prioritize | JTBD-02.1 | Overdue cases display visual badge; no manual date calculation required |
| JRN-02.2 | Access | JTBD-02.2 | Mobile layout fully usable at 375 px; CAS session persists across field use |
| JRN-02.2 | Attach Photos | JTBD-02.2 | Photo upload accepts files from mobile camera roll; thumbnail preview confirms selection |
| JRN-02.2 | Submit | JTBD-02.2 | Case closed with photo from 375 px mobile browser in ≤3 min; reporter email triggered |
| JRN-02.3 | Check Dashboard | JTBD-02.3 | Overdue stat card scoped to Diane's department; count is a clickable link |
| JRN-02.3 | Surface Overdue | JTBD-02.3 | Overdue case list reachable in 1 click from dashboard stat card; pre-filtered |
| JRN-02.3 | Review Overdue List | JTBD-02.3 | All overdue department cases identified within 60 s of opening dashboard; no export needed |
| JRN-03.1 | Configure Category | JTBD-03.1 | Inline validation confirms required fields; save blocked if dept not found |
| JRN-03.1 | Verify | JTBD-03.1 | New category appears in public form and case creation dropdowns immediately after save |
| JRN-03.1 | Confirm Security | JTBD-03.1 | Confirmation dialog required before all destructive admin operations |
| JRN-03.1 | (all stages) | JTBD-03.1 | New category fully configured in ≤10 min via admin UI; zero SQL access required |
| JRN-03.2 | Create Client | JTBD-03.2 | New client form captures name, contact, email; API key auto-generated on save |
| JRN-03.2 | Save and Retrieve Key | JTBD-03.2 | Generated UUID API key displayed once in copyable field on confirmation screen |
| JRN-03.2 | Verify Activation | JTBD-03.2 | API key immediately active for POST /requests; no service restart required |
| JRN-03.2 | (all stages) | JTBD-03.2 | Open311 client registered and API key delivered in ≤5 min via admin UI |
| JRN-04.1 | Discover | JTBD-04.1 | Mobile form loads without horizontal scroll at 375 px; progress indicator visible |
| JRN-04.1 | Contact | JTBD-04.1 | Anonymous submission accepted; email is optional; no account creation gate |
| JRN-04.1 | Location | JTBD-04.2 | Map pin placed; reverse-geocoding auto-fills address field within 1 s; no typing required |
| JRN-04.1 | Location | JTBD-04.2 | Map renders and is interactive on mobile within 3 s on mobile connection |
| JRN-04.1 | Description & Photos | JTBD-04.1 | Native file picker opens camera roll on mobile; photo upload functional at 375 px |
| JRN-04.1 | Review & Submit | JTBD-04.3 | Confirmation screen with unique case ID appears within 3 s of successful submission |
| JRN-04.1 | Review & Submit | JTBD-04.3 | Acknowledgment email sent within 2 min when email address was provided |
| JRN-04.1 | (full journey) | JTBD-04.1 | Anonymous submission completed on 375 px viewport in ≤5 min without errors |

---

*JOURNEYS-UReport.md — uReport CRM Modernization v1.0 — 2026-07-06*
