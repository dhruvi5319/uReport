# TechArch — uReport Modernization
## Section 00: Architectural Overview

**Project:** uReport CRM — Municipal Constituent Issue Tracking System  
**Version:** 1.0  
**Date:** 2026-06-24  
**Stack:** React 18 + TypeScript → Java 21 (Spring Boot 3.x) → PostgreSQL 16  

---

## Architecture Pattern

uReport uses a **three-tier SPA + REST API + RDBMS** architecture:

1. **Presentation Tier** — React 18 TypeScript SPA (Vite), served as static assets from Nginx
2. **Application Tier** — Java 21 Spring Boot 3.x REST API, containerized in Docker
3. **Data Tier** — PostgreSQL 16 with PostGIS, containerized in Docker

This is a deliberate **clean-cut** from the PHP/Apache/MySQL/Solr monolith. No shared process, no filesystem coupling between tiers. Communication is exclusively over HTTP/JSON (internal API) and binary protocol (JDBC to PostgreSQL).

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Single Spring Boot JAR | Avoids microservice overhead for a single-municipality CRM |
| PostgreSQL FTS (tsvector/tsquery) | Eliminates Solr JVM process; GIN index delivers sub-500ms queries at 500K tickets |
| JWT HS256 with refresh token rotation | Stateless auth compatible with SPA and external API clients |
| PostGIS GEOGRAPHY(POINT, 4326) | Replaces MySQL POINT; enables ST_DWithin radius queries natively |
| Docker Compose single-file deployment | Preserves operator familiarity; same service names and ports |
| Open311 preserved at path boundary | Legacy external consumers hit the same `/open311/*` URLs; zero breaking change |
| Chunked CSV streaming via StreamingResponseBody | Prevents OOM on large exports without pagination |

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL CLIENTS                              │
│  ┌──────────────┐   ┌──────────────────┐   ┌───────────────────────┐   │
│  │ Browser (SPA)│   │Open311 Consumers │   │ Mobile / 3rd-Party    │   │
│  │ React 18 /TS │   │(Municipality API)│   │ (api_key auth)        │   │
│  └──────┬───────┘   └────────┬─────────┘   └──────────┬────────────┘   │
└─────────┼────────────────────┼──────────────────────────┼───────────────┘
          │ HTTPS               │ HTTPS                    │ HTTPS
          │ JWT Bearer          │ /open311/* (JSON/XML)    │ api_key param
          ▼                     ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DOCKER HOST / VPS                                │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    nginx (port 80/443)                             │ │
│  │   /              → serve React SPA static assets                  │ │
│  │   /api/v1/*      → proxy_pass http://api:8080                     │ │
│  │   /open311/*     → proxy_pass http://api:8080                     │ │
│  │   /callback      → proxy_pass http://api:8080                     │ │
│  └─────────────────────────────┬──────────────────────────────────────┘ │
│                                 │                                        │
│  ┌──────────────────────────────▼──────────────────────────────────────┐ │
│  │              Spring Boot API (api:8080)                             │ │
│  │                                                                     │ │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │ │
│  │  │  JwtAuthFilter  │  │ ApiKeyAuthFilter  │  │ SecurityConfig   │  │ │
│  │  └────────┬────────┘  └────────┬─────────┘  └──────────────────┘  │ │
│  │           │                    │                                    │ │
│  │  ┌────────▼────────────────────▼───────────────────────────────┐   │ │
│  │  │                  REST Controllers                            │   │ │
│  │  │  AuthController  TicketController  Open311Controller        │   │ │
│  │  │  PeopleController  CategoryController  MediaController      │   │ │
│  │  │  SearchController  MetricsController  AdminController       │   │ │
│  │  └─────────────────────────────┬───────────────────────────────┘   │ │
│  │                                 │                                    │ │
│  │  ┌──────────────────────────────▼──────────────────────────────┐   │ │
│  │  │                    Service Layer                             │   │ │
│  │  │  TicketService  TicketHistoryService  NotificationService   │   │ │
│  │  │  SearchService  GeoClusterScheduler  AutoCloseScheduler     │   │ │
│  │  │  MediaService   AuthService   Open311MappingService         │   │ │
│  │  └─────────────────────────────┬───────────────────────────────┘   │ │
│  │                                 │                                    │ │
│  │  ┌──────────────────────────────▼──────────────────────────────┐   │ │
│  │  │              Repository Layer (Spring Data JPA)              │   │ │
│  │  │  TicketRepository  PersonRepository  CategoryRepository     │   │ │
│  │  │  HistoryRepository  MediaRepository  GeoClusterRepository   │   │ │
│  │  └─────────────────────────────┬───────────────────────────────┘   │ │
│  └─────────────────────────────────┼───────────────────────────────────┘ │
│                                    │ JDBC (HikariCP)                      │
│  ┌─────────────────────────────────▼──────────────────────────────────┐  │
│  │          PostgreSQL 16 + PostGIS (db:5432)                          │  │
│  │                                                                      │  │
│  │  Schemas: tickets, ticketHistory, people, categories, actions ...   │  │
│  │  Extensions: postgis, pgcrypto                                       │  │
│  │  FTS: tsvector column + GIN index on tickets                         │  │
│  │  Geo: GEOGRAPHY(POINT,4326) + GIST index on tickets + locations      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │   Docker Volumes                                                │   │
│  │   pgdata  → PostgreSQL data                                     │   │
│  │   media   → /app/media (uploaded files + thumbnails)            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Deployment Topology

The system runs as four Docker containers orchestrated by `docker-compose.yml`:

| Service | Image | Port | Role |
|---------|-------|------|------|
| `db` | `postgis/postgis:16-3.4` | 5432 (internal) | PostgreSQL 16 + PostGIS |
| `api` | Custom Java 21 image | 8080 (internal) | Spring Boot REST API |
| `web` | Custom Nginx + React build | 80 / 443 | Static SPA + reverse proxy |
| *(optional)* `mailhog` | `mailhog/mailhog` | 8025 | SMTP dev/testing relay |

### docker-compose.yml (reference)

```yaml
version: '3.9'

services:
  db:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: ureport
      POSTGRES_USER: ureport
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"      # expose for local dev; close in prod
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ureport"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: ./api
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/ureport
      SPRING_DATASOURCE_USERNAME: ureport
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      APP_JWT_SECRET: ${JWT_SECRET}
      APP_JWT_EXPIRY: 3600
      APP_MEDIA_PATH: /app/media
      SPRING_MAIL_HOST: ${MAIL_HOST}
    volumes:
      - media:/app/media
    ports:
      - "8080:8080"
    depends_on:
      db:
        condition: service_healthy

  web:
    build: ./web
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api

volumes:
  pgdata:
  media:
```

---

## Request Flow (Staff Ticket Search)

```
Browser                   Nginx                  API (Spring Boot)          PostgreSQL
  │                         │                          │                         │
  │── GET /api/v1/tickets?q=pothole&status=open ──────>│                         │
  │                         │── proxy_pass ──────────>│                         │
  │                         │                    JwtAuthFilter validates Bearer  │
  │                         │                          │── SELECT tickets WHERE  │
  │                         │                          │   search_vector @@      │
  │                         │                          │   websearch_to_tsquery  │
  │                         │                          │<─ rows ─────────────────│
  │                         │<── 200 JSON ────────────│                         │
  │<── 200 JSON ────────────│                          │                         │
```

---

## Authentication Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                 Authentication Flows                    │
│                                                        │
│  1. Staff Login:                                       │
│     POST /api/v1/auth/login {username, password}       │
│     → BCrypt verify → issue JWT (1h) + refresh (24h)  │
│                                                        │
│  2. Every Authenticated Request:                       │
│     Authorization: Bearer <jwt>                        │
│     → JwtAuthFilter validates signature + expiry       │
│     → checks token_blacklist for jti                   │
│     → sets SecurityContext {personId, role}            │
│                                                        │
│  3. Token Refresh:                                     │
│     POST /api/v1/auth/refresh {refreshToken}           │
│     → revoke old refresh → issue new pair              │
│                                                        │
│  4. Logout:                                            │
│     POST /api/v1/auth/logout {refreshToken}            │
│     → revoke refresh + blacklist access jti            │
│                                                        │
│  5. Open311 API Key:                                   │
│     POST /open311/requests?api_key=xxx                 │
│     → SHA-256(api_key) lookup in clients table         │
│     → BCrypt verify for full match                     │
│     → set ApiKeyPrincipal in SecurityContext           │
└────────────────────────────────────────────────────────┘
```
## Section 01: Component Architecture

---

## Backend — Spring Boot Package Structure

```
api/src/main/java/com/ureport/
├── UReportApplication.java                   ← @SpringBootApplication entry point
│
├── config/
│   ├── SecurityConfig.java                   ← Spring Security filter chain config
│   ├── JwtConfig.java                        ← JWT signing key, algorithm, expiry
│   ├── WebMvcConfig.java                     ← CORS, content negotiation, message converters
│   ├── HikariConfig.java                     ← DB connection pool settings
│   ├── SchedulerConfig.java                  ← @EnableScheduling
│   └── MediaConfig.java                      ← Media storage path, size limits
│
├── security/
│   ├── JwtAuthenticationFilter.java          ← OncePerRequestFilter: extract + validate JWT
│   ├── ApiKeyAuthenticationFilter.java       ← OncePerRequestFilter: validate api_key
│   ├── JwtTokenProvider.java                 ← generate / validate / parse JWT
│   ├── JwtUserDetails.java                   ← UserDetails implementation (personId, role)
│   ├── ApiKeyPrincipal.java                  ← Principal for api_key-authenticated requests
│   └── PermissionEvaluator.java              ← isAllowed(resource, action) per F03
│
├── controller/
│   ├── AuthController.java                   ← /api/v1/auth/* (login, refresh, logout)
│   ├── CallbackController.java               ← /callback (OAuth IdP)
│   ├── TicketController.java                 ← /api/v1/tickets/* (CRUD + lifecycle)
│   ├── TicketHistoryController.java          ← /api/v1/tickets/{id}/history
│   ├── TicketSearchController.java           ← /api/v1/tickets (search), /export, /map
│   ├── MediaController.java                  ← /api/v1/tickets/{id}/media, /api/v1/media/*
│   ├── PeopleController.java                 ← /api/v1/people/*
│   ├── DepartmentController.java             ← /api/v1/departments/*
│   ├── CategoryController.java               ← /api/v1/categories/*
│   ├── CategoryGroupController.java          ← /api/v1/category-groups/*
│   ├── SubstatusController.java              ← /api/v1/substatus/*
│   ├── ActionController.java                 ← /api/v1/actions/*
│   ├── ClientController.java                 ← /api/v1/clients/*
│   ├── ContactMethodController.java          ← /api/v1/contact-methods/*
│   ├── IssueTypeController.java              ← /api/v1/issue-types/*
│   ├── BookmarkController.java               ← /api/v1/bookmarks/*
│   ├── LocationController.java               ← /api/v1/locations/*
│   ├── ResponseTemplateController.java       ← /api/v1/response-templates/*
│   ├── MetricsController.java                ← /api/v1/metrics, /api/v1/reports/*
│   ├── AdminJobController.java               ← /api/v1/admin/jobs/*/run
│   └── open311/
│       ├── Open311DiscoveryController.java   ← /open311/discovery
│       ├── Open311ServicesController.java    ← /open311/services
│       └── Open311RequestsController.java    ← /open311/requests
│
├── service/
│   ├── AuthService.java                      ← login, refresh, logout, BCrypt
│   ├── TicketService.java                    ← create, assign, close, reopen, duplicate
│   ├── TicketHistoryService.java             ← append entry, render template vars
│   ├── TicketSearchService.java              ← FTS query builder, pagination, export
│   ├── MediaService.java                     ← upload, serve, thumbnail generation
│   ├── PersonService.java                    ← CRUD, auto-create from Open311
│   ├── DepartmentService.java                ← CRUD, category/action associations
│   ├── CategoryService.java                  ← CRUD, permission validation
│   ├── SubstatusService.java                 ← CRUD, isDefault maintenance
│   ├── ActionService.java                    ← CRUD, category_action_responses
│   ├── ClientService.java                    ← CRUD, api_key hashing/validation
│   ├── GeoService.java                       ← geo_point sync, AddressService calls
│   ├── MetricsService.java                   ← onTimePercentage, canned reports
│   ├── NotificationService.java              ← email rendering, SMTP dispatch
│   ├── Open311MappingService.java            ← ticket↔Open311 field mapping
│   └── Open311XmlSerializer.java             ← byte-compatible XML rendering
│
├── scheduler/
│   ├── DigestNotificationScheduler.java      ← @Scheduled every 5 min; replaces digestNotifications.php
│   ├── AutoCloseScheduler.java               ← @Scheduled nightly 1 AM; replaces closeOldTickets.php
│   ├── AuditScheduler.java                   ← @Scheduled weekly; replaces auditTickets.php
│   └── GeoClusterScheduler.java              ← @Scheduled nightly 2 AM; replaces matchLocationAddresses.php
│
├── repository/
│   ├── TicketRepository.java                 ← JpaRepository<Ticket, Long>
│   ├── TicketHistoryRepository.java
│   ├── PersonRepository.java
│   ├── DepartmentRepository.java
│   ├── CategoryRepository.java
│   ├── SubstatusRepository.java
│   ├── ActionRepository.java
│   ├── ClientRepository.java
│   ├── MediaRepository.java
│   ├── BookmarkRepository.java
│   ├── LocationRepository.java
│   ├── GeoClusterRepository.java
│   ├── TicketGeoDataRepository.java
│   ├── RefreshTokenRepository.java
│   ├── TokenBlacklistRepository.java
│   ├── ContactMethodRepository.java
│   ├── IssueTypeRepository.java
│   └── ResponseTemplateRepository.java
│
├── entity/                                   ← JPA @Entity classes (1:1 with DB tables)
│   ├── Ticket.java
│   ├── TicketHistory.java
│   ├── Person.java
│   ├── PeopleEmail.java
│   ├── PeoplePhone.java
│   ├── PeopleAddress.java
│   ├── Department.java
│   ├── Category.java
│   ├── CategoryGroup.java
│   ├── Substatus.java
│   ├── Action.java
│   ├── CategoryActionResponse.java
│   ├── Client.java
│   ├── Media.java
│   ├── Bookmark.java
│   ├── Location.java
│   ├── GeoCluster.java
│   ├── TicketGeoData.java
│   ├── ContactMethod.java
│   ├── IssueType.java
│   ├── ResponseTemplate.java
│   ├── RefreshToken.java
│   └── TokenBlacklist.java
│
├── dto/                                      ← Request/Response DTOs (decoupled from entities)
│   ├── request/
│   │   ├── LoginRequest.java
│   │   ├── CreateTicketRequest.java
│   │   ├── UpdateTicketRequest.java
│   │   ├── CloseTicketRequest.java
│   │   ├── CreatePersonRequest.java
│   │   └── ...
│   └── response/
│       ├── AuthResponse.java
│       ├── TicketResponse.java
│       ├── TicketSummaryResponse.java
│       ├── HistoryEntryResponse.java
│       ├── PersonResponse.java
│       ├── Open311ServiceResponse.java
│       ├── Open311RequestResponse.java
│       └── ...
│
├── exception/
│   ├── GlobalExceptionHandler.java           ← @RestControllerAdvice; maps exceptions to error JSON
│   ├── NotFoundException.java
│   ├── PermissionDeniedException.java
│   ├── ValidationException.java
│   ├── ConflictException.java
│   └── InvalidTransitionException.java
│
└── util/
    ├── TemplateVariableResolver.java          ← {enteredByPerson}, {original:field}, etc.
    ├── ApiKeyHashUtil.java                    ← SHA-256 lookup hash + BCrypt storage hash
    ├── CsvExportUtil.java                     ← StreamingResponseBody CSV writer
    └── DateTimeUtil.java                      ← ISO 8601 formatting helpers
