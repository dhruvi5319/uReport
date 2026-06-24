# User Journey Maps: uReport Modernization

| Field | Value |
|---|---|
| **Product Name** | uReport — Municipal Constituent Issue Tracking System |
| **Version** | 1.0 |
| **Date** | 2026-06-24 |
| **Related Personas** | `project_specs/PERSONAS-uReport.md` |
| **Related JTBD** | `project_specs/JTBD-uReport.md` |
| **Related PRD** | `project_specs/PRD-uReport.md` |
| **Project** | `.planning/PROJECT.md` |

---

## Journey Index

| JRN-ID | Persona | Scenario | Key JTBD(s) | Stages |
|--------|---------|----------|-------------|--------|
| JRN-01.1 | PER-01 Marcus (Case Worker) | Morning queue triage — identifying priority cases at day start | JTBD-01.1 | 5 |
| JRN-01.2 | PER-01 Marcus (Case Worker) | Full ticket update — comment, status change, and photo attach in one view | JTBD-01.2 | 5 |
| JRN-01.3 | PER-01 Marcus (Case Worker) | Saving and reusing a recurring daily search filter | JTBD-01.3 | 4 |
| JRN-02.1 | PER-02 Diana (Dept Admin) | Configuring a new service category with SLA, custom fields, and default assignee | JTBD-02.1 | 6 |
| JRN-02.2 | PER-02 Diana (Dept Admin) | Month-end SLA compliance review across all department categories | JTBD-02.2 | 5 |
| JRN-02.3 | PER-02 Diana (Dept Admin) | Onboarding a new case worker and assigning them to categories | JTBD-02.3 | 5 |
| JRN-03.1 | PER-03 Jordan (Sys Admin) | Post-migration user account validation and JWT health check | JTBD-03.1 | 5 |
| JRN-03.2 | PER-03 Jordan (Sys Admin) | Registering a new external API client and rotating an existing key | JTBD-03.2 | 5 |
| JRN-03.3 | PER-03 Jordan (Sys Admin) | Post-deployment health verification — scheduler jobs and Open311 shape tests | JTBD-03.3 | 5 |
| JRN-04.1 | PER-04 Integra (API Client) | Submitting a new service request after uReport migration cutover | JTBD-04.1, JTBD-04.3 | 5 |
| JRN-04.2 | PER-04 Integra (API Client) | Polling for request status updates — parsing GET /open311/requests/{id} | JTBD-04.2 | 4 |

---

## PER-01: Marcus Webb — City Case Worker

---

### JRN-01.1: Morning Queue Triage

**Persona:** PER-01 (Marcus Webb)

**Scenario:** Marcus arrives at his desk, opens uReport, and needs to identify which of his 30–60 assigned tickets require immediate action before any SLAs breach. The legacy system forced him to rebuild filter combinations every morning and navigate multiple tabs to cross-reference overdue items. The new system must surface priority tickets within 60 seconds of login.

**Related Jobs:** JTBD-01.1

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| **1. Arrive & Login** | Opens browser, navigates to uReport, enters credentials | Login page (F4 JWT) | "Let me get in quickly and see what's waiting" | Neutral, slight anticipation | Legacy: slow page reload on login; sessions occasionally dropped mid-morning | Fast JWT login with remembered session; sub-second redirect to dashboard after auth |
| **2. Land on Dashboard** | Scans the ticket overview panel showing assigned queue counts | Dashboard / Ticket List (F0, F11) | "What changed since yesterday? Anything new or overdue?" | Focused, mildly anxious | Legacy: no live indicators — everything looks the same regardless of urgency | Highlight delta since last session (new tickets, newly overdue) with visual badges |
| **3. Apply Priority Filter** | Clicks "My Open Tickets" saved filter or sorts by SLA due date | Ticket List (F0, F8, F11, F12) | "Which ones are overdue or due today? I need those first" | Anxious, scanning fast | Legacy: must manually re-apply status=open + sorted-by-due-date every single morning | Auto-apply last filter on return; saved bookmark loads in < 2 seconds (F12) |
| **4. Identify Overdue Items** | Scans the filtered list; visually spots highlighted overdue rows | Ticket List with SLA indicators (F0, F8) | "Three overdue — I need to address these immediately before anything else" | Stressed but focused | Legacy: no visual differentiation — overdue tickets look identical to on-track tickets | Color-coded SLA status (overdue = red, due today = amber) baked into list rows |
| **5. Open First Priority** | Clicks the first overdue ticket to begin work | Ticket Detail (F0, F1) | "Okay — let me see what this needs and what's already been done" | Determined | Legacy: opening detail reloads the full page; back button loses filter position | Retain filter context; breadcrumb back to queue resumes exact position |

#### Key Moments

- **Decision Point — Stage 3:** If filter state is not preserved or reapplied quickly, Marcus falls back to rebuilding manually — adding 3–5 minutes of dead setup time each morning.
- **Risk of Abandonment — Stage 2:** If the dashboard is information-dense with no urgency signals, Marcus may bypass it entirely and go straight to email for escalation cues.
- **Delight Opportunity — Stage 4:** A clearly differentiated visual hierarchy (red/amber/normal rows) that instantly communicates priority without interaction creates a "I see it in one glance" moment of confidence.

#### Success Outcome

Marcus identifies his top 3 overdue or near-deadline tickets within 60 seconds of logging in, with SLA status visible without any manual filter step. (JTBD-01.1 success measure)

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Arrive & Login | F4 (JWT Auth) |
| Land on Dashboard | F0 (Ticket Lifecycle), F11 (FTS) |
| Apply Priority Filter | F0, F8 (Substatus), F11, F12 (Bookmarks) |
| Identify Overdue Items | F0, F8 |
| Open First Priority | F0, F1 (History Log) |

