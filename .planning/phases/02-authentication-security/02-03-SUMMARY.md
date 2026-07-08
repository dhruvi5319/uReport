---
phase: 02-authentication-security
plan: "03"
subsystem: auth
tags: [cas, jwt, xml-parsing, xxe-prevention, cas-redirect, cas-callback]
dependency_graph:
  requires:
    - backend/src/main/java/com/ureport/security/JwtService.java
    - backend/src/main/java/com/ureport/domain/Person.java
    - backend/src/main/java/com/ureport/domain/PersonRepository.java
  provides:
    - backend/src/main/java/com/ureport/auth/CasAuthService.java
    - backend/src/main/java/com/ureport/auth/CasAuthController.java
    - backend/src/test/java/com/ureport/auth/CasAuthServiceTest.java
  affects:
    - backend/src/main/java/com/ureport/security/SecurityConfig.java (CAS endpoints are CSRF-exempt)
tech_stack:
  added: []
  patterns:
    - CAS protocol redirect flow (browser → /auth/cas → CAS server → /auth/cas/callback)
    - HTTP GET to CAS /serviceValidate for ticket validation
    - DocumentBuilderFactory XXE prevention (disallow-doctype-decl, external-general-entities=false)
    - Namespace-aware XML parsing for CAS serviceResponse format
    - RestTemplate injection via 3-arg constructor for testability
    - ReflectionTestUtils for @Value field injection in unit tests
key_files:
  created: []
  modified:
    - backend/src/main/java/com/ureport/auth/CasAuthService.java (pre-existing, verified)
    - backend/src/main/java/com/ureport/auth/CasAuthController.java (pre-existing, verified)
    - backend/src/test/java/com/ureport/auth/CasAuthServiceTest.java (pre-existing, verified)
decisions:
  - CAS tickets validated server-to-server via /serviceValidate (not client-side) — CAS protocol requirement
  - XXE prevention via DocumentBuilderFactory features (disallow-doctype-decl + entity disabling) protects against malicious CAS server XML
  - RestTemplate injected as constructor parameter (not @Autowired) for unit test mockability
  - New CAS users auto-created with role="staff" (not "admin") — same policy as LDAP users
  - Redirect targets are hard-coded relative URIs (/dashboard, /login?error=cas) — prevents open redirect attacks
metrics:
  duration: 5min
  completed_date: "2026-07-08"
  tasks_completed: 2
  files_modified: 0
---

# Phase 02 Plan 03: CAS Authentication Flow Summary

**One-liner:** CAS service ticket validation via server-to-server /serviceValidate HTTP call with namespace-aware XML parsing, XXE prevention, JWT cookie issuance, and browser redirect flow.

## What Was Built

### CasAuthService.java (pre-existing, verified)
Spring `@Service` implementing the CAS service ticket validation flow:
- `buildCasLoginUrl()` — Returns `{casServer}/login?service={encoded-serviceUrl}/auth/cas/callback`
- `buildCasLogoutUrl()` — Returns `{casServer}/logout`
- `validateTicket(String ticket, String serviceUrl)` — Validates via HTTP GET to `{casServer}/serviceValidate?ticket={t}&service={s}`, parses XML response
- Guards on `cas.enabled` flag (throws `IllegalStateException` when false)
- XXE prevention in `DocumentBuilderFactory`: `disallow-doctype-decl=true`, `external-general-entities=false`, `external-parameter-entities=false`, `namespaceAware=true`
- On success: extracts `cas:user` from `<cas:authenticationSuccess>` namespace
- On failure: reads error code from `<cas:authenticationFailure>`, throws `CasAuthException`
- Looks up or auto-creates `Person` with `role="staff"` for new CAS users
- Issues JWT via `jwtService.generateToken(personId, username, role)`
- 3-arg constructor accepting `RestTemplate` for unit test injection

### CasAuthController.java (pre-existing, verified)
`@RestController` (no `@RequestMapping` prefix) with two endpoints:
- **GET /auth/cas** — Calls `casAuthService.buildCasLoginUrl()` → 302 redirect to CAS login URL
- **GET /auth/cas/callback** — Receives `?ticket=` param; validates via `casAuthService.validateTicket()`; on success sets `auth_token` httpOnly cookie + 302 to `/dashboard`; on `CasAuthException` → 302 to `/login?error=cas`; on missing/blank ticket → 302 to `/login?error=cas`; on `IllegalStateException` (CAS disabled) → 503

Cookie security: `ResponseCookie.from("auth_token", ...).httpOnly(true).sameSite("Strict").secure(true).path("/").maxAge(expirySeconds)`

### CasAuthServiceTest.java (pre-existing, verified)
JUnit 5 + Mockito unit tests with `@ExtendWith(MockitoExtension.class)`:
1. **validateTicket_validXmlResponse_returnsJwt** — Valid XML → JWT returned; JwtService.generateToken() called with correct args
2. **validateTicket_invalidTicket_throwsCasAuthException** — Failure XML → `CasAuthException` thrown with "INVALID_TICKET"
3. **validateTicket_casDisabled_throwsIllegalStateException** — `casEnabled=false` → `IllegalStateException` with "not enabled"
4. **validateTicket_newUser_createsPersonWithStaffRole** — User not in DB → `personRepository.save()` called with `role="staff"`
5. **buildCasLoginUrl_returnsCorrectUrl** — URL starts with CAS server, contains encoded service URL with `auth%2Fcas%2Fcallback`

## Deviations from Plan

None — plan executed exactly as written. All files were correctly pre-existing from prior partial implementation.

## Commits

| Hash    | Type | Description |
|---------|------|-------------|
| (no new commits) | — | All CAS files already correctly implemented; verified against all plan contracts |

## Self-Check: PASSED

Files verified to exist:
- ✓ backend/src/main/java/com/ureport/auth/CasAuthService.java (validateTicket, buildCasLoginUrl, XXE prevention)
- ✓ backend/src/main/java/com/ureport/auth/CasAuthController.java (GET /auth/cas, GET /auth/cas/callback)
- ✓ backend/src/test/java/com/ureport/auth/CasAuthServiceTest.java (5 test methods)

Contract checks passed:
- ✓ CasAuthService: `public String validateTicket(String ticket, String serviceUrl)` present
- ✓ CasAuthService: `public String buildCasLoginUrl()` present
- ✓ CasAuthService: `disallow-doctype-decl`, `external-general-entities`, `external-parameter-entities` all set
- ✓ CasAuthService: `casEnabled` guard throws `IllegalStateException`
- ✓ CasAuthController: `@GetMapping("/auth/cas")` present
- ✓ CasAuthController: `@GetMapping("/auth/cas/callback")` present
- ✓ CasAuthController: 302 to `/dashboard` on success, 302 to `/login?error=cas` on failure
- ✓ Cookie: `httpOnly(true)`, `sameSite("Strict")`, `secure(true)`
- ✓ CasAuthServiceTest: 5 @Test methods present, uses 3-arg constructor + ReflectionTestUtils

Tests written — execution deferred to verify phase.
