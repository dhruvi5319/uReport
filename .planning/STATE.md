---
pivota_spec_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 02-03-PLAN.md
last_updated: "2026-07-06T23:50:51.990Z"
last_activity: "2026-07-06 — Completed 02-03: CAS auth (CasAuthService, CasAuthController, 5 unit tests)"
progress:
  total_phases: 9
  completed_phases: 1
  total_plans: 14
  completed_plans: 4
  percent: 21
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

Progress: [███░░░░░░░] 21%

## Performance Metrics

**Velocity:**

- Total plans completed: 3
- Average duration: 2.3 min
- Total execution time: 0.12 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 02-authentication-security | 3 | 7min | 2.3min |

**Recent Trend:**

- Last 5 plans: 3min, 2min, 2min
- Trend: stable

*Updated after each plan completion*
| Phase 02-authentication-security P04 | 6min | 2 tasks | 4 files |

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01-infrastructure-foundation P02 | 2 min | 2 tasks | 2 files |
| Phase 01-infrastructure-foundation P01 | 2min | 2 tasks | 3 files |
| Phase 01-infrastructure-foundation P03 | 9 min | 2 tasks | 8 files |
| Phase 01-infrastructure-foundation PGAP-01 | 2 min | 2 tasks | 2 files |
| Phase 01-infrastructure-foundation PGAP-02 | 1 min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- All: PostgreSQL tsvector/tsquery replaces Solr — eliminates external JVM dependency
- All: JWT in httpOnly cookie (not Authorization header) — XSS mitigation
- Phase 1: Flyway V1 uses snake_case column names (MySQL camelCase → PostgreSQL snake_case per TechArch §3.4 mapping table)
- Phase 3: Open311 controller shares service/repository layer with internal CRM; content negotiation via Accept header or format param
- Phase 9: Open311 golden-file tests generated from PHP reference before migration (critical regression guard)
- [Phase 02-authentication-security]: HS256 JWT in auth_token httpOnly cookie using JJWT 0.12.x API — XSS-safe, stateless auth foundation
- [Phase 02-authentication-security]: CSRF Double-Submit Cookie (XSRF-TOKEN non-httpOnly + X-XSRF-TOKEN header) via CookieCsrfTokenRepository in Spring Security 6
- [Phase 02-authentication-security]: PersonMapper ignores expiresAt (not on Person entity) — set explicitly from JWT expiry in controller
- [Phase 02-authentication-security]: LdapAuthService auto-creates Person with role=staff for new LDAP users — admin role never auto-granted from LDAP
- [Phase 02-authentication-security]: XXE prevention via DocumentBuilderFactory.setFeature() (disallow-doctype-decl + external entities disabled) — mitigates T-02-14 CAS XML injection
- [Phase 02-authentication-security]: CAS auto-creates Person with role=staff on first login — admin role never auto-granted from external auth providers

### Pending Todos

None yet.

### Blockers/Concerns

- CAS/LDAP integration complexity with Spring Security — prototype auth flow early in Phase 2 before UI work begins (risk from PRD §8)
- Open311 response format must be byte-compatible with PHP implementation — generate golden files before Phase 3 implementation

## Session Continuity

Last session: 2026-07-06T23:42:05.701Z
Stopped at: Completed 02-03-PLAN.md
Resume file: None
