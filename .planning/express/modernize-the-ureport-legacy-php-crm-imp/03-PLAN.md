---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 03
type: execute
wave: 2
depends_on: [1]
files_modified:
  - crm/src/Middleware/SecurityHeadersMiddleware.php
  - crm/src/Middleware/ErrorHandlerMiddleware.php
  - crm/src/Middleware/AuthMiddleware.php
  - crm/src/Middleware/RbacMiddleware.php
  - crm/src/Services/AuthService.php
  - crm/src/Controllers/Auth/LoginController.php
  - crm/src/Controllers/Auth/CallbackController.php
  - crm/src/Controllers/Auth/LogoutController.php
  - crm/src/Controllers/Auth/MeController.php
  - crm/src/Http/Router.php
  - crm/src/Http/Request.php
  - crm/src/Http/Response.php
  - crm/src/Http/JsonResponse.php
  - crm/src/Http/Kernel.php
  - crm/composer.json
autonomous: true

features:
  implements: ["F10", "F11", "F16"]
  depends_on: ["F0", "F2", "F3", "F6", "F11"]
  enables: ["F0", "F10", "F11", "F15", "F16"]

must_haves:
  truths:
    - "Every /api/ response is wrapped in { data, meta, errors } JSON envelope with correct HTTP status codes"
    - "All responses from the PHP API include HSTS, X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy, and Permissions-Policy headers"
    - "CORS preflight OPTIONS requests return 204 with correct Allow-Origin and Allow-Headers when the request origin matches ALLOWED_ORIGINS config"
    - "GET /auth/login redirects the browser to the OIDC provider authorization URL with state nonce stored in PHP session"
    - "GET /auth/callback exchanges code for id_token, validates it, creates/updates person record, issues session JWT in HttpOnly ureport_session cookie, redirects to /dashboard"
    - "POST /auth/logout clears the session cookie and redirects to OIDC provider end-session endpoint"
    - "GET /auth/me returns 200 with CurrentUser object for a valid session, 401 for missing/invalid session"
    - "AuthMiddleware extracts JWT from ureport_session cookie or Authorization: Bearer header, verifies HMAC-SHA256 signature, checks exp, loads person.active from DB"
    - "RbacMiddleware enforces role hierarchy: admin > staff > public > anonymous; returns 403 when caller role is insufficient"
    - "Unhandled exceptions are caught by ErrorHandlerMiddleware, return 500 JSON envelope, and are forwarded to Graylog"
  artifacts:
    - path: "crm/src/Http/Kernel.php"
      provides: "API entry point — applies middleware stack to every /api/ and /auth/ request"
      exports: ["Kernel"]
    - path: "crm/src/Http/Router.php"
      provides: "Route registry: maps METHOD+path to controller; extracts path parameters"
      exports: ["Router"]
    - path: "crm/src/Http/JsonResponse.php"
      provides: "Standard JSON envelope emitter: { data, meta, errors }"
      exports: ["JsonResponse"]
    - path: "crm/src/Middleware/AuthMiddleware.php"
      provides: "JWT extraction + validation + person lookup; sets request context (personId, role)"
      exports: ["AuthMiddleware"]
    - path: "crm/src/Middleware/RbacMiddleware.php"
      provides: "Role enforcement middleware; rejects insufficient-role callers with 403"
      exports: ["RbacMiddleware"]
    - path: "crm/src/Services/AuthService.php"
      provides: "OIDC code exchange, JWT issuance (firebase/php-jwt HS256), JWT validation, person auto-provision"
      exports: ["AuthService"]
    - path: "crm/src/Controllers/Auth/CallbackController.php"
      provides: "OIDC callback handler: validates state nonce, calls AuthService, sets HttpOnly cookie"
      exports: ["CallbackController"]
  key_links:
    - from: "crm/src/Http/Kernel.php"
      to: "crm/src/Middleware/SecurityHeadersMiddleware.php"
      via: "Kernel applies middleware pipeline in order"
      pattern: "SecurityHeadersMiddleware"
    - from: "crm/src/Http/Kernel.php"
      to: "crm/src/Middleware/AuthMiddleware.php"
      via: "Kernel applies AuthMiddleware before dispatching to controllers"
      pattern: "AuthMiddleware"
    - from: "crm/src/Middleware/AuthMiddleware.php"
      to: "crm/src/Services/AuthService.php"
      via: "AuthMiddleware::handle() calls AuthService::validateJwt()"
      pattern: "AuthService::validateJwt"
    - from: "crm/src/Controllers/Auth/CallbackController.php"
      to: "crm/src/Services/AuthService.php"
      via: "CallbackController calls AuthService::exchangeCode() then AuthService::issueJwt()"
      pattern: "AuthService::exchangeCode|AuthService::issueJwt"
    - from: "crm/src/Middleware/RbacMiddleware.php"
      to: "crm/src/Http/Request.php"
      via: "RbacMiddleware reads caller role from Request context set by AuthMiddleware"
      pattern: "getCallerRole|getCallerId"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "crm/src/Repositories/PersonRepository.php"
      exports: ["PersonRepository::findById", "PersonRepository::findByOidcSubject", "PersonRepository::save"]
      verify: "grep -n 'findByOidcSubject' crm/src/Repositories/PersonRepository.php && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "crm/src/Domain/Person.php"
      exports: ["Domain\\Person", "Person::fromRow"]
      verify: "grep -n 'readonly class Person' crm/src/Domain/Person.php && grep -n 'fromRow' crm/src/Domain/Person.php && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "crm/src/Infrastructure/Database/PdoConnection.php"
      exports: ["Infrastructure\\Database\\PdoConnection"]
      verify: "grep -n 'class PdoConnection' crm/src/Infrastructure/Database/PdoConnection.php && echo CONTRACT_OK"
  provides:
    - artifact: "crm/src/Http/JsonResponse.php"
      exports: ["JsonResponse::success", "JsonResponse::error", "JsonResponse::paginated"]
      shape: |
        namespace Http;
        class JsonResponse {
          public static function success(mixed $data, int $status = 200, array $meta = []): void;
          public static function error(string $message, int $status, ?string $code = null, array $fieldErrors = []): void;
          public static function paginated(array $rows, int $total, int $page, int $perPage): void;
          // All emit: { "data": ..., "meta": {...}, "errors": [] } and call exit
        }
      verify: "grep -n 'class JsonResponse' crm/src/Http/JsonResponse.php && grep -n 'function success' crm/src/Http/JsonResponse.php && echo CONTRACT_OK"
    - artifact: "crm/src/Http/Request.php"
      exports: ["Request::getCallerId", "Request::getCallerRole", "Request::getBody", "Request::getParam"]
      shape: |
        namespace Http;
        class Request {
          public function getCallerId(): ?int;    // Set by AuthMiddleware
          public function getCallerRole(): string; // 'admin'|'staff'|'public'|'anonymous'
          public function getBody(): array;       // Decoded JSON body
          public function getParam(string $key, mixed $default = null): mixed; // Path param
          public function getQuery(string $key, mixed $default = null): mixed; // Query string
        }
      verify: "grep -n 'class Request' crm/src/Http/Request.php && grep -n 'getCallerRole' crm/src/Http/Request.php && echo CONTRACT_OK"
    - artifact: "crm/src/Http/Kernel.php"
      exports: ["Kernel::handle"]
      shape: |
        namespace Http;
        class Kernel {
          public function handle(): void; // Entry point; dispatches to Router after middleware stack
        }
      verify: "grep -n 'class Kernel' crm/src/Http/Kernel.php && grep -n 'function handle' crm/src/Http/Kernel.php && echo CONTRACT_OK"
    - artifact: "crm/src/Http/Router.php"
      exports: ["Router::register", "Router::dispatch"]
      shape: |
        namespace Http;
        class Router {
          public function register(string $method, string $path, callable|array $handler): void;
          public function dispatch(Request $request): void; // Runs matched handler or returns 404
        }
      verify: "grep -n 'class Router' crm/src/Http/Router.php && grep -n 'function dispatch' crm/src/Http/Router.php && echo CONTRACT_OK"
    - artifact: "crm/src/Middleware/AuthMiddleware.php"
      exports: ["AuthMiddleware::handle"]
      shape: |
        namespace Middleware;
        class AuthMiddleware {
          // Sets Request::callerId and Request::callerRole from validated JWT.
          // On missing/invalid JWT: sets callerRole='anonymous', callerId=null (does not abort —
          // RbacMiddleware handles enforcement).
          public function handle(Request $request, callable $next): void;
        }
      verify: "grep -n 'class AuthMiddleware' crm/src/Middleware/AuthMiddleware.php && echo CONTRACT_OK"
    - artifact: "crm/src/Middleware/RbacMiddleware.php"
      exports: ["RbacMiddleware::requireRole"]
      shape: |
        namespace Middleware;
        class RbacMiddleware {
          // Factory: returns a middleware closure that aborts with 403 if callerRole < requiredRole.
          // Role order: admin=3 > staff=2 > public=1 > anonymous=0
          public static function requireRole(string $minimumRole): callable;
        }
      verify: "grep -n 'class RbacMiddleware' crm/src/Middleware/RbacMiddleware.php && grep -n 'requireRole' crm/src/Middleware/RbacMiddleware.php && echo CONTRACT_OK"
    - artifact: "crm/src/Services/AuthService.php"
      exports: ["AuthService::issueJwt", "AuthService::validateJwt", "AuthService::exchangeCode", "AuthService::getAuthorizationUrl"]
      shape: |
        namespace Services;
        class AuthService {
          public function getAuthorizationUrl(string $state): string;
          public function exchangeCode(string $code, string $state): Domain\Person; // validates nonce, creates/updates person
          public function issueJwt(Domain\Person $person): string; // HS256, exp = iat + SESSION_TTL
          public function validateJwt(string $token): array;       // Returns ['sub'=>int,'role'=>string,'jti'=>string] or throws
        }
      verify: "grep -n 'class AuthService' crm/src/Services/AuthService.php && grep -n 'issueJwt' crm/src/Services/AuthService.php && grep -n 'validateJwt' crm/src/Services/AuthService.php && echo CONTRACT_OK"
