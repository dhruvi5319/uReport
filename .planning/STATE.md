---
pivota_spec_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 04-core-case-management-backend-04-04-PLAN.md
last_updated: "2026-07-08T02:00:00.000Z"
last_activity: "2026-07-08 — Completed 04-03: NotificationService (SMTP), TicketHistoryService (action logging, dept filter), TicketHistoryController + 04-04: MediaService (magic bytes MIME, Thumbnailator 150x150), ClientService/Controller (admin-only, UUID api_key)"
progress:
  total_phases: 9
  completed_phases: 4
  total_plans: 35
  completed_plans: 22
  percent: 63
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-06)

**Core value:** Every existing feature, screen, API contract, and Open311 endpoint must continue to work exactly as before — modernization improves the stack and visual quality without removing any capability.
**Current focus:** Phase 4 — Core Case Management Backend (complete)

## Current Position

Phase: 4 of 9 (Core Case Management Backend)
Plan: 4 of 4 in current phase (04-01, 04-02, 04-03, 04-04 all complete)
Status: Phase 4 complete — ready for Phase 5 (Admin Configuration Backend)
Last activity: 2026-07-08 — Completed 04-04: MediaService (MIME magic bytes, Thumbnailator 150x150 thumbnails, file serve/delete), TicketMediaController, ClientService (UUID api_key), ClientController (admin-only), MediaUploadIT + ClientCrudIT

Progress: [██████░░░░] 63%

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
| Phase 04-core-case-management-backend P03 | 30min | 2 tasks | 7 files (NotificationService, TicketHistoryService, controller, repositories, IT) |
| Phase 04-core-case-management-backend P04 | 50min | 2 tasks | 13 files (MediaService, TicketMediaController, ClientService, ClientController, DTOs, ITs) |

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
- [Phase 04-core-case-management-backend 04-03]: Non-fatal SMTP (MailException caught at WARN, never re-thrown) — email failure must not block history logging; sentNotifications stored as JSON array in ticket_history
- [Phase 04-core-case-management-backend 04-03]: ADMIN bypasses department_actions filter; STAFF restricted to department's permitted actions (T-04-12)
- [Phase 04-core-case-management-backend 04-04]: MIME detection uses magic bytes exclusively (Content-Type header ignored — T-04-18); internalFilename is UUID-only with safe extension extraction (T-04-23)
- [Phase 04-core-case-management-backend 04-04]: api_key exposed only on POST create (ClientDetailDto exposeApiKey flag); masked as null on all GET responses (T-04-22)
- [Phase 04-core-case-management-backend 04-04]: GET /api/media/** added as permitAll in SecurityConfig (public media serving per Open311 design T-04-20)

### Pending Todos

None yet.

### Blockers/Concerns

- Open311 golden-file tests (Open311GoldenFileIT) verify field shape vs PHP reference — actual byte-comparison deferred to UAT phase
- Phase 3 plan 03-GAP-01 (gap closure) still pending if needed
- Integration tests (TicketHistoryIT, MediaUploadIT, ClientCrudIT) written and on disk; execution deferred to verify phase (no Java/Maven in sandbox)

## Session Continuity

Last session: 2026-07-08T02:00:00.000Z
Stopped at: Completed 04-core-case-management-backend-04-04-PLAN.md
Resume file: None
