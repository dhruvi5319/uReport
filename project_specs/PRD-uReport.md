# Product Requirements Document: uReport Modernization

**Project:** uReport CRM — Municipal Constituent Issue Tracking System  
**Acronym:** uReport  
**Version:** 1.0  
**Date:** 2026-06-24  
**Status:** Active  

---

## 1. Executive Summary

uReport is a constituent relationship management (CRM) web application used by municipalities to track and resolve citizen-reported issues. The existing system, built on PHP 8.x / Apache / MySQL / Solr, is being modernized to a React 18 + Java 21 (Spring Boot 3.x) + PostgreSQL 16 architecture. This migration reproduces 100% of existing features, API contracts, data models, and business rules with zero functional regression, while replacing the legacy technology stack with a maintainable, containerized platform.

---

## 2. Problem Statement

The current uReport codebase has accumulated significant operational and technical debt that makes ongoing maintenance difficult:

- **Aging stack**: PHP 8.x with Laminas/Zend-style MVC is increasingly difficult to hire for, test, and containerize cleanly.
- **Solr dependency**: Apache Solr 7.4 requires a separate JVM process and dedicated ops effort. Its full-text search capabilities can be replaced by PostgreSQL FTS, eliminating one infrastructure component.
- **PHP session auth**: Session-based authentication cannot serve a modern SPA or third-party API clients effectively; JWT is required.
- **Template-driven rendering**: PHP server-side templates are tightly coupled to output format selection (HTML, JSON, XML, CSV, TXT), making frontend iteration slow.
- **Deployment complexity**: The PHP + Apache + Solr + MySQL stack requires distinct configuration management (Ansible) that diverges from Docker-native operations.

Despite these pain points, uReport's **business logic is sound**. The Open311 GeoReport v2 API is relied upon by external municipality integrations. The data model is well-normalized. The permission system, substatus lifecycle, SLA rules, and notification engine all work correctly. The goal is to port that logic faithfully to a modern, maintainable stack — not to redesign the product.

---

## 3. Product Vision

> *Deliver a byte-compatible, feature-complete reimplementation of uReport on React + Java + PostgreSQL, containerized with Docker, so that municipality operators experience no disruption and external API consumers require no changes.*

**Strategic Goals:**
- Preserve all 20+ validated feature areas with zero functional regression
- Maintain exact Open311 GeoReport v2 API response shapes for backward compatibility
- Replace Solr with PostgreSQL FTS to eliminate the Solr infrastructure dependency
- Replace PHP session auth with JWT / Spring Security
- Replace PHP cron scripts with Spring Scheduler
- Ship the full SPA frontend in React 18 + TypeScript consuming the new REST API
- Containerize the entire system under a familiar `docker-compose` interface
- Delete legacy `crm/`, `ansible/`, and `infra/` directories after all features are spec-mapped and implemented

---

## 4. Target Technical Architecture

| Layer | Legacy (Current) | Target (New) |
|-------|-----------------|--------------|
| Frontend | PHP templates (HTML/JSON/XML/CSV/TXT) | React 18 + TypeScript SPA |
| Backend | PHP 8.x + Laminas MVC + Apache 2.4 | Java 21 + Spring Boot 3.x REST API |
| Database | MySQL 8.x | PostgreSQL 16 |
| Search | Apache Solr 7.4 | PostgreSQL Full-Text Search (FTS) |
| Auth | PHP session-based | JWT + Spring Security |
| Scheduling | PHP cron scripts | Spring Scheduler |
| Deployment | Ansible + Apache vhost | Docker / docker-compose |
| Testing | PHPUnit | JUnit 5 + Spring Boot Test |

**Key Architectural Constraints:**
- Open311 API response payloads must be byte-compatible (JSON and XML shapes unchanged)
- All MySQL table relationships must map 1:1 to PostgreSQL DDL with equivalent FKs and constraints
- Existing role names (`staff`, `public`, `anonymous`) and permission levels must be preserved exactly
- Docker compose interface must remain familiar for existing operators (same service names, ports, volumes where possible)

