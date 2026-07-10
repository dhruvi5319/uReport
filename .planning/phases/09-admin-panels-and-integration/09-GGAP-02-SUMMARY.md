---
phase: 09-admin-panels-and-integration
plan: GGAP-02
subsystem: testing
tags: [java, spring-boot, zonky, embedded-postgres, integration-tests, webmvctest, ldap, open311]

# Dependency graph
requires:
  - phase: 09-admin-panels-and-integration
    provides: AuthController, LdapAuthService, Open311GoldenFileIT, ApplicationSmokeIT baseline
provides:
  - Open311GoldenFileIT with Person FK seed — all 8 tests pass, no DataIntegrityViolationException
  - application-test.yml with spring.datasource block removed — Zonky blank-URL wins, actuator UP
  - ApplicationSmokeIT ldapAuth_whenLdapDisabled_returns503 asserting 503 (correct behavior)
  - LdapAuthControllerTest @WebMvcTest verifying BadCredentialsException → 401
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "findByUsername guard pattern for idempotent test seed (mirrors existing Client guard)"
    - "@WebMvcTest + @MockBean JwtAuthFilter pattern for controller unit tests requiring security filter chain"
    - "Removing hardcoded datasource URL from test classpath YAML so Zonky auto-configuration wins"

key-files:
  created:
    - backend/src/test/java/com/ureport/auth/LdapAuthControllerTest.java
  modified:
    - backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java
    - backend/src/test/resources/application-test.yml
    - backend/src/test/java/com/ureport/smoke/ApplicationSmokeIT.java

key-decisions:
  - "Zonky EmbeddedPostgresAutoConfiguration requires blank datasource.url in test-classpath YAML; hardcoded jdbc:postgresql://localhost:5432 overrides it and causes Hikari connection failure"
  - "@WebMvcTest requires @MockBean JwtAuthFilter to satisfy security filter chain autowiring"
  - "ldap.enabled=false → IllegalStateException → 503 (not 401); renamed test to reflect actual behavior"

patterns-established:
  - "Person seed pattern: personRepository.findByUsername guard + setContactPerson before clientRepository.save"
  - "@WebMvcTest security mocking: @MockBean LdapAuthService + @MockBean JwtAuthFilter + @MockBean JwtService + @MockBean PersonRepository"

# Metrics
duration: 2min
completed: 2026-07-09
---

# Phase 9 Plan GGAP-02: Backend Test Suite Gap Closure Summary

**Fixed Open311GoldenFileIT DataIntegrityViolationException (Person FK seed) and ApplicationSmokeIT datasource override (Zonky wins); added LdapAuthControllerTest @WebMvcTest verifying BadCredentialsException → 401**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-07-09T23:06:58Z
- **Completed:** 2026-07-09T23:08:28Z
- **Tasks:** 2 completed
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- Open311GoldenFileIT now seeds a `Person` ("test-contact") before creating `Client` and calls `client.setContactPerson(contact)` — satisfies the `contact_person_id NOT NULL` FK constraint, eliminating the `DataIntegrityViolationException` that was failing all 8 tests
- `src/test/resources/application-test.yml` `spring.datasource` block fully removed — Zonky's `EmbeddedPostgresAutoConfiguration` now auto-configures the DataSource bean with its own blank-URL mechanism; actuator health returns UP
- `ApplicationSmokeIT.ldapAuth_withBadCredentials_returns401` renamed to `ldapAuth_whenLdapDisabled_returns503` and assertion corrected to `SERVICE_UNAVAILABLE` — `ldap.enabled=false` triggers `IllegalStateException` → 503, not 401
- New `LdapAuthControllerTest` (`@WebMvcTest`) mocks `LdapAuthService` to throw `BadCredentialsException` and verifies `AuthController` returns 401; includes required `@MockBean JwtAuthFilter` for security filter chain startup

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Open311GoldenFileIT — seed Person before creating Client** - `f530109` (fix)
2. **Task 2: Fix ApplicationSmokeIT datasource + LDAP assertion; add LdapAuthControllerTest** - `f2ec4a4` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java` — Added `PersonRepository` @Autowired, @BeforeEach Person seed with `findByUsername` guard, `client.setContactPerson(contact)` before save
- `backend/src/test/resources/application-test.yml` — Removed `spring.datasource` block (url/driver/username/password); remaining JPA/Flyway/JWT/LDAP/CAS properties intact
- `backend/src/test/java/com/ureport/smoke/ApplicationSmokeIT.java` — Renamed test to `ldapAuth_whenLdapDisabled_returns503`; assertion changed to `HttpStatus.SERVICE_UNAVAILABLE`
- `backend/src/test/java/com/ureport/auth/LdapAuthControllerTest.java` — New file: `@WebMvcTest(AuthController.class)` with `@MockBean LdapAuthService`, `@MockBean JwtAuthFilter`, `@MockBean JwtService`, `@MockBean PersonRepository`; tests `BadCredentialsException → 401`

## Decisions Made

- **Zonky datasource auto-config:** Zonky's `EmbeddedPostgresAutoConfiguration` requires the test-classpath `datasource.url` to be blank/absent so it can register its own DataSource bean first. The hardcoded `jdbc:postgresql://localhost:5432/ureport` in `src/test/resources/application-test.yml` was overriding it, causing Hikari to attempt a real connection to a non-existent PostgreSQL instance.
- **JwtAuthFilter @MockBean mandatory:** `@WebMvcTest` loads the full Spring Security filter chain. `SecurityConfig` injects `JwtAuthFilter` (a `@Component`) into that chain. Without `@MockBean JwtAuthFilter`, the test context fails to start with `UnsatisfiedDependencyException`.
- **503 not 401 when LDAP disabled:** `LdapAuthService.authenticate()` throws `IllegalStateException` when `ldap.enabled=false`. `AuthController` catches `IllegalStateException` and returns 503. The 401 path is for `BadCredentialsException` (valid LDAP, wrong creds) — handled in the new `LdapAuthControllerTest` unit test.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 4 gaps closed by this plan: Open311GoldenFileIT 8/8 pass; ApplicationSmokeIT 4/4 pass (actuator UP, Open311 200, LDAP-disabled 503, tickets 401)
- UAT Tests 13 and 14 gap resolution complete
- Phase 9 gap closure plans complete

## Self-Check: PASSED

- ✅ `backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java` exists
- ✅ `backend/src/test/resources/application-test.yml` exists
- ✅ `backend/src/test/java/com/ureport/smoke/ApplicationSmokeIT.java` exists
- ✅ `backend/src/test/java/com/ureport/auth/LdapAuthControllerTest.java` exists
- ✅ Commit `f530109` (Task 1) found in git log
- ✅ Commit `f2ec4a4` (Task 2) found in git log

---
*Phase: 09-admin-panels-and-integration*
*Completed: 2026-07-09*
