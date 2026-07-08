---
phase: 02-authentication-security
plan: "01"
subsystem: security
tags: [spring-security, jwt, csrf, cors, mapstruct, ldap]
dependency_graph:
  requires: []
  provides:
    - backend/src/main/java/com/ureport/security/JwtService.java
    - backend/src/main/java/com/ureport/security/SecurityConfig.java
    - backend/src/main/java/com/ureport/security/JwtAuthFilter.java
    - backend/src/main/java/com/ureport/security/CustomUserDetails.java
  affects:
    - backend/pom.xml
    - backend/src/main/resources/application.yml
tech_stack:
  added:
    - spring-security-ldap
    - mapstruct 1.6.0
    - mapstruct-processor 1.6.0
  patterns:
    - JWT HS256 via JJWT 0.12.x
    - OncePerRequestFilter for JWT extraction
    - CSRF Double-Submit Cookie (CookieCsrfTokenRepository withHttpOnlyFalse)
    - CORS via CorsConfigurationSource bean
key_files:
  created: []
  modified:
    - backend/pom.xml
    - backend/src/main/java/com/ureport/security/JwtAuthFilter.java
    - backend/src/main/java/com/ureport/security/SecurityConfig.java
    - backend/src/main/java/com/ureport/security/JwtUtil.java
decisions:
  - JJWT already at 0.12.5 (plan specified 0.12.3) — kept 0.12.5 (newer patch, same API)
  - JwtUtil fixed to use correct property path jwt.secret (was app.jwt.secret — pre-existing bug)
  - SecurityConfigTest kept with @ActiveProfiles("test") + embedded-postgres (no H2 in pom)
metrics:
  duration: 8min
  completed_date: "2026-07-08"
  tasks_completed: 2
  files_modified: 4
---

# Phase 02 Plan 01: Spring Security Foundation Summary

**One-liner:** JWT HS256 filter chain with CSRF Double-Submit Cookie, full TechArch §5.4 route authorization table, and MapStruct/spring-security-ldap dependencies.

## What Was Built

### JwtService.java (pre-existing, verified)
Complete JJWT 0.12.x service with `generateToken(Long, String, String)`, `validateToken(String)`, `extractClaims(String)`, `extractUsername`, `extractPersonId`, `extractRole`, `extractExpiration`. Signs HS256 JWTs with sub/personId/role/iat/exp/iss claims.

### CustomUserDetails.java (pre-existing, verified)
`UserDetails` implementation with `personId` (Long), `username` (String), `role` (String) fields. `getAuthorities()` returns `ROLE_{ROLE}` for Spring Security role checks.

### JwtAuthFilter.java (rewritten)
`OncePerRequestFilter` that:
- Extracts `auth_token` cookie from request
- On valid token: populates `SecurityContextHolder` with `UsernamePasswordAuthenticationToken`
- On invalid/expired token: returns **401 JSON immediately** (not just unauthenticated-proceed)
- On no cookie: passes through to next filter

### SecurityConfig.java (rewritten)
Full `SecurityFilterChain` with:
- CSRF Double-Submit Cookie: `CookieCsrfTokenRepository.withHttpOnlyFalse()` — XSRF-TOKEN is non-httpOnly for React to read; Open311, CAS, auth endpoints are CSRF-exempt
- CORS: allows localhost:5173, localhost:3000, production origin; exposes X-XSRF-TOKEN header
- Route authorization from TechArch §5.4: public (Open311, auth, categories/public, swagger, actuator), ADMIN-only (DELETE /api/people/**), STAFF/ADMIN (departments/**, categories/**, ticket writes), authenticated (/api/**), denyAll for unmatched
- JWT filter added before `UsernamePasswordAuthenticationFilter`
- 401/403 JSON responses via custom `authenticationEntryPoint` / `accessDeniedHandler`

### pom.xml (updated)
Added:
- `spring-security-ldap` (for LDAP auth in 02-02)
- `mapstruct 1.6.0` + `mapstruct-processor 1.6.0` (provided)
- `mapstruct-processor` in `maven-compiler-plugin` annotationProcessorPaths

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed JwtUtil property path mismatch**
- **Found during:** Task 2
- **Issue:** `JwtUtil` used `${app.jwt.secret}` which doesn't exist; correct property is `${jwt.secret}`. Bean initialization would fail at startup.
- **Fix:** Updated `JwtUtil` constructor to use `${jwt.secret}` and `${jwt.expiry-seconds:28800}`; fixed field from `expirationMs` to `expiryMs` (correctly multiplying by 1000)
- **Files modified:** `backend/src/main/java/com/ureport/security/JwtUtil.java`
- **Commit:** a1e93a8

**2. [Scope note] JJWT version 0.12.5 vs 0.12.3**
- Plan specified 0.12.3; pom.xml already had 0.12.5. Kept 0.12.5 as it's a newer patch release with the same 0.12.x API.

**3. [Scope note] SecurityConfigTest kept with @ActiveProfiles("test")**
- Plan specified `@TestPropertySource` with H2. H2 is not a project dependency. The existing test uses `@ActiveProfiles("test")` + embedded-postgres (already configured). Functionally equivalent — all 5 test cases are present and test the same behavior.

## Commits

| Hash    | Type | Description |
|---------|------|-------------|
| 21d147b | feat | Add spring-security-ldap and MapStruct 1.6.0 deps to pom.xml |
| a1e93a8 | feat | Implement JwtAuthFilter, SecurityConfig with full route auth table + CSRF |

## Self-Check: PASSED

Files verified to exist:
- ✓ backend/src/main/java/com/ureport/security/JwtService.java
- ✓ backend/src/main/java/com/ureport/security/SecurityConfig.java
- ✓ backend/src/main/java/com/ureport/security/JwtAuthFilter.java
- ✓ backend/src/main/java/com/ureport/security/CustomUserDetails.java
- ✓ backend/pom.xml (spring-security-ldap, mapstruct confirmed)
- ✓ backend/src/main/resources/application.yml (jwt/ldap/cas blocks confirmed)
- ✓ backend/src/test/java/com/ureport/security/SecurityConfigTest.java

Contract checks passed:
- ✓ JwtService: generateToken/validateToken/extractClaims present
- ✓ CustomUserDetails: implements UserDetails, private Long personId, private String role
- ✓ JwtAuthFilter: extends OncePerRequestFilter
- ✓ SecurityConfig: SecurityFilterChain securityFilterChain method present
- ✓ SecurityConfig: auth_token cookie name in JwtAuthFilter
- ✓ SecurityConfig: open311/v2/** permitted + CSRF-exempt
- ✓ SecurityConfig: CookieCsrfTokenRepository.withHttpOnlyFalse() (XSRF-TOKEN)

Commits verified:
- ✓ 21d147b present in git log
- ✓ a1e93a8 present in git log

Tests written — execution deferred to verify phase.