---

### JRN-01.2: Full Ticket Update Without Context-Switching

**Persona:** PER-01 (Marcus Webb)

**Scenario:** Marcus has identified a priority ticket — a pothole complaint that now has a repair scheduled. He needs to record a constituent response note, change the substatus to reflect the work order, and attach a photo from the inspector. In the legacy system, each of these was a separate page navigation. The new system must allow all three actions from a single ticket detail view.

**Related Jobs:** JTBD-01.2

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| **1. Open Ticket Detail** | Clicks ticket from queue; detail view loads with history, status, and action area visible | Ticket Detail (F0, F1) | "I need to record the work order response and update the status" | Purposeful | Legacy: detail loads via full PHP page reload; history is buried below the fold | Ticket header (status, category, SLA) pinned; action area immediately visible without scrolling |
| **2. Select Response Template** | Clicks "Add Response" and selects "Work Order Scheduled" template from dropdown | Action area / Response Templates (F9, F20) | "I don't need to type this from scratch — there's a template for work orders" | Efficient, relieved | Legacy: copy-pastes boilerplate from a shared Google Doc; template system is not surfaced prominently | Template picker inline in the action area; selected template pre-fills note text, leaving field editable |
| **3. Edit and Submit Note** | Edits the pre-filled text to add the specific work order number; submits | Ticket Detail action area (F0, F1) | "Done — now let me change the status to show it's in progress" | Focused | Legacy: submitting a comment triggers a page reload, losing scroll position | Optimistic UI append — note appears in history immediately without reload |
| **4. Change Substatus** | Selects new substatus from dropdown in the same view; saves | Substatus selector (F8) | "I want to mark it 'In Progress — Scheduled' so Diana's team can see the SLA clock is paused" | Confident | Legacy: substatus change requires a separate form submission and page reload | Inline substatus update commits without navigation; history entry created automatically |
| **5. Attach Photo** | Clicks upload area; selects inspection photo from file picker; confirms | Media upload (F10) | "Last step — attach the photo so there's a record of the site condition" | Almost done, minor friction | Legacy: media upload is a separate page with no progress indication | Drag-and-drop or click-to-upload inline on ticket detail; thumbnail preview confirms upload success |

#### Key Moments

- **Decision Point — Stage 2:** If response templates are not immediately discoverable, Marcus will bypass them and type freehand — introducing inconsistency in constituent communications.
- **Risk of Abandonment — Stage 4:** If each action triggers a full reload, Marcus may decide to defer the substatus or photo until later — leaving the ticket in an ambiguous state.
- **Delight Opportunity — Stage 3:** Seeing the note appear instantly in the history log (without a reload) confirms the action worked — a small but powerful confidence signal.

#### Success Outcome

Marcus completes a full ticket update (response note + substatus change + photo attachment) in under 3 minutes from a single view, with all three actions recorded in the immutable history log. (JTBD-01.2 success measure)

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Open Ticket Detail | F0 (Lifecycle), F1 (History Log) |
| Select Response Template | F9 (Action Types), F20 (Response Templates) |
| Edit and Submit Note | F0, F1 |
| Change Substatus | F8 (Substatus System) |
| Attach Photo | F10 (Media Upload) |

---

### JRN-01.3: Saving and Reusing a Recurring Filter

**Persona:** PER-01 (Marcus Webb)

**Scenario:** After his first week on the new system, Marcus has identified his daily filter combination: Department=Streets, Status=Open, sorted by SLA due date ascending. He wants to save this as a named bookmark so that each morning he can click once and land directly on his work view — eliminating the 3–5 minute setup ritual from the legacy system.

**Related Jobs:** JTBD-01.3

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| **1. Build the Filter** | Applies Department, Status, and Sort filters on the ticket list | Ticket List / Filter panel (F0, F11) | "This is the view I use every day — I should save it" | Productive, slightly frustrated by repetition | Legacy: no save mechanism exists — these filters are rebuilt from scratch every session | Filter state is URL-serialized; save button appears once filters are applied |
| **2. Save as Bookmark** | Clicks "Save Search" button; types name "My Daily Streets Queue" and confirms | Bookmark save dialog (F12) | "Will this remember everything, including the sort order?" | Hopeful, slightly skeptical | Legacy: browser bookmarks break when session tokens expire or URL structure changes | Bookmark stores full request URI; confirmation message reassures the filter is fully saved |
| **3. Verify Bookmark Appears** | Checks sidebar or navigation area for the newly created bookmark | Bookmarks panel (F12) | "Good — it's there. Let me test it to make sure it works" | Curious, testing trust | None (new feature) | Bookmark appears immediately in sidebar with an edit/delete option; visual feedback on creation |
| **4. Return to Bookmark Next Day** | Logs in next morning; clicks saved bookmark from sidebar | Bookmarks panel → Ticket List (F12, F11) | "Click — and there's my queue. That's it." | Satisfied, confident, time saved | None if feature works correctly; frustration if saved sort order is not restored | Bookmark loads in < 2 seconds with all filter parameters and sort order intact |

#### Key Moments

- **Decision Point — Stage 2:** Marcus will only trust the bookmark system if the saved state is fully complete (including sort order, not just filters). Any partial save erodes trust permanently.
- **Delight Opportunity — Stage 4:** The first morning the bookmark works perfectly is a "this system respects my time" moment — a strong retention signal.

#### Success Outcome

Marcus returns to his primary work view in under 5 seconds after login by clicking a saved bookmark, with zero filter parameter re-entry. (JTBD-01.3 success measure)

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Build the Filter | F0 (Lifecycle), F11 (FTS Search) |
| Save as Bookmark | F12 (Bookmarks) |
| Verify Bookmark Appears | F12 |
| Return to Bookmark Next Day | F12, F11 |

