# Product Requirements Document — uReport CRM Modernization

**Project:** UReport  
**Version:** 1.0  
**Date:** 2026-07-06  
**Status:** Active  
**Classification:** Internal — Engineering & Product

---

## 1. Executive Summary

uReport is a civic Constituent Relationship Management (CRM) web application used by smaller municipalities to manage 311 service requests (cases/tickets), with a built-in Open311 / GeoReport v2 API that external clients (mobile apps, aggregators) rely on. This project modernizes the existing PHP 8.5 / MySQL / Solr / Apache stack into a production-grade React + Java Spring Boot + PostgreSQL architecture — preserving 100% of existing features, API contracts, and data — while delivering a substantially upgraded, accessible, and polished user interface.

---

## 2. Problem Statement

The current uReport codebase presents significant operational and maintenance challenges that impede its long-term viability as a civic platform:

**Technology Debt**
- The PHP 8.5 custom MVC framework is non-standard and difficult to onboard new engineers onto; 23 controllers and 36 models carry years of accumulated coupling.
- MySQL is being phased out in favor of PostgreSQL across the municipality's infrastructure.
- Apache Solr as a full-text search engine is an external service dependency that introduces operational overhead (JVM, indexing jobs, sync lag) disproportionate to single-city search volume.

**User Experience Deficiencies**
- Server-rendered PHP templates produce poor interactivity and require full-page reloads for every action.
- No design system exists; UI is inconsistent across screens and does not meet WCAG 2.1 AA accessibility standards.
- Staff workflows (case creation, status transitions, bulk operations) lack the responsiveness and visual feedback expected of modern applications.
- No dark mode or responsive mobile layout; the application is effectively unusable on mobile devices.

**Operational Risk**
- External clients (Open311 API consumers) are already deployed and cannot tolerate API contract changes.
- No OpenAPI/Swagger documentation means API behavior is undiscoverable without reading PHP source code.
- No structured migration framework means schema changes are manually applied with no version history.

**Summary of Pain Points**
- Full-page reloads for every user action reduce staff productivity.
- Non-accessible UI excludes assistive-technology users and creates legal exposure.
- Solr dependency adds operational complexity without commensurate value at single-city scale.
- No mobile support limits field use cases.
- Lack of API documentation slows third-party integrations.

---

## 3. Product Vision

### Vision Statement

uReport modernized is the definitive civic 311 CRM for smaller municipalities: a fast, accessible, beautifully designed application that staff love to use every day, fully compliant with the Open311 / GeoReport v2 standard, and built on a maintainable, documented technology stack that will serve the city for the next decade.

### Strategic Goals

- **Preserve Everything**: Every screen, feature, API endpoint, and data record from the existing application continues to function identically after modernization. No regression is acceptable.
- **Modern Developer Experience**: Spring Boot, Spring Data JPA, Flyway, and MapStruct replace the custom PHP framework with industry-standard tooling; OpenAPI/Swagger makes all endpoints self-documenting.
- **Accessible by Default**: WCAG 2.1 AA and Section 508 compliance throughout — not a post-launch retrofit, but a design constraint from day one.
- **Responsive and Mobile-Ready**: The new React frontend works correctly at 375 px (mobile), 768 px (tablet), and 1280 px+ (desktop) breakpoints.
- **Eliminate External Search Dependency**: PostgreSQL full-text search (tsvector / tsquery with GIN indexes) replaces Solr with equivalent search behavior and relevance ranking, removing an operational service dependency.
- **API Stability**: The Open311 / GeoReport v2 API surface is frozen — no endpoint path, HTTP method, or response format changes. External clients must continue working without any modification.
- **Polished, Branded Design**: A custom design system built on Tailwind CSS + shadcn/ui (Inter + JetBrains Mono, 4 px grid, 3-tier shadow system, CSS variable design tokens) delivers a consistent, city-branded visual experience with dark mode support.
- **Performant Animations**: Framer Motion micro-interactions and page transitions (≤ 300 ms, prefers-reduced-motion respected) elevate the feel of the application without impeding usability.

---

