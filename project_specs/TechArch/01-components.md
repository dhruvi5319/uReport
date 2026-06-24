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
