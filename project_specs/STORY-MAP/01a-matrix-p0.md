
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