## 4. Technical Architecture

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | React (latest stable) | Single-page application, React Router |
| **Styling** | Tailwind CSS + shadcn/ui | Custom design tokens via CSS variables |
| **Typography** | Inter (UI) + JetBrains Mono (code/IDs) | 4 px base grid |
| **Animation** | Framer Motion | ≤ 300 ms; prefers-reduced-motion support |
| **Maps** | Mapbox GL JS / Leaflet (fallback) | Interactive map widget, pin-drop |
| **Backend** | Java Spring Boot | REST API, Spring MVC |
| **Data Access** | Spring Data JPA + MapStruct | DTOs with compile-time safety |
| **Security** | Spring Security + JWT | LDAP and CAS authentication |
| **Database** | PostgreSQL | Replaces MySQL |
| **Migrations** | Flyway | Version-controlled schema evolution |
| **Full-Text Search** | PostgreSQL tsvector / tsquery | GIN indexes; replaces Apache Solr |
| **API Documentation** | OpenAPI / Swagger (springdoc) | Auto-generated from annotations |
| **Containerization** | Docker Compose | React (Nginx), Spring Boot, PostgreSQL |
| **Open311 API** | GeoReport v2 (unchanged) | Paths and response formats frozen |

**Domain Model Summary (18 tables → PostgreSQL)**

The core domain entity is the **Ticket** (civic 311 service request). A ticket belongs to a **Category** (which belongs to a **CategoryGroup** and a **Department**), has a **reporter** Person and an **assignee** Person, tracks location (address + lat/lon via `ticket_geodata`), has a status (open/closed) with **Substatus** (Resolved, Duplicate, Bogus), and accumulates a full history of **Actions** (open, assignment, response, comment, media upload, etc.). Supporting entities: `people`, `peopleEmails`, `peoplePhones`, `peopleAddresses`, `departments`, `categories`, `categoryGroups`, `actions`, `ticketHistory`, `media`, `bookmarks`, `geoclusters`, `substatus`, `issueTypes`, `clients`, `contactMethods`, `department_actions`, `department_categories`, `category_action_responses`.

---

## 5. Feature Requirements

### F0: Open311 / GeoReport v2 API (Hard Constraint — Frozen)

**Description:** The Open311 / GeoReport v2 REST API exposes four endpoints consumed by external clients (mobile apps, 311 aggregators). These endpoints are a hard frozen contract — no path, HTTP method, query parameter, or response format may change. The Spring Boot backend must implement these endpoints with byte-level response format compatibility to the existing PHP implementation.

**Capabilities:**
- `GET /services` — List all available service categories with jurisdiction_id support
- `GET /requests` — List service requests with filters (service_code, status, start_date, end_date, lat, long, radius, page)
- `POST /requests` — Submit a new service request; returns service_request_id
- `GET /requests/:id` — Retrieve a specific service request by ID
- Content negotiation: JSON and XML responses based on Accept header or `.json` / `.xml` format extension
- API key authentication via `api_key` query parameter or `X-Api-Key` header for write operations
- Client/API key management preserved in admin panel

**Priority:** P0 — Critical / Hard Constraint. External client breakage is unacceptable.

---

### F1: Ticket / Case Lifecycle Management

**Description:** The ticket (civic 311 service request) is the core entity of uReport. Staff must be able to create, view, assign, update, and close/reopen tickets through the React UI. Every lifecycle state transition is recorded in the ticket history with a timestamp, actor, and action detail. All existing status values, substatus values, and action types are preserved.

**Capabilities:**
- Create a new ticket (manual staff entry, separate from public submission)
- Assign ticket to a staff person and/or department
- Update ticket fields (category, location, description, substatus)
- Transition ticket status: open → closed; closed → open (reopen)
- Apply substatus values: Resolved, Duplicate, Bogus, and any custom substatus
- Log actions and responses with free-text notes
- Send email notifications to reporter and assignee on action/response
- Attach media (photos) to tickets and actions
- View complete action/history timeline on case detail screen
- Bulk operations: assign, close, change status on multiple selected tickets

**Priority:** P0 — Critical / Core business function.

---

### F2: Public Case Submission Form