```

---

## Frontend — React 18 TypeScript SPA (Vite)

```
web/src/
├── main.tsx                                  ← React root, BrowserRouter
├── App.tsx                                   ← Route definitions
│
├── api/                                      ← Typed API client layer (axios)
│   ├── client.ts                             ← Axios instance, JWT interceptor, refresh logic
│   ├── auth.api.ts
│   ├── tickets.api.ts
│   ├── people.api.ts
│   ├── categories.api.ts
│   ├── departments.api.ts
│   ├── media.api.ts
│   ├── search.api.ts
│   ├── metrics.api.ts
│   └── open311.api.ts
│
├── types/                                    ← TypeScript interfaces (mirrors API DTOs)
│   ├── auth.types.ts
│   ├── ticket.types.ts
│   ├── person.types.ts
│   ├── category.types.ts
│   ├── department.types.ts
│   ├── media.types.ts
│   ├── search.types.ts
│   └── admin.types.ts
│
├── store/                                    ← Zustand or Redux Toolkit global state
│   ├── authStore.ts                          ← JWT, personId, role
│   ├── ticketStore.ts
│   └── searchStore.ts
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── CallbackPage.tsx
│   ├── tickets/
│   │   ├── TicketListPage.tsx                ← search + pagination
│   │   ├── TicketMapPage.tsx                 ← geo-cluster map view
│   │   ├── TicketDetailPage.tsx              ← full ticket + history
│   │   ├── CreateTicketPage.tsx
│   │   └── EditTicketPage.tsx
│   ├── people/
│   │   ├── PeopleListPage.tsx
│   │   ├── PersonDetailPage.tsx
│   │   └── CreatePersonPage.tsx
│   ├── admin/
│   │   ├── DepartmentsPage.tsx
│   │   ├── CategoriesPage.tsx
│   │   ├── CategoryGroupsPage.tsx
│   │   ├── SubstatusPage.tsx
│   │   ├── ActionsPage.tsx
│   │   ├── ClientsPage.tsx
│   │   ├── ContactMethodsPage.tsx
│   │   └── IssueTypesPage.tsx
│   ├── metrics/
│   │   ├── MetricsDashboardPage.tsx
│   │   └── ReportsPage.tsx
│   └── bookmarks/
│       └── BookmarksPage.tsx
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx                      ← Nav, sidebar, outlet
│   │   ├── Sidebar.tsx                       ← Bookmarks, nav links
│   │   └── Header.tsx
│   ├── tickets/
│   │   ├── TicketCard.tsx
│   │   ├── TicketStatusBadge.tsx
│   │   ├── TicketHistoryList.tsx
│   │   ├── TicketSearchFilters.tsx
│   │   ├── TicketMap.tsx                     ← MapLibre/Leaflet geo-cluster render
│   │   ├── MediaUploader.tsx
│   │   └── CustomFieldsForm.tsx              ← dynamic from category.customFields schema
│   ├── people/
│   │   ├── PersonCard.tsx
│   │   └── PersonSearchAutocomplete.tsx
│   ├── common/
│   │   ├── Pagination.tsx
│   │   ├── ConfirmModal.tsx
│   │   ├── ErrorBanner.tsx
│   │   └── LoadingSpinner.tsx
│   └── open311/
│       └── Open311ServiceList.tsx            ← Public-facing submission form
│
├── hooks/
│   ├── useAuth.ts
│   ├── useTicketSearch.ts
│   ├── usePagination.ts
│   └── usePermission.ts                      ← client-side role gates (UX only)
│
└── utils/
    ├── formatDate.ts
    ├── buildSearchQuery.ts
    └── customFieldsValidator.ts
```

---

## Spring Boot Scheduler Component Responsibilities

| Scheduler Class | Replaces | Schedule | Responsibility |
|-----------------|----------|----------|----------------|
| `DigestNotificationScheduler` | `digestNotifications.php` | Every 5 min (configurable) | Find `ticketHistory` rows with null `sentNotifications` + non-null template → render + send email → update `sentNotifications` |
| `AutoCloseScheduler` | `closeOldTickets.php` | Nightly 1 AM | Find open tickets in categories with `autoCloseIsActive=true` stale past SLA → close with `autoCloseSubstatus_id` |
| `GeoClusterScheduler` | `matchLocationAddresses.php` | Nightly 2 AM | Rebuild `geoclusters` and `ticket_geodata` for all geo-tagged tickets across 7 zoom levels |
| `AuditScheduler` | `auditTickets.php` | Weekly Sunday 3 AM | Check for orphaned history, tickets missing geo_point when lat/long present; log anomalies |

---

## Multi-Format Output Architecture

Spring Boot is configured with content negotiation that gives `?format=` query param precedence over `Accept` header:

```
Request arrives at Open311Controller
    │
    ├── ?format=xml → FormatFilter sets response Content-Type = application/xml
    │                  → Open311XmlSerializer produces byte-compatible GeoReport v2 XML
    │
    ├── ?format=csv → CsvExportUtil streams text/csv via StreamingResponseBody
    │
    ├── ?format=print → returns HTML fragment for browser print
    │
    └── (default) → Jackson produces application/json
