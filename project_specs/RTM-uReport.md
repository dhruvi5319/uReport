# Requirements Traceability Matrix: uReport Modernization

**Project:** uReport CRM — Municipal Constituent Issue Tracking System  
**Acronym:** uReport  
**RTM Version:** 1.0  
**Date:** 2026-06-24  
**Status:** Active  

---

## 1. Overview

This Requirements Traceability Matrix (RTM) provides bidirectional traceability between all uReport Modernization specification documents. It ensures that every product requirement is implemented through a defined functional specification, supported by a technical architecture component, covered by user stories, and testable through acceptance criteria. The RTM spans 21 feature areas (F0–F20), 12 non-functional requirements (NFR-1–NFR-12), 63 user stories (US-0.1 through US-20.2), and all architectural specifications defined in the TechArch document.

The traceability chain follows the direction: **PRD Feature → FRD Functional Requirement → TechArch Specification → User Story → Test Coverage**. Bidirectional links are maintained in each table section to allow impact analysis from any direction — a change to a PRD feature can immediately surface all affected FRD requirements, architecture components, and user stories; and conversely, a proposed code-level change in a specific service class can be traced back to the originating PRD feature and its priority level.

The project is a **1:1 brownfield migration** (PHP/MySQL/Solr → React 18 + Java 21 Spring Boot + PostgreSQL 16). All 21 features are required; no features are optional. Priority levels (P0 Critical, P1 High, P2 Medium) govern release sequencing (R1, R2, R3) but not scope — all features must be delivered before the legacy stack is decommissioned.

---

## 2. Requirements Summary

### 2.1 PRD Features by Priority

- **P0 — Critical (7 features, R1):** F0 Ticket Lifecycle, F1 Ticket History, F2 Open311 API, F3 Role-Based Access Control, F4 Authentication (JWT), F11 Full-Text Search, F18 Multi-Format Output
- **P1 — High (9 features, R2):** F5 People Management, F6 Department Administration, F7 Category Management, F8 Substatus System, F9 Action Types & Response Templates, F10 Media Upload, F13 API Client Management, F15 Location & Geo-Clusters, F16 Digest Email Notifications
- **P2 — Medium (5 features, R3):** F12 Bookmarks, F14 Contact Method Tracking, F17 Metrics & Reporting, F19 Issue Type Management, F20 Response Templates

### 2.2 FRD Functional Specifications Summary

- **21 feature sections** (F00–F20) each defining sub-features, process flows, inputs, outputs, validation rules, error states, API surface, and schema surface
- **Cross-feature sections:** Y0a–Y0d (Database Schema), Y1a–Y1c (REST API Full Spec), Y2 (Error Catalog), Y3 (Integration Points)
- **API endpoints defined:** 60+ REST endpoints across `/api/v1/` and `/open311/` namespaces
- **Database tables defined:** 24 PostgreSQL tables with full DDL (including indexes, constraints, seed data, FTS triggers, and geo-sync triggers)
- **Error codes catalogued:** Covers CATEGORY_NOT_FOUND, TICKET_NOT_FOUND, PERMISSION_DENIED, AUTH_FAILED, API_KEY_INVALID, and 30+ additional error states

### 2.3 TechArch Specifications Summary

- **Three-tier architecture:** React 18 SPA (Nginx) → Spring Boot 3.x REST API → PostgreSQL 16 + PostGIS
- **Backend components:** 19 REST controllers, 15 service classes, 4 scheduler classes, 17 repository interfaces, 23 JPA entity classes
- **Frontend components:** 8 page groups, 15 component groups, 4 custom hooks, Zustand/Redux state management
- **Infrastructure:** 4 Docker containers (`db`, `api`, `web`, `mailhog`), single `docker-compose.yml`
- **Security:** `JwtAuthenticationFilter`, `ApiKeyAuthenticationFilter`, `JwtTokenProvider`, `PermissionEvaluator`
- **Cross-cutting:** `Open311XmlSerializer`, `TemplateVariableResolver`, `CsvExportUtil`, `GeoClusterScheduler`

### 2.4 User Stories Summary

- **63 total stories** across 21 epics (US-0.1 through US-20.2)
- **25 P0 stories** → Release 1 (MVP Critical)
- **27 P1 stories** → Release 2 (Full Operations)
- **11 P2 stories** → Release 3 (Productivity & Visibility)
- **4 personas:** PER-01 Marcus Webb (Case Worker), PER-02 Diana Reyes (Dept Admin), PER-03 Jordan Kim (Sys Admin), PER-04 Integra (External API Client)

### 2.5 Non-Functional Requirements Summary

- **NFR-1:** Open311 GeoReport v2 JSON/XML byte-compatibility
- **NFR-2:** MySQL → PostgreSQL 1:1 data fidelity (all FKs, constraints, enums preserved)
- **NFR-3:** Role names (`staff`, `public`, `anonymous`) and permission semantics preserved exactly
- **NFR-4:** PostgreSQL FTS search result equivalence with Solr (≥95% overlap on defined corpus)
- **NFR-5:** `docker-compose` interface preserved (same service names, ports, volumes)
- **NFR-6:** Ticket search ≤500ms p95 at 500k tickets
- **NFR-7:** Rolling restarts via Docker without data loss
- **NFR-8:** JWT RS256/HS256 signing; API keys stored hashed; all inputs validated
- **NFR-9:** ≥80% unit test coverage on service layer; ≥90% on Open311 controller
- **NFR-10:** All HTTP requests, auth events, and scheduler jobs logged with timestamp, user, and outcome
- **NFR-11:** React SPA requires no changes to external Open311 consumers
- **NFR-12:** PostgreSQL configured with PostGIS for spatial indexing

---

## 3. Full Traceability Matrix

> **Column guide:**
> - **PRD Feature:** Feature ID and name from PRD Section 5
> - **Priority:** P0/P1/P2 from PRD
> - **FRD Section:** Functional specification section in FRD
> - **FRD Key Processes:** Primary sub-features / process flows defined in FRD
> - **TechArch Components:** Spring Boot classes and React components from TechArch Section 01
> - **DB Tables:** PostgreSQL tables from TechArch Section 02 / FRD schema surfaces
> - **API Endpoints:** REST endpoints from FRD API surfaces
> - **User Stories:** Story IDs from UserStories document
> - **Release:** Delivery increment

### 3.1 P0 Features — Release 1

| PRD Feature | Priority | FRD Section | FRD Key Processes | TechArch Components | DB Tables | Key API Endpoints | User Stories | Release |
|-------------|----------|-------------|-------------------|---------------------|-----------|-------------------|--------------|---------|
| **F0: Ticket / Case Lifecycle Management** | P0 | F00 | Create, Assign, Update, Close, Duplicate, Reopen, Comment, Export | `TicketController`, `TicketService`, `TicketRepository`, `Ticket.java`, `TicketListPage.tsx`, `TicketDetailPage.tsx`, `CreateTicketPage.tsx` | `tickets`, `ticketHistory`, `substatus`, `categories`, `people`, `contactMethods`, `issueTypes` | `POST /api/v1/tickets`, `PATCH /api/v1/tickets/{id}`, `PATCH /api/v1/tickets/{id}/assign`, `PATCH /api/v1/tickets/{id}/close`, `PATCH /api/v1/tickets/{id}/reopen`, `PATCH /api/v1/tickets/{id}/duplicate`, `POST /api/v1/tickets/{id}/comments`, `DELETE /api/v1/tickets/{id}` | US-0.1, US-0.2, US-0.3, US-0.4, US-0.5, US-0.6, US-0.7, US-0.8 | R1 |
| **F1: Ticket History and Action Log** | P0 | F01 | Append history entry, Render template variables, Display history log | `TicketHistoryController`, `TicketHistoryService`, `TicketHistoryRepository`, `TicketHistory.java`, `TemplateVariableResolver`, `TicketHistoryList.tsx` | `ticketHistory`, `actions` | `GET /api/v1/tickets/{id}/history`, `GET /api/v1/tickets/{id}/history/{historyId}` | US-1.1, US-1.2, US-1.3 | R1 |
| **F2: Open311 GeoReport v2 REST API** | P0 | F02 | Discovery, List Services, Get Service Attributes, Submit Request, List Requests, Get Single Request | `Open311DiscoveryController`, `Open311ServicesController`, `Open311RequestsController`, `Open311MappingService`, `Open311XmlSerializer`, `Open311ServiceList.tsx` | `tickets`, `categories`, `categoryGroups`, `clients`, `people`, `media`, `substatus` | `GET /open311/discovery`, `GET /open311/services`, `GET /open311/services/{service_code}`, `POST /open311/requests`, `GET /open311/requests`, `GET /open311/requests/{service_request_id}` | US-2.1, US-2.2, US-2.3, US-2.4, US-2.5, US-2.6 | R1 |
| **F3: Role-Based Access Control (RBAC)** | P0 | F03 | Role-based endpoint guards, Per-category display/posting permission, Admin/export gating | `SecurityConfig`, `PermissionEvaluator`, `JwtUserDetails.java`, `usePermission.ts` | `people` (role field), `categories` (displayPermissionLevel, postingPermissionLevel) | (Cross-cutting — applied on all protected endpoints) | US-3.1, US-3.2, US-3.3 | R1 |
| **F4: Authentication — JWT / Spring Security** | P0 | F04 | Staff Login, Token Refresh, Logout, Token Validation, OAuth Callback, API Key Auth | `AuthController`, `CallbackController`, `JwtAuthenticationFilter`, `ApiKeyAuthenticationFilter`, `JwtTokenProvider`, `AuthService`, `LoginPage.tsx`, `CallbackPage.tsx` | `people`, `refresh_tokens`, `token_blacklist`, `clients` | `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /callback` | US-4.1, US-4.2, US-4.3, US-4.4 | R1 |
| **F11: Full-Text Search (PostgreSQL FTS)** | P0 | F11 | FTS index maintenance, Keyword search, Multi-field filtering, Paginated results, Map view output, CSV/print export | `TicketSearchController`, `TicketSearchService`, `TicketRepository`, `CsvExportUtil`, `TicketListPage.tsx`, `TicketMapPage.tsx`, `TicketSearchFilters.tsx` | `tickets` (search_vector TSVECTOR, GIN index), `ticket_geodata`, `geoclusters` | `GET /api/v1/tickets?q=`, `GET /api/v1/tickets?format=csv`, `GET /api/v1/tickets?view=map` | US-11.1, US-11.2, US-11.3 | R1 |
| **F18: Multi-Format Output Feeds** | P0 | F18 | JSON output, XML output (byte-compatible), CSV export, HTML/print output, TXT output, Content negotiation via `format` param | `Open311XmlSerializer`, `CsvExportUtil`, `WebMvcConfig` (content negotiation), `FormatFilter` | (Cross-cutting — all endpoints supporting `?format=`) | `?format=json`, `?format=xml`, `?format=csv`, `?format=print`, `?format=txt` on applicable endpoints | US-18.1, US-18.2 | R1 |

