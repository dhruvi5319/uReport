# Technical Architecture Document — uReport CRM Modernization

**Project:** UReport  
**Acronym:** UReport  
**Version:** 1.0  
**Date:** 2026-07-06  
**Status:** Active  
**Classification:** Internal — Engineering  
**Depends On:** PRD-UReport.md v1.0, FRD-UReport.md v1.0

---

## 1. Architectural Overview

### Pattern

uReport uses a **three-tier SPA + REST API** architecture. The React single-page application communicates exclusively with the Spring Boot JSON/XML REST API. The API owns all business logic and data access. PostgreSQL is the sole persistence store. There are no server-rendered views in the new stack — all rendering is client-side in React.

The Open311 / GeoReport v2 API is implemented as a set of **content-negotiated controllers** in the same Spring Boot application. They share the same service and repository layers as the internal CRM API but apply Open311-specific serialization (GeoReport v2 JSON/XML field names). This avoids a separate service while preserving the frozen contract.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  React SPA (Nginx-served static bundle)                      │   │
│  │                                                              │   │
│  │  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │   │
│  │  │ Auth Shell   │  │ Case Mgmt   │  │ Admin Panels     │   │   │
│  │  │ Login/CAS    │  │ List/Detail │  │ People/Dept/Cat  │   │   │
│  │  └──────────────┘  └─────────────┘  └──────────────────┘   │   │
│  │  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │   │
│  │  │ Dashboard    │  │ Public Form │  │ Metrics/Reports  │   │   │
│  │  │ Map/Charts   │  │ Wizard/Map  │  │ Recharts/Tables  │   │   │
│  │  └──────────────┘  └─────────────┘  └──────────────────┘   │   │
│  │                                                              │   │
│  │  Tailwind CSS + shadcn/ui + Framer Motion + Mapbox/Leaflet   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS (JWT in httpOnly cookie)
┌──────────────────────────────▼──────────────────────────────────────┐
│                        API TIER                                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Spring Boot 3.x (Embedded Tomcat)                           │   │
│  │                                                              │   │
│  │  ┌─────────────────────┐  ┌──────────────────────────────┐  │   │
│  │  │ Open311 Controllers │  │ Internal CRM Controllers     │  │   │
│  │  │  /open311/v2/*      │  │  /api/tickets                │  │   │
│  │  │  JSON + XML + HTML  │  │  /api/people                 │  │   │
│  │  │  Content-negotiated │  │  /api/departments            │  │   │
│  │  └─────────────────────┘  │  /api/categories             │  │   │
│  │                           │  /api/dashboard              │  │   │
│  │  ┌─────────────────────┐  │  /api/auth                   │  │   │
│  │  │ Auth Controllers    │  │  /api/media                  │  │   │
│  │  │  /auth/cas/callback │  └──────────────────────────────┘  │   │
│  │  │  /api/auth/ldap     │                                     │   │
│  │  │  /api/auth/refresh  │  ┌──────────────────────────────┐  │   │
│  │  └─────────────────────┘  │ Service Layer                │  │   │
│  │                           │  TicketService               │  │   │
│  │  ┌─────────────────────┐  │  PeopleService               │  │   │
│  │  │ Spring Security     │  │  CategoryService             │  │   │
│  │  │  JWT Filter Chain   │  │  MediaService                │  │   │
│  │  │  LDAP Provider      │  │  NotificationService (SMTP)  │  │   │
│  │  │  CAS Provider       │  │  SearchService (tsvector)    │  │   │
│  │  └─────────────────────┘  └──────────────────────────────┘  │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │ Repository Layer (Spring Data JPA + MapStruct DTOs)  │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ JDBC (HikariCP connection pool)
┌──────────────────────────────▼──────────────────────────────────────┐
│                       DATA TIER                                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL 16                                               │   │
│  │                                                              │   │
│  │  18 tables + tsvector/GIN index + spatial support            │   │
│  │  Flyway versioned migrations (V1__initial_schema.sql, ...)   │   │
│  │  File storage: /var/ureport/media/{ticket_id}/{filename}     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Deployment Topology (Docker Compose)

```
┌─────────────────────────────────────────────────────┐
│  Docker Compose Host (Single Server)                 │
│                                                      │
│  ┌────────────────────┐   ┌───────────────────────┐ │
│  │  nginx:alpine      │   │  openjdk:21-jre-slim  │ │
│  │  Container: web    │   │  Container: api        │ │
│  │  Port: 80 → 443    │──▶│  Port: 8080 (internal)│ │
│  │  Serves React SPA  │   │  Spring Boot app.jar   │ │
│  │  Proxy /api, /open │   │  SMTP: JavaMailSender  │ │
│  │  /auth → api:8080  │   └──────────┬────────────┘ │
│  └────────────────────┘              │               │
│                                      │ JDBC 5432     │
│  ┌───────────────────────────────────▼─────────────┐ │
│  │  postgres:16-alpine                              │ │
│  │  Container: db                                   │ │
│  │  Port: 5432 (internal only)                      │ │
│  │  Volume: postgres_data                           │ │
│  └──────────────────────────────────────────────────┘ │
│                                                      │
│  Volumes:                                            │
│    postgres_data   → /var/lib/postgresql/data        │
│    media_files     → /var/ureport/media              │
│    (shared: api + nginx for media serving)           │
└─────────────────────────────────────────────────────┘
```

**Nginx responsibilities:**
- Serve the React SPA static bundle (`build/` output)
- Reverse-proxy `/api/*`, `/open311/*`, `/auth/*`, `/swagger-ui.html`, `/v3/api-docs` to `api:8080`
- Serve media files from the shared volume at `/api/media/*` (optional — can be proxied through Spring Boot)
- Enforce HTTPS (TLS termination)
- SameSite cookie enforcement (HTTPS required for SameSite=Strict)

### Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Single Spring Boot app for Open311 + internal CRM API | Avoids service mesh complexity; shared domain model; simpler deployment |
| JWT in httpOnly cookie (not Authorization header) | SPA cannot read httpOnly cookie value → XSS cannot steal JWT; CSRF mitigated by SameSite=Strict + CSRF token for state-changing requests |
| PostgreSQL tsvector/tsquery replacing Solr | Eliminates external JVM dependency; single-city data volume fits GIN index comfortably within ≤500 ms P95 budget |
| Content negotiation in Open311 controllers | Preserves byte-compatible responses with PHP implementation; Open311 clients may request XML or JSON |
| Flyway for all schema changes | Reproducible schema bootstrap; GitOps-compatible; mandatory for PostgreSQL migration from MySQL |
| MapStruct for DTO mapping | Compile-time safe; no runtime reflection overhead; generated code is debuggable |
| Docker Compose (not Kubernetes) | Continues existing deployment model; single-server city deployment; out of scope to introduce orchestration |
| File storage on shared volume (not object store) | Preserves existing file path structure from PHP; avoids introducing S3 dependency |

---
---

## 2. Component Architecture

### 2.1 Frontend Components (React SPA)

```
src/
├── app/
│   ├── App.tsx                    ← Root router, theme provider, auth context
│   ├── router.tsx                 ← React Router v6 route definitions
│   └── providers.tsx              ← QueryClient, ThemeProvider, AuthProvider
│
├── components/
│   ├── shell/
│   │   ├── Navbar.tsx             ← Top navbar: logo, search trigger, user menu, dark toggle
│   │   ├── Sidebar.tsx            ← Collapsible left sidebar, persisted to localStorage
│   │   ├── Breadcrumb.tsx         ← Route-aware breadcrumb trail
│   │   └── MobileDrawer.tsx       ← Sheet-based hamburger drawer (≤768px)
│   │
│   ├── ui/                        ← shadcn/ui customized components
│   │   ├── Button.tsx
│   │   ├── Badge.tsx              ← Status badge pills (open/closed/substatus colors)
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Sheet.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Table.tsx
│   │   ├── Toast.tsx
│   │   ├── Tabs.tsx
│   │   └── Popover.tsx
│   │
│   ├── map/
│   │   ├── MapWidget.tsx          ← Dashboard map: Mapbox/Leaflet, cluster pins
│   │   ├── LocationPicker.tsx     ← Pin-drop map for case submission form
│   │   └── CasePin.tsx            ← Single ticket pin with popover
│   │
│   ├── cases/
│   │   ├── CaseTable.tsx          ← Sortable/filterable ticket data table
│   │   ├── CaseRow.tsx            ← Single row with status badge
│   │   ├── FilterPanel.tsx        ← Collapsible multi-column filter
│   │   ├── FilterChips.tsx        ← Active filter chip pills with remove
│   │   ├── BulkActionBar.tsx      ← Bulk assign/close/status toolbar
│   │   ├── CaseDetail.tsx         ← Split-pane case detail layout
│   │   ├── MetadataPanel.tsx      ← Left pane: ticket fields, inline editing
│   │   ├── TimelinePanel.tsx      ← Right pane: action history
│   │   ├── ActionLogForm.tsx      ← New action entry form
│   │   ├── MediaGallery.tsx       ← Thumbnail grid
│   │   └── Lightbox.tsx           ← Full-screen photo viewer
│   │
│   ├── submission/
│   │   ├── SubmissionWizard.tsx   ← Multi-step form shell with Framer Motion
│   │   ├── StepContact.tsx        ← Step 1: Contact info
│   │   ├── StepCategory.tsx       ← Step 2: Category drill-down
│   │   ├── StepLocation.tsx       ← Step 3: Address + pin-drop
│   │   ├── StepDescription.tsx    ← Step 4: Description + photo upload
│   │   ├── StepReview.tsx         ← Step 5: Summary
│   │   └── StepConfirmation.tsx   ← Step 6: Case ID confirmation
│   │
│   ├── dashboard/
│   │   ├── StatCard.tsx           ← KPI metric card
│   │   ├── RecentCasesFeed.tsx    ← Last 10 tickets list
│   │   └── StatusDonut.tsx        ← Recharts donut chart
│   │
│   └── admin/
│       ├── PeopleList.tsx
│       ├── PersonForm.tsx
│       ├── DepartmentList.tsx
│       ├── CategoryList.tsx
│       ├── CategoryForm.tsx
│       ├── ClientList.tsx
│       └── LookupTableAdmin.tsx   ← Generic CRUD for substatus/issueType/contactMethod
│
├── pages/
│   ├── LoginPage.tsx              ← CAS/LDAP auth forms, branded
│   ├── DashboardPage.tsx
│   ├── CaseListPage.tsx
│   ├── CaseDetailPage.tsx         ← /cases/:id
│   ├── NewCasePage.tsx            ← /cases/new
│   ├── PublicSubmitPage.tsx       ← /submit (no auth)
│   ├── AccountPage.tsx            ← /account
│   ├── MetricsPage.tsx
│   ├── ReportsPage.tsx
│   └── admin/
│       ├── PeoplePage.tsx
│       ├── DepartmentsPage.tsx
│       ├── CategoriesPage.tsx
│       └── ClientsPage.tsx
│
├── hooks/
│   ├── useAuth.ts                 ← JWT presence, current user, role check
│   ├── useTickets.ts              ← TanStack Query wrappers for ticket CRUD
│   ├── useSearch.ts               ← Debounced search hook
│   ├── useGeocluster.ts           ← Map cluster data
│   └── useMedia.ts                ← File upload with progress
│
├── lib/
│   ├── api.ts                     ← Axios instance with cookie-based JWT
│   ├── animations.ts              ← Framer Motion variants (page, stagger, modal)
│   └── motion.ts                  ← prefers-reduced-motion hook
│
└── styles/
    ├── globals.css                ← Tailwind directives + CSS custom properties
    └── tokens.css                 ← Design tokens: colors, shadows, spacing vars
```

**State management:** TanStack Query (server state) + React Context (auth, theme). No Redux.

**Animation system:** All Framer Motion variants declared in `lib/animations.ts`. The `useReducedMotion()` hook disables all variants when `prefers-reduced-motion: reduce` is active.

---

### 2.2 Backend Components (Spring Boot)

```
src/main/java/gov/city/ureport/
│
├── config/
│   ├── SecurityConfig.java        ← Spring Security filter chain, JWT filter, CORS
│   ├── JwtConfig.java             ← HS256 secret, expiry, issuer from application.yml
│   ├── LdapConfig.java            ← LDAP server URL, base DN, bind credentials
│   ├── CasConfig.java             ← CAS server URL, service URL
│   ├── FlywayConfig.java          ← Flyway baseline, repair settings
│   └── OpenApiConfig.java         ← springdoc-openapi info, security scheme
│
├── controller/
│   ├── open311/
│   │   ├── Open311ServiceController.java    ← GET /open311/v2/services[/{code}]
│   │   └── Open311RequestController.java    ← GET/POST /open311/v2/requests[/{id}]
│   │
│   ├── api/
│   │   ├── TicketController.java            ← /api/tickets CRUD + actions
│   │   ├── TicketHistoryController.java     ← /api/tickets/{id}/history
│   │   ├── TicketMediaController.java       ← /api/tickets/{id}/media
│   │   ├── PeopleController.java            ← /api/people
│   │   ├── DepartmentController.java        ← /api/departments
│   │   ├── CategoryController.java          ← /api/categories
│   │   ├── CategoryGroupController.java     ← /api/category-groups
│   │   ├── ActionController.java            ← /api/actions
│   │   ├── DashboardController.java         ← /api/dashboard/*
│   │   ├── GeoclusterController.java        ← /api/geoclusters
│   │   ├── MediaController.java             ← /api/media/{id}[/thumbnail]
│   │   ├── BookmarkController.java          ← /api/bookmarks
│   │   ├── ClientController.java            ← /api/clients
│   │   └── LookupController.java            ← /api/substatus, /api/issue-types, etc.
│   │
│   └── auth/
│       ├── AuthController.java              ← /api/auth/ldap, /api/auth/me, /api/auth/logout
│       ├── CasCallbackController.java       ← /auth/cas/callback
│       └── TokenRefreshController.java      ← /api/auth/refresh
│
├── service/
│   ├── TicketService.java         ← Business logic: create, assign, close, reopen, bulk
│   ├── PeopleService.java         ← Person CRUD + email/phone/address reconciliation
│   ├── CategoryService.java       ← Category + group + response template management
│   ├── DepartmentService.java     ← Department + actions + categories
│   ├── SearchService.java         ← tsvector queries, ts_headline, search + filter combine
│   ├── MediaService.java          ← File save/delete, thumbnail generation, MIME validation
│   ├── NotificationService.java   ← SMTP email send, sentNotifications recording
│   ├── Open311Service.java        ← GeoReport v2 serialization, field translation
│   ├── DashboardService.java      ← Stat counts, chart aggregations
│   ├── GeoclusterService.java     ← Cluster data queries
│   └── AuthService.java           ← JWT issue/validate, person lookup/create on auth
│
├── repository/
│   ├── TicketRepository.java      ← JpaRepository<Ticket, Long> + @Query for FTS
│   ├── TicketHistoryRepository.java
│   ├── PeopleRepository.java
│   ├── PeopleEmailsRepository.java
│   ├── PeoplePhonesRepository.java
│   ├── PeopleAddressesRepository.java
│   ├── DepartmentRepository.java
│   ├── CategoryRepository.java
│   ├── CategoryGroupRepository.java
│   ├── ActionRepository.java
│   ├── MediaRepository.java
│   ├── BookmarkRepository.java
│   ├── ClientRepository.java
│   ├── SubstatusRepository.java
│   ├── IssueTypeRepository.java
│   ├── ContactMethodRepository.java
│   ├── GeoclusterRepository.java
│   └── TicketGeodataRepository.java
│
├── entity/                        ← JPA @Entity classes (18 tables)
├── dto/                           ← Request/Response DTOs
├── mapper/                        ← MapStruct @Mapper interfaces
├── security/
│   ├── JwtAuthFilter.java         ← OncePerRequestFilter: cookie extract + validate
│   ├── JwtService.java            ← JJWT sign/parse/validate
│   ├── CustomUserDetails.java     ← UserDetails impl with personId + role
│   └── Open311ApiKeyFilter.java   ← Validates api_key for POST /open311/v2/requests
│
└── exception/
    ├── GlobalExceptionHandler.java ← @ControllerAdvice: HTTP error → JSON body
    └── ErrorResponse.java          ← { code, description } error format
```

**Responsibilities per layer:**

| Layer | Responsibility |
|---|---|
| Controller | HTTP request binding, input validation (@Valid), content negotiation, HTTP response codes |
| Service | Business rules, transaction boundaries (@Transactional), orchestration of repository calls |
| Repository | Data access via Spring Data JPA; custom @Query for FTS and complex joins |
| Entity | JPA-mapped domain objects; no business logic |
| DTO | Wire format for API requests and responses; validated with Bean Validation |
| Mapper | MapStruct compile-time mappers between Entity ↔ DTO |
| Security | JWT filter, CAS callback handling, LDAP authentication provider |

---
---

## 3. Data Model

### 3.1 Entity-Relationship Diagram

```
┌───────────────┐         ┌──────────────────┐
│ categoryGroups│         │   departments     │
│ id PK         │◀──┐     │ id PK             │◀──────────────┐
│ name          │   │     │ name              │               │
│ ordering      │   │     │ defaultPerson_id FK────────────┐  │
└───────────────┘   │     └──────────┬────────┘           │  │
                    │                │ id                  │  │
┌───────────────┐   │     ┌──────────▼────────────────┐   │  │
│   categories  │   │     │          people            │   │  │
│ id PK         │   │     │ id PK                      │   │  │
│ name          │   │     │ firstname                  │◀──┘  │
│ department_id ├───┼────▶│ lastname                   │      │
│ categoryGroup─┘   │     │ organization               │◀─────┤
│ defaultPerson_id ─┼────▶│ department_id FK───────────┼──────┘
│ active        │   │     │ username                   │
│ featured      │   │     │ role                       │
│ displayPerm   │   │     └────────────────────────────┘
│ postingPerm   │   │       │    │    │
│ slaDays       │   │       │    │    │
│ autoClose...  │   │     ┌─▼─┐┌─▼─┐┌─▼──────────┐
└───────┬───────┘   │     │   ││   ││            │
        │           │     │ p ││ p ││ p          │
┌───────▼───────┐   │     │ e ││ e ││ e          │
│cat_action_resp│   │     │ o ││ o ││ o          │
│ category_id FK│   │     │ p ││ p ││ p          │
│ action_id FK  │   │     │ l ││ l ││ l          │
│ template      │   │     │ e ││ e ││ e          │
│ replyEmail    │   │     │ E ││ P ││ A          │
└───────────────┘   │     │ m ││ h ││ d          │
                    │     │ a ││ o ││ d          │
┌───────────────┐   │     │ i ││ n ││ r          │
│dept_categories│   │     │ l ││ e ││ e          │
│ department_id ├───┘     │ s ││ s ││ s          │
│ category_id   │         └───┘└───┘└────────────┘
└───────────────┘
        
┌────────────────────────────────────────────────────────┐
│                        tickets                          │
│ id PK                                                   │
│ parent_id FK→tickets    category_id FK→categories       │
│ issueType_id FK         client_id FK→clients            │
│ enteredByPerson_id FK   reportedByPerson_id FK          │
│ assignedPerson_id FK    contactMethod_id FK             │
│ status (open/closed)    substatus_id FK→substatus       │
│ enteredDate  closedDate  lastModified                   │
│ location  latitude  longitude  city  state  zip         │
│ description  additionalFields  customFields             │
│ search_vector tsvector  ← FTS column (added by Flyway)  │
└────────────────────────────────────────────────────────┘
        │                    │
        │                    │
┌───────▼──────┐    ┌────────▼─────────┐
│ ticketHistory│    │  ticket_geodata   │
│ id PK        │    │ ticket_id PK FK   │
│ ticket_id FK │    │ cluster_id_0..6 FK│
│ enteredByPerson   └───────┬──────────┘
│ actionPerson │            │
│ action_id FK │    ┌───────▼──────────┐
│ enteredDate  │    │   geoclusters    │
│ actionDate   │    │ id PK            │
│ notes        │    │ level            │
│ sentNotif... │    │ center POINT     │
└──────────────┘    └──────────────────┘
        
┌──────────┐   ┌──────────┐   ┌──────────────┐   ┌─────────────┐
│  actions │   │substatus │   │  issueTypes  │   │contactMeth  │
│ id PK    │   │ id PK    │   │ id PK        │   │ id PK       │
│ name     │   │ name     │   │ name         │   │ name        │
│ type     │   │ status   │   └──────────────┘   └─────────────┘
│ template │   │ isDefault│
│ replyEmail│  └──────────┘
└──────────┘

┌───────────────┐   ┌──────────┐   ┌────────────┐
│dept_actions   │   │  media   │   │  bookmarks │
│department_id  │   │ id PK    │   │ id PK      │
│action_id      │   │ticket_id │   │ person_id  │
└───────────────┘   │filename  │   │ type       │
                    │mime_type │   │ name       │
┌───────────────┐   │uploaded  │   │ requestUri │
│   clients     │   │person_id │   └────────────┘
│ id PK         │   └──────────┘
│ name, url     │
│ api_key       │
│contactPerson  │
│contactMethod  │
└───────────────┘
```

---

### 3.2 Complete PostgreSQL DDL (Flyway V1__initial_schema.sql)

#### Core Lookup Tables

```sql
-- ============================================================
-- CONTACT METHODS
-- ============================================================
CREATE TABLE contact_methods (
    id   SERIAL       PRIMARY KEY,
    name VARCHAR(128) NOT NULL
);
INSERT INTO contact_methods (name) VALUES ('Email'), ('Phone'), ('Web Form'), ('Other');

-- ============================================================
-- SUBSTATUS
-- ============================================================
CREATE TABLE substatus (
    id          SERIAL       PRIMARY KEY,
    name        VARCHAR(25)  NOT NULL,
    description VARCHAR(128) NOT NULL,
    status      VARCHAR(10)  NOT NULL DEFAULT 'open'
                             CHECK (status IN ('open', 'closed')),
    is_default  BOOLEAN      NOT NULL DEFAULT FALSE
);
INSERT INTO substatus (status, name, description) VALUES
    ('closed', 'Resolved',  'This ticket has been taken care of'),
    ('closed', 'Duplicate', 'This ticket is a duplicate of another ticket'),
    ('closed', 'Bogus',     'This ticket is not actually a problem or has already been taken care of');

-- ============================================================
-- ACTIONS
-- ============================================================
CREATE TABLE actions (
    id          SERIAL       PRIMARY KEY,
    name        VARCHAR(25)  NOT NULL,
    description VARCHAR(128) NOT NULL,
    type        VARCHAR(20)  NOT NULL DEFAULT 'department'
                             CHECK (type IN ('system', 'department')),
    template    TEXT,
    reply_email VARCHAR(128)
);
INSERT INTO actions (name, type, description) VALUES
    ('open',           'system', 'Opened by {actionPerson}'),
    ('assignment',     'system', '{enteredByPerson} assigned this case to {actionPerson}'),
    ('closed',         'system', 'Closed by {actionPerson}'),
    ('changeCategory', 'system', 'Changed category from {original:category_id} to {updated:category_id}'),
    ('changeLocation', 'system', 'Changed location from {original:location} to {updated:location}'),
    ('response',       'system', '{actionPerson} contacted {reportedByPerson_id}'),
    ('duplicate',      'system', '{duplicate:ticket_id} marked as a duplicate of this case.'),
    ('update',         'system', '{enteredByPerson} updated this case.'),
    ('comment',        'system', '{enteredByPerson} commented on this case.'),
    ('upload_media',   'system', '{enteredByPerson} uploaded an attachment.');

-- ============================================================
-- ISSUE TYPES
-- ============================================================
CREATE TABLE issue_types (
    id   SERIAL       PRIMARY KEY,
    name VARCHAR(128) NOT NULL
);
INSERT INTO issue_types (name) VALUES
    ('Comment'), ('Complaint'), ('Question'), ('Report'), ('Request'), ('Violation');

-- ============================================================
-- CATEGORY GROUPS
-- ============================================================
CREATE TABLE category_groups (
    id       SERIAL      PRIMARY KEY,
    name     VARCHAR(50) NOT NULL,
    ordering SMALLINT
);
INSERT INTO category_groups (name) VALUES ('Streets'), ('Sanitation'), ('Other');
```

#### People and Contact Tables

```sql
-- ============================================================
-- DEPARTMENTS  (forward-declared before people due to mutual FK)
-- ============================================================
CREATE TABLE departments (
    id                SERIAL       PRIMARY KEY,
    name              VARCHAR(128) NOT NULL,
    default_person_id INTEGER      -- FK added after people table
);

-- ============================================================
-- PEOPLE
-- ============================================================
CREATE TABLE people (
    id            SERIAL       PRIMARY KEY,
    firstname     VARCHAR(128),
    middlename    VARCHAR(128),
    lastname      VARCHAR(128),
    organization  VARCHAR(128),
    address       VARCHAR(128),
    city          VARCHAR(128),
    state         VARCHAR(128),
    zip           VARCHAR(20),
    department_id INTEGER      REFERENCES departments(id),
    username      VARCHAR(40)  UNIQUE,
    role          VARCHAR(30)
                  CHECK (role IN ('admin', 'staff', 'public') OR role IS NULL)
);

-- Add deferred FK for departments.default_person_id
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_default_person
    FOREIGN KEY (default_person_id) REFERENCES people(id);

CREATE INDEX idx_people_department_id ON people(department_id);
CREATE INDEX idx_people_username      ON people(username);
CREATE INDEX idx_people_lastname      ON people(lastname);

-- ============================================================
-- PEOPLE EMAILS
-- ============================================================
CREATE TABLE people_emails (
    id                    SERIAL       PRIMARY KEY,
    person_id             INTEGER      NOT NULL REFERENCES people(id),
    email                 VARCHAR(255) NOT NULL,
    label                 VARCHAR(10)  NOT NULL DEFAULT 'Other'
                          CHECK (label IN ('Home', 'Work', 'Other')),
    used_for_notifications BOOLEAN     NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_people_emails_person_id ON people_emails(person_id);
CREATE INDEX idx_people_emails_email     ON people_emails(email);

-- ============================================================
-- PEOPLE PHONES
-- ============================================================
CREATE TABLE people_phones (
    id        SERIAL      PRIMARY KEY,
    person_id INTEGER     NOT NULL REFERENCES people(id),
    number    VARCHAR(20),
    label     VARCHAR(10) NOT NULL DEFAULT 'Other'
              CHECK (label IN ('Main', 'Mobile', 'Work', 'Home', 'Fax', 'Pager', 'Other'))
);
CREATE INDEX idx_people_phones_person_id ON people_phones(person_id);

-- ============================================================
-- PEOPLE ADDRESSES
-- ============================================================
CREATE TABLE people_addresses (
    id        SERIAL       PRIMARY KEY,
    person_id INTEGER      NOT NULL REFERENCES people(id),
    address   VARCHAR(128) NOT NULL,
    city      VARCHAR(128),
    state     VARCHAR(128),
    zip       VARCHAR(20),
    label     VARCHAR(10)  NOT NULL DEFAULT 'Home'
              CHECK (label IN ('Home', 'Business', 'Rental'))
);
CREATE INDEX idx_people_addresses_person_id ON people_addresses(person_id);
```

#### Client / API Key Tables

```sql
-- ============================================================
-- CLIENTS (Open311 API consumers)
-- ============================================================
CREATE TABLE clients (
    id                 SERIAL       PRIMARY KEY,
    name               VARCHAR(128) NOT NULL,
    url                VARCHAR(255),
    api_key            VARCHAR(50)  NOT NULL UNIQUE,
    contact_person_id  INTEGER      NOT NULL REFERENCES people(id),
    contact_method_id  INTEGER      REFERENCES contact_methods(id)
);
CREATE INDEX idx_clients_api_key           ON clients(api_key);
CREATE INDEX idx_clients_contact_person_id ON clients(contact_person_id);
```

#### Category Tables

```sql
-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
    id                      SERIAL       PRIMARY KEY,
    name                    VARCHAR(50)  NOT NULL,
    description             VARCHAR(512),
    department_id           INTEGER      NOT NULL REFERENCES departments(id),
    default_person_id       INTEGER      REFERENCES people(id),
    category_group_id       INTEGER      REFERENCES category_groups(id),
    active                  BOOLEAN      NOT NULL DEFAULT TRUE,
    featured                BOOLEAN      NOT NULL DEFAULT FALSE,
    display_permission_level VARCHAR(20) NOT NULL DEFAULT 'staff'
                             CHECK (display_permission_level IN ('staff', 'public', 'anonymous')),
    posting_permission_level VARCHAR(20) NOT NULL DEFAULT 'staff'
                             CHECK (posting_permission_level IN ('staff', 'public', 'anonymous')),
    custom_fields           TEXT,
    last_modified           TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sla_days                INTEGER      CHECK (sla_days > 0),
    notification_reply_email VARCHAR(128),
    auto_close_is_active    BOOLEAN      NOT NULL DEFAULT FALSE,
    auto_close_substatus_id INTEGER      REFERENCES substatus(id)
);
CREATE INDEX idx_categories_department_id    ON categories(department_id);
CREATE INDEX idx_categories_category_group_id ON categories(category_group_id);
CREATE INDEX idx_categories_active           ON categories(active);

-- ============================================================
-- CATEGORY ACTION RESPONSES (response templates per category+action)
-- ============================================================
CREATE TABLE category_action_responses (
    id          SERIAL   PRIMARY KEY,
    category_id INTEGER  NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    action_id   INTEGER  NOT NULL REFERENCES actions(id),
    template    TEXT,
    reply_email VARCHAR(128)
);
CREATE INDEX idx_car_category_id ON category_action_responses(category_id);
CREATE INDEX idx_car_action_id   ON category_action_responses(action_id);

-- ============================================================
-- DEPARTMENT ACTIONS (allowed action types per department)
-- ============================================================
CREATE TABLE department_actions (
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    action_id     INTEGER NOT NULL REFERENCES actions(id),
    PRIMARY KEY (department_id, action_id)
);

-- ============================================================
-- DEPARTMENT CATEGORIES (secondary department-category mapping)
-- ============================================================
CREATE TABLE department_categories (
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    category_id   INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (department_id, category_id)
);
```

#### Core Ticket Tables

```sql
-- ============================================================
-- TICKETS
-- ============================================================
CREATE TABLE tickets (
    id                    SERIAL        PRIMARY KEY,
    parent_id             INTEGER       REFERENCES tickets(id),
    category_id           INTEGER       REFERENCES categories(id),
    issue_type_id         INTEGER       REFERENCES issue_types(id),
    client_id             INTEGER       REFERENCES clients(id),
    entered_by_person_id  INTEGER       REFERENCES people(id),
    reported_by_person_id INTEGER       REFERENCES people(id),
    assigned_person_id    INTEGER       REFERENCES people(id),
    contact_method_id     INTEGER       REFERENCES contact_methods(id),
    response_method_id    INTEGER       REFERENCES contact_methods(id),
    entered_date          TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified         TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    address_id            INTEGER,
    latitude              DOUBLE PRECISION,
    longitude             DOUBLE PRECISION,
    location              VARCHAR(128),
    city                  VARCHAR(128),
    state                 VARCHAR(128),
    zip                   VARCHAR(40),
    status                VARCHAR(20)   NOT NULL DEFAULT 'open'
                          CHECK (status IN ('open', 'closed')),
    closed_date           TIMESTAMPTZ,
    substatus_id          INTEGER       REFERENCES substatus(id),
    additional_fields     VARCHAR(255),
    custom_fields         TEXT,
    description           TEXT,
    -- Full-text search vector (populated by trigger V2__search_vector.sql)
    search_vector         TSVECTOR
);

CREATE INDEX idx_tickets_category_id           ON tickets(category_id);
CREATE INDEX idx_tickets_assigned_person_id    ON tickets(assigned_person_id);
CREATE INDEX idx_tickets_reported_by_person_id ON tickets(reported_by_person_id);
CREATE INDEX idx_tickets_entered_by_person_id  ON tickets(entered_by_person_id);
CREATE INDEX idx_tickets_status                ON tickets(status);
CREATE INDEX idx_tickets_entered_date          ON tickets(entered_date DESC);
CREATE INDEX idx_tickets_substatus_id          ON tickets(substatus_id);
CREATE INDEX idx_tickets_parent_id             ON tickets(parent_id);
CREATE INDEX idx_tickets_client_id             ON tickets(client_id);

-- ============================================================
-- TICKET HISTORY (immutable audit trail)
-- ============================================================
CREATE TABLE ticket_history (
    id                    SERIAL      PRIMARY KEY,
    ticket_id             INTEGER     NOT NULL REFERENCES tickets(id),
    entered_by_person_id  INTEGER     REFERENCES people(id),
    action_person_id      INTEGER     REFERENCES people(id),
    action_id             INTEGER     NOT NULL REFERENCES actions(id),
    entered_date          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action_date           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes                 TEXT,
    data                  TEXT,
    sent_notifications    TEXT        -- JSON array of email addresses notified
);
CREATE INDEX idx_ticket_history_ticket_id             ON ticket_history(ticket_id);
CREATE INDEX idx_ticket_history_entered_by_person_id  ON ticket_history(entered_by_person_id);
CREATE INDEX idx_ticket_history_action_person_id      ON ticket_history(action_person_id);
CREATE INDEX idx_ticket_history_action_id             ON ticket_history(action_id);
CREATE INDEX idx_ticket_history_entered_date          ON ticket_history(entered_date DESC);

-- ============================================================
-- MEDIA
-- ============================================================
CREATE TABLE media (
    id                SERIAL       PRIMARY KEY,
    ticket_id         INTEGER      NOT NULL REFERENCES tickets(id),
    filename          VARCHAR(128) NOT NULL,
    internal_filename VARCHAR(50)  NOT NULL UNIQUE,
    mime_type         VARCHAR(128),
    uploaded          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    person_id         INTEGER      REFERENCES people(id)
);
CREATE INDEX idx_media_ticket_id  ON media(ticket_id);
CREATE INDEX idx_media_person_id  ON media(person_id);
CREATE INDEX idx_media_uploaded   ON media(uploaded DESC);

-- ============================================================
-- BOOKMARKS (saved searches per user)
-- ============================================================
CREATE TABLE bookmarks (
    id          SERIAL        PRIMARY KEY,
    person_id   INTEGER       NOT NULL REFERENCES people(id),
    type        VARCHAR(128)  NOT NULL DEFAULT 'search',
    name        VARCHAR(128),
    request_uri VARCHAR(1024) NOT NULL
);
CREATE INDEX idx_bookmarks_person_id ON bookmarks(person_id);

-- ============================================================
-- GEOCLUSTERS (pre-computed geographic clusters)
-- ============================================================
CREATE TABLE geoclusters (
    id     SERIAL   PRIMARY KEY,
    level  SMALLINT NOT NULL,
    -- PostGIS point: SRID 4326; stored as (longitude, latitude)
    center POINT    NOT NULL
);
CREATE INDEX idx_geoclusters_level ON geoclusters(level);

-- ============================================================
-- TICKET GEODATA (maps ticket to zoom-level cluster)
-- ============================================================
CREATE TABLE ticket_geodata (
    ticket_id    INTEGER PRIMARY KEY REFERENCES tickets(id),
    cluster_id_0 INTEGER REFERENCES geoclusters(id),
    cluster_id_1 INTEGER REFERENCES geoclusters(id),
    cluster_id_2 INTEGER REFERENCES geoclusters(id),
    cluster_id_3 INTEGER REFERENCES geoclusters(id),
    cluster_id_4 INTEGER REFERENCES geoclusters(id),
    cluster_id_5 INTEGER REFERENCES geoclusters(id),
    cluster_id_6 INTEGER REFERENCES geoclusters(id)
);
CREATE INDEX idx_ticket_geodata_cluster_0 ON ticket_geodata(cluster_id_0);
CREATE INDEX idx_ticket_geodata_cluster_1 ON ticket_geodata(cluster_id_1);
```

---

### 3.3 Full-Text Search — Flyway V2__search_vector.sql

```sql
-- Add search_vector column (idempotent if run after V1)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- GIN index for sub-100ms FTS queries
CREATE INDEX idx_tickets_search_vector ON tickets USING GIN (search_vector);

-- Trigger function to maintain search_vector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION tickets_search_vector_update()
RETURNS TRIGGER AS $$
DECLARE
    reporter_firstname TEXT := '';
    reporter_lastname  TEXT := '';
    category_name      TEXT := '';
BEGIN
    -- Resolve reporter name
    IF NEW.reported_by_person_id IS NOT NULL THEN
        SELECT COALESCE(firstname, ''), COALESCE(lastname, '')
        INTO reporter_firstname, reporter_lastname
        FROM people WHERE id = NEW.reported_by_person_id;
    END IF;

    -- Resolve category name
    IF NEW.category_id IS NOT NULL THEN
        SELECT COALESCE(name, '')
        INTO category_name
        FROM categories WHERE id = NEW.category_id;
    END IF;

    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.id::TEXT, '')),    'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.location, '')),    'B') ||
        setweight(to_tsvector('english', reporter_lastname),             'C') ||
        setweight(to_tsvector('english', reporter_firstname),            'C') ||
        setweight(to_tsvector('english', category_name),                 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_search_vector_trigger
BEFORE INSERT OR UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION tickets_search_vector_update();

-- Backfill existing rows after migration
UPDATE tickets SET search_vector = NULL WHERE id > 0;
-- (trigger fires on UPDATE, populating search_vector for all rows)
```

---

### 3.4 Column Name Mapping (MySQL → PostgreSQL)

The MySQL schema uses camelCase column names. PostgreSQL uses snake_case per convention.

| MySQL Column | PostgreSQL Column | Table |
|---|---|---|
| `defaultPerson_id` | `default_person_id` | `departments` |
| `department_id` | `department_id` | `people` |
| `usedForNotifications` | `used_for_notifications` | `people_emails` |
| `contactPerson_id` | `contact_person_id` | `clients` |
| `contactMethod_id` | `contact_method_id` | `clients` |
| `defaultPerson_id` | `default_person_id` | `categories` |
| `categoryGroup_id` | `category_group_id` | `categories` |
| `displayPermissionLevel` | `display_permission_level` | `categories` |
| `postingPermissionLevel` | `posting_permission_level` | `categories` |
| `lastModified` | `last_modified` | `categories` |
| `slaDays` | `sla_days` | `categories` |
| `notificationReplyEmail` | `notification_reply_email` | `categories` |
| `autoCloseIsActive` | `auto_close_is_active` | `categories` |
| `autoCloseSubstatus_id` | `auto_close_substatus_id` | `categories` |
| `category_id` | `category_id` | `category_action_responses` |
| `action_id` | `action_id` | `category_action_responses` |
| `replyEmail` | `reply_email` | `category_action_responses`, `actions` |
| `issueType_id` | `issue_type_id` | `tickets` |
| `client_id` | `client_id` | `tickets` |
| `enteredByPerson_id` | `entered_by_person_id` | `tickets` |
| `reportedByPerson_id` | `reported_by_person_id` | `tickets` |
| `assignedPerson_id` | `assigned_person_id` | `tickets` |
| `contactMethod_id` | `contact_method_id` | `tickets` |
| `responseMethod_id` | `response_method_id` | `tickets` |
| `enteredDate` | `entered_date` | `tickets` |
| `lastModified` | `last_modified` | `tickets` |
| `addressId` | `address_id` | `tickets` |
| `closedDate` | `closed_date` | `tickets` |
| `substatus_id` | `substatus_id` | `tickets` |
| `additionalFields` | `additional_fields` | `tickets` |
| `customFields` | `custom_fields` | `tickets` |
| `enteredByPerson_id` | `entered_by_person_id` | `ticket_history` |
| `actionPerson_id` | `action_person_id` | `ticket_history` |
| `action_id` | `action_id` | `ticket_history` |
| `enteredDate` | `entered_date` | `ticket_history` |
| `actionDate` | `action_date` | `ticket_history` |
| `sentNotifications` | `sent_notifications` | `ticket_history` |
| `internalFilename` | `internal_filename` | `media` |
| `mime_type` | `mime_type` | `media` (unchanged) |
| `person_id` | `person_id` | `media` (unchanged) |
| `requestUri` | `request_uri` | `bookmarks` |
| `isDefault` | `is_default` | `substatus` |

**MySQL type mappings:**
- `INT UNSIGNED` → `INTEGER` (PostgreSQL has no unsigned; application enforces non-negative)
- `TINYINT(1)` → `BOOLEAN`
- `TINYINT UNSIGNED` → `SMALLINT`
- `FLOAT(17,14)` → `DOUBLE PRECISION`
- `DATETIME` → `TIMESTAMPTZ`
- `TIMESTAMP` → `TIMESTAMPTZ`
- `ENUM(...)` → `VARCHAR(n)` with `CHECK` constraint (preserves values; avoids PostgreSQL enum type migration complexity)
- `POINT` → `POINT` (PostgreSQL native; no PostGIS required for simple lat/lon storage; use PostGIS `GEOGRAPHY` if spatial queries needed)

---
---

## 4. API Design

### 4.1 Base URLs and Conventions

| Surface | Base Path | Auth |
|---|---|---|
| Open311 / GeoReport v2 | `/open311/v2/` | Public (api_key for writes) |
| Internal CRM API | `/api/` | JWT (httpOnly cookie) |
| Auth endpoints | `/api/auth/`, `/auth/` | Special (see §Security) |
| Media serving | `/api/media/` | JWT (public categories: none) |
| OpenAPI spec | `/v3/api-docs` | None |
| Swagger UI | `/swagger-ui.html` | None |

**Response format:** `application/json` for all `/api/*` endpoints.  
**Error format:** `{ "code": "ERROR_CODE", "message": "Human-readable message" }`  
**Pagination:** `{ "data": [...], "total": N, "page": N, "pageSize": N }`  
**Timestamps:** ISO 8601 UTC in all JSON responses.  
**Content negotiation (Open311 only):** Format priority: URL suffix (`.json`/`.xml`) → `format` query param → `Accept` header → default JSON.

---

### 4.2 Open311 / GeoReport v2 Endpoints (Frozen Contract)

These endpoints are identical in path, HTTP method, query parameters, and response field names to the existing PHP implementation. **No changes are permitted.**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/open311/v2/services` | None (api_key opt.) | List all postable service categories |
| GET | `/open311/v2/services/{service_code}` | None | Single service category detail |
| GET | `/open311/v2/requests` | None | List service requests with filters |
| GET | `/open311/v2/requests/{service_request_id}` | None | Single service request |
| POST | `/open311/v2/requests` | api_key required | Submit a new service request |

**Content negotiation precedence:**
1. URL path suffix: `.json` → JSON; `.xml` → XML
2. `format` query param: `json` / `xml`
3. `Accept` header: `application/json` / `application/xml` / `text/html`
4. Default: JSON

**Service Object (GET /services response element):**

```typescript
interface Open311Service {
  service_code: string;       // categories.id as string
  service_name: string;       // categories.name
  description: string;        // categories.description
  metadata: false;            // always false
  type: "realtime";           // always "realtime"
  keywords: "";               // always empty string
  group: string;              // category_groups.name
}
```

**Service Request Object (GET /requests response element):**

```typescript
interface Open311ServiceRequest {
  service_request_id: string;   // tickets.id as string
  status: "open" | "closed";
  status_notes: string;         // latest action notes
  service_name: string;         // categories.name
  service_code: string;         // tickets.category_id as string
  description: string;          // tickets.description
  agency_responsible: string;   // departments.name
  service_notice: "";           // always empty
  requested_datetime: string;   // tickets.entered_date ISO 8601
  updated_datetime: string;     // tickets.last_modified ISO 8601
  expected_datetime: string | null; // entered_date + sla_days or null
  address: string;              // tickets.location
  address_id: string;           // tickets.address_id
  zipcode: string;              // tickets.zip
  lat: number | null;           // tickets.latitude
  long: number | null;          // tickets.longitude
  media_url: string;            // URL of first media or ""
}
```

---

### 4.3 Internal CRM API Endpoints

#### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/ldap` | None | LDAP login; sets JWT cookie |
| GET | `/api/auth/me` | JWT | Current authenticated user |
| POST | `/api/auth/refresh` | Refresh cookie | Renew JWT |
| POST | `/api/auth/logout` | JWT | Clear cookies; CAS single sign-out |
| GET | `/auth/cas/callback` | None | CAS service ticket validation |

```typescript
interface LdapLoginRequest {
  username: string;   // max 40 chars
  password: string;   // never logged or stored
}

interface AuthMeResponse {
  personId: number;
  username: string;
  role: "admin" | "staff" | "public";
  firstname: string | null;
  lastname: string | null;
  expiresAt: string; // ISO 8601 UTC
}
```

---

#### Tickets

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/tickets` | JWT | Paginated filtered ticket list with FTS |
| POST | `/api/tickets` | JWT | Create ticket (staff) |
| POST | `/api/tickets/public` | None | Create ticket (public submission) |
| GET | `/api/tickets/export` | JWT | CSV export of filtered results |
| POST | `/api/tickets/bulk` | JWT | Bulk assign/close/status |
| GET | `/api/tickets/{id}` | JWT | Single ticket detail |
| PATCH | `/api/tickets/{id}` | JWT | Partial field update |
| POST | `/api/tickets/{id}/close` | JWT | Close with substatus |
| POST | `/api/tickets/{id}/reopen` | JWT | Reopen closed ticket |
| POST | `/api/tickets/{id}/assign` | JWT | Assign to person |
| GET | `/api/tickets/{id}/history` | JWT | Action timeline |
| POST | `/api/tickets/{id}/history` | JWT | Log action entry |
| GET | `/api/tickets/{id}/media` | JWT* | List media attachments |
| POST | `/api/tickets/{id}/media` | JWT | Upload media to ticket |
| DELETE | `/api/tickets/{id}/media/{mediaId}` | JWT | Delete media |

*JWT required for staff-only categories; public categories served without auth.

```typescript
// GET /api/tickets query parameters
interface TicketListParams {
  q?: string;              // full-text search term (max 255 chars)
  status?: "open" | "closed";
  substatus_id?: number;
  category_id?: number;
  category_group_id?: number;
  department_id?: number;
  assigned_person_id?: number;
  issue_type_id?: number;
  start_date?: string;     // YYYY-MM-DD
  end_date?: string;       // YYYY-MM-DD
  sort?: string;           // field name whitelist
  dir?: "asc" | "desc";
  page?: number;           // 1-based
  page_size?: number;      // 10 | 25 | 50 | 100
}

interface TicketListItem {
  id: number;
  status: "open" | "closed";
  substatus: SubstatusRef | null;
  category: CategoryRef;
  department: DepartmentRef;
  assignedPerson: PersonRef | null;
  reportedByPerson: PersonRef | null;
  location: string | null;
  enteredDate: string;       // ISO 8601
  lastModified: string;      // ISO 8601
  searchSnippet: string | null; // ts_headline output when q provided
  mediaCount: number;
}

interface TicketDetail extends TicketListItem {
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  parentId: number | null;
  contactMethod: ContactMethodRef | null;
  issueType: IssueTypeRef | null;
  closedDate: string | null;
  customFields: Record<string, unknown> | null;
  enteredByPerson: PersonRef | null;
  client: ClientRef | null;
  slaDueDate: string | null;  // entered_date + sla_days
  isOverdue: boolean;
}

interface CreateTicketRequest {
  categoryId: number;        // required; active category
  description: string;       // required; min 1 char
  location?: string;         // required if no lat/lon
  latitude?: number;         // -90 to 90
  longitude?: number;        // -180 to 180
  city?: string;
  state?: string;
  zip?: string;
  reportedByPersonId?: number;
  assignedPersonId?: number;
  issueTypeId?: number;
  contactMethodId?: number;
  customFields?: Record<string, unknown>;
}

interface CloseTicketRequest {
  substatusId: number;       // required
  parentId?: number;         // required when substatus = Duplicate
  notes?: string;
  notifyReporter?: boolean;
}

interface AssignTicketRequest {
  personId: number;          // required; must be staff person
  notes?: string;
  notifyAssignee?: boolean;
}

interface BulkTicketRequest {
  ticketIds: number[];       // required; min 1
  action: "assign" | "close" | "changeStatus";
  assignedPersonId?: number; // for action=assign
  substatusId?: number;      // for action=close
  status?: string;           // for action=changeStatus
}
```

---

#### Ticket History (Action Log)

```typescript
interface TicketHistoryEntry {
  id: number;
  ticketId: number;
  action: ActionRef;
  enteredByPerson: PersonRef | null;
  actionPerson: PersonRef | null;
  enteredDate: string;   // ISO 8601
  actionDate: string;    // ISO 8601
  notes: string | null;
  sentNotifications: string[] | null; // email addresses
  media: MediaRef[];
}

interface LogActionRequest {
  actionId: number;          // required; department-type action
  notes?: string;            // required when action = "response"
  notifyReporter?: boolean;
  notifyAssignee?: boolean;
  actionPersonId?: number;   // defaults to current user
}
```

---

#### People

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/people` | JWT | List people (search + role filter, paginated) |
| POST | `/api/people` | JWT (admin) | Create person |
| GET | `/api/people/{id}` | JWT | Person detail |
| PUT | `/api/people/{id}` | JWT (admin) | Full update |
| PATCH | `/api/people/{id}` | JWT | Partial update (own record or admin) |
| DELETE | `/api/people/{id}` | JWT (admin) | Delete person |
| GET | `/api/people/{id}/tickets` | JWT | Tickets for person |

```typescript
interface PersonDetail {
  id: number;
  firstname: string | null;
  middlename: string | null;
  lastname: string | null;
  organization: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  department: DepartmentRef | null;
  username: string | null;
  role: "admin" | "staff" | "public" | null;
  emails: PersonEmail[];
  phones: PersonPhone[];
  addresses: PersonAddress[];
}

interface PersonEmail {
  id?: number;
  email: string;
  label: "Home" | "Work" | "Other";
  usedForNotifications: boolean;
}

interface PersonPhone {
  id?: number;
  number: string;
  label: "Main" | "Mobile" | "Work" | "Home" | "Fax" | "Pager" | "Other";
}

interface PersonAddress {
  id?: number;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  label: "Home" | "Business" | "Rental";
}
```

---

#### Departments

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/departments` | JWT | List all departments |
| POST | `/api/departments` | JWT (admin) | Create department |
| GET | `/api/departments/{id}` | JWT | Department detail |
| PUT | `/api/departments/{id}` | JWT (admin) | Update department |
| DELETE | `/api/departments/{id}` | JWT (admin) | Delete department |
| GET | `/api/departments/{id}/categories` | JWT | Categories in department |

```typescript
interface DepartmentDetail {
  id: number;
  name: string;
  defaultPerson: PersonRef | null;
  categoryCount: number;
  actionIds: number[];  // allowed action type IDs
}

interface CreateDepartmentRequest {
  name: string;          // required; max 128 chars
  defaultPersonId?: number;
  actionIds?: number[];  // department_actions entries
}
```

---

#### Categories and Category Groups

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/category-groups` | JWT | List category groups |
| POST | `/api/category-groups` | JWT (admin) | Create category group |
| PUT | `/api/category-groups/{id}` | JWT (admin) | Update category group |
| DELETE | `/api/category-groups/{id}` | JWT (admin) | Delete category group |
| GET | `/api/categories` | JWT | List categories |
| POST | `/api/categories` | JWT (admin) | Create category |
| GET | `/api/categories/{id}` | JWT | Category detail |
| PUT | `/api/categories/{id}` | JWT (admin) | Update category |
| DELETE | `/api/categories/{id}` | JWT (admin) | Delete category |
| GET | `/api/categories/public` | None | Public-postable categories |
| GET | `/api/categories/{id}/action-responses/{actionId}` | JWT | Response template |

```typescript
interface CategoryDetail {
  id: number;
  name: string;
  description: string | null;
  department: DepartmentRef;
  defaultPerson: PersonRef | null;
  categoryGroup: CategoryGroupRef | null;
  active: boolean;
  featured: boolean;
  displayPermissionLevel: "staff" | "public" | "anonymous";
  postingPermissionLevel: "staff" | "public" | "anonymous";
  slaDays: number | null;
  notificationReplyEmail: string | null;
  autoCloseIsActive: boolean;
  autoCloseSubstatusId: number | null;
  actionResponses: CategoryActionResponse[];
}

interface CategoryActionResponse {
  id?: number;
  actionId: number;
  template: string | null;
  replyEmail: string | null;
}
```

---

#### Dashboard

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/stats` | JWT | Stat card counts |
| GET | `/api/dashboard/chart` | JWT | Donut chart data |
| GET | `/api/geoclusters` | JWT | Cluster data (zoom param) |

```typescript
interface DashboardStats {
  totalOpen: number;
  openedToday: number;
  closedToday: number;
  overdue: number;
}

interface DashboardChartData {
  groupBy: "status" | "category" | "department";
  segments: { label: string; count: number; color?: string }[];
}

interface GeoclusterResponse {
  clusters: {
    id: number;
    level: number;
    center: { lat: number; lon: number };
    ticketCount: number;
  }[];
}
```

---

#### Media

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/media/{mediaId}` | JWT* | Serve full-resolution file |
| GET | `/api/media/{mediaId}/thumbnail` | JWT* | Serve 150×150 thumbnail |

*JWT optional for public-category tickets.

```typescript
interface MediaRef {
  id: number;
  filename: string;
  mimeType: string;
  uploaded: string;    // ISO 8601
  uploadedBy: PersonRef | null;
  url: string;         // /api/media/{id}
  thumbnailUrl: string; // /api/media/{id}/thumbnail
}
```

---

#### Bookmarks

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/bookmarks` | JWT | List user's saved searches |
| POST | `/api/bookmarks` | JWT | Create saved search |
| DELETE | `/api/bookmarks/{id}` | JWT | Delete saved search |

```typescript
interface Bookmark {
  id: number;
  type: string;          // "search"
  name: string | null;
  requestUri: string;    // URL query string snapshot
}
```

---

#### Lookup Tables (Admin)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/substatus` | JWT | List substatuses |
| POST | `/api/substatus` | JWT (admin) | Create substatus |
| PUT | `/api/substatus/{id}` | JWT (admin) | Update substatus |
| DELETE | `/api/substatus/{id}` | JWT (admin) | Delete substatus |
| GET | `/api/issue-types` | JWT | List issue types |
| POST | `/api/issue-types` | JWT (admin) | Create issue type |
| PUT | `/api/issue-types/{id}` | JWT (admin) | Update issue type |
| DELETE | `/api/issue-types/{id}` | JWT (admin) | Delete issue type |
| GET | `/api/contact-methods` | JWT | List contact methods |
| POST | `/api/contact-methods` | JWT (admin) | Create contact method |
| PUT | `/api/contact-methods/{id}` | JWT (admin) | Update contact method |
| DELETE | `/api/contact-methods/{id}` | JWT (admin) | Delete contact method |
| GET | `/api/actions` | JWT | List action types |

---

#### Clients (Open311 API Key Management)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/clients` | JWT (admin) | List Open311 clients |
| POST | `/api/clients` | JWT (admin) | Create client + generate API key |
| GET | `/api/clients/{id}` | JWT (admin) | Client detail |
| PUT | `/api/clients/{id}` | JWT (admin) | Update client |
| DELETE | `/api/clients/{id}` | JWT (admin) | Delete client |

```typescript
interface ClientDetail {
  id: number;
  name: string;
  url: string | null;
  apiKey: string;          // UUID; shown only on create or explicit reveal
  contactPerson: PersonRef;
  contactMethod: ContactMethodRef | null;
}
```

---

#### Geocode Proxy

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/geocode` | None | Address autocomplete proxy |

```typescript
// Query params: q (string, address query), limit (int, default 5)
interface GeocodeResult {
  results: {
    display_name: string;
    lat: number;
    lon: number;
    boundingBox: [number, number, number, number];
  }[];
}
```

---

### 4.4 Common Reference Types

```typescript
interface PersonRef {
  id: number;
  firstname: string | null;
  lastname: string | null;
  organization: string | null;
}

interface CategoryRef {
  id: number;
  name: string;
  department: DepartmentRef;
}

interface DepartmentRef {
  id: number;
  name: string;
}

interface CategoryGroupRef {
  id: number;
  name: string;
}

interface SubstatusRef {
  id: number;
  name: string;
  status: "open" | "closed";
}

interface ActionRef {
  id: number;
  name: string;
  type: "system" | "department";
  description: string;
}

interface IssueTypeRef {
  id: number;
  name: string;
}

interface ContactMethodRef {
  id: number;
  name: string;
}

interface ClientRef {
  id: number;
  name: string;
}
```

---
---

## 5. Security Architecture

### 5.1 Authentication Flow

uReport supports two staff authentication providers: **CAS** (Central Authentication Service) and **LDAP** (Lightweight Directory Access Protocol). Both converge on JWT issuance after successful authentication. Public users interact only with the public submission form and Open311 read endpoints — no authentication is required.

#### CAS Flow

```
Browser          React SPA           Spring Boot          CAS Server
  │                  │                    │                    │
  │──GET /dashboard──▶│                   │                    │
  │                  │  no JWT cookie     │                    │
  │◀─redirect /login─│                   │                    │
  │                  │                    │                    │
  │──click "Sign in with CAS"─────────────────────────────────▶│
  │                  │  (browser redirect to CAS /login)       │
  │                  │                    │                    │
  │◀──────────────────────────────── CAS login form ───────────│
  │──credentials──────────────────────────────────────────────▶│
  │◀───────────────── redirect to /auth/cas/callback?ticket=T ─│
  │                  │                    │                    │
  │──GET /auth/cas/callback?ticket=T──────▶│                   │
  │                  │                    │──validate ticket──▶│
  │                  │                    │◀─username + attrs──│
  │                  │                    │  lookup/create people record
  │                  │                    │  issue JWT (HS256, 8h expiry)
  │                  │                    │  Set-Cookie: auth_token=<JWT>; HttpOnly; SameSite=Strict; Secure
  │◀──────────────────────────── redirect to /dashboard ───────│
  │──GET /dashboard──▶│                   │                    │
  │                  │──GET /api/auth/me─▶│                    │
  │                  │◀─{personId,role}───│                    │
```

#### LDAP Flow

```
Browser          React SPA           Spring Boot          LDAP Server
  │                  │                    │                    │
  │──GET /dashboard──▶│                   │                    │
  │◀─redirect /login─│                   │                    │
  │                  │                    │                    │
  │──enter username+password              │                    │
  │                  │──POST /api/auth/ldap─▶│                 │
  │                  │   {username, password}│                 │
  │                  │                    │──LDAP bind────────▶│
  │                  │                    │◀─success / fail────│
  │                  │                    │  lookup/create people record
  │                  │                    │  issue JWT; Set-Cookie
  │                  │◀─200 {personId...}─│                    │
  │                  │──redirect /dashboard                    │
```

---

### 5.2 JWT Configuration

| Property | Value |
|---|---|
| Algorithm | HS256 (HMAC-SHA256) |
| Storage | httpOnly cookie named `auth_token` |
| Cookie attributes | HttpOnly; SameSite=Strict; Secure (HTTPS only) |
| Expiry | Configurable via `jwt.expiry-seconds`; recommended 28800 (8 hours) |
| Refresh | Separate `refresh_token` httpOnly cookie; server-side store (in-memory or DB) |
| Claims | `sub` (username), `personId`, `role`, `iat`, `exp`, `iss` |
| Issuer | Configurable string (`jwt.issuer`, e.g., `"ureport"`) |
| Rotation | JWT secret in `application.yml` (externalized via Docker env var); short expiry mitigates non-rotation risk |

**JWT Security Filter (`JwtAuthFilter`):**
1. Extracts `auth_token` cookie from every incoming request.
2. Parses and validates signature, expiry, and issuer using JJWT library.
3. On valid token: populates `SecurityContextHolder` with `CustomUserDetails` (personId, role, username).
4. On invalid/expired token: returns `401 Unauthorized` (JSON error body).
5. Skips filter for: public routes (see §5.4 Route Authorization).

**Token Refresh:**
- React proactively calls `POST /api/auth/refresh` 5 minutes before JWT expiry.
- Server validates `refresh_token` cookie (longer-lived, stored server-side or as a signed token).
- On success: issues new JWT and resets `auth_token` cookie.
- On failure: returns 401; React redirects to `/login?returnTo={currentPath}`.

---

### 5.3 Open311 API Key Validation

The Open311 `POST /open311/v2/requests` endpoint requires an `api_key` for write operations. The API key is NOT a JWT — it is a separate credential used by external Open311 clients.

**Validation filter (`Open311ApiKeyFilter`):**
1. Applied only to `POST /open311/v2/requests`.
2. Extracts `api_key` from query string or `X-Api-Key` header.
3. Queries `clients` table: `SELECT id FROM clients WHERE api_key = ?`.
4. If found: attaches `clientId` to request context; proceeds.
5. If not found: returns `403 Forbidden` with `{"errors":[{"code":"clients/unknownClient","description":"Invalid API key"}]}`.

**OBSOLETE_API_KEYS behavior:**
- Configurable list in `application.yml`: `open311.obsolete-api-keys: ["key1", "key2"]`.
- If incoming `api_key` matches an obsolete key on `GET /open311/v2/services`: return a synthetic "mobile shutdown" category list (three instructional entries).
- Normal 403 for obsolete key on POST.

---

### 5.4 Route Authorization

| Route / Endpoint Pattern | Requirement |
|---|---|
| `GET /open311/v2/*` | Public — no auth |
| `POST /open311/v2/requests` | Open311 api_key required |
| `POST /api/auth/ldap` | Public — credential submission |
| `GET /auth/cas/callback` | Public — CAS redirect target |
| `POST /api/auth/refresh` | Refresh token cookie |
| `POST /api/auth/logout` | JWT or anonymous (clear cookies) |
| `GET /api/categories/public` | Public |
| `POST /api/tickets/public` | Public |
| `GET /api/geocode` | Public |
| `GET /api/media/{id}` | JWT for staff categories; public for anonymous categories |
| All other `GET /api/*` | JWT required; any authenticated role |
| `POST /api/tickets`, `PATCH /api/tickets/{id}`, lifecycle ops | JWT; role `staff` or `admin` |
| `DELETE /api/people/{id}`, `POST /api/departments`, admin CRUD | JWT; role `admin` |
| Bulk operations | JWT; role `staff` or `admin` |
| `/v3/api-docs`, `/swagger-ui.html` | Public (developer reference) |

**Spring Security role hierarchy:**
```
ROLE_ADMIN > ROLE_STAFF > ROLE_PUBLIC
```

Authorization implemented via `@PreAuthorize` annotations on service methods and HTTP security matchers in `SecurityConfig`. Role is stored in JWT `role` claim and mapped to Spring `GrantedAuthority` on JWT validation.

---

### 5.5 CSRF Protection

Because JWTs are stored in httpOnly SameSite=Strict cookies:
- Cross-site requests cannot include the cookie (SameSite=Strict blocks cross-site requests from other origins).
- JavaScript on a different domain cannot read the httpOnly cookie.

For defense in depth, Spring Security's CSRF protection is enabled for state-changing requests (`POST`, `PATCH`, `PUT`, `DELETE`) on the `/api/*` path, using the Double-Submit Cookie pattern:
- Spring provides a CSRF token as a non-httpOnly cookie (`XSRF-TOKEN`).
- React reads this cookie and includes the value in the `X-XSRF-TOKEN` request header.
- Spring validates the header value matches the cookie.

**Exception:** Open311 endpoints (`/open311/v2/*`) are CSRF-exempt (stateless external API; authenticated by api_key).

---

### 5.6 Data Protection

| Concern | Implementation |
|---|---|
| Passwords | Never stored — delegated entirely to LDAP/CAS |
| JWT secret | Environment variable (`JWT_SECRET`); never in source code |
| API keys | Stored as plain text in DB (UUID format; sufficient entropy); considered non-secret but restricted to admin UI |
| Media files | Stored on filesystem; path includes ticket ID (hard to enumerate); staff-only categories require JWT |
| HTTPS | Enforced by Nginx; HTTP → HTTPS redirect; HSTS header |
| SQL injection | Prevented by Spring Data JPA parameterized queries; `plainto_tsquery()` for FTS (injection-safe) |
| XSS | React DOM escapes values by default; `dangerouslySetInnerHTML` used only for `ts_headline` output sanitized with DOMPurify |
| Open redirect | `returnTo` parameter restricted to relative paths on same origin (validated server-side) |
| File upload | MIME validated by magic bytes; size capped at 10 MB; stored with UUID filename (not original name) |
| Logging | Passwords, JWT secrets, and API keys are never written to logs (MDC exclusion list) |

---

### 5.7 Authorization Model (Role-Based)

| Operation | admin | staff | public |
|---|---|---|---|
| View tickets (own department) | ✓ | ✓ | — |
| View all tickets | ✓ | ✓ | — |
| Create ticket | ✓ | ✓ | Via /public |
| Close/reopen ticket | ✓ | ✓ | — |
| Edit closed ticket fields | ✓ | — | — |
| Assign ticket | ✓ | ✓ | — |
| Bulk operations | ✓ | ✓ | — |
| Create/edit/delete people | ✓ | — | Own record |
| Set role to admin/staff | ✓ | — | — |
| Create/edit departments | ✓ | — | — |
| Create/edit categories | ✓ | — | — |
| Manage substatus/issueType/contactMethod | ✓ | — | — |
| Manage Open311 clients | ✓ | — | — |
| Log action on any department's ticket | ✓ | dept match | — |
| View metrics/reports | ✓ | ✓ | — |
| Access Swagger UI | any | any | any |

---
---

## 6. Technology Stack

### 6.1 Full Stack Reference

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | React | Latest stable (19.x) | SPA rendering, component model |
| **Frontend Router** | React Router | v6 | Client-side routing, protected routes |
| **Build Tool** | Vite | Latest | Fast dev server, optimized production bundle |
| **Styling** | Tailwind CSS | v3 | Utility-first CSS, responsive breakpoints |
| **Component Library** | shadcn/ui | Latest | Accessible, customizable UI primitives |
| **Animation** | Framer Motion | Latest | Page transitions, micro-interactions, ≤300ms |
| **Maps** | Mapbox GL JS | Latest | Interactive map widget, pin-drop |
| **Map Fallback** | Leaflet + React Leaflet | Latest | OSM tile fallback when Mapbox key absent |
| **Charts** | Recharts | Latest | Donut/status charts on dashboard |
| **Server State** | TanStack Query (React Query) | v5 | API data fetching, caching, invalidation |
| **Form Handling** | React Hook Form + Zod | Latest | Form validation, schema-driven |
| **HTTP Client** | Axios | Latest | API calls with interceptors for auth |
| **Accessibility** | axe-core (dev), manual audit | — | WCAG 2.1 AA, Section 508 |
| **Typography** | Inter | — | UI text font (Google Fonts / self-hosted) |
| **Monospace Font** | JetBrains Mono | — | IDs, codes, monospaced values |
| **XSS Sanitization** | DOMPurify | Latest | Sanitize ts_headline HTML before render |
| **Backend Framework** | Spring Boot | 3.x (Java 21) | REST API, embedded Tomcat server |
| **Build** | Maven | 3.9.x | Dependency management, build lifecycle |
| **Java Version** | Java (Temurin/OpenJDK) | 21 LTS | Language version for Spring Boot 3.x |
| **Data Access** | Spring Data JPA | 3.x | Repository pattern over Hibernate |
| **ORM** | Hibernate | 6.x | JPA implementation; managed by Spring Boot |
| **DTO Mapping** | MapStruct | 1.6.x | Compile-time Entity ↔ DTO mapping |
| **Security** | Spring Security | 6.x | JWT filter chain, LDAP, CAS integration |
| **JWT** | JJWT (io.jsonwebtoken) | 0.12.x | JWT sign, parse, validate (HS256) |
| **LDAP** | Spring Security LDAP | 3.x | LDAP bind authentication |
| **CAS** | Spring Security CAS | 3.x | CAS service ticket validation |
| **OpenAPI Docs** | springdoc-openapi | 2.x | Auto-generated OpenAPI 3.0 spec + Swagger UI |
| **Database Migrations** | Flyway | 10.x | Versioned SQL migration scripts |
| **Database** | PostgreSQL | 16 | Relational store, FTS, POINT geometry |
| **Connection Pool** | HikariCP | 5.x (bundled) | High-performance JDBC connection pool |
| **Email** | Spring JavaMailSender | 3.x | SMTP email delivery (action notifications) |
| **Validation** | Hibernate Validator (Bean Validation) | 8.x | @Valid on request DTOs |
| **Image Thumbnails** | Thumbnailator | 0.4.x | 150×150 thumbnail generation |
| **JSON** | Jackson | 2.x (bundled) | JSON serialization/deserialization |
| **XML (Open311)** | JAXB / Jackson XML | — | XML serialization for Open311 XML responses |
| **Test (Backend)** | JUnit 5, Mockito, Spring Boot Test | — | Unit and integration testing |
| **Test (Frontend)** | Vitest, React Testing Library | — | Component and hook testing |
| **Container** | Docker | Latest | Application containerization |
| **Orchestration** | Docker Compose | v2 | Multi-container local + production deployment |
| **Web Server** | Nginx (Alpine) | Latest | Static SPA serving + reverse proxy |
| **Logging** | SLF4J + Logback | 1.5.x | Structured JSON logging in production |

---

### 6.2 Spring Boot `pom.xml` Key Dependencies

```xml
<!-- Core Spring Boot parent -->
<parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>3.3.x</version>
</parent>

<dependencies>
  <!-- Web -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>

  <!-- Data JPA + PostgreSQL -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
  </dependency>
  <dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
  </dependency>

  <!-- Security -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-ldap</artifactId>
  </dependency>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.x</version>
  </dependency>

  <!-- Validation -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
  </dependency>

  <!-- Flyway -->
  <dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
  </dependency>
  <dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
  </dependency>

  <!-- MapStruct -->
  <dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.6.x</version>
  </dependency>

  <!-- OpenAPI / Swagger -->
  <dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.x.x</version>
  </dependency>

  <!-- Email -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
  </dependency>

  <!-- Thumbnailator for image thumbnails -->
  <dependency>
    <groupId>net.coobird</groupId>
    <artifactId>thumbnailator</artifactId>
    <version>0.4.x</version>
  </dependency>
</dependencies>
```

---

### 6.3 Frontend `package.json` Key Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.x.x",
    "framer-motion": "^11.x.x",
    "axios": "^1.x.x",
    "@tanstack/react-query": "^5.x.x",
    "react-hook-form": "^7.x.x",
    "zod": "^3.x.x",
    "@hookform/resolvers": "^3.x.x",
    "recharts": "^2.x.x",
    "mapbox-gl": "^3.x.x",
    "react-map-gl": "^7.x.x",
    "leaflet": "^1.x.x",
    "react-leaflet": "^4.x.x",
    "dompurify": "^3.x.x",
    "clsx": "^2.x.x",
    "tailwind-merge": "^2.x.x",
    "lucide-react": "^0.x.x"
  },
  "devDependencies": {
    "vite": "^5.x.x",
    "@vitejs/plugin-react": "^4.x.x",
    "tailwindcss": "^3.x.x",
    "autoprefixer": "^10.x.x",
    "postcss": "^8.x.x",
    "typescript": "^5.x.x",
    "vitest": "^1.x.x",
    "@testing-library/react": "^15.x.x",
    "@axe-core/react": "^4.x.x"
  }
}
```

---

### 6.4 application.yml Configuration Reference

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db:5432/ureport
    username: ${DB_USER:ureport}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

  jpa:
    hibernate:
      ddl-auto: validate           # Flyway manages schema; Hibernate only validates
    properties:
      hibernate.dialect: org.hibernate.dialect.PostgreSQLDialect

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: false     # false for fresh installs; true for first-time migration of existing DB

  mail:
    host: ${SMTP_HOST:localhost}
    port: ${SMTP_PORT:587}
    username: ${SMTP_USER:}
    password: ${SMTP_PASSWORD:}
    properties.mail.smtp.auth: true
    properties.mail.smtp.starttls.enable: true

jwt:
  secret: ${JWT_SECRET}            # Min 256 bits; required env var
  expiry-seconds: ${JWT_EXPIRY:28800}  # 8 hours
  issuer: ureport

ldap:
  enabled: ${LDAP_ENABLED:false}
  url: ${LDAP_URL:ldap://localhost:389}
  base-dn: ${LDAP_BASE_DN:dc=city,dc=gov}
  user-dn-pattern: uid={0},ou=people

cas:
  enabled: ${CAS_ENABLED:false}
  server-url: ${CAS_SERVER_URL:https://cas.city.gov}
  service-url: ${CAS_SERVICE_URL:https://ureport.city.gov}

media:
  root: ${MEDIA_ROOT:/var/ureport/media}
  max-file-size-bytes: 10485760    # 10 MB

open311:
  obsolete-api-keys: ${OBSOLETE_API_KEYS:}

geocode:
  mapbox-token: ${MAPBOX_TOKEN:}
  nominatim-url: ${NOMINATIM_URL:https://nominatim.openstreetmap.org}

springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
```

---

### 6.5 Flyway Migration File Inventory

| Migration File | Description |
|---|---|
| `V1__initial_schema.sql` | All 18 tables migrated from MySQL; initial PostgreSQL DDL |
| `V2__search_vector.sql` | Add `search_vector` tsvector column to `tickets`; GIN index; trigger |
| `V3__seed_data.sql` | Seed: contact_methods, substatus, actions, issue_types, category_groups |
| `V4__data_migration.sql` | One-time import from MySQL dump (column name rename mappings) |

Future schema changes: `V5__*.sql`, `V6__*.sql`, etc. — never modify existing migration files.

---
---

## 7. Integration Points

### 7.1 External System Dependencies

| System | Type | Direction | Required | Fallback |
|---|---|---|---|---|
| LDAP Server | Authentication | Outbound | Conditional (if LDAP enabled) | CAS; or local error if both disabled |
| CAS Server | Authentication SSO | Outbound | Conditional (if CAS enabled) | LDAP; or local error |
| SMTP Server | Email notifications | Outbound | Soft (non-fatal) | Notifications skipped; history entry saved |
| Mapbox GL JS | Map tiles + geocoding | Outbound (browser) | Soft | Leaflet + OpenStreetMap tiles |
| Nominatim (OSM) | Geocoding fallback | Outbound (server-side proxy) | Soft | Manual address entry only |
| Open311 Clients | API consumers | Inbound | N/A | N/A |
| PostgreSQL | Database | Internal (same Docker Compose network) | Required | None |

---

### 7.2 LDAP Integration

**Provider:** Spring Security LDAP  
**Protocol:** LDAP / LDAPS (configurable via `ldap.url`)  
**Auth mechanism:** Simple bind — Spring binds with `uid={username},ou=people,{base-dn}` and the provided password.  
**Attribute mapping:** Username extracted from the bind DN. No group attributes used; role is stored in `people.role`.

```
Spring Boot → LDAP bind request → LDAP Server
            ← success / BindException
```

**Failure handling:**
- `BindException` → 401 response; "Invalid credentials" message.
- LDAP server unreachable → 503; "Authentication service unavailable".
- Account locked (LDAP control response code 49) → 401; "Account locked".

---

### 7.3 CAS Integration

**Provider:** Spring Security CAS extension (spring-security-cas)  
**Protocol:** CAS 2.0 (service ticket validation via `/serviceValidate`)  
**Flow:**
1. Spring Security redirects to: `{casServer}/login?service={ureportServiceUrl}/auth/cas/callback`
2. After auth, CAS redirects to: `/auth/cas/callback?ticket={ST-xxxxx}`
3. Spring Security CAS filter calls: `GET {casServer}/serviceValidate?ticket=ST-xxxxx&service={serviceUrl}`
4. CAS returns XML with `<cas:authenticationSuccess><cas:user>{username}</cas:user></cas:authenticationSuccess>`
5. Spring Security extracts the username; `AuthService` looks up the `people` record.

**Single Sign-Out:** On `POST /api/auth/logout`, Spring Boot redirects to `{casServer}/logout?service={serviceUrl}`. CAS server then sends a back-channel POST to the service's SLO endpoint to invalidate all sessions.

---

### 7.4 SMTP Email Integration

**Provider:** Spring JavaMailSender  
**Protocol:** SMTP with STARTTLS (configurable; port 587 default)  
**Trigger:** `NotificationService.sendNotification()` called by `TicketService` after action history entry is saved.

**Email structure:**
- **From:** Configured system email address
- **Reply-To:** `category_action_responses.reply_email` → `actions.reply_email` → system default
- **To:** Reporter's `usedForNotifications = true` email (if "Notify Reporter") + assignee's notification email (if "Notify Assignee")
- **Subject:** `[uReport] Case #${ticketId} — ${actionName}`
- **Body:** Plain text with `ticket_history.notes` content + standard footer with case URL

**Failure handling:** SMTP send failure is non-fatal. The `ticket_history` record is committed. `sent_notifications` is set to the list of addresses successfully sent. On failure, a warning is appended to the API response. Staff sees a toast: "Action saved. Email notification failed to send."

---

### 7.5 Mapbox GL JS / Geocoding Integration

**Map rendering:** Mapbox GL JS in browser (React component via `react-map-gl`). Access token provided from environment variable (`VITE_MAPBOX_TOKEN`), delivered to the React app as a build-time env var.

**Geocoding (address autocomplete):**
- Primary: Mapbox Geocoding API (`GET https://api.mapbox.com/geocoding/v5/mapbox.places/{q}.json?access_token=...`)
- Fallback: Server-side proxy at `GET /api/geocode?q={address}` → forwards to Nominatim (OpenStreetMap)
- Debounce: 300 ms before issuing geocoding request
- Results shown as autocomplete dropdown; selecting a result sets lat/lon in form state

**Mapbox unavailability:**
- If `VITE_MAPBOX_TOKEN` is empty or undefined, React detects and renders Leaflet with OpenStreetMap tiles instead.
- Geocoding degrades to Nominatim via the server-side proxy.
- All map functionality remains available (pan, zoom, pin-drop) using Leaflet.

---

### 7.6 Open311 External Client Integration

External Open311 clients (mobile apps, 311 aggregators) call the frozen GeoReport v2 API:

```
Mobile App / Aggregator → GET /open311/v2/services        → Spring Boot → PostgreSQL
                        → GET /open311/v2/requests         → Spring Boot → PostgreSQL
                        → GET /open311/v2/requests/{id}    → Spring Boot → PostgreSQL
                        → POST /open311/v2/requests        → Spring Boot → PostgreSQL
                            (with api_key in query/header)
```

**API key lifecycle:**
1. Admin registers a new client record via `/api/clients` (generates UUID api_key).
2. Admin provides the api_key to the external client operator out-of-band.
3. External client includes `api_key` in every write request.
4. Spring Boot `Open311ApiKeyFilter` validates api_key against `clients.api_key` on each POST.
5. Revocation: admin deletes or updates the client record; key is immediately invalid.

**OBSOLETE_API_KEYS:** Keys listed in `open311.obsolete-api-keys` configuration receive the "mobile shutdown" category list on `GET /services` — three synthetic categories with instructional messages directing users to update their app. Preserved from existing PHP behavior.

---

### 7.7 File Storage

Media files are stored on the host filesystem via a Docker volume:

```
Volume: media_files → mounted at /var/ureport/media (api container)
                    → optionally mounted at /var/ureport/media (nginx container for direct serving)

Directory structure:
/var/ureport/media/
  {ticket_id}/
    {uuid}.jpg          ← original file (internalFilename)
    {uuid}_thumb.jpg    ← 150×150 thumbnail (generated on first request)
```

**Thumbnail generation:** Thumbnailator library generates the thumbnail on first access of `GET /api/media/{mediaId}/thumbnail`. The thumbnail is cached on disk alongside the original. Subsequent requests serve the cached file.

**Backup:** The `media_files` volume should be included in the host backup strategy (rsync or cloud snapshot). No in-application backup mechanism is implemented.

---

## 8. Non-Functional Design Notes

### Performance Targets

| Metric | Target | Implementation |
|---|---|---|
| Case list initial load | ≤ 2 s (desktop) | Paginated query; GIN index for FTS |
| Search query P95 | ≤ 500 ms | `plainto_tsquery` + GIN index; ≤ 100K tickets |
| Open311 API P95 | ≤ 300 ms | Simple indexed queries; no JOIN-heavy operations |
| Dashboard load | ≤ 2 s | 4 parallel lightweight aggregate queries |
| Concurrent staff | ≥ 50 | HikariCP pool=20; embedded Tomcat threadpool |

### Browser Support

Chrome, Firefox, Safari, and Edge — latest 2 major versions. No IE11 support.

### Mobile Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | 375 px | Single-column, stacked; hamburger nav |
| Tablet | 768 px | 2-column grid; sidebar optional |
| Desktop | 1280 px+ | Full sidebar + split-pane layouts |

### Accessibility

- WCAG 2.1 Level AA compliance enforced via axe-core in CI and manual audit.
- All shadcn/ui components use Radix UI primitives with ARIA roles and keyboard navigation built in.
- `prefers-reduced-motion`: `useReducedMotion()` hook disables all Framer Motion variants globally.
- Focus indicators: visible on all interactive elements (`:focus-visible` ring via Tailwind).
- Touch targets: minimum 44 × 44 px on mobile.
- Color contrast: minimum 4.5:1 for normal text, 3:1 for large text (enforced in design token CSS vars).

---

*TechArch-UReport.md — uReport CRM Modernization v1.0 — 2026-07-06*
