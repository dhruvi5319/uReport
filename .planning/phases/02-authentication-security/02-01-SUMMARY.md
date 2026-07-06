---
phase: 02-authentication-security
plan: 01
subsystem: auth
tags: [jwt, spring-security, jjwt, mapstruct, csrf, cors]

# Dependency graph
requires: []
provides:
  - Spring Security FilterChain with exact route authorization rules (public/staff/admin)
  - JwtService: HS256 JWT sign/validate/parse using JJWT 0.12.3
  - JwtAuthFilter: OncePerRequestFilter extracting auth_token cookie → SecurityContextHolder
  - CustomUserDetails: Spring UserDetails with personId, username, role
  - CSRF Double-Submit Cookie (XSRF-TOKEN non-httpOnly + X-XSRF-TOKEN header)
  - Spring Boot backend Maven project foundation
affects: [02-02, 02-03, 02-04, 03-open311, 04-core-case-management]

# Tech tracking
tech-stack:
  added:
    - spring-boot-starter-security 3.2.5
    - spring-security-ldap
    - jjwt-api 0.12.3
    - jjwt-impl 0.12.3 (runtime)
    - jjwt-jackson 0.12.3 (runtime)
    - mapstruct 1.6.0
    - mapstruct-processor 1.6.0 (provided)
    - h2 (test scope)
    - spring-security-test (test scope)
  patterns:
    - JWT in httpOnly auth_token cookie (XSS mitigation)
    - CSRF Double-Submit Cookie (XSRF-TOKEN non-httpOnly, X-XSRF-TOKEN header)
    - OncePerRequestFilter for JWT extraction and SecurityContextHolder population
    - Custom AuthenticationEntryPoint returning 401 JSON (not HTML redirect)
    - Role-based authorization via hasRole/hasAnyRole in SecurityConfig

key-files:
  created:
    - backend/pom.xml
    - backend/src/main/java/com/ureport/UReportApplication.java
    - backend/src/main/java/com/ureport/security/JwtService.java
    - backend/src/main/java/com/ureport/security/CustomUserDetails.java
    - backend/src/main/java/com/ureport/security/JwtAuthFilter.java
    - backend/src/main/java/com/ureport/security/SecurityConfig.java
    - backend/src/main/resources/application.yml
    - backend/src/test/java/com/ureport/security/SecurityConfigTest.java
    - backend/src/test/resources/application-test.yml
  modified: []

key-decisions:
  - "Used JJWT 0.12.x API (Jwts.builder().subject(), Jwts.SIG.HS256, Jwts.parser().verifyWith()) — not legacy 0.11.x API"
  - "CookieCsrfTokenRepository.withHttpOnlyFalse() + CsrfTokenRequestAttributeHandler for Spring Security 6 Double-Submit Cookie"
  - "H2 in-memory database for tests with Flyway disabled + LDAP/DB health indicators off — avoids external dependencies in unit test context"
  - "Custom AuthenticationEntryPoint and AccessDeniedHandler return JSON (not HTML redirect) for SPA compatibility"

patterns-established:
  - "Pattern 1: JWT auth via auth_token cookie (not Authorization header) — consistent with XSS mitigation decision"
  - "Pattern 2: SecurityConfig route table mirrors TechArch §5.4 exactly — future phases add routes following same pattern"
  - "Pattern 3: @ActiveProfiles('test') + application-test.yml for Spring Boot integration tests needing isolated context"

# Metrics
duration: 3min
completed: 2026-07-06
---

# Phase 2 Plan 1: Spring Security Foundation Summary

**HS256 JWT via auth_token cookie using JJWT 0.12.3, with CSRF Double-Submit Cookie protection and exact TechArch §5.4 route authorization rules in Spring Security 6**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-06T23:29:08Z
- **Completed:** 2026-07-06T23:32:43Z
- **Tasks:** 2 completed
- **Files modified:** 9

## Accomplishments
- Spring Boot backend project created with all required dependencies (security, JJWT 0.12.3, MapStruct 1.6.0)
- JwtService: full HS256 sign/validate/parse using JJWT 0.12.x API with generateToken/validateToken/extractClaims/extractUsername/extractPersonId/extractRole/extractExpiration
- CustomUserDetails: Spring UserDetails implementation with personId, username, role fields and ROLE_ prefix convention
- JwtAuthFilter (OncePerRequestFilter): extracts auth_token cookie, validates via JwtService, populates SecurityContextHolder; returns 401 JSON on invalid token
- SecurityConfig: complete route authorization table per TechArch §5.4 — public (Open311, auth endpoints, actuator/health), staff/admin (tickets write, departments/categories), admin-only (people DELETE)
- CSRF Double-Submit Cookie: CookieCsrfTokenRepository.withHttpOnlyFalse() + CsrfTokenRequestAttributeHandler; Open311 and auth endpoints CSRF-exempt
- SecurityConfigTest: 5 tests all passing — public routes not 401, invalid JWT returns 401, actuator health accessible