### 3.2 P1 Features — Release 2

| PRD Feature | Priority | FRD Section | FRD Key Processes | TechArch Components | DB Tables | Key API Endpoints | User Stories | Release |
|-------------|----------|-------------|-------------------|---------------------|-----------|-------------------|--------------|---------|
| **F5: People / Contact Management** | P1 | F05 | Create/Read/Update/Delete person, Manage emails/phones/addresses, Search people, View person's tickets | `PeopleController`, `PersonService`, `PersonRepository`, `Person.java`, `PeopleEmail.java`, `PeoplePhone.java`, `PeopleAddress.java`, `PeopleListPage.tsx`, `PersonDetailPage.tsx` | `people`, `peopleEmails`, `peoplePhones`, `peopleAddresses` | `POST /api/v1/people`, `GET /api/v1/people`, `GET /api/v1/people/{id}`, `PUT /api/v1/people/{id}`, `DELETE /api/v1/people/{id}`, `GET /api/v1/people/{id}/tickets` | US-5.1, US-5.2, US-5.3, US-5.4 | R2 |
| **F6: Department Administration** | P1 | F06 | Create/Read/Update/Delete departments, Assign default person, Associate categories and action types | `DepartmentController`, `DepartmentService`, `DepartmentRepository`, `Department.java`, `DepartmentsPage.tsx` | `departments`, `department_actions`, `department_categories` | `POST /api/v1/departments`, `GET /api/v1/departments`, `GET /api/v1/departments/{id}`, `PUT /api/v1/departments/{id}`, `DELETE /api/v1/departments/{id}` | US-6.1, US-6.2 | R2 |
| **F7: Category and Category-Group Management** | P1 | F07 | Create/Read/Update/Delete categories, Configure SLA/permissions/custom fields, Manage category groups, Configure auto-close rules | `CategoryController`, `CategoryGroupController`, `CategoryService`, `CategoryRepository`, `Category.java`, `CategoryGroup.java`, `CategoriesPage.tsx`, `CustomFieldsForm.tsx` | `categories`, `categoryGroups` | `POST /api/v1/categories`, `GET /api/v1/categories`, `GET /api/v1/categories/{id}`, `PUT /api/v1/categories/{id}`, `DELETE /api/v1/categories/{id}`, `POST /api/v1/category-groups`, `GET /api/v1/category-groups/{id}/categories` | US-7.1, US-7.2, US-7.3 | R2 |
| **F8: Substatus System** | P1 | F08 | Create/Read/Update/Delete substatuses, Default substatus maintenance, Assign substatus to ticket lifecycle | `SubstatusController`, `SubstatusService`, `SubstatusRepository`, `Substatus.java`, `SubstatusPage.tsx` | `substatus` | `POST /api/v1/substatuses`, `GET /api/v1/substatuses`, `PUT /api/v1/substatuses/{id}`, `DELETE /api/v1/substatuses/{id}` | US-8.1, US-8.2 | R2 |
| **F9: Action Types and Response Templates** | P1 | F09 | Create/Read/Update/Delete actions, Category action response overrides, Template variable rendering | `ActionController`, `ActionService`, `ActionRepository`, `Action.java`, `CategoryActionResponse.java`, `TemplateVariableResolver`, `ActionsPage.tsx` | `actions`, `category_action_responses`, `department_actions` | `POST /api/v1/actions`, `GET /api/v1/actions`, `PUT /api/v1/actions/{id}`, `DELETE /api/v1/actions/{id}`, `POST /api/v1/categories/{id}/action-responses` | US-9.1, US-9.2, US-9.3 | R2 |
| **F10: Media / Attachment Upload and Thumbnail Caching** | P1 | F10 | Upload files, Store file metadata, Generate/cache thumbnails, Serve files, Record upload history | `MediaController`, `MediaService`, `MediaRepository`, `Media.java`, `MediaUploader.tsx` | `media` | `POST /api/v1/tickets/{id}/media`, `GET /api/v1/media/{id}`, `GET /api/v1/media/{id}/thumbnail` | US-10.1, US-10.2 | R2 |
| **F13: API Client Management** | P1 | F13 | Create/Read/Update/Delete clients, API key hashing/generation, API key validation, Key rotation | `ClientController`, `ClientService`, `ClientRepository`, `Client.java`, `ApiKeyHashUtil`, `ClientsPage.tsx` | `clients` | `POST /api/v1/clients`, `GET /api/v1/clients`, `GET /api/v1/clients/{id}`, `PUT /api/v1/clients/{id}`, `DELETE /api/v1/clients/{id}` | US-13.1, US-13.2 | R2 |
| **F15: Location / Address Management and Geo-Cluster Analysis** | P1 | F15 | Capture geo coordinates, AddressService integration, Canonical locations registry, Geo-cluster rebuild job, Map view, Location-based search | `LocationController`, `GeoService`, `GeoClusterScheduler`, `GeoClusterRepository`, `TicketGeoDataRepository`, `Location.java`, `GeoCluster.java`, `TicketGeoData.java`, `TicketMap.tsx` | `locations`, `geoclusters`, `ticket_geodata`, `tickets` (geo_point GEOGRAPHY) | `GET /api/v1/locations`, `POST /api/v1/locations`, `GET /api/v1/tickets?lat=&long=&radius=`, `GET /api/v1/admin/jobs/geo-cluster/run` | US-15.1, US-15.2, US-15.3 | R2 |
| **F16: Digest Email Notifications** | P1 | F16 | Scheduled digest job, Notification email rendering, Auto-close scheduler, Audit scheduler | `DigestNotificationScheduler`, `AutoCloseScheduler`, `AuditScheduler`, `NotificationService`, `AdminJobController`, `SchedulerConfig` | `ticketHistory` (sentNotifications), `categories` (notificationReplyEmail, autoCloseIsActive), `peopleEmails` (usedForNotifications) | `GET /api/v1/admin/jobs/digest/run`, `GET /api/v1/admin/jobs/auto-close/run`, `GET /api/v1/admin/jobs/audit/run` | US-16.1, US-16.2, US-16.3 | R2 |

### 3.3 P2 Features — Release 3

| PRD Feature | Priority | FRD Section | FRD Key Processes | TechArch Components | DB Tables | Key API Endpoints | User Stories | Release |
|-------------|----------|-------------|-------------------|---------------------|-----------|-------------------|--------------|---------|
| **F12: Bookmarks (Staff Saved Searches)** | P2 | F12 | Create bookmark, List bookmarks, Delete bookmark, Navigate to bookmark | `BookmarkController`, `BookmarkRepository`, `Bookmark.java`, `BookmarksPage.tsx`, `Sidebar.tsx` | `bookmarks` | `POST /api/v1/bookmarks`, `GET /api/v1/bookmarks`, `DELETE /api/v1/bookmarks/{id}` | US-12.1, US-12.2, US-12.3 | R3 |
| **F14: Contact Method Tracking** | P2 | F14 | Seed contact methods, Record submission/response method on ticket, Filter by contact method | `ContactMethodController`, `ContactMethodRepository`, `ContactMethod.java`, `ContactMethodsPage.tsx` | `contactMethods` | `GET /api/v1/contact-methods`, `POST /api/v1/contact-methods` | US-14.1 | R3 |
| **F17: Metrics and Reporting Dashboard** | P2 | F17 | `onTimePercentage` calculation, Activity/Assignments/Categories/Staff/Person/SLA/Volume/Current/Opened/Closed reports | `MetricsController`, `MetricsService`, `MetricsDashboardPage.tsx`, `ReportsPage.tsx` | `tickets`, `ticketHistory`, `categories` | `GET /api/v1/metrics`, `GET /api/v1/reports/activity`, `GET /api/v1/reports/assignments`, `GET /api/v1/reports/categories`, `GET /api/v1/reports/staff`, `GET /api/v1/reports/sla`, `GET /api/v1/reports/volume` | US-17.1, US-17.2 | R3 |
| **F19: Issue Type Management** | P2 | F19 | Seed issue types, Assign to ticket, Filter by issue type, Admin CRUD | `IssueTypeController`, `IssueTypeRepository`, `IssueType.java` | `issueTypes` | `GET /api/v1/issue-types`, `POST /api/v1/issue-types`, `PUT /api/v1/issue-types/{id}`, `DELETE /api/v1/issue-types/{id}` | US-19.1, US-19.2 | R3 |
| **F20: Response Templates** | P2 | F20 | Create/Read/Update/Delete response templates, Associate with action type, Select template when recording response | `ResponseTemplateController`, `ResponseTemplateRepository`, `ResponseTemplate.java` | `responseTemplates` | `POST /api/v1/response-templates`, `GET /api/v1/response-templates`, `PUT /api/v1/response-templates/{id}`, `DELETE /api/v1/response-templates/{id}` | US-20.1, US-20.2 | R3 |

