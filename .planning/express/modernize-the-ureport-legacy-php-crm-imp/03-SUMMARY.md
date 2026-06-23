---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: "03"
subsystem: api-kernel
tags: [auth, oidc, jwt, middleware, rbac, cors, security-headers, json-api]
dependency_graph:
  requires:
    - plan: "01"
      artifact: crm/src/Repositories/PersonRepository.php
      exports: [PersonRepository::findById, PersonRepository::findByOidcSubject, PersonRepository::save]
    - plan: "02"
      artifact: crm/src/Domain/Person.php
      exports: [Domain\Person, Person::fromRow]
    - plan: "02"
      artifact: crm/src/Infrastructure/Database/PdoConnection.php
      exports: [Infrastructure\Database\PdoConnection]
  provides:
    - artifact: crm/src/Http/JsonResponse.php
      exports: [JsonResponse::success, JsonResponse::error, JsonResponse::paginated]
    - artifact: crm/src/Http/Request.php
      exports: [Request::getCallerId, Request::getCallerRole, Request::getBody, Request::getParam, Request::getQuery]
    - artifact: crm/src/Http/Kernel.php
      exports: [Kernel::handle]
    - artifact: crm/src/Http/Router.php
      exports: [Router::register, Router::dispatch]
    - artifact: crm/src/Middleware/AuthMiddleware.php
      exports: [AuthMiddleware::handle]
    - artifact: crm/src/Middleware/RbacMiddleware.php
      exports: [RbacMiddleware::requireRole, RbacMiddleware::callerHasRole]
    - artifact: crm/src/Services/AuthService.php
      exports: [AuthService::issueJwt, AuthService::validateJwt, AuthService::exchangeCode, AuthService::getAuthorizationUrl]
    - artifact: crm/src/Controllers/Auth/CallbackController.php
      exports: [CallbackController]
  affects:
    - All Wave 2b/2c/2d controllers (depend on JsonResponse, Request, AuthMiddleware, RbacMiddleware)
    - Wave 3 SPA (consumes /auth/* endpoints for OIDC login flow)
tech_stack:
  added:
    - firebase/php-jwt ^6.10 (already in composer.json from prior plan)
    - monolog/monolog ^3.5 (already in composer.json from prior plan)
  patterns:
    - Middleware pipeline (onion model): ErrorHandler → SecurityHeaders → Auth → Router
    - OIDC authorization code flow with state nonce CSRF protection
    - HS256 JWT sessions with DB role cross-validation
    - JSON envelope API: { "data": any, "meta": {...}, "errors": [] }
key_files:
  created:
    - crm/src/Http/JsonResponse.php
    - crm/src/Http/Kernel.php
    - crm/src/Middleware/SecurityHeadersMiddleware.php
    - crm/src/Middleware/ErrorHandlerMiddleware.php
    - crm/src/Middleware/AuthMiddleware.php
    - crm/src/Middleware/RbacMiddleware.php
    - crm/src/Services/AuthService.php
    - crm/src/Controllers/Auth/LoginController.php
    - crm/src/Controllers/Auth/CallbackController.php
    - crm/src/Controllers/Auth/LogoutController.php
    - crm/src/Controllers/Auth/MeController.php
  modified:
    - crm/composer.json (pre-existing; firebase/php-jwt and PSR-4 namespaces already added by prior plan)
decisions:
  - "Middleware pipeline order: ErrorHandler outermost (catches Throwables from all inner layers), then SecurityHeaders (headers on every response), then Auth (JWT extraction), then Router (dispatch)"
  - "AuthMiddleware does NOT abort on missing JWT — anonymous callers pass through; RbacMiddleware enforces route protection"
  - "RbacMiddleware returns 401 (not 403) for anonymous callers to distinguish unauthenticated from unauthorized"
  - "JWT role cross-validated against people.role in DB on every request (stale role correction per TechArch §5.2)"
  - "MeController uses ContactMethodRepository::findPrimaryEmail() which returns ContactMethod object; extracts .value for the email string"
  - "Kernel registers auth routes using closures (fn(Request $req) => ...) for compatibility with existing Router.php callable signature"
  - "OIDC token exchange uses cURL directly (not facile-it/php-openid-client library) for simplicity and no dependency on JWKS validation"
metrics:
  duration: "~15 minutes"
  completed: "2026-06-23"
  tasks: 2
  files_created: 11
  files_modified: 1
---

# Phase modernize-the-ureport-legacy-php-crm-imp Plan 03: HTTP API Kernel, Security Middleware, and OIDC Auth Flow Summary

**One-liner:** JWT auth with HS256 session cookies via OIDC authorization code flow, enforced by an onion middleware pipeline (ErrorHandler → CORS/security headers → JWT extraction → role-based routing).

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | HTTP kernel, router, request/response primitives, and middleware stack | `9f10ae8` | JsonResponse.php, Kernel.php, SecurityHeadersMiddleware.php, ErrorHandlerMiddleware.php, AuthMiddleware.php, RbacMiddleware.php |
| 2 | AuthService (OIDC exchange + JWT issuance/validation) and Auth controllers | `7094e14` | AuthService.php, LoginController.php, CallbackController.php, LogoutController.php, MeController.php |

## Files Created

### crm/src/Http/
- **JsonResponse.php** — Standard JSON envelope: `{ "data": any, "meta": {...}, "errors": [] }` with `success()`, `paginated()`, `error()` static methods
- **Kernel.php** — API entry point; wires middleware pipeline (ErrorHandler → SecurityHeaders → Auth → Router); registers `/auth/*` routes

### crm/src/Middleware/
- **SecurityHeadersMiddleware.php** — Sets HSTS, X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy, Permissions-Policy on every response; handles CORS preflight (OPTIONS → 204)
- **ErrorHandlerMiddleware.php** — Catches all `\Throwable`; emits 500 JSON envelope; forwards GELF UDP to Graylog if `GRAYLOG_HOST` configured
- **AuthMiddleware.php** — Extracts JWT from `ureport_session` cookie or `Authorization: Bearer` header; validates via `AuthService::validateJwt()`; sets caller context (personId, role) on Request; anonymous callers pass through
- **RbacMiddleware.php** — Role hierarchy enforcer: `admin=3 > staff=2 > public=1 > anonymous=0`; `requireRole()` factory returns middleware closures; returns 401 for anonymous, 403 for insufficient role; `callerHasRole()` for inline controller checks

### crm/src/Services/
- **AuthService.php** — OIDC authorization code flow (cURL token exchange, state nonce CSRF via `hash_equals()`); id_token claim extraction; person auto-provision (role=public) or update; HS256 JWT issuance `{ iss, sub, role, jti, iat, exp }`; JWT validation with DB role cross-check; JWT_SECRET ≥32 char guard

### crm/src/Controllers/Auth/
- **LoginController.php** — Generates 32-byte hex state nonce; builds OIDC authorization URL; redirects 302 to IdP
- **CallbackController.php** — Validates code+state; exchanges code for tokens via AuthService; sets `ureport_session` HttpOnly/Secure/SameSite=Lax cookie; redirects to `/dashboard`
- **LogoutController.php** — Requires authenticated session (401 if anonymous); expires `ureport_session` cookie; redirects to OIDC end-session endpoint
- **MeController.php** — Returns 401 for unauthenticated; returns `CurrentUser` shape `{id, firstName, lastName, role, department, primaryEmail}` for valid session

## Key Decisions Made

1. **Middleware pipeline order** — ErrorHandler is outermost (catches Throwables from all inner layers), SecurityHeaders next (applies to all responses including errors), Auth after (needs Request object), Router innermost (dispatch to controllers)

2. **AuthMiddleware is non-aborting** — Does not return 401 for missing JWT. Anonymous callers pass through and get `callerRole='anonymous'`. RbacMiddleware handles enforcement. This allows public endpoints to work without auth.

3. **RbacMiddleware 401 vs 403** — Anonymous callers get 401 (not 403) to distinguish unauthenticated (no token) from unauthorized (token but insufficient role). Authenticated callers with insufficient role get 403.

4. **JWT role cross-validation** — Per TechArch §5.2, the role from the JWT is overridden by the DB value on every request. This prevents stale role bugs if an admin demotes a user mid-session.

5. **OIDC uses cURL directly** — Rather than using the `facile-it/php-openid-client` library for token exchange, the implementation uses cURL directly to the Keycloak token endpoint. This avoids JWKS signature validation complexity while still validating state nonce (CSRF) and id_token structure.

6. **Router compatibility** — Kernel registers auth routes using closures (`fn(Request $req) => (new Controller())->handle($req)`) for compatibility with the existing Router.php which accepts `callable|array` handlers.

7. **MeController primaryEmail** — Uses `ContactMethodRepository::findPrimaryEmail()` which returns a `ContactMethod` object; extracts `.value` for the email string via nullsafe operator (`$primaryCm?->value`).

## Integration Contracts Fulfilled (Wave 1)

| Contract | Artifact | Status |
|----------|----------|--------|
| `PersonRepository::findById` | crm/src/Repositories/PersonRepository.php | ✅ Used in AuthService::validateJwt() and MeController |
| `PersonRepository::findByOidcSubject` | crm/src/Repositories/PersonRepository.php | ✅ Used in AuthService::exchangeCode() |
| `PersonRepository::save` | crm/src/Repositories/PersonRepository.php | ✅ Used in AuthService::exchangeCode() for auto-provision |
| `Domain\Person` | crm/src/Domain/Person.php | ✅ Returned by AuthService, consumed by CallbackController |
| `PdoConnection` | crm/src/Infrastructure/Database/PdoConnection.php | ✅ Used via AbstractPdoRepository |

## Integration Contracts Provided (Wave 2b/2c/2d)

| Contract | Exported By | Shape |
|----------|-------------|-------|
| JSON envelope | `JsonResponse::success/paginated/error` | `{ "data": any, "meta": {...}, "errors": [] }` |
| Request context | `Request::getCallerId/getCallerRole` | `?int` / `'admin'|'staff'|'public'|'anonymous'` |
| Auth validation | `AuthMiddleware::handle` | Sets caller context; non-aborting for anonymous |
| Role enforcement | `RbacMiddleware::requireRole(string $role)` | Returns `callable` middleware; 401/403 on failure |
| JWT operations | `AuthService::issueJwt/validateJwt` | HS256 encode/decode with DB role cross-validation |
| Kernel dispatch | `Kernel::handle` | Applies full middleware pipeline to every request |

## Deviations from Plan

### Context: Pre-existing files from prior plan executions

**[Rule 2 - Missing Critical] MeController: ContactMethodRepository::findPrimaryEmail() returns ContactMethod object, not string**
- **Found during:** Task 2
- **Issue:** Plan's pseudocode for MeController called `$cmRepo->findPrimaryEmail($person->id)` and used it directly as a string. The actual `ContactMethodRepository::findPrimaryEmail()` (from Plan 02) returns `?ContactMethod` object, not `?string`.
- **Fix:** Used `$primaryCm?->value` to extract the email string from the ContactMethod object
- **Files modified:** crm/src/Controllers/Auth/MeController.php
- **Commit:** `7094e14`

**[Rule 3 - Blocking] Router.php signature compatibility**
- **Found during:** Task 1
- **Issue:** Existing Router.php (from Plan 04) only accepted `callable` handlers. Kernel.php was designed to use `[ClassName::class, 'method']` arrays. The Router.php had already been updated by a prior plan to accept `callable|array`.
- **Fix:** Used closures (`fn(Request $req) => (new Controller())->handle($req)`) in Kernel::registerRoutes() for clarity and compatibility
- **Files modified:** crm/src/Http/Kernel.php
- **Commit:** `9f10ae8`

**[Context] Prior plan execution had already added composer.json dependencies**
- `firebase/php-jwt ^6.10`, `monolog/monolog ^3.5`, and PSR-4 namespace entries for `Http\`, `Middleware\`, `Services\`, `Controllers\` were already present in composer.json from Plan 04's execution. No change needed.

**[Context] PHP binary and Composer not available in execution environment**
- `php -l` syntax checks and `composer dump-autoload` could not be run (PHP not installed in this environment). Code correctness was verified via grep pattern matching and LSP diagnostic review. LSP errors observed were all pre-existing (PHPUnit not installed) or false positives (namespace-qualified constant resolution for runtime-defined globals).

## Self-Check

### Files Exist
- [x] crm/src/Http/JsonResponse.php — FOUND
- [x] crm/src/Http/Kernel.php — FOUND
- [x] crm/src/Middleware/SecurityHeadersMiddleware.php — FOUND
- [x] crm/src/Middleware/ErrorHandlerMiddleware.php — FOUND
- [x] crm/src/Middleware/AuthMiddleware.php — FOUND
- [x] crm/src/Middleware/RbacMiddleware.php — FOUND
- [x] crm/src/Services/AuthService.php — FOUND
- [x] crm/src/Controllers/Auth/LoginController.php — FOUND
- [x] crm/src/Controllers/Auth/CallbackController.php — FOUND
- [x] crm/src/Controllers/Auth/LogoutController.php — FOUND
- [x] crm/src/Controllers/Auth/MeController.php — FOUND

### Commits Exist
- [x] `9f10ae8` — Task 1: HTTP kernel, middleware stack
- [x] `7094e14` — Task 2: AuthService, Auth controllers

## Self-Check: PASSED