**Description:** The public-facing case submission form allows constituents to report a 311 service request without logging in. The form collects contact information (optional), category, location (address + map pin-drop), description, and photo uploads. The modernized form is a multi-step wizard with Framer Motion step transitions and inline map-based location selection.

**Capabilities:**
- Multi-step form wizard (contact info → category → location → description/photos → review)
- Framer Motion animated step transitions (≤ 300 ms)
- Interactive map pin-drop (Mapbox GL JS / Leaflet) for location selection
- Address autocomplete / geocoding input
- Category dropdown filtered by category group
- Photo upload (multiple files, preview thumbnails)
- Anonymous submission (contact info optional) and identified submission (name + email)
- Confirmation screen with generated case ID
- Open311-compatible submission (POST /requests endpoint used internally)
- Fully responsive: mobile-first layout at 375 px

**Priority:** P0 — Critical / Primary public-facing feature.

---

### F3: Case List with Search, Filtering, and Sorting

**Description:** The primary staff workspace is the case list — a sortable, filterable table of tickets with status badge pills, multi-column filters, and bulk selection. Live search with debounce provides instant results as staff type. The list replaces the existing PHP-rendered table with a rich interactive data grid backed by PostgreSQL full-text search.

**Capabilities:**
- Sortable columns: case ID, date submitted, category, department, assignee, status, location
- Multi-column filter panel: status, substatus, category, category group, department, assignee, date range, issue type
- Status badge pills with color-coded visual indicators (open, closed, substatus)
- Live search with 300 ms debounce across all searchable fields (ticket ID, description, reporter name, address)
- Highlighted keyword matches in search results
- Filter chips showing active filters with individual remove buttons
- Bulk selection (checkbox per row + select all) for bulk assign/close/status operations
- Skeleton loading placeholders during data fetch
- Empty state with contextual guidance when no results match
- Pagination with configurable page size
- Saved searches / bookmarks (persisted per user)
- Export results (existing report formats preserved)

**Priority:** P0 — Critical / Primary staff workspace.

---

### F4: Case Detail View

**Description:** The case detail screen shows the full record for a single ticket in a split-pane layout: case metadata and controls on the left, action/history timeline on the right. Staff can perform inline status transitions, log responses, attach media, and view the full audit trail without leaving the screen.

**Capabilities:**
- Split-pane layout (metadata panel + timeline panel); responsive stack on mobile
- Case metadata: ID, status badge, substatus, category, department, assignee, reporter, location, contact method, issue type
- Interactive map showing the ticket location pin
- Inline status transition controls (open → close, close → reopen) with confirmation dialog
- Action log entry: free-text response with optional email notification toggle
- Response template selector (pre-populated templates)
- Media / photo upload and gallery with lightbox viewer
- Complete action/history timeline: open, assignment, response, comment, media upload events with timestamps and actors
- Edit ticket fields inline (category, assignee, location, description)
- Breadcrumb navigation back to case list

**Priority:** P0 — Critical / Core staff workflow.

---

### F5: Dashboard

**Description:** The dashboard is the landing screen for authenticated staff. It provides an at-a-glance overview of system activity: stat cards for open/closed counts, a recent cases feed, a map widget showing geographic distribution of open cases, and a status donut chart. The dashboard is informational and links into the case list with pre-applied filters.

**Capabilities:**
- Stat cards: total open cases, cases opened today, cases closed today, overdue cases (configurable threshold)
- Recent cases feed: last N tickets with status badge, category, reporter, and time-since labels
- Map widget (Mapbox GL JS / Leaflet) showing open case pins with geo-clustering for dense areas
- Status donut chart (open vs. closed breakdown by category or department)
- Quick-link buttons: New Case, All Open Cases, Assigned to Me
- Skeleton loading for all widgets during data fetch
- Responsive grid layout: 2-column on tablet, single-column on mobile

**Priority:** P1 — High / Primary landing experience; does not block core workflows.

---

### F6: People Management

**Description:** The people management admin panel allows administrators to manage staff, reporters, and contacts in the system. A person record includes name, organization, contact methods (email, phone, address), department affiliation, username, and role. Existing person data is fully migrated from MySQL to PostgreSQL.