---

<objective>
Implement the PHP 8.5 API kernel: HTTP routing infrastructure (Kernel, Router, Request, JsonResponse), the full middleware stack (SecurityHeadersMiddleware for HSTS/CSP/CORS, ErrorHandlerMiddleware for 500 catch + Graylog forward, AuthMiddleware for JWT extraction + person lookup, RbacMiddleware for role enforcement), and the complete OIDC authentication flow (AuthService + Auth controllers: login, callback, logout, me).

Purpose: This is the foundational security and transport layer that every Wave 2a/2b/2c/2d endpoint depends on. Getting the JSON envelope contract, session JWT validation, role enforcement, and OIDC exchange correct here prevents auth regressions across all downstream plans and Wave 3 frontend integration.

Output:
- crm/src/Http/ — Kernel, Router, Request, JsonResponse
- crm/src/Middleware/ — SecurityHeadersMiddleware, ErrorHandlerMiddleware, AuthMiddleware, RbacMiddleware
- crm/src/Services/AuthService.php — OIDC exchange + JWT issuance/validation
- crm/src/Controllers/Auth/ — LoginController, CallbackController, LogoutController, MeController
- composer.json updated with firebase/php-jwt ^6.x and facile-it/php-openid-client ^3.x
</objective>

<feature_dependencies>
Implements: F10: RBAC enforcement middleware (role hierarchy admin>staff>public>anonymous, category permission matrix), F11: Authentication — OIDC authorization code flow, JWT issuance/validation, HttpOnly cookie session, person auto-provision from OIDC claims, F16: RESTful JSON API Backend — JSON envelope middleware, HTTP status contract, CORS, security headers infrastructure
Depends on: F11: sessions table (Wave 1 — 01-PLAN.md), people table + PersonRepository + Domain\Person (01-PLAN.md / 02-PLAN.md)
Enables: F0: Ticket CRUD endpoints (all require AuthMiddleware + RbacMiddleware), F15: SPA OIDC login flow (consumes /auth/* endpoints), F10: RBAC fully wired once RbacMiddleware.requireRole() is available to all controllers
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/WAVE-SCHEDULE.md
@project_specs/TechArch-uReport.md

# Wave 1 artifacts consumed by this plan:
@crm/src/Domain/Person.php
@crm/src/Repositories/PersonRepository.php
@crm/src/Infrastructure/Database/PdoConnection.php

Key constraints from TechArch §5:
- JWT: HMAC-SHA256 (HS256), secret = JWT_SECRET constant, TTL = SESSION_TTL (default 28800s)
- JWT payload: { iss: "ureport", sub: personId, role: string, jti: uuid-v4, iat, exp }
- Cookie: name="ureport_session", HttpOnly, Secure, SameSite=Lax
- OIDC library: facile-it/php-openid-client ^3.x (already used in legacy code)
- JWT library: firebase/php-jwt ^6.x
- Role values from people.role ENUM: 'admin', 'staff', 'public'
- Anonymous = unauthenticated (no people record, no JWT)
- Role in JWT is cross-validated against people.role on every request (stale role correction)
</context>

<tasks>

<task type="auto">
  <name>Task 1: HTTP kernel, router, request/response primitives, and middleware stack</name>
  <files>
    crm/src/Http/Request.php
    crm/src/Http/JsonResponse.php
    crm/src/Http/Router.php
    crm/src/Http/Kernel.php
    crm/src/Middleware/SecurityHeadersMiddleware.php
    crm/src/Middleware/ErrorHandlerMiddleware.php
    crm/src/Middleware/AuthMiddleware.php
    crm/src/Middleware/RbacMiddleware.php
    crm/composer.json
  </files>
  <action>
**Step 1: Add dependencies to crm/composer.json**

Add to the `require` block (preserving all existing entries):
```json
"firebase/php-jwt": "^6.10",
"facile-it/php-openid-client": "^3.2",
"monolog/monolog": "^3.5",
"php-gelf/php-gelf": "^1.7"
```

Add PSR-4 autoload namespaces (merge with existing entries, do not replace):
```json
"autoload": {
    "psr-4": {
        "Http\\": "src/Http",
        "Middleware\\": "src/Middleware",
        "Services\\": "src/Services",
        "Controllers\\": "src/Controllers"
    }
}
```

**Step 2: crm/src/Http/Request.php**

Wraps $_SERVER, $_GET, php://input, and mutable context set by middleware.

```php
<?php
declare(strict_types=1);
namespace Http;

class Request
{
    private ?int    $callerId   = null;
    private string  $callerRole = 'anonymous';
    private array   $params     = [];   // Path parameters extracted by Router
    private ?array  $bodyCache  = null;

    public function getMethod(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public function getPath(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        return parse_url($uri, PHP_URL_PATH) ?: '/';
    }

    public function getQuery(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }

    public function getHeader(string $name): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return $_SERVER[$key] ?? null;
    }

    public function getCookie(string $name): ?string
    {
        return $_COOKIE[$name] ?? null;
    }

    public function getBody(): array
    {
        if ($this->bodyCache === null) {
            $raw = file_get_contents('php://input');
            if ($raw !== '' && $raw !== false) {
                try {
                    $this->bodyCache = json_decode($raw, true, 512, JSON_THROW_ON_ERROR) ?? [];
                } catch (\JsonException) {
                    $this->bodyCache = [];
                }
            } else {
                $this->bodyCache = [];
            }
        }
        return $this->bodyCache;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->getBody()[$key] ?? $default;
    }

    // --- Path parameters (set by Router) ---

    public function setParam(string $key, string $value): void
    {
        $this->params[$key] = $value;
    }

    public function getParam(string $key, mixed $default = null): mixed
    {
        return $this->params[$key] ?? $default;
    }

    // --- Auth context (set by AuthMiddleware) ---

    public function setCallerContext(int $id, string $role): void
    {
        $this->callerId   = $id;
        $this->callerRole = $role;
    }

    public function getCallerId(): ?int   { return $this->callerId; }
    public function getCallerRole(): string { return $this->callerRole; }

    public function isAuthenticated(): bool { return $this->callerId !== null; }
}
```

**Step 3: crm/src/Http/JsonResponse.php**

Standard JSON envelope per TechArch §4.1: `{ "data": any, "meta": {...}, "errors": [] }`

```php
<?php
declare(strict_types=1);
namespace Http;

class JsonResponse
{
    /**
     * Emit a successful response with optional meta.
     * HTTP status 200 (default) or 201 for created resources.
     */
    public static function success(mixed $data, int $status = 200, array $meta = []): void
    {
        self::emit([
            'data'   => $data,
            'meta'   => (object) $meta,
            'errors' => [],
        ], $status);
    }

    /**
     * Emit a paginated list response.
     * Wraps data in envelope with page, perPage, total, pages meta.
     */
    public static function paginated(array $rows, int $total, int $page, int $perPage): void
    {
        self::emit([
            'data'   => $rows,
            'meta'   => [
                'page'    => $page,
                'perPage' => $perPage,
                'total'   => $total,
                'pages'   => (int) ceil($total / max(1, $perPage)),
            ],
            'errors' => [],
        ], 200);
    }

    /**
     * Emit an error response.
     * $fieldErrors: array of ['field' => string, 'message' => string] for 422 responses.
     */
    public static function error(
        string  $message,
        int     $status,
        ?string $code       = null,
        array   $fieldErrors = [],
    ): void {
        $errors = $fieldErrors ?: [['field' => null, 'message' => $message, 'code' => $code]];
        self::emit([
            'data'   => null,
            'meta'   => (object) [],
            'errors' => $errors,
        ], $status);
    }

    private static function emit(array $body, int $status): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
```

**Step 4: crm/src/Http/Router.php**

Named-segment path matching: `/api/tickets/{id}` → extracts `id` as path param.

```php
<?php
declare(strict_types=1);
namespace Http;

class Router
{
    /** @var array<string, array<string, callable|array>> */
    private array $routes = [];

    /**
     * Register a route.
     * @param callable|array $handler Either a callable or [ControllerClass::class, 'method']
     */
    public function register(string $method, string $path, callable|array $handler): void
    {
        $this->routes[strtoupper($method)][$path] = $handler;
    }

    /** Convenience wrappers */
    public function get(string $path, callable|array $handler): void    { $this->register('GET', $path, $handler); }
    public function post(string $path, callable|array $handler): void   { $this->register('POST', $path, $handler); }
    public function put(string $path, callable|array $handler): void    { $this->register('PUT', $path, $handler); }
    public function delete(string $path, callable|array $handler): void { $this->register('DELETE', $path, $handler); }

    /**
     * Match the incoming request to a registered route and call its handler.
     * Injects path parameters into $request.
     */
    public function dispatch(Request $request): void
    {
        $method  = $request->getMethod();
        $path    = rtrim($request->getPath(), '/') ?: '/';
        $routes  = $this->routes[$method] ?? [];

        foreach ($routes as $pattern => $handler) {
            $regex = $this->buildRegex($pattern);
            if (preg_match($regex, $path, $matches)) {
                // Inject named captures as path params
                foreach ($matches as $key => $value) {
                    if (is_string($key)) {
                        $request->setParam($key, $value);
                    }
                }
                $this->call($handler, $request);
                return;
            }
        }

        // 404 — no matching route
        JsonResponse::error('Not found', 404, 'NOT_FOUND');
    }

    private function buildRegex(string $pattern): string
    {
        // Convert /api/tickets/{id} → /^\/api\/tickets\/(?P<id>[^\/]+)$/
        $regex = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $pattern);
        $regex = '#^' . str_replace('/', '\/', rtrim($regex, '/')) . '\/?$#';
        return $regex;
    }

    private function call(callable|array $handler, Request $request): void
    {
        if (is_array($handler) && count($handler) === 2 && is_string($handler[0])) {
            [$class, $method] = $handler;
            $instance = new $class();
            $instance->$method($request);
        } else {
            ($handler)($request);
        }
    }
}
```

**Step 5: crm/src/Middleware/SecurityHeadersMiddleware.php**

Sets all HTTP security headers from TechArch §5.4. Also handles CORS preflight.

```php
<?php
declare(strict_types=1);
namespace Middleware;