---

## 5. Feature Requirements

### F0: Ticket / Case Lifecycle Management

**Description:** The ticket (case) is the core entity of uReport. Staff and public users create tickets for constituent issues, and staff manage them through their full lifecycle from opening through assignment, updates, closure, reopening, and duplicate detection. Every state change is recorded in an immutable history log.

**Capabilities:**
- Create a new ticket with category, description, location, reporter, and custom fields
- Assign a ticket to a specific staff person
- Update ticket details (category, location, description, custom fields, assigned person)
- Close a ticket with a substatus (Resolved, Duplicate, Bogus, or custom)
- Mark one ticket as a duplicate of another (parent/child relationship via `parent_id`)
- Reopen a previously closed ticket
- Change a ticket's category (with history entry recording old and new category)
- Change a ticket's location (with history entry recording old and new address)
- Record free-text comments on a ticket
- Associate a ticket with an issue type (Comment, Complaint, Question, Report, Request, Violation)
- Track the contact method used to submit the ticket (Email, Phone, Web Form, Other)
- Track the preferred response method for the reporter
- Store additional location fields from AddressService (`additionalFields`)
- Store category-defined custom field values (`customFields` JSON blob)
- Filter and search tickets by all indexed fields
- Export ticket search results in HTML, print, and CSV formats
- Display ticket search results in list or map view

**Data Model:** `tickets` table — id, parent_id, category_id, issueType_id, client_id, enteredByPerson_id, reportedByPerson_id, assignedPerson_id, contactMethod_id, responseMethod_id, enteredDate, lastModified, addressId, latitude, longitude, location, city, state, zip, status, closedDate, substatus_id, additionalFields, customFields, description

**Priority:** P0 (Critical — MVP requirement)

---

### F1: Ticket History and Action Log

**Description:** Every change to a ticket is recorded as an immutable `ticketHistory` entry linked to an action type. Action descriptions use a template variable system (e.g., `{actionPerson}`, `{enteredByPerson}`, `{original:category_id}`) so descriptions are rendered dynamically at read time. The history log supports notifications tracking — each entry records which email notifications were sent.

**Capabilities:**
- Append a history entry for every ticket lifecycle event (open, assignment, close, update, comment, duplicate, upload, category change, location change, response)
- Store who performed the action (`enteredByPerson_id`), who was acted upon (`actionPerson_id`), and when (`actionDate`, `enteredDate`)
- Store free-text `notes` and structured `data` (JSON) per history entry
- Store `sentNotifications` (serialized list of emails notified) per history entry
- Render action descriptions by interpolating template variables at read time
- Display the full history log on the ticket detail view
- Support system action types (open, assignment, closed, changeCategory, changeLocation, response, duplicate, update, comment, upload_media) and department-defined custom action types

**Data Model:** `ticketHistory` — id, ticket_id, enteredByPerson_id, actionPerson_id, action_id, enteredDate, actionDate, notes, data, sentNotifications

**Priority:** P0 (Critical — MVP requirement)

---

### F2: Open311 GeoReport v2 REST API

**Description:** uReport exposes a fully Open311 GeoReport v2 compliant REST API consumed by external municipality systems, mobile apps, and third-party integrators. The API response shapes (JSON and XML) must be byte-compatible with the current PHP implementation. API key authentication is required for write operations; read operations may be anonymous or authenticated.