---

## 4. Non-Functional Requirements Traceability

| NFR ID | Category | Requirement | FRD Reference | TechArch Reference | User Story / Acceptance Criteria | Release |
|--------|----------|-------------|---------------|--------------------|----------------------------------|---------|
| NFR-1 | Compatibility | Open311 JSON/XML response payloads byte-compatible with legacy PHP | F02 (all output specs), F18 | `Open311XmlSerializer`, `Open311MappingService`, `WebMvcConfig` content negotiation | US-2.4 AC: "JSON and XML response shapes byte-compatible"; US-18.1 AC: "XML CDATA handling...match legacy PHP output exactly" | R1 |
| NFR-2 | Data Fidelity | MySQL → PostgreSQL 1:1 DDL mapping (all FKs, constraints, enums) | Y0a–Y0d schema sections | TechArch Section 02 DDL, MySQL→PostgreSQL type mapping table | US-5.1, US-7.1, US-8.1 (all schema-backed features) | R1 |
| NFR-3 | Auth Preservation | Role names `staff`/`public`/`anonymous` preserved exactly | F03 (permission matrix), F04 | `JwtUserDetails.java` role claim, `PermissionEvaluator`, `people.role CHECK` constraint | US-3.1 AC: "Role is read from the `role` claim in the JWT and evaluated server-side" | R1 |
| NFR-4 | Search Equivalence | PostgreSQL FTS ≥95% result overlap with Solr on defined test corpus | F11 (search equivalence requirement) | `TicketSearchService`, `tickets.search_vector TSVECTOR`, GIN index, `tickets_fts_update()` trigger | US-11.1 AC: "Search results are equivalent to current Solr output (≥95% overlap)" | R1 |
| NFR-5 | Deployment | `docker-compose` interface preserved (same service names, ports, volumes) | Y3 (integration points) | `docker-compose.yml` (services: db, api, web, mailhog; ports: 5432, 8080, 80/443) | US-15.2 AC: "Spring Scheduler job replaces legacy cron"; Jordan's success criteria: docker-compose up < 10 min | R1 |
| NFR-6 | Performance | Ticket search ≤500ms p95 at 500k tickets | F11 (performance requirement) | `TicketSearchService`, GIN index on `search_vector`, GIST index on `geo_point`, `HikariConfig` | US-11.1 AC: "returned in under 500ms for datasets up to 500,000 tickets" | R1 |
| NFR-7 | Availability | Rolling restarts via Docker without data loss | (deployment section) | Docker `volumes: pgdata`, `media` persistent volumes; Spring Boot graceful shutdown | US-15.2 (scheduled job logging ensures no silent failures during restart) | R1 |
| NFR-8 | Security | JWT RS256/HS256 signed; API keys hashed at rest; all inputs validated | F04 (JWT signing config), F13 (API key hashing) | `JwtConfig`, `ApiKeyHashUtil` (SHA-256 lookup + BCrypt storage), `GlobalExceptionHandler` input validation | US-4.1 AC: "JWT algorithm HS256 or RS256; min key 256 bits"; US-13.1 AC: "api_key stored hashed; plain-text key returned only at creation" | R1 |
| NFR-9 | Testability | ≥80% service layer unit test coverage; ≥90% Open311 controller coverage | F02 (integration test requirement) | JUnit 5 + Spring Boot Test; Open311 fixture comparison tests in `Open311IntegrationTest` | US-2.4, US-2.5, US-2.6 (all Open311 endpoints require integration tests) | R1 |
| NFR-10 | Logging | All HTTP requests, auth events, and scheduler jobs logged (timestamp, user, outcome) | F04 (auth logging), F16 (scheduler logging) | Structured log format: `[AUTH]`, `[SCHEDULER]`, `[API_KEY]` entries; Spring Boot actuator / Logback | US-16.1 AC: "Spring Scheduler digest job runs on configurable interval"; US-16.3 AC: "Audit results are written to logs with timestamp, job name, and findings" | R2 |
| NFR-11 | Backward Compatibility | React SPA requires no changes to external Open311 consumers | F02, F18 | Nginx proxy: `/open311/*` → `api:8080`; path boundaries preserved | US-2.1–2.6, US-18.1 (all Open311 endpoint stories) | R1 |
| NFR-12 | Geo Support | PostgreSQL with PostGIS for spatial indexing | F15 (geo-cluster specification) | `postgis/postgis:16-3.4` Docker image; `GEOGRAPHY(POINT, 4326)` on tickets and locations; `ST_DWithin` for radius queries; `GeoClusterScheduler` | US-15.2 AC: "Spatial queries run against PostGIS or equivalent spatial index"; US-15.3 AC: "Spatial queries run against PostGIS...for performance" | R2 |

---

## 5. Requirements Detail — PRD Features with FRD Requirement Mapping

### F0: Ticket / Case Lifecycle Management

**PRD Priority:** P0 | **FRD Section:** F00 | **Release:** R1

**FRD Sub-requirements:**
- **F00.1** Create Ticket — POST `/api/v1/tickets` with category, description, location, reporter; validates category active + posting permission; auto-creates person if email provided; creates open ticket with default substatus; appends "open" history entry; returns 201
- **F00.2** Assign Ticket — PATCH `/api/v1/tickets/{id}/assign`; validates ticket open and target is staff; updates assignedPerson_id; appends "assignment" history; schedules digest notification
- **F00.3** Update Ticket — PATCH `/api/v1/tickets/{id}`; staff only; records changeCategory/changeLocation/update history entries with original/updated data in `data` JSONB
- **F00.4** Close Ticket — PATCH `/api/v1/tickets/{id}/close`; requires closed-type substatus_id; sets status=closed, closedDate=NOW(); appends "closed" history; schedules notification
- **F00.5** Mark Duplicate — PATCH `/api/v1/tickets/{id}/duplicate`; validates parent exists and no circular parentage; sets parent_id, status=closed with Duplicate substatus; appends "duplicate" history
- **F00.6** Reopen Ticket — PATCH `/api/v1/tickets/{id}/reopen`; validates ticket is closed; sets status=open, clears closedDate, assigns default open substatus; appends "update" history
- **F00.7** Record Comment — POST `/api/v1/tickets/{id}/comments`; appends "comment" history entry with notes
- **F00.8** Export — GET `/api/v1/tickets?format=csv` (staff only); StreamingResponseBody CSV; max 200 tickets in under 10 seconds

**User Stories:** US-0.1, US-0.2, US-0.3, US-0.4, US-0.5, US-0.6, US-0.7, US-0.8  
**Linked TechArch:** `TicketController`, `TicketService`, `TicketRepository`, `Ticket.java`, `CsvExportUtil`  
**Linked Tables:** `tickets`, `ticketHistory`, `substatus`, `categories`, `people`, `contactMethods`, `issueTypes`

---

### F1: Ticket History and Action Log

**PRD Priority:** P0 | **FRD Section:** F01 | **Release:** R1

**FRD Sub-requirements:**
- **F01.1** Append History Entry — called by service layer on every lifecycle event; inserts immutable `ticketHistory` row; entries cannot be updated or deleted by application layer
- **F01.2** Render Template Variables — `TemplateVariableResolver` resolves `{enteredByPerson}`, `{actionPerson}`, `{original:field}`, `{updated:field}`, `{duplicate:ticket_id}` at read time; unknown tokens left as-is
- **F01.3** Display History Log — GET `/api/v1/tickets/{id}/history`; ordered by `enteredDate ASC`; returns rendered descriptions; staff see all entries
- **F01.4** System Action Seed Data — 10 system actions (open, assignment, closed, changeCategory, changeLocation, response, duplicate, update, comment, upload_media) with templates; seeded at install; read-only
- **F01.5** Notification Tracking — `sentNotifications` field updated by `NotificationService` after digest emails sent

**User Stories:** US-1.1, US-1.2, US-1.3  
**Linked TechArch:** `TicketHistoryController`, `TicketHistoryService`, `TemplateVariableResolver`, `TicketHistory.java`  
**Linked Tables:** `ticketHistory`, `actions`

---

### F2: Open311 GeoReport v2 REST API

**PRD Priority:** P0 | **FRD Section:** F02 | **Release:** R1