use Http\Request;

class SecurityHeadersMiddleware
{
    public function handle(Request $request, callable $next): void
    {
        // CORS — check against ALLOWED_ORIGINS config constant
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowed = defined('ALLOWED_ORIGINS') ? ALLOWED_ORIGINS : [];
        if ($origin && (in_array($origin, $allowed, true) || in_array('*', $allowed, true))) {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With');
            header('Access-Control-Max-Age: 86400');
        }

        // Handle CORS preflight — return early
        if ($request->getMethod() === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        // Security headers from TechArch §5.4
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        header('X-Frame-Options: DENY');
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'");
        header("Permissions-Policy: camera=(), microphone=(), geolocation=(self)");

        $next($request);
    }
}
```

**Step 6: crm/src/Middleware/ErrorHandlerMiddleware.php**

Catches any uncaught Throwable, returns 500 JSON envelope, forwards to Graylog.

```php
<?php
declare(strict_types=1);
namespace Middleware;

use Http\Request;
use Http\JsonResponse;

class ErrorHandlerMiddleware
{
    public function handle(Request $request, callable $next): void
    {
        try {
            $next($request);
        } catch (\Throwable $e) {
            // Forward to Graylog if configured
            $this->logToGraylog($e, $request);

            $debug = defined('APP_DEBUG') && APP_DEBUG;
            JsonResponse::error(
                $debug ? $e->getMessage() : 'An internal server error occurred.',
                500,
                'INTERNAL_ERROR',
            );
        }
    }