## Task Commits

Each task was committed atomically:

1. **Task 1: Add security/JWT/MapStruct dependencies; implement JwtService and CustomUserDetails** - `19d2cc3` (feat)
2. **Task 2: Write SecurityConfig + JwtAuthFilter; configure CSRF Double-Submit Cookie + CORS** - `3ad1d8b` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `backend/pom.xml` - Spring Boot 3.2.5 Maven project with spring-security, JJWT 0.12.3, MapStruct 1.6.0, H2 test
- `backend/src/main/java/com/ureport/UReportApplication.java` - @SpringBootApplication main class
- `backend/src/main/java/com/ureport/security/JwtService.java` - HS256 JWT sign/validate/parse service
- `backend/src/main/java/com/ureport/security/CustomUserDetails.java` - Spring UserDetails with personId/role
- `backend/src/main/java/com/ureport/security/JwtAuthFilter.java` - OncePerRequestFilter for auth_token cookie JWT extraction
- `backend/src/main/java/com/ureport/security/SecurityConfig.java` - Full SecurityFilterChain with route authorization + CSRF + CORS
- `backend/src/main/resources/application.yml` - Spring Boot config with jwt/ldap/cas sections
- `backend/src/test/java/com/ureport/security/SecurityConfigTest.java` - 5 security integration tests
- `backend/src/test/resources/application-test.yml` - H2 test context with Flyway/LDAP health disabled

## Decisions Made
- Used JJWT 0.12.x fluent API (`Jwts.builder().subject()`, `Jwts.SIG.HS256`, `Jwts.parser().verifyWith()`) — not legacy 0.11.x API
- Spring Security 6 CSRF: `CookieCsrfTokenRepository.withHttpOnlyFalse()` + `CsrfTokenRequestAttributeHandler` (required for Spring Security 6 compatibility)
- H2 in-memory database for tests with Flyway disabled + LDAP/DB health indicators disabled
- Custom AuthenticationEntryPoint returns JSON 401 (not HTML redirect) for SPA compatibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `status().isNotEqualTo(int)` — method doesn't exist in Spring MVC Test**
- **Found during:** Task 2 (SecurityConfigTest compilation)
- **Issue:** The plan's test code used `status().isNotEqualTo(401)` which is not a valid method on `StatusResultMatchers`
- **Fix:** Replaced with `status().is(not(401))` using Hamcrest `not()` matcher — equivalent semantics
- **Files modified:** `backend/src/test/java/com/ureport/security/SecurityConfigTest.java`
- **Verification:** Tests compile and all 5 pass
- **Committed in:** 3ad1d8b (Task 2 commit)

**2. [Rule 1 - Bug] Fixed actuator health returning 503 due to LDAP health check failure**
- **Found during:** Task 2 (SecurityConfigTest execution)
- **Issue:** `spring-security-ldap` auto-registers an LDAP health indicator; in the test context it tries to connect to `localhost:389` which doesn't exist → health returns DOWN (503)
- **Fix:** Added `management.health.ldap.enabled: false` and `management.health.db.enabled: false` to `application-test.yml`
- **Files modified:** `backend/src/test/resources/application-test.yml`
- **Verification:** `actuatorHealth_isPublic` test now passes (200 OK)
- **Committed in:** 3ad1d8b (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 - Bug)
**Impact on plan:** Both fixes necessary for test correctness. No scope changes.

## Issues Encountered
None — all issues resolved via auto-fix rules.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- JWT security infrastructure complete: JwtService, JwtAuthFilter, SecurityConfig, CustomUserDetails
- Ready for Phase 2 Plan 02: LDAP authentication integration (02-02)
- Ready for Phase 2 Plan 03: CAS authentication integration (02-03)
- SecurityContextHolder populated with CustomUserDetails — downstream controllers can use `@AuthenticationPrincipal CustomUserDetails user` pattern

## Self-Check: PASSED

- ✅ `backend/src/main/java/com/ureport/security/JwtService.java` — exists
- ✅ `backend/src/main/java/com/ureport/security/SecurityConfig.java` — exists
- ✅ `backend/src/main/java/com/ureport/security/JwtAuthFilter.java` — exists
- ✅ `backend/src/main/java/com/ureport/security/CustomUserDetails.java` — exists
- ✅ `backend/src/test/java/com/ureport/security/SecurityConfigTest.java` — exists
- ✅ `backend/pom.xml` — exists
- ✅ Commit `19d2cc3` — feat(02-01): Task 1
- ✅ Commit `3ad1d8b` — feat(02-01): Task 2
- ✅ Commit `caba623` — docs(02-01): metadata

---
*Phase: 02-authentication-security*
*Completed: 2026-07-06*
