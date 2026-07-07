---
phase: 02-authentication-security
plan: 02
subsystem: auth
tags: [ldap, jwt, spring-security, mapstruct, jpa, cookie]

# Dependency graph
requires:
  - phase: 02-01
    provides: JwtService (generateToken/validateToken/extractClaims/extractExpiration), CustomUserDetails, SecurityConfig
provides:
  - Person JPA entity mapping people table (snake_case columns)
  - PersonRepository with findByUsername(String)
  - LdapLoginRequest DTO with validation constraints
  - AuthMeResponse record with personId, username, role, firstname, lastname, expiresAt
  - PersonMapper MapStruct interface (Person → AuthMeResponse)
  - LdapAuthService: LDAP bind auth guarded by ldap.enabled flag
  - AuthController: POST /api/auth/ldap, GET /api/auth/me, POST /api/auth/refresh, POST /api/auth/logout
affects: [02-03, 02-04, 03-open311, 04-core-case-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - LDAP bind via LdapContextSource (user-supplied credentials used only for bind, never stored/logged)
    - ResponseCookie with httpOnly=true + sameSite=Strict + secure=true for auth_token issuance and clearing
    - @AuthenticationPrincipal CustomUserDetails for authenticated endpoint injection
    - Auto-create Person with role=staff for new LDAP users (admin role never auto-granted)

key-files:
  created:
    - backend/src/main/java/com/ureport/domain/Person.java
    - backend/src/main/java/com/ureport/domain/PersonRepository.java
    - backend/src/main/java/com/ureport/auth/dto/LdapLoginRequest.java
    - backend/src/main/java/com/ureport/auth/dto/AuthMeResponse.java
    - backend/src/main/java/com/ureport/auth/dto/PersonMapper.java
    - backend/src/main/java/com/ureport/auth/LdapAuthService.java
    - backend/src/main/java/com/ureport/auth/AuthController.java
  modified: []

key-decisions:
  - "PersonMapper uses @Mapping(target = expiresAt, ignore = true) — expiresAt set explicitly from JWT expiry in controller, not from Person entity"
  - "LdapAuthService auto-creates Person with role=staff for new LDAP users — admin role never auto-granted from LDAP (T-02-10 accepted risk)"
  - "Password never logged in LdapAuthService per TechArch security requirement (T-02-08 mitigated)"
  - "POST /api/auth/ldap returns 503 when ldap.enabled=false, 401 on bad credentials — distinct HTTP status codes for disabled vs failed"

patterns-established:
  - "Pattern 1: ResponseCookie.from(auth_token, token).httpOnly(true).sameSite(Strict).secure(true) — all token issuance and clearing uses this exact pattern"
  - "Pattern 2: @AuthenticationPrincipal CustomUserDetails for extracting user identity in protected endpoints — consistent with SecurityConfig population"

# Metrics
duration: 2min
completed: 2026-07-06
---

# Phase 2 Plan 2: LDAP Auth + AuthController Summary

**LDAP-to-JWT cookie auth flow via Spring LDAP bind with Person JPA entity, PersonRepository, MapStruct DTO mapping, and full auth endpoint suite (ldap/me/refresh/logout)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-06T23:35:25Z
- **Completed:** 2026-07-06T23:37:27Z
- **Tasks:** 2 completed
- **Files modified:** 7

## Accomplishments
- Person JPA entity mapping `people` table with exact snake_case column mapping (id, firstname, middlename, lastname, username UNIQUE/40, role/30, department_id)
- PersonRepository Spring Data JPA interface with `findByUsername(String)` derived query
- LdapLoginRequest DTO with `@NotBlank @Size(max=40)` username and password (never logged/stored per TechArch)
- AuthMeResponse record matching TechArch §4.3: personId, username, role, firstname, lastname, expiresAt (ISO 8601 UTC)
- PersonMapper MapStruct interface mapping Person.id → personId, ignoring expiresAt (set from JWT expiry)
- LdapAuthService: LDAP bind via LdapContextSource, ldap.enabled guard, auto-creates Person with role=staff for new users, returns signed JWT
- AuthController: full endpoint suite with correct HTTP status codes (200/401/503) and secure auth_token cookie attributes

## Task Commits

Each task was committed atomically:

1. **Task 1: Person JPA entity + PersonRepository + DTOs + MapStruct mapper** - `71e4f50` (feat)
2. **Task 2: LdapAuthService + AuthController with full auth endpoint suite** - `86ff314` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `backend/src/main/java/com/ureport/domain/Person.java` - JPA entity mapping people table (id, firstname, middlename, lastname, username, role, department_id)
- `backend/src/main/java/com/ureport/domain/PersonRepository.java` - Spring Data JPA repository with findByUsername
- `backend/src/main/java/com/ureport/auth/dto/LdapLoginRequest.java` - Record DTO with @NotBlank @Size(max=40) username + password fields
- `backend/src/main/java/com/ureport/auth/dto/AuthMeResponse.java` - Record DTO with personId, username, role, firstname, lastname, expiresAt
- `backend/src/main/java/com/ureport/auth/dto/PersonMapper.java` - MapStruct interface mapping Person → AuthMeResponse (id→personId, expiresAt ignored)
- `backend/src/main/java/com/ureport/auth/LdapAuthService.java` - LDAP bind auth service with ldap.enabled guard and auto-person creation
- `backend/src/main/java/com/ureport/auth/AuthController.java` - REST controller with /ldap, /me, /refresh, /logout endpoints

## Decisions Made
- PersonMapper ignores `expiresAt` (not on Person entity) — set explicitly from JWT expiry date in AuthController and from `Instant.now() + expirySeconds` in /me
- LdapAuthService auto-creates Person with role=staff for new LDAP users — admin role never auto-granted from LDAP (accepted risk T-02-10)
- Password field never assigned to a variable, never passed to any logger — mitigates T-02-08 information disclosure
- 503 for ldap.enabled=false vs 401 for bad credentials — distinguishable HTTP semantics for ops/monitoring

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — all files compiled successfully on first attempt.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full LDAP auth → JWT cookie flow implemented
- Person entity and PersonRepository available for downstream use (CAS auth, case management)
- AUTH-01 (JWT issuance on successful auth, refresh, logout) complete
- Ready for Phase 2 Plan 03: CAS authentication integration (02-03)
- Ready for Phase 2 Plan 04: Route-level authorization enforcement (02-04) — AUTH-02

## Self-Check: PASSED

- ✅ `backend/src/main/java/com/ureport/domain/Person.java` — exists
- ✅ `backend/src/main/java/com/ureport/domain/PersonRepository.java` — exists
- ✅ `backend/src/main/java/com/ureport/auth/dto/LdapLoginRequest.java` — exists
- ✅ `backend/src/main/java/com/ureport/auth/dto/AuthMeResponse.java` — exists
- ✅ `backend/src/main/java/com/ureport/auth/dto/PersonMapper.java` — exists
- ✅ `backend/src/main/java/com/ureport/auth/LdapAuthService.java` — exists
- ✅ `backend/src/main/java/com/ureport/auth/AuthController.java` — exists
- ✅ Commit `71e4f50` — feat(02-02): Task 1
- ✅ Commit `86ff314` — feat(02-02): Task 2

---
*Phase: 02-authentication-security*
*Completed: 2026-07-06*