**Capabilities:**
- List all people with search and role filter
- Create / edit / delete person records
- Manage multiple emails (with notification flag), phones, and addresses per person
- Assign person to department
- Set username and role (admin, staff, public)
- View all tickets reported by or assigned to a person
- LDAP/CAS user account linkage (username field)
- Inline editing with toast notifications on save

**Priority:** P1 — High / Required for staff and reporter management.

---

### F7: Department Management

**Description:** Departments are organizational units that own categories and receive ticket assignments. Each department can have a default assignee person. The department admin panel allows creating, editing, and deleting departments and managing their category and action associations.

**Capabilities:**
- List, create, edit, delete departments
- Assign default person (assignee) to department
- View categories belonging to department
- Manage department-level action types (department_actions)
- Manage department-category assignments (department_categories)
- Confirmation dialogs for destructive operations

**Priority:** P1 — High / Core organizational structure.

---

### F8: Category and Category Group Management

**Description:** Categories classify service request types (e.g., "Pothole", "Graffiti", "Abandoned Vehicle"). Categories are grouped into Category Groups. Each category belongs to a department and can have associated response templates and action types. The admin panel manages the full category taxonomy.

**Capabilities:**
- List, create, edit, delete category groups
- List, create, edit, delete categories within a group
- Assign category to department
- Manage category-level response templates (category_action_responses)
- Inline editing with confirmation dialogs
- Category selector used in public submission form and case management

**Priority:** P1 — High / Required for ticket classification.

---

### F9: Action / Response Logging and Email Notifications

**Description:** Every significant event on a ticket is recorded as an action in the history. Staff can log responses (with optional email to reporter) and internal comments. Response templates reduce repetitive data entry. Email notifications are sent to reporter and assignee on configured action types.

**Capabilities:**
- Log action/response on a ticket with free-text body
- Select action type (open, close, assign, response, comment, media upload, etc.)
- Choose response template to pre-fill action body
- Toggle email notification to reporter and/or assignee
- Record action actor (logged-in staff) and timestamp
- View full action history chronologically on case detail
- Email delivery uses existing SMTP configuration

**Priority:** P0 — Critical / Core communication and audit trail mechanism.

---

### F10: Media / Photo Attachment Upload

**Description:** Staff and public submitters can attach photos to tickets and action log entries. The modernized media handling supports multi-file upload with thumbnail preview and a lightbox viewer in the case detail. All existing media records and stored files are preserved in migration.

**Capabilities:**
- Multi-file upload input (drag-and-drop on desktop, native picker on mobile)
- Thumbnail preview during upload with progress indicator
- Attach media to ticket at creation or to an action log entry
- Lightbox/modal viewer for full-size photo review on case detail
- Delete attached media (with confirmation)
- Preserve existing stored media paths and database records

**Priority:** P1 — High / Required for photographic evidence workflows.

---

### F11: PostgreSQL Full-Text Search (Solr Replacement)

**Description:** Full-text search across tickets, people, and addresses is currently powered by Apache Solr. The modernization replaces Solr with PostgreSQL tsvector / tsquery search with GIN indexes. Search behavior (fields searched, relevance ranking, phonetic matching) must be functionally equivalent to the existing Solr implementation.

**Capabilities:**
- Full-text search across: ticket description, address, reporter name, category name, action notes
- Relevance-ranked results (tsvector weight assignments per field)
- GIN index on search vector column for sub-100 ms query performance at expected data volumes
- Live search with 300 ms debounce in case list (via REST endpoint)
- Highlighted keyword match snippets in search results (ts_headline)
- Saved search / bookmark persisted to `bookmarks` table per user
- Search results integrate with filter panel (search + filter combined queries)

**Priority:** P0 — Critical / Solr dependency must be eliminated; search must work at parity.

---

### F12: Authentication — LDAP and CAS

**Description:** Staff authenticate via LDAP or CAS (Central Authentication Service). Public submitters do not require authentication. After LDAP/CAS authentication, the Spring Security layer issues a JWT to the React frontend for subsequent API calls. Branded login screens replace existing PHP auth views.

