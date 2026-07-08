---
pivota_spec_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 05-admin-configuration-backend-05-02-PLAN.md
last_updated: "2026-07-08T13:49:23.882Z"
last_activity: "2026-07-08 — Completed 03-03: OpenAPI/Swagger docs + golden-file integration tests (8 tests, JWT Bearer SecurityScheme, @Operation annotations on all 5 Open311 endpoints)"
progress:
  total_phases: 9
  completed_phases: 4
  total_plans: 35
  completed_plans: 20
  percent: 51
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-06)

**Core value:** Every existing feature, screen, API contract, and Open311 endpoint must continue to work exactly as before — modernization improves the stack and visual quality without removing any capability.
**Current focus:** Phase 3 — Open311 / GeoReport v2 API

## Current Position

Phase: 3 of 9 (Open311 GeoReport v2 API)
Plan: 3 of 4 in current phase (03-01, 03-02, 03-03 complete)
Status: In progress
Last activity: 2026-07-08 — Completed 03-03: OpenAPI/Swagger docs + golden-file integration tests (8 tests, JWT Bearer SecurityScheme, @Operation annotations on all 5 Open311 endpoints)

Progress: [█████░░░░░] 51%

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

### Pending Todos

None yet.

### Blockers/Concerns

- Open311 golden-file tests (Open311GoldenFileIT) verify field shape vs PHP reference — actual byte-comparison deferred to UAT phase
- Phase 3 plan 03-GAP-01 (gap closure) still pending if needed

## Session Continuity

Last session: 2026-07-08T13:49:23.881Z
Stopped at: Completed 05-admin-configuration-backend-05-02-PLAN.md
Resume file: None
