# Requirements Traceability Matrix — uReport CRM Modernization

**Project:** UReport  
**Acronym:** UReport  
**Version:** 1.0  
**Date:** 2026-07-06  
**Status:** Active  
**Classification:** Internal — Engineering & Product  
**Depends On:** PRD-UReport.md v1.0, FRD-UReport.md v1.0, TechArch-UReport.md v1.0, UserStories-UReport.md v1.0

---

## 1. Overview

This Requirements Traceability Matrix (RTM) provides bidirectional traceability between all uReport CRM Modernization specification artifacts. It ensures that every product requirement defined in the PRD has a corresponding functional specification in the FRD, a technical implementation specification in the TechArch, and one or more user stories with acceptance criteria that together validate the requirement end-to-end.

The uReport CRM Modernization project replaces a legacy PHP/MySQL/Solr/Apache stack with a React + Java Spring Boot + PostgreSQL architecture while preserving 100% of existing features, API contracts, and data. This RTM spans 22 feature areas (F0–F21), 4 cross-cutting infrastructure concerns, 74 user stories, and derived test cases, providing a complete audit trail from business need to implementation specification.

Traceability in this document flows in four directions. Forward traceability maps PRD features → FRD functional requirements → TechArch specifications → User Stories, confirming that every product need has been fully designed and will be verified. Backward traceability maps User Stories → TechArch → FRD → PRD, confirming that no implementation work is undocumented or out of scope. Coverage traceability maps User Stories to test cases, confirming that every story will be validated before release. Change traceability records any future modifications to requirements or scope so that impact can be assessed across all linked artifacts.

All IDs in this document are extracted from the source specification documents and follow the conventions established in those documents: `F{n}` for PRD features, `REQ-FUNC-{nnn}` and `REQ-NFR-{nnn}` for FRD requirements, `SPEC-{nnn}` for TechArch specifications, `US-{n}.{m}` for user stories, and `TEST-{nnn}` for derived test cases.

---

## 2. Requirements Summary

### 2.1 PRD Feature Summary (F0–F21)

| Priority | Feature Count | Feature IDs |
|---|---|---|
| **P0 — Critical** | 12 | F0, F1, F2, F3, F4, F9, F11, F12, F17, F18, F19, F21 |
| **P1 — High** | 8 | F5, F6, F7, F8, F10, F13, F14, F20 |
| **P2 — Medium** | 2 | F15, F16 |
| **Total** | **22** | F0–F21 |

### 2.2 FRD Requirements by Category

**Functional Requirements (REQ-FUNC):**
- **API / External Contract (REQ-FUNC-001–006):** Open311/GeoReport v2 endpoints (frozen), content negotiation, API key validation
- **Case Management (REQ-FUNC-007–019):** Ticket lifecycle, creation, assignment, close/reopen, bulk operations, SLA tracking
- **Public Submission (REQ-FUNC-020–028):** Multi-step wizard, map pin-drop, photo upload, anonymous/identified submission, confirmation
- **Case List (REQ-FUNC-029–039):** Sortable/filterable data table, live search, filter chips, pagination, bookmarks, CSV export
- **Case Detail (REQ-FUNC-040–050):** Split-pane layout, inline editing, action log, response templates, media gallery, lightbox
- **Dashboard (REQ-FUNC-051–056):** Stat cards, recent feed, map widget, donut chart, quick-links
- **People Management (REQ-FUNC-057–063):** Person CRUD, contact records, role/department assignment, safety delete
- **Department Management (REQ-FUNC-064–069):** Department CRUD, action types, category associations, safety delete
- **Category Management (REQ-FUNC-070–080):** Category group CRUD, category CRUD, permission levels, SLA, auto-close, response templates
- **Action/Response Logging (REQ-FUNC-081–089):** System actions, manual actions, email notifications, response templates
- **Media Upload (REQ-FUNC-090–096):** Multi-file upload, validation, thumbnail, lightbox, delete
- **Full-Text Search (REQ-FUNC-097–103):** tsvector/tsquery, GIN index, ts_headline, combined search+filter, trigger maintenance
- **Authentication (REQ-FUNC-104–112):** CAS SSO, LDAP login, JWT issuance, session refresh, logout, account screen
- **Admin Panels (REQ-FUNC-113–120):** Substatus, issue type, response template, contact method CRUD
- **Client Management (REQ-FUNC-121–124):** Client CRUD, API key generation, key validation
- **Metrics/Reporting (REQ-FUNC-125–130):** Volume charts, resolution time, category/department breakdowns, CSV export
- **Geo-Clustering (REQ-FUNC-131–134):** Cluster data migration, map widget, zoom-based rendering, pin popover
- **Design System (REQ-FUNC-135–141):** Tailwind config, shadcn/ui, CSS tokens, dark mode, typography, grid, shadow
- **Navigation Shell (REQ-FUNC-142–147):** Navbar, sidebar, breadcrumbs, mobile drawer, skip links
- **Accessibility (REQ-FUNC-148–153):** WCAG 2.1 AA, Section 508, ARIA, keyboard nav, responsive breakpoints
- **OpenAPI Documentation (REQ-FUNC-154–157):** springdoc integration, all controllers annotated, Swagger UI, JWT documented
- **Database Migration (REQ-FUNC-158–163):** Flyway scripts, 18-table schema, type mappings, data migration, validation

**Non-Functional Requirements (REQ-NFR):**
- **Performance (REQ-NFR-001–005):** Case list ≤2s, search ≤500ms P95, Open311 ≤300ms P95, dashboard ≤2s
- **Accessibility (REQ-NFR-006–007):** WCAG 2.1 AA, Section 508
- **Animation (REQ-NFR-008):** ≤300ms; prefers-reduced-motion disables all motion
- **Reliability (REQ-NFR-009):** 100% Open311 contract preservation
- **Data Integrity (REQ-NFR-010):** 0 rows lost; 0 columns dropped
- **Security (REQ-NFR-011–014):** JWT expiry configurable, API key auth, HTTPS enforced, SameSite cookies
- **Scalability (REQ-NFR-015):** ≥50 concurrent staff users (single-city scale)
- **Maintainability (REQ-NFR-016–017):** 100% endpoint OpenAPI coverage, all schema changes via Flyway
- **Browser/Device (REQ-NFR-018–019):** Latest 2 versions of Chrome/Firefox/Safari/Edge; 375px minimum viewport

### 2.3 TechArch Specification Summary (SPEC)

| SPEC Range | Domain |
|---|---|
| SPEC-001–005 | Three-Tier Architecture, OCI Container Topology (Dockerfiles), JWT Security Model |
| SPEC-006–010 | React SPA Component Architecture, State Management, Animation System |
| SPEC-011–015 | Spring Boot Layer Architecture (Controller/Service/Repository/Entity/DTO/Mapper) |
| SPEC-016–020 | PostgreSQL Data Model, 18-Table Schema, DDL (Flyway V1) |
| SPEC-021–023 | Full-Text Search (tsvector/tsquery, GIN index, trigger — Flyway V2) |
| SPEC-024–028 | Open311 Controller, Content Negotiation, GeoReport v2 Serialization |
| SPEC-029–033 | Internal CRM API Endpoints, Request/Response DTOs |
| SPEC-034–038 | Spring Security (JWT Filter, CAS Provider, LDAP Provider) |
| SPEC-039–042 | Media Service (file storage, MIME validation, thumbnail generation) |
| SPEC-043–046 | Notification Service (SMTP, sentNotifications, email templates) |
| SPEC-047–050 | MapStruct Mappers, DTO design patterns |
| SPEC-051–053 | OpenAPI/Swagger integration, springdoc annotations |
| SPEC-054–056 | MySQL→PostgreSQL column mapping, type mapping conventions |

### 2.4 User Story Summary

| Priority | Story Count | Epic Range |
|---|---|---|
| **P0 — Critical** | 50 | Epics 0–4, 9, 11–12, 17–21 |
| **P1 — High** | 20 | Epics 5–8, 10, 13–14, 20 |
| **P2 — Medium** | 4 | Epics 15–16 |
| **Total** | **74** | US-0.1 – US-21.2 |

---

## 3. Traceability Matrix

### 3.1 PRD Features → FRD Requirements → TechArch Specs → User Stories

