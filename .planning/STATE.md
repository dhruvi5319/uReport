---
pivota_spec_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 08-04-PLAN.md
last_updated: "2026-07-08T20:02:50.429Z"
last_activity: "2026-07-08 — Completed 07-02: 17 shadcn/ui components vendored, Badge status variants, Button focus ring, Input dark mode, 38 Vitest+jest-axe tests pass"
progress:
  total_phases: 9
  completed_phases: 7
  total_plans: 37
  completed_plans: 33
  percent: 75
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-06)

**Core value:** Every existing feature, screen, API contract, and Open311 endpoint must continue to work exactly as before — modernization improves the stack and visual quality without removing any capability.
**Current focus:** Phase 3 — Open311 / GeoReport v2 API

## Current Position

Phase: 7 of 9 (React Design System and Shell)
Plan: 2 of 4 in current phase (07-01 not yet executed, 07-02 complete)
Status: In progress
Last activity: 2026-07-08 — Completed 07-02: 17 shadcn/ui components vendored, Badge status variants, Button focus ring, Input dark mode, 38 Vitest+jest-axe tests pass

Progress: [████████░░] 75%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 02-authentication-security | 3 | 7min | 2.3min |
| 02-authentication-security P01 | 8min | 2 tasks | 4 files |
| 02-authentication-security P02 | 5min | 2 tasks | 1 file modified (Person constructor) |
| 02-authentication-security P03 | 5min | 2 tasks | 0 files (pre-existing, verified) |
| 02-authentication-security P04 | 5min | 2 tasks | 1 file modified (RoleHierarchyConfig fluent API) |
| 03-open311-georeport-v2-api P01 | 10min | 2 tasks | 2 files fixed (CategoryRepository + Open311ServicesIT Zonky) |
| 03-open311-georeport-v2-api P02 | 10min | 2 tasks | 3 files fixed (Open311RequestService + IT tests Zonky migration) |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 04-core-case-management-backend P02 | 52min | 2 tasks | 47 files |
| Phase 05-admin-configuration-backend P04 | 20min | 2 tasks | 20 files |
| Phase 05-admin-configuration-backend P02 | 6min | 2 tasks | 11 files |
| Phase 05-admin-configuration-backend P01 | 17 min | 2 tasks | 30 files |
| Phase 05-admin-configuration-backend P03 | 6min | 2 tasks | 16 files |
| Phase 06-search-geo-and-metrics-backend P02 | 7min | 2 tasks | 21 files |
| Phase 06-search-geo-and-metrics-backend P01 | 8 min | 2 tasks | 12 files |
| Phase 06-search-geo-and-metrics-backend PGAP-01 | 7min | 3 tasks | 4 files |
| Phase 07-react-design-system-and-shell P01 | 15min | 2 tasks | 23 files |
| Phase 07-react-design-system-and-shell P02 | 9min | 2 tasks | 22 files |
| Phase 07-react-design-system-and-shell P03 | 3min | 2 tasks | 6 files |
| Phase 07-react-design-system-and-shell P04 | 15min | 2 tasks | 11 files |
| Phase 07-react-design-system-and-shell PGAP-01 | 2min | 2 tasks | 6 files |
| Phase 08-core-frontend-screens P01 | 7min | 2 tasks | 16 files |
| Phase 08-core-frontend-screens P02 | 11min | 2 tasks | 13 files |
| Phase 08-core-frontend-screens P04 | 7min | 2 tasks | 15 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- All: PostgreSQL tsvector/tsquery replaces Solr — eliminates external JVM dependency
- All: JWT in httpOnly cookie (not Authorization header) — XSS mitigation
- Phase 1: Flyway V1 uses snake_case column names (MySQL camelCase → PostgreSQL snake_case per TechArch §3.4 mapping table)
- Phase 3: Open311 controller shares service/repository layer with internal CRM; content negotiation via Accept header or format param
- Phase 9: Open311 golden-file tests generated from PHP reference before migration (critical regression guard)
- [Phase 04-core-case-management-backend]: No class-level @Transactional on bulk methods — per-ticket try/catch ensures one failure does not abort others
- [Phase 04-core-case-management-backend]: Native sidecar PostgreSQL for integration tests (no Docker daemon in K8s sandbox — Testcontainers not viable)
- [Phase 04-core-case-management-backend]: DatabaseUrlEnvironmentPostProcessor converts platform-injected postgres:// URL to jdbc:postgresql:// before Spring datasource init
- [Phase 01-infrastructure-foundation 01-03]: io.zonky.test embedded-postgres replaces Testcontainers — no Docker daemon needed; ZONKY provider auto-configures DataSource bean in test scope
- [Phase 01-infrastructure-foundation 01-03]: docker-compose.yml removed — K8s sandbox has no Docker daemon; embedded-postgres + Dockerfiles cover all test and OCI packaging needs
- [Phase 02-authentication-security 02-01]: JwtUtil fixed to use jwt.secret property (was app.jwt.secret — pre-existing bug); SecurityConfig uses JwtAuthFilter (not legacy JwtAuthenticationFilter)
- [Phase 02-authentication-security 02-02]: Person entity kept full schema (all DB columns); Person(String, String) constructor added to enable auto-create in LdapAuthService/CasAuthService
- [Phase 02-authentication-security 02-03]: CAS ticket validated server-to-server via /serviceValidate; XXE prevention via DocumentBuilderFactory features; RestTemplate injected via constructor for unit test mockability
- [Phase 02-authentication-security 02-04]: RoleHierarchyImpl.withDefaultRolePrefix() fluent API (replaces deprecated setHierarchy()); DefaultWebSecurityExpressionHandler bean wires hierarchy into hasRole() expressions; AuthorizationIT uses @ActiveProfiles("test") + embedded PostgreSQL (not H2) — consistent with project test architecture
- [Phase 03-open311-georeport-v2-api 03-01]: CategoryRepository.findByActiveTrue() added (was missing); content negotiation via path variable {ext} → format param → Accept header → default JSON; obsolete api_key returns 3 synthetic shutdown objects
- [Phase 03-open311-georeport-v2-api 03-02]: JPA Specification for dynamic filter queries; api_key validated before any DB write (403 if missing/invalid); POST /requests returns HTTP 200 (not 201) per PHP reference; @JsonProperty("long") for longitude field; all integration tests use @AutoConfigureEmbeddedDatabase(ZONKY)
- [Phase 03-open311-georeport-v2-api]: Golden-file tests use @BeforeEach JPA setup instead of data.sql — aligns with native-sidecar PostgreSQL test architecture (same pattern as Open311RequestsIT)
- [Phase 05-admin-configuration-backend]: Reused com.ureport.crm.dto.ActionDto for ActionController to avoid duplicate record type
- [Phase 05-admin-configuration-backend]: SEEDED_* constants use Set.of() for O(1) in-memory guard before DB lookup in all 3 lookup services
- [Phase 05-admin-configuration-backend]: clearDefaultForStatus runs within same @Transactional scope for Postgres row-level lock safety on isDefault exclusivity
- [Phase 05-admin-configuration-backend]: Department action reconciliation via orphanRemoval: getDepartmentActions().clear() + add new entries — no manual deleteByDepartmentId needed
- [Phase 05-admin-configuration-backend]: Department.departmentActions uses @JoinColumn (not mappedBy) because DepartmentAction has composite @IdClass with no @ManyToOne back-reference
- [Phase 05-admin-configuration-backend]: People CRUD uses array reconciliation (removeIf + orphanRemoval) for nested email/phone/address sub-resources
- [Phase 05-admin-configuration-backend]: Spring Security 3.x auto-wires RoleHierarchy bean — no separate webSecurityExpressionHandler needed (caused BeanDefinitionOverrideException)
- [Phase 05-admin-configuration-backend]: Category.categoryActionResponses uses unidirectional @OneToMany via @JoinColumn — avoids refactoring CategoryActionResponse.categoryId from Long to @ManyToOne
- [Phase 05-admin-configuration-backend]: Permission level permissiveness: anonymous(0) > public(1) > staff(2); posting PERM_ORDER must not exceed display PERM_ORDER (PERMISSION_LEVEL_INVALID)
- [Phase 05-admin-configuration-backend]: ActionResponses reconciliation: existingList.clear() + addAll(updatedList) with orphanRemoval — same pattern as DepartmentService action reconciliation
- [Phase 06-search-geo-and-metrics-backend]: DashboardController uses CustomUserDetails (actual JWT principal) not PersonDetails; departmentId from personId via DB lookup, never from request param
- [Phase 06-search-geo-and-metrics-backend]: 7 separate @Query methods in GeoclusterRepository (findClusters0-6) with Java switch dispatch — zero dynamic SQL column construction (T-06-06)
- [Phase 06-search-geo-and-metrics-backend]: MetricsService uses JdbcTemplate directly for aggregation queries; VALID_GROUP_BY whitelist + hardcoded SQL switch prevents groupBy injection (T-06-07)
- [Phase 06-search-geo-and-metrics-backend]: response_method_id column at index [9] in tickets DDL (absent from JPA entity) shifts description to [24], location to [15], status to [19] — mapFtsRowToTicketListItem uses row.length-2 for snippet column
- [Phase 06-search-geo-and-metrics-backend]: FTS routing in TicketService.listTickets: blank q uses JPA Specification (unchanged behavior), non-blank q uses native plainto_tsquery FTS — preserves backward compatibility
- [Phase 06-search-geo-and-metrics-backend]: Bookmark personId sourced exclusively from JWT PersonDetails.getId() — never from request body/params (T-06-02 ownership guarantee)
- [Phase 06-search-geo-and-metrics-backend]: MIN(CAST(g.center AS TEXT)) AS center_text aggregate avoids GROUP BY on POINT (no equality operator in PostgreSQL)
- [Phase 06-search-geo-and-metrics-backend]: CAST(AVG(...) AS DOUBLE PRECISION) in MetricsService.buildReportSql enables JDBC Double.class mapping (numeric type not auto-converted)
- [Phase 06-search-geo-and-metrics-backend]: @ExceptionHandler(ResponseStatusException.class) in GlobalExceptionHandler preserves 403/400 status before ExceptionTranslationFilter re-maps to 401
- [Phase 07-react-design-system-and-shell]: CSS @import must precede @tailwind directives — fontsource imports moved above @tailwind base/components/utilities in globals.css
- [Phase 07-react-design-system-and-shell]: vitest 2.1.9 jsdom provides null-prototype localStorage with no methods — localStorage and matchMedia mocked in test-setup.ts for all frontend tests
- [Phase 07-react-design-system-and-shell]: Badge status variants as direct CVA variant keys (open/resolved/duplicate/bogus) — simpler API vs nested statusVariant prop
- [Phase 07-react-design-system-and-shell]: shadcn components written manually (not via CLI) due to network failure — equivalent output, all 17 files match official shadcn/ui source
- [Phase 07-react-design-system-and-shell]: NavLink aria-current is automatic in React Router v6 — no manual aria-current manipulation needed
- [Phase 07-react-design-system-and-shell]: MobileDrawer built in Task 1 (before Task 2) because Navbar imports it and build requires all imports to exist
- [Phase 07-react-design-system-and-shell]: ringOffsetColor DEFAULT uses hsl(var(--color-background)) for adaptive ring offset in light and dark mode
- [Phase 07-react-design-system-and-shell]: Catch-all <Route path='*'> nested inside AppShell group for auth-protected ComingSoonPage on unregistered routes
- [Phase 08-core-frontend-screens]: mapbox-gl installed as production dep; runtime VITE_MAPBOX_TOKEN check ensures Leaflet fallback when absent
- [Phase 08-core-frontend-screens]: ResizeObserver mock added to test-setup.ts for recharts ResponsiveContainer jsdom compatibility
- [Phase 08-core-frontend-screens]: URL-as-state for all filter params in CaseListPage — useSearchParams reads/writes all filter, sort, page state; enables bookmarkable filter URLs
- [Phase 08-core-frontend-screens]: Framer Motion height 0→auto for BulkActionBar slide-down; itemVariants AnimatePresence for FilterChips stagger enter/exit
- [Phase 08-core-frontend-screens]: WizardContext stores all form data in flat object for simple cross-step merging; direction +1/-1 drives Framer Motion stepVariants custom prop

### Pending Todos

None yet.

### Blockers/Concerns

- Open311 golden-file tests (Open311GoldenFileIT) verify field shape vs PHP reference — actual byte-comparison deferred to UAT phase
- Phase 3 plan 03-GAP-01 (gap closure) still pending if needed

## Session Continuity

Last session: 2026-07-08T20:02:50.428Z
Stopped at: Completed 08-04-PLAN.md
Resume file: None