---

## PER-02: Diana Reyes — Department Administrator

---

### JRN-02.1: Configuring a New Service Category

**Persona:** PER-02 (Diana Reyes)

**Scenario:** The Streets & Sanitation department is adding a new service type: "Illegal Dumping — Large Item." Diana needs to create the category, set it to staff-only posting permission, configure a 10-day SLA, assign a default case worker, define two custom fields (location type and estimated volume), and link it to her department. In the legacy system, custom field configuration required hand-editing raw JSON with no validation feedback.

**Related Jobs:** JTBD-02.1

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| **1. Navigate to Category Admin** | Logs in, navigates to Administration → Categories | Admin nav / Category List (F7) | "I need to add the new dumping category before Monday's staff meeting" | Purposeful | Legacy: category admin is buried under multiple navigation levels | Direct navigation link in admin sidebar with category count badge |
| **2. Create New Category** | Clicks "New Category"; fills in name, group, department, active/featured flags | Category form (F7, F6) | "Group it under 'Sanitation' and make sure it's active" | Methodical | Legacy: each save triggers a full page reload — multi-step configuration requires 4–5 reloads | Single-page form with all configuration fields; autosave or multi-step wizard with inline state |
| **3. Configure SLA and Permissions** | Sets slaDays=10, displayPermissionLevel=staff, postingPermissionLevel=staff | Category form — SLA / Permissions section (F7, F3) | "Ten days for large items. Staff-only posting — public shouldn't self-file this" | Confident in the rules | Legacy: permission levels and SLA are on separate pages or sections requiring sequential saves | All configuration on a single scroll-able form; section headings make it scannable |
| **4. Define Custom Fields** | Opens custom field schema builder; adds "Location Type" (dropdown: Alley/Street/Vacant Lot) and "Estimated Volume" (select: Small/Large/Bulk) | Custom field schema editor (F7) | "This is where it used to break — I hope I don't need to write JSON" | Apprehensive, tense | Legacy: hand-editing raw JSON in a text field with no validation — errors appear only after a ticket is submitted | Visual form-based field builder: choose field type, name, options — no raw JSON required; inline validation |
| **5. Assign Default Case Worker** | Selects "Tomas V." as default assignee from staff picker | Assignee picker (F6, F5) | "Tomas handles dumping complaints — routing to him by default saves reassignments" | Efficient | Legacy: default assignee selection is a plain text ID field — easy to enter wrong value | Searchable staff picker scoped to department; shows current assignment load |
| **6. Save and Verify** | Saves category; verifies it appears in the category list and that a test ticket submission collects the custom fields | Category list + test ticket form (F7, F2) | "Is it live? Do the custom fields show up on the next submission?" | Anxious until confirmed | Legacy: no confirmation that custom fields are active — Diana would call Jordan to verify | Success toast with "Custom fields active on next submission"; validation immediately visible on test |

#### Key Moments

- **Decision Point — Stage 4:** If the custom field builder requires any JSON knowledge, Diana will either create a simplified/incomplete schema or call Jordan for help — both outcomes are workflow failures.
- **Risk of Abandonment — Stage 2:** If the form requires multiple separate saves (triggering page reloads) to configure all fields, Diana may save partial configurations and leave others unconfigured.
- **Delight Opportunity — Stage 6:** Seeing the custom fields appear immediately in a test submission (without a deployment) closes the confidence loop — Diana can trust the system reflects her changes.

#### Success Outcome

Diana creates and fully configures the new category (name, SLA, permissions, custom fields, default assignee) in under 10 minutes, and the custom fields are live on the very next ticket submission. (JTBD-02.1 success measure)

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Navigate to Category Admin | F7 (Category Management) |
| Create New Category | F7, F6 (Department Admin) |
| Configure SLA and Permissions | F7, F3 (RBAC) |
| Define Custom Fields | F7 |
| Assign Default Case Worker | F6, F5 (People Management) |
| Save and Verify | F7, F2 (Open311 API) |

---

### JRN-02.2: Month-End SLA Compliance Review

**Persona:** PER-02 (Diana Reyes)

**Scenario:** It's the last week of the month. Diana needs to review on-time closure percentages for each of her department's categories over the past 30 days. She's particularly concerned about the Pothole Repair and Illegal Dumping categories, which have seen increased volume. In the legacy system, she had to run 3–4 separate reports and mentally stitch the picture together from CSVs.

**Related Jobs:** JTBD-02.2

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| **1. Navigate to Metrics Dashboard** | Logs in, clicks Metrics/Reports in the admin navigation | Metrics Dashboard (F17) | "I need the 30-day SLA view for all my categories" | Purposeful | Legacy: no departmental dashboard exists — must navigate to a separate reports screen | Metrics dashboard as a first-class nav item with department scope pre-applied on load |
| **2. Select Department and Time Window** | Confirms department is scoped to Streets & Sanitation; sets date window to 30 days | Dashboard filter controls (F17) | "Good — it already knows I'm in Streets. Let me confirm the 30-day window" | Mildly uncertain | Legacy: manually reassembles 3–4 filter combinations each time; no persistent scope | Department pre-scoped to logged-in user's department; 30-day default window saves setup |
| **3. Scan On-Time Percentages** | Reviews on-time closure % per category in a table or bar chart | SLA metrics by category (F7, F17) | "Pothole is at 72% — that's below our 85% target. Illegal Dumping is at 91%. Good" | Analytical, concerned about Pothole | Legacy: must export raw CSV and calculate percentages manually in a spreadsheet | On-time % displayed per category alongside target; below-target categories highlighted in amber/red |
| **4. Drill Into Problem Category** | Clicks Pothole Repair row to see volume trend and overdue ticket list | Category detail / Volume trend (F17) | "Why is Pothole down? Is it volume, or are tickets sitting unassigned?" | Investigating, focused | Legacy: drill-down requires running a separate filter-heavy report; mental pivot is jarring | One-click drill-down to category detail showing volume trend, average close days, and open ticket count |
| **5. Export Summary for Supervisor** | Clicks "Export PDF/CSV" to generate a summary for the monthly operations meeting | Export (F17, F18) | "I need something I can drop into the meeting deck without reformatting" | Pragmatic | Legacy: CSV export requires separate screen navigation; formatting is raw and unreadable | Pre-formatted PDF summary table export scoped to the current dashboard view |