```

The `Open311XmlSerializer` uses a custom XML writer (not JAXB) to exactly replicate the PHP Laminas XML template output: no attributes, text-content-only elements, `<?xml version="1.0" encoding="utf-8"?>` declaration.
## Section 02: Data Model — PostgreSQL 16 DDL

**All timestamps: `TIMESTAMPTZ`. UUID generation: `gen_random_uuid()`. Required extensions: `postgis`, `pgcrypto`.**

---

## ER Diagram (ASCII)

```
contactMethods ──< tickets (contactMethod_id, responseMethod_id)
departments ──< people (department_id)
departments ──< categories (department_id)
departments >──< actions (department_actions)
departments >──< categories (department_categories)
people ──< tickets (reportedByPerson_id, assignedPerson_id, enteredByPerson_id)
people ──< peopleEmails
people ──< peoplePhones
people ──< peopleAddresses
people ──< bookmarks
people ──< refresh_tokens
people ─── departments (departments.defaultPerson_id)
clients ──< tickets (client_id)
clients → people (contactPerson_id)
clients → contactMethods (contactMethod_id)
categoryGroups ──< categories (categoryGroup_id)
substatus ──< tickets (substatus_id)
substatus ─── categories (autoCloseSubstatus_id)
categories ──< tickets (category_id)
categories ──< category_action_responses (category_id)
actions ──< ticketHistory (action_id)
actions ──< category_action_responses (action_id)
actions ──< responseTemplates (action_id)
issueTypes ──< tickets (issueType_id)
locations ──< tickets (addressId)
tickets ──< ticketHistory
tickets ──< media
tickets ─── ticket_geodata
geoclusters ──< ticket_geodata (cluster_id_0..6)
token_blacklist (standalone; cleaned by scheduler)
```

---

## DDL Creation Order

Tables must be created in this sequence (FK dependencies):

1. `contactMethods` → 2. `departments` → 3. `people` → 4. `ALTER TABLE departments ADD FK` →
5. `peopleEmails/Phones/Addresses` → 6. `clients` → 7. `substatus` → 8. `categoryGroups` →
9. `categories` → 10. `actions` → 11. `category_action_responses` → 12. `department_actions` →
13. `department_categories` → 14. `issueTypes` → 15. `locations` → 16. `tickets` →
17. `ticketHistory` → 18. `media` → 19. `bookmarks` → 20. `geoclusters` →
21. `ticket_geodata` → 22. `responseTemplates` → 23. `refresh_tokens` → 24. `token_blacklist`

---

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

---

## Lookup Tables

### contactMethods

```sql
CREATE TABLE contactMethods (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    isSystem    BOOLEAN         NOT NULL DEFAULT false,
    CONSTRAINT uq_contact_methods_name UNIQUE (name)
);

INSERT INTO contactMethods (id, name, isSystem) VALUES
    (1, 'Email',    true),
    (2, 'Phone',    true),
    (3, 'Web Form', true),
    (4, 'Other',    true);
SELECT setval('contactmethods_id_seq', 4);
```

### issueTypes

```sql
CREATE TABLE issueTypes (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    isSystem    BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_issue_types_name UNIQUE (name)
);

INSERT INTO issueTypes (id, name, isSystem) VALUES
    (1, 'Comment',   true),
    (2, 'Complaint', true),
    (3, 'Question',  true),
    (4, 'Report',    true),
    (5, 'Request',   true),
    (6, 'Violation', true);
SELECT setval('issuetypes_id_seq', 6);
```

---

## People & Organization Tables

### departments

```sql
CREATE TABLE departments (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100)    NOT NULL,
    defaultPerson_id    INTEGER,        -- FK added after people (see ALTER below)
    CONSTRAINT uq_departments_name UNIQUE (name)
);
```

### people

```sql
CREATE TABLE people (
    id              SERIAL PRIMARY KEY,
    firstname       VARCHAR(100)    NOT NULL,
    middlename      VARCHAR(100),
    lastname        VARCHAR(100)    NOT NULL,
    organization    VARCHAR(200),
    address         VARCHAR(255),
    city            VARCHAR(100),
    state           VARCHAR(2),
    zip             VARCHAR(10),
    department_id   INTEGER         REFERENCES departments(id) ON DELETE SET NULL,
    username        VARCHAR(100),
    passwordHash    VARCHAR(255),
    role            VARCHAR(20)     CHECK (role IN ('staff', 'public', 'anonymous')),
    deletedAt       TIMESTAMPTZ,
    CONSTRAINT uq_people_username UNIQUE (username)
);

-- Resolve circular dependency: departments.defaultPerson_id → people
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_default_person
    FOREIGN KEY (defaultPerson_id) REFERENCES people(id) ON DELETE SET NULL;

CREATE INDEX idx_people_department  ON people (department_id);
CREATE INDEX idx_people_role        ON people (role);
CREATE INDEX idx_people_username    ON people (username);
CREATE INDEX idx_people_name        ON people (lastname, firstname);
CREATE INDEX idx_people_deleted     ON people (deletedAt) WHERE deletedAt IS NULL;
```

### peopleEmails

```sql
CREATE TABLE peopleEmails (
    id                      SERIAL PRIMARY KEY,
    person_id               INTEGER         NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    email                   VARCHAR(255)    NOT NULL,
    label                   VARCHAR(50),    -- 'Home', 'Work', 'Other'
    usedForNotifications    BOOLEAN         NOT NULL DEFAULT false
);

CREATE INDEX idx_people_emails_person  ON peopleEmails (person_id);
CREATE INDEX idx_people_emails_email   ON peopleEmails (email);
CREATE INDEX idx_people_emails_notify  ON peopleEmails (person_id) WHERE usedForNotifications = true;
```

### peoplePhones

```sql
CREATE TABLE peoplePhones (
    id          SERIAL PRIMARY KEY,
    person_id   INTEGER         NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    number      VARCHAR(30)     NOT NULL,
    label       VARCHAR(50)     -- 'Main', 'Mobile', 'Work', 'Home', 'Fax', 'Pager', 'Other'
);

CREATE INDEX idx_people_phones_person ON peoplePhones (person_id);
```

### peopleAddresses

```sql
CREATE TABLE peopleAddresses (
    id          SERIAL PRIMARY KEY,
    person_id   INTEGER         NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    address     VARCHAR(255)    NOT NULL,
    city        VARCHAR(100),
    state       VARCHAR(2),
    zip         VARCHAR(10),
    label       VARCHAR(50)     -- 'Home', 'Business', 'Rental'
);

CREATE INDEX idx_people_addresses_person ON peopleAddresses (person_id);
```

### clients

```sql
CREATE TABLE clients (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(200)    NOT NULL,
    url                 VARCHAR(500),
    api_key_hash        VARCHAR(255)    NOT NULL,   -- BCrypt hash for secure storage
    api_key_lookup      VARCHAR(64)     NOT NULL,   -- SHA-256 hex for fast indexed lookup
    contactPerson_id    INTEGER         REFERENCES people(id) ON DELETE SET NULL,
    contactMethod_id    INTEGER         REFERENCES contactMethods(id) ON DELETE SET NULL,
    CONSTRAINT uq_clients_api_key_lookup UNIQUE (api_key_lookup)
);

CREATE INDEX idx_clients_contact_person ON clients (contactPerson_id);
```

---

## Category & Action Tables

### substatus

```sql
CREATE TABLE substatus (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    description TEXT,
    status      VARCHAR(10)     NOT NULL CHECK (status IN ('open', 'closed')),
    isDefault   BOOLEAN         NOT NULL DEFAULT false,
    isSystem    BOOLEAN         NOT NULL DEFAULT false
);

CREATE INDEX idx_substatus_status    ON substatus (status);
CREATE INDEX idx_substatus_default   ON substatus (status) WHERE isDefault = true;

INSERT INTO substatus (id, name, description, status, isDefault, isSystem) VALUES
    (1, 'Open',      'Ticket is open',                  'open',   true,  true),
    (2, 'Resolved',  'Issue has been resolved',          'closed', true,  true),
    (3, 'Duplicate', 'Ticket is a duplicate of another', 'closed', false, true),
    (4, 'Bogus',     'Ticket was invalid or bogus',      'closed', false, true);
SELECT setval('substatus_id_seq', 4);
```

### categoryGroups

```sql
CREATE TABLE categoryGroups (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    ordering    INTEGER         NOT NULL DEFAULT 0
);

CREATE INDEX idx_category_groups_ordering ON categoryGroups (ordering);
```

### categories

```sql
CREATE TABLE categories (
    id                          SERIAL PRIMARY KEY,
    name                        VARCHAR(200)    NOT NULL,
    description                 TEXT,
    department_id               INTEGER         REFERENCES departments(id) ON DELETE SET NULL,
    defaultPerson_id            INTEGER         REFERENCES people(id) ON DELETE SET NULL,
    categoryGroup_id            INTEGER         REFERENCES categoryGroups(id) ON DELETE SET NULL,
    active                      BOOLEAN         NOT NULL DEFAULT true,
    featured                    BOOLEAN         NOT NULL DEFAULT false,
    displayPermissionLevel      VARCHAR(20)     NOT NULL DEFAULT 'anonymous'
                                                CHECK (displayPermissionLevel IN ('staff','public','anonymous')),
    postingPermissionLevel      VARCHAR(20)     NOT NULL DEFAULT 'anonymous'
                                                CHECK (postingPermissionLevel IN ('staff','public','anonymous')),
    customFields                JSONB,
    lastModified                TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    slaDays                     INTEGER,
    notificationReplyEmail      VARCHAR(255),
    autoCloseIsActive           BOOLEAN         NOT NULL DEFAULT false,
    autoCloseSubstatus_id       INTEGER         REFERENCES substatus(id) ON DELETE SET NULL
);

CREATE INDEX idx_categories_department      ON categories (department_id);
CREATE INDEX idx_categories_group           ON categories (categoryGroup_id);
CREATE INDEX idx_categories_active          ON categories (active) WHERE active = true;
CREATE INDEX idx_categories_posting_perm    ON categories (postingPermissionLevel);
```

### actions

```sql
CREATE TABLE actions (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    description TEXT,
    type        VARCHAR(20)     NOT NULL CHECK (type IN ('system', 'department')),
    template    TEXT,
    replyEmail  VARCHAR(255)
);

CREATE INDEX idx_actions_type ON actions (type);

INSERT INTO actions (id, name, description, type, template) VALUES
    (1,  'open',           'Ticket opened',                   'system', 'Ticket opened by {enteredByPerson}'),
    (2,  'assignment',     'Ticket assigned to person',        'system', 'Assigned to {actionPerson} by {enteredByPerson}'),
    (3,  'closed',         'Ticket closed',                   'system', 'Closed by {enteredByPerson}'),
    (4,  'changeCategory', 'Ticket category changed',         'system', 'Category changed from {original:category_id} to {updated:category_id} by {enteredByPerson}'),
    (5,  'changeLocation', 'Ticket location changed',         'system', 'Location changed from {original:location} to {updated:location} by {enteredByPerson}'),
    (6,  'response',       'Response recorded on ticket',     'system', 'Response recorded by {enteredByPerson}'),
    (7,  'duplicate',      'Ticket marked as duplicate',      'system', 'Marked as duplicate of #{duplicate:ticket_id} by {enteredByPerson}'),
    (8,  'update',         'Ticket updated',                  'system', 'Updated by {enteredByPerson}'),
    (9,  'comment',        'Comment added to ticket',         'system', 'Comment added by {enteredByPerson}'),
    (10, 'upload_media',   'Media uploaded to ticket',        'system', 'Media uploaded by {enteredByPerson}');