**Capabilities:**
- CAS authentication integration (Spring Security CAS extension)
- LDAP authentication integration (Spring Security LDAP)
- JWT issuance on successful auth; stored in httpOnly cookie or memory (XSS mitigation)
- JWT validation on every protected API endpoint
- Branded login screen with city logo, loading spinner, and error state
- Account screen: view and update own profile (name, email, notification preferences)
- Session expiry handling with redirect to login
- Callback/logout flow with CAS single sign-out support

**Priority:** P0 — Critical / All staff access gated behind auth.

---

### F13: Admin Panels — Substatus, Issue Types, Response Templates, Contact Methods

**Description:** A set of lookup-table admin panels manage configurable system values: substatuses (e.g., Resolved, Duplicate, Bogus), issue types (categorization of the nature of the issue), response templates (canned responses), and contact methods (how a reporter contacted the city). These are CRUD panels used infrequently by administrators.

**Capabilities:**
- **Substatus management**: list, create, edit, delete substatus values
- **Issue type management**: list, create, edit, delete issue types
- **Response template management**: list, create, edit, delete response templates with body text
- **Contact method management**: list, create, edit, delete contact methods (Email, Phone, Web Form, Other, custom)
- Inline editing with toast notifications on save
- Confirmation dialogs before delete
- Used in dropdowns throughout ticket creation and case detail screens

**Priority:** P1 — High / Required for system configuration.

---

### F14: Client / API Key Management (Open311 Clients)

**Description:** External Open311 clients (mobile apps, third-party 311 aggregators) are registered in the system with a name, URL, API key, contact person, and contact method. The admin panel manages these client records. The API key is validated by the Spring Boot Open311 controller for write operations.

**Capabilities:**
- List, create, edit, delete Open311 client records
- Generate and display API key (UUID)
- Associate client record with a contact person
- Associate client with contact method
- API key validated in Spring Security filter for POST /requests
- Audit log of client API usage (optional, preserved from existing behavior)

**Priority:** P1 — High / Required to manage external API access.

---

### F15: Metrics and Reporting

**Description:** The metrics and reporting screens give administrators and supervisors quantitative insight into 311 service request volume, response times, and category distribution. The modernized reporting preserves the existing PHP Reports and Metrics screens with the same calculated fields.

**Capabilities:**
- Case volume over time (daily, weekly, monthly counts)
- Average resolution time by category and department
- Open vs. closed case ratio
- Cases by category / department / assignee breakdowns
- Date range filter for all reports
- Export to existing formats (CSV or equivalent)
- Metrics page distinct from Reports page (preserving existing route structure)

**Priority:** P2 — Medium / Important for management oversight; does not block day-to-day operations.

---

### F16: Geo-Clustering for Map Views

**Description:** The existing application supports geo-clustering of ticket pins on map views so dense urban areas render legibly. The `geoclusters` table and `ticket_geodata` table store pre-computed cluster and coordinate data. The modernized map widget uses the same clustering data (migrated to PostgreSQL) with Mapbox GL JS or Leaflet rendering.

**Capabilities:**
- Pre-computed geo-cluster data migrated from MySQL `geoclusters` table to PostgreSQL
- Map widget on dashboard renders clustered pins at low zoom, individual pins at high zoom
- Cluster click expands to show constituent tickets
- Pin click opens case detail or case preview popover
- Case detail map shows single ticket location pin

**Priority:** P2 — Medium / Enhances map usability; not required for core ticket workflows.

---

### F17: Design System and UI Framework

**Description:** The React frontend is built on a custom design system defined by Tailwind CSS configuration + shadcn/ui components + CSS variable design tokens. The design system enforces visual consistency, accessibility, and theming (light/dark mode) across every screen. It is not a feature users interact with directly but is the technical foundation for all UI features.

