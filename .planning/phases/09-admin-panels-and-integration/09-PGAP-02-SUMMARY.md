---
phase: 09-admin-panels-and-integration
plan: PGAP-02
subsystem: auth
tags: [spring-boot, h2, bcrypt, jwt, dev-seed, contact-methods, issue-types, dev-login]

# Dependency graph
requires:
  - phase: 09-admin-panels-and-integration
    provides: SecurityConfig, JwtService, Person entity with passwordHash
provides:
  - DevDataSeeder seeding contact methods (Phone, Email, Walk-in, Mail)
  - DevDataSeeder seeding V1-matching issue types (Comment, Complaint, Question, Report, Request, Violation)
  - DevDataSeeder seeding devadmin Person with BCrypt password_hash
  - DevDataSeeder seeding 10 system actions matching V1 migration
  - DevDataSeeder seeding category groups as Streets, Sanitation, Other
  - POST /api/auth/dev-login endpoint (@Profile("dev") only) for local JWT auth
affects: [SEARCH-02, all authenticated /api/** endpoints in dev profile]

# Tech tracking
tech-stack:
  added: [BCryptPasswordEncoder (spring-security already in pom)]
  patterns: [Dev-profile-only controller via @Profile("dev"), seed-before-serve via CommandLineRunner, BCrypt password validation for dev auth]

key-files:
  created:
    - backend/src/main/java/com/ureport/auth/DevLoginController.java
  modified:
    - backend/src/main/java/com/ureport/config/DevDataSeeder.java
    - backend/src/main/java/com/ureport/security/SecurityConfig.java
    - backend/src/main/resources/application-dev.yml

key-decisions:
  - "DevLoginController is @Profile(\"dev\") — not registered in production; SecurityConfig permitAll for /api/auth/dev-login is harmless in prod (404 no route)"
  - "BCryptPasswordEncoder validates password against hash stored by DevDataSeeder — plaintext never persisted"
  - "Cookie secure(false) for HTTP localhost dev — production CAS/LDAP flow uses HTTPS only"
  - "Issue type names corrected to V1 migration names: Comment, Complaint, Question, Report, Request, Violation"

patterns-established:
  - "Dev-only seeding: CommandLineRunner @Bean in @Profile(\"dev\") @Configuration class"
  - "Dev-only endpoints: @Profile(\"dev\") @RestController with SecurityConfig permitAll for the login path"

# Metrics
duration: 2min
completed: 2026-07-09
---

# Phase 9 Plan PGAP-02: Dev Data Seed + Dev Login Summary

**H2 dev seed enhanced with contact methods, V1-matching issue types, BCrypt-hashed admin person, and dev-only POST /api/auth/dev-login endpoint for JWT acquisition without LDAP**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-09T21:20:17Z
- **Completed:** 2026-07-09T21:22:41Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- Added contact methods seeding to DevDataSeeder (was completely missing): Phone, Email, Walk-in, Mail
- Fixed issue type names in DevDataSeeder to match V1 migration exactly: Comment, Complaint, Question, Report, Request, Violation (were: Complaint, Service Request, Inquiry, Compliment, Suggestion, Other)
- Added devadmin Person seeding with BCrypt-hashed password so dev-mode authentication works
- Corrected category group names to match V1 migration: Streets, Sanitation, Other
- Added 10 system actions matching V1 migration names (was 6 non-matching names)
- Created DevLoginController.java with `@Profile("dev")` — POST /api/auth/dev-login validates BCrypt password and returns auth_token httpOnly cookie
- Added POST /api/auth/dev-login to SecurityConfig permitAll (safe — endpoint doesn't exist in prod, returns 404)

## Dev Credentials

- **Endpoint:** `POST /api/auth/dev-login`
- **Credentials:** `{"username": "devadmin", "password": "admin123"}`
- **Response:** 200 + `Set-Cookie: auth_token=<jwt>; HttpOnly; SameSite=Strict`
- **Failure:** 401 on wrong credentials

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance DevDataSeeder with contact methods and seeded admin person** - `57eb554` (feat)
2. **Task 2: Create DevLoginController for password-based JWT auth in dev profile** - `c880e7b` (feat)

## Files Created/Modified

- `backend/src/main/java/com/ureport/config/DevDataSeeder.java` - Enhanced with contact methods, V1 issue types, admin person, V1 action names, V1 category groups
- `backend/src/main/java/com/ureport/auth/DevLoginController.java` - NEW: dev-profile-only POST /api/auth/dev-login endpoint
- `backend/src/main/java/com/ureport/security/SecurityConfig.java` - Added permitAll for POST /api/auth/dev-login
- `backend/src/main/resources/application-dev.yml` - Added dev-login usage comment

## Decisions Made

- Used `@Profile("dev")` on DevLoginController to ensure the endpoint is never registered in production — the SecurityConfig permitAll for `/api/auth/dev-login` is harmless in prod (no route = 404)
- BCrypt work factor (default 10) accepted for dev-only login — ~100ms per attempt is fine with no rate limiting needed for dev endpoint
- `secure(false)` on the auth_token cookie for HTTP localhost compatibility in dev (no HTTPS)
- Dev credentials (devadmin/admin123) hardcoded in DevDataSeeder as a disposable H2 in-memory DB — risk accepted as documented in threat model

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. All changes run automatically on `mvn spring-boot:run -Dspring.profiles.active=dev`.

## Next Phase Readiness

- Dev authentication fully functional: devs can `POST /api/auth/dev-login` to get a JWT cookie and exercise all authenticated API endpoints
- Contact methods, issue types (V1-matching), category groups, departments, and actions all seeded in dev H2 on startup
- SEARCH-02 (bookmark save) can proceed — requires seeded Person for FK reference (now provided)
- All UAT gaps addressed by this gap plan: ADMIN-01, F6, F7, F8, F13

---
*Phase: 09-admin-panels-and-integration*
*Completed: 2026-07-09*

## Self-Check: PASSED

- FOUND: DevDataSeeder.java
- FOUND: DevLoginController.java
- FOUND: SecurityConfig.java
- FOUND: application-dev.yml
- FOUND: SUMMARY.md
- FOUND: Task 1 commit 57eb554
- FOUND: Task 2 commit c880e7b