SELECT setval('actions_id_seq', 10);
```

### category_action_responses

```sql
CREATE TABLE category_action_responses (
    id              SERIAL PRIMARY KEY,
    category_id     INTEGER     NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    action_id       INTEGER     NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    template        TEXT,
    replyEmail      VARCHAR(255),
    CONSTRAINT uq_cat_action_response UNIQUE (category_id, action_id)
);

CREATE INDEX idx_cat_action_responses_category ON category_action_responses (category_id);
CREATE INDEX idx_cat_action_responses_action   ON category_action_responses (action_id);
```

### department_actions

```sql
CREATE TABLE department_actions (
    department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    action_id       INTEGER NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    PRIMARY KEY (department_id, action_id)
);
```

### department_categories

```sql
CREATE TABLE department_categories (
    department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (department_id, category_id)
);
```

---

## Core Ticket Tables

### locations

```sql
CREATE TABLE locations (
    id          SERIAL PRIMARY KEY,
    address     VARCHAR(255)    NOT NULL,
    city        VARCHAR(100),
    state       VARCHAR(2),
    zip         VARCHAR(10),
    latitude    NUMERIC(9,6),
    longitude   NUMERIC(9,6),
    geo_point   GEOGRAPHY(POINT, 4326)
);

CREATE INDEX idx_locations_geo   ON locations USING GIST (geo_point);
CREATE INDEX idx_locations_addr  ON locations (address, city, state, zip);
```

### tickets

```sql
CREATE TABLE tickets (
    id                      BIGSERIAL PRIMARY KEY,
    parent_id               BIGINT         REFERENCES tickets(id) ON DELETE SET NULL,
    category_id             INTEGER        NOT NULL REFERENCES categories(id),
    issueType_id            INTEGER        REFERENCES issueTypes(id),
    client_id               INTEGER        REFERENCES clients(id) ON DELETE SET NULL,
    enteredByPerson_id      INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    reportedByPerson_id     INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    assignedPerson_id       INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    contactMethod_id        INTEGER        REFERENCES contactMethods(id),
    responseMethod_id       INTEGER        REFERENCES contactMethods(id),
    enteredDate             TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    lastModified            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    addressId               INTEGER        REFERENCES locations(id) ON DELETE SET NULL,
    latitude                NUMERIC(9,6),
    longitude               NUMERIC(9,6),
    geo_point               GEOGRAPHY(POINT, 4326),
    location                TEXT,
    city                    VARCHAR(100),
    state                   VARCHAR(2),
    zip                     VARCHAR(10),
    status                  VARCHAR(20)    NOT NULL DEFAULT 'open'
                                           CHECK (status IN ('open','closed')),
    closedDate              TIMESTAMPTZ,
    substatus_id            INTEGER        REFERENCES substatus(id),
    additionalFields        JSONB,
    customFields            JSONB,
    description             TEXT           NOT NULL,
    search_vector           TSVECTOR
);

-- Scalar indexes
CREATE INDEX idx_tickets_status         ON tickets (status);
CREATE INDEX idx_tickets_category       ON tickets (category_id);
CREATE INDEX idx_tickets_assignedPerson ON tickets (assignedPerson_id);
CREATE INDEX idx_tickets_reportedBy     ON tickets (reportedByPerson_id);
CREATE INDEX idx_tickets_enteredDate    ON tickets (enteredDate);
CREATE INDEX idx_tickets_closedDate     ON tickets (closedDate);
CREATE INDEX idx_tickets_lastModified   ON tickets (lastModified);
CREATE INDEX idx_tickets_substatus      ON tickets (substatus_id);
CREATE INDEX idx_tickets_client         ON tickets (client_id);
CREATE INDEX idx_tickets_parent         ON tickets (parent_id);
-- FTS index
CREATE INDEX idx_tickets_fts            ON tickets USING GIN (search_vector);
-- Geo index
CREATE INDEX idx_tickets_geo            ON tickets USING GIST (geo_point);

-- FTS update trigger
CREATE OR REPLACE FUNCTION tickets_fts_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.location, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.city, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW.zip, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_tickets_fts
    BEFORE INSERT OR UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION tickets_fts_update();

-- geo_point sync trigger
CREATE OR REPLACE FUNCTION tickets_geo_sync() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geo_point := ST_MakePoint(NEW.longitude, NEW.latitude)::geography;
    ELSE
        NEW.geo_point := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_tickets_geo
    BEFORE INSERT OR UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION tickets_geo_sync();
```

### ticketHistory

```sql
CREATE TABLE ticketHistory (
    id                  BIGSERIAL PRIMARY KEY,
    ticket_id           BIGINT         NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    enteredByPerson_id  INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    actionPerson_id     INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    action_id           INTEGER        NOT NULL REFERENCES actions(id),
    enteredDate         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    actionDate          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    notes               TEXT,
    data                JSONB,
    sentNotifications   TEXT
);

CREATE INDEX idx_history_ticket     ON ticketHistory (ticket_id);
CREATE INDEX idx_history_action     ON ticketHistory (action_id);
CREATE INDEX idx_history_entered    ON ticketHistory (enteredDate);
CREATE INDEX idx_history_sn_null    ON ticketHistory (ticket_id) WHERE sentNotifications IS NULL;
```

### media

```sql
CREATE TABLE media (
    id                  BIGSERIAL PRIMARY KEY,
    ticket_id           BIGINT         NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    filename            VARCHAR(255)   NOT NULL,
    internalFilename    VARCHAR(255)   NOT NULL,
    mime_type           VARCHAR(100)   NOT NULL,
    uploaded            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    person_id           INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    CONSTRAINT uq_media_internal_filename UNIQUE (internalFilename)
);

CREATE INDEX idx_media_ticket ON media (ticket_id);
```

---

## Auth Tables

### refresh_tokens

```sql
CREATE TABLE refresh_tokens (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id   INTEGER         NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    createdAt   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    expiresAt   TIMESTAMPTZ     NOT NULL,
    revoked     BOOLEAN         NOT NULL DEFAULT false
);

CREATE INDEX idx_refresh_tokens_person  ON refresh_tokens (person_id);
CREATE INDEX idx_refresh_tokens_expiry  ON refresh_tokens (expiresAt) WHERE revoked = false;
```

### token_blacklist

```sql
CREATE TABLE token_blacklist (
    jti         VARCHAR(36)  PRIMARY KEY,
    expiresAt   TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_token_blacklist_expiry ON token_blacklist (expiresAt);
```

---

## Geo Tables

### geoclusters

```sql
CREATE TABLE geoclusters (
    id      BIGSERIAL PRIMARY KEY,
    level   SMALLINT               NOT NULL CHECK (level BETWEEN 0 AND 6),
    center  GEOGRAPHY(POINT, 4326) NOT NULL
);

CREATE INDEX idx_geoclusters_level  ON geoclusters (level);
CREATE INDEX idx_geoclusters_center ON geoclusters USING GIST (center);
```

### ticket_geodata

```sql
CREATE TABLE ticket_geodata (
    ticket_id       BIGINT  PRIMARY KEY REFERENCES tickets(id) ON DELETE CASCADE,
    cluster_id_0    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_1    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_2    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_3    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_4    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_5    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_6    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL
);

CREATE INDEX idx_ticket_geodata_c0 ON ticket_geodata (cluster_id_0);
CREATE INDEX idx_ticket_geodata_c1 ON ticket_geodata (cluster_id_1);
CREATE INDEX idx_ticket_geodata_c2 ON ticket_geodata (cluster_id_2);
CREATE INDEX idx_ticket_geodata_c3 ON ticket_geodata (cluster_id_3);
CREATE INDEX idx_ticket_geodata_c4 ON ticket_geodata (cluster_id_4);
CREATE INDEX idx_ticket_geodata_c5 ON ticket_geodata (cluster_id_5);
CREATE INDEX idx_ticket_geodata_c6 ON ticket_geodata (cluster_id_6);
```

---

## Miscellaneous Tables

### bookmarks

```sql
CREATE TABLE bookmarks (
    id          SERIAL PRIMARY KEY,
    person_id   INTEGER         NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    type        VARCHAR(50)     NOT NULL DEFAULT 'search',
    name        VARCHAR(200)    NOT NULL,
    requestUri  VARCHAR(2048)   NOT NULL,
    createdAt   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookmarks_person ON bookmarks (person_id);
```

### responseTemplates

```sql
CREATE TABLE responseTemplates (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200)    NOT NULL,
    template    TEXT            NOT NULL,
    action_id   INTEGER         REFERENCES actions(id) ON DELETE SET NULL
);

CREATE INDEX idx_response_templates_action ON responseTemplates (action_id);
```

---

## MySQL → PostgreSQL Type Mapping

| MySQL Type | PostgreSQL Equivalent | Notes |
|------------|----------------------|-------|
| `INT AUTO_INCREMENT` | `SERIAL` | `BIGSERIAL` for high-volume tables |
| `ENUM('open','closed')` | `VARCHAR(20) CHECK (value IN (...))` | More portable than PG ENUM |
| `TINYINT(1)` | `BOOLEAN` | Exact semantic match |
| `DATETIME` | `TIMESTAMPTZ` | Always timezone-aware |
| `JSON` | `JSONB` | Binary JSON; supports GIN indexing |
| `POINT` (MySQL spatial) | `GEOGRAPHY(POINT, 4326)` (PostGIS) | Requires PostGIS extension |
| `VARCHAR(n)` | `VARCHAR(n)` | Identical |
| `FLOAT` / `DOUBLE` | `NUMERIC(9,6)` | Fixed precision for lat/long |
| `TEXT` | `TEXT` | Identical |

**Post-migration sequence reset:**
```sql
-- Run after data migration for every SERIAL table:
SELECT setval('tablename_id_seq', (SELECT MAX(id) FROM tablename));
```
## Section 03: API Design — TypeScript Interfaces & Endpoint Reference

**Base path:** `/api/v1/` (internal REST), `/open311/` (GeoReport v2 external API)  
**Auth:** `Authorization: Bearer <jwt>` unless noted  
**Content-Type:** `application/json`  
**Error shape:** `{ "error": "ERROR_CODE", "message": "..." }`  
**Pagination:** default `limit=25`, `offset=0`  

---

## TypeScript Interface Definitions

These interfaces are the canonical contract between the React SPA and the Spring Boot API. Generated from FRD response shapes.

### Auth Types

```typescript
// types/auth.types.ts

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;       // seconds
  role: 'staff' | 'public' | 'anonymous';
  personId: number;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}
```

### Ticket Types

```typescript
// types/ticket.types.ts

export type TicketStatus = 'open' | 'closed';
export type PermissionLevel = 'anonymous' | 'public' | 'staff';

export interface Ticket {
  id: number;
  parent_id: number | null;
  category_id: number;
  categoryName: string;
  issueType_id: number | null;
  issueTypeName: string | null;
  client_id: number | null;
  enteredByPerson_id: number | null;
  reportedByPerson_id: number | null;
  assignedPerson_id: number | null;
  assignedPersonName: string | null;
  contactMethod_id: number | null;
  responseMethod_id: number | null;
  enteredDate: string;           // ISO 8601
  lastModified: string;          // ISO 8601
  closedDate: string | null;     // ISO 8601
  addressId: number | null;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  status: TicketStatus;
  substatus_id: number | null;
  substatusName: string | null;
  additionalFields: Record<string, unknown> | null;
  customFields: Record<string, unknown> | null;
  description: string;
  historyCount?: number;
  mediaCount?: number;
}