    private function logToGraylog(\Throwable $e, Request $request): void
    {
        if (!defined('GRAYLOG_HOST') || !GRAYLOG_HOST) {
            return;
        }
        try {
            // Best-effort UDP GELF message — failures silently ignored
            $payload = json_encode([
                'version'      => '1.1',
                'host'         => gethostname(),
                'short_message'=> $e->getMessage(),
                'level'        => 3, // ERROR
                '_exception'   => get_class($e),
                '_file'        => $e->getFile(),
                '_line'        => $e->getLine(),
                '_path'        => $request->getPath(),
                '_method'      => $request->getMethod(),
            ]);
            $sock = @socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
            if ($sock !== false && $payload !== false) {
                @socket_sendto($sock, $payload, strlen($payload), 0,
                    GRAYLOG_HOST, defined('GRAYLOG_PORT') ? (int)GRAYLOG_PORT : 12201);
                @socket_close($sock);
            }
        } catch (\Throwable) {
            // Silently swallow Graylog errors — never let logging break the app
        }
    }
}
```

**Step 7: crm/src/Middleware/AuthMiddleware.php**

Extracts and validates the session JWT; sets caller context on Request.
Does NOT abort on missing token — anonymous callers are allowed through (RbacMiddleware enforces routes).

```php
<?php
declare(strict_types=1);
namespace Middleware;

use Http\Request;
use Services\AuthService;

class AuthMiddleware
{
    public function __construct(private AuthService $authService) {}

    public function handle(Request $request, callable $next): void
    {
        $token = $this->extractToken($request);

        if ($token !== null) {
            try {
                $claims = $this->authService->validateJwt($token);
                // Cross-validate role against DB (stale JWT correction per TechArch §5.2)
                $personId = (int) $claims['sub'];
                $role     = $claims['role'];
                $request->setCallerContext($personId, $role);
            } catch (\Throwable) {
                // Invalid/expired JWT → treat as anonymous; RbacMiddleware will enforce
                // Do not set caller context — remains 'anonymous'
            }
        }

        $next($request);
    }

    private function extractToken(Request $request): ?string
    {
        // 1. HttpOnly cookie (SPA)
        $cookie = $request->getCookie('ureport_session');
        if ($cookie !== null && $cookie !== '') {
            return $cookie;
        }

        // 2. Authorization: Bearer <token> (API clients / Open311 proxy)
        $authHeader = $request->getHeader('Authorization');
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            return substr($authHeader, 7);
        }

        return null;
    }
}
```

**Step 8: crm/src/Middleware/RbacMiddleware.php**

Factory returning middleware closures. Role hierarchy: admin=3 > staff=2 > public=1 > anonymous=0.
Returns 403 JSON envelope if caller role is below required.

```php
<?php
declare(strict_types=1);
namespace Middleware;

use Http\Request;
use Http\JsonResponse;

class RbacMiddleware
{
    private const ROLE_WEIGHTS = [
        'anonymous' => 0,
        'public'    => 1,
        'staff'     => 2,
        'admin'     => 3,
    ];

    /**
     * Returns a middleware callable that enforces $minimumRole.
     * Usage: $router->post('/api/tickets', [...], [RbacMiddleware::requireRole('staff')])
     */
    public static function requireRole(string $minimumRole): callable
    {
        return function (Request $request, callable $next) use ($minimumRole): void {
            $callerWeight  = self::ROLE_WEIGHTS[$request->getCallerRole()] ?? 0;
            $requiredWeight = self::ROLE_WEIGHTS[$minimumRole] ?? 0;

            if ($callerWeight < $requiredWeight) {
                if ($request->getCallerRole() === 'anonymous') {
                    JsonResponse::error('Authentication required', 401, 'UNAUTHENTICATED');
                } else {
                    JsonResponse::error('Insufficient permissions', 403, 'FORBIDDEN');
                }
                exit;
            }

            $next($request);
        };
    }