**Capabilities:**
- `GET /open311/discovery` — return API discovery metadata (endpoint URLs, changeset info, formats)
- `GET /open311/services` — return the full list of active, postable service (category) definitions
- `GET /open311/services?service_code={id}` — return a single service definition with custom attribute schema
- `POST /open311/requests` — create a new service request (ticket) via the Open311 API
- `GET /open311/requests` — search/list service requests with filter parameters
- `GET /open311/requests/{service_request_id}` — retrieve a single service request by ID
- Support `format=json` and `format=xml` output for all endpoints
- Validate `api_key` for write operations; enforce posting permission levels per category
- Respect obsolete API key list (`$OBSOLETE_API_KEYS`) to serve a mobile shutdown notice
- Return HTTP 403 for unauthorized posting attempts; HTTP 404 for unknown services
- Map uReport ticket fields to Open311 request fields (service_request_id, status, status_notes, service_name, service_code, description, agency_responsible, requested_datetime, updated_datetime, lat, long, address, etc.)
- Include media URLs in request responses where attachments exist

**Priority:** P0 (Critical — external API consumers depend on this)

---

### F3: Role-Based Access Control (RBAC)

**Description:** uReport enforces three permission levels across all controllers: `anonymous` (unauthenticated public), `public` (authenticated constituent), and `staff` (authenticated municipality employee). Categories define separate `displayPermissionLevel` and `postingPermissionLevel`. The `Person` model includes a `role` field and a static `isAllowed(resource, action)` method used throughout the codebase.

**Capabilities:**
- Enforce role-based access on every controller action (`staff`, `public`, `anonymous`)
- Gate ticket search export (print/CSV) to `staff` only
- Gate category display and ticket posting per-category permission level
- Gate Open311 service posting per category's `postingPermissionLevel`
- Gate administrative screens (departments, categories, users, clients, etc.) to `staff`
- Support role assignment per person in the people directory (`people.role`)
- Preserve all existing role names and permission level semantics exactly

**Priority:** P0 (Critical — security boundary)

---

### F4: Authentication — JWT / Spring Security

**Description:** The legacy system uses PHP session-based authentication. The new system replaces this with JWT-based authentication via Spring Security. Staff log in with username/password; external API clients authenticate via API key. An OAuth callback endpoint supports external identity providers.

**Capabilities:**
- Staff login with username and password; receive JWT access token
- JWT validation middleware on all protected routes
- Logout / token invalidation
- `GET /callback` — OAuth/external identity callback handler (maps external identity to a local `people` record)
- API key authentication for Open311 write endpoints (validated against `clients.api_key`)
- Session-less stateless authentication (no PHP-style `$_SESSION`)
- Role loaded from `people.role` and encoded in JWT claims

**Priority:** P0 (Critical — gates all protected features)

---

### F5: People / Contact Management

**Description:** The `people` table is the central identity registry for uReport. It holds both staff users (who have `username` and `role`) and constituent contacts (who may or may not have accounts). A person can have multiple emails, phones, and addresses, each labeled. Staff manage the people directory via a CRUD interface.

**Capabilities:**
- Create, read, update, and delete person records
- Store firstname, middlename, lastname, organization, primary address, city, state, zip
- Assign a person to a department
- Assign a username and role to staff users
- Manage multiple email addresses per person (label: Home, Work, Other; flag: `usedForNotifications`)
- Manage multiple phone numbers per person (label: Main, Mobile, Work, Home, Fax, Pager, Other)
- Manage multiple addresses per person (label: Home, Business, Rental)
- Search and filter people by name, organization, email, role, department
- Link a person to their submitted, reported, and assigned tickets
- View all tickets associated with a person

**Data Model:** `people`, `peopleEmails`, `peoplePhones`, `peopleAddresses`

**Priority:** P1 (High — required for ticket creation and notifications)

---

### F6: Department Administration

**Description:** Departments represent the organizational units within the municipality (e.g., Streets, Sanitation). Each department has a name and an optional default person (the default assignee for tickets routed to that department). Departments are linked to categories and actions.

**Capabilities:**
- Create, read, update, and delete department records
- Assign a default person to a department
- Associate departments with categories (many-to-many via `department_categories`)
- Associate departments with available action types (many-to-many via `department_actions`)
- View all staff members belonging to a department
- View all categories assigned to a department

**Data Model:** `departments`, `department_actions`, `department_categories`

**Priority:** P1 (High — required for category and ticket routing)

