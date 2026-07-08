---
pivota_spec_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Completed 02-authentication-security-02-01-PLAN.md
last_updated: "2026-07-08T00:20:00.000Z"
last_activity: 2026-07-08 — Completed 02-01: Spring Security foundation (JwtService, JwtAuthFilter, SecurityConfig, CSRF, CORS, MapStruct deps)
progress:
  total_phases: 9
  completed_phases: 1
  total_plans: 14
  completed_plans: 5
  percent: 21
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-06)

**Core value:** Every existing feature, screen, API contract, and Open311 endpoint must continue to work exactly as before — modernization improves the stack and visual quality without removing any capability.
**Current focus:** Phase 2 — Authentication & Security

## Current Position

Phase: 2 of 9 (Authentication & Security)
Plan: 1 of 5 in current phase (02-01 complete)
Status: In progress
Last activity: 2026-07-08 — Completed 02-01: Spring Security foundation (JwtAuthFilter, SecurityConfig, CSRF Double-Submit Cookie, MapStruct/LDAP deps)

Progress: [█░░░░░░░░░] 14%

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

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 04-core-case-management-backend P02 | 52min | 2 tasks | 47 files |

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

### Pending Todos

None yet.

### Blockers/Concerns

- CAS/LDAP integration complexity with Spring Security — prototype auth flow early in Phase 2 before UI work begins (risk from PRD §8)
- Open311 response format must be byte-compatible with PHP implementation — generate golden files before Phase 3 implementation

## Session Continuity

Last session: 2026-07-08T00:20:00.000Z
Stopped at: Completed 02-authentication-security-02-01-PLAN.md
Resume file: None
