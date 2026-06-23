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