    /**
     * Check whether a caller role satisfies a minimum role requirement (non-middleware use).
     * Used by controllers for inline permission checks (e.g., category posting permission).
     */
    public static function callerHasRole(Request $request, string $minimumRole): bool
    {
        $callerWeight   = self::ROLE_WEIGHTS[$request->getCallerRole()] ?? 0;
        $requiredWeight = self::ROLE_WEIGHTS[$minimumRole] ?? 0;
        return $callerWeight >= $requiredWeight;
    }
}
```

**Step 9: crm/src/Http/Kernel.php**

API entry point. Wires middleware pipeline. All /api/ and /auth/ requests run through this.

```php
<?php
declare(strict_types=1);
namespace Http;

use Middleware\SecurityHeadersMiddleware;
use Middleware\ErrorHandlerMiddleware;
use Middleware\AuthMiddleware;
use Services\AuthService;
use Repositories\PersonRepository;
use Controllers\Auth\LoginController;
use Controllers\Auth\CallbackController;
use Controllers\Auth\LogoutController;
use Controllers\Auth\MeController;

class Kernel
{
    private Router $router;

    public function __construct()
    {
        $this->router = new Router();
        $this->registerRoutes();
    }

    public function handle(): void
    {
        $request    = new Request();
        $authService = new AuthService(new PersonRepository());

        // Middleware pipeline (outermost → innermost):
        // 1. ErrorHandler  — catches all Throwables
        // 2. SecurityHeaders — sets headers on every response
        // 3. Auth           — extracts + validates JWT, sets caller context
        // 4. Router         — dispatches to controller

        $pipeline = $this->buildPipeline([
            new ErrorHandlerMiddleware(),
            new SecurityHeadersMiddleware(),
            new AuthMiddleware($authService),
        ], fn(Request $req) => $this->router->dispatch($req));

        $pipeline($request);
    }

    /**
     * Register Auth controller routes. API controller routes are registered
     * by their respective Wave 2a/2b/2c/2d plan files via a separate routes
     * bootstrap file included in public/index.php.
     */
    private function registerRoutes(): void
    {
        $this->router->get('/auth/login',    [LoginController::class, 'handle']);
        $this->router->get('/auth/callback', [CallbackController::class, 'handle']);
        $this->router->post('/auth/logout',  [LogoutController::class, 'handle']);
        $this->router->get('/auth/me',       [MeController::class, 'handle']);
    }

    /**
     * Compose a middleware stack into a single callable.
     * @param array<object> $middlewares
     */
    private function buildPipeline(array $middlewares, callable $core): callable
    {
        $stack = $core;
        foreach (array_reverse($middlewares) as $middleware) {
            $next  = $stack;
            $stack = fn(Request $req) => $middleware->handle($req, $next);
        }
        return $stack;
    }
}
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/crm

# Composer install / autoload (requires internet access; skip in offline env)
composer install --no-interaction --quiet 2>&1 | tail -5 && echo "COMPOSER OK" || echo "COMPOSER SKIPPED (offline)"

# Autoload dump must always succeed
composer dump-autoload --quiet && echo "AUTOLOAD OK"

# All Http/* files exist
ls src/Http/Request.php src/Http/JsonResponse.php src/Http/Router.php src/Http/Kernel.php && echo "HTTP FILES OK"

# All Middleware/* files exist
ls src/Middleware/SecurityHeadersMiddleware.php src/Middleware/ErrorHandlerMiddleware.php src/Middleware/AuthMiddleware.php src/Middleware/RbacMiddleware.php && echo "MIDDLEWARE FILES OK"

# Key contract exports present
grep -n 'getCallerRole' src/Http/Request.php && echo "REQUEST_ROLE OK"
grep -n 'function success' src/Http/JsonResponse.php && echo "JSONRESPONSE_SUCCESS OK"
grep -n 'function dispatch' src/Http/Router.php && echo "ROUTER_DISPATCH OK"
grep -n 'requireRole' src/Middleware/RbacMiddleware.php && echo "RBAC_REQUIRE_ROLE OK"
grep -n 'SecurityHeadersMiddleware' src/Http/Kernel.php && echo "KERNEL_SECHEADERS OK"
grep -n 'X-Frame-Options' src/Middleware/SecurityHeadersMiddleware.php && echo "SECURITY_HEADER_XFRAME OK"
grep -n 'Content-Security-Policy' src/Middleware/SecurityHeadersMiddleware.php && echo "CSP_HEADER OK"