**FRD Sub-requirements:**
- **F02.1** GET /open311/discovery — returns endpoint URLs, jurisdiction_id, changeset, formats; no auth; JSON + XML
- **F02.2** GET /open311/services — returns active postable categories as Open311 service objects; ordered by categoryGroups.ordering; JSON + XML; service_code filter supported
- **F02.3** GET /open311/services/{service_code} — returns single service with attributes array from categories.customFields schema; 404 if not found
- **F02.4** POST /open311/requests — validates api_key; obsolete key check; creates ticket via F00 logic; sets client_id; returns [{ service_request_id, service_notice, account_id }]
- **F02.5** GET /open311/requests — filter by service_request_id, service_code, status, start_date, end_date, lat, long, radius, keyword, page, per_page (default 50, max 200); JSON + XML
- **F02.6** GET /open311/requests/{id} — single request object; includes media_url if attachments; expected_datetime computed from slaDays; 404 if not found

**User Stories:** US-2.1, US-2.2, US-2.3, US-2.4, US-2.5, US-2.6  
**Linked TechArch:** `Open311DiscoveryController`, `Open311ServicesController`, `Open311RequestsController`, `Open311MappingService`, `Open311XmlSerializer`  
**Linked Tables:** `tickets`, `categories`, `categoryGroups`, `clients`, `people`, `media`, `substatus`

---

### F3: Role-Based Access Control (RBAC)

**PRD Priority:** P0 | **FRD Section:** F03 | **Release:** R1

**FRD Sub-requirements:**
- **F03.1** Three Permission Levels — `anonymous` (unauthenticated), `public` (role='public'), `staff` (role='staff'); hierarchy anonymous < public < staff
- **F03.2** Endpoint Guards — Spring Security `@PreAuthorize` or `PermissionEvaluator`; staff-only endpoints return 403 for public/anonymous; 401 for unauthenticated
- **F03.3** Per-Category Permission Enforcement — `displayPermissionLevel` and `postingPermissionLevel` checked against caller role in service layer
- **F03.4** Admin/Export Gating — departments, categories, people, clients, substatus, actions, exports, history, metrics all require `role='staff'`
- **F03.5** Open311 Write Gating — api_key validated (F13) + category postingPermissionLevel checked

**User Stories:** US-3.1, US-3.2, US-3.3  
**Linked TechArch:** `SecurityConfig`, `PermissionEvaluator`, `JwtUserDetails.java`, `usePermission.ts`  
**Linked Tables:** `people.role`, `categories.displayPermissionLevel`, `categories.postingPermissionLevel`

---

### F4: Authentication — JWT / Spring Security

**PRD Priority:** P0 | **FRD Section:** F04 | **Release:** R1

**FRD Sub-requirements:**
- **F04.1** Staff Login — POST `/api/v1/auth/login`; BCrypt password verify; issues JWT (1h, HS256/RS256) + refresh token (24h); returns {accessToken, refreshToken, expiresIn, role, personId}
- **F04.2** Token Refresh — POST `/api/v1/auth/refresh`; validates refresh token not expired/revoked; rotates (single-use); issues new pair
- **F04.3** Logout — POST `/api/v1/auth/logout`; revokes refresh token; blacklists access token jti in `token_blacklist`
- **F04.4** Token Validation Filter — `JwtAuthenticationFilter` validates signature, expiry, issuer, jti blacklist on every request
- **F04.5** OAuth Callback — GET `/callback`; validates CSRF state; exchanges code; maps IdP identity to people record; no auto-registration; issues JWT on match
- **F04.6** API Key Authentication — `ApiKeyAuthenticationFilter`; SHA-256 lookup then BCrypt verify against `clients.api_key_hash`; sets `ApiKeyPrincipal`

**User Stories:** US-4.1, US-4.2, US-4.3, US-4.4  
**Linked TechArch:** `AuthController`, `CallbackController`, `JwtAuthenticationFilter`, `ApiKeyAuthenticationFilter`, `JwtTokenProvider`, `AuthService`, `ApiKeyPrincipal.java`  
**Linked Tables:** `people` (username, passwordHash), `refresh_tokens`, `token_blacklist`, `clients`

---

### F5: People / Contact Management

**PRD Priority:** P1 | **FRD Section:** F05 | **Release:** R2

**FRD Sub-requirements:**
- **F05.1** Person CRUD — POST/GET/PUT/DELETE `/api/v1/people`; validates unique username; BCrypt hashes password; returns 409 USERNAME_CONFLICT on duplicate
- **F05.2** Child Record Management — peopleEmails (label, usedForNotifications), peoplePhones (label), peopleAddresses (label); create/update/delete per record
- **F05.3** People Search — GET `/api/v1/people?q=`; ILIKE on firstname, lastname, organization; JOIN email search on peopleEmails.email; filters: role, department_id, organization; paginated
- **F05.4** Person Tickets — GET `/api/v1/people/{id}/tickets`; returns tickets where reportedBy/assignedPerson/enteredBy = person_id; staff only
- **F05.5** Auto-Create from Open311 — creates people record from first_name, last_name, email, phone when Open311 POST does not match existing person by email

**User Stories:** US-5.1, US-5.2, US-5.3, US-5.4  
**Linked TechArch:** `PeopleController`, `PersonService`, `PersonRepository`, `Person.java`, `PeopleEmail.java`, `PeoplePhone.java`, `PeopleAddress.java`  
**Linked Tables:** `people`, `peopleEmails`, `peoplePhones`, `peopleAddresses`

---

### F6: Department Administration

**PRD Priority:** P1 | **FRD Section:** F06 | **Release:** R2

**FRD Sub-requirements:**
- **F06.1** Department CRUD — POST/GET/PUT/DELETE `/api/v1/departments`; name, optional defaultPerson_id (must be staff role); staff only
- **F06.2** Category-Department Associations — manage `department_categories` many-to-many; view all categories in a department
- **F06.3** Action-Department Associations — manage `department_actions` many-to-many; view available actions for department

**User Stories:** US-6.1, US-6.2  
**Linked TechArch:** `DepartmentController`, `DepartmentService`, `DepartmentRepository`, `Department.java`  
**Linked Tables:** `departments`, `department_categories`, `department_actions`

---

### F7: Category and Category-Group Management

**PRD Priority:** P1 | **FRD Section:** F07 | **Release:** R2

**FRD Sub-requirements:**
- **F07.1** Category CRUD — POST/GET/PUT/DELETE `/api/v1/categories`; name, description, department_id, categoryGroup_id, defaultPerson_id, active, featured, displayPermissionLevel, postingPermissionLevel, slaDays, notificationReplyEmail, autoCloseIsActive, autoCloseSubstatus_id, customFields (JSONB); custom fields live on next submission
- **F07.2** Category Group CRUD — POST/GET/PUT/DELETE `/api/v1/category-groups`; name, ordering; affects Open311 /services sort order
- **F07.3** Auto-Close Configuration — `autoCloseIsActive` + `slaDays` + `autoCloseSubstatus_id` per category; referenced by `AutoCloseScheduler`

**User Stories:** US-7.1, US-7.2, US-7.3  
**Linked TechArch:** `CategoryController`, `CategoryGroupController`, `CategoryService`, `Category.java`, `CategoryGroup.java`, `AutoCloseScheduler`  
**Linked Tables:** `categories`, `categoryGroups`

---

### F8: Substatus System

**PRD Priority:** P1 | **FRD Section:** F08 | **Release:** R2

**FRD Sub-requirements:**
- **F08.1** Substatus CRUD — POST/GET/PUT/DELETE `/api/v1/substatuses`; name, description, status (open/closed), isDefault; system substatuses (Open, Resolved, Duplicate, Bogus) seeded at install and protected from deletion
- **F08.2** Default Substatus Rule — only one substatus can be isDefault per parent status; setting new default clears previous
- **F08.3** Ticket Lifecycle Integration — closing requires closed-type substatus_id; reopening assigns default open substatus; ticket search filterable by substatus_id

**User Stories:** US-8.1, US-8.2  
**Linked TechArch:** `SubstatusController`, `SubstatusService`, `SubstatusRepository`, `Substatus.java`  
**Linked Tables:** `substatus`

---

### F9: Action Types and Response Templates

**PRD Priority:** P1 | **FRD Section:** F09 | **Release:** R2

**FRD Sub-requirements:**
- **F09.1** Action CRUD — POST/GET/PUT/DELETE `/api/v1/actions`; department-scoped; name, description template, optional email template, optional replyEmail; system actions read-only
- **F09.2** Category Action Response Overrides — POST `/api/v1/categories/{id}/action-responses`; per-category override of action template and replyEmail; used by digest notifications
- **F09.3** Template Variable Resolution — `TemplateVariableResolver` resolves {enteredByPerson}, {actionPerson}, {original:field}, {updated:field}, {duplicate:ticket_id} at read time; unknown tokens passed through

**User Stories:** US-9.1, US-9.2, US-9.3  
**Linked TechArch:** `ActionController`, `ActionService`, `TemplateVariableResolver`, `Action.java`, `CategoryActionResponse.java`  
**Linked Tables:** `actions`, `category_action_responses`, `department_actions`

---

### F10: Media / Attachment Upload and Thumbnail Caching

**PRD Priority:** P1 | **FRD Section:** F10 | **Release:** R2

**FRD Sub-requirements:**
- **F10.1** File Upload — POST `/api/v1/tickets/{id}/media`; stores filename, internalFilename, mime_type, uploaded, person_id in `media`; appends "upload_media" history entry; permission: staff always; public if category postingPermissionLevel allows
- **F10.2** File Serving — GET `/api/v1/media/{id}` serves original; GET `/api/v1/media/{id}/thumbnail` serves cached thumbnail; generated on first request if not cached
- **F10.3** Open311 Integration — first image URL returned as `media_url` in Open311 request response