**Capabilities:**
- Tailwind CSS with extended configuration: custom color palette (primary, secondary, semantic), spacing scale, border-radius tokens
- shadcn/ui component library fully customized to city brand (Button, Dialog, Input, Select, Badge, Card, Table, Skeleton, Toast, Sheet, Tabs, Popover, Command)
- CSS custom property (variable) design tokens for all colors, spacing, and shadows — enabling dark mode via `:root` / `.dark` class swap
- Dark mode: full support via `prefers-color-scheme` media query + manual toggle, persisted to localStorage
- Typography: Inter for UI text, JetBrains Mono for IDs, codes, and monospaced values
- 4 px base grid applied consistently throughout all component sizing and spacing
- 3-tier elevation shadow system (low, medium, high) applied to cards, modals, and dropdowns
- Framer Motion animation system: page transition variants, stagger children, micro-interaction presets, all ≤ 300 ms; `prefers-reduced-motion` disables motion globally

**Priority:** P0 — Critical / All UI features depend on this foundation.

---

### F18: Navigation Shell — Navbar, Sidebar, Breadcrumbs, Mobile Drawer

**Description:** The application chrome consists of a persistent top navbar (logo, user menu, search trigger), a collapsible admin sidebar (navigation links to all admin panels), contextual breadcrumbs, and a mobile hamburger drawer. This shell wraps every authenticated screen consistently.

**Capabilities:**
- Persistent top navbar with city logo/name, global search trigger, logged-in user avatar/menu, dark mode toggle
- Collapsible left sidebar with admin navigation groups (Cases, People, Admin): collapse/expand with smooth transition, state persisted to localStorage
- Contextual breadcrumb trail below navbar reflecting current route hierarchy
- Mobile hamburger menu (≤ 768 px) opening a Sheet (shadcn/ui) drawer with full nav links
- Active route highlighted in sidebar
- Breadcrumb links are navigable
- Skip-to-main-content link for keyboard/screen reader users (accessibility)

**Priority:** P0 — Critical / Application shell for every screen.

---

### F19: Accessibility and Responsive Design

**Description:** Every screen and component in the React frontend must meet WCAG 2.1 Level AA and Section 508 requirements. The application must be fully usable via keyboard navigation and screen readers. Responsive breakpoints at 375 px, 768 px, and 1280 px+ ensure usability across device types.

**Capabilities:**
- WCAG 2.1 AA compliance throughout: color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- Section 508 compliance: all interactive elements keyboard-accessible, focus indicators visible
- ARIA roles, labels, and live regions on dynamic content (status updates, toast notifications, skeleton-to-content transitions)
- Screen reader-compatible: all images have alt text; tables have proper headers; forms have associated labels
- Responsive layout at three breakpoints: 375 px (mobile), 768 px (tablet), 1280 px+ (desktop)
- No horizontal scroll at any breakpoint
- Touch targets ≥ 44 px on mobile
- Focus trap in modal dialogs (shadcn/ui Dialog handles this)

**Priority:** P0 — Critical / Legal and policy requirement; not optional.

---

### F20: OpenAPI / Swagger API Documentation

**Description:** All Spring Boot REST endpoints — including the internal React-to-API routes and the frozen Open311 endpoints — are documented via OpenAPI 3.0 (springdoc-openapi). The Swagger UI is accessible to developers at a known URL for exploration and integration testing.

**Capabilities:**
- springdoc-openapi integrated in Spring Boot application
- All controllers annotated with `@Operation`, `@ApiResponse`, `@Schema`
- OpenAPI spec generated at `/v3/api-docs`
- Swagger UI accessible at `/swagger-ui.html`
- Open311 endpoints documented with GeoReport v2 field descriptions
- JWT authentication flow documented (Bearer token)
- Spec exportable as JSON/YAML for client generation

**Priority:** P1 — High / Required for developer onboarding and third-party integration.

---

### F21: Database Migration — MySQL to PostgreSQL (Flyway)

**Description:** The existing MySQL schema (18 tables, all data) must be migrated to PostgreSQL using Flyway versioned migration scripts. The PostgreSQL schema preserves all tables, columns, constraints, and relationships from the MySQL schema. No data may be lost and no table or column may be dropped.