---

### F7: Category and Category-Group Management

**Description:** Categories are the service type taxonomy for uReport (equivalent to Open311 services). They are grouped into named category groups. Each category carries rich configuration: permission levels, custom field schema, SLA days, auto-close rules, a default assignee, and per-action response templates. Categories are the primary routing mechanism for tickets.

**Capabilities:**
- Create, read, update, and delete category records
- Assign a category to a department and optionally a default person
- Assign a category to a category group
- Set `active` and `featured` flags per category
- Configure `displayPermissionLevel` and `postingPermissionLevel` (staff / public / anonymous)
- Define a JSON/structured `customFields` schema for constituent-provided data
- Set `slaDays` (service level agreement target days for closure)
- Set `notificationReplyEmail` for outbound notification emails
- Configure `autoCloseIsActive` and `autoCloseSubstatus_id` (auto-close rule)
- Create, read, update, and delete category group records
- Set `ordering` on category groups for display sequencing
- View all categories within a group

**Data Model:** `categories`, `categoryGroups`

**Priority:** P1 (High — core classification and routing)

---

### F8: Substatus System

**Description:** The substatus table provides fine-grained lifecycle states beyond the binary `open`/`closed` status. Each substatus maps to either `open` or `closed` status and carries a name and description. System substatuses (Resolved, Duplicate, Bogus) are seeded; staff can define additional substatuses. One substatus can be flagged as the default.

**Capabilities:**
- Create, read, update, and delete substatus records
- Associate each substatus with a parent status: `open` or `closed`
- Mark one substatus as default (`isDefault`)
- Assign a substatus to a ticket on close or update
- Use substatuses as a filter in ticket search
- Seed system substatuses: Resolved, Duplicate, Bogus
- Use a substatus as the target for category auto-close rules

**Data Model:** `substatus` — id, name, description, status (enum: open/closed), isDefault

**Priority:** P1 (High — lifecycle granularity)

---

### F9: Action Types and Response Templates

**Description:** Actions define the vocabulary of ticket history events. System action types are fixed (open, assignment, closed, changeCategory, changeLocation, response, duplicate, update, comment, upload_media). Departments can define custom action types. Each action has a description template using `{variable}` placeholders. Per-category action response templates (`category_action_responses`) allow departments to customize the notification text and reply-to email for each action type in each category.

**Capabilities:**
- Create, read, update, and delete department-scoped action type records
- View all system action types (read-only)
- Each action has: name, description (template string), type (system/department), optional email template, optional `replyEmail`
- Create, read, update, and delete `category_action_responses` (per-category override of action template and reply email)
- Render action description templates by substituting `{actionPerson}`, `{enteredByPerson}`, `{reportedByPerson_id}`, `{original:field}`, `{updated:field}`, `{duplicate:ticket_id}` at read time
- List available actions per department
- Associate actions with departments via `department_actions`

**Data Model:** `actions`, `category_action_responses`, `department_actions`

**Priority:** P1 (High — drives history rendering and notifications)

---

### F10: Media / Attachment Upload and Thumbnail Caching

**Description:** Staff and (permission-permitted) public users can attach images and files to tickets. Uploaded media is stored on disk with an internal filename. Image thumbnails are generated and cached. The media controller serves files and thumbnails. Media is listed on the ticket detail view and included in Open311 API responses.

**Capabilities:**
- Upload one or more files/images to a ticket
- Store file metadata in `media` table (filename, internalFilename, mime_type, uploaded, person_id)
- Generate and cache image thumbnails on first request
- Serve original and thumbnail versions via a media endpoint
- List all attachments on a ticket's detail view
- Include media URLs in Open311 API request responses
- Record an `upload_media` action in ticket history on every upload
- Restrict upload permissions based on user role

**Data Model:** `media` — id, ticket_id, filename, internalFilename, mime_type, uploaded, person_id

**Priority:** P1 (High — constituent evidence and documentation)

---