export interface TicketSummary {
  id: number;
  status: TicketStatus;
  substatusName: string | null;
  categoryName: string;
  description: string;
  location: string | null;
  city: string | null;
  enteredDate: string;
  lastModified: string;
  assignedPersonName: string | null;
}

export interface TicketListResponse {
  total: number;
  page: number;
  limit: number;
  tickets: TicketSummary[];
}

export interface CreateTicketRequest {
  category_id: number;
  description: string;
  location?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  reportedByPerson_id?: number | null;
  reporterFirstname?: string;
  reporterLastname?: string;
  reporterEmail?: string;
  assignedPerson_id?: number | null;
  issueType_id?: number | null;
  contactMethod_id?: number | null;
  responseMethod_id?: number | null;
  customFields?: Record<string, unknown>;
  additionalFields?: Record<string, unknown>;
  client_id?: number | null;
}

export interface UpdateTicketRequest {
  category_id?: number;
  description?: string;
  location?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  assignedPerson_id?: number | null;
  issueType_id?: number | null;
  contactMethod_id?: number | null;
  responseMethod_id?: number | null;
  customFields?: Record<string, unknown>;
  additionalFields?: Record<string, unknown>;
}

export interface CloseTicketRequest {
  substatus_id: number;
  notes?: string;
}

export interface DuplicateTicketRequest {
  parent_id: number;
}

export interface AssignTicketRequest {
  assignedPerson_id: number;
}

export interface CommentRequest {
  notes: string;
}
```

### Ticket History Types

```typescript
// types/ticket.types.ts (continued)

export interface TicketHistoryEntry {
  id: number;
  ticket_id: number;
  action_id: number;
  actionName: string;
  actionType: 'system' | 'department';
  enteredByPerson_id: number | null;
  enteredByPersonName: string | null;
  actionPerson_id: number | null;
  actionPersonName: string | null;
  enteredDate: string;    // ISO 8601
  actionDate: string;     // ISO 8601
  notes: string | null;
  data: Record<string, unknown> | null;
  sentNotifications: string | null;
  renderedDescription: string;
}

export interface TicketHistoryResponse {
  ticketId: number;
  history: TicketHistoryEntry[];
}
```

### Search Types

```typescript
// types/search.types.ts

export interface TicketSearchParams {
  q?: string;
  category_id?: number;
  department_id?: number;
  assignedPerson_id?: number;
  enteredByPerson_id?: number;
  reportedByPerson_id?: number;
  status?: 'open' | 'closed';
  substatus_id?: number;
  contactMethod_id?: number;
  client_id?: number;
  issueType_id?: number;
  enteredDateFrom?: string;   // ISO date
  enteredDateTo?: string;     // ISO date
  closedDateFrom?: string;    // ISO date
  closedDateTo?: string;      // ISO date
  city?: string;
  zip?: string;
  lat?: number;
  long?: number;
  radius?: number;            // meters
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface MapCluster {
  cluster_id: number;
  count: number;
  lat: number;
  long: number;
}

export interface MapViewResponse {
  clusters: MapCluster[];
}
```

### Person Types

```typescript
// types/person.types.ts

export type PersonRole = 'staff' | 'public' | 'anonymous';

export interface PersonEmail {
  id: number;
  person_id: number;
  email: string;
  label: string | null;
  usedForNotifications: boolean;
}

export interface PersonPhone {
  id: number;
  person_id: number;
  number: string;
  label: string | null;
}

export interface PersonAddress {
  id: number;
  person_id: number;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  label: string | null;
}

export interface Person {
  id: number;
  firstname: string;
  middlename: string | null;
  lastname: string;
  organization: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  department_id: number | null;
  departmentName: string | null;
  username: string | null;
  role: PersonRole | null;
  emails?: PersonEmail[];
  phones?: PersonPhone[];
  addresses?: PersonAddress[];
}

export interface PersonListResponse {
  total: number;
  page: number;
  limit: number;
  people: Person[];
}

export interface CreatePersonRequest {
  firstname: string;
  lastname: string;
  middlename?: string;
  organization?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  department_id?: number | null;
  username?: string;
  password?: string;
  role?: PersonRole;
  emails?: Omit<PersonEmail, 'id' | 'person_id'>[];
  phones?: Omit<PersonPhone, 'id' | 'person_id'>[];
  addresses?: Omit<PersonAddress, 'id' | 'person_id'>[];
}
```

### Category Types

```typescript
// types/category.types.ts

export interface CustomFieldOption {
  key: string;
  name: string;
}

export interface CustomFieldDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'singlevaluelist' | 'multivaluelist' | 'datetime' | 'text';
  required: boolean;
  order: number;
  options?: string[];
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  department_id: number | null;
  departmentName: string | null;
  defaultPerson_id: number | null;
  defaultPersonName: string | null;
  categoryGroup_id: number | null;
  categoryGroupName: string | null;
  active: boolean;
  featured: boolean;
  displayPermissionLevel: PermissionLevel;
  postingPermissionLevel: PermissionLevel;
  customFields: CustomFieldDefinition[] | null;
  slaDays: number | null;
  notificationReplyEmail: string | null;
  autoCloseIsActive: boolean;
  autoCloseSubstatus_id: number | null;
  lastModified: string;
}

export interface CategoryGroup {
  id: number;
  name: string;
  ordering: number;
  categoryCount?: number;
  categories?: Category[];
}
```

### Admin Types

```typescript
// types/admin.types.ts

export interface Department {
  id: number;
  name: string;
  defaultPerson_id: number | null;
  defaultPersonName: string | null;
  categoryCount?: number;
  staffCount?: number;
}

export interface Substatus {
  id: number;
  name: string;
  description: string | null;
  status: 'open' | 'closed';
  isDefault: boolean;
  isSystem: boolean;
}

export interface Action {
  id: number;
  name: string;
  description: string | null;
  type: 'system' | 'department';
  template: string | null;
  replyEmail: string | null;
}

export interface Client {
  id: number;
  name: string;
  url: string | null;
  contactPerson_id: number | null;
  contactPersonName: string | null;
  contactMethod_id: number | null;
  contactMethodName: string | null;
  rawApiKey?: string;    // only present on create / key regeneration
}

export interface ContactMethod {
  id: number;
  name: string;
  isSystem: boolean;
}

export interface IssueType {
  id: number;
  name: string;
  isSystem: boolean;
}

export interface Bookmark {
  id: number;
  person_id: number;
  type: string;
  name: string;
  requestUri: string;
  createdAt: string;
}

export interface ResponseTemplate {
  id: number;
  name: string;
  template: string;
  action_id: number | null;
  actionName: string | null;
}

export interface CategoryActionResponse {
  id: number;
  category_id: number;
  action_id: number;
  actionName: string;
  template: string | null;
  replyEmail: string | null;
}
```

### Media Types

```typescript
// types/media.types.ts

export interface MediaItem {
  id: number;
  ticket_id: number;
  filename: string;
  internalFilename: string;
  mime_type: string;
  uploaded: string;    // ISO 8601
  person_id: number | null;
  url: string;
  thumbnailUrl: string;
}
```

### Open311 Types

```typescript
// types/open311.types.ts

export interface Open311ServiceAttribute {
  variable: boolean;
  code: string;
  datatype: string;
  required: boolean;
  description: string;
  order: number;
  values?: { key: string; name: string }[];
}

export interface Open311Service {
  service_code: string;
  service_name: string;
  description: string | null;
  metadata: 'true' | 'false';
  type: 'realtime';
  keywords: string;
  group: string | null;
  attributes?: Open311ServiceAttribute[];
}

export interface Open311ServiceRequest {
  service_request_id: string;
  status: 'open' | 'closed';
  status_notes: string | null;
  service_name: string;
  service_code: string;
  description: string | null;
  agency_responsible: string | null;
  requested_datetime: string;    // ISO 8601
  updated_datetime: string;      // ISO 8601
  expected_datetime: string | null;
  lat: string | null;
  long: string | null;
  address: string | null;
  address_id: string | null;
  zipcode: string | null;
  media_url: string | null;
}

export interface Open311PostResponse {
  service_request_id: string;
  service_notice: string;
  account_id: string;
}

export interface MetricsResponse {
  category_id: number;
  categoryName: string;
  numDays: number;
  effectiveDate: string;
  onTimePercentage: number;
  closedCount: number;
  onTimeCount: number;
}

export interface ReportResponse {
  reportType: string;
  generatedAt: string;
  data: Record<string, unknown>[];
}
```

---

## API Endpoint Summary

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/login` | none | Authenticate, receive JWT + refresh token |
| POST | `/api/v1/auth/refresh` | none | Rotate tokens |
| POST | `/api/v1/auth/logout` | Bearer JWT | Revoke tokens |
| GET | `/callback` | none (OAuth code) | OAuth IdP callback |

### Tickets

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/tickets` | per category posting permission | Create ticket |
| GET | `/api/v1/tickets` | per category display permission | Search/list tickets |
| GET | `/api/v1/tickets/export` | staff | CSV or print export |
| GET | `/api/v1/tickets/map` | any | Geo-cluster map view |
| GET | `/api/v1/tickets/{id}` | per category display permission | Ticket detail |
| PATCH | `/api/v1/tickets/{id}` | staff | Update ticket fields |
| PATCH | `/api/v1/tickets/{id}/assign` | staff | Assign to person |
| PATCH | `/api/v1/tickets/{id}/close` | staff | Close with substatus |
| PATCH | `/api/v1/tickets/{id}/reopen` | staff | Reopen closed ticket |
| PATCH | `/api/v1/tickets/{id}/duplicate` | staff | Mark as duplicate |
| POST | `/api/v1/tickets/{id}/comments` | staff | Add comment |
| DELETE | `/api/v1/tickets/{id}` | staff | Hard delete |
| GET | `/api/v1/tickets/{id}/history` | staff | Full history log |
| GET | `/api/v1/tickets/{id}/history/{historyId}` | staff | Single history entry |
| POST | `/api/v1/tickets/{id}/media` | per category posting permission | Upload files |
| GET | `/api/v1/tickets/{id}/media` | per category display permission | List media |
| DELETE | `/api/v1/tickets/{id}/media/{mediaId}` | staff | Delete media |

### Media

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/media/{internalFilename}` | per category display | Serve original file |
| GET | `/api/v1/media/{internalFilename}/thumbnail` | per category display | Serve thumbnail |