| PRD Feature | Priority | FRD Requirements | TechArch Specs | User Stories |
|---|---|---|---|---|
| **F0: Open311 / GeoReport v2 API** | P0 | REQ-FUNC-001: GET /services (list categories)<br>REQ-FUNC-002: GET /requests (filtered list)<br>REQ-FUNC-003: POST /requests (submit request)<br>REQ-FUNC-004: GET /requests/{id} (single request)<br>REQ-FUNC-005: Content negotiation (JSON/XML/HTML)<br>REQ-FUNC-006: API key validation and OBSOLETE_API_KEYS | SPEC-024: Open311ServiceController<br>SPEC-025: Open311RequestController<br>SPEC-026: GeoReport v2 JSON serialization<br>SPEC-027: XML serialization<br>SPEC-028: Content negotiation logic<br>SPEC-034: Open311ApiKeyFilter | US-0.1: List Available Services<br>US-0.2: Retrieve Service Requests with Filters<br>US-0.3: Submit New Service Request via Open311<br>US-0.4: Retrieve Single Service Request by ID |
| **F1: Ticket / Case Lifecycle Management** | P0 | REQ-FUNC-007: Create ticket (staff manual entry)<br>REQ-FUNC-008: Assign ticket to person/department<br>REQ-FUNC-009: Update ticket fields<br>REQ-FUNC-010: Close ticket with substatus<br>REQ-FUNC-011: Reopen closed ticket<br>REQ-FUNC-012: Mark as duplicate<br>REQ-FUNC-013: Bulk operations (assign/close/status)<br>REQ-FUNC-014: SLA tracking and overdue flag | SPEC-011: TicketController<br>SPEC-012: TicketService (business logic)<br>SPEC-013: TicketRepository (JPA + FTS)<br>SPEC-016: tickets table DDL<br>SPEC-017: ticket_history table DDL | US-1.1: Create a New Ticket from a Phone Call<br>US-1.2: Close a Ticket with a Substatus<br>US-1.3: Reopen a Closed Ticket<br>US-1.4: Assign a Ticket to a Staff Person<br>US-1.5: Perform Bulk Operations on Multiple Tickets |
| **F2: Public Case Submission Form** | P0 | REQ-FUNC-020: Multi-step wizard (6 steps)<br>REQ-FUNC-021: Contact info step (optional)<br>REQ-FUNC-022: Category selection drill-down<br>REQ-FUNC-023: Location step (address autocomplete + pin-drop)<br>REQ-FUNC-024: Description + photo upload step<br>REQ-FUNC-025: Review step<br>REQ-FUNC-026: Confirmation screen with case ID<br>REQ-FUNC-027: Anonymous and identified submission<br>REQ-FUNC-028: Geocoding API integration | SPEC-006: SubmissionWizard.tsx (Framer Motion)<br>SPEC-007: LocationPicker.tsx (Mapbox/Leaflet)<br>SPEC-029: POST /api/tickets/public endpoint<br>SPEC-039: MediaService (file upload)<br>SPEC-043: NotificationService (confirmation email) | US-2.1: Complete Multi-Step Submission Wizard on Mobile<br>US-2.2: Drop a Map Pin to Identify Issue Location<br>US-2.3: Upload a Photo from Phone Camera During Submission<br>US-2.4: Receive a Confirmation Screen with Case ID |
| **F3: Case List with Search, Filtering, and Sorting** | P0 | REQ-FUNC-029: Sortable column headers<br>REQ-FUNC-030: Multi-column filter panel<br>REQ-FUNC-031: Status badge pills (color-coded)<br>REQ-FUNC-032: Live search with 300ms debounce<br>REQ-FUNC-033: Highlighted keyword matches (ts_headline)<br>REQ-FUNC-034: Filter chips with remove buttons<br>REQ-FUNC-035: Bulk selection and bulk actions<br>REQ-FUNC-036: Skeleton loading<br>REQ-FUNC-037: Empty state<br>REQ-FUNC-038: Pagination (10/25/50/100)<br>REQ-FUNC-039: Saved search / bookmark | SPEC-006: CaseTable.tsx, FilterPanel.tsx, FilterChips.tsx<br>SPEC-011: TicketController (GET /api/tickets)<br>SPEC-012: SearchService (tsvector + filter combine)<br>SPEC-013: TicketRepository (@Query FTS)<br>SPEC-021: search_vector column<br>SPEC-022: GIN index | US-3.1: Search for a Case Using Live Full-Text Search<br>US-3.2: Filter the Case List by Multiple Criteria<br>US-3.3: Sort the Case List by Column<br>US-3.4: Paginate Through the Case List<br>US-3.5: Save a Search as a Bookmark for Quick Recall<br>US-3.6: Export Case List Results to CSV |
| **F4: Case Detail View** | P0 | REQ-FUNC-040: Split-pane layout (metadata + timeline)<br>REQ-FUNC-041: Case metadata panel fields<br>REQ-FUNC-042: Interactive map pin for location<br>REQ-FUNC-043: Inline status transition controls<br>REQ-FUNC-044: Inline field editing (optimistic UI)<br>REQ-FUNC-045: Action log entry form<br>REQ-FUNC-046: Response template selector<br>REQ-FUNC-047: Media gallery with lightbox<br>REQ-FUNC-048: Action/history timeline (chronological)<br>REQ-FUNC-049: Breadcrumb navigation<br>REQ-FUNC-050: Parallel data requests on load | SPEC-006: CaseDetail.tsx, MetadataPanel.tsx, TimelinePanel.tsx<br>SPEC-011: TicketController (PATCH, history, media)<br>SPEC-012: TicketService<br>SPEC-017: ticket_history DDL<br>SPEC-018: media DDL | US-4.1: View Complete Case Metadata and History on One Screen<br>US-4.2: Edit Case Fields Inline Without Leaving the Screen<br>US-4.3: Log a Response and Optionally Notify the Reporter<br>US-4.4: Use a Response Template to Pre-Fill Action Notes |
| **F5: Dashboard** | P1 | REQ-FUNC-051: Stat cards (open, opened today, closed today, overdue)<br>REQ-FUNC-052: Recent cases feed (last 10 by enteredDate DESC)<br>REQ-FUNC-053: Map widget (clustered open case pins)<br>REQ-FUNC-054: Status donut chart (by status/category/dept)<br>REQ-FUNC-055: Quick-link buttons<br>REQ-FUNC-056: Responsive grid layout | SPEC-006: StatCard.tsx, RecentCasesFeed.tsx, StatusDonut.tsx<br>SPEC-007: MapWidget.tsx (Mapbox/Leaflet)<br>SPEC-011: DashboardController (GET /api/dashboard/stats, /chart)<br>SPEC-012: DashboardService (aggregations)<br>SPEC-016: tickets + categories SLA join | US-5.1: View Operational KPIs on the Dashboard<br>US-5.2: Review the Recent Cases Feed on the Dashboard<br>US-5.3: View Open Cases on the Dashboard Map Widget<br>US-5.4: Use Quick-Link Buttons to Navigate from the Dashboard |
| **F6: People Management** | P1 | REQ-FUNC-057: List people (search + role filter)<br>REQ-FUNC-058: Create person record<br>REQ-FUNC-059: Edit person + contact records<br>REQ-FUNC-060: Delete person (safety check)<br>REQ-FUNC-061: Multiple email management (notification flag)<br>REQ-FUNC-062: Multiple phone / address management<br>REQ-FUNC-063: Role and department assignment | SPEC-011: PeopleController<br>SPEC-012: PeopleService<br>SPEC-013: PeopleRepository, PeopleEmailsRepository<br>SPEC-016: people, people_emails, people_phones, people_addresses DDL | US-6.1: List and Search People<br>US-6.2: Create a New Staff Person Record<br>US-6.3: Edit a Person and Manage Their Contact Records<br>US-6.4: Delete a Person with Safety Check |
| **F7: Department Management** | P1 | REQ-FUNC-064: List departments<br>REQ-FUNC-065: Create department<br>REQ-FUNC-066: Edit department (default person, action types)<br>REQ-FUNC-067: Delete department (safety check)<br>REQ-FUNC-068: Manage department_actions (join table)<br>REQ-FUNC-069: Manage department_categories (join table) | SPEC-011: DepartmentController<br>SPEC-012: DepartmentService<br>SPEC-013: DepartmentRepository<br>SPEC-016: departments, department_actions, department_categories DDL | US-7.1: List, Create, and Edit Departments<br>US-7.2: Delete a Department with Safety Check |
| **F8: Category and Category Group Management** | P1 | REQ-FUNC-070: List / create / edit / delete category groups<br>REQ-FUNC-071: List / create / edit / delete categories<br>REQ-FUNC-072: Department assignment on category<br>REQ-FUNC-073: Display and posting permission levels<br>REQ-FUNC-074: SLA days configuration<br>REQ-FUNC-075: Auto-close substatus configuration<br>REQ-FUNC-076: Active / featured flags<br>REQ-FUNC-077: Manage category_action_responses (response templates)<br>REQ-FUNC-078: Safety delete (blocked if tickets reference category)<br>REQ-FUNC-079: Category selector for public form and case management<br>REQ-FUNC-080: Open311 group field from category_groups.name | SPEC-011: CategoryController, CategoryGroupController<br>SPEC-012: CategoryService<br>SPEC-013: CategoryRepository, CategoryGroupRepository<br>SPEC-016: categories, category_groups, category_action_responses DDL | US-8.1: Create a New Category Group<br>US-8.2: Create and Fully Configure a New Category<br>US-8.3: Delete a Category with Safety Check |
| **F9: Action / Response Logging and Email Notifications** | P0 | REQ-FUNC-081: System actions auto-created on ticket events<br>REQ-FUNC-082: Manual action logging (department actions)<br>REQ-FUNC-083: Action type filtering by department_actions<br>REQ-FUNC-084: Email notification toggle (reporter / assignee)<br>REQ-FUNC-085: SMTP email delivery<br>REQ-FUNC-086: sentNotifications JSON recording<br>REQ-FUNC-087: Non-fatal email delivery failure<br>REQ-FUNC-088: Response template pre-fill from category_action_responses<br>REQ-FUNC-089: Template variable rendering (server-side) | SPEC-011: TicketHistoryController<br>SPEC-012: TicketService, NotificationService<br>SPEC-013: TicketHistoryRepository, ActionRepository<br>SPEC-016: ticket_history, actions DDL<br>SPEC-043: NotificationService (SMTP, JavaMailSender)<br>SPEC-044: sentNotifications serialization | US-9.1: Automatic System Action Created on Ticket Events<br>US-9.2: Send Email Notification to Reporter on Action<br>US-9.3: Load Response Template into Action Notes |
| **F10: Media / Photo Attachment Upload** | P1 | REQ-FUNC-090: Multi-file upload (drag-and-drop + native picker)<br>REQ-FUNC-091: Thumbnail preview during upload<br>REQ-FUNC-092: MIME validation (magic bytes: JPEG/PNG/GIF)<br>REQ-FUNC-093: File size limit (10 MB per file, max 10 files)<br>REQ-FUNC-094: Attach media to ticket and to action history entries<br>REQ-FUNC-095: Lightbox / full-size viewer (prev/next navigation)<br>REQ-FUNC-096: Delete media with confirmation | SPEC-011: TicketMediaController, MediaController<br>SPEC-012: MediaService<br>SPEC-013: MediaRepository<br>SPEC-018: media table DDL<br>SPEC-039: File storage (/var/ureport/media/{ticket_id}/)<br>SPEC-040: Thumbnail generation<br>SPEC-041: MIME validation by magic bytes<br>SPEC-042: Disk write error handling | US-10.1: Attach Photos to a Ticket at Creation (Staff)<br>US-10.2: Attach a Photo to an Existing Ticket from the Field<br>US-10.3: View Photos in the Case Detail Lightbox<br>US-10.4: Delete an Attached Photo with Confirmation |
| **F11: PostgreSQL Full-Text Search (Solr Replacement)** | P0 | REQ-FUNC-097: tsvector search_vector column on tickets<br>REQ-FUNC-098: Weighted fields (ID=A, description/location=B, names/category=C)<br>REQ-FUNC-099: GIN index (idx_tickets_search_vector)<br>REQ-FUNC-100: plainto_tsquery search via GET /api/tickets?q=<br>REQ-FUNC-101: Relevance ranking (ts_rank_cd DESC)<br>REQ-FUNC-102: ts_headline snippet (MaxWords=30, mark tags)<br>REQ-FUNC-103: BEFORE INSERT/UPDATE trigger maintaining search_vector<br>REQ-FUNC-104 (search+filter): Combined FTS and filter with AND semantics | SPEC-012: SearchService (tsvector queries, ts_headline)<br>SPEC-013: TicketRepository (@Query FTS)<br>SPEC-021: search_vector column (Flyway V2)<br>SPEC-022: GIN index (idx_tickets_search_vector)<br>SPEC-023: tickets_search_vector_trigger (PL/pgSQL) | US-11.1: Search Tickets with PostgreSQL Full-Text Search<br>US-11.2: See Highlighted Keyword Matches in Search Results<br>US-11.3: Search and Filter Can Be Combined<br>US-11.4: Search Vector Auto-Maintained by Database Trigger |
| **F12: Authentication — LDAP and CAS** | P0 | REQ-FUNC-104: CAS SSO authentication flow<br>REQ-FUNC-105: LDAP authentication (POST /api/auth/ldap)<br>REQ-FUNC-106: JWT issuance (httpOnly, SameSite=Strict cookie)<br>REQ-FUNC-107: JWT validation on every protected endpoint<br>REQ-FUNC-108: Session refresh (POST /api/auth/refresh)<br>REQ-FUNC-109: Logout (POST /api/auth/logout) + CAS single sign-out<br>REQ-FUNC-110: Branded login screen (city logo, spinner, error state)<br>REQ-FUNC-111: Account screen (view/edit own profile)<br>REQ-FUNC-112: returnTo parameter for post-login redirect | SPEC-034: Spring Security filter chain (SecurityConfig.java)<br>SPEC-035: JwtAuthFilter.java (OncePerRequestFilter)<br>SPEC-036: JwtService.java (JJWT sign/parse/validate)<br>SPEC-037: LdapConfig.java / CAS provider (CasConfig.java)<br>SPEC-038: AuthController, CasCallbackController, TokenRefreshController | US-12.1: Log In via CAS Single Sign-On<br>US-12.2: Log In via LDAP Credentials<br>US-12.3: Session Expiry and Automatic Token Refresh<br>US-12.4: Sign Out and Invalidate the Session<br>US-12.5: View and Update Own Profile on the Account Screen |
| **F13: Admin Panels — Substatus, Issue Types, Response Templates, Contact Methods** | P1 | REQ-FUNC-113: Substatus CRUD (name, status, isDefault)<br>REQ-FUNC-114: Issue type CRUD<br>REQ-FUNC-115: Response template CRUD (global, body text)<br>REQ-FUNC-116: Contact method CRUD<br>REQ-FUNC-117: Inline toast notifications on every save<br>REQ-FUNC-118: Confirmation dialogs before delete<br>REQ-FUNC-119: Lookup values appear in ticket dropdowns<br>REQ-FUNC-120: Category-level templates managed within category edit (F8) | SPEC-011: LookupController (/api/substatus, /api/issue-types, /api/contact-methods)<br>SPEC-012: Service layer for lookup tables<br>SPEC-013: SubstatusRepository, IssueTypeRepository, ContactMethodRepository<br>SPEC-016: substatus, issue_types, contact_methods DDL | US-13.1: Manage Substatus Values<br>US-13.2: Manage Issue Types<br>US-13.3: Manage Response Templates<br>US-13.4: Manage Contact Methods |
| **F14: Client / API Key Management** | P1 | REQ-FUNC-121: Client CRUD (name, URL, api_key, contact person, contact method)<br>REQ-FUNC-122: Auto-generated UUID API key on creation<br>REQ-FUNC-123: Key shown once on creation; masked thereafter<br>REQ-FUNC-124: API key validated by Open311ApiKeyFilter for POST /open311/v2/requests | SPEC-011: ClientController (/api/clients)<br>SPEC-013: ClientRepository<br>SPEC-016: clients DDL<br>SPEC-034: Open311ApiKeyFilter.java | US-14.1: Register a New Open311 API Client<br>US-14.2: Edit and Delete an Open311 Client Record |
| **F15: Metrics and Reporting** | P2 | REQ-FUNC-125: Case volume over time (daily/weekly/monthly)<br>REQ-FUNC-126: Average resolution time by category and department<br>REQ-FUNC-127: Open vs. closed ratio<br>REQ-FUNC-128: Cases by category/department/assignee breakdown<br>REQ-FUNC-129: Date range filter across all reports<br>REQ-FUNC-130: Export to CSV | SPEC-011: DashboardController (/api/dashboard/*)<br>SPEC-012: DashboardService (aggregation queries)<br>SPEC-016: tickets + categories + departments schema | US-15.1: View Case Volume Over Time<br>US-15.2: View Resolution Time and Case Breakdown Reports |
| **F16: Geo-Clustering for Map Views** | P2 | REQ-FUNC-131: Pre-computed geoclusters data migrated to PostgreSQL<br>REQ-FUNC-132: Map widget renders clustered pins at low zoom<br>REQ-FUNC-133: Individual pins at high zoom from ticket_geodata<br>REQ-FUNC-134: Pin click → case detail popover (ticket ID, category, status, link) | SPEC-011: GeoclusterController (/api/geoclusters)<br>SPEC-012: GeoclusterService<br>SPEC-013: GeoclusterRepository, TicketGeodataRepository<br>SPEC-016: geoclusters, ticket_geodata DDL<br>SPEC-007: MapWidget.tsx (Mapbox/Leaflet) | US-16.1: View Clustered Ticket Pins on the Map<br>US-16.2: View a Single Ticket Pin on Case Detail Map |
| **F17: Design System and UI Framework** | P0 | REQ-FUNC-135: Tailwind CSS extended config (colors, spacing, radius tokens)<br>REQ-FUNC-136: shadcn/ui components customized to city brand<br>REQ-FUNC-137: CSS custom property design tokens (light/dark)<br>REQ-FUNC-138: Dark mode (prefers-color-scheme + manual toggle + localStorage)<br>REQ-FUNC-139: Typography (Inter + JetBrains Mono)<br>REQ-FUNC-140: 4px base grid<br>REQ-FUNC-141: Framer Motion animation system (≤300ms, prefers-reduced-motion) | SPEC-006: globals.css, tokens.css<br>SPEC-008: lib/animations.ts (Framer Motion variants)<br>SPEC-009: lib/motion.ts (useReducedMotion hook)<br>SPEC-010: shadcn/ui component layer (src/components/ui/) | US-17.1: Use a Consistent, Branded Design System Across All Screens<br>US-17.2: Toggle Dark Mode and Have the Preference Persisted<br>US-17.3: Experience Smooth Animations Respecting Motion Preferences |
| **F18: Navigation Shell** | P0 | REQ-FUNC-142: Persistent top navbar (logo, search trigger, user menu, dark toggle)<br>REQ-FUNC-143: Collapsible left sidebar (admin nav groups, localStorage persistence)<br>REQ-FUNC-144: Contextual breadcrumb trail (route-aware, navigable links)<br>REQ-FUNC-145: Mobile hamburger drawer (Sheet, ≤768px)<br>REQ-FUNC-146: Active route highlighted in sidebar<br>REQ-FUNC-147: Skip-to-main-content link | SPEC-006: Navbar.tsx, Sidebar.tsx, Breadcrumb.tsx, MobileDrawer.tsx<br>SPEC-010: Sheet.tsx (shadcn/ui) | US-18.1: Navigate the Application Using the Persistent Navbar and Sidebar<br>US-18.2: Navigate the Application on a Mobile Device via the Hamburger Drawer<br>US-18.3: Use Keyboard Navigation and Skip Links for Accessibility |
| **F19: Accessibility and Responsive Design** | P0 | REQ-FUNC-148: WCAG 2.1 AA compliance (≥4.5:1 contrast normal, ≥3:1 large)<br>REQ-FUNC-149: Section 508 — all interactive elements keyboard-accessible<br>REQ-FUNC-150: ARIA roles, labels, live regions on dynamic content<br>REQ-FUNC-151: Screen reader compatibility (alt text, table headers, form labels)<br>REQ-FUNC-152: Responsive layout at 375px, 768px, 1280px+<br>REQ-FUNC-153: Touch targets ≥44px; focus trap in modals | SPEC-006: All component accessibility props<br>SPEC-009: ARIA live region patterns<br>SPEC-010: Dialog.tsx (focus trap), Badge.tsx (accessible labels) | US-19.1: Access All Features Using Only a Keyboard<br>US-19.2: Use a Screen Reader to Operate the Application<br>US-19.3: Use the Application Comfortably on a Mobile Device<br>US-19.4: Read Content with Sufficient Color Contrast in Both Light and Dark Mode |
| **F20: OpenAPI / Swagger API Documentation** | P1 | REQ-FUNC-154: springdoc-openapi integrated in Spring Boot<br>REQ-FUNC-155: All controllers annotated (@Operation, @ApiResponse, @Schema)<br>REQ-FUNC-156: OpenAPI spec at /v3/api-docs; Swagger UI at /swagger-ui.html<br>REQ-FUNC-157: JWT Bearer token flow documented; Open311 api_key flow documented | SPEC-011: OpenApiConfig.java<br>SPEC-051: springdoc-openapi dependency and config<br>SPEC-052: Controller annotation patterns<br>SPEC-053: Nginx proxy for /swagger-ui.html and /v3/api-docs | US-20.1: Explore All API Endpoints via Swagger UI<br>US-20.2: Test API Calls Directly from Swagger UI |
| **F21: Database Migration — MySQL to PostgreSQL (Flyway)** | P0 | REQ-FUNC-158: Flyway scripts in src/main/resources/db/migration/<br>REQ-FUNC-159: V1__initial_schema.sql recreates all 18 tables<br>REQ-FUNC-160: V2__search_vector.sql adds tsvector column + GIN index<br>REQ-FUNC-161: All FK constraints, indexes, sequences recreated<br>REQ-FUNC-162: One-time data migration (mysqldump → pg_restore pipeline)<br>REQ-FUNC-163: Migration validation (row count, data type, FK constraint verification) | SPEC-016: Full PostgreSQL DDL (Flyway V1)<br>SPEC-021: search_vector DDL (Flyway V2)<br>SPEC-054: MySQL→PostgreSQL column name mapping<br>SPEC-055: MySQL→PostgreSQL type mapping conventions<br>SPEC-056: FlywayConfig.java (baseline, repair settings) | US-21.1: Migrate the Full MySQL Schema to PostgreSQL via Flyway<br>US-21.2: Migrate All Production Data from MySQL to PostgreSQL with Zero Loss |

---

## 4. Requirements Detail

### 4.1 P0 Features — Critical Requirements

**F0: Open311 / GeoReport v2 API (Frozen Contract)**
- The four GeoReport v2 endpoints (GET /services, GET /requests, POST /requests, GET /requests/{id}) are a hard frozen external contract.
- Content negotiation must support JSON (default), XML, and HTML based on URL suffix, `format` query param, or `Accept` header.
- OBSOLETE_API_KEYS configuration triggers mobile shutdown notice response instead of real service list.
- API key validation is enforced for all write operations via `Open311ApiKeyFilter`.
- All response field names must be byte-level compatible with the existing PHP implementation.

**F1: Ticket / Case Lifecycle Management**
- Ticket creation initializes `status = 'open'`, creates auto-generated "open" action history entry.
- Assignment creates "assignment" history entry and sends email to new assignee (if notification configured).
- Closing requires mandatory substatus selection; Duplicate substatus requires parent ticket ID.
- Reopening clears `closedDate` and `substatus_id`, creates "open" (reopen) history entry.
- Bulk operations apply action to each ticket individually with separate history records.
- SLA overdue = open tickets where `NOW() > enteredDate + categories.slaDays`.

**F2: Public Case Submission Form**
- Six-step wizard: Contact Info (optional) → Category → Location (map pin-drop) → Description/Photos → Review → Confirmation.
- Framer Motion step transitions ≤300ms; `prefers-reduced-motion` disables all transitions.
- Map defaults to city center at zoom 13; supports Mapbox Geocoding API with Nominatim fallback.
- Photo files held in browser memory until submit; upload progress shown per file.
- Confirmation screen displays generated case ID and provides Open311 status check link.

**F3: Case List with Search, Filtering, and Sorting**
- 300ms debounce on search input; results include `searchSnippet` (ts_headline) for highlighting.
- Filter state encoded in URL query string for bookmarkable/shareable filtered views.
- Status badges: open=blue, closed-resolved=green, closed-duplicate=gray, closed-bogus=red, closed-other=purple.
- SLA overdue badge displayed on case list rows (elapsed days shown without opening record).
- Pagination page sizes: 10, 25, 50, 100 (invalid values default to 10).

**F4: Case Detail View**
- Parallel data requests on load: ticket metadata, action history, and media fetched simultaneously.
- Inline editing uses optimistic UI (immediate field update, revert on API error).
- Closed tickets are read-only for `staff` role; `admin` role can edit closed ticket fields.
- Email notification failure is non-fatal: action saved, toast warns user.
- Action type dropdown filtered to `department_actions` for current ticket's department (admin sees all).

**F9: Action / Response Logging and Email Notifications**
- System action types (open, assignment, closed, changeCategory, changeLocation, duplicate, upload_media, update, comment) are auto-created; not selectable in log form dropdown.
- Reply-to address resolution: `category_action_responses.replyEmail` → `actions.replyEmail` → system default.
- `sentNotifications` field records all email addresses actually notified as JSON array.
- Public submission confirmation email sent within 2 minutes; subject: "[uReport] Your report has been received — Case #{id}".

**F11: PostgreSQL Full-Text Search (Solr Replacement)**
- `search_vector` tsvector column maintained by BEFORE INSERT/UPDATE trigger on `tickets`.
- Weight assignments: ticket ID (A), description + location (B), reporter names + category name (C).
- Results ordered by `ts_rank_cd(search_vector, query) DESC`, then `entered_date DESC`.
- `ts_headline` config: MaxWords=30, MinWords=10, StartSel=`<mark>`, StopSel=`</mark>`.
- Search + filter combined with AND semantics; saving a bookmark preserves both.

**F12: Authentication — LDAP and CAS**
- JWT stored in httpOnly, SameSite=Strict cookie named `auth_token` (XSS mitigation).
- CAS callback: Spring Security validates service ticket; creates minimal `people` record if username not found.
- JWT payload: `{sub, role, personId, exp}`; never returned in response body (cookie-only).
- Refresh: React calls POST /api/auth/refresh 5 minutes before expiry; 401 on failure → redirect to login.
- Logout clears cookie (Set-Cookie: expires=past) and redirects to CAS logout URL for single sign-out.

**F17: Design System and UI Framework**
- All Framer Motion variants declared in `lib/animations.ts`; `useReducedMotion()` hook disables globally.
- CSS custom properties (`--color-*`, `--shadow-*`) swapped via `.dark` class on root element.
- Dark mode preference persisted to `localStorage`; also activated by `prefers-color-scheme: dark`.
- 3-tier shadow system: low (cards), medium (dropdowns), high (modals).

**F18: Navigation Shell**
- Sidebar collapse state persisted to `localStorage`.
- Mobile drawer (≤768px): Sheet component, all touch targets ≥44px.
- Skip-to-main-content link is first focusable element; visible only on keyboard focus.
- All navigation is React Router client-side; no full-page reloads.

**F19: Accessibility and Responsive Design**
- axe-core automated scan must report 0 critical or serious violations in both light and dark mode.
- Status badge pills use accessible text labels (not color-only communication).
- Toast notifications announced via `aria-live="polite"` live region.
- Modal dialogs use focus trap; closing returns focus to trigger element.
- Skeleton-to-content transitions announced via `aria-busy` on loading container.

**F21: Database Migration — MySQL to PostgreSQL (Flyway)**
- `V1__initial_schema.sql`: all 18 tables, foreign keys, indexes, sequences.
- `V2__search_vector.sql`: additive — adds `search_vector` column and GIN index only, no existing columns modified.
- Type mappings: TINYINT(1) → BOOLEAN, INT UNSIGNED → INTEGER, FLOAT(17,14) → DOUBLE PRECISION, DATETIME → TIMESTAMPTZ, ENUM → VARCHAR + CHECK constraint.
- Column renames: camelCase (MySQL) → snake_case (PostgreSQL) per §3.4 mapping table in TechArch.
- Migration validation: row count equality across all 18 tables; 0 FK violations in PostgreSQL.

### 4.2 P1 Features — High Requirements

**F5: Dashboard** — Stat cards with department-scoped counts for `staff` role; system-wide for `admin`. All widgets within ≤2s. Error states show "—" with retry.

**F6: People Management** — At least one of firstname, lastname, or organization required. Delete blocked (409) if person referenced on any ticket. Only `admin` can set role to `admin` or `staff`.

**F7: Department Management** — Delete blocked (409) if any `categories.department_id` references the department. `department_actions` rows cascade-deleted on department delete.

**F8: Category and Category Group Management** — `postingPermissionLevel` must be ≥ permissive than `displayPermissionLevel`. `autoCloseSubstatus_id` required when `autoCloseIsActive = true`. Category delete blocked (409) if tickets reference it.

**F10: Media / Photo Attachment Upload** — MIME validation by magic bytes (not just extension). `internalFilename` is UUID + extension. Files stored at `{mediaRoot}/{ticket_id}/{internalFilename}`. "upload_media" system action created for each upload.

**F13: Admin Panels** — Global response templates managed here; category-specific templates managed within category edit (F8). All lookups propagate to dropdowns throughout ticket management screens.

**F14: Client / API Key Management** — Generated API key displayed once (with "Shown only once — copy now" label and clipboard copy button). Subsequent views mask or show truncated prefix only. Key validated in-memory by `Open311ApiKeyFilter` without service restart.

**F20: OpenAPI / Swagger Documentation** — 100% controller method coverage required. Open311 endpoints documented with GeoReport v2 field descriptions. Spec exportable as JSON/YAML.

### 4.3 P2 Features — Medium Requirements

**F15: Metrics and Reporting** — Calculated fields must match PHP implementation exactly (no regression in numbers). Metrics page and Reports page are distinct routes (preserving existing PHP route structure).

**F16: Geo-Clustering** — `geoclusters` and `ticket_geodata` data migrated from MySQL with zero data loss. Both Mapbox GL JS and Leaflet render cluster data correctly. Single-ticket pin on case detail shows "Location not set" placeholder when lat/lon is null.

---

## 5. Test Case Coverage Matrix

### 5.1 Coverage by Feature

| Feature | User Stories | Test Cases | Coverage |
|---|---|---|---|
| F0: Open311 API | US-0.1, US-0.2, US-0.3, US-0.4 | TEST-001–012 | 100% |
| F1: Ticket Lifecycle | US-1.1, US-1.2, US-1.3, US-1.4, US-1.5 | TEST-013–027 | 100% |
| F2: Public Submission Form | US-2.1, US-2.2, US-2.3, US-2.4 | TEST-028–039 | 100% |
| F3: Case List | US-3.1, US-3.2, US-3.3, US-3.4, US-3.5, US-3.6 | TEST-040–055 | 100% |
| F4: Case Detail View | US-4.1, US-4.2, US-4.3, US-4.4 | TEST-056–067 | 100% |
| F5: Dashboard | US-5.1, US-5.2, US-5.3, US-5.4 | TEST-068–077 | 100% |
| F6: People Management | US-6.1, US-6.2, US-6.3, US-6.4 | TEST-078–087 | 100% |
| F7: Department Management | US-7.1, US-7.2 | TEST-088–093 | 100% |
| F8: Category Management | US-8.1, US-8.2, US-8.3 | TEST-094–103 | 100% |
| F9: Action Logging + Email | US-9.1, US-9.2, US-9.3 | TEST-104–113 | 100% |
| F10: Media Upload | US-10.1, US-10.2, US-10.3, US-10.4 | TEST-114–123 | 100% |
| F11: Full-Text Search | US-11.1, US-11.2, US-11.3, US-11.4 | TEST-124–133 | 100% |
| F12: Authentication | US-12.1, US-12.2, US-12.3, US-12.4, US-12.5 | TEST-134–148 | 100% |
| F13: Admin Panels | US-13.1, US-13.2, US-13.3, US-13.4 | TEST-149–160 | 100% |
| F14: Client / API Key | US-14.1, US-14.2 | TEST-161–166 | 100% |
| F15: Metrics/Reporting | US-15.1, US-15.2 | TEST-167–172 | 100% |
| F16: Geo-Clustering | US-16.1, US-16.2 | TEST-173–178 | 100% |
| F17: Design System | US-17.1, US-17.2, US-17.3 | TEST-179–187 | 100% |
| F18: Navigation Shell | US-18.1, US-18.2, US-18.3 | TEST-188–196 | 100% |
| F19: Accessibility | US-19.1, US-19.2, US-19.3, US-19.4 | TEST-197–208 | 100% |
| F20: OpenAPI Docs | US-20.1, US-20.2 | TEST-209–213 | 100% |
| F21: DB Migration | US-21.1, US-21.2 | TEST-214–220 | 100% |

### 5.2 Derived Test Cases

| Test ID | Story Ref | Test Scenario | Test Type | Pass Criteria |
|---|---|---|---|---|
| TEST-001 | US-0.1 | GET /open311/v2/services returns JSON array of active categories | API Integration | All 7 GeoReport v2 fields present; HTTP 200 |
| TEST-002 | US-0.1 | GET /open311/v2/services?format=xml returns GeoReport v2 XML | API Integration | Valid XML `<services>` document; field names match spec |
| TEST-003 | US-0.1 | OBSOLETE api_key returns mobile shutdown notice | API Integration | Shutdown category list returned; HTTP 200 |
| TEST-004 | US-0.2 | GET /open311/v2/requests with status + service_code filter | API Integration | Filtered results; all GeoReport v2 service request fields present |
| TEST-005 | US-0.2 | Malformed ISO 8601 date parameter returns HTTP 400 | API Negative | HTTP 400 with errors array |
| TEST-006 | US-0.2 | Unknown service_code returns HTTP 404 | API Negative | HTTP 404 with errors array |
| TEST-007 | US-0.3 | POST /open311/v2/requests with valid api_key creates ticket | API Integration | HTTP 200; service_request_id in response |
| TEST-008 | US-0.3 | POST /open311/v2/requests with missing api_key returns HTTP 403 | API Negative | HTTP 403; error code clients/unknownClient |
| TEST-009 | US-0.3 | POST /open311/v2/requests with media; media failure does not fail ticket | API Integration | HTTP 200; ticket created; media error silently swallowed |
| TEST-010 | US-0.4 | GET /open311/v2/requests/{id} returns single service request | API Integration | Single-element array; correct ticket data |
| TEST-011 | US-0.4 | Non-existent ticket ID returns HTTP 404 | API Negative | HTTP 404 with errors array |
| TEST-012 | US-0.1–0.4 | Response fields byte-compatible with PHP reference implementation | Golden-File | All field names and values match PHP golden fixture |
| TEST-013 | US-1.1 | Create ticket via POST /api/tickets with required fields | API Integration | HTTP 201; ticket created; "open" history entry created |
| TEST-014 | US-1.1 | Create ticket with assignee — "assignment" history entry created + email sent | API Integration | 2 history entries; email sent to assignee |
| TEST-015 | US-1.1 | Create ticket missing description returns HTTP 400 | API Negative | HTTP 400; MISSING_REQUIRED error code |
| TEST-016 | US-1.2 | Close ticket via POST /api/tickets/{id}/close with substatus | API Integration | HTTP 200; status=closed; substatus_id set; history entry created |
| TEST-017 | US-1.2 | Close without substatus returns HTTP 400 | API Negative | HTTP 400; MISSING_SUBSTATUS error code |
| TEST-018 | US-1.2 | Close with Duplicate substatus requires parent_id | API Negative | HTTP 400 if parent_id missing when substatus=Duplicate |
| TEST-019 | US-1.3 | Reopen closed ticket — status=open; closedDate=null; substatus_id=null | API Integration | HTTP 200; fields reset; reopen history entry created |
| TEST-020 | US-1.4 | Assign ticket — history entry created; email sent to new assignee | API Integration | HTTP 200; assignment history record; email delivered |
| TEST-021 | US-1.5 | Bulk close 5 tickets — each gets individual history record | API Integration | HTTP 200; 5 history entries created |
| TEST-022 | US-1.5 | Bulk close without substatus — all fail with 400 | API Negative | HTTP 400; no tickets closed |
| TEST-023 | US-1.1 | Create ticket at /cases/new renders correctly (E2E) | E2E UI | Form loads; all fields present; submit creates ticket |
| TEST-024 | US-1.2 | Close ticket from case detail — substatus dialog appears | E2E UI | Dialog renders with substatus dropdown; confirm closes ticket |
| TEST-025 | US-1.3 | Reopen button visible on closed ticket; hides after reopen | E2E UI | Button visibility toggles correctly |
| TEST-026 | US-1.4 | Assign from case detail — toast confirms save | E2E UI | Toast "Case updated" visible; assignee field updated |
| TEST-027 | US-1.5 | Bulk action toolbar appears on checkbox selection | E2E UI | Toolbar visible with Assign/Close/Change Status buttons |
| TEST-028 | US-2.1 | /submit renders 5-step wizard at 375px; no horizontal scroll | E2E UI | Viewport test passes; all steps navigable |
| TEST-029 | US-2.1 | Anonymous submission (all contact info skipped) — ticket created | E2E UI | Confirmation screen with case ID shown |
| TEST-030 | US-2.1 | Framer Motion transitions ≤300ms; disabled with prefers-reduced-motion | Visual/Animation | Timing measured; motion=0 in reduced-motion mode |
| TEST-031 | US-2.2 | Map renders at zoom 13 centered on city; pin-drop sets lat/lon | E2E UI | Map visible; pin placed; coordinates in form state |
| TEST-032 | US-2.2 | Address autocomplete triggers after 300ms debounce | E2E UI | Suggestions appear; selecting updates map and address field |
| TEST-033 | US-2.2 | Advancing to step 4 blocked if no address or pin-drop | E2E UI | Inline error shown; step advance prevented |
| TEST-034 | US-2.3 | Photo upload: thumbnail previews shown; remove button works | E2E UI | Thumbnails visible; remove clears preview |
| TEST-035 | US-2.3 | File >10MB shows inline error | E2E UI | "Photo exceeds maximum 10 MB size" error displayed |
| TEST-036 | US-2.3 | Unsupported file type shows inline error | E2E UI | "Only JPEG, PNG, and GIF photos are accepted" shown |
| TEST-037 | US-2.4 | Confirmation screen shows case ID after successful submission | E2E UI | "Case number: #{id}" visible; Open311 link present |
| TEST-038 | US-2.4 | Network error on submit shows retry message | E2E UI | "Submission failed. Please try again." shown with retry |
| TEST-039 | US-2.4 | Email confirmation sent to reporter if email provided | Integration | Email received within 2 minutes; correct case ID in subject |
| TEST-040 | US-3.1 | Search term triggers API call after 300ms debounce | E2E UI | Network request made after 300ms; not before |
| TEST-041 | US-3.1 | Matching description highlighted with `<mark>` elements | E2E UI | Mark elements present in search result description column |
| TEST-042 | US-3.1 | Empty search returns full list; skeleton shown during fetch | E2E UI | All tickets returned; skeleton rows visible during load |
| TEST-043 | US-3.2 | Filter panel applies multiple filters simultaneously | E2E UI | Filter chips appear; results narrowed correctly |
| TEST-044 | US-3.2 | Filter chip "×" removes that filter; re-fetches | E2E UI | Chip removed; API called without that filter param |
| TEST-045 | US-3.2 | start_date > end_date shows inline validation error | E2E UI | Error message shown; no API call made |
| TEST-046 | US-3.2 | Overdue badge shows on SLA-exceeded open tickets | E2E UI | Red "X days" badge visible; tickets without SLA show no badge |
| TEST-047 | US-3.3 | Clicking column header sorts ascending; click again descending | E2E UI | Arrow indicator changes; results re-ordered |
| TEST-048 | US-3.4 | Page size selector changes results count | E2E UI | 10/25/50/100 options work; count indicator updated |
| TEST-049 | US-3.5 | Save Search creates bookmark record | API Integration | HTTP 201; bookmarks record created with correct requestUri |
| TEST-050 | US-3.5 | Recalling bookmark restores all filter state | E2E UI | URL navigated; filter chips and search term restored |
| TEST-051 | US-3.6 | Export button downloads CSV with correct headers | E2E UI | File downloaded; columns match table headers |
| TEST-052 | US-3.6 | Export empty result set shows toast "No cases to export" | E2E UI | Toast visible; no file downloaded |
| TEST-053 | US-3.1 | Full-text search query P95 ≤500ms at 100K tickets | Performance | P95 latency measured under load; ≤500ms |
| TEST-054 | US-3.2 | Case list page initial load ≤2s desktop | Performance | Lighthouse score; first meaningful paint ≤2s |
| TEST-055 | US-3.2 | Filter state encoded in URL query string | E2E UI | URL reflects all active filters; page bookmark navigates correctly |
| TEST-056 | US-4.1 | Case detail loads metadata, history, and media in parallel | E2E UI | Three network requests fired simultaneously; skeleton shown |
| TEST-057 | US-4.1 | Split-pane layout on desktop; stacked on ≤768px | E2E UI | Layout correct at both breakpoints |
| TEST-058 | US-4.1 | Ticket not found renders "Case not found" message | E2E UI | Error message and back link displayed |
| TEST-059 | US-4.2 | Inline edit: click Edit icon → field becomes editable | E2E UI | Input/dropdown replaces read-only text |
| TEST-060 | US-4.2 | Optimistic UI: field updates immediately; reverts on API error | E2E UI | Value shown before response; reverted on 500 |
| TEST-061 | US-4.2 | Closed ticket fields read-only for staff role | E2E UI | Edit icon absent/disabled for staff on closed ticket |
| TEST-062 | US-4.3 | Log action form: action dropdown filtered to department actions | E2E UI | Only permitted department actions shown |
| TEST-063 | US-4.3 | Notify Reporter checked + reporter has notification email → email sent | Integration | Email delivered; sentNotifications field populated |
| TEST-064 | US-4.3 | Email failure: action saved; toast warning shown | Integration | History entry exists; toast "Email notification failed to send" |
| TEST-065 | US-4.4 | Selecting template pre-fills notes textarea | E2E UI | Notes textarea populated with template body |
| TEST-066 | US-4.4 | Changing action type resets template selector | E2E UI | Template dropdown cleared on action type change |
| TEST-067 | US-4.4 | Template variables rendered server-side before returning | API Integration | {actionPerson} replaced with actual name in response |
| TEST-068 | US-5.1 | Dashboard stat cards load within ≤2s | Performance | Stat values visible within 2s of page load |
| TEST-069 | US-5.1 | Overdue count excludes tickets in categories with no slaDays | API Integration | Count matches direct DB query (SLA-null categories excluded) |
| TEST-070 | US-5.1 | Staff role: stat cards scoped to own department | API Integration | Counts match department-filtered query |
| TEST-071 | US-5.1 | Stat card API failure shows "—" with retry | E2E UI | "—" visible; retry icon present |
| TEST-072 | US-5.2 | Recent feed shows last 10 by enteredDate DESC | API Integration | Response ordered correctly; exactly 10 rows |
| TEST-073 | US-5.3 | Map widget renders cluster pins at low zoom | E2E UI | Cluster bubbles visible with count; Leaflet fallback renders |
| TEST-074 | US-5.4 | "Assigned to Me" link navigates with correct filter | E2E UI | URL contains assignedPerson_id={currentUserId} |
| TEST-075 | US-5.4 | Donut chart toggled to "By Category" re-fetches with groupBy=category | E2E UI | API called with correct param; chart updates |
| TEST-076 | US-5.1 | API failure: card shows "—" with retry icon | E2E UI | Card renders error state correctly |
| TEST-077 | US-5.4 | Dashboard responsive grid: 2-column tablet, 1-column mobile | E2E UI | Layout verified at 768px and 375px |
| TEST-078 | US-6.1 | People list search filters by name with 300ms debounce | E2E UI | Results filtered; skeleton shown during fetch |
| TEST-079 | US-6.2 | Create person: duplicate username returns toast error | E2E UI | Toast "Username already in use"; form stays open |
| TEST-080 | US-6.2 | Create person with nested email (usedForNotifications=true) | API Integration | people_emails record created with flag set |
| TEST-081 | US-6.3 | Edit person: add/remove email records reconciled on save | API Integration | New emails added; removed emails deleted from DB |
| TEST-082 | US-6.4 | Delete person referenced by ticket returns 409 | API Negative | HTTP 409; error message with ticket count |
| TEST-083 | US-6.4 | Delete safe person — cascades email/phone/address records | API Integration | All related records removed from DB |
| TEST-084 | US-6.2 | Person form Sheet opens; required field missing shows error | E2E UI | Inline validation error on missing firstname/lastname/org |
| TEST-085 | US-6.3 | Role selector: only admin can set another user's role to admin | Security | Non-admin cannot promote; API returns 403 |
| TEST-086 | US-6.1 | Role filter dropdown filters list correctly | E2E UI | Only staff/admin/public rows returned per selection |
| TEST-087 | US-6.2 | New person appears in assignee selector after creation | E2E UI | Person appears in case detail assignee dropdown immediately |
| TEST-088 | US-7.1 | Create department: missing name shows validation error | E2E UI | "Department name is required" shown |
| TEST-089 | US-7.1 | Edit department: department_actions reconciled on save | API Integration | Checked action types present in department_actions table |
| TEST-090 | US-7.2 | Delete department with associated categories blocked (409) | API Negative | HTTP 409; error message |
| TEST-091 | US-7.2 | Delete safe department: department_actions cascade-deleted | API Integration | department_actions rows removed from DB |
| TEST-092 | US-7.1 | Department appears in department filter on case list | E2E UI | Newly created department visible in filter dropdown |
| TEST-093 | US-7.1 | Default person assignment shown in department table | E2E UI | Default person name visible in table row |
| TEST-094 | US-8.1 | Create category group: delete blocked if has categories (409) | API Negative | HTTP 409; error message |
| TEST-095 | US-8.2 | Create category: postingPermissionLevel must be ≥ permissive than displayPermissionLevel | API Negative | HTTP 400 if constraint violated |
| TEST-096 | US-8.2 | Create category: autoCloseSubstatus_id required when autoCloseIsActive=true | API Negative | HTTP 400 if autoCloseIsActive=true but substatus not set |
| TEST-097 | US-8.2 | Category response templates nested array reconciled on save | API Integration | category_action_responses records created/updated/deleted |
| TEST-098 | US-8.3 | Delete category with associated tickets blocked (409) | API Negative | HTTP 409; error message |
| TEST-099 | US-8.3 | Delete safe category: category_action_responses cascade-deleted | API Integration | Response template records removed from DB |
| TEST-100 | US-8.2 | Category appears in category selector on public form after creation | E2E UI | Category visible in public form category step |
| TEST-101 | US-8.1 | Category groups shown in ordering sequence | E2E UI | Groups ordered by ordering field ascending |
| TEST-102 | US-8.2 | Category with postingPermissionLevel=anonymous appears in public form | E2E UI | Category visible on /submit form |
| TEST-103 | US-8.2 | Category with postingPermissionLevel=staff hidden from public form | E2E UI | Staff-only category not visible on /submit form |
| TEST-104 | US-9.1 | "open" history entry auto-created on ticket creation | API Integration | ticket_history record with action=open present |
| TEST-105 | US-9.1 | "assignment" history entry auto-created on assignment | API Integration | ticket_history record with action=assignment present |
| TEST-106 | US-9.1 | "closed" history entry auto-created on ticket close | API Integration | ticket_history record with action=closed present |
| TEST-107 | US-9.1 | "changeCategory" history entry auto-created on category edit | API Integration | ticket_history record with action=changeCategory present |
| TEST-108 | US-9.1 | System action types not selectable in action log dropdown | E2E UI | System-type actions absent from dropdown |
| TEST-109 | US-9.2 | Email sent to reporter when notifyReporter=true and email configured | Integration | Email received; correct subject format |
| TEST-110 | US-9.2 | Email delivery failure: history entry saved; toast warning | Integration | history entry in DB; toast "Email notification failed to send" |
| TEST-111 | US-9.2 | sentNotifications field records notified email addresses | API Integration | JSON array with notified emails in ticket_history record |
| TEST-112 | US-9.3 | Template dropdown queries category + action type | API Integration | Correct template returned by GET /api/categories/{id}/action-responses/{actionId} |
| TEST-113 | US-9.3 | Changing action type resets template selector | E2E UI | Template dropdown cleared on action change |
| TEST-114 | US-10.1 | File >10MB rejected with HTTP 413 | API Negative | HTTP 413; error message |
| TEST-115 | US-10.1 | Unsupported MIME type rejected with HTTP 415 | API Negative | HTTP 415; error message |
| TEST-116 | US-10.1 | Drag-and-drop zone accepts JPEG/PNG/GIF | E2E UI | File accepted; thumbnail preview shown |
| TEST-117 | US-10.2 | POST /api/tickets/{id}/media creates media record and "upload_media" history | API Integration | media row inserted; ticket_history row with action=upload_media |
| TEST-118 | US-10.2 | File saved at correct path {mediaRoot}/{ticket_id}/{internalFilename} | Integration | File exists at expected path after upload |
| TEST-119 | US-10.3 | Click thumbnail opens lightbox with full-size image | E2E UI | Lightbox modal visible; image loaded |
| TEST-120 | US-10.3 | Lightbox prev/next navigation cycles through photos | E2E UI | Navigation buttons work; correct image shown |
| TEST-121 | US-10.3 | Escape key closes lightbox; focus returns to trigger | E2E UI | Modal closed on Escape; focus on thumbnail |
| TEST-122 | US-10.4 | Delete photo: confirmation dialog; media record and file removed | E2E UI + Integration | Dialog shown; DB record deleted; file deleted from disk |
| TEST-123 | US-10.4 | Delete non-existent media returns HTTP 404 | API Negative | HTTP 404; error message |
| TEST-124 | US-11.1 | FTS search by description returns matching tickets | API Integration | Tickets with matching description returned |
| TEST-125 | US-11.1 | FTS with multi-word query uses AND semantics | API Integration | Results match all terms; not just any term |
| TEST-126 | US-11.1 | Empty q parameter returns full unfiltered list | API Integration | All tickets returned; no FTS filter applied |
| TEST-127 | US-11.1 | FTS query P95 ≤500ms at 100K ticket dataset | Performance | Timing measured under load test |
| TEST-128 | US-11.2 | searchSnippet field contains ts_headline output with `<mark>` tags | API Integration | Response includes searchSnippet; mark tags present |
| TEST-129 | US-11.2 | React renders searchSnippet with DOMPurify sanitization | E2E UI | Marks visible; no unsanitized HTML injected |
| TEST-130 | US-11.3 | Search + filter combined: results satisfy both conditions | API Integration | SQL WHERE includes both search_vector and filter conditions |
| TEST-131 | US-11.3 | Bookmark preserves full URL with search term + filter params | E2E UI | Recalled bookmark restores both search term and filter chips |
| TEST-132 | US-11.4 | Trigger fires on INSERT: search_vector populated | DB Integration | New ticket inserted; search_vector non-null |
| TEST-133 | US-11.4 | Trigger fires on UPDATE: search_vector reflects new description | DB Integration | Updated description appears in FTS results |
| TEST-134 | US-12.1 | CAS login: redirect to CAS server on "Sign in with CAS" click | E2E UI | Browser redirects to CAS URL with service param |
| TEST-135 | US-12.1 | CAS callback validates ticket; JWT cookie set; redirected to dashboard | Integration | auth_token cookie present; httpOnly flag set |
| TEST-136 | US-12.1 | GET /api/auth/me returns correct user data | API Integration | personId, role, name, expiresAt present |
| TEST-137 | US-12.2 | LDAP login: correct credentials issue JWT cookie | API Integration | HTTP 200; auth_token cookie set; response body has personId/role/name |
| TEST-138 | US-12.2 | LDAP login: wrong credentials show error state on login screen | E2E UI | Error state rendered; no cookie set |
| TEST-139 | US-12.3 | JWT expires in 8 hours by default (configurable) | Integration | Token expiry matches configured value |
| TEST-140 | US-12.3 | Refresh called 5 min before expiry; new cookie issued | Integration | POST /api/auth/refresh returns new cookie |
| TEST-141 | US-12.3 | 401 response redirects to /login?returnTo={currentPath} | E2E UI | Redirect triggered; returnTo param preserved |
| TEST-142 | US-12.4 | Logout clears cookie and redirects to /login | E2E UI | auth_token cookie cleared; redirected |
| TEST-143 | US-12.4 | After logout, protected route redirects to login | E2E UI | Cannot access /cases without re-authenticating |
| TEST-144 | US-12.5 | Account screen shows own profile; name editable | E2E UI | Fields editable; PATCH updates record; toast "Profile updated" |
| TEST-145 | US-12.1 | JWT payload contains sub, role, personId, exp (never in response body) | Security | Response body lacks JWT; cookie-only delivery |
| TEST-146 | US-12.1 | Unauthenticated access to protected route → redirect to /login?returnTo= | E2E UI | Redirect includes returnTo parameter |
| TEST-147 | US-12.2 | JWT stored as httpOnly, SameSite=Strict cookie | Security | Cookie flags verified via browser dev tools |
| TEST-148 | US-12.4 | CAS single sign-out: redirected to CAS logout URL | Integration | Browser redirected to CAS logout endpoint |
| TEST-149 | US-13.1 | Create substatus: name required; appears in ticket close dropdown | E2E UI | Substatus visible in close dialog after creation |
| TEST-150 | US-13.1 | Edit substatus: updated name reflects in ticket close dropdown | E2E UI | New name shown in dropdown after save |
| TEST-151 | US-13.1 | Delete substatus: confirmation dialog before deletion | E2E UI | Dialog shown; substatus removed after confirm |
| TEST-152 | US-13.2 | Create issue type: appears in ticket creation dropdown | E2E UI | Issue type visible in new case form after creation |
| TEST-153 | US-13.2 | Delete issue type with confirmation | E2E UI | Confirmation dialog shown; deleted from list |
| TEST-154 | US-13.3 | Create response template: available in case detail template selector | E2E UI | Template appears in template dropdown |
| TEST-155 | US-13.3 | Category-level templates managed in category form (not here) | E2E UI | Category form shows response templates section; F8 admin panel does not |
| TEST-156 | US-13.4 | Create contact method: appears in ticket creation dropdown | E2E UI | Contact method visible in new case form |
| TEST-157 | US-13.4 | Delete contact method with confirmation | E2E UI | Confirmation shown; method removed from list |
| TEST-158 | US-13.1 | Toast notification on every save action (substatus) | E2E UI | Toast "Substatus saved" visible after save |
| TEST-159 | US-13.2 | Toast notification on every save action (issue type) | E2E UI | Toast "Issue type saved" visible after save |
| TEST-160 | US-13.4 | Toast notification on every save action (contact method) | E2E UI | Toast "Contact method saved" visible after save |
| TEST-161 | US-14.1 | Create client: UUID API key generated and shown once | E2E UI | Key visible post-creation with "Shown only once" label and copy button |
| TEST-162 | US-14.1 | API key active immediately for POST /open311/v2/requests | Integration | New key accepted without service restart |
| TEST-163 | US-14.1 | Navigating away from confirmation: key masked in edit view | E2E UI | Full key not visible in subsequent edit form |
| TEST-164 | US-14.2 | Edit client: API key not regenerated on edit | E2E UI | Existing key preserved after PUT |
| TEST-165 | US-14.2 | Delete client: subsequent API requests with that key return 403 | Integration | HTTP 403 from Open311ApiKeyFilter after deletion |
| TEST-166 | US-14.2 | Delete client: confirmation dialog shown before delete | E2E UI | Dialog "Delete {name}? This will revoke their API access." shown |
| TEST-167 | US-15.1 | Metrics page loads volume chart by daily/weekly/monthly | E2E UI | Charts visible; data matches PHP implementation values |
| TEST-168 | US-15.1 | Date range filter applies to all report sections | E2E UI | Filtered data returned when date range set |
| TEST-169 | US-15.1 | Metrics page loads within ≤2s | Performance | Page render time measured |
| TEST-170 | US-15.2 | Reports page shows resolution time by category and department | E2E UI | Tables/charts present with correct calculated fields |
| TEST-171 | US-15.2 | Export to CSV: valid file with correct data | E2E UI | Downloaded file parseable as CSV; data matches screen |
| TEST-172 | US-15.2 | Export empty result set shows "No data to export" toast | E2E UI | Toast visible; no file downloaded |
| TEST-173 | US-16.1 | Cluster bubbles show at low zoom; individual pins at high zoom | E2E UI | Visual behavior verified at different zoom levels |
| TEST-174 | US-16.1 | Click cluster bubble zooms in one level | E2E UI | Map zoom increments; constituent clusters/pins revealed |
| TEST-175 | US-16.1 | Click individual pin shows popover with ticket ID, category, status, link | E2E UI | Popover content correct; link navigates to case detail |
| TEST-176 | US-16.1 | geoclusters data migrated from MySQL with zero data loss | DB Integration | Row count equality verified between MySQL and PostgreSQL |
| TEST-177 | US-16.2 | Single pin rendered on case detail at ticket lat/lon | E2E UI | Pin visible at correct coordinates |
| TEST-178 | US-16.2 | No lat/lon: "Location not set" placeholder shown | E2E UI | Placeholder message visible instead of map |
| TEST-179 | US-17.1 | All screens use Inter font and JetBrains Mono for IDs | Visual | Font families verified via computed styles |
| TEST-180 | US-17.1 | shadcn/ui components customized to city brand throughout | Visual | Component styles match design tokens |
| TEST-181 | US-17.2 | Dark mode toggle persists preference to localStorage | E2E UI | Refresh page; dark mode still active |
| TEST-182 | US-17.2 | prefers-color-scheme: dark auto-activates dark mode | E2E UI | Dark mode active when OS media query set |
| TEST-183 | US-17.2 | Dark mode renders without WCAG contrast violations | Accessibility | axe-core scan: 0 critical contrast violations in dark mode |
| TEST-184 | US-17.3 | All Framer Motion animations ≤300ms | Visual/Timing | Duration measured; all below 300ms |
| TEST-185 | US-17.3 | prefers-reduced-motion: reduce disables all animations | E2E UI | Transitions instant/zero when media query set |
| TEST-186 | US-17.3 | Public submission wizard step transitions ≤300ms | Visual/Timing | Step change animation measured |
| TEST-187 | US-17.1 | 4px base grid applied to all component sizing | Visual | Spacing values divisible by 4 throughout |
| TEST-188 | US-18.1 | Persistent top navbar visible on every authenticated screen | E2E UI | Navbar present on /dashboard, /cases, /admin/people |
| TEST-189 | US-18.1 | Sidebar collapse/expand state persisted to localStorage | E2E UI | Sidebar state preserved across page navigation |
| TEST-190 | US-18.1 | Active route highlighted in sidebar | E2E UI | Visual indicator on current route link |
| TEST-191 | US-18.2 | Hamburger menu visible at ≤768px; sidebar hidden | E2E UI | Sidebar absent; hamburger visible at 768px viewport |
| TEST-192 | US-18.2 | Hamburger drawer opens with all nav links; touch targets ≥44px | E2E UI | Sheet component renders; target sizes measured |
| TEST-193 | US-18.2 | Drawer closes on Escape key; focus returns to hamburger icon | E2E UI | Focus management verified |
| TEST-194 | US-18.3 | Skip-to-main-content link is first focusable element | Accessibility | First Tab press reaches skip link |
| TEST-195 | US-18.3 | Skip link visible only on keyboard focus | Accessibility | Link visually hidden until focused |
| TEST-196 | US-18.3 | All navbar/sidebar elements keyboard-accessible (Tab, Enter, Space, Escape) | Accessibility | Manual keyboard navigation audit passes |
| TEST-197 | US-19.1 | All interactive elements reachable via keyboard | Accessibility | Manual keyboard audit: all elements tabable and operable |
| TEST-198 | US-19.1 | Focus order follows logical reading order | Accessibility | Tab sequence audit passes |
| TEST-199 | US-19.1 | Modal dialogs trap focus while open; return focus on close | Accessibility | Focus trap verified in Dialog components |
| TEST-200 | US-19.2 | All images have descriptive alt text | Accessibility | axe-core: 0 image-alt violations |
| TEST-201 | US-19.2 | All form inputs have associated `<label>` elements | Accessibility | axe-core: 0 label violations |
| TEST-202 | US-19.2 | Toast notifications announced via aria-live="polite" | Accessibility | Screen reader test: announcements verified |
| TEST-203 | US-19.2 | axe-core scan: 0 critical or serious violations | Accessibility | Automated scan report passes |
| TEST-204 | US-19.3 | Application renders correctly at 375px, 768px, 1280px+ | E2E UI | Visual regression at all three breakpoints |
| TEST-205 | US-19.3 | No horizontal scroll at any supported breakpoint | E2E UI | scrollWidth === clientWidth at all breakpoints |
| TEST-206 | US-19.3 | Touch targets ≥44px on mobile | Accessibility | Target sizes measured at 375px viewport |
| TEST-207 | US-19.4 | Normal text contrast ≥4.5:1 in light mode | Accessibility | axe-core: 0 contrast violations in light mode |
| TEST-208 | US-19.4 | Normal text contrast ≥4.5:1 in dark mode | Accessibility | axe-core: 0 contrast violations in dark mode |
| TEST-209 | US-20.1 | Swagger UI accessible at /swagger-ui.html | API Integration | HTTP 200; UI renders |
| TEST-210 | US-20.1 | OpenAPI spec available at /v3/api-docs as valid JSON | API Integration | HTTP 200; valid OpenAPI 3.0 JSON |
| TEST-211 | US-20.1 | All controller methods have @Operation annotation | Static Analysis | Spec coverage check: 100% coverage |
| TEST-212 | US-20.2 | Swagger UI "Authorize" accepts Bearer JWT; authenticated calls succeed | Integration | Authorized requests return correct data |
| TEST-213 | US-20.2 | Open311 endpoints testable without Bearer token (api_key instead) | Integration | Open311 endpoints callable from Swagger UI |
| TEST-214 | US-21.1 | flyway migrate on clean PostgreSQL instance succeeds end-to-end | DB Migration | No errors; all 18 tables created |
| TEST-215 | US-21.1 | V1__initial_schema.sql creates all 18 tables with correct types | DB Integration | Schema introspection matches DDL specification |
| TEST-216 | US-21.1 | V2__search_vector.sql adds search_vector column and GIN index | DB Integration | Column and index exist after migration |
| TEST-217 | US-21.1 | All foreign key constraints and indexes recreated | DB Integration | FK constraints present; index list matches spec |
| TEST-218 | US-21.2 | Row count equality across all 18 tables after data migration | DB Migration | COUNT(*) matches between MySQL export and PostgreSQL import |
| TEST-219 | US-21.2 | 0 foreign key constraint violations in PostgreSQL after migration | DB Migration | FK constraint check query returns 0 violations |
| TEST-220 | US-21.2 | Media file paths and records preserved from PHP implementation | DB Migration | media.internal_filename values and files on disk match |

---

## 6. Non-Functional Requirements Traceability

| NFR ID | Requirement | Source | TechArch Spec | Verification |
|---|---|---|---|---|
| REQ-NFR-001 | Case list initial load ≤2s desktop | PRD §6 | SPEC-011, SPEC-013 (paginated query) | Lighthouse performance audit |
| REQ-NFR-002 | Search query P95 ≤500ms | PRD §6 | SPEC-021, SPEC-022 (GIN index) | Load test with 100K ticket dataset |
| REQ-NFR-003 | Open311 API response ≤300ms P95 | PRD §6 | SPEC-024, SPEC-025 (Open311 controllers) | API load test |
| REQ-NFR-004 | Dashboard widget load ≤2s | PRD §6 | SPEC-012 (DashboardService aggregations) | Lighthouse performance audit |
| REQ-NFR-005 | Animation duration ≤300ms | PRD §6, PRD F17 | SPEC-008 (Framer Motion variants) | Animation timing measurement |
| REQ-NFR-006 | WCAG 2.1 AA throughout | PRD §6 | SPEC-006, SPEC-010 (component accessibility) | axe-core automated scan + manual audit |
| REQ-NFR-007 | Section 508 compliance | PRD §6 | SPEC-006, SPEC-010 | Manual keyboard navigation audit |
| REQ-NFR-008 | prefers-reduced-motion disables all motion | PRD F17 | SPEC-009 (useReducedMotion hook) | E2E test with media query simulated |
| REQ-NFR-009 | 100% Open311 contract preservation | PRD §3, F0 | SPEC-024, SPEC-025, SPEC-026, SPEC-027 | Golden-file integration tests against PHP reference |
| REQ-NFR-010 | 0 rows lost; 0 columns dropped | PRD §6, F21 | SPEC-016, SPEC-054 (migration) | Migration validation script (row counts, FK checks) |
| REQ-NFR-011 | JWT expiry configurable (recommended 8h) | PRD F12 | SPEC-036 (JwtConfig.java) | Configuration test; token expiry verified |
| REQ-NFR-012 | API key auth for Open311 write ops | PRD F0, F14 | SPEC-034 (Open311ApiKeyFilter) | Security test: write without key returns 403 |
| REQ-NFR-013 | HTTPS enforced in production | PRD §6 | SPEC-001 (Nginx TLS termination) | SSL handshake verification |
| REQ-NFR-014 | SameSite=Strict cookie | PRD F12 | SPEC-001 (Nginx), SPEC-035 (JWT filter) | Cookie header inspection |
| REQ-NFR-015 | ≥50 concurrent staff users | PRD §6 | SPEC-002 (OCI containers, HikariCP pool) | Load test simulating 50 concurrent sessions |
| REQ-NFR-016 | 100% endpoint OpenAPI coverage | PRD §6, F20 | SPEC-051, SPEC-052 | Static analysis of @Operation annotations |
| REQ-NFR-017 | All schema changes via Flyway | PRD F21 | SPEC-056 (FlywayConfig) | Flyway history table completeness check |
| REQ-NFR-018 | Latest 2 browser versions | PRD §6 | SPEC-006 (React SPA build) | Cross-browser automated test suite |
| REQ-NFR-019 | 375px minimum viewport | PRD §6, F19 | SPEC-006 (Tailwind responsive classes) | Viewport emulation at 375px |

---

## 7. Personas to Features Traceability

| Persona | Role | Primary Features | Key Stories |
|---|---|---|---|
| **PER-01: Marcus Rivera** | 311 Operator / CRM Staff | F1, F3, F4, F9, F10, F11, F18 | US-1.1–1.5, US-3.1–3.6, US-4.1–4.4, US-9.1–9.2 |
| **PER-02: Diane Kowalski** | Department Field Supervisor | F4, F5, F10, F11, F18 | US-4.3–4.4, US-5.1–5.4, US-10.2, US-18.2 |
| **PER-03: Jordan Calloway** | System Administrator | F6, F7, F8, F13, F14, F15, F20, F21 | US-6.1–6.4, US-7.1–7.2, US-8.1–8.3, US-13.1–13.4, US-14.1–14.2, US-20.1–20.2, US-21.1–21.2 |
| **PER-04: Priya Nair** | Constituent / Citizen Reporter | F2, F17, F19 | US-2.1–2.4, US-17.3, US-19.3 |
| **External: Open311 Clients** | Mobile apps / Aggregators | F0 | US-0.1–0.4 |

---

## 8. Change Management

### 8.1 Change Log

| Version | Date | Author | Description | Impact |
|---|---|---|---|---|
| 1.0 | 2026-07-06 | Engineering | Initial RTM created from PRD v1.0, FRD v1.0, TechArch v1.0, UserStories v1.0 | Baseline |

### 8.2 Change Management Protocol

All changes to requirements must be tracked in this Change Log. Any modification to a PRD feature, FRD requirement, TechArch specification, or User Story acceptance criterion must:

1. **Identify impact** — Use this RTM to identify all downstream artifacts affected by the change (e.g., changing F0 affects REQ-FUNC-001–006, SPEC-024–028, US-0.1–0.4, TEST-001–012).
2. **Update all affected documents** — PRD, FRD, TechArch, UserStories, and this RTM must all be updated in the same pull request.
3. **Update test cases** — Any acceptance criterion change must trigger a corresponding update to the affected TEST-XXX rows.
4. **Version increment** — RTM version increments with each accepted change.
5. **Hard constraints** — The following items are locked and require executive approval to change: Open311 endpoint paths/methods/response formats (F0), database table/column drops (F21), feature removals from PHP parity list (all F-items marked as "existing").

---

## 9. Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Owner | | | |
| Engineering Lead | | | |
| QA Lead | | | |
| Accessibility Reviewer | | | |
| Database Administrator | | | |

### Approval Notes

- This RTM must be reviewed and approved before development commences on each phase.
- Sign-off confirms that all requirements are understood, traceable, and testable.
- The Open311 API frozen contract (F0) requires separate sign-off confirmation from the external client liaison.
- Accessibility reviewer sign-off confirms that WCAG 2.1 AA and Section 508 requirements are sufficiently specified for all 22 feature areas.
- Database Administrator sign-off confirms that the Flyway migration scripts (F21) meet data integrity standards before production cutover.

---

## 10. Traceability Completeness Checklist

| Check | Status |
|---|---|
| All 22 PRD features (F0–F21) have at least one FRD requirement | ✅ Complete |
| All 22 PRD features have at least one TechArch specification | ✅ Complete |
| All 22 PRD features have at least one User Story | ✅ Complete |
| All 74 User Stories map back to exactly one PRD feature | ✅ Complete |
| All 74 User Stories have at least one derived test case | ✅ Complete |
| All 10 Non-Functional Requirements are traceable to a TechArch spec | ✅ Complete |
| All 4 personas are mapped to relevant features | ✅ Complete |
| Frozen Open311 contract (F0) is marked with change-control flag | ✅ Complete |
| Database migration (F21) has explicit data integrity test cases | ✅ Complete |
| Accessibility requirements (F19) have automated + manual test cases | ✅ Complete |

---

*RTM-UReport.md — uReport CRM Modernization v1.0 — 2026-07-06*