**User Stories:** US-10.1, US-10.2  
**Linked TechArch:** `MediaController`, `MediaService`, `MediaRepository`, `Media.java`, `MediaUploader.tsx`  
**Linked Tables:** `media`

---

### F11: Full-Text Search (PostgreSQL FTS)

**PRD Priority:** P0 | **FRD Section:** F11 | **Release:** R1

**FRD Sub-requirements:**
- **F11.1** FTS Index — `search_vector TSVECTOR` column on `tickets`; GIN index; auto-updated by `tickets_fts_update()` trigger on INSERT/UPDATE; weighted: description(A), location(B), city(C), zip(D)
- **F11.2** Keyword Search — `websearch_to_tsquery` against `search_vector` via `@@` operator; returns results in under 500ms at 500k tickets
- **F11.3** Multi-Field Filtering — category_id, department_id, assignedPerson_id, enteredByPerson_id, status, substatus_id, contactMethod_id, client_id, enteredDate range, closedDate range, location, city, zip, lat/long radius (PostGIS ST_DWithin), issueType_id; AND logic
- **F11.4** Pagination — default 25; configurable via ?limit= and ?offset= or ?page=; unpaginated for export
- **F11.5** Map View — returns geo-clustered data from `ticket_geodata` at zoom levels 0–6

**User Stories:** US-11.1, US-11.2, US-11.3  
**Linked TechArch:** `TicketSearchController`, `TicketSearchService`, `TicketRepository`, `tickets.search_vector` (GIN index), `tickets_fts_update()` trigger  
**Linked Tables:** `tickets` (search_vector, geo_point), `ticket_geodata`, `geoclusters`

---

### F12: Bookmarks (Staff Saved Searches)

**PRD Priority:** P2 | **FRD Section:** F12 | **Release:** R3

**FRD Sub-requirements:**
- **F12.1** Create Bookmark — POST `/api/v1/bookmarks`; accepts name, requestUri (full search URI); linked to current staff user; type defaults to 'search'; staff only
- **F12.2** List Bookmarks — GET `/api/v1/bookmarks`; returns all bookmarks for current user; loads in under 2 seconds
- **F12.3** Delete Bookmark — DELETE `/api/v1/bookmarks/{id}`; owner-only; non-owner returns 403; non-existent returns 404 BOOKMARK_NOT_FOUND

**User Stories:** US-12.1, US-12.2, US-12.3  
**Linked TechArch:** `BookmarkController`, `BookmarkRepository`, `Bookmark.java`, `BookmarksPage.tsx`, `Sidebar.tsx`  
**Linked Tables:** `bookmarks`

---

### F13: API Client Management

**PRD Priority:** P1 | **FRD Section:** F13 | **Release:** R2

**FRD Sub-requirements:**
- **F13.1** Client CRUD — POST/GET/PUT/DELETE `/api/v1/clients`; name, url, api_key (stored dual-hashed: SHA-256 lookup + BCrypt storage), contactPerson_id, contactMethod_id; staff only
- **F13.2** API Key Generation — plain-text key returned only at creation; stored as api_key_hash (BCrypt) + api_key_lookup (SHA-256) for fast indexed lookup
- **F13.3** Key Rotation — PUT `/api/v1/clients/{id}` with new api_key; effective immediately without service restart; existing tickets retain client_id

**User Stories:** US-13.1, US-13.2  
**Linked TechArch:** `ClientController`, `ClientService`, `ClientRepository`, `Client.java`, `ApiKeyHashUtil`  
**Linked Tables:** `clients`

---

### F14: Contact Method Tracking

**PRD Priority:** P2 | **FRD Section:** F14 | **Release:** R3

**FRD Sub-requirements:**
- **F14.1** System Contact Methods — four seeded records: Email (1), Phone (2), Web Form (3), Other (4); isSystem=true; not deletable
- **F14.2** Ticket Contact Fields — contactMethod_id (submission channel) and responseMethod_id (preferred response) on ticket creation/update
- **F14.3** Search Filter — GET /api/v1/tickets?contactMethod_id= supported
- **F14.4** API Client Association — clients.contactMethod_id auto-populates ticket contactMethod_id when ticket submitted via that client

**User Stories:** US-14.1  
**Linked TechArch:** `ContactMethodController`, `ContactMethodRepository`, `ContactMethod.java`  
**Linked Tables:** `contactMethods`

---

### F15: Location / Address Management and Geo-Cluster Analysis

**PRD Priority:** P1 | **FRD Section:** F15 | **Release:** R2

**FRD Sub-requirements:**
- **F15.1** Location Capture — latitude, longitude, location, city, state, zip on tickets; geo_point GEOGRAPHY auto-synced by `tickets_geo_sync()` trigger
- **F15.2** AddressService Integration — `GeoService` normalizes addresses; canonical record stored in `locations`; tickets.addressId linked
- **F15.3** Geo-Cluster Rebuild — `GeoClusterScheduler` (@Scheduled nightly 2 AM); populates `geoclusters` (levels 0–6 center points) and `ticket_geodata` (cluster_id_0..6 per ticket); logged with timestamp and outcome
- **F15.4** Location-Based Search — lat+long+radius via ST_DWithin; city and zip string filters

**User Stories:** US-15.1, US-15.2, US-15.3  
**Linked TechArch:** `LocationController`, `GeoService`, `GeoClusterScheduler`, `Location.java`, `GeoCluster.java`, `TicketGeoData.java`, `TicketMap.tsx`  
**Linked Tables:** `locations`, `geoclusters`, `ticket_geodata`, `tickets` (geo_point)

---

### F16: Digest Email Notifications

**PRD Priority:** P1 | **FRD Section:** F16 | **Release:** R2

**FRD Sub-requirements:**
- **F16.1** Digest Notification Scheduler — `DigestNotificationScheduler` (@Scheduled every 5 min configurable); identifies ticketHistory entries with null sentNotifications and active email template; renders with template variables; sends to usedForNotifications emails; updates sentNotifications
- **F16.2** Auto-Close Scheduler — `AutoCloseScheduler` (@Scheduled nightly 1 AM); evaluates tickets where autoCloseIsActive=true AND lastModified < NOW()-slaDays AND status=open; closes with autoCloseSubstatus_id; appends "closed" history; logs count
- **F16.3** Audit Scheduler — `AuditScheduler` (@Scheduled weekly Sunday 3 AM); checks: closed tickets without closedDate, substatus-status mismatch, orphaned history, orphaned media, staff without username; logs findings

**User Stories:** US-16.1, US-16.2, US-16.3  
**Linked TechArch:** `DigestNotificationScheduler`, `AutoCloseScheduler`, `AuditScheduler`, `NotificationService`, `SchedulerConfig`  
**Linked Tables:** `ticketHistory` (sentNotifications), `categories` (notificationReplyEmail, autoCloseIsActive, slaDays), `peopleEmails` (usedForNotifications)

---

### F17: Metrics and Reporting Dashboard

**PRD Priority:** P2 | **FRD Section:** F17 | **Release:** R3

**FRD Sub-requirements:**
- **F17.1** Metrics Endpoint — GET `/api/v1/metrics?category_id=&numDays=&effectiveDate=`; returns onTimePercentage; staff only; loads in under 5 seconds
- **F17.2** Canned Reports — Activity, Assignments, Categories, Staff, Person, SLA, Volume, Current Open, Opened Today, Closed Today; each accepts date range and filter params; all require staff role

**User Stories:** US-17.1, US-17.2  
**Linked TechArch:** `MetricsController`, `MetricsService`, `MetricsDashboardPage.tsx`, `ReportsPage.tsx`  
**Linked Tables:** `tickets`, `ticketHistory`, `categories`

---

### F18: Multi-Format Output Feeds

**PRD Priority:** P0 | **FRD Section:** F18 | **Release:** R1

**FRD Sub-requirements:**
- **F18.1** JSON Output — default for all API endpoints; Jackson with explicit snake_case field mapping for Open311 endpoints
- **F18.2** XML Output — byte-compatible GeoReport v2 XML via `Open311XmlSerializer`; no JAXB; exact element names; `<?xml version="1.0" encoding="utf-8"?>` declaration
- **F18.3** CSV Output — `CsvExportUtil` via `StreamingResponseBody`; header row + one row per ticket; staff only
- **F18.4** HTML/Print Output — print-friendly HTML fragment; staff only
- **F18.5** Content Negotiation — `?format=` query param takes precedence over Accept header; invalid format returns 400 INVALID_FORMAT

**User Stories:** US-18.1, US-18.2  
**Linked TechArch:** `Open311XmlSerializer`, `CsvExportUtil`, `WebMvcConfig`, `FormatFilter`  
**Linked Tables:** (cross-cutting — no dedicated table)

---

### F19: Issue Type Management

**PRD Priority:** P2 | **FRD Section:** F19 | **Release:** R3

**FRD Sub-requirements:**
- **F19.1** System Issue Types — seeded at install: Comment(1), Complaint(2), Question(3), Report(4), Request(5), Violation(6); isSystem=true
- **F19.2** Ticket Classification — issueType_id optional on ticket create/update; invalid ID returns 422
- **F19.3** Issue Type CRUD — POST/PUT/DELETE `/api/v1/issue-types`; staff only; system types protected

**User Stories:** US-19.1, US-19.2  
**Linked TechArch:** `IssueTypeController`, `IssueTypeRepository`, `IssueType.java`  
**Linked Tables:** `issueTypes`