#### Key Moments

- **Decision Point — Stage 3:** If on-time percentages are not pre-calculated and require manual math, Diana defaults to the spreadsheet — the dashboard is abandoned.
- **Risk of Abandonment — Stage 1:** If dashboard load time exceeds 5 seconds, Diana loses confidence and reverts to ad-hoc report runs.
- **Delight Opportunity — Stage 4:** One-click drill-down from SLA summary to the actual overdue ticket list closes the gap between "I see a problem" and "I can act on it" in a single session.

#### Success Outcome

Diana views her department's 30-day SLA compliance summary across all categories in under 5 seconds, without running multiple separate reports, and can identify which categories are below target at a glance. (JTBD-02.2 success measure)

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Navigate to Metrics Dashboard | F17 (Metrics Dashboard) |
| Select Department and Time Window | F17, F7 |
| Scan On-Time Percentages | F17, F7 |
| Drill Into Problem Category | F17 |
| Export Summary for Supervisor | F17, F18 (Multi-Format Output) |

---

### JRN-02.3: Onboarding a New Case Worker

**Persona:** PER-02 (Diana Reyes)

**Scenario:** A new case worker, Priya, joins the Streets & Sanitation department. Diana needs to create Priya's account, assign her the "staff" role, and add her to three categories (Pothole Repair, Street Cleaning, Illegal Dumping) so she can begin receiving tickets immediately. In the legacy system, Diana had to submit a request to Jordan and wait 1–2 days.

**Related Jobs:** JTBD-02.3

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| **1. Navigate to People Admin** | Goes to Administration → People; clicks "New Person" | People admin (F5) | "I need to set Priya up before her first shift tomorrow" | Motivated, slightly uncertain about scope of permissions | Legacy: department admins do not have people create access — must go through Jordan | Department admin role scoped to create staff accounts within own department |
| **2. Create Person Record** | Fills in name, email, username, password; assigns role=staff and department=Streets & Sanitation | Person create form (F5, F4) | "Username and role — that's the minimum for her to log in" | Methodical | Legacy: role assignment and department association are separate steps via separate admin screens | Single form combining person details, role, and department assignment; validation inline |
| **3. Assign to Categories** | Navigates to each category's default assignee or opens department category staff view; adds Priya | Category staff assignment (F6, F7) | "She needs to be in Pothole, Street Cleaning, and Dumping. Three clicks?" | Hopeful this is quick | Legacy: no bulk assignment — each category requires a separate navigation and save | "Assign to categories" multi-select from the person profile page; scoped to Diana's department categories |
| **4. Verify Assignment Visibility** | Returns to category views to confirm Priya appears in the assignee lists for all three | Category detail / Assignee list (F6, F7) | "Is she showing up correctly? I don't want to find out she's missing after tickets start rolling in" | Cautious, verifying | Legacy: no unified view of "which categories is this person in" — Diana must check each category individually | Person profile shows a "Assigned Categories" panel listing all category assignments at a glance |
| **5. Confirm Login Works** | Asks Priya to log in; Priya accesses her queue | Login (F4 JWT) | "She's in and can see her tickets. We're good." | Relieved, confident | Legacy: JWT migration could introduce auth issues for newly created accounts | New account receives JWT on first login with no extra steps; queue pre-filtered to her assignments |

#### Key Moments

- **Decision Point — Stage 1:** If Diana's role does not have create-person permission scoped to her department, the entire scenario fails and Jordan is back in the loop.
- **Risk of Abandonment — Stage 3:** If assigning a person to multiple categories requires navigating to each category separately, Diana may assign to only one and rely on Marcus to manually reassign tickets — creating routing errors.
- **Delight Opportunity — Stage 5:** Priya logging in and immediately seeing an empty-but-correctly-filtered queue (ready for first ticket) is proof that the onboarding workflow completed cleanly.

#### Success Outcome

Diana adds Priya as a staff member and assigns her to 3 categories in under 5 minutes, without involving the system administrator, and Priya can authenticate via JWT and access her queue immediately. (JTBD-02.3 success measure)

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Navigate to People Admin | F5 (People Management) |
| Create Person Record | F5, F4 (JWT Auth) |
| Assign to Categories | F6 (Dept Admin), F7 (Category Management) |
| Verify Assignment Visibility | F6, F7 |
| Confirm Login Works | F4 |

---

## PER-03: Jordan Kim — System Administrator

---

### JRN-03.1: Post-Migration JWT Account Validation

**Persona:** PER-03 (Jordan Kim)

**Scenario:** The uReport migration to Spring Boot is complete. Jordan's first priority is confirming that all legacy staff accounts authenticate successfully via JWT without requiring any manual password resets. He also needs to create a new test staff account end-to-end to validate the account creation workflow.