### F11: Full-Text Search (PostgreSQL FTS replacing Solr)

**Description:** The current system uses Apache Solr 7.4 for ticket indexing and full-text search. The new system replaces Solr with PostgreSQL Full-Text Search, preserving equivalent search semantics. Ticket search supports filtering by dozens of fields (date ranges, category, department, assigned person, status, substatus, location, reporter, keywords) and returns paginated results. Search queries also power the ticket list, map view, and CSV/print exports.

**Capabilities:**
- Index all ticket fields relevant to search (description, location, reporter name, category, department, status, substatus, dates, assignee, etc.)
- Full-text keyword search across indexed ticket fields
- Filter by: category_id, department_id, assignedPerson_id, enteredByPerson_id, status, substatus_id, contactMethod_id, client_id, enteredDate range, closedDate range, location, city, zip, latitude/longitude radius
- Paginated result sets with configurable page size
- Unpaginated results for CSV/print export
- Map view output with geo-clustered results
- Maintain search result equivalence with current Solr output

**Priority:** P0 (Critical — core ticket management workflow)

---

### F12: Bookmarks (Staff Saved Searches)

**Description:** Staff users can save named ticket search filters as bookmarks. Bookmarks store the full request URI of a search query so that staff can return to frequently-used filtered views with a single click. Each bookmark is personal (per person) and typed (default type: `search`).

**Capabilities:**
- Create a bookmark by saving the current search URI with a name
- List all bookmarks belonging to the current staff user
- Delete a bookmark
- Navigate to a bookmarked search (follow the stored `requestUri`)
- Support bookmark `type` field for future extensibility (currently `search`)

**Data Model:** `bookmarks` — id, person_id, type, name, requestUri

**Priority:** P2 (Medium — staff productivity feature)

---

### F13: API Client Management

**Description:** External applications that integrate with uReport via the Open311 API are registered as API clients. Each client has a name, URL, API key, a contact person, and an optional default contact method. API keys are validated on write operations.

**Capabilities:**
- Create, read, update, and delete API client records
- Generate or assign a unique `api_key` per client
- Associate a client with a contact person and optional contact method
- Validate API key on all Open311 write (POST) requests
- Associate submitted tickets with their originating client (`tickets.client_id`)
- List all registered clients (staff only)

**Data Model:** `clients` — id, name, url, api_key, contactPerson_id, contactMethod_id

**Priority:** P1 (High — required for Open311 API authentication)

---

### F14: Contact Method Tracking

**Description:** uReport tracks how tickets were submitted (Email, Phone, Web Form, Other) via the `contactMethods` lookup table. Tickets reference a `contactMethod_id` for the submission channel and a `responseMethod_id` for the constituent's preferred response channel. Contact methods are also associated with API clients.

**Capabilities:**
- Seed four system contact methods: Email, Phone, Web Form, Other
- Allow staff to record the submission contact method on a ticket
- Allow staff to record the preferred response method on a ticket
- Filter ticket searches by contact method
- Associate API clients with a contact method

**Data Model:** `contactMethods` — id, name

**Priority:** P2 (Medium — operational tracking)

---

### F15: Location / Address Management and Geo-Cluster Analysis

**Description:** Tickets carry geographic data (latitude, longitude, street address, city, state, zip). The `locations` table (referenced via `tickets.addressId`) provides a validated address registry. Geo-cluster analysis groups nearby tickets into hierarchical spatial clusters across 7 zoom levels (cluster_id_0 through cluster_id_6), used by the map view. A background job (`matchLocationAddresses.php`) links tickets to canonical addresses.

**Capabilities:**
- Capture and store latitude, longitude, street address, city, state, zip on tickets
- Validate and normalize addresses via AddressService integration
- Store canonical address records in the `locations` table
- Generate geo-cluster entries in `geoclusters` table (center point geometry, level 0–6)
- Link each ticket to its cluster assignments in `ticket_geodata` (cluster_id_0 through cluster_id_6)
- Rebuild geo-clusters via a scheduled background job (replaces `matchLocationAddresses.php`)
- Serve map view with geo-clustered ticket data
- Support location-based ticket search (radius, city, zip filters)

