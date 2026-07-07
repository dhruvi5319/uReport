---
pivota_spec_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Completed 03-open311-georeport-v2-api-02-PLAN.md
last_updated: "2026-07-07T01:38:37.989Z"
last_activity: 2026-07-06 — Roadmap created; all 36 v1 requirements mapped to 9 phases
progress:
  total_phases: 9
  completed_phases: 0
  total_plans: 14
  completed_plans: 2
  percent: 14
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-06)

**Core value:** Every existing feature, screen, API contract, and Open311 endpoint must continue to work exactly as before — modernization improves the stack and visual quality without removing any capability.
**Current focus:** Phase 2 — Authentication & Security

## Current Position

Phase: 2 of 9 (Authentication & Security)
Plan: 3 of 4 in current phase
Status: In progress
Last activity: 2026-07-06 — Completed 02-03: CAS auth (CasAuthService, CasAuthController, 5 unit tests)

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

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 03-open311-georeport-v2-api P01 | 8min | 2 tasks | 15 files |
| Phase 03-open311-georeport-v2-api P02 | 8 min | 2 tasks | 31 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- All: PostgreSQL tsvector/tsquery replaces Solr — eliminates external JVM dependency
- All: JWT in httpOnly cookie (not Authorization header) — XSS mitigation
- Phase 1: Flyway V1 uses snake_case column names (MySQL camelCase → PostgreSQL snake_case per TechArch §3.4 mapping table)
- Phase 3: Open311 controller shares service/repository layer with internal CRM; content negotiation via Accept header or format param
- Phase 9: Open311 golden-file tests generated from PHP reference before migration (critical regression guard)
- [Phase 03-open311-georeport-v2-api]: Content negotiation via URL suffix (.json/.xml) priority over format query param priority over Accept header for Open311 endpoints
- [Phase 03-open311-georeport-v2-api]: Tests use native-sidecar PostgreSQL (not H2) since DATABASE_URL is injected by platform and overrides H2 test config
- [Phase 03-open311-georeport-v2-api]: JPA Specification for dynamic filter queries (service_code, status, date ranges, bbox) — parameterized predicates prevent SQL injection
- [Phase 03-open311-georeport-v2-api]: api_key validated before any DB write — throws 403 FORBIDDEN if missing or not found in clients table
- [Phase 03-open311-georeport-v2-api]: @JsonProperty('long') on Double lon field — GeoReport v2 JSON key must be 'long' (reserved Java word)

### Pending Todos

None yet.

### Blockers/Concerns

- CAS/LDAP integration complexity with Spring Security — prototype auth flow early in Phase 2 before UI work begins (risk from PRD §8)
- Open311 response format must be byte-compatible with PHP implementation — generate golden files before Phase 3 implementation

## Session Continuity

Last session: 2026-07-07T01:38:37.988Z
Stopped at: Completed 03-open311-georeport-v2-api-02-PLAN.md
Resume file: None
