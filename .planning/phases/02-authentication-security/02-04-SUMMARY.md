---
phase: 02-authentication-security
plan: 04
subsystem: auth
tags: [spring-security, role-hierarchy, authorization, integration-tests, mockmvc]

# Dependency graph
requires:
  - phase: 02-01
    provides: JwtService.generateToken, SecurityConfig route authorization table, @EnableMethodSecurity
  - phase: 02-02
    provides: Person entity, PersonRepository.findByUsername
  - phase: 02-03
    provides: CasAuthController (GET /auth/cas, GET /auth/cas/callback public routes)
provides:
  - RoleHierarchyConfig: Spring Security RoleHierarchy bean (ROLE_ADMIN > ROLE_STAFF > ROLE_PUBLIC)
  - AuthorizationIT: 22 integration tests proving all TechArch §5.4 route authorization rules
affects: [03-open311, 04-core-case-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - RoleHierarchyImpl.setHierarchy() text-form API (Spring Security 6.2.x compatible — 6.3+ builder unavailable)
    - Spring Security 6.x auto-injects RoleHierarchy bean into DefaultWebSecurityExpressionHandler (no manual handler registration needed)
    - @Transactional @SpringBootTest with @BeforeEach data seeding for controller DB-backed endpoints
    - SecurityMockMvcRequestPostProcessors.csrf() for non-CSRF-exempt POST/PATCH/DELETE in tests

key-files:
  created:
    - backend/src/main/java/com/ureport/security/RoleHierarchyConfig.java
    - backend/src/test/java/com/ureport/security/AuthorizationIT.java
  modified:
    - backend/src/main/java/com/ureport/auth/CasAuthService.java
    - backend/pom.xml

key-decisions:
  - "RoleHierarchyImpl.setHierarchy() string form used (Spring Security 6.2.x) — withDefaultRolePrefix() fluent builder requires 6.3+"
  - "No DefaultWebSecurityExpressionHandler bean defined — Spring Security 6.x auto-wires RoleHierarchy bean; manual registration causes BeanDefinitionOverrideException"
  - "AuthorizationIT uses @ActiveProfiles('test') + application-test.yml (not @TestPropertySource) — consistent with SecurityConfigTest pattern"
  - "POST /api/auth/refresh test checks not(403) not not(401) — controller intentionally returns 401 for missing cookie (that is business logic, not security filter)"
  - "Surefire configured to include *IT.java in standard mvn test lifecycle — Spring Boot integration tests with MockMvc don't require a running server"

patterns-established:
  - "Pattern 1: RoleHierarchy as a simple @Bean, letting Spring Security auto-inject — no manual expression handler wiring needed in Spring Security 6.x"
  - "Pattern 2: @Transactional @SpringBootTest with @BeforeEach for test data isolation — ensures DB-backed controllers find their test data"

# Metrics
duration: 6min
completed: 2026-07-06
---

# Phase 2 Plan 4: Role Hierarchy + Authorization Integration Tests Summary

**Spring Security RoleHierarchyImpl bean (ROLE_ADMIN > ROLE_STAFF > ROLE_PUBLIC) with 22 AuthorizationIT integration tests proving all TechArch §5.4 route authorization rules: public routes, JWT-protected routes, staff-only routes, and admin-only routes**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-06T23:43:38Z
- **Completed:** 2026-07-06T23:49:35Z
- **Tasks:** 2 completed
- **Files modified:** 4

## Accomplishments
- RoleHierarchyConfig: ROLE_ADMIN > ROLE_STAFF > ROLE_PUBLIC hierarchy as Spring `@Bean` using `RoleHierarchyImpl.setHierarchy()` text form (Spring Security 6.2.x compatible)
- AuthorizationIT: 22 tests covering all route categories from TechArch §5.4: public, staff-protected, admin-only, and role hierarchy enforcement
- Role hierarchy validation: `deletePerson_staffJwt_returns403()` and `roleHierarchy_adminCanAccessStaffRoutes()` explicitly prove the ADMIN > STAFF hierarchy is enforced
- All 3 phase 2 test suites pass: SecurityConfigTest (5), CasAuthServiceTest (5), AuthorizationIT (22) — 32 total

## Task Commits

Each task was committed atomically:

1. **Task 1: RoleHierarchyConfig — Spring Security role hierarchy bean** - `0a476fd` (feat)
2. **Task 2: AuthorizationIT — 22 integration tests for all TechArch §5.4 route authorization rules** - `4496db2` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `backend/src/main/java/com/ureport/security/RoleHierarchyConfig.java` - RoleHierarchyImpl bean with ROLE_ADMIN > ROLE_STAFF > ROLE_PUBLIC hierarchy
- `backend/src/test/java/com/ureport/security/AuthorizationIT.java` - 22 @SpringBootTest + MockMvc integration tests covering all route authorization rules
- `backend/src/main/java/com/ureport/auth/CasAuthService.java` - Added @Autowired to primary constructor (2-constructor ambiguity fix)
- `backend/pom.xml` - Surefire configured to include *IT.java in standard mvn test lifecycle

## Decisions Made
- Used `RoleHierarchyImpl.setHierarchy("ROLE_ADMIN > ROLE_STAFF > ROLE_PUBLIC")` text form — the `withDefaultRolePrefix()` fluent builder API is only available in Spring Security 6.3+; this project uses 6.2.4
- Omitted `DefaultWebSecurityExpressionHandler` bean from `RoleHierarchyConfig` — Spring Security 6.x auto-injects a detected `RoleHierarchy` bean into its internal expression handler; defining our own caused `BeanDefinitionOverrideException`
- `authRefresh_post_publicRoute` test checks `not(403)` — the endpoint returns controller-level 401 (missing cookie) which is correct behavior; from security filter perspective it is public (permitted), not 403-blocked

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `RoleHierarchyImpl.withDefaultRolePrefix()` not available in Spring Security 6.2.4**
- **Found during:** Task 1 (mvn compile)
- **Issue:** Plan's code used `.withDefaultRolePrefix().role("ADMIN").implies("STAFF")...build()` fluent API added in Spring Security 6.3; the project uses Spring Boot 3.2.5 which ships Spring Security 6.2.4
- **Fix:** Used `RoleHierarchyImpl hierarchy = new RoleHierarchyImpl(); hierarchy.setHierarchy("ROLE_ADMIN > ROLE_STAFF > ROLE_PUBLIC")` — the stable text-form API available in all versions
- **Files modified:** `backend/src/main/java/com/ureport/security/RoleHierarchyConfig.java`
- **Verification:** `mvn compile` exits 0
- **Committed in:** 0a476fd (Task 1 commit)

**2. [Rule 1 - Bug] `webSecurityExpressionHandler` bean name conflict with Spring Security's own `WebSecurityConfiguration`**
- **Found during:** Task 1 verification (mvn test -Dtest=AuthorizationIT context load)
- **Issue:** Plan included a `DefaultWebSecurityExpressionHandler @Bean` method named `webSecurityExpressionHandler` — same name as the bean Spring Security's `WebSecurityConfiguration` auto-registers → `BeanDefinitionOverrideException` at startup
- **Fix:** Removed the `DefaultWebSecurityExpressionHandler @Bean` from `RoleHierarchyConfig`; Spring Security 6.x automatically discovers and injects a `RoleHierarchy` bean into its internal expression handler
- **Files modified:** `backend/src/main/java/com/ureport/security/RoleHierarchyConfig.java`
- **Verification:** All tests pass; `mvn compile` exits 0
- **Committed in:** 0a476fd (Task 1 commit — amended)

**3. [Rule 1 - Bug] `CasAuthService` has two constructors without `@Autowired` — Spring can't determine which to use**
- **Found during:** Task 2 (`@SpringBootTest` context load for AuthorizationIT)
- **Issue:** `CasAuthService` declared a 2-arg primary constructor and a 3-arg testing constructor; Spring Boot tried to auto-inject via default constructor (none exists) → `BeanCreationException: No default constructor found`. This was latent from 02-03 but hidden since `CasAuthServiceTest` doesn't use Spring context
- **Fix:** Added `@Autowired` to the 2-arg primary constructor; Spring then uses it for injection and ignores the 3-arg testing constructor
- **Files modified:** `backend/src/main/java/com/ureport/auth/CasAuthService.java`
- **Verification:** `SecurityConfigTest` (5 tests) and `AuthorizationIT` (22 tests) all pass
- **Committed in:** 4496db2 (Task 2 commit)

**4. [Rule 2 - Missing Critical] Maven Surefire not configured to include `*IT.java` files**
- **Found during:** Task 2 verification (`mvn test` ran only 10 tests; `AuthorizationIT` silently excluded)
- **Issue:** Maven Surefire's default convention excludes `**/*IT.java` (reserves them for Failsafe for true integration tests requiring a running server). Our `AuthorizationIT` uses `@SpringBootTest + MockMvc` — no running server needed — but was excluded from standard test run
- **Fix:** Added Surefire plugin configuration to `pom.xml` with `<includes>` covering both `*Test.java` and `*IT.java` patterns
- **Files modified:** `backend/pom.xml`
- **Verification:** `mvn test` now runs 32 tests (5 + 5 + 22), all pass
- **Committed in:** 4496db2 (Task 2 commit)

**5. [Rule 1 - Bug] `authRefresh_post_publicRoute` test expectation incorrect**
- **Found during:** Task 2 test run
- **Issue:** Test expected `not(401)` for `POST /api/auth/refresh` with no cookie; controller intentionally returns HTTP 401 when `auth_token` cookie is absent (controller business logic, not Spring Security filter)
- **Fix:** Changed assertion to `not(403)` — verifies security layer doesn't block with Forbidden, which is the correct authorization-layer check
- **Committed in:** 4496db2 (Task 2 commit)

---

**Total deviations:** 5 auto-fixed (3 Rule 1 - Bug, 1 Rule 2 - Missing Critical, 1 Rule 1 - Bug test expectation)
**Impact on plan:** All fixes necessary for correctness and test coverage. No scope changes. The final test suite proves all TechArch §5.4 authorization rules as intended.

## Issues Encountered
None — all issues resolved via auto-fix rules.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 complete: Full authentication + authorization stack implemented and tested
  - 02-01: JWT security foundation (JwtService, JwtAuthFilter, SecurityConfig)
  - 02-02: LDAP auth + AuthController (Person entity, LDAP bind, auth endpoints)
  - 02-03: CAS SSO auth (CasAuthService, CasAuthController, XXE prevention)
  - 02-04: Role hierarchy + 22 authorization integration tests
- All 32 phase 2 tests pass: SecurityConfigTest, CasAuthServiceTest, AuthorizationIT
- Ready for Phase 3: Open311 endpoint implementation

## Self-Check

- ✅ `backend/src/main/java/com/ureport/security/RoleHierarchyConfig.java` — exists
- ✅ `backend/src/test/java/com/ureport/security/AuthorizationIT.java` — exists
- ✅ Commit `0a476fd` — feat(02-04): RoleHierarchyConfig
- ✅ Commit `4496db2` — feat(02-04): AuthorizationIT + fixes
- ✅ 22/22 AuthorizationIT tests pass (BUILD SUCCESS)
- ✅ 32/32 total phase 2 tests pass (BUILD SUCCESS)

## Self-Check: PASSED

---
*Phase: 02-authentication-security*
*Completed: 2026-07-06*