**Data Model:** `geoclusters`, `ticket_geodata`, `tickets` (lat/long/address fields)

**Priority:** P1 (High — map view and geographic reporting)

---

### F16: Digest Email Notifications

**Description:** uReport sends digest email notifications to constituents and staff on a cron schedule. The legacy system uses PHP cron scripts (`digestNotifications.php`, `digestNotifications.cron`). The new system replaces these with Spring Scheduler jobs. Notifications are templated per action type and category, using the `category_action_responses` and `actions.template` system. Each `ticketHistory` entry records which notifications were sent.

**Capabilities:**
- Run a scheduled digest notification job (replaces PHP cron, implemented as Spring Scheduler)
- Identify ticket history entries that have pending outbound notifications
- Render notification emails using action template variables
- Use `notificationReplyEmail` from category configuration as the reply-to address
- Use per-action `replyEmail` override where configured
- Send emails to all `peopleEmails` records flagged `usedForNotifications` for the reporter
- Record sent notification addresses in `ticketHistory.sentNotifications`
- Support a scheduled ticket auto-close job (replaces `closeOldTickets.php`) that closes stale tickets per category auto-close rules
- Support an audit job (replaces `auditTickets.php`) for data integrity checks

**Priority:** P1 (High — constituent communication)

---

### F17: Metrics and Reporting Dashboard

**Description:** uReport provides a metrics dashboard and a set of canned reports for staff. The metrics endpoint calculates on-time closure percentage per category over a configurable time window. Reports cover ticket activity, assignments, categories, staff performance, SLA compliance, volume trends, and current/opened/closed ticket counts.

**Capabilities:**
- **Metrics:** Calculate `onTimePercentage` for a given category_id, numDays, and effectiveDate
- **Activity report:** Ticket activity summary over a date range
- **Assignments report:** Tickets grouped by assigned person
- **Categories report:** Tickets grouped by category
- **Staff report:** Per-staff ticket counts and activity
- **Person report:** Tickets associated with a specific person
- **SLA report:** Tickets grouped by SLA compliance status
- **Volume report:** Ticket volume over time (trend data)
- **Current open tickets report:** Count of currently open tickets by category/department
- **Opened today report:** Tickets opened in the current period
- **Closed today report:** Tickets closed in the current period

**Priority:** P2 (Medium — operational visibility)

---

### F18: Multi-Format Output Feeds

**Description:** The legacy PHP template system renders responses in multiple formats by switching template files based on a `format` request parameter or `Accept` header. The new system must support equivalent multi-format output from the Spring Boot REST API for all endpoints that currently support it.

**Capabilities:**
- JSON output (default for API consumers)
- XML output (required for Open311 compatibility and legacy feed consumers)
- CSV output for ticket search/export (staff permission required)
- HTML output via React SPA (standard browser navigation)
- Print-friendly HTML output for ticket search results
- TXT plain-text output where currently supported
- Content negotiation via `format` query parameter (matching legacy behavior)
- Open311 endpoints support both `format=json` and `format=xml`

**Priority:** P0 (Critical — Open311 XML consumers are external and cannot be changed)

---

### F19: Issue Type Management

**Description:** Issue types provide a secondary classification for tickets beyond category (Comment, Complaint, Question, Report, Request, Violation). They are seeded at installation and managed by administrators.

**Capabilities:**
- Seed system issue types: Comment, Complaint, Question, Report, Request, Violation
- Assign an issue type to a ticket at creation or update time
- Filter ticket searches by issue type
- Administrative CRUD for issue type records

**Data Model:** `issueTypes` — id, name

**Priority:** P2 (Medium — classification/reporting)

---

### F20: Response Templates

