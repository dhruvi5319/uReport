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
