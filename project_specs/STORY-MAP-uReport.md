# Story Map: uReport Modernization

| Field | Value |
|---|---|
| **Product Name** | uReport — Municipal Constituent Issue Tracking System |
| **Version** | 1.0 |
| **Date** | 2026-06-24 |
| **Related PRD** | `project_specs/PRD-uReport.md` |
| **Related Personas** | `project_specs/PERSONAS-uReport.md` |
| **Related JTBD** | `project_specs/JTBD-uReport.md` |
| **Related Journeys** | `project_specs/JOURNEYS-uReport.md` |
| **Related UserStories** | `project_specs/UserStories-uReport.md` |
| **Total Stories Mapped** | 63 (US-0.1 through US-20.2) |
| **Releases Planned** | R1 (MVP), R2 (Full Operations), R3 (Productivity) |

---

## Overview

This Story Map organizes uReport's 63 user stories into a two-dimensional structure:

- **X-axis (columns):** Journey stages drawn from JOURNEYS-uReport.md — the temporal sequence of user actions across all 11 journeys.
- **Y-axis (rows):** User stories grouped by Epic, placed at the journey stage where they are most directly exercised.
- **NaC column:** Natural Acceptance Criteria derived from JTBD outcomes, applied at the journey stage level. NaC bridge the "what matters" (JTBD) to "what is testable" (acceptance criteria).
- **Release column:** Increment assignment based on feature priority (P0 = R1, P1 = R2, P2 = R3) and journey completeness.

### What is Natural Acceptance Criteria (NaC)?