### People

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/people` | staff | List/search people |
| POST | `/api/v1/people` | staff | Create person |
| GET | `/api/v1/people/{id}` | staff | Person detail |
| PUT | `/api/v1/people/{id}` | staff | Replace person |
| PATCH | `/api/v1/people/{id}` | staff | Update person fields |
| DELETE | `/api/v1/people/{id}` | staff | Soft-delete person |
| GET | `/api/v1/people/{id}/tickets` | staff | Person's tickets |
| POST | `/api/v1/people/{id}/emails` | staff | Add email |
| PUT | `/api/v1/people/{id}/emails/{emailId}` | staff | Update email |
| DELETE | `/api/v1/people/{id}/emails/{emailId}` | staff | Remove email |
| POST | `/api/v1/people/{id}/phones` | staff | Add phone |
| PUT | `/api/v1/people/{id}/phones/{phoneId}` | staff | Update phone |
| DELETE | `/api/v1/people/{id}/phones/{phoneId}` | staff | Remove phone |
| POST | `/api/v1/people/{id}/addresses` | staff | Add address |
| PUT | `/api/v1/people/{id}/addresses/{addrId}` | staff | Update address |
| DELETE | `/api/v1/people/{id}/addresses/{addrId}` | staff | Remove address |

### Departments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/departments` | staff | List departments |
| POST | `/api/v1/departments` | staff | Create department |
| GET | `/api/v1/departments/{id}` | staff | Department detail |
| PUT | `/api/v1/departments/{id}` | staff | Update department |
| DELETE | `/api/v1/departments/{id}` | staff | Delete department |
| GET | `/api/v1/departments/{id}/people` | staff | Staff in department |
| GET | `/api/v1/departments/{id}/categories` | staff | Categories in department |
| PUT | `/api/v1/departments/{id}/categories` | staff | Set category associations |
| PUT | `/api/v1/departments/{id}/actions` | staff | Set action associations |

### Clients

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/clients` | staff | List API clients |
| POST | `/api/v1/clients` | staff | Register client (returns rawApiKey once) |
| GET | `/api/v1/clients/{id}` | staff | Client detail |
| PATCH | `/api/v1/clients/{id}` | staff | Update / regenerate key |
| DELETE | `/api/v1/clients/{id}` | staff | Delete client |

### Categories & Groups

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/categories` | per displayPermissionLevel | List categories |
| POST | `/api/v1/categories` | staff | Create category |
| GET | `/api/v1/categories/{id}` | per displayPermissionLevel | Category detail |
| PUT | `/api/v1/categories/{id}` | staff | Update category |
| DELETE | `/api/v1/categories/{id}` | staff | Delete category |
| GET | `/api/v1/categories/{id}/action-responses` | staff | List category action responses |
| POST | `/api/v1/categories/{id}/action-responses` | staff | Upsert category action response |
| DELETE | `/api/v1/categories/{id}/action-responses/{rid}` | staff | Delete category action response |
| GET | `/api/v1/category-groups` | staff | List groups |
| POST | `/api/v1/category-groups` | staff | Create group |
| GET | `/api/v1/category-groups/{id}` | staff | Group with categories |
| PUT | `/api/v1/category-groups/{id}` | staff | Update group |
| DELETE | `/api/v1/category-groups/{id}` | staff | Delete group |
| PUT | `/api/v1/category-groups/order` | staff | Reorder groups |

### Admin Lookups

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/substatus` | staff | List substatuses |
| POST | `/api/v1/substatus` | staff | Create substatus |
| PATCH | `/api/v1/substatus/{id}` | staff | Update substatus |
| DELETE | `/api/v1/substatus/{id}` | staff | Delete substatus |
| GET | `/api/v1/actions` | staff | List actions |
| POST | `/api/v1/actions` | staff | Create department action |
| PATCH | `/api/v1/actions/{id}` | staff | Update action |
| DELETE | `/api/v1/actions/{id}` | staff | Delete action |
| GET | `/api/v1/contact-methods` | none | List contact methods |
| POST | `/api/v1/contact-methods` | staff | Create contact method |
| DELETE | `/api/v1/contact-methods/{id}` | staff | Delete contact method |
| GET | `/api/v1/issue-types` | none | List issue types |
| POST | `/api/v1/issue-types` | staff | Create issue type |
| DELETE | `/api/v1/issue-types/{id}` | staff | Delete issue type |
| GET | `/api/v1/bookmarks` | staff | List user's bookmarks |
| POST | `/api/v1/bookmarks` | staff | Create bookmark |
| DELETE | `/api/v1/bookmarks/{id}` | staff | Delete bookmark |
| GET | `/api/v1/response-templates` | staff | List response templates |
| POST | `/api/v1/response-templates` | staff | Create template |
| GET | `/api/v1/response-templates/{id}` | staff | Template detail |
| PUT | `/api/v1/response-templates/{id}` | staff | Update template |
| DELETE | `/api/v1/response-templates/{id}` | staff | Delete template |

### Metrics & Reports

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/metrics` | staff | onTimePercentage for a category |
| GET | `/api/v1/reports/{reportType}` | staff | Canned report |
| GET | `/api/v1/locations` | staff | List canonical locations |
| GET | `/api/v1/locations/{id}` | staff | Location detail |
| POST | `/api/v1/admin/jobs/digest-notifications/run` | staff | Trigger digest job |
| POST | `/api/v1/admin/jobs/auto-close/run` | staff | Trigger auto-close job |
| POST | `/api/v1/admin/jobs/audit/run` | staff | Trigger audit job |

### Open311 GeoReport v2

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/open311/discovery` | none | API discovery metadata |
| GET | `/open311/services` | none | List active services (JSON or XML) |
| GET | `/open311/services/{service_code}` | none | Service with attribute schema |
| POST | `/open311/requests` | `api_key` param | Submit service request |
| GET | `/open311/requests` | none | Search service requests |
| GET | `/open311/requests/{service_request_id}` | none | Single service request |

---

## API Design Conventions

### Error Response Format

```json
{
  "error": "TICKET_NOT_FOUND",
  "message": "Ticket not found",
  "field": "id"
}
```

Multiple field errors:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "errors": [
    { "field": "description", "error": "DESCRIPTION_REQUIRED", "message": "Description is required" },
    { "field": "category_id", "error": "CATEGORY_NOT_FOUND", "message": "Category not found or inactive" }
  ]
}
```

### Pagination Response Envelope

All list endpoints return:
```json
{
  "total": 342,
  "page": 1,
  "limit": 25,
  "items": [ ... ]
}
```
(Field name for the array matches the resource: `tickets`, `people`, `categories`, etc.)

### Format Query Parameter

Open311 endpoints and ticket export endpoints support:
- `?format=json` — default
- `?format=xml` — Open311 byte-compatible XML
- `?format=csv` — staff only (tickets export)
- `?format=print` — staff only (tickets export, print HTML)

The `format` query param takes precedence over the `Accept` header.
## Section 04: Security Architecture

---

## Authentication Model

uReport uses **JWT-based stateless authentication** for the React SPA and staff clients, and **API key authentication** for Open311 write operations by external integrations.

### JWT Specification

| Parameter | Value |
|-----------|-------|
| Algorithm | HS256 (configurable to RS256 via `app.jwt.algorithm`) |
| Signing secret | Min 256-bit symmetric key (`app.jwt.secret`) |
| Access token expiry | 3600 seconds / 1 hour (configurable `app.jwt.expiry`) |
| Refresh token expiry | 86400 seconds / 24 hours (configurable `app.jwt.refreshExpiry`) |
| Issuer claim (`iss`) | `"ureport"` |
| Subject claim (`sub`) | `people.id` (integer, as string) |
| Role claim (`role`) | `"staff"` / `"public"` / `"anonymous"` |
| JTI claim (`jti`) | UUID v4 — used for blacklist on logout |

### JWT Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    JWT Authentication Flow                        │
│                                                                  │
│  Client          Spring API              PostgreSQL              │
│    │                  │                      │                   │
│    │─ POST /auth/login│                      │                   │
│    │  {username, pw}  │                      │                   │
│    │                  │── SELECT people ─────>│                  │
│    │                  │<── {id, role, hash} ──│                  │
│    │                  │  BCrypt.verify(pw,hash)                  │
│    │                  │── INSERT refresh_tokens ──>│             │
│    │<── {accessToken,  │                      │                  │
│    │    refreshToken}  │                      │                  │
│    │                  │                      │                   │
│    │─ GET /api/v1/... │                      │                   │
│    │  Bearer: <jwt>   │                      │                   │
│    │                  │  JwtAuthFilter:       │                   │
│    │                  │  1. Extract Bearer    │                   │
│    │                  │  2. Verify signature  │                   │
│    │                  │  3. Check expiry      │                   │
│    │                  │── SELECT token_blacklist WHERE jti=? ──>│ │
│    │                  │<── (not found = valid) ──│              │ │
│    │                  │  4. Set SecurityContext  │              │ │
│    │<── 200 OK ───────│                          │              │ │
│                                                                  │
│  On logout:                                                      │
│    │─ POST /auth/logout {refreshToken}                           │
│    │                  │── UPDATE refresh_tokens SET revoked=true  │
│    │                  │── INSERT token_blacklist (jti, expiresAt) │
│    │<── 200 OK ───────│                                           │
└──────────────────────────────────────────────────────────────────┘
```

### Refresh Token Rotation

Refresh tokens are **single-use**. On each call to `POST /api/v1/auth/refresh`:
1. The old refresh token is marked `revoked = true`
2. A new refresh token UUID is inserted
3. A new access token is issued with a fresh `jti`

This prevents refresh token reuse attacks.

### Token Blacklist Cleanup

The `AuditScheduler` (or a dedicated `TokenCleanupScheduler`) periodically removes expired entries from `token_blacklist` where `expiresAt < NOW()`. This prevents unbounded table growth.

---

## API Key Authentication (Open311)

External clients authenticate Open311 write operations with an `api_key` parameter. Keys are stored with **two hashes**:

| Column | Algorithm | Purpose |
|--------|-----------|---------|
| `clients.api_key_hash` | BCrypt (cost ≥ 10) | Secure storage — used for final verification |
| `clients.api_key_lookup` | SHA-256(rawKey) hex | Fast indexed lookup — avoids BCrypt scan of all rows |

**Validation process:**
```
1. Compute SHA-256(provided api_key) → lookup_hash
2. SELECT * FROM clients WHERE api_key_lookup = lookup_hash
3. If found: BCrypt.verify(api_key, clients.api_key_hash) → confirm match
4. If no match anywhere → HTTP 403 API_KEY_INVALID
```

The raw API key is **never stored** and is returned to the admin **once only** at creation time.

### Obsolete API Keys

A configurable list `app.open311.obsoleteApiKeys` contains deprecated key values. These are checked **before** the normal validation. If a match is found, the API returns a 200 OK shutdown notice JSON payload (no ticket created) as specified by the legacy system:
```json
{ "shutdown": true, "message": "<shutdown notice text>" }
```

---

## Authorization Model (RBAC)

### Permission Levels

| Level | Value | Who |
|-------|-------|-----|
| Anonymous | `0` | Unauthenticated requests (no JWT, no API key) |
| Public | `1` | Authenticated constituent (`people.role = 'public'`) |
| Staff | `2` | Authenticated municipality employee (`people.role = 'staff'`) |

**Hierarchy:** Staff ≥ Public ≥ Anonymous. A staff user can access anything a public user can.

### Spring Security Implementation

```java
// SecurityConfig.java (sketch)
@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        return http
            .csrf(csrf -> csrf.disable())   // SPA uses JWT, not cookies
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(apiKeyAuthFilter, JwtAuthFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**", "/callback").permitAll()
                .requestMatchers("/open311/**").permitAll()  // auth checked in controller
                .requestMatchers("/api/v1/contact-methods", "/api/v1/issue-types").permitAll()
                .anyRequest().authenticated()
            )
            .build();
    }
}
```

Fine-grained per-endpoint authorization uses `@PreAuthorize`:
```java
@PreAuthorize("hasRole('STAFF')")
public ResponseEntity<TicketResponse> closeTicket(...) { ... }
```

Per-category permission checks are evaluated in the service layer using `PermissionEvaluator.isAllowed(callerRole, categoryPermissionLevel)`.

### Permission Matrix Summary

| Operation | anonymous | public | staff |
|-----------|-----------|--------|-------|
| View category (anonymous-level) | ✓ | ✓ | ✓ |
| View category (public-level) | ✗ | ✓ | ✓ |
| View category (staff-level) | ✗ | ✗ | ✓ |
| Submit ticket (per category posting level) | per cat | per cat | ✓ |
| Assign / Close / Reopen ticket | ✗ | ✗ | ✓ |
| Export CSV / print | ✗ | ✗ | ✓ |
| View ticket history | ✗ | ✗ | ✓ |
| All admin operations | ✗ | ✗ | ✓ |
| Metrics / reports | ✗ | ✗ | ✓ |
| Open311 POST /requests | api_key + posting perm | api_key + posting perm | ✓ |

---

## Data Protection

### Password Storage
- Algorithm: **BCrypt** with cost factor ≥ 10
- Column: `people.passwordHash VARCHAR(255)`
- On creation/update: plain-text password is **never stored**; BCrypt hash is computed in `AuthService` before persistence

### API Key Storage
- Fast lookup hash: SHA-256(rawKey) stored in `clients.api_key_lookup`
- Secure storage hash: BCrypt(rawKey) stored in `clients.api_key_hash`
- Raw key returned **once** at client registration; not stored anywhere

### JWT Secret
- Stored in environment variable `APP_JWT_SECRET`
- Minimum 256 bits (32 bytes) for HS256
- Never logged or exposed in API responses

### Input Validation
- All request bodies validated with Bean Validation (`@Valid`, `@NotBlank`, `@Size`, etc.)
- SQL injection prevention: all queries use parameterized statements (Spring Data JPA / HibernateQL)
- `sortBy` whitelist in `TicketSearchService` prevents injection via sort parameter
- Keyword `q` passed through `websearch_to_tsquery()` which sanitizes FTS input

### Secrets Management

All sensitive values are injected via environment variables (Docker Compose `.env` file):

| Variable | Purpose |
|----------|---------|
| `DB_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | JWT signing key (≥ 32 chars) |
| `MAIL_HOST` / `MAIL_PORT` | SMTP configuration |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP credentials |