**Related Jobs:** JTBD-03.1

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| **1. Access Admin User List** | Logs in via JWT as system admin; navigates to Users admin panel | Admin UI — User list (F5, F3) | "How many accounts migrated? Are they all present?" | Alert, methodical | Legacy: user list is not easily exported for bulk verification | User list shows all migrated accounts with last login timestamp; sortable by status |
| **2. Verify Migrated Accounts** | Scans user list; checks count against known legacy user count; spot-checks 3–4 specific accounts for correct role and department | User list / Person detail (F5, F3) | "Roles match. Department assignments look correct. Let me test a login manually" | Cautiously optimistic | Legacy: must query the DB directly to verify role assignments | Bulk export of user list with roles and departments for reconciliation against legacy export |
| **3. Test Staff Login** | Opens incognito window; logs in as a migrated staff user; confirms JWT is issued and queue is accessible | Login → Dashboard (F4, F0) | "If this account works, the migration pattern is solid across all staff" | Tense until confirmed | Legacy: no way to simulate another user's auth without touching the database | Admin impersonation view (read-only) to validate a user's effective permissions without sharing credentials |
| **4. Create New Staff Account** | Returns to admin; creates new staff user "test_operator"; assigns role=staff, department=Streets; saves | User create form (F5, F4) | "New account create path should work end-to-end — role, department, ready to log in" | Systematic | Legacy: account creation requires SQL or a brittle admin form that doesn't validate in-context | Form validates username uniqueness and role in real time; confirms account is ready after save |
| **5. Review Auth Event Logs** | Checks application logs via `docker logs ureport-api` for login events from the test session | Docker logs (F4, NFR-10) | "I need to see the auth events with timestamps — success and failure cases" | Investigative | Legacy: Apache/PHP logs have no structured auth event format — hard to parse | Structured log entries: `[AUTH] user=test_operator action=login status=success ts=2026-06-24T08:12:34Z` |

#### Key Moments

- **Decision Point — Stage 2:** If migrated account count doesn't match legacy, Jordan must investigate before declaring the migration healthy — this blocks go-live.
- **Risk of Abandonment — Stage 3:** A failed test staff login (even for one account) triggers a full investigation cycle — Jordan cannot declare the migration stable until all accounts are verified.
- **Delight Opportunity — Stage 5:** Clean, structured auth log output that Jordan can grep in seconds replaces hours of Apache log forensics — a genuine quality-of-life upgrade.

#### Success Outcome

All legacy staff accounts authenticate via JWT after migration with zero manual interventions. Jordan can create a new staff user with role and department assignment in under 3 minutes. (JTBD-03.1 success measure)

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Access Admin User List | F5 (People), F3 (RBAC) |
| Verify Migrated Accounts | F5, F3 |
| Test Staff Login | F4 (JWT Auth), F0 |
| Create New Staff Account | F5, F4 |
| Review Auth Event Logs | F4, NFR-10 (Logging) |

---

### JRN-03.2: API Client Registration and Key Rotation

**Persona:** PER-03 (Jordan Kim)

**Scenario:** Jordan needs to register a new external API client ("CityMobile v2") for a municipal mobile app going live next month, and separately rotate the API key for the existing Integra Transit client whose key was flagged in a security audit. Both operations must complete without a service restart.

**Related Jobs:** JTBD-03.2

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| **1. Navigate to API Client Admin** | Goes to Administration → API Clients | API Client list (F13) | "Let me register CityMobile first, then handle the Integra rotation" | Organized | Legacy: API client registration requires direct DB manipulation — no admin UI exists | Clean API client list with name, linked contact, last-used date, and key masked |
| **2. Register New API Client** | Clicks "New Client"; fills in name, URL, contact person, contact method; system generates hashed API key | Client create form (F13, F4, F5) | "The key should be shown once and then hashed — I'll copy it for the CityMobile team" | Careful, security-conscious | Legacy: keys are stored unhashed in the DB — a security exposure Jordan cannot fix | Key shown once in plaintext at creation (copy-to-clipboard button); stored hashed at rest (NFR-8) |
| **3. Confirm New Client Appears** | Returns to client list; confirms CityMobile appears with masked key and contact info | Client list (F13) | "Good. Now for the Integra rotation" | Efficient | None at this stage if the previous step went cleanly | Client list shows masked key, linked contact person, and creation date |
| **4. Rotate Integra's API Key** | Finds Integra in client list; clicks "Rotate Key"; confirms; new key displayed once | Client detail / Key rotation (F13, F4) | "Will this break Integra's requests immediately? I need to give them the new key right away" | Alert, slightly worried about timing | Legacy: rotation requires a DB update and service restart — a disruptive operation | Key rotation reflected immediately with no service restart (JTBD-03.2); new key shown once with copy action |
| **5. Verify in Logs** | Checks `docker logs ureport-api` for the Integra key rotation event; confirms event is logged with timestamp | Docker logs (F13, NFR-10) | "The log entry confirms the rotation happened at exactly 09:14. I'll send Integra the new key now" | Confident, closure | Legacy: no log entry for key operations — Jordan cannot prove when a rotation occurred | Structured log: `[API_KEY] client=integra action=rotate ts=2026-06-24T09:14:22Z user=jordan` |

#### Key Moments

- **Decision Point — Stage 2:** If the generated key is not shown once in plaintext at creation (before hashing), Jordan cannot give it to the CityMobile team — the client is unusable from day one.
- **Risk of Abandonment — Stage 4:** If key rotation requires a service restart, Jordan will defer rotations — allowing stale or potentially compromised keys to remain active.
- **Delight Opportunity — Stage 5:** A log entry that precisely timestamps the key rotation gives Jordan the audit trail he needs for security compliance — no guesswork about "when did we rotate?"

#### Success Outcome

Jordan registers a new API client with a hashed key in under 3 minutes. Key rotation for Integra takes effect immediately without a service restart, with the event logged with timestamp and outcome. (JTBD-03.2 success measure)

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Navigate to API Client Admin | F13 (API Client Management) |
| Register New API Client | F13, F4 (Auth), F5 (People) |
| Confirm New Client Appears | F13 |
| Rotate Integra's API Key | F13, F4 |
| Verify in Logs | F13, NFR-10 |