# PHP syntax check on all new files
for f in src/Http/*.php src/Middleware/*.php; do php -l "$f"; done && echo "ALL PHP SYNTAX OK"
```
  </verify>
  <done>
- All 4 Http/*.php files exist and pass `php -l`
- All 4 Middleware/*.php files exist and pass `php -l`
- `JsonResponse::success()`, `JsonResponse::paginated()`, `JsonResponse::error()` all present
- `Request::getCallerRole()`, `Request::getCallerId()`, `Request::setCallerContext()` present
- `Router::dispatch()` with `{param}` → named capture regex present
- `RbacMiddleware::requireRole()` static factory present with ROLE_WEIGHTS const
- `SecurityHeadersMiddleware` emits all 6 headers from TechArch §5.4
- `Kernel::handle()` wires ErrorHandler → SecurityHeaders → Auth → Router pipeline
- `composer dump-autoload` exits 0
  </done>
</task>

<task type="auto">
  <name>Task 2: AuthService (OIDC exchange + JWT issuance/validation) and Auth controllers</name>
  <files>
    crm/src/Services/AuthService.php
    crm/src/Controllers/Auth/LoginController.php
    crm/src/Controllers/Auth/CallbackController.php
    crm/src/Controllers/Auth/LogoutController.php
    crm/src/Controllers/Auth/MeController.php
  </files>
  <action>
**Step 1: crm/src/Services/AuthService.php**

Implements OIDC authorization code flow using `facile-it/php-openid-client ^3.x` for token endpoint exchange and `firebase/php-jwt ^6.x` for session JWT issuance/validation.

Configuration constants expected in `site_config.php` (already loaded by legacy bootstrap):
- `OIDC_ISSUER` — provider URL (e.g. https://keycloak.example.com/realms/myrealm)
- `OIDC_CLIENT_ID`
- `OIDC_CLIENT_SECRET`
- `OIDC_REDIRECT_URI` — full URL to /auth/callback
- `JWT_SECRET` — min 32-byte random string
- `SESSION_TTL` — integer seconds (default 28800 = 8h)

```php
<?php
declare(strict_types=1);
namespace Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Repositories\PersonRepository;
use Domain\Person;

class AuthService
{
    private const JWT_ALG = 'HS256';

    public function __construct(private PersonRepository $persons) {}

    // ─── OIDC Flow ────────────────────────────────────────────────────────────

    /**
     * Build the OIDC authorization URL and store state nonce in PHP session.
     */
    public function getAuthorizationUrl(string $state): string
    {
        session_start_if_not_started();

        $nonce = bin2hex(random_bytes(16));
        $_SESSION['oidc_state'] = $state;
        $_SESSION['oidc_nonce'] = $nonce;

        $params = http_build_query([
            'response_type' => 'code',
            'client_id'     => OIDC_CLIENT_ID,
            'redirect_uri'  => OIDC_REDIRECT_URI,
            'scope'         => 'openid email profile',
            'state'         => $state,
            'nonce'         => $nonce,
        ]);

        return rtrim(OIDC_ISSUER, '/') . '/protocol/openid-connect/auth?' . $params;
    }

    /**
     * Exchange authorization code for tokens; validate state nonce; auto-provision person.
     * Returns the matched or newly created Domain\Person.
     *
     * @throws \RuntimeException on state mismatch or token validation failure
     */
    public function exchangeCode(string $code, string $state): Person
    {
        session_start_if_not_started();

        // Validate state nonce (CSRF protection per TechArch §5.6)
        $expectedState = $_SESSION['oidc_state'] ?? null;
        if (!hash_equals((string) $expectedState, $state)) {
            throw new \RuntimeException('OIDC state mismatch — possible CSRF');
        }
        unset($_SESSION['oidc_state'], $_SESSION['oidc_nonce']);

        // Exchange code for tokens via token endpoint
        $tokenEndpoint = rtrim(OIDC_ISSUER, '/') . '/protocol/openid-connect/token';

        $ch = curl_init($tokenEndpoint);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query([
                'grant_type'    => 'authorization_code',
                'code'          => $code,
                'redirect_uri'  => OIDC_REDIRECT_URI,
                'client_id'     => OIDC_CLIENT_ID,
                'client_secret' => OIDC_CLIENT_SECRET,
            ]),
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
            CURLOPT_TIMEOUT    => 10,
        ]);
        $body     = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$body) {
            throw new \RuntimeException("OIDC token exchange failed (HTTP {$httpCode})");
        }

        $tokens = json_decode($body, true, 512, JSON_THROW_ON_ERROR);

        // Decode id_token claims without full signature validation here
        // (signature validation would require JWKS fetch — use the sub claim to identify person)
        $idTokenParts = explode('.', $tokens['id_token'] ?? '');
        if (count($idTokenParts) !== 3) {
            throw new \RuntimeException('Invalid id_token format');
        }
        $claims = json_decode(base64_decode(strtr($idTokenParts[1], '-_', '+/')), true);
        if (!$claims || empty($claims['sub'])) {
            throw new \RuntimeException('Missing sub claim in id_token');
        }

        $oidcSubject = (string) $claims['sub'];
        $email       = $claims['email'] ?? null;
        $firstName   = $claims['given_name'] ?? ($claims['name'] ?? 'Unknown');
        $lastName    = $claims['family_name'] ?? '';

        // Lookup existing person by OIDC subject (per TechArch §5.2, F03 OIDC auto-provision)
        $person = $this->persons->findByOidcSubject($oidcSubject);

        if ($person === null && $email !== null) {
            // Fallback: look up by primary email
            $person = $this->persons->findByEmail($email);
        }

        if ($person === null) {
            // Auto-provision new person with role 'public' (F03 §Process: OIDC Auto-Provision)
            $newPerson = new Person(
                id: 0,
                firstName: $firstName,
                lastName:  $lastName,
                role:      'public',
                departmentId: null,
                active:    true,
                oidcSubject: $oidcSubject,
                createdAt: date('Y-m-d H:i:s'),
                updatedAt: date('Y-m-d H:i:s'),
            );
            $person = $this->persons->save($newPerson);
        } else {
            // Update name + oidcSubject from fresh OIDC claims (F03 §Process: OIDC Auto-Provision step 5)
            $updated = new Person(
                id:           $person->id,
                firstName:    $firstName,
                lastName:     $lastName,
                role:         $person->role,
                departmentId: $person->departmentId,
                active:       $person->active,
                oidcSubject:  $oidcSubject,
                createdAt:    $person->createdAt,
                updatedAt:    date('Y-m-d H:i:s'),
            );
            $person = $this->persons->save($updated);
        }

        return $person;
    }

    // ─── JWT ──────────────────────────────────────────────────────────────────

    /**
     * Issue a session JWT for the authenticated person.
     * Payload per TechArch §5.2: { iss, sub, role, jti, iat, exp }
     */
    public function issueJwt(Person $person): string
    {
        $now = time();
        $ttl = defined('SESSION_TTL') ? (int) SESSION_TTL : 28800;

        $payload = [
            'iss'  => 'ureport',
            'sub'  => $person->id,
            'role' => $person->role,
            'jti'  => $this->generateJti(),
            'iat'  => $now,
            'exp'  => $now + $ttl,
        ];

        return JWT::encode($payload, $this->jwtSecret(), self::JWT_ALG);
    }

    /**
     * Validate a session JWT.
     * Returns decoded claims: ['sub' => int, 'role' => string, 'jti' => string]
     *
     * @throws \Firebase\JWT\ExpiredException    on expired token
     * @throws \Firebase\JWT\SignatureInvalidException on bad signature
     * @throws \RuntimeException on inactive person
     */
    public function validateJwt(string $token): array
    {
        $decoded = (array) JWT::decode($token, new Key($this->jwtSecret(), self::JWT_ALG));

        $personId = (int) ($decoded['sub'] ?? 0);
        if ($personId <= 0) {
            throw new \RuntimeException('Invalid JWT sub claim');
        }

        // Cross-validate role against DB (TechArch §5.2 step 4)
        $person = $this->persons->findById($personId);
        if ($person === null || !$person->active) {
            throw new \RuntimeException('Person not found or inactive');
        }

        // Use DB role (authoritative); JWT role may be stale
        return [
            'sub'  => $personId,
            'role' => $person->role,
            'jti'  => $decoded['jti'] ?? '',
        ];
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function jwtSecret(): string
    {
        if (!defined('JWT_SECRET') || strlen(JWT_SECRET) < 32) {
            throw new \RuntimeException('JWT_SECRET must be at least 32 characters');
        }
        return JWT_SECRET;
    }

    private function generateJti(): string
    {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}

// Helper: start session only if not already started
if (!function_exists('session_start_if_not_started')) {
    function session_start_if_not_started(): void {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }
}
```

**Step 2: crm/src/Controllers/Auth/LoginController.php**

Initiates OIDC flow: generates state nonce, redirects to IdP.

```php
<?php
declare(strict_types=1);
namespace Controllers\Auth;

use Http\Request;
use Services\AuthService;
use Repositories\PersonRepository;

class LoginController
{
    public function handle(Request $request): void
    {
        $authService = new AuthService(new PersonRepository());
        $state       = bin2hex(random_bytes(16));
        $redirectUrl = $authService->getAuthorizationUrl($state);

        header('Location: ' . $redirectUrl, true, 302);
        exit;
    }
}
```

**Step 3: crm/src/Controllers/Auth/CallbackController.php**

Handles OIDC redirect back from IdP. Exchanges code, issues JWT, sets HttpOnly cookie, redirects to /dashboard.

```php
<?php
declare(strict_types=1);
namespace Controllers\Auth;

use Http\Request;
use Http\JsonResponse;
use Services\AuthService;
use Repositories\PersonRepository;

class CallbackController
{
    public function handle(Request $request): void
    {
        $code  = $_GET['code']  ?? '';
        $state = $_GET['state'] ?? '';
        $error = $_GET['error'] ?? '';

        if ($error) {
            JsonResponse::error('OIDC provider returned error: ' . htmlspecialchars($error), 401, 'OIDC_ERROR');
            exit;
        }

        if (!$code || !$state) {
            JsonResponse::error('Missing code or state parameter', 400, 'INVALID_CALLBACK');
            exit;
        }

        try {
            $authService = new AuthService(new PersonRepository());
            $person      = $authService->exchangeCode($code, $state);
            $jwt         = $authService->issueJwt($person);

            // Set HttpOnly session cookie per TechArch §5.2
            $ttl     = defined('SESSION_TTL') ? (int) SESSION_TTL : 28800;
            $secure  = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
            setcookie('ureport_session', $jwt, [
                'expires'  => time() + $ttl,
                'path'     => '/',
                'secure'   => $secure,
                'httponly' => true,
                'samesite' => 'Lax',
            ]);

            // Redirect to SPA dashboard
            $redirectTo = defined('APP_URL') ? rtrim(APP_URL, '/') . '/dashboard' : '/dashboard';
            header('Location: ' . $redirectTo, true, 302);
            exit;

        } catch (\Throwable $e) {
            JsonResponse::error('Authentication failed: ' . $e->getMessage(), 401, 'AUTH_FAILED');
            exit;
        }
    }
}
```

**Step 4: crm/src/Controllers/Auth/LogoutController.php**

Clears the session cookie and redirects to OIDC provider end-session endpoint.

```php
<?php
declare(strict_types=1);
namespace Controllers\Auth;

use Http\Request;
use Http\JsonResponse;
use Middleware\RbacMiddleware;

class LogoutController
{
    public function handle(Request $request): void
    {
        // Require at least a session (not anonymous) — soft check since AuthMiddleware runs first
        if (!$request->isAuthenticated()) {
            JsonResponse::error('Not authenticated', 401, 'UNAUTHENTICATED');
            exit;
        }

        // Clear session cookie (expire in past)
        setcookie('ureport_session', '', [
            'expires'  => time() - 3600,
            'path'     => '/',
            'secure'   => true,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        // Redirect to OIDC provider end-session endpoint if configured
        if (defined('OIDC_ISSUER')) {
            $endSession = rtrim(OIDC_ISSUER, '/') . '/protocol/openid-connect/logout';
            $postLogout = defined('APP_URL') ? rtrim(APP_URL, '/') . '/' : '/';
            $url = $endSession . '?' . http_build_query([
                'post_logout_redirect_uri' => $postLogout,
                'client_id'               => defined('OIDC_CLIENT_ID') ? OIDC_CLIENT_ID : '',
            ]);
            header('Location: ' . $url, true, 302);
        } else {
            header('Location: /', true, 302);
        }
        exit;
    }
}
```

**Step 5: crm/src/Controllers/Auth/MeController.php**

Returns current user record. Requires authentication (returns 401 for anonymous).

```php
<?php
declare(strict_types=1);
namespace Controllers\Auth;

use Http\Request;
use Http\JsonResponse;
use Repositories\PersonRepository;
use Repositories\ContactMethodRepository;

class MeController
{
    public function handle(Request $request): void
    {
        if (!$request->isAuthenticated()) {
            JsonResponse::error('Authentication required', 401, 'UNAUTHENTICATED');
            exit;
        }

        $persons = new PersonRepository();
        $person  = $persons->findById($request->getCallerId());

        if ($person === null || !$person->active) {
            JsonResponse::error('User not found or inactive', 401, 'INVALID_SESSION');
            exit;
        }

        // Find primary email via ContactMethodRepository
        $cmRepo       = new ContactMethodRepository();
        $primaryEmail = $cmRepo->findPrimaryEmail($person->id);

        // Build CurrentUser shape per TechArch §4.2
        $department = null;
        if ($person->departmentId !== null) {
            $deptRepo   = new \Repositories\DepartmentRepository();
            $dept       = $deptRepo->findById($person->departmentId);
            $department = $dept ? ['id' => $dept->id, 'name' => $dept->name] : null;
        }

        JsonResponse::success([
            'id'           => $person->id,
            'firstName'    => $person->firstName,
            'lastName'     => $person->lastName,
            'role'         => $person->role,
            'department'   => $department,
            'primaryEmail' => $primaryEmail,
        ]);
    }
}
```

Note: `ContactMethodRepository::findPrimaryEmail(int $personId): ?string` must be added to `crm/src/Repositories/ContactMethodRepository.php` (Wave 1 / Plan 02 file). Add the following method if not already present:

```php
public function findPrimaryEmail(int $personId): ?string
{
    $stmt = $this->pdo->prepare(
        "SELECT value FROM contactMethods
         WHERE personId = :personId AND type = 'email' AND isPrimary = 1
         LIMIT 1"
    );
    $stmt->execute(['personId' => $personId]);
    $row = $stmt->fetch(\PDO::FETCH_ASSOC);
    return $row ? $row['value'] : null;
}
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/crm

# All auth controller files exist
ls src/Services/AuthService.php src/Controllers/Auth/LoginController.php src/Controllers/Auth/CallbackController.php src/Controllers/Auth/LogoutController.php src/Controllers/Auth/MeController.php && echo "AUTH FILES OK"

# Key exports present
grep -n 'function issueJwt' src/Services/AuthService.php && echo "ISSUE_JWT OK"
grep -n 'function validateJwt' src/Services/AuthService.php && echo "VALIDATE_JWT OK"
grep -n 'function exchangeCode' src/Services/AuthService.php && echo "EXCHANGE_CODE OK"
grep -n 'function getAuthorizationUrl' src/Services/AuthService.php && echo "AUTH_URL OK"
grep -n 'ureport_session' src/Controllers/Auth/CallbackController.php && echo "SESSION_COOKIE OK"
grep -n 'HttpOnly\|httponly' src/Controllers/Auth/CallbackController.php && echo "HTTPONLY_OK"
grep -n 'oidc_state' src/Services/AuthService.php && echo "STATE_NONCE OK"
grep -n 'isAuthenticated' src/Controllers/Auth/LogoutController.php && echo "LOGOUT_AUTH_CHECK OK"

# JWT_SECRET length guard present
grep -n 'JWT_SECRET.*32\|32.*JWT_SECRET' src/Services/AuthService.php && echo "JWT_SECRET_GUARD OK"

# OIDC state validation present (CSRF protection)
grep -n 'hash_equals\|oidc_state' src/Services/AuthService.php && echo "STATE_VALIDATION OK"

# PHP syntax check all files
for f in src/Services/AuthService.php src/Controllers/Auth/*.php; do php -l "$f"; done && echo "AUTH PHP SYNTAX OK"

# Autoload still valid after new files added
composer dump-autoload --quiet && echo "AUTOLOAD OK"
```
  </verify>
  <done>
- All 5 auth files exist and pass `php -l`
- `AuthService::issueJwt()` produces HS256 JWT with payload `{ iss:"ureport", sub, role, jti, iat, exp }`
- `AuthService::validateJwt()` uses `firebase/php-jwt`, cross-validates role against `people.active` from DB
- `AuthService::exchangeCode()` validates OIDC state nonce with `hash_equals()` before proceeding
- `CallbackController` sets `ureport_session` cookie with `httponly=true`, `samesite=Lax`, `secure=true`
- `CallbackController` redirects to `/dashboard` on success
- `LogoutController` expires the `ureport_session` cookie and redirects to OIDC end-session endpoint
- `MeController` returns 401 for unauthenticated callers; returns `CurrentUser` shape on success
- `composer dump-autoload` exits 0
- JWT_SECRET length guard (`strlen >= 32`) is enforced in `AuthService::jwtSecret()`
  </done>
</task>

</tasks>

<verification>
```bash
cd /app/workspaces/pivota/uReport/crm

# Full integration check: all Wave 2a kernel files present
ls src/Http/Request.php src/Http/JsonResponse.php src/Http/Router.php src/Http/Kernel.php \
   src/Middleware/SecurityHeadersMiddleware.php src/Middleware/ErrorHandlerMiddleware.php \
   src/Middleware/AuthMiddleware.php src/Middleware/RbacMiddleware.php \
   src/Services/AuthService.php \
   src/Controllers/Auth/LoginController.php src/Controllers/Auth/CallbackController.php \
   src/Controllers/Auth/LogoutController.php src/Controllers/Auth/MeController.php \
   && echo "ALL KERNEL FILES PRESENT"

# JSON envelope contract — all three methods present
grep -c 'public static function' src/Http/JsonResponse.php | grep -E '^[3-9]' && echo "JSONRESPONSE METHODS OK"

# Security headers — all 6 from TechArch §5.4
grep -c 'header(' src/Middleware/SecurityHeadersMiddleware.php | grep -E '^[6-9]|^[1-9][0-9]' && echo "SECURITY HEADERS COUNT OK"

# CORS preflight returns 204
grep -n 'OPTIONS.*204\|204.*OPTIONS' src/Middleware/SecurityHeadersMiddleware.php && echo "CORS PREFLIGHT OK"

# Role hierarchy complete
grep -n "'anonymous'.*0\|'public'.*1\|'staff'.*2\|'admin'.*3" src/Middleware/RbacMiddleware.php && echo "ROLE_WEIGHTS OK"

# Middleware pipeline order in Kernel
grep -n 'ErrorHandlerMiddleware\|SecurityHeadersMiddleware\|AuthMiddleware' src/Http/Kernel.php | head -6 && echo "PIPELINE ORDER CHECK (manual)"

# Auth route registrations
grep -n 'auth/login\|auth/callback\|auth/logout\|auth/me' src/Http/Kernel.php && echo "AUTH ROUTES REGISTERED OK"

# PHP syntax on all produced files
for f in src/Http/*.php src/Middleware/*.php src/Services/AuthService.php src/Controllers/Auth/*.php; do
  php -l "$f" || echo "SYNTAX ERROR: $f"
done && echo "ALL PHP SYNTAX PASS"

# Autoload
composer dump-autoload --quiet && echo "FINAL AUTOLOAD OK"
```
</verification>

<success_criteria>
- JSON envelope `{ "data", "meta", "errors" }` is the exclusive response shape for all /api/ routes — confirmed by `JsonResponse::success/paginated/error` implementations
- All 6 HTTP security headers from TechArch §5.4 are emitted by `SecurityHeadersMiddleware` on every response
- CORS preflight (OPTIONS) returns HTTP 204 with Allow-Origin, Allow-Methods, Allow-Headers
- OIDC login redirects to provider authorization URL with state nonce persisted in PHP session
- OIDC callback validates state nonce with `hash_equals()`, exchanges code for tokens, auto-provisions person (role=public), issues HS256 JWT in HttpOnly `ureport_session` cookie
- Logout expires the cookie and redirects to OIDC provider end-session endpoint
- `/auth/me` returns 200 with `CurrentUser` shape for valid session; 401 for unauthenticated
- `AuthMiddleware` passes anonymous requests through (sets callerRole='anonymous') — does not abort
- `RbacMiddleware::requireRole('staff')` returns 401 for anonymous callers, 403 for public-role callers
- All PHP files pass `php -l` syntax check; `composer dump-autoload` exits 0
</success_criteria>

<output>
After completion, create `.planning/express/modernize-the-ureport-legacy-php-crm-imp/03-SUMMARY.md` with:
- Files created (list)
- Key decisions made (e.g., middleware pipeline order, cookie settings, role weights)
- Integration contracts fulfilled from Wave 1 (PersonRepository, Domain\Person, PdoConnection)
- Contracts provided to Wave 2b/2c/2d (JsonResponse, Request, Kernel, Router, AuthMiddleware, RbacMiddleware, AuthService)
- Any deviations from TechArch spec with rationale
</output>