No secrets are committed to source control. A `.env.example` file documents required variables with placeholder values.

### File Upload Security
- Allowed MIME types enforced server-side (content-type header + magic byte detection)
- Internal filenames are UUIDs — no path traversal possible
- Files served via `GET /api/v1/media/{internalFilename}` — server validates internalFilename against `media` table before serving
- Thumbnail cache path is separate from upload storage; cache files are always JPEG (no executable upload)
- Maximum file size: 20MB (configurable `app.media.maxSizeMb`)

### HTTPS
- In production, Nginx terminates TLS. All traffic from clients to Nginx is HTTPS.
- Internal Docker network traffic (Nginx → API, API → DB) is plaintext on the Docker bridge — acceptable for single-host deployments. For multi-host, use Docker overlay network with encryption.

### CORS
- `WebMvcConfig` sets CORS allowed origins to the configured SPA origin (`app.cors.allowedOrigins`)
- `Authorization` header is in the allowed headers list
- Open311 endpoints allow `*` origins (public API)
## Section 05: Technology Stack

---

## Backend Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Runtime | Java | 21 LTS | JVM runtime; virtual threads available |
| Framework | Spring Boot | 3.x | Auto-configuration, REST, Scheduler, Security |
| Web / REST | Spring Web MVC | 6.x | REST controllers, content negotiation |
| Security | Spring Security | 6.x | Filter chain, method-level auth, JWT validation |
| JWT | JJWT (io.jsonwebtoken) | 0.12.x | JWT generation, parsing, validation |
| ORM | Spring Data JPA + Hibernate | 6.x | Entity mapping, repository pattern |
| DB Driver | PostgreSQL JDBC | 42.x | JDBC driver for PG 16 |
| Connection Pool | HikariCP | 5.x | High-performance JDBC connection pooling |
| Migration | Flyway | 10.x | Schema versioning; DDL in `db/migration/V*.sql` |
| Scheduling | Spring `@Scheduled` | — | Digest, auto-close, geo-cluster, audit jobs |
| Email | Spring Boot Mail (Jakarta Mail) | — | SMTP email dispatch for notifications |
| Image Processing | Thumbnailator | 0.4.x | Thumbnail generation (200×200px) |
| JSON | Jackson | 2.x | JSON serialization/deserialization |
| XML | Custom writer (no JAXB) | — | Byte-compatible Open311 XML output |
| CSV | Apache Commons CSV | 1.x | CSV export formatting |
| Build | Gradle (or Maven) | 8.x | Dependency management, packaging |
| Testing | JUnit 5 + Spring Boot Test | — | Unit + integration tests |
| Mocking | Mockito | 5.x | Service layer unit test mocking |
| HTTP Testing | MockMvc | — | Controller-level integration tests |
| Containerization | Docker | 24.x | Application container |

### Key Backend Dependency Justifications

- **Flyway** instead of Hibernate `ddl-auto=create`: Schema migrations are versioned SQL files, enabling safe production upgrades and testable migration scripts.
- **Thumbnailator** over ImageIO direct: simpler API, good quality, handles aspect ratio automatically.
- **Custom XML writer** (not JAXB): JAXB would require annotating DTOs; a manual writer can exactly replicate the legacy PHP Laminas XML template element names and structure, guaranteeing byte-compatibility.
- **HikariCP**: Default Spring Boot connection pool; fastest available for JDBC; pool size tuned to `DB_POOL_SIZE` env var (default 10).

---

## Frontend Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| UI Framework | React | 18.x | Component-based SPA |
| Language | TypeScript | 5.x | Type safety, IDE autocompletion |
| Build Tool | Vite | 5.x | Fast dev server, optimized production build |
| Routing | React Router | 6.x | Client-side SPA routing |
| HTTP Client | Axios | 1.x | REST API calls, interceptors for JWT refresh |
| State Management | Zustand | 4.x | Lightweight global state (auth, filters) |
| Form Handling | React Hook Form | 7.x | Ticket creation, people forms, dynamic customFields |
| Validation | Zod | 3.x | Schema validation for forms and API response types |
| Map | MapLibre GL JS | 3.x | Geo-cluster map view (open-source, no API key) |
| UI Components | shadcn/ui + Tailwind CSS | — | Accessible components, utility-first styling |
| Testing | Vitest + React Testing Library | — | Unit + component tests |
| Containerization | Nginx + Docker | — | Static asset serving + reverse proxy |

### Frontend Dependency Justifications

- **Vite over CRA**: Faster build times, native ESM dev server; CRA is deprecated.
- **Zustand over Redux**: Lower boilerplate for a CRM with mostly server-driven state; Redux overkill.
- **MapLibre over Leaflet**: Native WebGL rendering for geo-clusters at scale; no proprietary tile API key needed.
- **shadcn/ui**: Accessible, unstyled-by-default components composable with Tailwind; avoids opinionated MUI theming.

---

## Database Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| RDBMS | PostgreSQL | 16 | Primary data store |
| Spatial Extension | PostGIS | 3.4 | GEOGRAPHY types, ST_DWithin, ST_MakePoint, GiST indexes |
| Crypto Extension | pgcrypto | — | `gen_random_uuid()` for refresh token PKs |
| FTS | PostgreSQL native | — | `tsvector`, `tsquery`, `GIN` index on `tickets.search_vector` |
| Image | Docker: postgis/postgis | 16-3.4 | Official image with PostGIS pre-installed |

### FTS Configuration

```sql
-- FTS is configured for English:
to_tsvector('english', ...)
websearch_to_tsquery('english', ?)

-- Weight assignments:
-- 'A' = description (highest relevance)
-- 'B' = location
-- 'C' = city
-- 'D' = zip (lowest relevance)

-- ts_rank used for result ordering when keyword is provided
ORDER BY ts_rank(search_vector, websearch_to_tsquery('english', ?)) DESC
```

The FTS trigger runs `BEFORE INSERT OR UPDATE` to keep `search_vector` always current. No separate Solr indexing job is needed.

---

## Infrastructure Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Container Runtime | Docker 24.x | Container lifecycle |
| Orchestration | Docker Compose 3.9 | Multi-container local + single-host deployment |
| Reverse Proxy | Nginx 1.25 | Static asset serving, SSL termination, API proxy |
| Media Storage | Docker named volume `media` | Persistent file storage for uploads + thumbnails |
| DB Storage | Docker named volume `pgdata` | Persistent PostgreSQL data |
| SSL (optional) | Let's Encrypt + Certbot | TLS certificate for production domain |
| SMTP | Configurable SMTP relay | Outbound email for digest notifications |
| Dev SMTP | MailHog | Local email testing |

---

## Replaced Legacy Components

| Legacy | Replaced By | Notes |
|--------|------------|-------|
| PHP 8.x + Laminas MVC | Java 21 + Spring Boot 3.x | 1:1 feature parity |
| Apache 2.4 | Nginx (reverse proxy) + Spring Boot (app server) | |
| MySQL 8.x | PostgreSQL 16 | All DDL migrated; type mapping documented |
| Apache Solr 7.4 | PostgreSQL FTS (tsvector + GIN) | Eliminates Solr JVM process |
| PHP sessions | JWT + Spring Security | Stateless; supports SPA and API clients |
| PHP cron scripts | Spring `@Scheduled` | Same intervals, configurable via application.yml |
| PHPUnit | JUnit 5 + Spring Boot Test | ≥80% service layer coverage target |
| Ansible / Apache vhost | Docker Compose | Familiar operator interface |
| PHP Composer | Gradle (or Maven) | Java dependency management |

---

## Application Configuration (application.yml skeleton)