---

### JRN-03.3: Post-Deployment Health Verification

**Persona:** PER-03 (Jordan Kim)

**Scenario:** Jordan has just completed a `docker-compose up` deployment of the new Spring Boot uReport stack. He needs to verify that (1) all Spring Scheduler background jobs ran successfully overnight, and (2) the Open311 API response shapes still match legacy PHP fixtures. This is the standard post-deployment verification he runs after every release.

**Related Jobs:** JTBD-03.3

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| **1. Bring Up the Stack** | Runs `docker-compose up -d` from the project root; watches container startup | Terminal / docker-compose (NFR-5) | "I need all services healthy before I start validation. Let me watch the logs during startup" | Focused | Legacy: Ansible + Apache + Solr = three separate systems to monitor during bring-up | Single `docker-compose up` brings all services; `docker-compose ps` shows green health checks in < 10 min |
| **2. Check Scheduler Job Logs** | Runs `docker logs ureport-api | grep '\[SCHEDULER\]'` to find last night's job executions | Docker logs (F16, NFR-10) | "Did digest notifications run? Did auto-close fire? I need to see timestamps and outcomes" | Investigative | Legacy: PHP cron logs are unsearchable mixed-format Apache logs — no structured job outcome | Structured scheduler logs: `[SCHEDULER] job=digestNotifications ts=2026-06-24T02:00:01Z status=SUCCESS tickets_notified=14` |
| **3. Confirm All Jobs Ran** | Verifies digest notification, auto-close, and audit jobs each have a SUCCESS log entry from the last execution window | Docker logs (F16) | "All three jobs have recent SUCCESS entries. No failures." | Relieved | Legacy: job failures are silent — Jordan has no automated alerting for missed cron runs | Log-level alerting hook: if any job logs FAILURE, a warn-level entry triggers configured alert channel |
| **4. Run Open311 Integration Tests** | Executes `mvn test -Dtest=Open311IntegrationTest` or equivalent; watches test output | Test runner / CI terminal (F2, NFR-1, NFR-9) | "If any response shape changed, this test suite will catch it before any integrations break" | Cautiously optimistic | Legacy: manual `curl` spot-checks — not comprehensive, easy to miss edge cases | Automated test suite compares all Open311 endpoint responses against stored legacy PHP fixtures; fail fast |
| **5. Declare Deployment Stable** | Reviews test results (all green); marks deployment as stable in the team's runbook | Test output / internal runbook | "All green. Stack is up, scheduler ran, Open311 shapes are clean. Good to go." | Confident, satisfied | Legacy: no systematic go/no-go checklist — Jordan uses institutional memory | Deployment health checklist (automated or manual) with checkbox items: containers healthy, jobs ran, API tests passed |

#### Key Moments

- **Decision Point — Stage 3:** A single FAILURE entry from any scheduler job blocks the "stable" declaration — Jordan must investigate before the deployment is considered healthy.
- **Risk of Abandonment — Stage 4:** If integration tests are slow (> 5 minutes) or require complex setup, Jordan will skip them on routine deployments — introducing regression risk.
- **Delight Opportunity — Stage 2:** Being able to grep structured scheduler logs in under 10 seconds (vs. scanning raw Apache logs) is the clearest proof that the modernization improved Jordan's day-to-day.

#### Success Outcome

Jordan confirms all background jobs ran and Open311 response shapes match legacy fixtures within 15 minutes of a deployment, using only `docker logs` and the automated test suite. (JTBD-03.3 success measure)

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Bring Up the Stack | NFR-5 (Deployment) |
| Check Scheduler Job Logs | F16 (Digest Notifications), NFR-10 |
| Confirm All Jobs Ran | F16 |
| Run Open311 Integration Tests | F2 (Open311 API), NFR-1, NFR-9 |
| Declare Deployment Stable | F2, NFR-1 |

---

## PER-04: Integra Transit App — External API Client

---

### JRN-04.1: Service Request Submission After Migration Cutover

**Persona:** PER-04 (Integra Transit App)

**Scenario:** The uReport migration cutover has completed. The next time a transit rider submits a service issue through the Integra portal, Integra's backend automatically fires its existing POST /open311/requests call against the new Spring Boot endpoint. Integra's developers have made zero code changes. The integration must continue to work identically.

**Related Jobs:** JTBD-04.1, JTBD-04.3

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking (System State / Intent) | Feeling (System Risk Level) | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| **1. Rider Submits Issue** | Transit rider taps "Report Issue" in the Integra mobile app; fills in issue type, location, description | Integra mobile app UI (external) | System: "Rider action queued — preparing POST payload with api_key, service_code, lat/long, description" | Nominal — no risk yet | None at this stage (rider-facing) | N/A — outside uReport scope |
| **2. POST /open311/requests Fires** | Integra backend sends POST with existing api_key in query param, service_code, lat, long, description, and custom attributes | Open311 API endpoint (F2, F4, F13) | System: "api_key from the `clients` table — this key has been in use for 3 years. Will it validate against Spring Boot?" | High risk — API key validation is the critical moment | Legacy key format or hashing mismatch could silently reject the request with HTTP 403 | Key migration preserves existing keys; Spring Boot validates using same query param `api_key` (JTBD-04.3) |
| **3. Spring Boot Validates and Processes** | Spring Boot validates api_key, checks service_code posting permission, creates ticket, and returns response | Spring Boot REST controller (F2, F3, F0) | System: "Key validated. Category=Pothole, postingPermissionLevel=anonymous. Ticket created. service_request_id=58432" | Nominal if migration was correct | Any field validation difference from legacy would reject requests that used to succeed | Identical HTTP 200 response with `service_request_id` in same JSON/XML field position as legacy (JTBD-04.1) |
| **4. Integra Parses Response** | Integra's parser reads `service_request_id` from JSON or XML response body; stores it for future polling | Integra backend parser (external) | System: "service_request_id field found at expected path. Stored. Rider will receive confirmation." | High risk — any field name or structure change here = silent parse failure | XML CDATA wrapping change, null-field omission, or field reordering breaks the parser without error | Byte-level response compatibility with legacy PHP output (NFR-1); fixture tests run pre-cutover |
| **5. Rider Receives Confirmation** | Integra displays "Your report has been submitted — tracking ID: 58432" to the rider | Integra UI (external) | System: "Submission confirmed. Integration cycle complete." | Nominal — success | None if the full chain worked | N/A — outside uReport scope; success is seamless end-to-end with zero code changes on Integra's side |