**Description:** Response templates provide staff with pre-authored text blocks for common ticket responses. They are associated with action types and can be selected when recording a response action on a ticket. The `ResponseTemplatesController` and `ResponseTemplate` model manage these records.

**Capabilities:**
- Create, read, update, and delete response template records
- Associate a response template with an action type
- List available templates when recording a response on a ticket
- Use template text as a starting point for the notes field on a history entry

**Priority:** P2 (Medium — staff efficiency)

---

## 6. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-1 | Compatibility | Open311 GeoReport v2 JSON and XML response payloads must be byte-compatible with the current PHP output. No field names, types, or structures may change. |
| NFR-2 | Data Fidelity | All MySQL table relationships must map 1:1 to PostgreSQL DDL. All foreign keys, constraints, enums, and default values must be preserved or explicitly documented as changed. |
| NFR-3 | Auth Preservation | Existing role names (`staff`, `public`, `anonymous`) and all permission level semantics must be preserved. No permission regressions. |
| NFR-4 | Search Equivalence | PostgreSQL FTS ticket search must produce results equivalent to the current Solr implementation for all supported query fields and filter combinations. |
| NFR-5 | Deployment | The `docker-compose` interface must remain familiar for existing operators: same service names, exposed ports, and volume mounts where feasible. |
| NFR-6 | Performance | Ticket list/search queries must return paginated results in under 500ms for datasets up to 500,000 tickets. |
| NFR-7 | Availability | The system must support rolling restarts via Docker without data loss. |
| NFR-8 | Security | JWT tokens must use RS256 or HS256 signing with configurable secret. API keys must be stored hashed at rest. All inputs must be validated and sanitized. |
| NFR-9 | Testability | All Spring Boot service layer classes must have unit tests. All Open311 API endpoints must have integration tests validating response shape. |
| NFR-10 | Logging | All HTTP requests, auth events, and background job executions must be logged with timestamp, user, and outcome. |
| NFR-11 | Backward Compatibility | The React SPA must not require changes to external Open311 consumers — the API is the contract boundary. |
| NFR-12 | Geo Support | PostgreSQL must be configured with PostGIS or equivalent spatial support for geo-cluster center point storage and spatial indexing. |

---

## 7. Success Metrics

- **Feature parity:** 100% of features listed in F0–F20 implemented and verified against the legacy PHP codebase behavior
- **Open311 compliance:** All Open311 GeoReport v2 endpoint response shapes pass byte-level comparison tests against legacy XML/JSON fixtures
- **Zero data loss:** Full MySQL → PostgreSQL schema migration with all records, relationships, and constraints intact
- **Search equivalence:** PostgreSQL FTS returns identical result sets to Solr for a defined test query corpus (≥95% overlap on ranked results)
- **Auth migration:** All existing staff user accounts authenticate successfully via JWT after migration
- **API key migration:** All existing registered API client keys authenticate successfully
- **Test coverage:** ≥80% line coverage on Spring Boot service layer; ≥90% on Open311 controller
- **Performance:** p95 ticket search response ≤500ms under realistic load (10 concurrent users, 100k tickets)
- **Deployment:** `docker-compose up` produces a fully functional system from a clean checkout within 10 minutes

---

## 8. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Open311 XML shape regression | Medium | High | Generate fixture XML from legacy system before migration; run automated diff tests post-migration |
| Solr → PostgreSQL FTS result drift | High | Medium | Define a test query corpus from production; validate recall/precision against Solr baseline before cutover |
| MySQL → PostgreSQL DDL incompatibility | Low | High | Map every MySQL type, enum, and constraint to PostgreSQL equivalent in FRD; run schema validation in CI |
| Geo-cluster spatial index (MySQL POINT vs PostGIS) | Medium | Medium | Use PostGIS `GEOMETRY(POINT, 0)` for flat-space equivalent; validate geo-cluster rebuild job produces same clusters |
| Missing PHP business logic during port | High | High | Conduct a full controller-by-controller audit; each controller maps to a spec doc section before implementation begins |
| JWT session gap (logout/token invalidation) | Low | Medium | Implement short-lived access tokens + refresh token rotation or a server-side token blacklist |
| Legacy cron timing assumptions | Low | Low | Document all cron schedules; reproduce with Spring Scheduler `@Scheduled` annotations with equivalent intervals |
| Docker volume/permission mismatch | Low | Low | Mirror legacy file path conventions for media storage; document migration steps for media volume |