```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
    hikari:
      maximum-pool-size: ${DB_POOL_SIZE:10}
  jpa:
    hibernate:
      ddl-auto: validate      # Flyway manages schema; Hibernate only validates
    open-in-view: false
  flyway:
    enabled: true
    locations: classpath:db/migration
  mail:
    host: ${SPRING_MAIL_HOST}
    port: ${SPRING_MAIL_PORT:587}
    username: ${SPRING_MAIL_USERNAME}
    password: ${SPRING_MAIL_PASSWORD}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true

app:
  jwt:
    secret: ${APP_JWT_SECRET}
    algorithm: HS256
    expiry: 3600
    refreshExpiry: 86400
  media:
    path: ${APP_MEDIA_PATH:/app/media}
    maxSizeMb: 20
    allowedMimeTypes:
      - image/jpeg
      - image/png
      - image/gif
      - image/webp
      - application/pdf
      - text/plain
  mail:
    from: ${APP_MAIL_FROM:noreply@ureport.local}
    footer: ${APP_MAIL_FOOTER:"Sent by uReport"}
  scheduler:
    digestInterval: "0 */5 * * * *"       # every 5 minutes
    autoCloseInterval: "0 0 1 * * *"      # 1 AM daily
    geoClusterInterval: "0 0 2 * * *"     # 2 AM daily
    auditInterval: "0 0 3 * * SUN"        # 3 AM Sunday
  geo:
    clusterRadii:
      - 50000   # level 0: 50 km
      - 20000   # level 1: 20 km
      - 10000   # level 2: 10 km
      - 5000    # level 3: 5 km
      - 2000    # level 4: 2 km
      - 500     # level 5: 500 m
      - 100     # level 6: 100 m
  open311:
    jurisdictionId: ${OPEN311_JURISDICTION_ID:city.gov}
    endpointUrl: ${OPEN311_ENDPOINT_URL:https://city.gov/open311}
    obsoleteApiKeys: ${OPEN311_OBSOLETE_KEYS:}
    contact: ${OPEN311_CONTACT:help@city.gov}
    keyService: ${OPEN311_KEY_SERVICE:https://city.gov/open311/key}
  cors:
    allowedOrigins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000}
```
## Section 06: Integration Points & Search Architecture

---

## External Integration Inventory

### 1. Open311 GeoReport v2 — External Consumer Contract

**Direction:** Inbound — external municipality systems call uReport  
**Protocol:** HTTPS REST  
**Standard:** http://wiki.open311.org/GeoReport_v2  
**Auth:** None (read); `api_key` query param (write)

**Contract requirements:**
- Response field names, types, and structure must be **byte-compatible** with legacy PHP output
- JSON and XML formats both required
- Endpoint paths must match exactly:
  - `/open311/discovery`
  - `/open311/services`
  - `/open311/services/{service_code}`
  - `/open311/requests`
  - `/open311/requests/{service_request_id}`

**Validation approach:**
- Generate XML/JSON fixture files from legacy PHP system before cutover
- Automated byte-level diff tests run in CI against fixtures (NFR-1, NFR-9)
- `Open311XmlSerializer` uses manual XML writer (not JAXB) to match legacy element structure exactly

**Open311 → uReport field mapping:**
```
service_code         ← categories.id (as string)
service_request_id   ← tickets.id (as string)
status               ← tickets.status
status_notes         ← substatus.name
service_name         ← categories.name
description          ← tickets.description
agency_responsible   ← people.firstname + ' ' + people.lastname (assignedPerson)
requested_datetime   ← tickets.enteredDate (ISO 8601)
updated_datetime     ← tickets.lastModified (ISO 8601)
expected_datetime    ← tickets.enteredDate + category.slaDays days
lat                  ← tickets.latitude (as string)
long                 ← tickets.longitude (as string)
address              ← tickets.location
address_id           ← tickets.addressId (as string)
zipcode              ← tickets.zip
media_url            ← first media.url for the ticket
```

---

### 2. SMTP / Email Service

**Direction:** Outbound — uReport sends emails  
**Protocol:** SMTP (STARTTLS / TLS)  
**Used by:** F16 DigestNotificationScheduler  
**Library:** Spring Boot Mail (Jakarta Mail)

**Configuration:**
```yaml
spring.mail.host: ${SPRING_MAIL_HOST}
spring.mail.port: ${SPRING_MAIL_PORT:587}
spring.mail.username: ${SPRING_MAIL_USERNAME}
spring.mail.password: ${SPRING_MAIL_PASSWORD}
app.mail.from: noreply@ureport.local
```

**Email construction:**
- Subject: `[uReport] #{ticketId} - {categoryName} Update` (configurable)
- From: `app.mail.from`
- Reply-To: effective `replyEmail` (category_action_response > action > category.notificationReplyEmail)
- Body: rendered template text from `actions.template` with `{variable}` substitution

**Failure handling:** SMTP failures are logged at ERROR level. `ticketHistory.sentNotifications` is set to track which addresses were attempted. On failure, the entry is retried on the next scheduler cycle (since `sentNotifications` remains null until successful send).

---

### 3. OAuth / External Identity Provider (Optional)

**Direction:** Inbound callback — IdP redirects to uReport after auth  
**Protocol:** OAuth 2.0 Authorization Code flow  
**Endpoint:** `GET /callback?code={code}&state={csrf_state}`  
**Used by:** F04 (OAuth Callback)  

**Flow:**
```
1. User clicks SSO login → SPA redirects to IdP with state param
2. IdP authenticates user → redirects to /callback?code=...&state=...
3. CallbackController validates CSRF state
4. Exchanges code for IdP token (Spring OAuth2 client)
5. Extracts email from IdP token claims
6. Looks up people by email (must pre-exist — no auto-registration)
7. Issues local JWT + refresh token
8. Redirects SPA with tokens
```

**Configuration:** Spring Security OAuth2 client properties (configured for MSAL/Entra, Google, or generic OIDC provider).

---

### 4. AddressService Integration (Optional)

**Direction:** Outbound — uReport calls an external address validation service  
**Protocol:** HTTP REST  
**Used by:** F15 (Location/Address Management)  
**Condition:** Only invoked if `app.addressService.enabled = true` and `app.addressService.url` is configured

**Behavior:**
- On ticket creation with address fields, system calls AddressService with street + city + state + zip
- Response provides normalized address + `additionalFields` JSON blob
- System stores `additionalFields` on the ticket
- If AddressService is unavailable or not configured: ticket is created with raw unvalidated address (soft failure — logged, not rejected)

---

## Search Architecture (PostgreSQL FTS)

### Why PostgreSQL FTS Instead of Solr

| Concern | Solr 7.4 | PostgreSQL FTS |
|---------|----------|----------------|
| Infrastructure | Separate JVM process, dedicated ops | Same DB instance, zero extra ops |
| Indexing | External push to Solr | PostgreSQL trigger on INSERT/UPDATE |
| Sync risk | Tickets + Solr can diverge | Always consistent (same transaction) |
| Search quality | Very high (Lucene-based) | High for structured CRM data |
| Geo search | Solr spatial | PostGIS ST_DWithin (native) |
| Maintenance | Solr schema.xml, solrconfig.xml | Standard SQL; no separate config |

### FTS Index Architecture

```sql
-- On tickets table:
search_vector TSVECTOR       -- pre-computed, updated by trigger
-- GIN index for fast queries:
CREATE INDEX idx_tickets_fts ON tickets USING GIN (search_vector);

-- Trigger sets search_vector on every INSERT/UPDATE:
NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(description, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(city, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(zip, '')), 'D');
```

**Note:** Reporter name, assignee name, category name, and department name are **not** in the trigger (they come from joined tables). The `TicketSearchService` can perform a supplemental ILIKE search on people names when `q` matches name patterns, or a background job can refresh `search_vector` to include joined fields via a more complex trigger that queries the related tables.

### Search Query Generation (TicketSearchService)

```java
// Pseudo-code for parameterized query construction
StringBuilder sql = new StringBuilder(
    "SELECT t.* FROM tickets t " +
    "JOIN categories c ON t.category_id = c.id " +
    "LEFT JOIN substatus s ON t.substatus_id = s.id " +
    "WHERE t.status <> 'deleted' "   // soft-delete filter
);

if (params.q != null) {
    sql.append("AND t.search_vector @@ websearch_to_tsquery('english', ?) ");
}
if (params.status != null) {
    sql.append("AND t.status = ? ");
}
if (params.categoryId != null) {
    sql.append("AND t.category_id = ? ");
}
// ... other filters ...
if (params.lat != null && params.lng != null && params.radius != null) {
    sql.append(
        "AND ST_DWithin(t.geo_point, ST_MakePoint(?, ?)::geography, ?) "
    );
}

// Ordering:
if (params.q != null) {
    sql.append("ORDER BY ts_rank(t.search_vector, websearch_to_tsquery('english', ?)) DESC ");
} else {
    sql.append("ORDER BY t.enteredDate DESC ");
}

sql.append("LIMIT ? OFFSET ?");
```

### Geo-Cluster Architecture

```
Nightly GeoClusterScheduler:
  1. Query all tickets WHERE geo_point IS NOT NULL
  2. For each zoom level N in [0..6]:
     a. Group tickets using ST_DWithin clustering:
        - Level 0: radius 50,000m (50km)
        - Level 6: radius 100m
     b. For each cluster: compute center = ST_Centroid(ST_Collect(geo_points))
     c. Upsert geoclusters row with (level, center)
     d. Upsert ticket_geodata row with cluster_id_N for each ticket
  3. Log: levels processed, clusters created, tickets assigned

Map view query:
  SELECT g.id AS cluster_id,
         COUNT(tgd.ticket_id) AS count,
         ST_Y(g.center::geometry) AS lat,
         ST_X(g.center::geometry) AS long
  FROM ticket_geodata tgd
  JOIN geoclusters g ON tgd.cluster_id_{N} = g.id
  [+ same WHERE filters as ticket search]
  GROUP BY g.id, g.center
```

### Performance Targets

| Query Type | Target | Mechanism |
|------------|--------|-----------|
| FTS keyword search (100K tickets) | < 500ms | GIN index on `search_vector` |
| Status/category filter (500K tickets) | < 200ms | B-tree indexes on `status`, `category_id` |
| Date range filter | < 200ms | B-tree indexes on `enteredDate`, `closedDate` |
| Geo radius query | < 300ms | GiST index on `geo_point` via PostGIS |
| Map cluster query (zoom 3) | < 400ms | Indexes on `cluster_id_3` in `ticket_geodata` |

---

## CI/CD Integration Points

| Check | Tool | Trigger |
|-------|------|---------|
| Unit tests | JUnit 5 | Every PR |
| Integration tests | Spring Boot Test + Testcontainers | Every PR |
| Open311 fixture diff | Shell script (diff XML/JSON) | Every PR |
| Schema migration validation | Flyway `migrate` on test DB | Every PR |
| FTS equivalence test | Custom query corpus comparison | Weekly / pre-release |
| Docker build | Docker Compose `build` | Every PR |
| Coverage gate | JaCoCo ≥ 80% service layer | Every PR |