#### Key Moments

- **Decision Point — Stage 2:** API key validation is the hard go/no-go for the entire integration. A failure here produces silent data loss on the rider's side with no immediate alert to Integra's operators.
- **Risk of Abandonment — Stage 4:** Integra's parser failing silently (returning "confirmed" to the rider but discarding the service_request_id) is the worst-case failure mode — tickets are lost without anyone knowing.
- **Delight Opportunity — Stage 3:** The entire journey working with zero code changes on Integra's side is the definition of success — transparent migration.

#### Success Outcome

Zero changes required to Integra's integration code after uReport migration. POST /open311/requests returns a byte-compatible response; existing API key authenticates successfully against Spring Boot. (JTBD-04.1, JTBD-04.3 success measures)

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Rider Submits Issue | External (out of scope) |
| POST /open311/requests Fires | F2 (Open311 API), F4 (Auth), F13 (API Client) |
| Spring Boot Validates and Processes | F2, F3 (RBAC), F0 (Lifecycle) |
| Integra Parses Response | F2, F18 (Multi-Format Output), NFR-1 |
| Rider Receives Confirmation | External (out of scope) |

---

### JRN-04.2: Status Polling — GET /open311/requests/{id}

**Persona:** PER-04 (Integra Transit App)

**Scenario:** After submitting a service request, Integra's frontend polls for status updates on behalf of the rider. Each time the rider checks "What happened to my report?", Integra fires GET /open311/requests/{id}. The response shape — field names, types, null handling, and XML structure — must be indistinguishable from the legacy PHP system or the parser silently fails.

**Related Jobs:** JTBD-04.2

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking (System State / Intent) | Feeling (System Risk Level) | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| **1. Rider Checks Status** | Rider opens Integra app, navigates to "My Reports"; app triggers status poll | Integra frontend (external) | System: "Preparing GET /open311/requests/58432 — same request shape as always" | Nominal | None (rider-facing) | N/A |
| **2. GET /open311/requests/{id} Fires** | Integra backend sends GET with service_request_id; accepts JSON or XML per stored preference | Open311 GET endpoint (F2, F18) | System: "Will `status`, `status_notes`, `agency_responsible`, `updated_datetime` all be present and in the same format?" | High risk — field presence and format are critical | Any field renamed (e.g., `updated_datetime` → `updatedAt`), null returned as empty string vs. omitted, or CDATA wrapping added breaks the parser | Response field names, types, and null handling byte-compatible with legacy (JTBD-04.2, NFR-1) |
| **3. Spring Boot Returns Response** | Spring Boot serializes ticket to Open311 response shape; returns JSON or XML | Spring Boot REST (F2, F11, F18) | System: "Ticket 58432 found. Status=open. Serializing to legacy-compatible shape." | High risk — serialization is where regressions occur | Java default JSON serializers (Jackson) use camelCase; Open311 spec uses snake_case — must be explicitly configured | Explicit field mapping layer ensures snake_case field names and XML structure identical to PHP output |
| **4. Integra Parses and Displays** | Integra parses status field; displays "Under Review" to rider | Integra frontend (external) | System: "Status field found. `status=open` maps to 'Under Review' in our UI. Rider notified." | Nominal if response parsed cleanly | Silent failure if status field was missing or differently named — rider sees stale data | N/A — success = byte-level response compatibility; fixture tests provide automated regression guard |

#### Key Moments