**Capabilities:**
- Flyway migration scripts (`V1__initial_schema.sql`, etc.) in `src/main/resources/db/migration/`
- All 18 MySQL tables recreated in PostgreSQL with equivalent types (INT → INTEGER, VARCHAR → VARCHAR, TINYINT → BOOLEAN, TEXT → TEXT, etc.)
- All foreign key constraints, indexes, and auto-increment sequences recreated
- Full-text search vector column added to `tickets` table with GIN index (additive — no existing columns removed)
- Data migration script for one-time import of existing MySQL data via `mysqldump` → `pg_restore` pipeline
- `crm/scripts/mysql.sql` serves as authoritative schema reference for migration

**Priority:** P0 — Critical / No system can run without successful database migration.

---

## 6. Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| **Performance** | Case list page initial load | ≤ 2 s on desktop, ≤ 4 s on mobile (3G) |
| **Performance** | Search query response time | ≤ 500 ms (PostgreSQL FTS) |
| **Performance** | Open311 API response time | ≤ 300 ms p95 |
| **Performance** | Dashboard widget load | ≤ 2 s |
| **Accessibility** | WCAG conformance level | 2.1 AA throughout |
| **Accessibility** | Section 508 | Full compliance |
| **Animation** | Maximum motion duration | 300 ms; prefers-reduced-motion disables all motion |
| **Reliability** | API compatibility | 100% Open311 / GeoReport v2 contract preservation |
| **Data Integrity** | Migration completeness | 0 rows lost; 0 columns dropped |
| **Security** | JWT token expiry | Configurable; recommended 8 h for staff sessions |
| **Security** | API key auth | Open311 write operations require valid api_key |
| **Security** | HTTPS | Required in production; enforced by Nginx reverse proxy |
| **Scalability** | Concurrent staff users | ≥ 50 concurrent (single-city scale) |
| **Maintainability** | API documentation | 100% of endpoints documented in OpenAPI spec |
| **Maintainability** | Schema versioning | All schema changes via Flyway versioned migrations |
| **Browser Support** | Target browsers | Chrome, Firefox, Safari, Edge — latest 2 versions |
| **Mobile** | Minimum viewport | 375 px wide; all features functional |

---

## 7. Success Metrics

**Feature Parity**
- 100% of PHP application screens have a React equivalent (verified by screen-by-screen audit)
- 0 Open311 API compatibility regressions (verified by Open311 client integration test suite)

**Accessibility**
- WCAG 2.1 AA automated scan score: 0 critical or serious violations (axe-core)
- Manual keyboard-navigation audit passes for all core workflows

**Performance**
- Case list P95 load ≤ 2 s measured in Lighthouse (desktop)
- PostgreSQL full-text search query P95 ≤ 500 ms under load test with representative dataset

**Data Integrity**
- Row count equality between MySQL export and PostgreSQL import for all 18 tables (verified by migration validation script)
- 0 foreign key constraint violations in PostgreSQL after migration

**Developer Experience**
- All Spring Boot endpoints documented in OpenAPI spec (100% controller method coverage)
- Flyway migration history contains the complete schema — a clean PostgreSQL instance can be bootstrapped from scratch via `flyway migrate`

**User Experience**
- Dark mode renders without contrast violations (automated scan)
- Framer Motion animations pass `prefers-reduced-motion` smoke tests

---

## 8. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Open311 API response format divergence from PHP implementation | Medium | Critical | Generate golden-file integration tests from existing PHP app responses before migration; run against Spring Boot implementation |
| PostgreSQL full-text search behavior diverges from Solr (relevance, stemming) | Medium | High | Create search result comparison test suite using representative queries against both systems; tune tsvector weights iteratively |
| MySQL → PostgreSQL data type mapping errors (e.g., TINYINT(1) vs BOOLEAN) | Low | High | Script automated row count and data type validation; run Flyway on copy of production data before cutover |
| Flyway migration conflicts during iterative development | Low | Medium | Enforce branch-based migration numbering discipline; use Flyway repair only in non-production environments |
| CAS/LDAP integration complexity with Spring Security | Medium | High | Prototype auth flow in isolated Spring Boot app early in development; validate against real LDAP/CAS before UI development begins |
| Mapbox API key unavailability in some environments | Low | Low | Implement Leaflet as first-class fallback; map widget degrades gracefully without Mapbox key |
| shadcn/ui component customization scope exceeding estimates | Medium | Medium | Scope to 12 core components first; defer cosmetic polish to post-MVP |
| Framer Motion animation performance on low-end mobile devices | Low | Low | Throttle animation complexity on mobile; prefers-reduced-motion disables all motion as hard fallback |
| JWT secret key rotation impact on active sessions | Low | Medium | Implement short expiry + refresh token pattern from day one; do not use long-lived non-revocable tokens |