---

## 9. Feature Index

| ID | Feature | Priority | Status | Related Tables |
|----|---------|----------|--------|----------------|
| F0 | Ticket / Case Lifecycle Management | P0 | Required | tickets |
| F1 | Ticket History and Action Log | P0 | Required | ticketHistory, actions |
| F2 | Open311 GeoReport v2 REST API | P0 | Required | categories, tickets, media |
| F3 | Role-Based Access Control | P0 | Required | people (role field) |
| F4 | Authentication — JWT / Spring Security | P0 | Required | people, clients |
| F5 | People / Contact Management | P1 | Required | people, peopleEmails, peoplePhones, peopleAddresses |
| F6 | Department Administration | P1 | Required | departments, department_actions, department_categories |
| F7 | Category and Category-Group Management | P1 | Required | categories, categoryGroups |
| F8 | Substatus System | P1 | Required | substatus |
| F9 | Action Types and Response Templates | P1 | Required | actions, category_action_responses, department_actions |
| F10 | Media / Attachment Upload and Thumbnail Caching | P1 | Required | media |
| F11 | Full-Text Search (PostgreSQL FTS) | P0 | Required | tickets (FTS index) |
| F12 | Bookmarks (Staff Saved Searches) | P2 | Required | bookmarks |
| F13 | API Client Management | P1 | Required | clients |
| F14 | Contact Method Tracking | P2 | Required | contactMethods |
| F15 | Location / Address Management and Geo-Cluster Analysis | P1 | Required | geoclusters, ticket_geodata |
| F16 | Digest Email Notifications | P1 | Required | ticketHistory, actions, categories |
| F17 | Metrics and Reporting Dashboard | P2 | Required | tickets, ticketHistory |
| F18 | Multi-Format Output Feeds | P0 | Required | (cross-cutting — all endpoints) |
| F19 | Issue Type Management | P2 | Required | issueTypes |
| F20 | Response Templates | P2 | Required | actions (template field) |

**Priority Summary:**
- P0 (Critical / MVP): F0, F1, F2, F3, F4, F11, F18 — 7 features
- P1 (High / Required): F5, F6, F7, F8, F9, F10, F13, F15, F16 — 9 features
- P2 (Medium / Required): F12, F14, F17, F19, F20 — 5 features
- P3 (Low): None — this is a 1:1 migration; all features are required

---

## 10. Out of Scope

- **New features** not present in the current PHP codebase — this is a 1:1 migration, not a product enhancement
- **Mobile native apps** — web-first SPA only; no iOS/Android native development
- **Multi-tenancy** — the current single-municipality model is preserved; no multi-tenant architecture
- **Analytics platform** — no new BI tooling beyond the existing reports and metrics endpoints
- **Real-time notifications** (WebSocket/SSE) — digest/cron-based email model is preserved as-is

---

## 11. Referenced Documents

| Document | Location | Status |
|----------|----------|--------|
| PROJECT.md | `.planning/PROJECT.md` | Complete |
| FRD (Functional Requirements) | `project_specs/FRD-uReport.md` | Pending |
| Technical Architecture | `project_specs/TechArch-uReport.md` | Pending |
| User Stories | `project_specs/UserStories-uReport.md` | Pending |
| Legacy MySQL Schema | `crm/scripts/mysql.sql` | Source of truth |
| Legacy PHP Controllers | `crm/src/Application/Controllers/` | Source of truth |
| Legacy PHP Models | `crm/src/Application/Models/` | Source of truth |

---

*PRD generated 2026-06-24 | uReport Modernization Project*