---

### F20: Response Templates

**PRD Priority:** P2 | **FRD Section:** F20 | **Release:** R3

**FRD Sub-requirements:**
- **F20.1** Response Template CRUD — POST/GET/PUT/DELETE `/api/v1/response-templates`; name, template text, action_id association; staff only
- **F20.2** Template Selection on Ticket — SPA presents templates filtered by action_id when recording a response; selected template pre-populates notes field; staff editable before submit

**User Stories:** US-20.1, US-20.2  
**Linked TechArch:** `ResponseTemplateController`, `ResponseTemplateRepository`, `ResponseTemplate.java`  
**Linked Tables:** `responseTemplates`

---

## 6. Test Case Coverage Matrix

This matrix maps each PRD feature to its user stories, the primary acceptance criteria categories, and the test coverage requirements derived from FRD error states, NFR-9, and story acceptance criteria.

| PRD Feature | Priority | User Stories | AC Count | Integration Tests Required | Unit Tests Required | Key Error States Tested | Coverage Target |
|-------------|----------|-------------|----------|---------------------------|--------------------|-----------------------------|-----------------|
| F0: Ticket Lifecycle | P0 | US-0.1–0.8 (8) | 45 | `POST /api/v1/tickets`, all PATCH lifecycle endpoints, CSV export | `TicketService` create/assign/close/reopen/duplicate | CATEGORY_NOT_FOUND, PERMISSION_DENIED, TICKET_NOT_FOUND, INVALID_SUBSTATUS, INVALID_TRANSITION, CIRCULAR_DUPLICATE, INVALID_ASSIGNEE, INVALID_COORDINATES, DESCRIPTION_REQUIRED | ≥80% service |
| F1: Ticket History | P0 | US-1.1–1.3 (3) | 12 | `GET /api/v1/tickets/{id}/history`, template variable resolution | `TicketHistoryService` append, `TemplateVariableResolver` | TICKET_NOT_FOUND, ACTION_NOT_FOUND, PERSON_NOT_FOUND, METHOD_NOT_ALLOWED (immutability) | ≥80% service |
| F2: Open311 API | P0 | US-2.1–2.6 (6) | 31 | All 6 Open311 endpoints JSON + XML; byte-level fixture comparison against legacy PHP | `Open311MappingService`, `Open311XmlSerializer` | API_KEY_INVALID, SERVICE_NOT_FOUND, PERMISSION_DENIED, INVALID_COORDINATES, INVALID_FORMAT, REQUEST_NOT_FOUND | ≥90% controller |
| F3: RBAC | P0 | US-3.1–3.3 (3) | 12 | All protected endpoint role boundaries; 401/403 matrix | `PermissionEvaluator`, `SecurityConfig` | UNAUTHORIZED, PERMISSION_DENIED (role), PERMISSION_DENIED (category display), PERMISSION_DENIED (category post) | ≥80% service |
| F4: Authentication | P0 | US-4.1–4.4 (4) | 22 | `POST /api/v1/auth/login`, refresh, logout, `GET /callback`; API key validation flow | `AuthService`, `JwtTokenProvider`, `ApiKeyAuthenticationFilter` | AUTH_FAILED, TOKEN_EXPIRED, TOKEN_INVALID, TOKEN_REVOKED, REFRESH_TOKEN_INVALID, OAUTH_STATE_INVALID, PERSON_NOT_FOUND, API_KEY_REQUIRED, API_KEY_INVALID | ≥80% service |
| F5: People Mgmt | P1 | US-5.1–5.4 (4) | 16 | `POST /api/v1/people`, search, tickets endpoint | `PersonService` create, search, auto-create from Open311 | USERNAME_CONFLICT, PERSON_NOT_FOUND | ≥80% service |
| F6: Department Admin | P1 | US-6.1–6.2 (2) | 8 | Department CRUD, category/action associations | `DepartmentService` CRUD, association management | DEPARTMENT_NOT_FOUND, PERMISSION_DENIED | ≥80% service |
| F7: Category Mgmt | P1 | US-7.1–7.3 (3) | 13 | Category CRUD, category group CRUD, auto-close config | `CategoryService` CRUD, `AutoCloseScheduler` job execution | CATEGORY_NOT_FOUND, INVALID_PERMISSION_LEVEL, SUBSTATUS_MISMATCH | ≥80% service |
| F8: Substatus | P1 | US-8.1–8.2 (2) | 8 | Substatus CRUD, ticket close/reopen with substatus | `SubstatusService` CRUD, default maintenance | SUBSTATUS_NOT_FOUND, INVALID_SUBSTATUS, INVALID_TRANSITION | ≥80% service |
| F9: Action Types | P1 | US-9.1–9.3 (3) | 12 | Action CRUD, category action responses, template variable rendering | `ActionService`, `TemplateVariableResolver` all variable types | ACTION_NOT_FOUND, PERMISSION_DENIED (system action modify) | ≥80% service |
| F10: Media Upload | P1 | US-10.1–10.2 (2) | 8 | `POST /api/v1/tickets/{id}/media`, serve original, serve thumbnail | `MediaService` upload, thumbnail generation | TICKET_NOT_FOUND, PERMISSION_DENIED (upload role), MEDIA_NOT_FOUND | ≥80% service |
| F11: FTS Search | P0 | US-11.1–11.3 (3) | 14 | Keyword search, multi-field filter combinations, map view response shape; performance at 500k rows | `TicketSearchService` query builder, pagination, geo filter | (performance: ≤500ms); search result equivalence test corpus | ≥80% service |
| F12: Bookmarks | P2 | US-12.1–12.3 (3) | 9 | Bookmark create, list, delete; ownership enforcement | `BookmarkController` CRUD, ownership check | BOOKMARK_NOT_FOUND, PERMISSION_DENIED (non-owner) | ≥80% service |
| F13: API Clients | P1 | US-13.1–13.2 (2) | 7 | Client create, key rotation; key validation post-rotation | `ClientService` CRUD, `ApiKeyHashUtil` hash/verify | CLIENT_NOT_FOUND, PERMISSION_DENIED | ≥80% service |
| F14: Contact Methods | P2 | US-14.1 (1) | 4 | Contact method filter on ticket search; ticket create with contactMethod_id | `ContactMethodController`, `TicketService` field assignment | CONTACT_METHOD_NOT_FOUND | ≥80% service |
| F15: Location & Geo | P1 | US-15.1–15.3 (3) | 10 | Address normalization, geo-cluster rebuild job, radius search | `GeoService`, `GeoClusterScheduler` job execution, `ST_DWithin` queries | LOCATION_NOT_FOUND, INVALID_COORDINATES | ≥80% service |
| F16: Notifications | P1 | US-16.1–16.3 (3) | 14 | Digest job sends emails, auto-close job closes tickets, audit job logs findings | `DigestNotificationScheduler`, `AutoCloseScheduler`, `AuditScheduler` | (scheduler: SUCCESS/FAILURE log entries); notification rendering | ≥80% service |
| F17: Metrics | P2 | US-17.1–17.2 (2) | 6 | Metrics endpoint, all 10 canned reports; staff-only enforcement | `MetricsService` onTimePercentage, report queries | PERMISSION_DENIED, INVALID_DATE_RANGE | ≥80% service |
| F18: Multi-Format | P0 | US-18.1–18.2 (2) | 10 | All Open311 endpoints JSON+XML; CSV/print/txt export; invalid format param | `Open311XmlSerializer` all elements, `CsvExportUtil` stream | INVALID_FORMAT; byte-level XML comparison against legacy fixtures | ≥90% controller |
| F19: Issue Types | P2 | US-19.1–19.2 (2) | 5 | Issue type CRUD; ticket create/update with issueType_id; search filter | `IssueTypeController`, `TicketService` issueType_id field | ISSUE_TYPE_NOT_FOUND, PERMISSION_DENIED (system type) | ≥80% service |
| F20: Response Templates | P2 | US-20.1–20.2 (2) | 6 | Template CRUD; template pre-populate on ticket response | `ResponseTemplateController`, SPA template picker | TEMPLATE_NOT_FOUND | ≥80% service |

**Total Stories:** 63 | **Total ACs (estimated):** ~266 | **Overall Test Coverage Target:** ≥80% Spring Boot service layer; ≥90% Open311 controller layer

---

## 7. Story-to-Spec Traceability Index

Compact lookup table: every user story ID mapped to its PRD feature, FRD section, primary TechArch component, and release.

