# Technical Architecture Document
# uReport — Municipal CRM Modernization

**Project:** uReport  
**Acronym:** uReport  
**Version:** 1.0  
**Date:** 2026-06-23  
**Status:** Active  
**License:** AGPL-3.0  
**Based on:** PRD-uReport.md v1.0 · FRD-uReport.md v1.0

---

## Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [Component Architecture](#2-component-architecture)
3. [Data Model](#3-data-model)
4. [API Design](#4-api-design)
5. [Security Architecture](#5-security-architecture)
6. [Technology Stack](#6-technology-stack)
7. [Integration Points](#7-integration-points)

---

## 1. Architectural Overview

### 1.1 Architecture Pattern

uReport uses a **Decoupled Monolith** architecture: a single PHP 8.5 application serves both the preserved Open311 GeoReport v2 endpoint and a new RESTful JSON API backend, while a separate Next.js 15 SPA constitutes the frontend. This is a **brownfield incremental modernization** — not a rewrite. The existing MySQL schema, Apache Solr integration, OIDC authentication, Graylog logging, and GNU gettext i18n are all preserved.

**Key architectural decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend language | PHP 8.5 (thin controllers) | Avoids operational complexity of a second runtime; domain models preserved |
| Frontend | Next.js 15 (App Router) + TypeScript | SSR for public routes; SPA for staff UI; type-safe API contract via openapi-typescript |
| API style | REST at `/api/v1/` (new) + Open311 at `/open311/` (preserved) | Open311 endpoint frozen; internal API follows REST conventions |
| DB access | Repository pattern over PDO | Testable, typed; no full ORM overhead; existing schema preserved |
| Search | Apache Solr 9.x (preserved) | Proven geo-clustering and full-text; abstracted behind `SearchService` |
| Auth | OIDC authorization code flow → uReport session JWT | Staff SSO via city IdP; JWT in HttpOnly cookie for SPA |
| Deployment | Apache + Linux, Docker Compose, Ansible | Existing operators unchanged |

### 1.2 High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL CLIENTS                                │
│                                                                              │
│  ┌───────────────────┐  ┌─────────────────────┐  ┌────────────────────────┐ │
│  │  Browser (Staff / │  │  Open311 Mobile Apps │  │  External Dashboards   │ │
│  │  Citizen SPA)     │  │  & 3rd-party clients │  │  (SLA metrics API)     │ │
│  └─────────┬─────────┘  └──────────┬──────────┘  └──────────┬─────────────┘ │
└────────────┼────────────────────────┼────────────────────────┼──────────────┘
             │ HTTPS                  │ HTTPS                  │ HTTPS
             │                        │                        │
┌────────────▼────────────────────────▼────────────────────────▼──────────────┐
│                           Apache 2.4 + mod_proxy                             │
│           (SSL termination · HTTP security headers · CORS)                  │
│                                                                              │
│   /                  →  Next.js 15 (Node.js, port 3000)                     │
│   /api/              →  PHP 8.5 API layer (FPM, port 9000)                  │
│   /open311/          →  PHP 8.5 Open311 controller (FPM, port 9000)         │
│   /auth/             →  PHP 8.5 OIDC controller  (FPM, port 9000)          │
└──────────────────────────────────────────────────────────────────────────────┘
             │                        │
     ┌───────▼───────┐        ┌───────▼───────┐
     │  Next.js 15   │        │  PHP 8.5 API  │
     │  App Router   │        │  Application  │
     │               │        │               │
     │ ┌───────────┐ │        │ ┌───────────┐ │
     │ │  Pages /  │ │        │ │Controllers│ │
     │ │  Layouts  │ │        │ │(thin)     │ │
     │ └───────────┘ │        │ └─────┬─────┘ │
     │ ┌───────────┐ │        │       │       │
     │ │  API      │ │        │ ┌─────▼─────┐ │
     │ │  Routes   │ │        │ │Repository │ │
     │ │  (/auth/) │ │        │ │  Layer    │ │
     │ └─────┬─────┘ │        │ └─────┬─────┘ │
     └───────┼───────┘        └───────┼───────┘
             │  JSON/REST              │
             └────────────────────────┘
                      │  │  │
          ┌───────────┘  │  └─────────────────┐
          │              │                     │
  ┌───────▼──────┐  ┌────▼─────────┐  ┌───────▼──────────┐
  │  MySQL 8.x   │  │  Apache Solr │  │  Redis (optional) │
  │  (primary    │  │  9.x         │  │  (geocode cache / │
  │   datastore) │  │  (search +   │  │   metrics cache)  │
  │              │  │   geo-cluster│  │                   │
  └──────────────┘  └──────────────┘  └───────────────────┘
          │
  ┌───────▼──────────────────────────────────────────────┐
  │              External Services                        │
  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
  │  │  OIDC IdP    │  │  Geocoding   │  │  Graylog   │  │
  │  │  (Keycloak / │  │  Service     │  │  (GELF UDP)│  │
  │  │   Auth0/SSO) │  │  (Google /   │  │            │  │
  │  │              │  │   Nominatim) │  │            │  │
  │  └──────────────┘  └──────────────┘  └────────────┘  │
  └──────────────────────────────────────────────────────┘
```

### 1.3 Deployment Topology

#### Docker Compose (Development)

```
docker-compose.yml services:
  app         → PHP 8.5-FPM + Apache 2.4 (port 80)
  frontend    → Next.js 15 dev server (port 3000, proxied via Apache)
  db          → MySQL 8.x (port 3306)
  solr        → Apache Solr 9.x (port 8983)
  mailhog     → SMTP catch-all (port 1025 / UI 8025)
```

#### Production: Apache + Linux

```
┌─────────────────────────────────────────────────────────────┐
│  Linux host (Ubuntu 22.04+ / Debian 12+)                    │
│                                                             │
│  Apache 2.4                                                 │
│  ├── VirtualHost:443 (SSL, mod_ssl)                        │
│  │   ├── ProxyPass /api/ → php-fpm:9000 (via mod_proxy_fcgi│
│  │   ├── ProxyPass /open311/ → php-fpm:9000               │
│  │   ├── ProxyPass /auth/ → php-fpm:9000                  │
│  │   └── ProxyPass / → node:3000 (Next.js SSR)            │
│                                                             │
│  PHP 8.5-FPM (systemd)                                      │
│  Node.js 20 LTS + PM2 (Next.js production build)           │
│  MySQL 8.x (local or RDS)                                  │
│  Apache Solr 9.x (local or dedicated)                      │
└─────────────────────────────────────────────────────────────┘
```

#### Ansible

Ansible playbooks provision and configure all services above. No changes required to the existing playbook structure; new roles for `nodejs` and `nextjs` deployment added.

### 1.4 URL Routing Contract

| Path Prefix | Handler | Notes |
|-------------|---------|-------|
| `/open311/` | PHP 8.5 (preserved verbatim) | GeoReport v2; must not change |
| `/auth/` | PHP 8.5 OIDC controller | Login, callback, logout, me |
| `/api/` | PHP 8.5 REST API controllers | New JSON API layer |
| `/api/docs` | PHP Swagger UI | OpenAPI 3.1 spec viewer |
| `/api/openapi.json` | PHP | Raw OpenAPI 3.1 JSON |
| `/uploads/` | Apache static | File attachment serving |
| `/` (all others) | Next.js 15 (Node) | SPA + SSR pages |

---
## 2. Component Architecture

### 2.1 Backend Components (PHP 8.5)

```
src/
├── Controllers/
│   ├── Api/
│   │   ├── TicketController.php        # CRUD, assign, close, reopen, delete, merge
│   │   ├── TicketHistoryController.php # Action history endpoints
│   │   ├── TicketMediaController.php   # File upload / attachment CRUD
│   │   ├── SearchController.php        # GET /api/tickets (search + filters)
│   │   ├── GeoController.php           # Clusters, geocode utility
│   │   ├── ReportController.php        # 8 report types + metrics
│   │   ├── DepartmentController.php
│   │   ├── CategoryController.php
│   │   ├── CategoryGroupController.php
│   │   ├── PersonController.php
│   │   ├── ContactMethodController.php
│   │   ├── SubstatusController.php
│   │   ├── TemplateController.php
│   │   ├── ClientController.php
│   │   ├── BookmarkController.php
│   │   └── NotificationSettingsController.php
│   ├── Auth/
│   │   ├── LoginController.php         # OIDC redirect initiation
│   │   ├── CallbackController.php      # OIDC code exchange, JWT issuance
│   │   ├── LogoutController.php        # Session clear + OIDC logout
│   │   └── MeController.php            # Current user record
│   └── Open311/                        # PRESERVED — no modifications
│       ├── ServicesController.php
│       ├── RequestsController.php
│       └── DiscoveryController.php
│
├── Repositories/
│   ├── TicketRepository.php
│   ├── ActionRepository.php
│   ├── MediaRepository.php
│   ├── PersonRepository.php
│   ├── DepartmentRepository.php
│   ├── CategoryRepository.php
│   ├── SubstatusRepository.php
│   ├── ClientRepository.php
│   ├── BookmarkRepository.php
│   ├── TemplateRepository.php
│   └── NotificationLogRepository.php
│
├── Services/
│   ├── SearchService.php               # Wraps all Solr calls
│   ├── AddressService.php              # Geocoding abstraction
│   ├── NotificationService.php         # Email dispatch + template rendering
│   ├── SlaService.php                  # SLA computation
│   ├── TicketService.php               # Orchestration: create/close/merge
│   └── AuthService.php                 # JWT issuance/validation, OIDC exchange
│
├── Middleware/
│   ├── AuthMiddleware.php              # JWT extraction + person lookup
│   ├── RbacMiddleware.php              # Role enforcement
│   ├── ValidationMiddleware.php        # Request body validation
│   ├── SecurityHeadersMiddleware.php   # CSP, HSTS, X-Frame-Options
│   └── ErrorHandlerMiddleware.php      # 500 catch + Graylog forward
│
├── Domain/
│   ├── Ticket.php                      # Domain model
│   ├── Person.php
│   ├── Category.php
│   ├── Department.php
│   ├── Action.php
│   ├── Media.php
│   └── …
│
└── Infrastructure/
    ├── Database/
    │   └── PdoConnection.php           # PDO singleton + transaction helpers
    ├── Logging/
    │   └── GraylogHandler.php          # GELF UDP logger
    └── Cache/
        └── MetricsCache.php            # In-memory / Redis SLA cache
```

**Responsibilities:**

| Component | Responsibility |
|-----------|----------------|
| Controllers | HTTP request parsing, response formatting, delegates to Services/Repositories. No business logic. |
| Repositories | SQL execution via PDO; return typed Domain objects. No HTTP concerns. |
| Services | Business logic orchestration (multi-repository operations, Solr sync, email dispatch). |
| Middleware | Cross-cutting concerns applied to all `/api/` routes. |
| Domain | Plain PHP objects representing entities (no ActiveRecord). |

### 2.2 Frontend Components (Next.js 15)

```
frontend/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # Public homepage / submission portal
│   │   ├── submit/page.tsx             # Citizen ticket submission form
│   │   └── track/[id]/page.tsx         # Public ticket status tracking
│   ├── (staff)/
│   │   ├── dashboard/page.tsx          # Staff ticket queue
│   │   ├── tickets/
│   │   │   ├── page.tsx                # Ticket list + search
│   │   │   ├── new/page.tsx            # Staff ticket creation
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Ticket detail
│   │   │       └── edit/page.tsx       # Edit ticket fields
│   │   ├── map/page.tsx                # Map view
│   │   └── reports/
│   │       ├── page.tsx                # Reports dashboard
│   │       └── [type]/page.tsx         # Specific report
│   ├── (admin)/
│   │   ├── departments/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── people/page.tsx
│   │   ├── templates/page.tsx
│   │   ├── clients/page.tsx
│   │   └── substatuses/page.tsx
│   ├── auth/
│   │   ├── login/page.tsx              # OIDC login initiation
│   │   └── callback/route.ts           # Next.js API route: OIDC callback
│   └── layout.tsx
│
├── components/
│   ├── tickets/
│   │   ├── TicketList.tsx
│   │   ├── TicketCard.tsx
│   │   ├── TicketDetail.tsx
│   │   ├── TicketForm.tsx
│   │   ├── ActionHistory.tsx
│   │   ├── ResponseComposer.tsx        # Uses template picker
│   │   └── MergeDialog.tsx
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   ├── FilterPanel.tsx
│   │   └── BookmarkPanel.tsx
│   ├── map/
│   │   ├── TicketMap.tsx               # Map component (Leaflet/Mapbox)
│   │   └── ClusterLayer.tsx
│   ├── reports/
│   │   ├── ActivityChart.tsx
│   │   ├── SlaGauge.tsx
│   │   └── VolumeChart.tsx
│   ├── admin/
│   │   ├── DepartmentForm.tsx
│   │   ├── CategoryForm.tsx            # Includes custom fields editor
│   │   └── PersonForm.tsx
│   └── ui/                             # shadcn/ui + Radix UI primitives
│       ├── Button.tsx
│       ├── Dialog.tsx
│       ├── Form.tsx
│       ├── Select.tsx
│       └── …
│
├── lib/
│   ├── api/
│   │   ├── client.ts                   # Fetch wrapper (base URL, auth headers)
│   │   └── generated/                  # openapi-typescript generated types
│   ├── auth/
│   │   └── session.ts                  # Session JWT helpers (server-side)
│   ├── i18n/
│   │   └── messages/                   # next-intl message catalogs
│   └── utils/
│       ├── sla.ts                      # SLA date computations
│       └── validation.ts               # Zod schemas for form validation
│
└── middleware.ts                       # Next.js middleware: auth redirect guard
```

**Frontend rendering strategy:**

| Route type | Strategy | Rationale |
|------------|----------|-----------|
| `/`, `/submit`, `/track/[id]` | SSR (Next.js server components) | SEO + performance for public pages |
| `/dashboard`, `/tickets/*`, `/reports/*` | Client-side (React Client Components) | Staff UI requires real-time interactivity |
| `/admin/*` | Client-side | Admin forms are interaction-heavy |
| `/auth/*` | Next.js API Routes | OIDC callback runs server-side; never exposes secrets to browser |

---
## 3. Data Model

### 3.1 Entity Relationship Diagram

```
categoryGroups ──┐
                 │ groupId (nullable)
departments ─────┼──── categories ─────────────────────────────────────────┐
     │           │       │ defaultAssigneeId (nullable FK → people)         │
     │ defaultAssigneeId │                                                  │
     │           │       │                                                  │
   people ◄──────┴───────┘                                                  │
     │ id                                                                    │
     │◄──── contactMethods (1:many)                                          │
     │◄──── bookmarks (1:many)                                               │
     │                  ┌────────────── tickets ────────────────────────────┘
     │                  │  categoryId FK
     │ personId (assignee)    departmentId FK
     │ reporterPersonId       substatusId FK → substatus
     └──────────────────►     mergedIntoTicketId FK (self-ref)
                         │    apiClientId FK → clients
                         │
                         ├──── actions (1:many)
                         │       actorPersonId FK → people
                         │       actorClientId FK → clients
                         │
                         ├──── media (1:many)
                         │
                         ├──── ticket_geodata (1:1)
                         │
                         └──── notification_log (1:many)

substatus (standalone lookup table)
clients   (standalone lookup table)
templates (standalone lookup table)
sessions  (optional — for JWT revocation)
geoclusters (cache table — populated by Solr job)
```

### 3.2 Complete DDL — Core Tables

All tables: InnoDB engine, utf8mb4 charset, UTC timestamps.

#### Table: `departments`

```sql
CREATE TABLE departments (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name                VARCHAR(255) NOT NULL,
  defaultAssigneeId   INT UNSIGNED NULL,
  active              TINYINT(1) NOT NULL DEFAULT 1,
  createdAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_dept_name (name),
  INDEX idx_active (active),

  CONSTRAINT fk_dept_assignee FOREIGN KEY (defaultAssigneeId) REFERENCES people(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `categoryGroups`

```sql
CREATE TABLE categoryGroups (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL,
  sortOrder   INT UNSIGNED NOT NULL DEFAULT 0,
  active      TINYINT(1) NOT NULL DEFAULT 1,

  PRIMARY KEY (id),
  UNIQUE KEY uq_group_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `people`

```sql
CREATE TABLE people (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  firstName     VARCHAR(100) NOT NULL,
  lastName      VARCHAR(100) NOT NULL,
  role          ENUM('admin','staff','public') NOT NULL DEFAULT 'public',
  departmentId  INT UNSIGNED NULL,
  active        TINYINT(1) NOT NULL DEFAULT 1,
  oidcSubject   VARCHAR(255) NULL COMMENT 'OIDC sub claim — unique per provider',
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_oidc_subject (oidcSubject),
  INDEX idx_role (role),
  INDEX idx_active (active),
  INDEX idx_departmentId (departmentId),

  CONSTRAINT fk_people_department FOREIGN KEY (departmentId) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `contactMethods`

```sql
CREATE TABLE contactMethods (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  personId    INT UNSIGNED NOT NULL,
  type        ENUM('email','phone','address') NOT NULL,
  value       VARCHAR(500) NOT NULL,
  phoneType   ENUM('mobile','office','home') NULL,
  isPrimary   TINYINT(1) NOT NULL DEFAULT 0,
  label       VARCHAR(100) NULL,

  PRIMARY KEY (id),
  INDEX idx_personId (personId),
  INDEX idx_type_value (type, value(191)),

  CONSTRAINT fk_contact_person FOREIGN KEY (personId) REFERENCES people(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `categories`

```sql
CREATE TABLE categories (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name                VARCHAR(255) NOT NULL,
  departmentId        INT UNSIGNED NOT NULL,
  groupId             INT UNSIGNED NULL,
  slaDays             INT UNSIGNED NULL COMMENT 'NULL = no SLA configured',
  displayPermission   ENUM('public','staff','anonymous') NOT NULL DEFAULT 'public',
  postingPermission   ENUM('staff','public','anonymous') NOT NULL DEFAULT 'public',
  defaultAssigneeId   INT UNSIGNED NULL,
  autoCloseDays       INT UNSIGNED NULL DEFAULT 0 COMMENT '0 or NULL = disabled',
  active              TINYINT(1) NOT NULL DEFAULT 1,
  fields              JSON NULL COMMENT 'Array of custom field definition objects',
  createdAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_cat_name (name),
  INDEX idx_departmentId (departmentId),
  INDEX idx_groupId (groupId),
  INDEX idx_active (active),

  CONSTRAINT fk_cat_department FOREIGN KEY (departmentId) REFERENCES departments(id),
  CONSTRAINT fk_cat_group      FOREIGN KEY (groupId)      REFERENCES categoryGroups(id),
  CONSTRAINT fk_cat_assignee   FOREIGN KEY (defaultAssigneeId) REFERENCES people(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **`categories.fields` JSON schema** (array of custom field definition objects):
> ```json
> [
>   {
>     "code": "severity",
>     "label": "Severity Level",
>     "type": "select",
>     "required": false,
>     "options": ["low", "medium", "high", "critical"]
>   }
> ]
> ```

#### Table: `substatus`

```sql
CREATE TABLE substatus (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  label         VARCHAR(100) NOT NULL,
  primaryStatus ENUM('open','closed') NOT NULL,
  isDefault     TINYINT(1) NOT NULL DEFAULT 0,
  active        TINYINT(1) NOT NULL DEFAULT 1,
  sortOrder     INT UNSIGNED NOT NULL DEFAULT 0,
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_substatus_label_status (label, primaryStatus),
  INDEX idx_primaryStatus (primaryStatus),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `clients`

```sql
CREATE TABLE clients (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(255) NOT NULL,
  contactEmail  VARCHAR(255) NOT NULL,
  apiKeyHash    VARCHAR(255) NOT NULL COMMENT 'bcrypt(apiKey) — plain key never stored',
  apiKeyHint    VARCHAR(20)  NOT NULL COMMENT 'First 8 chars of plain key for display',
  notes         TEXT NULL,
  active        TINYINT(1) NOT NULL DEFAULT 1,
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_client_name (name),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **Security:** The plain-text API key is returned once on create/regenerate. Only `apiKeyHash` (bcrypt) is persisted. On Open311 validation, the provided key is hashed and compared with `apiKeyHash`.

#### Table: `tickets`

```sql
CREATE TABLE tickets (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title               VARCHAR(255) NOT NULL,
  description         TEXT NULL,
  status              ENUM('open','closed') NOT NULL DEFAULT 'open',
  datetimeOpened      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  datetimeClosed      DATETIME NULL,
  datetimeUpdated     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt           DATETIME NULL,

  -- Routing
  categoryId          INT UNSIGNED NOT NULL,
  departmentId        INT UNSIGNED NOT NULL,

  -- People references
  personId            INT UNSIGNED NULL COMMENT 'Assignee (staff)',
  reporterPersonId    INT UNSIGNED NULL COMMENT 'Registered reporter (nullable for anonymous)',

  -- Anonymous / Open311 reporter fields
  reporterName        VARCHAR(255) NULL,
  reporterEmail       VARCHAR(255) NULL,
  reporterPhone       VARCHAR(50)  NULL,

  -- Location (denormalized copy; authoritative copy in ticket_geodata)
  address             VARCHAR(500) NULL,
  lat                 DECIMAL(10,7) NULL,
  lng                 DECIMAL(10,7) NULL,

  -- State
  substatusId         INT UNSIGNED NULL,
  mergedIntoTicketId  INT UNSIGNED NULL COMMENT 'Self-referential FK for merge',

  -- Open311 client attribution
  apiClientId         INT UNSIGNED NULL,

  -- Category-specific custom field values
  customFields        JSON NULL,

  PRIMARY KEY (id),
  INDEX idx_status (status),
  INDEX idx_categoryId (categoryId),
  INDEX idx_departmentId (departmentId),
  INDEX idx_personId (personId),
  INDEX idx_reporterPersonId (reporterPersonId),
  INDEX idx_substatusId (substatusId),
  INDEX idx_datetimeOpened (datetimeOpened),
  INDEX idx_datetimeClosed (datetimeClosed),
  INDEX idx_deletedAt (deletedAt),
  INDEX idx_reporterEmail (reporterEmail),

  CONSTRAINT fk_tickets_category    FOREIGN KEY (categoryId)         REFERENCES categories(id),
  CONSTRAINT fk_tickets_department  FOREIGN KEY (departmentId)       REFERENCES departments(id),
  CONSTRAINT fk_tickets_assignee    FOREIGN KEY (personId)           REFERENCES people(id),
  CONSTRAINT fk_tickets_reporter    FOREIGN KEY (reporterPersonId)   REFERENCES people(id),
  CONSTRAINT fk_tickets_substatus   FOREIGN KEY (substatusId)        REFERENCES substatus(id),
  CONSTRAINT fk_tickets_merged      FOREIGN KEY (mergedIntoTicketId) REFERENCES tickets(id),
  CONSTRAINT fk_tickets_client      FOREIGN KEY (apiClientId)        REFERENCES clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `actions`

```sql
CREATE TABLE actions (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticketId        INT UNSIGNED NOT NULL,
  type            ENUM(
                    'open','assignment','closed','reopen',
                    'response','comment','upload',
                    'deleted','merged','substatus','notification_sent'
                  ) NOT NULL,
  visibility      ENUM('external','internal') NOT NULL DEFAULT 'internal',
  actorPersonId   INT UNSIGNED NULL,
  actorClientId   INT UNSIGNED NULL,
  datetimeCreated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payload         JSON NULL,

  PRIMARY KEY (id),
  INDEX idx_ticketId (ticketId),
  INDEX idx_type (type),
  INDEX idx_datetimeCreated (datetimeCreated),
  INDEX idx_actorPersonId (actorPersonId),

  CONSTRAINT fk_action_ticket FOREIGN KEY (ticketId)      REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_action_person FOREIGN KEY (actorPersonId) REFERENCES people(id),
  CONSTRAINT fk_action_client FOREIGN KEY (actorClientId) REFERENCES clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **Immutability:** No `UPDATE` or `DELETE` on `actions` is permitted. Enforce via application layer. Consider `BEFORE UPDATE` / `BEFORE DELETE` MySQL triggers that raise `SIGNAL SQLSTATE '45000'`.

#### Table: `media`

```sql
CREATE TABLE media (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticketId        INT UNSIGNED NOT NULL,
  filename        VARCHAR(255) NOT NULL COMMENT 'Stored filename on disk',
  originalName    VARCHAR(255) NULL      COMMENT 'Original filename from uploader',
  mimeType        VARCHAR(100) NOT NULL,
  size            INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'File size in bytes',
  path            VARCHAR(500) NOT NULL  COMMENT 'Relative path under upload root',
  thumbnailPath   VARCHAR(500) NULL,
  sourceUrl       VARCHAR(2048) NULL    COMMENT 'Open311 media_url reference (URL, not downloaded)',
  label           VARCHAR(255) NULL,
  deletedAt       DATETIME NULL,
  createdAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_ticketId (ticketId),
  INDEX idx_deletedAt (deletedAt),

  CONSTRAINT fk_media_ticket FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `ticket_geodata`

```sql
CREATE TABLE ticket_geodata (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticketId            INT UNSIGNED NOT NULL,
  lat                 DECIMAL(10,7) NULL,
  lng                 DECIMAL(10,7) NULL,
  address             VARCHAR(500) NULL,
  addressNormalized   VARCHAR(500) NULL COMMENT 'Canonical form returned by geocoder',
  geoStatus           ENUM('located','pending','failed') NOT NULL DEFAULT 'pending',
  updatedAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_geodata_ticket (ticketId),
  INDEX idx_lat_lng (lat, lng),
  INDEX idx_geoStatus (geoStatus),

  CONSTRAINT fk_geodata_ticket FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.3 Complete DDL — Supporting Tables

#### Table: `templates`

```sql
CREATE TABLE templates (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL,
  subject     VARCHAR(255) NULL,
  body        TEXT NOT NULL,
  slug        VARCHAR(50)  NULL UNIQUE COMMENT 'System templates only; null for user-created',
  active      TINYINT(1) NOT NULL DEFAULT 1,
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_template_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**System template seed data (slugs):**

| Slug | Purpose |
|------|---------|
| `ticket_created` | Confirmation to reporter on ticket creation |
| `ticket_assigned` | Notification to new assignee |
| `ticket_response` | Notification to reporter when staff posts a response |
| `ticket_closed` | Notification to reporter on closure |
| `ticket_merged` | Notification to reporter of merged (source) ticket |
| `digest_daily` | Daily digest email to department staff |

#### Table: `bookmarks`

```sql
CREATE TABLE bookmarks (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  personId    INT UNSIGNED NOT NULL,
  name        VARCHAR(100) NOT NULL,
  filterState JSON NOT NULL COMMENT 'Serialized search filter state (F04 params)',
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_bookmark_person_name (personId, name),
  INDEX idx_personId (personId),

  CONSTRAINT fk_bookmark_person FOREIGN KEY (personId) REFERENCES people(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `notification_log`

```sql
CREATE TABLE notification_log (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticketId        INT UNSIGNED NULL,
  templateSlug    VARCHAR(50) NOT NULL,
  recipientEmail  VARCHAR(255) NOT NULL,
  sentAt          DATETIME NULL,
  status          ENUM('sent','failed','skipped') NOT NULL DEFAULT 'sent',
  attemptCount    TINYINT UNSIGNED NOT NULL DEFAULT 1,
  errorMessage    TEXT NULL,
  createdAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_ticketId (ticketId),
  INDEX idx_recipientEmail (recipientEmail(191)),
  INDEX idx_sentAt (sentAt),
  INDEX idx_status (status),

  CONSTRAINT fk_notif_ticket FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `geoclusters`

```sql
CREATE TABLE geoclusters (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  lat         DECIMAL(10,7) NOT NULL,
  lng         DECIMAL(10,7) NOT NULL,
  zoom        TINYINT UNSIGNED NOT NULL COMMENT 'Map zoom level 1–20',
  count       INT UNSIGNED NOT NULL DEFAULT 0,
  updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_lat_lng_zoom (lat, lng, zoom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **Note:** `geoclusters` is a pre-computed cache table populated by a Solr spatial heatmap job. It can be fully rebuilt from Solr at any time.

#### Table: `sessions` (optional — server-side JWT revocation)

```sql
CREATE TABLE sessions (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  personId    INT UNSIGNED NOT NULL,
  jwtJti      VARCHAR(255) NOT NULL UNIQUE COMMENT 'JWT jti claim — used for revocation',
  expiresAt   DATETIME NOT NULL,
  revokedAt   DATETIME NULL,
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_personId (personId),
  INDEX idx_jwtJti (jwtJti),
  INDEX idx_expiresAt (expiresAt),

  CONSTRAINT fk_session_person FOREIGN KEY (personId) REFERENCES people(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.4 Schema Migration Notes

- All schema changes are delivered as versioned **Phinx** migration scripts under `db/migrations/`.
- `tickets.mergedIntoTicketId` is a new column — migration adds it with `DEFAULT NULL`.
- `people.oidcSubject` may already exist in some legacy deployments — migration checks with `IF NOT EXISTS`.
- `clients.apiKeyHash` replaces any plain-text `apiKey` column — migration hashes existing keys with bcrypt and adds `apiKeyHint`.
- `categories.fields` JSON column is additive — existing rows default to `NULL` (treated as no custom fields).
- `templates`, `sessions`, `notification_log` are new tables — additive, no existing data affected.
- Legacy `ticketHistory` table (if named differently) is aliased or renamed to `actions` via migration.

---
## 4. API Design

### 4.1 API Surface Overview

| Prefix | Handler | Purpose |
|--------|---------|---------|
| `/api/` | PHP 8.5 REST controllers | New internal JSON API |
| `/open311/` | PHP 8.5 (preserved) | GeoReport v2 compliance |
| `/auth/` | PHP 8.5 OIDC controllers | Session management |

**JSON Envelope (all `/api/` responses):**
```json
{
  "data": any,
  "meta": { "page": 1, "perPage": 25, "total": 342, "pages": 14 },
  "errors": []
}
```

**HTTP Status Code Contract:**

| Status | Meaning |
|--------|---------|
| 200 OK | Successful read or update |
| 201 Created | Resource created |
| 204 No Content | Successful delete |
| 400 Bad Request | Malformed JSON or invalid params |
| 401 Unauthorized | Missing or invalid session |
| 403 Forbidden | Role insufficient |
| 404 Not Found | Resource not found |
| 409 Conflict | State conflict (double-close, self-merge) |
| 413 Payload Too Large | Upload or export exceeds limit |
| 422 Unprocessable Entity | Validation failure (field-level errors) |
| 500 Internal Server Error | Unhandled exception |
| 503 Service Unavailable | MySQL/Solr/IdP unavailable |

---

### 4.2 TypeScript Interfaces

Generated from the OpenAPI 3.1 spec via `openapi-typescript` during the frontend build. The following are the canonical source shapes.

```typescript
// ─── Shared ──────────────────────────────────────────────────────────────────

export type Role = 'admin' | 'staff' | 'public';
export type TicketStatus = 'open' | 'closed';
export type DisplayPermission = 'public' | 'staff' | 'anonymous';
export type PostingPermission = 'staff' | 'public' | 'anonymous';
export type ActionType =
  | 'open' | 'assignment' | 'closed' | 'reopen'
  | 'response' | 'comment' | 'upload'
  | 'deleted' | 'merged' | 'substatus' | 'notification_sent';
export type ContactMethodType = 'email' | 'phone' | 'address';
export type PhoneType = 'mobile' | 'office' | 'home';
export type GeoStatus = 'located' | 'pending' | 'failed';

export interface ApiEnvelope<T> {
  data: T;
  meta: PaginationMeta;
  errors: ApiError[];
}

export interface PaginationMeta {
  page?: number;
  perPage?: number;
  total?: number;
  pages?: number;
  facets?: Record<string, Record<string, number>>;
}

export interface ApiError {
  field: string | null;
  message: string;
  code?: string;
}

// ─── Ticket ──────────────────────────────────────────────────────────────────

export interface Ticket {
  id: number;
  title: string;
  description: string | null;
  status: TicketStatus;
  substatus: SubstatusRef | null;
  category: CategoryRef;
  department: DepartmentRef;
  assignee: PersonRef | null;
  reporter: ReporterInfo;
  address: string | null;
  lat: number | null;
  lng: number | null;
  customFields: Record<string, unknown> | null;
  sla: SlaInfo | null;
  datetimeOpened: string;   // ISO 8601
  datetimeClosed: string | null;
  datetimeUpdated: string;
  mergedIntoTicketId: number | null;
  deletedAt: string | null;
}

export interface SlaInfo {
  slaDays: number | null;
  expectedCloseDate: string | null;  // ISO 8601 date
  status: 'on_time' | 'late' | 'no_sla';
  pctElapsed: number | null;         // 0–100+
}

export interface ReporterInfo {
  personId: number | null;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface CategoryRef {
  id: number;
  name: string;
}

export interface DepartmentRef {
  id: number;
  name: string;
}

export interface PersonRef {
  id: number;
  name: string;
}

export interface SubstatusRef {
  id: number;
  label: string;
  primaryStatus: TicketStatus;
}

// ─── Create/Update Request Bodies ────────────────────────────────────────────

export interface CreateTicketBody {
  title: string;
  description?: string;
  categoryId: number;
  lat?: number;
  lng?: number;
  address?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
  customFields?: Record<string, unknown>;
  mediaUrls?: string[];
}

export interface UpdateTicketBody {
  title?: string;
  description?: string;
  categoryId?: number;
  address?: string;
  lat?: number;
  lng?: number;
  customFields?: Record<string, unknown>;
  substatusId?: number | null;
}

export interface AssignTicketBody {
  assigneeId?: number | null;
  departmentId?: number;
}

export interface CloseTicketBody {
  response?: string;
}

export interface ReopenTicketBody {
  reason: string;
}

export interface MergeTicketBody {
  targetTicketId: number;
}

export interface PostResponseBody {
  body: string;
  templateId?: number;
}

export interface PostCommentBody {
  body: string;
}

// ─── Action / History ────────────────────────────────────────────────────────

export interface Action {
  id: number;
  ticketId: number;
  type: ActionType;
  visibility: 'external' | 'internal';
  actor: ActorInfo;
  datetimeCreated: string;
  payload: Record<string, unknown> | null;
}

export interface ActorInfo {
  id: number;
  name: string;
  type: 'person' | 'client';
}

// ─── Media ───────────────────────────────────────────────────────────────────

export interface Media {
  id: number;
  ticketId: number;
  filename: string;
  originalName: string | null;
  mimeType: string;
  size: number;
  isImage: boolean;
  thumbnailUrl: string | null;
  downloadUrl: string;
  label: string | null;
  sourceUrl: string | null;
  createdAt: string;
}

// ─── GeoCluster ──────────────────────────────────────────────────────────────

export interface GeoCluster {
  lat: number;
  lng: number;
  count: number;
  zoom: number;
}

// ─── Department ──────────────────────────────────────────────────────────────

export interface Department {
  id: number;
  name: string;
  defaultAssignee: PersonRef | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentBody {
  name: string;
  defaultAssigneeId?: number | null;
  active?: boolean;
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface CategoryField {
  code: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'checkbox';
  required: boolean;
  options?: string[];
}

export interface Category {
  id: number;
  name: string;
  departmentId: number;
  groupId: number | null;
  slaDays: number | null;
  displayPermission: DisplayPermission;
  postingPermission: PostingPermission;
  defaultAssigneeId: number | null;
  autoCloseDays: number | null;
  active: boolean;
  fields: CategoryField[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryBody {
  name: string;
  departmentId: number;
  groupId?: number;
  slaDays?: number;
  displayPermission: DisplayPermission;
  postingPermission: PostingPermission;
  defaultAssigneeId?: number;
  autoCloseDays?: number;
  active?: boolean;
  fields?: CategoryField[];
}

// ─── CategoryGroup ───────────────────────────────────────────────────────────

export interface CategoryGroup {
  id: number;
  name: string;
  sortOrder: number;
  active: boolean;
}

// ─── Person ──────────────────────────────────────────────────────────────────

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  role: Role;
  departmentId: number | null;
  active: boolean;
  oidcSubject: string | null;
  contactMethods: ContactMethod[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonBody {
  firstName: string;
  lastName: string;
  role: Role;
  departmentId?: number;
  active?: boolean;
  oidcSubject?: string;
}

export interface ContactMethod {
  id: number;
  personId: number;
  type: ContactMethodType;
  value: string;
  phoneType: PhoneType | null;
  isPrimary: boolean;
  label: string | null;
}

export interface CreateContactMethodBody {
  type: ContactMethodType;
  value: string;
  phoneType?: PhoneType;
  isPrimary?: boolean;
  label?: string;
}

// ─── Substatus ───────────────────────────────────────────────────────────────

export interface Substatus {
  id: number;
  label: string;
  primaryStatus: TicketStatus;
  isDefault: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CreateSubstatusBody {
  label: string;
  primaryStatus: TicketStatus;
  isDefault?: boolean;
  active?: boolean;
  sortOrder?: number;
}

// ─── Template ────────────────────────────────────────────────────────────────

export interface Template {
  id: number;
  name: string;
  subject: string | null;
  body: string;
  slug: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateBody {
  name: string;
  subject?: string;
  body: string;
  active?: boolean;
}

// ─── API Client ──────────────────────────────────────────────────────────────

export interface ApiClient {
  id: number;
  name: string;
  contactEmail: string;
  apiKeyHint: string;    // First 8 chars + "…" for display
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiClientWithKey extends ApiClient {
  apiKey: string;        // Full key — only returned on create / regenerate
}

export interface CreateApiClientBody {
  name: string;
  contactEmail: string;
  notes?: string;
}

// ─── Bookmark ────────────────────────────────────────────────────────────────

export interface Bookmark {
  id: number;
  personId: number;
  name: string;
  filterState: TicketSearchParams;
  createdAt: string;
}

export interface CreateBookmarkBody {
  name: string;
  filterState: TicketSearchParams;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface TicketSearchParams {
  q?: string;
  status?: TicketStatus;
  substatusId?: number;
  categoryId?: number | number[];
  departmentId?: number | number[];
  assigneeId?: number;
  reporterEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  bbox?: string;
  sort?: 'date_desc' | 'date_asc' | 'sla_asc' | 'assignee' | 'category';
  page?: number;
  perPage?: number;
  export?: 'csv';
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface CurrentUser {
  id: number;
  firstName: string;
  lastName: string;
  role: Role;
  department: DepartmentRef | null;
  primaryEmail: string | null;
}

// ─── Reporting ───────────────────────────────────────────────────────────────

export interface SlaMetric {
  categoryId: number;
  categoryName: string;
  totalClosed: number;
  onTime: number;
  late: number;
  onTimePct: number;
}

export interface ActivityReport {
  period: { from: string; to: string };
  totalOpened: number;
  totalClosed: number;
  openAtPeriodEnd: number;
  byDay: Array<{ date: string; opened: number; closed: number }>;
}

export interface AssignmentReport {
  assigneeId: number;
  assigneeName: string;
  open: number;
  closed: number;
  avgDaysToClose: number | null;
}
```

---

### 4.3 Endpoint Reference

#### Tickets

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/tickets` | Any (role-checked) | Create ticket |
| GET | `/api/tickets` | Any (role-filtered) | Search/list tickets + filters |
| GET | `/api/tickets?export=csv` | staff/admin | CSV export of search results |
| GET | `/api/tickets/{id}` | Any (visibility-checked) | Get ticket detail |
| PUT | `/api/tickets/{id}` | staff/admin | Update ticket fields |
| DELETE | `/api/tickets/{id}` | admin | Soft-delete ticket |
| POST | `/api/tickets/{id}/assign` | staff/admin | Assign to dept/staff |
| POST | `/api/tickets/{id}/close` | staff/admin | Close with optional response |
| POST | `/api/tickets/{id}/reopen` | staff/admin | Reopen with required reason |
| POST | `/api/tickets/{id}/responses` | staff/admin | Post external response |
| POST | `/api/tickets/{id}/comments` | staff/admin | Post internal comment |
| POST | `/api/tickets/{id}/merge` | staff/admin | Merge into target ticket |
| GET | `/api/tickets/{id}/merge-candidates` | staff/admin | Search valid merge targets |
| GET | `/api/tickets/{id}/history` | Any (filtered) | Ticket action history |
| GET | `/api/tickets/{id}/media` | Any (visibility-checked) | List attachments |
| POST | `/api/tickets/{id}/media` | Any (role-checked) | Upload attachment |
| GET | `/api/tickets/{id}/media/{mediaId}` | Any (visibility-checked) | Get attachment metadata |
| DELETE | `/api/tickets/{id}/media/{mediaId}` | staff/admin | Soft-delete attachment |

#### Search & Geo

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tickets/clusters` | Any (role-filtered) | Geo-cluster data for map |
| GET | `/api/geocode` | staff | Geocode address string (map picker utility) |
| GET | `/api/tickets/{id}/location` | Any (visibility-checked) | Get ticket geodata |

#### Reporting

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reports/activity` | staff/admin | Activity report (tickets by period) |
| GET | `/api/reports/assignments` | staff/admin | Per-assignee ticket counts |
| GET | `/api/reports/categories` | staff/admin | Category volume + SLA rates |
| GET | `/api/reports/departments` | staff/admin | Department volume + resolution |
| GET | `/api/reports/staff-performance` | staff/admin | Per-staff response times |
| GET | `/api/reports/sla` | staff/admin | SLA on-time/late breakdown |
| GET | `/api/reports/volume` | staff/admin | Daily/weekly/monthly trends |
| GET | `/api/reports/open-age` | staff/admin | Tickets open past SLA |
| GET | `/api/metrics/sla` | Public | Lightweight SLA % (cached 5 min) |

#### Departments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/departments` | staff/admin | List departments |
| POST | `/api/departments` | admin | Create department |
| GET | `/api/departments/{id}` | staff/admin | Get department detail |
| PUT | `/api/departments/{id}` | admin | Update department |
| DELETE | `/api/departments/{id}` | admin | Deactivate department |

#### Categories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/categories` | Any (active public cats visible to all) | List categories |
| POST | `/api/categories` | admin | Create category |
| GET | `/api/categories/{id}` | Any (visibility-checked) | Get category detail |
| PUT | `/api/categories/{id}` | admin | Update category |
| DELETE | `/api/categories/{id}` | admin | Deactivate category |
| GET | `/api/category-groups` | Any | List category groups |
| POST | `/api/category-groups` | admin | Create category group |
| PUT | `/api/category-groups/{id}` | admin | Update category group |
| DELETE | `/api/category-groups/{id}` | admin | Delete category group |

#### People

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/people` | staff/admin | List/search people |
| POST | `/api/people` | admin | Create person |
| GET | `/api/people/{id}` | staff/admin | Get person detail |
| PUT | `/api/people/{id}` | admin | Update person |
| DELETE | `/api/people/{id}` | admin | Deactivate person |
| GET | `/api/people/{id}/contact-methods` | staff/admin | List contact methods |
| POST | `/api/people/{id}/contact-methods` | admin | Add contact method |
| PUT | `/api/people/{id}/contact-methods/{cmId}` | admin | Update contact method |
| DELETE | `/api/people/{id}/contact-methods/{cmId}` | admin | Remove contact method |

#### Substatuses

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/substatuses` | staff/admin | List substatuses |
| POST | `/api/substatuses` | admin | Create substatus |
| GET | `/api/substatuses/{id}` | staff/admin | Get substatus |
| PUT | `/api/substatuses/{id}` | admin | Update substatus |
| DELETE | `/api/substatuses/{id}` | admin | Deactivate substatus |

#### Templates

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/templates` | staff/admin | List active templates |
| POST | `/api/templates` | admin | Create template |
| GET | `/api/templates/{id}` | staff/admin | Get template |
| PUT | `/api/templates/{id}` | admin | Update template |
| DELETE | `/api/templates/{id}` | admin | Delete (non-system only) |

#### API Clients

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/clients` | admin | List all clients |
| POST | `/api/clients` | admin | Create client (returns key once) |
| GET | `/api/clients/{id}` | admin | Get client detail (key hint only) |
| PUT | `/api/clients/{id}` | admin | Update name/contact/notes |
| DELETE | `/api/clients/{id}` | admin | Deactivate client |
| POST | `/api/clients/{id}/regenerate-key` | admin | Regenerate API key |

#### Bookmarks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/bookmarks` | staff/admin | List current user's bookmarks |
| POST | `/api/bookmarks` | staff/admin | Create bookmark |
| GET | `/api/bookmarks/{id}` | staff/admin | Get bookmark + filterState |
| DELETE | `/api/bookmarks/{id}` | staff/admin | Delete bookmark |

#### Notification Settings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications/settings` | admin | Get notification/SMTP settings |
| PUT | `/api/notifications/settings` | admin | Update digest frequency |

#### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auth/login` | None | Initiate OIDC authorization code flow |
| GET | `/auth/callback` | None | Handle OIDC callback; issue session cookie |
| POST | `/auth/logout` | session | Clear session; redirect to OIDC logout |
| GET | `/auth/me` | session | Return current user person record + role |

#### OpenAPI Documentation

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/docs` | staff | Swagger UI HTML page |
| GET | `/api/openapi.json` | staff | OpenAPI 3.1 JSON spec |
| GET | `/api/openapi.yaml` | staff | OpenAPI 3.1 YAML spec |

#### Open311 (Preserved Verbatim)

| Method | Path | Auth | Format |
|--------|------|------|--------|
| GET | `/open311/discovery` | None | JSON, XML |
| GET | `/open311/services` | None | JSON, XML |
| GET | `/open311/services/{service_code}` | None | JSON, XML |
| POST | `/open311/requests` | API key (optional) | JSON, XML |
| GET | `/open311/requests` | API key (optional) | JSON, XML |
| GET | `/open311/requests/{service_request_id}` | API key (optional) | JSON, XML |

> **Open311 preservation guarantee:** Paths, parameters, and response shapes under `/open311/` are frozen. No external clients require code changes after the modernization.

---
## 5. Security Architecture

### 5.1 Authentication Flow

```
   Browser                 Next.js                PHP API               OIDC IdP
      │                       │                       │                      │
      │  GET /login            │                       │                      │
      ├──────────────────────►│                       │                      │
      │                       │  GET /auth/login       │                      │
      │                       ├──────────────────────►│                      │
      │                       │  302 → IdP auth URL    │                      │
      │◄──────────────────────┤◄──────────────────────┤                      │
      │                       │                       │                      │
      │  Authenticate with IdP                                               │
      ├────────────────────────────────────────────────────────────────────►│
      │◄────────────────────────────────────────────────────────────────────┤
      │  302 /auth/callback?code=…&state=…            │                      │
      │                       │                       │                      │
      │  GET /auth/callback   │                       │                      │
      ├──────────────────────►│                       │                      │
      │                       │  POST /auth/callback   │                      │
      │                       ├──────────────────────►│                      │
      │                       │  (code, state)         │  POST token endpoint │
      │                       │                       ├────────────────────►│
      │                       │                       │◄────────────────────┤
      │                       │                       │  id_token, access_token
      │                       │                       │                      │
      │                       │                       │  Validate id_token    │
      │                       │                       │  Lookup/create person │
      │                       │                       │  Issue session JWT    │
      │                       │◄──────────────────────┤                      │
      │  Set-Cookie: ureport_session (HttpOnly)       │                      │
      │◄──────────────────────┤                       │                      │
      │  302 /dashboard       │                       │                      │
```

### 5.2 Session JWT

**Issued by:** PHP `AuthService::issueJwt()` after successful OIDC code exchange.

**Payload:**
```json
{
  "iss": "ureport",
  "sub": 5,
  "role": "staff",
  "jti": "uuid-v4-for-revocation",
  "iat": 1750000000,
  "exp": 1750028800
}
```

**Storage:** HttpOnly, Secure, SameSite=Lax cookie named `ureport_session`. Never in `localStorage`.

**Signing:** HMAC-SHA256 with `JWT_SECRET` (min 32 bytes, configured in `site_config.php`).

**Validation on every API request:**
1. Extract JWT from `ureport_session` cookie OR `Authorization: Bearer <token>` header.
2. Verify HMAC signature.
3. Check `exp` not expired.
4. Load `people` record from DB: confirm `active = true` and retrieve current `role`.
5. *(Optional, if `sessions` table enabled)* Check `sessions.revokedAt IS NULL` for `jti`.
6. Set caller context `(personId, role)` for downstream controllers.

**Session TTL:** Configurable via `SESSION_TTL` constant (default: 28800 seconds / 8 hours).

### 5.3 Role-Based Access Control

**Role hierarchy:** `admin` > `staff` > `public` > `anonymous`.

**Role storage:** `people.role` column — JWT role claim is cross-validated against this column on every request. A stale JWT with an outdated role will be corrected at the DB lookup step.

**Category-level permissions (second dimension):**

| Category Setting | `anonymous` | `public` | `staff` | `admin` |
|-----------------|:-----------:|:--------:|:-------:|:-------:|
| `displayPermission=anonymous` | ✓ | ✓ | ✓ | ✓ |
| `displayPermission=public` | ✓ | ✓ | ✓ | ✓ |
| `displayPermission=staff` | ✗ | ✗ | ✓ | ✓ |
| `postingPermission=anonymous` | ✓ | ✓ | ✓ | ✓ |
| `postingPermission=public` | ✗ | ✓ | ✓ | ✓ |
| `postingPermission=staff` | ✗ | ✗ | ✓ | ✓ |

**Open311 authorization:** API key (`api_key` parameter) validated against `clients.apiKeyHash`. No JWT required. Missing key is not an error for public categories — ticket is attributed as anonymous.

### 5.4 HTTP Security Headers

Applied by `SecurityHeadersMiddleware` to all responses from the PHP API and by Apache for the Next.js proxy:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
```

> **Note:** `geolocation=(self)` allows the SPA map picker to access the browser's geolocation API for address lookup.

### 5.5 Input Validation & Injection Prevention

- All SQL executed via **PDO prepared statements with bound parameters** — no raw string interpolation. Repository layer enforces this; controllers never construct SQL.
- All user-supplied HTML/text output is **escaped at render time** in Next.js (React auto-escapes JSX expressions).
- Full-text search query (`q`) has HTML and script tags stripped before passing to Solr's query parser.
- MIME type validation on file uploads uses `finfo_file()` (reads magic bytes), not just the `Content-Type` header.
- File upload paths are validated to prevent path traversal (stored under `UPLOAD_ROOT`; filenames are UUID-based, not user-supplied).

### 5.6 CSRF Protection

- **SPA** (Next.js): SameSite=Lax cookie provides primary CSRF protection. State-mutating API routes additionally require the `X-Requested-With: XMLHttpRequest` header (double-submit pattern).
- **OIDC callback**: `state` nonce stored in a pre-login session (PHP `$_SESSION` or signed cookie); validated on callback to prevent CSRF in the OAuth flow.

### 5.7 API Key Security

- API keys are cryptographically random (UUID v4 format).
- Only `apiKeyHash` (bcrypt, cost ≥ 12) is stored in the `clients` table.
- The plain-text key is returned **once** — on create (`POST /api/clients`) and on regenerate (`POST /api/clients/{id}/regenerate-key`). All other `GET` responses return only `apiKeyHint` (first 8 chars + "…").
- On Open311 validation, the provided `api_key` is hashed and compared with the stored `apiKeyHash`.

### 5.8 Data Protection

| Concern | Approach |
|---------|---------|
| Passwords | No local passwords — authentication is OIDC-only |
| API keys | bcrypt hash stored; plain key ephemeral |
| JWT secrets | `JWT_SECRET` in `site_config.php`; excluded from VCS |
| OIDC client secret | `OIDC_CLIENT_SECRET` in `site_config.php`; excluded from VCS |
| SMTP credentials | `SMTP_PASS` in `site_config.php`; excluded from VCS |
| PII (reporter email) | Stored in `tickets.reporterEmail`; accessible only to staff/admin via API |
| File uploads | Stored under `UPLOAD_ROOT` (outside web root); served via Apache with access controls |
| SQL injection | PDO prepared statements throughout; no raw SQL in controllers |
| XSS | React auto-escaping; server-side strip of HTML from user text fields |
| Log data | Graylog logs structured events; PII minimized (ticket IDs, not raw emails, in default log fields) |

### 5.9 Dependency Security

- `license-checker` runs in CI to detect GPL-incompatible or unacceptable licenses.
- `composer audit` and `npm audit` run on every PR to flag known vulnerabilities.
- PHPStan at level 8+ enforced in CI — catches type-unsafe patterns before they reach production.
- TypeScript strict mode (`noImplicitAny`, `strictNullChecks`) enforced on frontend build.

---
## 6. Technology Stack

### 6.1 Backend

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Language | PHP | 8.5 | API layer + Open311 controllers |
| HTTP Server | Apache httpd | 2.4 | Reverse proxy, SSL termination, static files |
| PHP Process Manager | PHP-FPM | 8.5 | FastCGI process management |
| Autoloading | Composer (PSR-4) | 2.x | Dependency management |
| Database driver | PDO + PDO_MySQL | bundled | Parameterized queries |
| DB migration | Phinx | ^1.4 | Versioned MySQL schema migrations |
| OIDC client | facile-it/php-openid-client | ^3.x | OIDC authorization code flow |
| JWT library | firebase/php-jwt | ^6.x | Session JWT issuance/validation |
| Mailer | PHPMailer | ^6.x | SMTP email dispatch |
| HTTP client | Guzzle | ^7.x | Solr + geocoding + OIDC token requests |
| Logging | monolog/monolog | ^3.x | Structured logging + Graylog GELF handler |
| Code analysis | phpstan/phpstan | ^1.x | Static analysis at level 8+ |
| Testing | PHPUnit | ^11.x | Unit + integration tests |
| i18n | GNU gettext | system | `.po`/`.mo` locale files |

### 6.2 Frontend

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | Next.js | 15.x (App Router) | SSR/SSG + client-side SPA |
| Language | TypeScript | 5.x | Strict type safety |
| Runtime | Node.js | 20 LTS | Next.js production server |
| Process manager | PM2 | ^5.x | Next.js production process management |
| UI primitives | Radix UI / shadcn/ui | latest | Accessible, unstyled component library |
| Styling | Tailwind CSS | ^3.x | Utility-first CSS |
| Map | Leaflet + react-leaflet | ^4.x | Interactive ticket maps + clusters |
| Forms / validation | React Hook Form + Zod | ^7.x / ^3.x | Form state + schema validation |
| API types | openapi-typescript | ^6.x | Auto-generated TypeScript types from OpenAPI spec |
| API client | openapi-fetch | ^0.x | Type-safe fetch wrapper |
| i18n | next-intl | ^3.x | Gettext-compatible message catalogs |
| Testing (unit) | Jest + Testing Library | ^29.x | Component and utility unit tests |
| Testing (e2e) | Playwright | ^1.x | End-to-end critical user journey tests |
| Accessibility | axe-core + jest-axe | ^4.x | WCAG 2.1 AA automated audits in CI |
| Build | Next.js built-in (Webpack/Turbopack) | — | Asset optimization + HMR |

### 6.3 Data & Search

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Primary database | MySQL | 8.x | Relational data store |
| Full-text search | Apache Solr | 9.x | Full-text + geospatial clustering |
| Cache (optional) | Redis | 7.x | SLA metrics cache + geocode cache |

### 6.4 Infrastructure & DevOps

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Containerization | Docker + Docker Compose | 24.x / 2.x | Local development stack |
| Provisioning | Ansible | 2.x | Production deployment automation |
| CI/CD | GitHub Actions | — | Automated test + quality gates |
| Logging aggregation | Graylog | 5.x | Centralized structured log ingestion |
| Secret management | site_config.php constants | — | Per-deployment config (excluded from VCS) |

### 6.5 CI/CD Pipeline (GitHub Actions)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Pull Request → main                         │
│                                                                 │
│  Job: lint-php                                                  │
│  ├── composer install                                           │
│  ├── php-cs-fixer --dry-run                                     │
│  └── phpstan analyse --level=8                                  │
│                                                                 │
│  Job: test-php                                                  │
│  ├── docker compose up -d db solr                               │
│  ├── phinx migrate (test DB)                                    │
│  └── phpunit --coverage-clover=coverage.xml (≥70% required)    │
│                                                                 │
│  Job: lint-frontend                                             │
│  ├── npm ci                                                     │
│  ├── tsc --noEmit (strict mode)                                 │
│  └── next lint                                                  │
│                                                                 │
│  Job: test-frontend                                             │
│  └── jest --coverage                                            │
│                                                                 │
│  Job: e2e                                                       │
│  ├── docker compose up -d (full stack)                          │
│  └── playwright test (all 10 critical journeys)                 │
│                                                                 │
│  Job: license-check                                             │
│  └── license-checker (fail on GPL-incompatible)                 │
│                                                                 │
│  Job: security-audit                                            │
│  ├── composer audit                                             │
│  └── npm audit                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.6 Docker Compose Dev Stack

```yaml
# docker-compose.yml (summary)
services:
  app:
    image: php:8.5-fpm-apache
    volumes:
      - .:/var/www/html
    environment:
      - SITE_CONFIG=/var/www/html/site_config.php
    ports:
      - "80:80"

  frontend:
    image: node:20-alpine
    command: npm run dev
    volumes:
      - ./frontend:/app
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://localhost/api

  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: ureport
      MYSQL_ROOT_PASSWORD: secret
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql

  solr:
    image: solr:9-slim
    ports:
      - "8983:8983"
    volumes:
      - ./solr/configsets:/opt/solr/server/solr/configsets
    command: solr-precreate ureport

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  db_data:
```

### 6.7 Key Configuration Constants (site_config.php)

| Constant | Description | Example |
|----------|-------------|---------|
| `BASE_URL` | Application base URL | `https://ureport.city.gov` |
| `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` | MySQL connection | — |
| `SOLR_URL` | Solr base URL | `http://solr:8983/solr/ureport` |
| `SOLR_TIMEOUT` | Solr request timeout (s) | `5` |
| `OIDC_ISSUER` | OIDC provider issuer URL | `https://sso.city.gov/` |
| `OIDC_CLIENT_ID` | OIDC client ID | — |
| `OIDC_CLIENT_SECRET` | OIDC client secret | — |
| `OIDC_REDIRECT_URI` | OIDC callback URL | `{BASE_URL}/auth/callback` |
| `SESSION_TTL` | JWT session lifetime (s) | `28800` |
| `JWT_SECRET` | HMAC-SHA256 signing key | ≥32 random bytes |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | SMTP config | — |
| `SMTP_TLS` | Use STARTTLS | `true` |
| `SMTP_FROM_ADDRESS` | Email from address | `noreply@city.gov` |
| `SMTP_FROM_NAME` | Email from name | `City uReport` |
| `ADDRESS_SERVICE_TYPE` | Geocoding provider | `google` \| `nominatim` \| `none` |
| `ADDRESS_SERVICE_URL` | Geocoding API base URL | — |
| `ADDRESS_SERVICE_KEY` | Geocoding API key | — |
| `GRAYLOG_HOST` | Graylog GELF host | `logs.city.gov` |
| `GRAYLOG_PORT` | Graylog GELF port | `12201` |
| `GRAYLOG_ENABLED` | Enable Graylog (bool) | `true` |
| `LOCALE` | Application locale | `en_US` |
| `UPLOAD_ROOT` | File upload directory | `/var/uploads/ureport` |
| `MAX_UPLOAD_SIZE` | Max file size (bytes) | `10485760` |

---
## 7. Integration Points

### 7.1 Open311 GeoReport v2 (Inbound)

**Direction:** Inbound — external clients call uReport  
**Protocol:** REST/HTTP — JSON and XML  
**Endpoint base:** `/open311/` (preserved verbatim)  
**Auth:** `api_key` query/body parameter (optional for public categories)

**Open311 → uReport field mapping:**

| Open311 Request Field | Internal Mapping |
|----------------------|-----------------|
| `service_code` | `categories.id` |
| `description` | `tickets.description` |
| `lat` | `ticket_geodata.lat` |
| `long` | `ticket_geodata.lng` |
| `address_string` | `tickets.address` |
| `first_name` + `last_name` | `tickets.reporterName` |
| `email` | `tickets.reporterEmail` |
| `phone` | `tickets.reporterPhone` |
| `media_url` | `media.sourceUrl` (URL stored; file not downloaded) |
| `api_key` | Validated against `clients.apiKeyHash` (bcrypt) |
| `attribute[{code}]` | `tickets.customFields[code]` |

| Open311 Response Field | Internal Source |
|-----------------------|----------------|
| `service_request_id` | `tickets.id` |
| `status` | `tickets.status` |
| `service_code` | `tickets.categoryId` |
| `service_name` | `categories.name` |
| `description` | `tickets.description` |
| `lat` | `ticket_geodata.lat` |
| `long` | `ticket_geodata.lng` |
| `address` | `tickets.address` |
| `requested_datetime` | `tickets.datetimeOpened` (ISO 8601) |
| `updated_datetime` | `tickets.datetimeUpdated` (ISO 8601) |
| `expected_datetime` | Computed: `datetimeOpened + (slaDays × 8h)` |
| `agency_responsible` | `departments.name` |
| `media_url` | First `media.sourceUrl` or first upload URL |

**Preservation guarantee:** The Open311 endpoint surface at `/open311/` is not modified during modernization. All external clients require zero code changes after migration.

---

### 7.2 OIDC Identity Provider (Outbound)

**Direction:** Outbound — uReport initiates auth flows to the IdP  
**Protocol:** OpenID Connect 1.0 (Authorization Code Flow)  
**Examples:** Keycloak, Auth0, Azure AD, Okta, city SSO

**OIDC endpoints used:**
- **Authorization endpoint** (from OIDC discovery document): redirect user here for login
- **Token endpoint**: exchange authorization code for `id_token` + `access_token`
- **JWKS endpoint**: fetch provider's public keys for `id_token` signature validation
- **End-session endpoint**: redirect user here on logout

**Configuration constants:**

| Constant | Description |
|----------|-------------|
| `OIDC_ISSUER` | Provider issuer URL (auto-discovers endpoints) |
| `OIDC_CLIENT_ID` | Client ID registered at provider |
| `OIDC_CLIENT_SECRET` | Client secret |
| `OIDC_REDIRECT_URI` | `{BASE_URL}/auth/callback` |
| `OIDC_SCOPES` | `openid email profile` |

**Person matching:**
1. Match `oidcSubject = id_token.sub` (primary)
2. Fallback: match `contactMethods.value = id_token.email` (type = email)
3. No match: auto-provision new person with role `public`

**Failure mode:** If IdP is unreachable, unauthenticated requests receive `503 IDP_UNAVAILABLE`. Already-authenticated users (valid session JWT not yet expired) are unaffected.

---

### 7.3 Apache Solr (Bidirectional)

**Direction:** Bidirectional — uReport indexes to and queries from Solr  
**Version:** Apache Solr 9.x  
**Use cases:** Full-text search, faceted filtering, geospatial clustering (heatmap)

**Abstraction:** All Solr calls are routed through `SearchService`. Controllers never call Solr directly. `SearchService` implements a `SearchServiceInterface` to allow mocking in unit tests.

**Solr index operations:**

| Operation | Trigger | Solr API |
|-----------|---------|---------|
| Create/update document | Any ticket mutation | `POST /solr/ureport/update` |
| Delete document | Ticket soft-delete | `POST /solr/ureport/update` (delete by ID) |
| Full-text + facet query | `GET /api/tickets` | `GET /solr/ureport/select` |
| Geospatial heatmap | `GET /api/tickets/clusters` | `GET /solr/ureport/select` (heatmap facet) |
| Full re-index | CLI command `bin/console solr:reindex` | Batch POST all tickets |

**Solr document schema:**

| Field | Solr Type | Source |
|-------|-----------|--------|
| `id` | string | `ticket_{tickets.id}` |
| `ticket_id` | pint | `tickets.id` |
| `title` | text_en | `tickets.title` |
| `description` | text_en | `tickets.description` |
| `status` | string | `tickets.status` |
| `category_id` | pint | `tickets.categoryId` |
| `department_id` | pint | `tickets.departmentId` |
| `assignee_id` | pint | `tickets.personId` |
| `address` | text_en | `tickets.address` |
| `lat` | pdouble | `ticket_geodata.lat` |
| `lng` | pdouble | `ticket_geodata.lng` |
| `date_opened` | pdate | `tickets.datetimeOpened` |
| `date_closed` | pdate | `tickets.datetimeClosed` |
| `response_text` | text_en | Concatenated response action bodies |

**Failure mode:** Solr unavailability degrades to MySQL-only search (reduced performance, no geo-clustering). Returns `503 SEARCH_UNAVAILABLE` when Solr is required for the request (e.g., geo-cluster endpoint).

---

### 7.4 SMTP / Email (Outbound)

**Direction:** Outbound — uReport sends transactional emails  
**Protocol:** SMTP with STARTTLS or SSL  
**Library:** PHPMailer ^6.x

**Email types:**

| Template Slug | Trigger | Recipient |
|--------------|---------|-----------|
| `ticket_created` | Ticket creation | Reporter |
| `ticket_assigned` | Ticket assignment | New assignee (staff) |
| `ticket_response` | Staff response posted | Reporter |
| `ticket_closed` | Ticket closed | Reporter |
| `ticket_merged` | Source ticket merged | Reporter of source ticket |
| `digest_daily` | Scheduled cron (7am) | All active staff in department |

**Deduplication:** A notification is not sent if an identical `(ticketId, templateSlug, recipientEmail)` combination was sent within the last 60 seconds.

**Retry policy:** Up to 3 attempts with exponential backoff (5s, 15s, 45s). After 3 failures, `notification_log.status = 'failed'` and error logged to Graylog.

**Non-fatal:** SMTP failures do not abort the ticket operation. The ticket is saved and the error is logged.

---

### 7.5 Address / Geocoding Service (Outbound)

**Direction:** Outbound — uReport calls geocoding API  
**Abstraction:** `AddressService` interface with concrete implementations per provider

**Supported providers:**

| `ADDRESS_SERVICE_TYPE` | Implementation |
|------------------------|---------------|
| `google` | Google Maps Geocoding API |
| `nominatim` | OpenStreetMap Nominatim API |
| `city_gis` | Municipality's own GIS endpoint |
| `none` | Geocoding disabled; lat/lng stored as-is from caller |

**Operations:**
- **Geocode** (address → lat/lng): Called on ticket create when `lat`/`lng` not provided
- **Reverse geocode** (lat/lng → address): Called on ticket create when `address` not provided

**Caching:** Geocoding results are cached by address string (Redis if configured; PHP in-memory fallback) to avoid redundant API calls for identical addresses.

**Failure mode:** Non-fatal. `ticket_geodata.geoStatus = 'failed'` is set; ticket is saved without coordinates. A CLI command `bin/console geo:retry` retries failed geocodes.

---

### 7.6 Graylog — Centralized Logging (Outbound)

**Direction:** Outbound — uReport forwards structured log events  
**Protocol:** GELF (Graylog Extended Log Format) over UDP  
**Library:** monolog/monolog with `GelfHandler`

**Log levels:**

| Level | Use |
|-------|-----|
| ERROR | Unhandled exceptions, SMTP failures after all retries |
| WARNING | Non-fatal failures (geocoding, Solr unavailability, duplicate notification skip) |
| INFO | Ticket lifecycle events (create, close, merge), auth events (login, logout) |
| DEBUG | Solr query details, geocoding calls (local dev only — disabled in production) |

**Failure mode:** If Graylog is unreachable, logs fall back to PHP's local error log (`error_log()`). Never blocks request handling.

---

### 7.7 GNU gettext / i18n

**Direction:** Internal (compile-time + runtime)

**PHP backend:**
- All user-facing strings wrapped in `_('string')` or `gettext('string')`
- `.po` source files in `locale/{LOCALE}/LC_MESSAGES/ureport.po`
- `.mo` compiled files served at runtime
- `LOCALE` constant in `site_config.php` determines active locale

**Next.js frontend:**
- `next-intl` library for server and client components
- Message catalogs in `frontend/lib/i18n/messages/{locale}.json` (compiled from `.po` files or maintained separately)
- No hard-coded English strings in `.tsx` components

**Supported locales (existing):** Determined by the municipality's deployment configuration. English (`en_US`) is the default.

---