- **Decision Point — Stage 3:** The serialization layer (Java → Open311 JSON/XML) is the single highest-risk technical point. Any Jackson default behavior drift must be explicitly overridden.
- **Risk of Abandonment — Stage 4:** Integra's parser failing silently means the rider sees no status update — eroding trust in the civic reporting tool.
- **Delight Opportunity:** There is no UX delight in this journey for Integra (it's a machine). Success is simply "nothing breaks." The delight is Jordan and Diana's — the migration is truly invisible.

#### Success Outcome

All Open311 GET response payloads pass byte-level comparison against legacy PHP fixtures with zero field name, type, or structural deviations. (JTBD-04.2 success measure)

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Rider Checks Status | External (out of scope) |
| GET /open311/requests/{id} Fires | F2 (Open311 API), F18 (Multi-Format Output) |
| Spring Boot Returns Response | F2, F11 (FTS), F18 |
| Integra Parses and Displays | External — success defined by NFR-1 |

---

## Cross-Journey Patterns

### Pain Points Appearing in Multiple Journeys

| Pattern | Affected Journeys | Common Root Cause | Shared Opportunity |
|---------|-------------------|-------------------|--------------------|
| **Full page reload on every action** | JRN-01.1, JRN-01.2, JRN-02.1 | Legacy PHP template rendering triggers full page reload on every form save | React SPA architecture eliminates reloads by design — this is a migration dividend, not new work |
| **No persistent filter/state between sessions** | JRN-01.1, JRN-01.3, JRN-02.2 | Legacy session-based state is lost on logout; no server-side persistence for UI state | Saved bookmarks (F12) for staff; department-scoped default state for admins (F6, F17) |
| **Lack of structured, searchable logs** | JRN-03.1, JRN-03.2, JRN-03.3 | Legacy Apache/PHP logs are unstructured text — hard to grep for specific events | Structured log format with `[CATEGORY] key=value` entries across auth, API key, and scheduler events (NFR-10) |
| **Configuration changes require deployment or DB access to verify** | JRN-02.1, JRN-03.1 | Legacy system provides no immediate feedback when config changes take effect | Inline validation and success confirmation on save; custom field changes live on next submission (JTBD-02.1) |
| **API key security exposure** | JRN-03.2, JRN-04.1 | Legacy: keys stored unhashed in DB and rotation requires service restart | Hashed storage at rest (NFR-8); rotation effective immediately via Spring Security without restart |
| **Silent failures for external integrations** | JRN-04.1, JRN-04.2 | Integra's parser fails silently when response shape drifts — no error surfaced | Byte-level fixture tests run on every deployment (JTBD-03.3, NFR-1) act as automated regression guard |

### Shared Convergence Points

- **JWT Authentication (F4):** Every persona traverses the auth layer. JRN-01.1, JRN-02.3, JRN-03.1, JRN-04.1 all depend on JWT/API key auth working correctly post-migration. Auth is the single highest-risk cross-cutting concern.
- **Category Configuration as Upstream Dependency:** JRN-02.1 (Diana configures categories) directly determines what Integra can submit (JRN-04.1) and what Marcus sees in his queue (JRN-01.1). Category misconfiguration has a cascading effect across all other journeys.
- **Open311 API Contract:** JRN-03.3 (Jordan validates shapes), JRN-04.1 (Integra submits), and JRN-04.2 (Integra polls) all converge on the same technical constraint: byte-level compatibility with legacy PHP output. This is the highest-stakes NFR across all journeys.

---

## Journey-to-JTBD Traceability

| JRN-ID | Stage | JTBD-ID | Expected Outcome |
|--------|-------|---------|-----------------|
| JRN-01.1 | Apply Priority Filter | JTBD-01.1 | Ticket list re-filters in < 500ms without full page reload |
| JRN-01.1 | Identify Overdue Items | JTBD-01.1 | Overdue tickets visually highlighted; top 3 priority items identified within 60 seconds of login |
| JRN-01.2 | Select Response Template | JTBD-01.2 | Response template pre-fills note field; no navigation away from ticket detail |
| JRN-01.2 | Change Substatus | JTBD-01.2 | Substatus change commits inline; history entry created without page reload |
| JRN-01.2 | Attach Photo | JTBD-01.2 | Full ticket update (comment + status + media) completes in under 3 minutes |
| JRN-01.3 | Save as Bookmark | JTBD-01.3 | Current filter and sort state saved as named bookmark linked to user account |
| JRN-01.3 | Return to Bookmark Next Day | JTBD-01.3 | Bookmark loads filtered results in under 2 seconds; zero filter re-entry |
| JRN-02.1 | Define Custom Fields | JTBD-02.1 | Custom field schema validated inline; no raw JSON required |
| JRN-02.1 | Save and Verify | JTBD-02.1 | Custom fields active on next ticket submission without deployment; full category config in under 10 minutes |
| JRN-02.2 | Scan On-Time Percentages | JTBD-02.2 | Department SLA dashboard loads 30-day summary in under 5 seconds |
| JRN-02.2 | Drill Into Problem Category | JTBD-02.2 | Volume trend and overdue detail accessible with one click from summary view |
| JRN-02.3 | Create Person Record | JTBD-02.3 | Department admin can create staff account without system admin involvement |
| JRN-02.3 | Assign to Categories | JTBD-02.3 | New staff member assigned to 3 categories in under 5 minutes |
| JRN-02.3 | Confirm Login Works | JTBD-02.3 | New account authenticates via JWT immediately after creation |
| JRN-03.1 | Verify Migrated Accounts | JTBD-03.1 | All legacy accounts present with correct roles; count matches legacy export |
| JRN-03.1 | Test Staff Login | JTBD-03.1 | Legacy staff credentials issue JWT tokens with no password reset prompts |
| JRN-03.1 | Create New Staff Account | JTBD-03.1 | New user created with role and department in under 3 minutes |
| JRN-03.2 | Register New API Client | JTBD-03.2 | New client created with hashed key in under 3 minutes; key shown once at creation |
| JRN-03.2 | Rotate Integra's API Key | JTBD-03.2 | Key rotation effective immediately; no service restart required |
| JRN-03.3 | Check Scheduler Job Logs | JTBD-03.3 | Each job execution logged with name, timestamp, and SUCCESS/FAILURE outcome |
| JRN-03.3 | Run Open311 Integration Tests | JTBD-03.3 | All Open311 response shapes pass automated fixture comparison; zero regressions |
| JRN-04.1 | POST /open311/requests Fires | JTBD-04.3 | Existing API key validates against Spring Boot with no re-registration |
| JRN-04.1 | Spring Boot Validates and Processes | JTBD-04.1 | POST response is byte-compatible with legacy PHP fixture; service_request_id returned |
| JRN-04.1 | Integra Parses Response | JTBD-04.1 | Zero integration code changes required; parser succeeds on first post-migration call |
| JRN-04.2 | GET /open311/requests/{id} Fires | JTBD-04.2 | GET endpoint accepts same parameters and returns same field structure as legacy |
| JRN-04.2 | Spring Boot Returns Response | JTBD-04.2 | Response passes byte-level comparison against legacy PHP fixture for all fields |

---

*JOURNEYS generated 2026-06-24 | uReport Modernization Project*