| Story ID | Story Title | PRD Feature | FRD Section | TechArch Primary Component | Release |
|----------|-------------|-------------|-------------|---------------------------|---------|
| US-0.1 | Create a New Ticket | F0 | F00 (Create Ticket process) | `TicketService.createTicket()` | R1 |
| US-0.2 | Assign a Ticket to a Staff Member | F0 | F00 (Assign Ticket process) | `TicketService.assignTicket()` | R1 |
| US-0.3 | Update Ticket Fields | F0 | F00 (Update Ticket process) | `TicketService.updateTicket()` | R1 |
| US-0.4 | Close a Ticket with a Substatus | F0 | F00 (Close Ticket process) | `TicketService.closeTicket()` | R1 |
| US-0.5 | Mark a Ticket as a Duplicate | F0 | F00 (Mark Duplicate process) | `TicketService.markDuplicate()` | R1 |
| US-0.6 | Reopen a Closed Ticket | F0 | F00 (Reopen Ticket process) | `TicketService.reopenTicket()` | R1 |
| US-0.7 | Record a Comment on a Ticket | F0 | F00 (Record Comment process) | `TicketService.addComment()` | R1 |
| US-0.8 | Export Ticket Search Results | F0 | F00 (Export sub-feature) | `CsvExportUtil`, `TicketSearchController` | R1 |
| US-1.1 | View Full Ticket History | F1 | F01 (Rendering History process) | `TicketHistoryController.getHistory()` | R1 |
| US-1.2 | History Entry Auto-Appended on Lifecycle Events | F1 | F01 (Appending History Entry process) | `TicketHistoryService.append()` | R1 |
| US-1.3 | View Notification Recipients on History Entry | F1 | F01 (sentNotifications field) | `NotificationService` → `ticketHistory.sentNotifications` | R1 |
| US-2.1 | Discover API Metadata | F2 | F02 (GET /open311/discovery process) | `Open311DiscoveryController` | R1 |
| US-2.2 | List Available Services | F2 | F02 (GET /open311/services process) | `Open311ServicesController` | R1 |
| US-2.3 | Get Service Attributes | F2 | F02 (GET /open311/services/{code} process) | `Open311ServicesController`, `Open311MappingService` | R1 |
| US-2.4 | Submit a Service Request via Open311 | F2 | F02 (POST /open311/requests process) | `Open311RequestsController`, `Open311MappingService` | R1 |
| US-2.5 | Retrieve and Filter Service Requests | F2 | F02 (GET /open311/requests process) | `Open311RequestsController`, `TicketSearchService` | R1 |
| US-2.6 | Retrieve a Single Service Request | F2 | F02 (GET /open311/requests/{id} process) | `Open311RequestsController`, `Open311MappingService` | R1 |
| US-3.1 | Enforce Role-Based Endpoint Access | F3 | F03 (Permission Matrix, endpoint guards) | `SecurityConfig`, `PermissionEvaluator` | R1 |
| US-3.2 | Enforce Per-Category Display and Posting Permissions | F3 | F03 (per-category permission process) | `CategoryService.checkPermission()`, `PermissionEvaluator` | R1 |
| US-3.3 | Gate Admin and Export Operations to Staff | F3 | F03 (admin gating sub-feature) | `SecurityConfig` @PreAuthorize annotations | R1 |
| US-4.1 | Staff Login and JWT Issuance | F4 | F04 (Staff Login process) | `AuthController.login()`, `JwtTokenProvider` | R1 |
| US-4.2 | JWT Token Refresh | F4 | F04 (Token Refresh process) | `AuthController.refresh()`, `RefreshTokenRepository` | R1 |
| US-4.3 | Logout and Token Invalidation | F4 | F04 (Logout process) | `AuthController.logout()`, `TokenBlacklistRepository` | R1 |
| US-4.4 | OAuth / External Identity Provider Callback | F4 | F04 (OAuth Callback process) | `CallbackController`, `AuthService.handleCallback()` | R1 |
| US-5.1 | Create and Manage Staff User Accounts | F5 | F05 (Create Person process) | `PeopleController`, `PersonService.createPerson()` | R2 |
| US-5.2 | Manage Multiple Emails, Phones, and Addresses | F5 | F05 (child record management) | `PersonService`, `PeopleEmail.java`, `PeoplePhone.java`, `PeopleAddress.java` | R2 |
| US-5.3 | Search the People Directory | F5 | F05 (Search/List People process) | `PeopleController.search()`, `PersonRepository` ILIKE | R2 |
| US-5.4 | View All Tickets Associated With a Person | F5 | F05 (Get Person's Tickets process) | `PeopleController.getTickets()`, `TicketRepository` | R2 |
| US-6.1 | Create and Manage Departments | F6 | F06 (Department CRUD) | `DepartmentController`, `DepartmentService` | R2 |
| US-6.2 | Assign Categories and Action Types to Departments | F6 | F06 (many-to-many associations) | `DepartmentService.associateCategory()`, `DepartmentService.associateAction()` | R2 |
| US-7.1 | Create and Configure a Category | F7 | F07 (Category CRUD with full config) | `CategoryController`, `CategoryService.createCategory()` | R2 |
| US-7.2 | Manage Category Groups | F7 | F07 (Category Group CRUD) | `CategoryGroupController`, `CategoryGroup.java` | R2 |
| US-7.3 | Configure Auto-Close Rules Per Category | F7 | F07 (auto-close config) + F16 (AutoCloseScheduler) | `CategoryService` autoClose fields, `AutoCloseScheduler` | R2 |
| US-8.1 | Create and Manage Substatuses | F8 | F08 (Substatus CRUD, seed data) | `SubstatusController`, `SubstatusService` | R2 |
| US-8.2 | Apply Substatus to Ticket Lifecycle Actions | F8 | F08 (ticket lifecycle integration) | `TicketService.closeTicket()`, `TicketService.reopenTicket()` | R2 |
| US-9.1 | Create and Manage Department Action Types | F9 | F09 (Action CRUD) | `ActionController`, `ActionService` | R2 |
| US-9.2 | Configure Category Action Response Overrides | F9 | F09 (category_action_responses) | `ActionController.createActionResponse()`, `CategoryActionResponse.java` | R2 |
| US-9.3 | Render Template Variables in History Descriptions | F9 | F09 (Template Variable Resolution) + F01 | `TemplateVariableResolver.resolve()` | R2 |
| US-10.1 | Upload Media to a Ticket | F10 | F10 (File Upload process) | `MediaController.upload()`, `MediaService` | R2 |
| US-10.2 | Serve Media Files and Thumbnails | F10 | F10 (File Serving process) | `MediaController.serve()`, `MediaService.generateThumbnail()` | R2 |
| US-11.1 | Full-Text Keyword Search Across Tickets | F11 | F11 (FTS index, keyword search) | `TicketSearchService.search()`, `tickets.search_vector` GIN | R1 |
| US-11.2 | Filter Tickets by Multiple Criteria | F11 | F11 (multi-field filtering, pagination) | `TicketSearchService.buildQuery()`, `TicketRepository` | R1 |
| US-11.3 | View Ticket Search Results on Map | F11 | F11 (map view output) | `TicketSearchController.mapView()`, `TicketMap.tsx` | R1 |
| US-12.1 | Save a Ticket Search as a Bookmark | F12 | F12 (Create Bookmark) | `BookmarkController.create()`, `BookmarkRepository` | R3 |
| US-12.2 | List and Navigate Saved Bookmarks | F12 | F12 (List Bookmarks) | `BookmarkController.list()`, `Sidebar.tsx` | R3 |
| US-12.3 | Delete a Bookmark | F12 | F12 (Delete Bookmark) | `BookmarkController.delete()` owner check | R3 |
| US-13.1 | Register and Manage an API Client | F13 | F13 (Client CRUD, key hashing) | `ClientController`, `ClientService`, `ApiKeyHashUtil` | R2 |
| US-13.2 | API Key Rotation | F13 | F13 (Key Rotation process) | `ClientService.rotateKey()`, immediate effect without restart | R2 |
| US-14.1 | Record Submission and Response Channel on a Ticket | F14 | F14 (ticket contact fields, filter) | `TicketController`, `TicketSearchService` contactMethod filter | R3 |
| US-15.1 | Capture and Validate Ticket Location | F15 | F15 (Location Capture, AddressService integration) | `GeoService.normalizeAddress()`, `LocationRepository` | R2 |
| US-15.2 | Rebuild Geo-Clusters via Scheduled Job | F15 | F15 (Geo-Cluster Rebuild process) | `GeoClusterScheduler.rebuild()` | R2 |
| US-15.3 | Location-Based Ticket Search | F15 | F15 (location-based search) + F11 | `TicketSearchService.geoFilter()`, PostGIS `ST_DWithin` | R2 |
| US-16.1 | Receive Email Notification After Ticket Action | F16 | F16 (Digest Notification Scheduler process) | `DigestNotificationScheduler.run()`, `NotificationService` | R2 |
| US-16.2 | Auto-Close Stale Tickets by Category Rule | F16 | F16 (Auto-Close Scheduler) + F07 (autoClose config) | `AutoCloseScheduler.run()` | R2 |
| US-16.3 | Audit Data Integrity via Scheduled Job | F16 | F16 (Audit Scheduler process) | `AuditScheduler.run()` | R2 |
| US-17.1 | View SLA Compliance Metrics by Category | F17 | F17 (Metrics endpoint, onTimePercentage) | `MetricsController`, `MetricsService.onTimePercentage()` | R3 |
| US-17.2 | Run Canned Activity and Volume Reports | F17 | F17 (canned reports) | `MetricsController` report endpoints, `MetricsService` | R3 |
| US-18.1 | Receive Open311 Responses in JSON or XML | F18 | F18 (XML output, content negotiation) + F02 | `Open311XmlSerializer`, `WebMvcConfig` format negotiation | R1 |
| US-18.2 | Export Ticket Data in Multiple Formats | F18 | F18 (CSV/print/TXT output) | `CsvExportUtil`, `TicketSearchController` format routing | R1 |
| US-19.1 | Assign an Issue Type to a Ticket | F19 | F19 (ticket classification, filter) | `TicketService` issueType_id field, `TicketSearchService` | R3 |
| US-19.2 | Administer Issue Type Records | F19 | F19 (Issue Type CRUD) | `IssueTypeController`, `IssueTypeRepository` | R3 |
| US-20.1 | Create and Manage Response Templates | F20 | F20 (Response Template CRUD) | `ResponseTemplateController`, `ResponseTemplateRepository` | R3 |
| US-20.2 | Use a Response Template When Recording a Ticket Response | F20 | F20 (template selection on ticket) | `ResponseTemplateController.listByAction()`, SPA template picker | R3 |

---

## 8. Persona-to-Feature Coverage

| Feature | PER-01 Marcus (Case Worker) | PER-02 Diana (Dept Admin) | PER-03 Jordan (Sys Admin) | PER-04 Integra (API Client) | Release |
|---------|:--:|:--:|:--:|:--:|---------|
| F0 Ticket Lifecycle | P | S | — | S | R1 |
| F1 Ticket History | P | S | — | — | R1 |
| F2 Open311 API | S | S | S | P | R1 |
| F3 RBAC | S | S | P | S | R1 |
| F4 Authentication | P | P | P | P | R1 |
| F5 People Management | P | S | P | — | R2 |
| F6 Department Admin | — | P | P | — | R2 |
| F7 Category Management | S | P | S | S | R2 |
| F8 Substatus System | P | P | S | — | R2 |
| F9 Action Types & Templates | P | P | — | — | R2 |
| F10 Media Upload | P | — | — | S | R2 |
| F11 Full-Text Search | P | S | — | S | R1 |
| F12 Bookmarks | P | — | — | — | R3 |
| F13 API Client Management | — | — | P | S | R2 |
| F14 Contact Method Tracking | P | S | — | S | R3 |
| F15 Location & Geo-Clusters | P | S | S | S | R2 |
| F16 Digest Notifications | S | S | P | — | R2 |
| F17 Metrics & Reporting | S | P | S | — | R3 |
| F18 Multi-Format Output | S | — | S | P | R1 |
| F19 Issue Type Management | P | P | S | — | R3 |
| F20 Response Templates | P | P | — | — | R3 |

**Key:** P = Primary user | S = Secondary / indirectly affected | — = Not applicable

---

## 9. JTBD-to-Feature Traceability

| JTBD-ID | Job Statement (summary) | Related Features | Related User Stories | Release |
|---------|------------------------|-----------------|---------------------|---------|
| JTBD-01.1 | Triage daily ticket queue and surface overdue items | F0, F8, F11, F12 | US-4.1, US-4.2, US-11.2, US-8.2, US-11.3, US-0.8, US-18.2 | R1 (R3 for bookmarks) |
| JTBD-01.2 | Find and update a specific ticket without losing context | F0, F1, F9, F10, F20 | US-0.1–0.7, US-1.1–1.2, US-9.3, US-10.1, US-10.2 | R1–R2 |
| JTBD-01.3 | Re-use recurring filter combinations without rebuilding them | F11, F12 | US-12.1, US-12.2, US-12.3 | R3 |
| JTBD-02.1 | Keep category taxonomy accurate so tickets route automatically | F6, F7, F9 | US-6.1, US-6.2, US-7.1, US-7.2, US-7.3, US-9.1, US-9.2 | R2 |
| JTBD-02.2 | Monitor SLA compliance trends and catch categories falling behind | F7, F17 | US-17.1, US-17.2 | R3 |
| JTBD-02.3 | Onboard new staff to categories without calling the system admin | F5, F6, F4 | US-5.1, US-4.1, US-6.2 | R2 |
| JTBD-03.1 | Provision and manage user accounts and roles from one surface | F3, F4, F5 | US-4.1, US-5.1, US-5.2, US-3.1, US-3.3 | R1–R2 |
| JTBD-03.2 | Register, key, and rotate external API clients securely | F13, F4 | US-13.1, US-13.2 | R2 |
| JTBD-03.3 | Validate the deployed system's health and background job execution | F2, F16, F18 | US-16.1, US-16.2, US-16.3, US-15.2, US-2.1–2.6, US-18.1 | R2 |
| JTBD-04.1 | Submit service requests and receive valid IDs without code changes | F2, F4, F18 | US-2.4, US-18.1, US-4.4 | R1 |
| JTBD-04.2 | Poll for request status updates with byte-identical response shapes | F2, F11, F18 | US-2.5, US-2.6, US-18.1 | R1 |
| JTBD-04.3 | Authenticate write operations using existing API keys | F2, F4, F13 | US-2.4, US-4.1, US-13.1 | R1 |

---

## 10. Journey-to-Story Traceability

| Journey ID | Journey Name | Primary Stories | Enabling Features | First Complete Release |
|------------|-------------|-----------------|-------------------|----------------------|
| JRN-01.1 | Morning Queue Triage | US-4.1, US-4.2, US-11.2, US-11.3, US-8.2, US-0.1, US-1.1 | F4, F11, F8, F0, F1 | R1 |
| JRN-01.2 | Full Ticket Update (comment + status + photo) | US-0.7, US-8.2, US-10.1, US-10.2, US-1.2, US-9.3, US-20.2 | F0, F8, F10, F1, F9, F20 | R1 (basic) / R2 (full) |
| JRN-01.3 | Saving and Reusing a Recurring Filter | US-11.1, US-12.1, US-12.2, US-12.3 | F11, F12 | R3 |
| JRN-02.1 | Configuring a New Service Category | US-7.1, US-7.2, US-6.1, US-6.2, US-5.1 | F7, F6, F5 | R2 |
| JRN-02.2 | Month-End SLA Compliance Review | US-17.1, US-17.2 | F17 | R3 |
| JRN-02.3 | Onboarding a New Case Worker | US-5.1, US-4.1, US-6.2, US-7.1 | F5, F4, F6, F7 | R2 |
| JRN-03.1 | Post-Migration JWT Account Validation | US-4.1, US-5.1, US-3.1, US-3.3 | F4, F5, F3 | R1 (partial) / R2 (full) |
| JRN-03.2 | API Client Registration and Key Rotation | US-13.1, US-13.2 | F13 | R2 |
| JRN-03.3 | Post-Deployment Health Verification | US-16.1, US-16.2, US-16.3, US-15.2, US-2.1–2.6, US-18.1 | F16, F15, F2, F18 | R2 |
| JRN-04.1 | Service Request Submission After Migration | US-2.4, US-3.2, US-0.1, US-18.1 | F2, F3, F0, F18 | R1 |
| JRN-04.2 | Status Polling — GET /open311/requests/{id} | US-2.5, US-2.6, US-18.1 | F2, F18 | R1 |

---

## 11. Change Management Log

| Change ID | Date | Version | Changed By | Description | Sections Affected | Impact |
|-----------|------|---------|------------|-------------|-------------------|--------|
| CHG-001 | 2026-06-24 | 1.0 | System | Initial RTM generated from PRD-uReport v1.0, FRD-uReport v1.0, TechArch-uReport v1.0, UserStories-uReport v1.0 | All | Baseline established |

*Future changes should increment the RTM version and log the scope of impact (e.g., new user story added, API endpoint changed, NFR updated).*

---

## 12. Validation Checklist

- [x] All 21 PRD features (F0–F20) have traceability entries in the full matrix (Section 3)
- [x] All 21 FRD feature sections (F00–F20) are mapped to at least one PRD feature
- [x] All major TechArch components (controllers, services, schedulers, repositories, entities) are linked to at least one feature
- [x] All 63 User Stories (US-0.1 through US-20.2) appear in the Story-to-Spec index (Section 7)
- [x] All 12 Non-Functional Requirements (NFR-1 through NFR-12) have traceability entries (Section 4)
- [x] All 4 Personas (PER-01 through PER-04) are covered in persona-to-feature matrix (Section 8)
- [x] All 12 JTBDs (JTBD-01.1 through JTBD-04.3) are covered in JTBD-to-feature table (Section 9)
- [x] All 11 Journey Maps (JRN-01.1 through JRN-04.2) are covered in journey-to-story table (Section 10)
- [x] Release assignments (R1/R2/R3) are consistent with PRD priority levels (P0→R1, P1→R2, P2→R3)
- [x] Test coverage targets align with NFR-9 (≥80% service layer, ≥90% Open311 controller)
- [x] No placeholder IDs — all IDs extracted from actual source documents

---

## 13. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | — | ___________________________ | __________ |
| Engineering Lead | — | ___________________________ | __________ |
| QA Lead | — | ___________________________ | __________ |
| System Administrator | Jordan Kim (PER-03) | ___________________________ | __________ |
| Department Administrator Representative | Diana Reyes (PER-02) | ___________________________ | __________ |

---

## Referenced Documents

| Document | Path | Version | Status |
|----------|------|---------|--------|
| Project Overview | `.planning/PROJECT.md` | — | Complete |
| Product Requirements Document | `project_specs/PRD-uReport.md` | 1.0 | Active |
| Functional Requirements Document | `project_specs/FRD-uReport.md` | 1.0 | Active |
| Technical Architecture | `project_specs/TechArch-uReport.md` | 1.0 | Active |
| User Stories | `project_specs/UserStories-uReport.md` | 1.0 | Active |
| Personas | `project_specs/PERSONAS-uReport.md` | 1.0 | Active |
| Jobs-to-be-Done | `project_specs/JTBD-uReport.md` | 1.0 | Active |
| User Journey Maps | `project_specs/JOURNEYS-uReport.md` | 1.0 | Active |
| Story Map | `project_specs/STORY-MAP-uReport.md` | 1.0 | Active |

---

*RTM-uReport v1.0 | Generated 2026-06-24 | uReport Modernization Project*