NaC is not invented — it is **derived** from the intersection of:
1. A **JTBD outcome** (the functional result that matters to the user)
2. A **journey stage** (the moment in the user's flow where that outcome applies)
3. A **user story** (the capability being built)

The derivation chain is: `JTBD-ID → Journey Stage → NaC Statement → Story AC verification`

NaC provides a bridge for increment planning: each release must enable at least one complete journey path, and each story in the release must have at least one NaC traceable to a P0 or P1 JTBD.

### Map ID Convention

Story map entries are identified as `SM-{Epic}.{NN}` (e.g., SM-0.1 = first story in Epic 0 mapped to the story map).

### Journey Stage Reference

The map uses the following consolidated stage labels drawn from the 11 journeys:

| Stage Code | Stage Name | Primary Journeys |
|-----------|-----------|-----------------|
| **S-AUTH** | Arrive & Authenticate | JRN-01.1, JRN-02.3, JRN-03.1, JRN-04.1 |
| **S-TRIAGE** | Queue Triage & Prioritization | JRN-01.1 |
| **S-WORK** | Ticket Work — View, Update, Close | JRN-01.2 |
| **S-SEARCH** | Search & Filter | JRN-01.1, JRN-01.3 |
| **S-BOOKMARK** | Save & Reuse Filters | JRN-01.3 |
| **S-CONFIG** | Configuration — Categories, Departments, SLA | JRN-02.1, JRN-02.3 |
| **S-METRICS** | Metrics & Reporting Review | JRN-02.2 |
| **S-ADMIN** | System Administration — Users, Clients | JRN-03.1, JRN-03.2 |
| **S-DEPLOY** | Deployment & Health Verification | JRN-03.3 |
| **S-API** | Open311 API Integration — Submit & Poll | JRN-04.1, JRN-04.2 |

---

## Story Map Matrix

> **Reading Guide:** Each row is one user story placed at its primary journey stage. NaC is derived from the JTBD outcome most relevant at that stage. Release assignment: R1 = P0 stories, R2 = P1 stories, R3 = P2 stories.

### P0 Stories — Release 1 (MVP Critical)

| SM-ID | Persona | Journey Stage | Epic | Story ID | Story Title | NaC (derived from JTBD) | Release |
|-------|---------|--------------|------|----------|-------------|------------------------|---------|
| SM-0.1 | PER-01 Marcus | S-WORK | Epic 0 (F0) | US-0.1 | Create a New Ticket | JTBD-01.2: Full update in under 3 min → Ticket created with category, location, reporter via single POST; 201 returned with full ticket object | R1 |
| SM-0.2 | PER-01 Marcus | S-WORK | Epic 0 (F0) | US-0.2 | Assign a Ticket to a Staff Member | JTBD-01.2: No context-switching → Assignment applies inline; history entry appended without page reload | R1 |
| SM-0.3 | PER-01 Marcus | S-WORK | Epic 0 (F0) | US-0.3 | Update Ticket Fields | JTBD-01.2: Full update in under 3 min → All field updates commit from single detail view; change history auto-recorded | R1 |
| SM-0.4 | PER-01 Marcus | S-WORK | Epic 0 (F0) | US-0.4 | Close a Ticket with a Substatus | JTBD-01.2: Full update in under 3 min → Close with substatus completes inline; "closed" history entry appended immediately | R1 |
| SM-0.5 | PER-01 Marcus | S-WORK | Epic 0 (F0) | US-0.5 | Mark a Ticket as a Duplicate | JTBD-01.2: No context-switching → Duplicate marking and closure complete from single action; circular parentage rejected | R1 |
| SM-0.6 | PER-01 Marcus | S-WORK | Epic 0 (F0) | US-0.6 | Reopen a Closed Ticket | JTBD-01.2: No context-switching → Reopen applies status change inline; history entry appended | R1 |
| SM-0.7 | PER-01 Marcus | S-WORK | Epic 0 (F0) | US-0.7 | Record a Comment on a Ticket | JTBD-01.2: Full update in under 3 min → Comment appended to history without navigating away from ticket detail | R1 |
| SM-0.8 | PER-01 Marcus | S-SEARCH | Epic 0 (F0) | US-0.8 | Export Ticket Search Results | JTBD-01.1: Priority items visible fast → CSV export of 200-ticket result set completes within 10 seconds | R1 |
| SM-1.1 | PER-01 Marcus | S-WORK | Epic 1 (F1) | US-1.1 | View Full Ticket History | JTBD-01.2: Full update in under 3 min → All prior actions, comments, and status changes visible chronologically on ticket detail | R1 |
| SM-1.2 | PER-01 Marcus | S-WORK | Epic 1 (F1) | US-1.2 | History Entry Auto-Appended on Lifecycle Events | JTBD-01.2: No context-switching → Every lifecycle action automatically produces an immutable history entry; no manual intervention | R1 |
| SM-1.3 | PER-01 Marcus | S-WORK | Epic 1 (F1) | US-1.3 | View Notification Recipients on History Entry | JTBD-01.2: Full update in under 3 min → sentNotifications field visible on each history entry confirming who was notified | R1 |
| SM-2.1 | PER-04 Integra | S-API | Epic 2 (F2) | US-2.1 | Discover API Metadata | JTBD-04.1: Zero code changes → GET /open311/discovery returns endpoint URLs in identical JSON/XML format; no auth required | R1 |
| SM-2.2 | PER-04 Integra | S-API | Epic 2 (F2) | US-2.2 | List Available Services | JTBD-04.2: Byte-identical responses → GET /open311/services returns services ordered and shaped identically to legacy PHP output | R1 |
| SM-2.3 | PER-04 Integra | S-API | Epic 2 (F2) | US-2.3 | Get Service Attributes | JTBD-04.2: Byte-identical responses → Custom attribute schemas returned for each service code in same field structure as legacy | R1 |
| SM-2.4 | PER-04 Integra | S-API | Epic 2 (F2) | US-2.4 | Submit a Service Request via Open311 | JTBD-04.1: Zero code changes → POST /open311/requests with existing api_key succeeds; JSON/XML response byte-compatible with legacy | R1 |
| SM-2.5 | PER-04 Integra | S-API | Epic 2 (F2) | US-2.5 | Retrieve and Filter Service Requests | JTBD-04.2: Byte-identical responses → GET /open311/requests pagination, field ordering, and filter semantics match legacy output exactly | R1 |
| SM-2.6 | PER-04 Integra | S-API | Epic 2 (F2) | US-2.6 | Retrieve a Single Service Request | JTBD-04.2: Byte-identical responses → GET /open311/requests/{id} returns single-element array with all fields in legacy-identical shape | R1 |
| SM-3.1 | PER-03 Jordan | S-ADMIN | Epic 3 (F3) | US-3.1 | Enforce Role-Based Endpoint Access | JTBD-03.1: Centralized user management → Staff-only endpoints return 403 for public/anonymous; 401 for unauthenticated; role from JWT claims | R1 |
| SM-3.2 | PER-03 Jordan | S-API | Epic 3 (F3) | US-3.2 | Enforce Per-Category Display and Posting Permissions | JTBD-04.1: Zero code changes → Category permission levels enforced on Open311 POST; anonymous denied from public-only categories | R1 |
| SM-3.3 | PER-03 Jordan | S-ADMIN | Epic 3 (F3) | US-3.3 | Gate Admin and Export Operations to Staff | JTBD-03.1: Centralized user management → All admin and export endpoints return 403 for non-staff; ticket history requires staff role | R1 |
| SM-4.1 | PER-01 Marcus | S-AUTH | Epic 4 (F4) | US-4.1 | Staff Login and JWT Issuance | JTBD-01.1: Priority items within 60 sec → Login completes with JWT access token; role and personId in response; invalid credentials return 401 | R1 |
| SM-4.2 | PER-01 Marcus | S-AUTH | Epic 4 (F4) | US-4.2 | JWT Token Refresh | JTBD-01.1: Priority items within 60 sec → Session silently refreshes without login interruption; expired refresh token returns 401 | R1 |
| SM-4.3 | PER-01 Marcus | S-AUTH | Epic 4 (F4) | US-4.3 | Logout and Token Invalidation | JTBD-03.1: Zero manual interventions → Logout revokes refresh token and blacklists access token; subsequent requests with blacklisted token return 401 | R1 |
| SM-4.4 | PER-03 Jordan | S-AUTH | Epic 4 (F4) | US-4.4 | OAuth / External Identity Provider Callback | JTBD-03.1: Zero manual interventions → OAuth callback maps IdP identity to existing people record; JWT issued on match; no auto-registration | R1 |
| SM-11.1 | PER-01 Marcus | S-SEARCH | Epic 11 (F11) | US-11.1 | Full-Text Keyword Search Across Tickets | JTBD-01.1: Priority items within 60 sec → Keyword search returns results in under 500ms; ≥95% overlap with Solr output on defined test corpus | R1 |
| SM-11.2 | PER-01 Marcus | S-TRIAGE | Epic 11 (F11) | US-11.2 | Filter Tickets by Multiple Criteria | JTBD-01.1: Priority items within 60 sec → Ticket list re-filters across 15+ criteria in under 500ms without full page reload | R1 |
| SM-11.3 | PER-01 Marcus | S-TRIAGE | Epic 11 (F11) | US-11.3 | View Ticket Search Results on Map | JTBD-01.1: Priority items within 60 sec → Map view returns geo-clustered results; switching between list and map requires no new search submission | R1 |
| SM-18.1 | PER-04 Integra | S-API | Epic 18 (F18) | US-18.1 | Receive Open311 Responses in JSON or XML | JTBD-04.2: Byte-identical responses → XML CDATA handling, null representation, and element names are byte-compatible with legacy PHP; invalid format returns 400 | R1 |
| SM-18.2 | PER-01 Marcus | S-SEARCH | Epic 18 (F18) | US-18.2 | Export Ticket Data in Multiple Formats | JTBD-01.1: Priority items visible → CSV/print/txt export reflects active search filters; content negotiation via format param matches legacy | R1 |


### P1 Stories — Release 2 (Full Operations)

| SM-ID | Persona | Journey Stage | Epic | Story ID | Story Title | NaC (derived from JTBD) | Release |
|-------|---------|--------------|------|----------|-------------|------------------------|---------|
| SM-5.1 | PER-03 Jordan | S-ADMIN | Epic 5 (F5) | US-5.1 | Create and Manage Staff User Accounts | JTBD-03.1: Zero manual interventions → New staff user created with role and department in under 3 minutes; no SQL required | R2 |
| SM-5.2 | PER-03 Jordan | S-ADMIN | Epic 5 (F5) | US-5.2 | Manage Multiple Emails, Phones, and Addresses | JTBD-03.1: Centralized user management → Multiple emails, phones, addresses manageable per person; usedForNotifications flag correctly routes digests | R2 |
| SM-5.3 | PER-01 Marcus | S-SEARCH | Epic 5 (F5) | US-5.3 | Search the People Directory | JTBD-01.2: No context-switching → Case-insensitive people search by name/email returns results in under 2 seconds; no navigation away from ticket needed | R2 |
| SM-5.4 | PER-01 Marcus | S-WORK | Epic 5 (F5) | US-5.4 | View All Tickets Associated With a Person | JTBD-01.2: No context-switching → All tickets for a person (reporter/assignee/entered) returned on one screen; repeat-reporter detection available | R2 |
| SM-6.1 | PER-02 Diana | S-CONFIG | Epic 6 (F6) | US-6.1 | Create and Manage Departments | JTBD-02.1: Category taxonomy accurate → Department CRUD completes without system admin; defaultPerson_id references staff role | R2 |
| SM-6.2 | PER-02 Diana | S-CONFIG | Epic 6 (F6) | US-6.2 | Assign Categories and Action Types to Departments | JTBD-02.1: Tickets route automatically → Category-department and action-department associations manageable via API; viewing department returns its categories | R2 |
| SM-7.1 | PER-02 Diana | S-CONFIG | Epic 7 (F7) | US-7.1 | Create and Configure a Category | JTBD-02.1: Category taxonomy accurate → Full category config (SLA, permissions, custom fields, assignee) completes in under 10 minutes; custom fields live on next submission | R2 |
| SM-7.2 | PER-02 Diana | S-CONFIG | Epic 7 (F7) | US-7.2 | Manage Category Groups | JTBD-02.1: Tickets route automatically → Category groups created and reordered; Open311 /services response respects ordering | R2 |
| SM-7.3 | PER-02 Diana | S-CONFIG | Epic 7 (F7) | US-7.3 | Configure Auto-Close Rules Per Category | JTBD-02.1: Category taxonomy accurate → Auto-close rule configured per category; Spring Scheduler closes qualifying tickets with correct substatus; job logged | R2 |
| SM-8.1 | PER-02 Diana | S-CONFIG | Epic 8 (F8) | US-8.1 | Create and Manage Substatuses | JTBD-02.1: Category taxonomy accurate → Custom substatuses created for open/closed; system substatuses seeded and protected; one default per parent status | R2 |
| SM-8.2 | PER-01 Marcus | S-WORK | Epic 8 (F8) | US-8.2 | Apply Substatus to Ticket Lifecycle Actions | JTBD-01.2: Full update in under 3 min → Substatus visible and selectable on close/reopen from ticket detail; ticket search filterable by substatus_id | R2 |
| SM-9.1 | PER-02 Diana | S-CONFIG | Epic 9 (F9) | US-9.1 | Create and Manage Department Action Types | JTBD-02.1: Category taxonomy accurate → Department action types created and associated via department_actions; system actions read-only | R2 |
| SM-9.2 | PER-02 Diana | S-CONFIG | Epic 9 (F9) | US-9.2 | Configure Category Action Response Overrides | JTBD-02.1: Custom fields live on next submission → Per-category action templates applied on digest notifications; replyEmail override respected | R2 |
| SM-9.3 | PER-01 Marcus | S-WORK | Epic 9 (F9) | US-9.3 | Render Template Variables in History Descriptions | JTBD-01.2: Full update in under 3 min → Template variables ({enteredByPerson}, {actionPerson}, {original:field}) resolved to human-readable values at read time | R2 |
| SM-10.1 | PER-01 Marcus | S-WORK | Epic 10 (F10) | US-10.1 | Upload Media to a Ticket | JTBD-01.2: Full update in under 3 min → Photo upload available inline on ticket detail; upload_media history entry appended; no navigation away required | R2 |
| SM-10.2 | PER-01 Marcus | S-WORK | Epic 10 (F10) | US-10.2 | Serve Media Files and Thumbnails | JTBD-01.2: Full update in under 3 min → Thumbnails generated on first request and cached; media_url included in Open311 response where attachments exist | R2 |
| SM-13.1 | PER-03 Jordan | S-ADMIN | Epic 13 (F13) | US-13.1 | Register and Manage an API Client | JTBD-03.2: Key rotation immediate → API client registered with hashed key in under 3 minutes; plain-text key shown once at creation | R2 |
| SM-13.2 | PER-03 Jordan | S-ADMIN | Epic 13 (F13) | US-13.2 | API Key Rotation | JTBD-03.2: Key rotation immediate, no restart → New key effective immediately without service restart; tickets retain client_id link after rotation | R2 |
| SM-15.1 | PER-01 Marcus | S-WORK | Epic 15 (F15) | US-15.1 | Capture and Validate Ticket Location | JTBD-01.2: No context-switching → Address normalized via AddressService; canonical locations record linked to ticket; additionalFields stored | R2 |
| SM-15.2 | PER-03 Jordan | S-DEPLOY | Epic 15 (F15) | US-15.2 | Rebuild Geo-Clusters via Scheduled Job | JTBD-03.3: Background jobs visible in logs → Geo-cluster rebuild job logged with timestamp, job name, and outcome; geoclusters populated at levels 0–6 | R2 |
| SM-15.3 | PER-01 Marcus | S-SEARCH | Epic 15 (F15) | US-15.3 | Location-Based Ticket Search | JTBD-01.1: Priority items within 60 sec → Radius, city, and zip ticket filters run against spatial index; results comparable to Solr geo-filtered output | R2 |
| SM-16.1 | PER-01 Marcus | S-WORK | Epic 16 (F16) | US-16.1 | Receive Email Notification After Ticket Action | JTBD-02.1: Tickets route automatically → Digest notifications rendered with action template variables; sent to usedForNotifications emails; sentNotifications updated | R2 |
| SM-16.2 | PER-02 Diana | S-CONFIG | Epic 16 (F16) | US-16.2 | Auto-Close Stale Tickets by Category Rule | JTBD-02.1: Category taxonomy accurate → Spring Scheduler auto-close job closes stale tickets per category rule; "closed" history entry appended per ticket | R2 |
| SM-16.3 | PER-03 Jordan | S-DEPLOY | Epic 16 (F16) | US-16.3 | Audit Data Integrity via Scheduled Job | JTBD-03.3: Background jobs visible in logs → Audit job logs timestamp, job name, and findings; no DB queries required to verify execution | R2 |


### P2 Stories — Release 3 (Productivity & Visibility)

| SM-ID | Persona | Journey Stage | Epic | Story ID | Story Title | NaC (derived from JTBD) | Release |
|-------|---------|--------------|------|----------|-------------|------------------------|---------|
| SM-12.1 | PER-01 Marcus | S-BOOKMARK | Epic 12 (F12) | US-12.1 | Save a Ticket Search as a Bookmark | JTBD-01.3: Saved bookmark loads in under 2 sec → Current search filter saved as named bookmark linked to user account; bookmark stores full request URI including sort | R3 |
| SM-12.2 | PER-01 Marcus | S-BOOKMARK | Epic 12 (F12) | US-12.2 | List and Navigate Saved Bookmarks | JTBD-01.3: Saved bookmark loads in under 2 sec → Bookmarks listed in persistent sidebar; clicking bookmark loads filtered results in under 2 seconds; survives logout | R3 |
| SM-12.3 | PER-01 Marcus | S-BOOKMARK | Epic 12 (F12) | US-12.3 | Delete a Bookmark | JTBD-01.3: Saved bookmark loads in under 2 sec → Only bookmark owner can delete; non-owner returns 403; deleted bookmark returns 404 on subsequent requests | R3 |
| SM-14.1 | PER-01 Marcus | S-WORK | Epic 14 (F14) | US-14.1 | Record Submission and Response Channel on a Ticket | JTBD-01.2: Full update in under 3 min → contactMethod_id and responseMethod_id recorded on ticket; ticket search filterable by contact method | R3 |
| SM-17.1 | PER-02 Diana | S-METRICS | Epic 17 (F17) | US-17.1 | View SLA Compliance Metrics by Category | JTBD-02.2: SLA dashboard loads in under 5 sec → Department 30-day SLA summary loads in under 5 seconds; on-time % per category displayed without system admin | R3 |
| SM-17.2 | PER-02 Diana | S-METRICS | Epic 17 (F17) | US-17.2 | Run Canned Activity and Volume Reports | JTBD-02.2: SLA dashboard loads in under 5 sec → All 10 canned reports return structured data in under 5 seconds; all report endpoints require staff role | R3 |
| SM-19.1 | PER-01 Marcus | S-WORK | Epic 19 (F19) | US-19.1 | Assign an Issue Type to a Ticket | JTBD-01.2: Full update in under 3 min → issueType_id assignable on ticket create/update; ticket search filterable by issue type | R3 |
| SM-19.2 | PER-03 Jordan | S-ADMIN | Epic 19 (F19) | US-19.2 | Administer Issue Type Records | JTBD-03.1: Centralized user management → Issue type CRUD available to staff; seeded types (Comment, Complaint, Question, Report, Request, Violation) present at install | R3 |
| SM-20.1 | PER-02 Diana | S-CONFIG | Epic 20 (F20) | US-20.1 | Create and Manage Response Templates | JTBD-02.1: Category taxonomy accurate → Response template CRUD available to staff; templates associated with action_id for per-action lookup | R3 |
| SM-20.2 | PER-01 Marcus | S-WORK | Epic 20 (F20) | US-20.2 | Use a Response Template When Recording a Ticket Response | JTBD-01.2: Full update in under 3 min → Template picker inline on ticket detail action area; selected template pre-fills notes; staff can edit before submitting | R3 |


---

## NaC Derivation Table

Full traceability: JTBD outcome → Journey Stage → NaC Statement → Stories covered

| JTBD-ID | Priority | Outcome | Journey Stage | NaC Statement | Stories Covered |
|---------|---------|---------|--------------|---------------|-----------------|
| JTBD-01.1 | P0 | Identify priority tickets within 60 seconds of login | S-AUTH: Arrive & Login (JRN-01.1 Stage 1) | Given a case worker logs in with 30+ assigned tickets, when the ticket list loads, then JWT auth completes and the dashboard is accessible in under 5 seconds | US-4.1, US-4.2 |
| JTBD-01.1 | P0 | Identify priority tickets within 60 seconds of login | S-TRIAGE: Apply Priority Filter (JRN-01.1 Stage 3) | Given a case worker applies status=open + sorted-by-due-date filter, when results load, then overdue tickets are highlighted and the list re-filters in under 500ms without page reload | US-11.2, US-8.2 |
| JTBD-01.1 | P0 | Identify priority tickets within 60 seconds of login | S-TRIAGE: Identify Overdue Items (JRN-01.1 Stage 4) | Given the filtered ticket list is displayed, when Marcus scans it, then overdue rows are visually differentiated and top 3 priority items identifiable within 60 seconds of login | US-11.2, US-11.3 |
| JTBD-01.1 | P0 | CSV export completes in under 10 seconds | S-SEARCH: Export (JRN-01.1 extension) | Given a staff user has applied search filters, when they request CSV/print export, then export of up to 200 tickets completes within 10 seconds and requires staff role | US-0.8, US-18.2 |
| JTBD-01.2 | P0 | Full ticket update (comment + status + media) in under 3 minutes | S-WORK: Open Ticket Detail (JRN-01.2 Stage 1) | Given a staff member opens a ticket detail view, when the page loads, then ticket header, status, history, and action area are all visible without scrolling away | US-1.1, US-0.3 |
| JTBD-01.2 | P0 | Full ticket update in under 3 minutes from a single view | S-WORK: Select Response Template (JRN-01.2 Stage 2) | Given a staff member is on the ticket detail view, when they add a comment, change substatus, and upload a photo, then all three actions are recorded as history entries without navigating away | US-0.7, US-8.2, US-10.1 |
| JTBD-01.2 | P0 | Full ticket update in under 3 minutes from a single view | S-WORK: Attach Photo (JRN-01.2 Stage 5) | Given a staff member attaches a photo to a ticket inline, when upload completes, then an upload_media history entry is appended and thumbnail confirms success without page reload | US-10.1, US-10.2, US-1.2 |
| JTBD-01.3 | P2 | Saved bookmark loads recurring filter in under 2 seconds | S-BOOKMARK: Save as Bookmark (JRN-01.3 Stage 2) | Given a case worker has applied a filter combination, when they click "Save Search" and name the bookmark, then the full request URI (including sort) is stored linked to their account | US-12.1 |
| JTBD-01.3 | P2 | Saved bookmark loads in under 2 seconds after login | S-BOOKMARK: Return to Bookmark (JRN-01.3 Stage 4) | Given a case worker has a saved bookmark, when they click it after login, then the filtered ticket list loads with all saved parameters applied in under 2 seconds | US-12.2, US-12.3 |
| JTBD-02.1 | P1 | Category configured once routes all tickets automatically | S-CONFIG: Create New Category (JRN-02.1 Stage 2–5) | Given a department admin saves a category with SLA, permissions, and custom fields, when saving completes, then no page reload is required and category is immediately active | US-7.1, US-7.2, US-6.1 |
| JTBD-02.1 | P1 | Custom fields live on next ticket submission without deployment | S-CONFIG: Define Custom Fields (JRN-02.1 Stage 4) | Given a department admin saves a category custom field schema change, when a constituent submits a ticket for that category immediately after, then the new fields are collected without a deployment | US-7.1 |
| JTBD-02.1 | P1 | Category auto-close rules work without manual intervention | S-CONFIG: Configure Auto-Close (JRN-02.1 related) | Given auto-close is configured on a category, when the Spring Scheduler job runs, then stale tickets are closed with the configured substatus and a history entry is appended | US-7.3, US-16.2 |
| JTBD-02.2 | P2 | Department SLA dashboard loads 30-day summary in under 5 seconds | S-METRICS: Navigate to Dashboard (JRN-02.2 Stage 1–2) | Given a department admin opens the metrics dashboard, when she selects her department and a 30-day window, then on-time closure percentages for all categories are displayed within 5 seconds | US-17.1 |
| JTBD-02.2 | P2 | Volume trend accessible in same view without switching reports | S-METRICS: Scan On-Time Percentages (JRN-02.2 Stage 3) | Given the metrics dashboard is loaded, when Diana drills into a problem category, then volume trend and overdue ticket detail are accessible with one click from the summary view | US-17.1, US-17.2 |
| JTBD-02.3 | P1 | New staff onboarded to 3 categories in under 5 minutes without system admin | S-CONFIG: Create Person Record (JRN-02.3 Stage 2) | Given a department admin creates a new person record with role=staff and assigns to her department, when saved, then the account is ready to authenticate via JWT without system admin involvement | US-5.1, US-4.1 |
| JTBD-02.3 | P1 | New staff assigned to 3 categories in under 5 minutes | S-CONFIG: Assign to Categories (JRN-02.3 Stage 3) | Given a department admin assigns a new person to 3 categories, when each assignment saves, then the person appears in each category's assignee list within 5 minutes total | US-6.2, US-7.1 |
| JTBD-03.1 | P0 | All legacy staff accounts authenticate via JWT with zero manual interventions | S-ADMIN: Verify Migrated Accounts (JRN-03.1 Stage 2) | Given all legacy staff accounts have been migrated, when each staff user attempts login with existing credentials, then JWT access tokens are issued with no password reset prompts | US-4.1, US-5.1 |
| JTBD-03.1 | P0 | New staff user created with role and department in under 3 minutes | S-ADMIN: Create New Staff Account (JRN-03.1 Stage 4) | Given an admin creates a new staff user with role and department via the SPA form, when saved, then the account is usable for JWT login within 3 minutes; no SQL required | US-5.1, US-4.1 |
| JTBD-03.2 | P1 | API key rotation immediate, no service restart | S-ADMIN: Register New API Client (JRN-03.2 Stage 2) | Given an admin registers a new API client, when the form saves, then a hashed key is generated and shown once in plaintext; stored hashed at rest; registration completes in under 3 minutes | US-13.1, US-13.2 |
| JTBD-03.2 | P1 | Key rotation takes effect immediately | S-ADMIN: Rotate API Key (JRN-03.2 Stage 4) | Given an admin rotates a client key via the admin UI, when the new key is used immediately in an Open311 POST, then the request authenticates successfully without a service restart | US-13.2 |
| JTBD-03.3 | P1 | Background jobs logged with timestamp and outcome | S-DEPLOY: Check Scheduler Logs (JRN-03.3 Stage 2–3) | Given Spring Scheduler jobs run (digest, auto-close, audit), when Jordan inspects docker logs, then each job shows job name, start time, and SUCCESS/FAILURE outcome; accessible via docker logs only | US-16.1, US-16.2, US-16.3, US-15.2 |
| JTBD-03.3 | P1 | Open311 shapes validated per deployment | S-DEPLOY: Run Integration Tests (JRN-03.3 Stage 4) | Given the Open311 integration test suite runs post-deployment, when any endpoint response deviates from the legacy fixture, then the test fails fast; all response shapes pass before deployment declared stable | US-2.1, US-2.2, US-2.3, US-2.4, US-2.5, US-2.6, US-18.1 |
| JTBD-04.1 | P0 | Zero code changes required to Integra after migration | S-API: POST /open311/requests (JRN-04.1 Stage 2–3) | Given a registered API client POSTs a service request with existing api_key, when Spring Boot processes it, then JSON/XML response structure matches legacy PHP fixture with no field name or type deviations | US-2.4, US-18.1 |
| JTBD-04.2 | P0 | All GET response payloads pass byte-level comparison against legacy fixtures | S-API: GET /open311/requests/{id} (JRN-04.2 Stage 2–3) | Given a GET /open311/requests/{id} request is made, when Spring Boot responds, then field names, types, null-handling, and XML structure pass byte-level comparison against legacy PHP fixture | US-2.5, US-2.6, US-18.1 |
| JTBD-04.3 | P0 | Existing API keys authenticate against Spring Boot with zero re-registration | S-API: API Key Validation (JRN-04.1 Stage 2) | Given an existing API client key from the migrated clients table is used in an Open311 POST, when Spring Boot auth layer validates it, then the request succeeds with HTTP 200; invalid key returns HTTP 403 in legacy-identical format | US-2.4, US-4.1, US-13.1 |

---

## Release Planning

---

### R1: MVP — "Working Migration Core"

**Theme:** Deliver a fully functional, byte-compatible replacement of the legacy PHP system for all P0 flows. After R1, staff can log in, manage tickets, search, and export. External API clients continue operating without code changes.

**Story Count:** 29 P0 stories

**Stories in R1:**

| Story ID | Title | Primary Persona | Journey Enabled |
|----------|-------|----------------|----------------|
| US-4.1 | Staff Login and JWT Issuance | PER-01, PER-02, PER-03 | JRN-01.1 Stage 1, JRN-02.3 Stage 5, JRN-03.1 Stage 3 |
| US-4.2 | JWT Token Refresh | PER-01, PER-02, PER-03 | JRN-01.1 long sessions |
| US-4.3 | Logout and Token Invalidation | PER-01, PER-02, PER-03 | JRN-03.1 Stage 5 |
| US-4.4 | OAuth / External IdP Callback | PER-03 | JRN-03.1 extended |
| US-3.1 | Enforce Role-Based Endpoint Access | PER-03 | All journeys |
| US-3.2 | Enforce Per-Category Permissions | PER-03, PER-04 | JRN-04.1 Stage 3 |
| US-3.3 | Gate Admin and Export Operations | PER-03 | JRN-03.1 Stage 1 |
| US-11.1 | Full-Text Keyword Search | PER-01 | JRN-01.1 Stage 3 |
| US-11.2 | Filter Tickets by Multiple Criteria | PER-01 | JRN-01.1 Stage 3–4 |
| US-11.3 | View Ticket Search Results on Map | PER-01 | JRN-01.1 Stage 4 |
| US-0.1 | Create a New Ticket | PER-01 | JRN-01.2 |
| US-0.2 | Assign a Ticket to a Staff Member | PER-01 | JRN-01.2 |
| US-0.3 | Update Ticket Fields | PER-01 | JRN-01.2 |
| US-0.4 | Close a Ticket with a Substatus | PER-01 | JRN-01.2 Stage 4 |
| US-0.5 | Mark a Ticket as a Duplicate | PER-01 | JRN-01.2 |
| US-0.6 | Reopen a Closed Ticket | PER-01 | JRN-01.2 |
| US-0.7 | Record a Comment on a Ticket | PER-01 | JRN-01.2 Stage 3 |
| US-0.8 | Export Ticket Search Results | PER-01 | JRN-01.1 Stage 5 |
| US-1.1 | View Full Ticket History | PER-01 | JRN-01.2 Stage 1 |
| US-1.2 | History Entry Auto-Appended | PER-01 | JRN-01.2 all stages |
| US-1.3 | View Notification Recipients | PER-01 | JRN-01.2 |
| US-18.1 | Receive Open311 Responses in JSON or XML | PER-04 | JRN-04.1, JRN-04.2 |
| US-18.2 | Export Ticket Data in Multiple Formats | PER-01 | JRN-01.1 Stage 5 |
| US-2.1 | Discover API Metadata | PER-04 | JRN-04.1 pre-flight |
| US-2.2 | List Available Services | PER-04 | JRN-04.1 Stage 1 |
| US-2.3 | Get Service Attributes | PER-04 | JRN-04.1 |
| US-2.4 | Submit a Service Request via Open311 | PER-04 | JRN-04.1 Stage 2–3 |
| US-2.5 | Retrieve and Filter Service Requests | PER-04 | JRN-04.2 Stage 2 |
| US-2.6 | Retrieve a Single Service Request | PER-04 | JRN-04.2 Stage 2–3 |

> **Note:** 29 P0 stories placed in R1 (US-4.1–4.4 = 4, US-3.1–3.3 = 3, US-11.1–11.3 = 3, US-0.1–0.8 = 8, US-1.1–1.3 = 3, US-18.1–18.2 = 2, US-2.1–2.6 = 6 → 29 total, all P0)

**Personas Served by R1:**
- PER-01 Marcus (Case Worker) — full ticket management lifecycle enabled
- PER-03 Jordan (Sys Admin) — JWT auth, RBAC enforcement; account validation journey partial
- PER-04 Integra (API Client) — complete Open311 submission and polling journey

**JTBD Addressed by R1:**

| JTBD-ID | Status after R1 |
|---------|----------------|
| JTBD-01.1 | ✅ Complete — login, filter, triage, overdue visibility, export |
| JTBD-01.2 | ✅ Complete — full ticket update (comment + status + media stub) from single view |
| JTBD-01.3 | ❌ Deferred to R3 — bookmarks not in P0 |
| JTBD-02.1 | ⚠️ Partial — RBAC enforced; category management in R2 |
| JTBD-02.2 | ❌ Deferred to R3 |
| JTBD-02.3 | ⚠️ Partial — JWT auth works; people management in R2 |
| JTBD-03.1 | ⚠️ Partial — JWT issued; user CRUD in R2 |
| JTBD-03.2 | ❌ Deferred to R2 |
| JTBD-03.3 | ⚠️ Partial — Open311 shapes validated; scheduler jobs in R2 |
| JTBD-04.1 | ✅ Complete — POST /open311/requests byte-compatible |
| JTBD-04.2 | ✅ Complete — GET /open311/requests byte-compatible |
| JTBD-04.3 | ✅ Complete — existing API keys authenticate against Spring Boot |

**Complete Journeys Enabled by R1:**
- ✅ JRN-01.1 (Morning Queue Triage) — all 5 stages covered
- ✅ JRN-01.2 (Full Ticket Update) — all 5 stages covered (media upload at basic level)
- ✅ JRN-04.1 (Service Request Submission) — all stages covered
- ✅ JRN-04.2 (Status Polling) — all stages covered
- ⚠️ JRN-03.1 (JWT Account Validation) — stages 3–5 covered; staff CRUD in R2

---

### R2: Full Operations — "Complete Staff and Admin Workflows"

**Theme:** Deliver all P1 capabilities. After R2, department administrators can fully configure categories, manage staff, and run scheduler jobs. System administrators can provision users and manage API clients. Case workers have media upload, location search, and email notifications.

**Story Count:** 24 P1 stories

**Stories in R2:**

| Story ID | Title | Primary Persona | Journey Enabled |
|----------|-------|----------------|----------------|
| US-5.1 | Create and Manage Staff User Accounts | PER-03 | JRN-03.1 Stage 4, JRN-02.3 Stage 2 |
| US-5.2 | Manage Multiple Emails, Phones, Addresses | PER-03 | JRN-02.3 / notification routing |
| US-5.3 | Search the People Directory | PER-01 | JRN-01.2 (person lookup) |
| US-5.4 | View All Tickets Associated With a Person | PER-01 | JRN-01.2 (repeat reporter) |
| US-6.1 | Create and Manage Departments | PER-02 | JRN-02.1 Stage 2 |
| US-6.2 | Assign Categories and Action Types to Departments | PER-02 | JRN-02.1 Stage 2, JRN-02.3 Stage 3 |
| US-7.1 | Create and Configure a Category | PER-02 | JRN-02.1 Stages 2–6 |
| US-7.2 | Manage Category Groups | PER-02 | JRN-02.1 Stage 2 |
| US-7.3 | Configure Auto-Close Rules Per Category | PER-02 | JRN-02.1 Stage 6 |
| US-8.1 | Create and Manage Substatuses | PER-02 | JRN-01.2 Stage 4 (prerequisite) |
| US-8.2 | Apply Substatus to Ticket Lifecycle Actions | PER-01 | JRN-01.2 Stage 4 |
| US-9.1 | Create and Manage Department Action Types | PER-02 | JRN-02.1 Stage 2 |
| US-9.2 | Configure Category Action Response Overrides | PER-02 | JRN-02.1 Stage 6 |
| US-9.3 | Render Template Variables in History Descriptions | PER-01 | JRN-01.2 Stage 3 |
| US-10.1 | Upload Media to a Ticket | PER-01 | JRN-01.2 Stage 5 |
| US-10.2 | Serve Media Files and Thumbnails | PER-01 | JRN-01.2 Stage 5 |
| US-13.1 | Register and Manage an API Client | PER-03 | JRN-03.2 Stage 2 |
| US-13.2 | API Key Rotation | PER-03 | JRN-03.2 Stage 4 |
| US-15.1 | Capture and Validate Ticket Location | PER-01 | JRN-01.2 (location) |
| US-15.2 | Rebuild Geo-Clusters via Scheduled Job | PER-03 | JRN-03.3 Stage 2 |
| US-15.3 | Location-Based Ticket Search | PER-01 | JRN-01.1 Stage 3 (geo filter) |
| US-16.1 | Receive Email Notification After Ticket Action | PER-01 | JRN-01.2 (notification confirmation) |
| US-16.2 | Auto-Close Stale Tickets by Category Rule | PER-02 | JRN-03.3 Stage 3 |
| US-16.3 | Audit Data Integrity via Scheduled Job | PER-03 | JRN-03.3 Stage 3 |

**Personas Served by R2 (incremental, adds to R1):**
- PER-02 Diana (Dept Admin) — first release where Diana's primary journey is fully enabled
- PER-03 Jordan (Sys Admin) — full user management, API client management, scheduler health
- PER-01 Marcus — enhanced with media upload, location search, email notifications, substatus

**JTBD Addressed by R2 (completing what R1 started):**

| JTBD-ID | Status after R2 |
|---------|----------------|
| JTBD-01.1 | ✅ Complete + enhanced (geo filters, substatus filter) |
| JTBD-01.2 | ✅ Complete — media upload, substatus, template variables, notifications all live |
| JTBD-01.3 | ❌ Deferred to R3 |
| JTBD-02.1 | ✅ Complete — full category config, auto-close, action responses |
| JTBD-02.2 | ❌ Deferred to R3 |
| JTBD-02.3 | ✅ Complete — Dept admin can create people, assign to categories without Jordan |
| JTBD-03.1 | ✅ Complete — user CRUD, JWT migration verified, auth logs |
| JTBD-03.2 | ✅ Complete — API client registration and key rotation without service restart |
| JTBD-03.3 | ✅ Complete — scheduler logs, geo-cluster job, audit job, Open311 integration tests |
| JTBD-04.1 | ✅ Complete (carried from R1) |
| JTBD-04.2 | ✅ Complete (carried from R1) |
| JTBD-04.3 | ✅ Complete (carried from R1) |

**Complete Journeys Newly Enabled by R2:**
- ✅ JRN-02.1 (Category Configuration) — all 6 stages covered
- ✅ JRN-02.3 (Staff Onboarding) — all 5 stages covered
- ✅ JRN-03.1 (Post-Migration JWT Validation) — all 5 stages covered
- ✅ JRN-03.2 (API Client Registration & Key Rotation) — all 5 stages covered
- ✅ JRN-03.3 (Post-Deployment Health Verification) — all 5 stages covered

---

### R3: Productivity & Visibility — "Staff Efficiency and Reporting"

**Theme:** Deliver all P2 capabilities. After R3, case workers can save and reuse searches, department admins can view SLA dashboards and run canned reports, and the system has full contact method tracking, issue type classification, and response templates.

**Story Count:** 11 P2 stories

**Stories in R3:**

| Story ID | Title | Primary Persona | Journey Enabled |
|----------|-------|----------------|----------------|
| US-12.1 | Save a Ticket Search as a Bookmark | PER-01 | JRN-01.3 Stage 2 |
| US-12.2 | List and Navigate Saved Bookmarks | PER-01 | JRN-01.3 Stages 3–4 |
| US-12.3 | Delete a Bookmark | PER-01 | JRN-01.3 maintenance |
| US-14.1 | Record Submission and Response Channel on a Ticket | PER-01 | JRN-01.2 (channel data) |
| US-17.1 | View SLA Compliance Metrics by Category | PER-02 | JRN-02.2 Stages 1–4 |
| US-17.2 | Run Canned Activity and Volume Reports | PER-02 | JRN-02.2 Stage 5 |
| US-19.1 | Assign an Issue Type to a Ticket | PER-01 | JRN-01.2 (classification) |
| US-19.2 | Administer Issue Type Records | PER-03 | JRN-03.1 admin scope |
| US-20.1 | Create and Manage Response Templates | PER-02 | JRN-02.1 Stage 6 |
| US-20.2 | Use a Response Template When Recording a Ticket Response | PER-01 | JRN-01.2 Stage 2 |

**Personas Served by R3 (incremental, adds to R1+R2):**
- PER-01 Marcus — saved searches eliminate morning setup tax (JTBD-01.3); response templates improve consistency
- PER-02 Diana — SLA dashboard and canned reports replace ad-hoc spreadsheet analysis (JTBD-02.2)
- PER-03 Jordan — issue type administration

**JTBD Addressed by R3 (completing the remaining JTBDs):**

| JTBD-ID | Status after R3 |
|---------|----------------|
| JTBD-01.3 | ✅ Complete — bookmarks save filter+sort; load in under 2 seconds |
| JTBD-02.2 | ✅ Complete — SLA dashboard loads 30-day summary in under 5 seconds |
| All other JTBD | ✅ Already complete from R1+R2 |

**Complete Journeys Newly Enabled by R3:**
- ✅ JRN-01.3 (Saving and Reusing a Recurring Filter) — all 4 stages covered
- ✅ JRN-02.2 (Month-End SLA Compliance Review) — all 5 stages covered

---

---

## Coverage Analysis

### Persona Coverage by Release

| Persona | R1 | R2 | R3 |
|---------|----|----|-----|
| PER-01 Marcus (Case Worker) | ✅ Core workflow (login, triage, ticket CRUD, export, search) | ✅ Enhanced (media, location, substatus, notifications, people lookup) | ✅ Complete (bookmarks, templates, contact method, issue types) |
| PER-02 Diana (Dept Admin) | ⚠️ Partial (RBAC enforced; no category config yet) | ✅ Primary journey complete (category config, staff onboarding, scheduler) | ✅ Complete (SLA dashboard, canned reports, response templates) |
| PER-03 Jordan (Sys Admin) | ⚠️ Partial (JWT auth enforced; no user CRUD yet) | ✅ Primary journey complete (user management, API clients, deployment health) | ✅ Complete (issue type admin) |
| PER-04 Integra (API Client) | ✅ Complete (all Open311 endpoints, API key auth) | — (no additional stories) | — (no additional stories) |

### JTBD Coverage by Release

| JTBD-ID | R1 | R2 | R3 |
|---------|----|----|-----|
| JTBD-01.1 Daily Queue Triage | ✅ Complete | ✅ Enhanced | ✅ Full |
| JTBD-01.2 Full Ticket Update | ✅ Complete | ✅ Enhanced (media, templates) | ✅ Full |
| JTBD-01.3 Persistent Saved Searches | ❌ | ❌ | ✅ Complete |
| JTBD-02.1 Category Configuration | ⚠️ Partial | ✅ Complete | ✅ Full |
| JTBD-02.2 SLA Compliance Monitoring | ❌ | ❌ | ✅ Complete |
| JTBD-02.3 Self-Service Staff Onboarding | ⚠️ Partial | ✅ Complete | ✅ Full |
| JTBD-03.1 Centralized User Management | ⚠️ Partial | ✅ Complete | ✅ Full |
| JTBD-03.2 Secure API Client Lifecycle | ❌ | ✅ Complete | ✅ Full |
| JTBD-03.3 Deployment Health Verification | ⚠️ Partial | ✅ Complete | ✅ Full |
| JTBD-04.1 Zero-Change Service Request Submission | ✅ Complete | ✅ Full | ✅ Full |
| JTBD-04.2 Byte-Identical Status Polling | ✅ Complete | ✅ Full | ✅ Full |
| JTBD-04.3 Uninterrupted API Key Authentication | ✅ Complete | ✅ Full | ✅ Full |

### Journey Coverage Summary

| JRN-ID | Journey | First Complete Release | Stages Covered |
|--------|---------|----------------------|----------------|
| JRN-01.1 | Morning Queue Triage | R1 | All 5 stages |
| JRN-01.2 | Full Ticket Update | R1 (basic) / R2 (full media+templates) | All 5 stages by R2 |
| JRN-01.3 | Saving and Reusing a Filter | R3 | All 4 stages |
| JRN-02.1 | Category Configuration | R2 | All 6 stages |
| JRN-02.2 | Month-End SLA Review | R3 | All 5 stages |
| JRN-02.3 | Staff Onboarding | R2 | All 5 stages |
| JRN-03.1 | Post-Migration JWT Validation | R1 (partial) / R2 (full) | All 5 stages by R2 |
| JRN-03.2 | API Client Registration & Key Rotation | R2 | All 5 stages |
| JRN-03.3 | Post-Deployment Health Verification | R2 | All 5 stages |
| JRN-04.1 | Service Request Submission | R1 | All 5 stages |
| JRN-04.2 | Status Polling | R1 | All 4 stages |

### Gap Analysis

#### Journey Stages Without Mapped Stories
_No gaps. All 11 journeys across all stages have at least one mapped story._

Stage verification:
- **S-AUTH** → US-4.1, US-4.2, US-4.3, US-4.4 ✅
- **S-TRIAGE** → US-11.2, US-11.3, US-8.2 ✅
- **S-WORK** → US-0.1–0.8, US-1.1–1.3, US-8.2, US-9.3, US-10.1–10.2, US-14.1, US-15.1, US-16.1, US-19.1, US-20.2 ✅
- **S-SEARCH** → US-0.8, US-5.3, US-11.1, US-15.3, US-18.2 ✅
- **S-BOOKMARK** → US-12.1, US-12.2, US-12.3 ✅
- **S-CONFIG** → US-6.1, US-6.2, US-7.1–7.3, US-8.1, US-9.1–9.2, US-16.2, US-20.1 ✅
- **S-METRICS** → US-17.1, US-17.2 ✅
- **S-ADMIN** → US-3.1, US-3.3, US-5.1–5.2, US-5.4, US-13.1, US-13.2, US-19.2 ✅
- **S-DEPLOY** → US-15.2, US-16.3 ✅
- **S-API** → US-2.1–2.6, US-3.2, US-18.1 ✅

#### JTBD Outcomes Without Derived NaC
_No gaps. All 12 JTBD entries (JTBD-01.1 through JTBD-04.3) have at least one NaC derived in the NaC Derivation Table._

#### Orphan Stories (not mapped to any journey stage)
_No orphan stories. All 63 user stories are placed in the Story Map Matrix._

#### Cross-Journey Risk Hotspots
These areas have the highest cross-journey dependency and represent the highest regression risk:

| Risk Area | Stories | Affected Journeys | Mitigation |
|-----------|---------|------------------|------------|
| **JWT Auth (S-AUTH)** | US-4.1–4.4 | JRN-01.1, JRN-02.3, JRN-03.1, JRN-04.1 | Auth migration validated in JRN-03.1; R1 acceptance gate |
| **Open311 Response Shape** | US-2.1–2.6, US-18.1 | JRN-03.3, JRN-04.1, JRN-04.2 | Automated fixture comparison test suite; R1 acceptance gate |
| **Category Config Upstream** | US-7.1, US-7.3 | JRN-02.1 → JRN-04.1 (service discovery) | Category config in R2 must not break Open311 service list shape |
| **Scheduler Jobs** | US-16.1, US-16.2, US-16.3, US-15.2 | JRN-03.3 | Structured logging (NFR-10); all jobs verified in R2 |

---

---

## NaC-to-Acceptance Criteria Mapping

This table verifies that each NaC aligns with at least one acceptance criterion in the corresponding UserStory. Alignment confirms NaC are grounded in the actual testable requirements, not invented.

| NaC Statement (summary) | Derived From | Story | Matching Acceptance Criterion |
|------------------------|-------------|-------|-------------------------------|
| JWT auth completes; dashboard accessible in under 5 seconds | JTBD-01.1 → S-AUTH | US-4.1 | "On success, returns `{ accessToken, refreshToken, expiresIn: 3600, role, personId }`" |
| Ticket list re-filters in under 500ms without page reload | JTBD-01.1 → S-TRIAGE | US-11.2 | "Search results are returned in under 500ms for datasets up to 500,000 tickets" |
| Overdue tickets visually differentiated; top 3 identifiable within 60 sec | JTBD-01.1 → S-TRIAGE | US-11.2 | "Ticket search supports filters: ...status, substatus_id..." (enables overdue filtering) |
| CSV export of 200 tickets completes within 10 seconds | JTBD-01.1 → S-SEARCH | US-0.8 | "Export of up to 200 tickets completes within 10 seconds" ✅ exact match |
| All three actions (comment + status + photo) recorded without navigating away | JTBD-01.2 → S-WORK | US-0.7 + US-8.2 + US-10.1 | US-0.7: "Comment is visible in ticket history view"; US-8.2: "Ticket detail view displays the current substatus"; US-10.1: "Upload permission is gated...uploaded files are listed on the ticket detail view" |
| Photo upload inline; thumbnail confirms success without page reload | JTBD-01.2 → S-WORK | US-10.2 | "GET /api/v1/media/{id}/thumbnail serves a cached thumbnail; if...doesn't exist yet it is generated on first request and cached" |
| Saved bookmark stores full request URI including sort order | JTBD-01.3 → S-BOOKMARK | US-12.1 | "POST /api/v1/bookmarks accepts `name` and `requestUri` (the full search URI)" ✅ exact match |
| Clicking bookmark loads filtered results in under 2 seconds | JTBD-01.3 → S-BOOKMARK | US-12.2 | "Bookmark navigation loads in under 2 seconds" ✅ exact match |
| Custom field schema change live on next submission without deployment | JTBD-02.1 → S-CONFIG | US-7.1 | "`customFields` schema changes take effect on the next ticket submission without a deployment" ✅ exact match |
| Full category config completes in under 10 minutes | JTBD-02.1 → S-CONFIG | US-7.1 | "Full category creation (all fields) completes within the SPA in under 10 minutes" ✅ exact match |
| Auto-close closes stale tickets with correct substatus; history entry appended | JTBD-02.1 → S-CONFIG | US-16.2 | "Qualifying tickets are closed with the category's `autoCloseSubstatus_id`"; "A 'closed' history entry is appended for each auto-closed ticket" ✅ exact match |
| SLA dashboard loads 30-day summary in under 5 seconds | JTBD-02.2 → S-METRICS | US-17.1 | "Metrics dashboard loads the department's 30-day SLA summary in under 5 seconds" ✅ exact match |
| New staff created with role and department in under 3 minutes | JTBD-02.3 / JTBD-03.1 → S-ADMIN | US-5.1 | "Staff user creation completes in under 3 minutes via the SPA form" ✅ exact match |
| New person assigned to 3 categories; appears in each assignee list | JTBD-02.3 → S-CONFIG | US-6.2 | "API supports adding and removing category-department and action-department associations"; "Viewing a department returns its associated categories" |
| All legacy staff accounts issue JWT with no password reset prompts | JTBD-03.1 → S-AUTH | US-4.1 | "System looks up `people` by `username` and verifies password against BCrypt hash"; migration preserves existing hashes |
| API client registered with hashed key; key shown once in plaintext | JTBD-03.2 → S-ADMIN | US-13.1 | "`api_key` is stored hashed (BCrypt or SHA-256 + salt); plain-text key is returned only at creation" ✅ exact match |
| Key rotation effective immediately without service restart | JTBD-03.2 → S-ADMIN | US-13.2 | "New key is effective for the next API request without requiring a server restart" ✅ exact match |
| Each scheduler job shows job name, start time, SUCCESS/FAILURE in docker logs | JTBD-03.3 → S-DEPLOY | US-16.3 | "Audit results are written to logs with timestamp, job name, and findings"; US-15.2: "Job execution is logged with timestamp, job name, and outcome" ✅ |
| Open311 integration tests fail fast on any response shape deviation | JTBD-03.3 → S-DEPLOY | US-2.4 + US-18.1 | US-2.4: "JSON and XML response shapes for the POST response are byte-compatible with legacy PHP output"; US-18.1: "XML CDATA handling, null field representation...match the legacy PHP output exactly" ✅ |
| POST /open311/requests response byte-compatible with legacy; no field deviations | JTBD-04.1 → S-API | US-2.4 | "JSON and XML response shapes for the POST response are byte-compatible with legacy PHP output" ✅ exact match |
| GET /open311/requests/{id} passes byte-level comparison against legacy fixture | JTBD-04.2 → S-API | US-2.6 | "GET /open311/requests/{service_request_id} returns a single-element JSON array (or XML `<service_requests>` with one child)"; US-18.1: byte-compatible XML |
| Existing API key from migrated clients table validates; request succeeds HTTP 200 | JTBD-04.3 → S-API | US-2.4 | "POST /open311/requests validates `api_key` against hashed `clients.api_key` using bcrypt comparison"; "Invalid or missing API key returns 403 API_KEY_INVALID" ✅ |

**Alignment Score:** 22/22 NaC statements verified against at least one explicit UserStory acceptance criterion. No invented NaC found.

---

## Validation Checklist

- [x] Every UserStory (US-0.1 through US-20.2, 63 total) appears in the Story Map Matrix
- [x] Every mapped story has a NaC derived from a specific JTBD outcome
- [x] NaC Derivation Table has full traceability chains (JTBD-ID → Journey Stage → NaC → Stories)
- [x] Three release planning groups defined (R1/R2/R3) with themes and story lists
- [x] Coverage analysis identifies no gaps in journey stage coverage
- [x] Coverage analysis identifies no orphan stories
- [x] No JTBD outcomes without derived NaC
- [x] Each release enables at least one complete journey (R1: JRN-01.1, JRN-04.1, JRN-04.2; R2: JRN-02.1, JRN-02.3, JRN-03.1, JRN-03.2, JRN-03.3; R3: JRN-01.3, JRN-02.2)
- [x] NaC-to-Acceptance Criteria mapping verifies alignment for all 22 NaC statements
- [x] No new stories created — only existing UserStories mapped
- [x] Cross-journey risk hotspots identified (JWT Auth, Open311 shapes, Category config, Scheduler jobs)

---

*STORY-MAP generated 2026-06-24 | uReport Modernization Project*