---

## 9. Feature Index

| ID | Feature | Priority | Category | Notes |
|---|---|---|---|---|
| F0 | Open311 / GeoReport v2 API | P0 | API / Hard Constraint | Frozen contract; external clients |
| F1 | Ticket / Case Lifecycle Management | P0 | Core Business Logic | Create, assign, update, close, reopen |
| F2 | Public Case Submission Form | P0 | Public UI | Multi-step wizard, map pin-drop |
| F3 | Case List with Search, Filtering, Sorting | P0 | Staff UI | Live search, filter chips, bulk ops |
| F4 | Case Detail View | P0 | Staff UI | Split-pane, timeline, inline transitions |
| F9 | Action / Response Logging + Email Notifications | P0 | Core Business Logic | Audit trail, email comms |
| F11 | PostgreSQL Full-Text Search (Solr Replacement) | P0 | Infrastructure | GIN index, tsvector/tsquery |
| F12 | Authentication — LDAP and CAS | P0 | Security | JWT issuance, branded login |
| F17 | Design System and UI Framework | P0 | Frontend Foundation | Tailwind, shadcn/ui, dark mode |
| F18 | Navigation Shell | P0 | Frontend Foundation | Navbar, sidebar, breadcrumbs, mobile drawer |
| F19 | Accessibility and Responsive Design | P0 | Quality / Compliance | WCAG 2.1 AA, Section 508 |
| F21 | Database Migration — MySQL to PostgreSQL | P0 | Infrastructure | Flyway, 18 tables, 0 data loss |
| F5 | Dashboard | P1 | Staff UI | Stat cards, map widget, donut chart |
| F6 | People Management | P1 | Admin Panel | Staff, reporters, contacts |
| F7 | Department Management | P1 | Admin Panel | Departments, default assignee |
| F8 | Category and Category Group Management | P1 | Admin Panel | Category taxonomy |
| F10 | Media / Photo Attachment Upload | P1 | Core Business Logic | Multi-file, lightbox |
| F13 | Admin Panels — Substatus, Issue Types, Templates, Contact Methods | P1 | Admin Panel | Lookup table CRUD |
| F14 | Client / API Key Management | P1 | Admin Panel | Open311 client registration |
| F20 | OpenAPI / Swagger Documentation | P1 | Developer Experience | 100% endpoint coverage |
| F15 | Metrics and Reporting | P2 | Reporting | Volume, resolution time, breakdowns |
| F16 | Geo-Clustering for Map Views | P2 | Maps | Clustered pins, geoclusters table |

---

## 10. Out of Scope

The following are explicitly excluded from this modernization project. Any request to include these items must go through a separate product decision:

- Changing any Open311 / GeoReport v2 endpoint path, HTTP method, query parameter, or response format
- Dropping any database table or column from the migrated PostgreSQL schema
- Removing any UI screen, admin panel, or user-facing feature present in the PHP application
- Changing the case / ticket / people / location domain model (entity relationships or semantics)
- Introducing new features not present in the original PHP application (e.g., new report types, new notification channels, new integrations)
- Replacing the Docker Compose deployment topology with Kubernetes or other orchestration

---

## 11. Related Documents

- `FRD-UReport.md` — Functional Requirements Document (screen-level flows, API contracts)
- `TechArch-UReport.md` — Technical Architecture Document (Spring Boot layer design, DB schema, deployment)
- `UserStories-UReport.md` — User Stories (acceptance criteria per feature)
- `crm/scripts/mysql.sql` — Authoritative source MySQL schema
- `crm/src/Application/Controllers/Open311Controller.php` — Existing Open311 implementation (golden reference)
- `docker-compose.yml` — Existing deployment configuration

---

*PRD-UReport.md — uReport CRM Modernization v1.0 — 2026-07-06*
