---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 04
type: execute
wave: 2
depends_on: [1]
files_modified:
  - crm/src/Controllers/Api/TicketController.php
  - crm/src/Controllers/Api/TicketHistoryController.php
  - crm/src/Services/TicketService.php
  - crm/src/Services/SlaService.php
  - crm/src/Http/Router.php
  - crm/src/Http/Request.php
  - crm/src/Http/Response.php
autonomous: true

features:
  implements: ["F0", "F6"]
  depends_on: ["F16"]
  enables: ["F15"]

must_haves:
  truths:
    - "POST /api/tickets creates a ticket, writes an 'open' action, returns 201 with full ticket object"
    - "GET /api/tickets/{id} returns the ticket with resolved category/department/assignee/substatus refs and SLA info"
    - "PUT /api/tickets/{id} updates mutable fields and returns 200 with updated ticket"
    - "POST /api/tickets/{id}/assign updates personId and/or departmentId, writes 'assignment' action, returns 200"
    - "POST /api/tickets/bulk-assign reassigns up to 100 tickets, writes per-ticket 'assignment' actions, returns summary"
    - "POST /api/tickets/{id}/close sets status='closed', datetimeClosed=NOW(), writes 'closed' action, returns 200"
    - "POST /api/tickets/{id}/reopen sets status='open', clears datetimeClosed, writes 'open' action with reason payload, returns 200"
    - "DELETE /api/tickets/{id} soft-deletes (sets deletedAt), writes 'deleted' action, returns 204"
    - "POST /api/tickets/{id}/responses writes 'response' action with visibility='external', returns 201"
    - "POST /api/tickets/{id}/comments writes 'comment' action with visibility='internal', returns 201"
    - "GET /api/tickets/{id}/history returns paginated Action[] for the ticket, staff see internal+external, public see external only"
  artifacts:
    - path: "crm/src/Controllers/Api/TicketController.php"
      provides: "HTTP layer for all ticket CRUD and lifecycle transitions"
      exports: ["TicketController"]
      min_lines: 200
    - path: "crm/src/Controllers/Api/TicketHistoryController.php"
      provides: "GET /api/tickets/{id}/history endpoint"
      exports: ["TicketHistoryController"]
    - path: "crm/src/Services/TicketService.php"
      provides: "Ticket lifecycle business logic — orchestrates TicketRepository + ActionRepository"
      exports: ["TicketService"]
      min_lines: 150
    - path: "crm/src/Services/SlaService.php"
      provides: "SLA computation: expectedCloseDate, pctElapsed, status (on_time/late/no_sla)"
      exports: ["SlaService"]
    - path: "crm/src/Http/Router.php"
      provides: "Route registration and dispatch table for /api/tickets/* routes"
      exports: ["Router"]
    - path: "crm/src/Http/Request.php"
      provides: "HTTP request wrapper: method, path segments, JSON body, auth context"
      exports: ["Request"]
    - path: "crm/src/Http/Response.php"
      provides: "JSON envelope builder: data/meta/errors + HTTP status codes"
      exports: ["Response"]
  key_links:
    - from: "crm/src/Controllers/Api/TicketController.php"
      to: "crm/src/Services/TicketService.php"
      via: "constructor injection"
      pattern: "new TicketService|TicketService"
    - from: "crm/src/Services/TicketService.php"
      to: "crm/src/Repositories/TicketRepository.php"
      via: "constructor injection"
      pattern: "TicketRepository"
    - from: "crm/src/Services/TicketService.php"
      to: "crm/src/Repositories/ActionRepository.php"
      via: "constructor injection"
      pattern: "ActionRepository"
    - from: "crm/src/Controllers/Api/TicketController.php"
      to: "crm/src/Http/Response.php"
      via: "json envelope"
      pattern: "Response::json|Response::created"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "crm/src/Repositories/TicketRepository.php"
      exports: ["TicketRepository"]
      verify: "grep -n 'class TicketRepository' crm/src/Repositories/TicketRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "crm/src/Repositories/ActionRepository.php"
      exports: ["ActionRepository"]
      verify: "grep -n 'class ActionRepository' crm/src/Repositories/ActionRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "crm/src/Repositories/CategoryRepository.php"
      exports: ["CategoryRepository"]
      verify: "grep -n 'class CategoryRepository' crm/src/Repositories/CategoryRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "crm/src/Repositories/DepartmentRepository.php"
      exports: ["DepartmentRepository"]
      verify: "grep -n 'class DepartmentRepository' crm/src/Repositories/DepartmentRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "crm/src/Repositories/PersonRepository.php"
      exports: ["PersonRepository"]
      verify: "grep -n 'class PersonRepository' crm/src/Repositories/PersonRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "crm/src/Repositories/SubstatusRepository.php"
      exports: ["SubstatusRepository"]
      verify: "grep -n 'class SubstatusRepository' crm/src/Repositories/SubstatusRepository.php && echo CONTRACT_OK"
  provides:
    - artifact: "crm/src/Controllers/Api/TicketController.php"
      exports: ["TicketController"]
      shape: |
        Routes: POST /api/tickets, GET /api/tickets/{id}, PUT /api/tickets/{id},
                DELETE /api/tickets/{id}, POST /api/tickets/{id}/assign,
                POST /api/tickets/bulk-assign, POST /api/tickets/{id}/close,
                POST /api/tickets/{id}/reopen, POST /api/tickets/{id}/responses,
                POST /api/tickets/{id}/comments
      verify: "grep -n 'class TicketController' crm/src/Controllers/Api/TicketController.php && echo CONTRACT_OK"
    - artifact: "crm/src/Controllers/Api/TicketHistoryController.php"
      exports: ["TicketHistoryController"]
      shape: |
        Routes: GET /api/tickets/{id}/history
        Response: { data: Action[], meta: { page, perPage, total, pages }, errors: [] }
      verify: "grep -n 'class TicketHistoryController' crm/src/Controllers/Api/TicketHistoryController.php && echo CONTRACT_OK"
    - artifact: "crm/src/Services/TicketService.php"
      exports: ["TicketService"]
      shape: |
        class TicketService {
          public function createTicket(array $data, ?int $actorPersonId): Domain\Ticket;
          public function updateTicket(int $id, array $data, int $actorPersonId): Domain\Ticket;
          public function assignTicket(int $id, ?int $assigneeId, ?int $departmentId, int $actorPersonId): Domain\Ticket;
          public function bulkAssign(array $ticketIds, ?int $assigneeId, ?int $departmentId, int $actorPersonId): array;
          public function closeTicket(int $id, ?string $response, int $actorPersonId): Domain\Ticket;
          public function reopenTicket(int $id, string $reason, int $actorPersonId): Domain\Ticket;
          public function deleteTicket(int $id, int $actorPersonId): void;
          public function postResponse(int $ticketId, string $body, int $actorPersonId): Domain\Action;
          public function postComment(int $ticketId, string $body, int $actorPersonId): Domain\Action;
        }
      verify: "grep -n 'class TicketService' crm/src/Services/TicketService.php && echo CONTRACT_OK"
    - artifact: "crm/src/Http/Response.php"
      exports: ["Response"]
      shape: |
        class Response {
          public static function json(mixed $data, int $status = 200, array $meta = []): void;
          public static function created(mixed $data): void;
          public static function noContent(): void;
          public static function error(int $status, string $code, string $message, array $fieldErrors = []): void;
        }
      verify: "grep -n 'class Response' crm/src/Http/Response.php && echo CONTRACT_OK"
    - artifact: "crm/src/Http/Router.php"
      exports: ["Router"]
      shape: |
        class Router {
          public function register(string $method, string $pattern, callable $handler): void;
          public function dispatch(Request $request): void;
        }
      verify: "grep -n 'class Router' crm/src/Http/Router.php && echo CONTRACT_OK"
---

<objective>
Implement all ticket lifecycle REST endpoints (F0) and the ticket history endpoint (F6) for Wave 2a. This plan produces the TicketService orchestration layer, TicketController and TicketHistoryController HTTP controllers, SlaService, and the minimal HTTP kernel (Request/Response/Router) needed to dispatch /api/tickets/* routes.

Purpose: The ticket CRUD and lifecycle actions are the core of uReport's value. Every frontend wave (3a) depends on these endpoints existing with the correct JSON envelope shape and action-recording semantics.

Output:
- crm/src/Http/Request.php — request wrapper
- crm/src/Http/Response.php — JSON envelope builder
- crm/src/Http/Router.php — route registration + dispatch
- crm/src/Services/SlaService.php — SLA computation
- crm/src/Services/TicketService.php — ticket lifecycle orchestration
- crm/src/Controllers/Api/TicketController.php — all ticket CRUD/action endpoints
- crm/src/Controllers/Api/TicketHistoryController.php — action history endpoint
</objective>

<feature_dependencies>
Implements: F0: Ticket Lifecycle Management (create, read, update, assign, bulk-assign, close, reopen, delete, responses, comments endpoints), F6: Ticket History & Audit Trail (GET /api/tickets/{id}/history — immutable Action records from ActionRepository)
Depends on: F16: RESTful JSON API Backend (HTTP kernel, JSON envelope, repository pattern from Wave 1 Plans 01/02)
Enables: F15: SPA Frontend (Wave 3a consumes these endpoints for ticket management UI)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/WAVE-SCHEDULE.md
@project_specs/TechArch-uReport.md

# Wave 1 repository contracts (already written by Plans 01 and 02)
@crm/src/Repositories/TicketRepository.php
@crm/src/Repositories/ActionRepository.php
@crm/src/Repositories/PersonRepository.php
@crm/src/Repositories/CategoryRepository.php
@crm/src/Repositories/DepartmentRepository.php
@crm/src/Repositories/SubstatusRepository.php
@crm/src/Domain/Ticket.php
@crm/src/Domain/Action.php
</context>

<tasks>

<task type="auto">
  <name>Task 1: HTTP kernel (Request, Response, Router) + SlaService</name>
  <files>
    crm/src/Http/Request.php
    crm/src/Http/Response.php
    crm/src/Http/Router.php
    crm/src/Services/SlaService.php
  </files>
  <action>
**Step 1: crm/src/Http/Request.php**

Thin wrapper over PHP superglobals. Provides method, parsed path, JSON body, and auth context (personId + role injected by AuthMiddleware from Wave 2a Plan 03).

```php
<?php
declare(strict_types=1);
namespace Http;

class Request
{
    public readonly string  $method;
    public readonly string  $path;       // e.g. /api/tickets/42/close
    public readonly array   $segments;   // ['api','tickets','42','close']
    public readonly array   $query;      // $_GET
    private array           $body;       // decoded JSON body
    private ?int            $actorId   = null;
    private ?string         $actorRole = null;

    public function __construct()
    {
        $this->method   = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $rawPath        = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
        $this->path     = '/' . trim($rawPath, '/');
        $this->segments = array_values(array_filter(explode('/', trim($rawPath, '/'))));
        $this->query    = $_GET;

        $raw        = file_get_contents('php://input');
        $this->body = ($raw !== false && $raw !== '')
            ? (json_decode($raw, true, 512, JSON_THROW_ON_ERROR) ?? [])
            : [];
    }

    /** Returns decoded JSON body field or $default */
    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $default;
    }

    /** Returns full body array */
    public function all(): array { return $this->body; }

    /** Auth context — set by AuthMiddleware before controller dispatch */
    public function setActor(int $personId, string $role): void
    {
        $this->actorId   = $personId;
        $this->actorRole = $role;
    }

    public function actorId(): ?int    { return $this->actorId; }
    public function actorRole(): ?string { return $this->actorRole; }
    public function isAuthenticated(): bool { return $this->actorId !== null; }
    public function hasRole(string ...$roles): bool
    {
        return $this->actorRole !== null && in_array($this->actorRole, $roles, true);
    }

    /** URL segment (0-indexed, after stripping empty). Segment 0='api', 1='tickets', 2=id, etc. */
    public function segment(int $n): ?string { return $this->segments[$n] ?? null; }

    /** Return path segment cast to int, or null */
    public function segmentInt(int $n): ?int
    {
        $v = $this->segments[$n] ?? null;
        return ($v !== null && ctype_digit($v)) ? (int) $v : null;
    }
}
```

**Step 2: crm/src/Http/Response.php**

JSON envelope builder per TechArch §4.1:
`{ "data": any, "meta": { "page", "perPage", "total", "pages" }, "errors": [] }`

```php
<?php
declare(strict_types=1);
namespace Http;

class Response
{
    /**
     * Emit a JSON envelope and exit.
     *
     * @param mixed $data   The payload for the "data" field
     * @param int   $status HTTP status code
     * @param array $meta   Additional meta (pagination, facets, etc.)
     */
    public static function json(mixed $data, int $status = 200, array $meta = []): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'data'   => $data,
            'meta'   => $meta,
            'errors' => [],
        ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        exit;
    }

    /** HTTP 201 Created */
    public static function created(mixed $data): never
    {
        self::json($data, 201);
    }

    /** HTTP 204 No Content */
    public static function noContent(): never
    {
        http_response_code(204);
        header('Content-Type: application/json; charset=utf-8');
        exit;
    }

    /**
     * Emit an error envelope.
     *
     * @param int    $status      HTTP status (400, 401, 403, 404, 409, 422, 500…)
     * @param string $code        Machine-readable error code (e.g. NOT_FOUND)
     * @param string $message     Human-readable message
     * @param array  $fieldErrors Field-level errors for 422: [['field'=>'…','message'=>'…'],…]
     */
    public static function error(int $status, string $code, string $message, array $fieldErrors = []): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');

        $errors = empty($fieldErrors)
            ? [['field' => null, 'message' => $message, 'code' => $code]]
            : array_map(fn($e) => ['field' => $e['field'], 'message' => $e['message'], 'code' => $code], $fieldErrors);

        echo json_encode([
            'data'   => null,
            'meta'   => [],
            'errors' => $errors,
        ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        exit;
    }

    /** 401 Unauthorized */
    public static function unauthorized(string $message = 'Authentication required'): never
    {
        self::error(401, 'UNAUTHORIZED', $message);
    }

    /** 403 Forbidden */
    public static function forbidden(string $message = 'Insufficient permissions'): never
    {
        self::error(403, 'FORBIDDEN', $message);
    }

    /** 404 Not Found */
    public static function notFound(string $message = 'Resource not found'): never
    {
        self::error(404, 'NOT_FOUND', $message);
    }

    /** 422 Unprocessable Entity — field-level validation errors */
    public static function validationError(array $fieldErrors): never
    {
        self::error(422, 'VALIDATION_ERROR', 'Validation failed', $fieldErrors);
    }

    /** 409 Conflict */
    public static function conflict(string $code, string $message): never
    {
        self::error(409, $code, $message);
    }
}
```

**Step 3: crm/src/Http/Router.php**

Minimal pattern-matching router that maps method + path to controller callables.
Supports path parameters (`{id}`, `{action}`) extracted as `$params`.

```php
<?php
declare(strict_types=1);
namespace Http;

class Router
{
    /** @var array<array{method:string, regex:string, names:string[], handler:callable}> */
    private array $routes = [];

    /**
     * Register a route. Pattern uses {paramName} placeholders.
     * E.g.: $router->register('POST', '/api/tickets/{id}/close', $handler)
     */
    public function register(string $method, string $pattern, callable $handler): void
    {
        // Convert {name} → named capture group
        $regex = preg_replace('/\{([a-z_]+)\}/', '(?P<$1>[^/]+)', $pattern);
        $regex = '#^' . $regex . '$#';

        // Collect param names
        preg_match_all('/\{([a-z_]+)\}/', $pattern, $m);
        $this->routes[] = [
            'method'  => strtoupper($method),
            'regex'   => $regex,
            'names'   => $m[1],
            'handler' => $handler,
        ];
    }

    /** Dispatch current request or emit 404. */
    public function dispatch(Request $request): void
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $request->method) {
                continue;
            }
            if (preg_match($route['regex'], $request->path, $matches)) {
                // Extract named params
                $params = [];
                foreach ($route['names'] as $name) {
                    $params[$name] = $matches[$name] ?? null;
                }
                call_user_func($route['handler'], $request, $params);
                return;
            }
        }
        Response::notFound('Endpoint not found');
    }
}
```

**Step 4: crm/src/Services/SlaService.php**

Computes SLA data attached to every ticket response. Business day calculation uses a simple M-F calendar (no holidays for MVP — consistent with legacy behaviour).

```php
<?php
declare(strict_types=1);
namespace Services;

use Domain\Ticket;

class SlaService
{
    /**
     * Compute SLA info for a ticket.
     *
     * @param Ticket   $ticket
     * @param int|null $slaDays  Category.slaDays (null = no SLA)
     * @return array{slaDays:int|null, expectedCloseDate:string|null, status:string, pctElapsed:float|null}
     */
    public function compute(Ticket $ticket, ?int $slaDays): array
    {
        if ($slaDays === null || $slaDays <= 0) {
            return [
                'slaDays'           => null,
                'expectedCloseDate' => null,
                'status'            => 'no_sla',
                'pctElapsed'        => null,
            ];
        }

        $opened      = new \DateTimeImmutable($ticket->datetimeOpened);
        $expected    = $this->addBusinessDays($opened, $slaDays);
        $compareDate = $ticket->datetimeClosed
            ? new \DateTimeImmutable($ticket->datetimeClosed)
            : new \DateTimeImmutable('now');

        $elapsedDays  = $this->countBusinessDays($opened, $compareDate);
        $pctElapsed   = round(($elapsedDays / $slaDays) * 100, 1);
        $isLate       = $compareDate > $expected;

        return [
            'slaDays'           => $slaDays,
            'expectedCloseDate' => $expected->format('Y-m-d'),
            'status'            => $isLate ? 'late' : 'on_time',
            'pctElapsed'        => $pctElapsed,
        ];
    }

    /** Add $days business days (Mon–Fri) to $date */
    private function addBusinessDays(\DateTimeImmutable $date, int $days): \DateTimeImmutable
    {
        $added = 0;
        $cur   = $date;
        while ($added < $days) {
            $cur = $cur->modify('+1 day');
            if ((int) $cur->format('N') < 6) { // 1=Mon … 5=Fri
                $added++;
            }
        }
        return $cur;
    }

    /** Count business days (Mon–Fri) between two dates */
    private function countBusinessDays(\DateTimeImmutable $from, \DateTimeImmutable $to): int
    {
        if ($to <= $from) {
            return 0;
        }
        $count = 0;
        $cur   = $from->setTime(0, 0, 0);
        $end   = $to->setTime(0, 0, 0);
        while ($cur < $end) {
            $cur = $cur->modify('+1 day');
            if ((int) $cur->format('N') < 6) {
                $count++;
            }
        }
        return $count;
    }
}
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/crm

# PHP syntax checks on all four new files
php -l src/Http/Request.php && echo "Request SYNTAX OK"
php -l src/Http/Response.php && echo "Response SYNTAX OK"
php -l src/Http/Router.php && echo "Router SYNTAX OK"
php -l src/Services/SlaService.php && echo "SlaService SYNTAX OK"

# Autoload still resolves after new namespaces
composer dump-autoload --quiet && echo "AUTOLOAD OK"

# Key structural checks
grep -n 'class Request' src/Http/Request.php && echo "REQUEST CLASS OK"
grep -n 'static function json' src/Http/Response.php && echo "RESPONSE JSON OK"
grep -n 'static function error' src/Http/Response.php && echo "RESPONSE ERROR OK"
grep -n 'function dispatch' src/Http/Router.php && echo "ROUTER DISPATCH OK"
grep -n 'function compute' src/Services/SlaService.php && echo "SLA COMPUTE OK"
```
  </verify>
  <done>
- All four files pass `php -l` with no syntax errors
- `composer dump-autoload` exits 0 (Http\ and Services\ namespaces registered)
- Request::setActor(), actorId(), actorRole(), hasRole() methods exist
- Response::json(), created(), noContent(), error(), unauthorized(), forbidden(), notFound(), validationError(), conflict() all present
- Router::register() and Router::dispatch() exist with {param} placeholder support
- SlaService::compute() returns array with keys: slaDays, expectedCloseDate, status (on_time/late/no_sla), pctElapsed
  </done>
</task>

<task type="auto">
  <name>Task 2: TicketService + TicketController + TicketHistoryController</name>
  <files>
    crm/src/Services/TicketService.php
    crm/src/Controllers/Api/TicketController.php
    crm/src/Controllers/Api/TicketHistoryController.php
  </files>
  <action>
**Step 1: crm/src/Services/TicketService.php**

Orchestrates TicketRepository + ActionRepository + CategoryRepository for all ticket lifecycle operations. No HTTP concerns — pure domain logic. Called by TicketController.

```php
<?php
declare(strict_types=1);
namespace Services;

use Domain\Ticket;
use Domain\Action;
use Repositories\TicketRepository;
use Repositories\ActionRepository;
use Repositories\CategoryRepository;
use Repositories\DepartmentRepository;
use Repositories\PersonRepository;
use Repositories\SubstatusRepository;

class TicketService
{
    public function __construct(
        private TicketRepository      $tickets,
        private ActionRepository      $actions,
        private CategoryRepository    $categories,
        private DepartmentRepository  $departments,
        private PersonRepository      $people,
        private SubstatusRepository   $substatuses,
    ) {}

    // ─── Create ──────────────────────────────────────────────────────────────

    /**
     * Create a new ticket, write the 'open' action, return the new Ticket.
     *
     * $data keys (from F00 Create Ticket inputs):
     *   title (required), description, categoryId (required), lat, lng, address,
     *   reporterName, reporterEmail, reporterPhone, customFields, reporterPersonId,
     *   apiClientId
     */
    public function createTicket(array $data, ?int $actorPersonId): Ticket
    {
        // Resolve category → department
        $category = $this->categories->findById((int) $data['categoryId'])
            ?? throw new \DomainException('INVALID_CATEGORY:Category not found or inactive');

        if (!$category->active) {
            throw new \DomainException('INVALID_CATEGORY:Category not found or inactive');
        }

        // Get default substatus for 'open'
        $defaultSubstatus = $this->substatuses->findDefault('open');

        // Build and persist Ticket domain object
        $ticket = new Ticket(
            id:                 0,
            title:              $data['title'],
            description:        $data['description'] ?? null,
            status:             'open',
            datetimeOpened:     (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s'),
            datetimeClosed:     null,
            datetimeUpdated:    (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s'),
            deletedAt:          null,
            categoryId:         $category->id,
            departmentId:       $data['departmentId'] ?? $category->departmentId,
            personId:           $category->defaultAssigneeId,
            reporterPersonId:   $data['reporterPersonId'] ?? null,
            reporterName:       $data['reporterName'] ?? null,
            reporterEmail:      $data['reporterEmail'] ?? null,
            reporterPhone:      $data['reporterPhone'] ?? null,
            address:            $data['address'] ?? null,
            lat:                isset($data['lat']) ? (string) $data['lat'] : null,
            lng:                isset($data['lng']) ? (string) $data['lng'] : null,
            substatusId:        $defaultSubstatus?->id,
            mergedIntoTicketId: null,
            apiClientId:        $data['apiClientId'] ?? null,
            customFields:       isset($data['customFields'])
                                    ? json_encode($data['customFields'], JSON_THROW_ON_ERROR)
                                    : null,
        );

        $saved = $this->tickets->save($ticket);

        // Write immutable 'open' action
        $this->actions->insert(new Action(
            id:              0,
            ticketId:        $saved->id,
            type:            'open',
            visibility:      'internal',
            actorPersonId:   $actorPersonId,
            actorClientId:   null,
            datetimeCreated: (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s'),
            payload:         null,
        ));

        return $saved;
    }

    // ─── Update fields ────────────────────────────────────────────────────────

    /**
     * Update mutable ticket fields (title, description, categoryId, address, lat, lng,
     * customFields, substatusId). From F00 Update Ticket Fields inputs.
     */
    public function updateTicket(int $id, array $data, int $actorPersonId): Ticket
    {
        $ticket = $this->tickets->findById($id)
            ?? throw new \DomainException('NOT_FOUND:Ticket not found');

        // If categoryId is changing, validate new category and update departmentId
        if (isset($data['categoryId']) && (int)$data['categoryId'] !== $ticket->categoryId) {
            $cat = $this->categories->findById((int) $data['categoryId'])
                ?? throw new \DomainException('INVALID_CATEGORY:Category not found or inactive');
            if (!$cat->active) {
                throw new \DomainException('INVALID_CATEGORY:Category not found or inactive');
            }
            $data['departmentId'] = $cat->departmentId;
        }

        $updated = new Ticket(
            id:                 $ticket->id,
            title:              $data['title'] ?? $ticket->title,
            description:        array_key_exists('description', $data) ? $data['description'] : $ticket->description,
            status:             $ticket->status,
            datetimeOpened:     $ticket->datetimeOpened,
            datetimeClosed:     $ticket->datetimeClosed,
            datetimeUpdated:    (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s'),
            deletedAt:          $ticket->deletedAt,
            categoryId:         isset($data['categoryId']) ? (int)$data['categoryId'] : $ticket->categoryId,
            departmentId:       $data['departmentId'] ?? $ticket->departmentId,
            personId:           $ticket->personId,
            reporterPersonId:   $ticket->reporterPersonId,
            reporterName:       $ticket->reporterName,
            reporterEmail:      $ticket->reporterEmail,
            reporterPhone:      $ticket->reporterPhone,
            address:            array_key_exists('address', $data) ? $data['address'] : $ticket->address,
            lat:                array_key_exists('lat', $data) ? (string)$data['lat'] : $ticket->lat,
            lng:                array_key_exists('lng', $data) ? (string)$data['lng'] : $ticket->lng,
            substatusId:        array_key_exists('substatusId', $data) ? $data['substatusId'] : $ticket->substatusId,
            mergedIntoTicketId: $ticket->mergedIntoTicketId,
            apiClientId:        $ticket->apiClientId,
            customFields:       array_key_exists('customFields', $data)
                                    ? json_encode($data['customFields'], JSON_THROW_ON_ERROR)
                                    : $ticket->customFields,
        );

        return $this->tickets->save($updated);
    }

    // ─── Assign ───────────────────────────────────────────────────────────────

    /** Assign a single ticket. F00 §Assign Ticket process. */
    public function assignTicket(int $id, ?int $assigneeId, ?int $departmentId, int $actorPersonId): Ticket
    {
        $ticket = $this->tickets->findById($id)
            ?? throw new \DomainException('NOT_FOUND:Ticket not found');

        if ($assigneeId !== null) {
            $assignee = $this->people->findById($assigneeId)
                ?? throw new \DomainException('INVALID_ASSIGNEE:Assignee not found or not an active staff member');
            if (!$assignee->active || !in_array($assignee->role, ['staff', 'admin'], true)) {
                throw new \DomainException('INVALID_ASSIGNEE:Assignee not found or not an active staff member');
            }
        }

        $updated = new Ticket(
            id:                 $ticket->id,
            title:              $ticket->title,
            description:        $ticket->description,
            status:             $ticket->status,
            datetimeOpened:     $ticket->datetimeOpened,
            datetimeClosed:     $ticket->datetimeClosed,
            datetimeUpdated:    (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s'),
            deletedAt:          $ticket->deletedAt,
            categoryId:         $ticket->categoryId,
            departmentId:       $departmentId ?? $ticket->departmentId,
            personId:           $assigneeId,  // null = unassign
            reporterPersonId:   $ticket->reporterPersonId,
            reporterName:       $ticket->reporterName,
            reporterEmail:      $ticket->reporterEmail,
            reporterPhone:      $ticket->reporterPhone,
            address:            $ticket->address,
            lat:                $ticket->lat,
            lng:                $ticket->lng,
            substatusId:        $ticket->substatusId,
            mergedIntoTicketId: $ticket->mergedIntoTicketId,
            apiClientId:        $ticket->apiClientId,
            customFields:       $ticket->customFields,
        );

        $saved = $this->tickets->save($updated);

        $this->actions->insert(new Action(
            id:              0,
            ticketId:        $saved->id,
            type:            'assignment',
            visibility:      'internal',
            actorPersonId:   $actorPersonId,
            actorClientId:   null,
            datetimeCreated: (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s'),
            payload:         json_encode([
                'assigneeId'   => $assigneeId,
                'departmentId' => $departmentId ?? $ticket->departmentId,
            ], JSON_THROW_ON_ERROR),
        ));

        return $saved;
    }

    /**
     * Bulk assign. F00 §Bulk Assign Tickets.
     * Returns ['reassigned' => N, 'failed' => [['id' => X, 'reason' => '...'], ...]]
     */
    public function bulkAssign(array $ticketIds, ?int $assigneeId, ?int $departmentId, int $actorPersonId): array
    {
        if ($assigneeId !== null) {
            $assignee = $this->people->findById($assigneeId)
                ?? throw new \DomainException('INVALID_ASSIGNEE:Assignee not found or not an active staff member');
            if (!$assignee->active || !in_array($assignee->role, ['staff', 'admin'], true)) {
                throw new \DomainException('INVALID_ASSIGNEE:Assignee not found or not an active staff member');
            }
        }

        $reassigned = 0;
        $failed     = [];

        foreach ($ticketIds as $ticketId) {
            try {
                $this->assignTicket((int) $ticketId, $assigneeId, $departmentId, $actorPersonId);
                $reassigned++;
            } catch (\DomainException $e) {
                $failed[] = ['id' => $ticketId, 'reason' => explode(':', $e->getMessage())[1] ?? $e->getMessage()];
            }
        }

        return ['reassigned' => $reassigned, 'failed' => $failed];
    }

    // ─── Close ────────────────────────────────────────────────────────────────

    /** F00 §Close Ticket. */
    public function closeTicket(int $id, ?string $response, int $actorPersonId): Ticket
    {
        $ticket = $this->tickets->findById($id)
            ?? throw new \DomainException('NOT_FOUND:Ticket not found');

        if ($ticket->status === 'closed') {
            throw new \DomainException('ALREADY_CLOSED:Ticket is already closed');
        }

        $closedAt = (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s');

        // Get default closed substatus
        $defaultSubstatus = $this->substatuses->findDefault('closed');

        $updated = new Ticket(
            id:                 $ticket->id,
            title:              $ticket->title,
            description:        $ticket->description,
            status:             'closed',
            datetimeOpened:     $ticket->datetimeOpened,
            datetimeClosed:     $closedAt,
            datetimeUpdated:    $closedAt,
            deletedAt:          $ticket->deletedAt,
            categoryId:         $ticket->categoryId,
            departmentId:       $ticket->departmentId,
            personId:           $ticket->personId,
            reporterPersonId:   $ticket->reporterPersonId,
            reporterName:       $ticket->reporterName,
            reporterEmail:      $ticket->reporterEmail,
            reporterPhone:      $ticket->reporterPhone,
            address:            $ticket->address,
            lat:                $ticket->lat,
            lng:                $ticket->lng,
            substatusId:        $defaultSubstatus?->id ?? $ticket->substatusId,
            mergedIntoTicketId: $ticket->mergedIntoTicketId,
            apiClientId:        $ticket->apiClientId,
            customFields:       $ticket->customFields,
        );

        $saved = $this->tickets->save($updated);

        $this->actions->insert(new Action(
            id:              0,
            ticketId:        $saved->id,
            type:            'closed',
            visibility:      'internal',
            actorPersonId:   $actorPersonId,
            actorClientId:   null,
            datetimeCreated: $closedAt,
            payload:         null,
        ));

        // If response text provided, write additional 'response' action (external)
        if ($response !== null && trim($response) !== '') {
            $this->actions->insert(new Action(
                id:              0,
                ticketId:        $saved->id,
                type:            'response',
                visibility:      'external',
                actorPersonId:   $actorPersonId,
                actorClientId:   null,
                datetimeCreated: $closedAt,
                payload:         json_encode(['body' => $response], JSON_THROW_ON_ERROR),
            ));
        }

        return $saved;
    }

    // ─── Reopen ───────────────────────────────────────────────────────────────

    /** F00 §Reopen Ticket. */
    public function reopenTicket(int $id, string $reason, int $actorPersonId): Ticket
    {
        $ticket = $this->tickets->findById($id)
            ?? throw new \DomainException('NOT_FOUND:Ticket not found');

        if ($ticket->status === 'open') {
            throw new \DomainException('ALREADY_OPEN:Ticket is already open');
        }

        $defaultSubstatus = $this->substatuses->findDefault('open');
        $now = (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s');

        $updated = new Ticket(
            id:                 $ticket->id,
            title:              $ticket->title,
            description:        $ticket->description,
            status:             'open',
            datetimeOpened:     $ticket->datetimeOpened,
            datetimeClosed:     null,
            datetimeUpdated:    $now,
            deletedAt:          $ticket->deletedAt,
            categoryId:         $ticket->categoryId,
            departmentId:       $ticket->departmentId,
            personId:           $ticket->personId,
            reporterPersonId:   $ticket->reporterPersonId,
            reporterName:       $ticket->reporterName,
            reporterEmail:      $ticket->reporterEmail,
            reporterPhone:      $ticket->reporterPhone,
            address:            $ticket->address,
            lat:                $ticket->lat,
            lng:                $ticket->lng,
            substatusId:        $defaultSubstatus?->id ?? $ticket->substatusId,
            mergedIntoTicketId: $ticket->mergedIntoTicketId,
            apiClientId:        $ticket->apiClientId,
            customFields:       $ticket->customFields,
        );

        $saved = $this->tickets->save($updated);

        $this->actions->insert(new Action(
            id:              0,
            ticketId:        $saved->id,
            type:            'open',
            visibility:      'internal',
            actorPersonId:   $actorPersonId,
            actorClientId:   null,
            datetimeCreated: $now,
            payload:         json_encode(['reason' => $reason], JSON_THROW_ON_ERROR),
        ));

        return $saved;
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    /** F00 §Delete Ticket — soft-delete only. */
    public function deleteTicket(int $id, int $actorPersonId): void
    {
        $ticket = $this->tickets->findById($id)
            ?? throw new \DomainException('NOT_FOUND:Ticket not found');

        $this->tickets->delete($id);

        $this->actions->insert(new Action(
            id:              0,
            ticketId:        $ticket->id,
            type:            'deleted',
            visibility:      'internal',
            actorPersonId:   $actorPersonId,
            actorClientId:   null,
            datetimeCreated: (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s'),
            payload:         null,
        ));
    }

    // ─── Response / Comment ───────────────────────────────────────────────────

    /** Post an external response (visibility='external', type='response'). */
    public function postResponse(int $ticketId, string $body, int $actorPersonId): Action
    {
        $ticket = $this->tickets->findById($ticketId)
            ?? throw new \DomainException('NOT_FOUND:Ticket not found');

        return $this->actions->insert(new Action(
            id:              0,
            ticketId:        $ticket->id,
            type:            'response',
            visibility:      'external',
            actorPersonId:   $actorPersonId,
            actorClientId:   null,
            datetimeCreated: (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s'),
            payload:         json_encode(['body' => $body], JSON_THROW_ON_ERROR),
        ));
    }

    /** Post an internal comment (visibility='internal', type='comment'). */
    public function postComment(int $ticketId, string $body, int $actorPersonId): Action
    {
        $ticket = $this->tickets->findById($ticketId)
            ?? throw new \DomainException('NOT_FOUND:Ticket not found');

        return $this->actions->insert(new Action(
            id:              0,
            ticketId:        $ticket->id,
            type:            'comment',
            visibility:      'internal',
            actorPersonId:   $actorPersonId,
            actorClientId:   null,
            datetimeCreated: (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s'),
            payload:         json_encode(['body' => $body], JSON_THROW_ON_ERROR),
        ));
    }
}
```

**Step 2: crm/src/Controllers/Api/TicketController.php**

Thin HTTP layer. Parses request, delegates to TicketService, formats response via Response helper. Uses SubstatusRepository and CategoryRepository to hydrate the full ticket object shape required by TechArch §4.2 TypeScript interface `Ticket`.

Validation inline (422 on failure). RBAC checks: staff/admin required for mutating endpoints, admin for delete.

```php
<?php
declare(strict_types=1);
namespace Controllers\Api;

use Http\Request;
use Http\Response;
use Services\TicketService;
use Services\SlaService;
use Repositories\TicketRepository;
use Repositories\CategoryRepository;
use Repositories\DepartmentRepository;
use Repositories\PersonRepository;
use Repositories\SubstatusRepository;

class TicketController
{
    public function __construct(
        private TicketService        $ticketService,
        private SlaService           $slaService,
        private TicketRepository     $tickets,
        private CategoryRepository   $categories,
        private DepartmentRepository $departments,
        private PersonRepository     $people,
        private SubstatusRepository  $substatuses,
    ) {}

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Hydrate the full TechArch §4.2 Ticket shape for API responses.
     * Joins category, department, assignee, substatus refs, and computes SLA.
     */
    private function hydrateTicket(\Domain\Ticket $t): array
    {
        $category   = $this->categories->findById($t->categoryId);
        $department = $this->departments->findById($t->departmentId);
        $assignee   = $t->personId ? $this->people->findById($t->personId) : null;
        $substatus  = $t->substatusId ? $this->substatuses->findById($t->substatusId) : null;
        $slaInfo    = $this->slaService->compute($t, $category?->slaDays);

        return [
            'id'              => $t->id,
            'title'           => $t->title,
            'description'     => $t->description,
            'status'          => $t->status,
            'substatus'       => $substatus ? ['id' => $substatus->id, 'label' => $substatus->label, 'primaryStatus' => $substatus->primaryStatus] : null,
            'category'        => $category ? ['id' => $category->id, 'name' => $category->name] : ['id' => $t->categoryId, 'name' => null],
            'department'      => $department ? ['id' => $department->id, 'name' => $department->name] : ['id' => $t->departmentId, 'name' => null],
            'assignee'        => $assignee ? ['id' => $assignee->id, 'name' => $assignee->fullName()] : null,
            'reporter'        => [
                'personId' => $t->reporterPersonId,
                'name'     => $t->reporterName,
                'email'    => $t->reporterEmail,
                'phone'    => $t->reporterPhone,
            ],
            'address'         => $t->address,
            'lat'             => $t->lat !== null ? (float) $t->lat : null,
            'lng'             => $t->lng !== null ? (float) $t->lng : null,
            'customFields'    => $t->customFields ? json_decode($t->customFields, true) : null,
            'sla'             => $slaInfo,
            'datetimeOpened'  => $t->datetimeOpened,
            'datetimeClosed'  => $t->datetimeClosed,
            'datetimeUpdated' => $t->datetimeUpdated,
            'mergedIntoTicketId' => $t->mergedIntoTicketId,
            'deletedAt'       => $t->deletedAt,
        ];
    }

    // ─── POST /api/tickets ────────────────────────────────────────────────────

    public function create(Request $req, array $params): void
    {
        $data = $req->all();

        // Validate required fields
        $errors = [];
        if (empty($data['title'])) {
            $errors[] = ['field' => 'title', 'message' => 'Title is required'];
        } elseif (strlen($data['title']) > 255) {
            $errors[] = ['field' => 'title', 'message' => 'Title must be 255 characters or fewer'];
        }
        if (empty($data['categoryId'])) {
            $errors[] = ['field' => 'categoryId', 'message' => 'categoryId is required'];
        }
        if (empty($data['lat']) && empty($data['lng']) && empty($data['address'])) {
            $errors[] = ['field' => 'location', 'message' => 'Either coordinates (lat/lng) or an address must be provided'];
        }
        if (!empty($data['lat']) && ((float)$data['lat'] < -90 || (float)$data['lat'] > 90)) {
            $errors[] = ['field' => 'lat', 'message' => 'Latitude must be −90 to +90'];
        }
        if (!empty($data['lng']) && ((float)$data['lng'] < -180 || (float)$data['lng'] > 180)) {
            $errors[] = ['field' => 'lng', 'message' => 'Longitude must be −180 to +180'];
        }
        if (!empty($data['reporterEmail']) && !filter_var($data['reporterEmail'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = ['field' => 'reporterEmail', 'message' => 'Reporter email is not a valid email address'];
        }
        if (!empty($errors)) {
            Response::validationError($errors);
        }

        try {
            $ticket = $this->ticketService->createTicket($data, $req->actorId());
            Response::created($this->hydrateTicket($ticket));
        } catch (\DomainException $e) {
            [$code, $msg] = explode(':', $e->getMessage(), 2) + ['DOMAIN_ERROR', $e->getMessage()];
            if ($code === 'NOT_FOUND') Response::notFound($msg);
            Response::error(422, $code, $msg);
        }
    }

    // ─── GET /api/tickets/{id} ────────────────────────────────────────────────

    public function show(Request $req, array $params): void
    {
        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) Response::notFound();

        $ticket = $this->tickets->findById($id);
        if (!$ticket) Response::notFound('Ticket not found');

        Response::json($this->hydrateTicket($ticket));
    }

    // ─── PUT /api/tickets/{id} ────────────────────────────────────────────────

    public function update(Request $req, array $params): void
    {
        if (!$req->hasRole('staff', 'admin')) Response::forbidden();

        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) Response::notFound();

        $data = $req->all();

        // Optional field validation
        $errors = [];
        if (isset($data['title']) && strlen($data['title']) > 255) {
            $errors[] = ['field' => 'title', 'message' => 'Title must be 255 characters or fewer'];
        }
        if (isset($data['lat']) && ((float)$data['lat'] < -90 || (float)$data['lat'] > 90)) {
            $errors[] = ['field' => 'lat', 'message' => 'Latitude must be −90 to +90'];
        }
        if (isset($data['lng']) && ((float)$data['lng'] < -180 || (float)$data['lng'] > 180)) {
            $errors[] = ['field' => 'lng', 'message' => 'Longitude must be −180 to +180'];
        }
        if (!empty($errors)) Response::validationError($errors);

        try {
            $ticket = $this->ticketService->updateTicket($id, $data, $req->actorId());
            Response::json($this->hydrateTicket($ticket));
        } catch (\DomainException $e) {
            [$code, $msg] = explode(':', $e->getMessage(), 2) + ['DOMAIN_ERROR', $e->getMessage()];
            if ($code === 'NOT_FOUND') Response::notFound($msg);
            Response::error(422, $code, $msg);
        }
    }

    // ─── POST /api/tickets/{id}/assign ────────────────────────────────────────

    public function assign(Request $req, array $params): void
    {
        if (!$req->hasRole('staff', 'admin')) Response::forbidden();

        $id         = (int) ($params['id'] ?? 0);
        $assigneeId = $req->input('assigneeId');
        $deptId     = $req->input('departmentId');

        try {
            $ticket = $this->ticketService->assignTicket(
                $id,
                $assigneeId !== null ? (int) $assigneeId : null,
                $deptId     !== null ? (int) $deptId     : null,
                $req->actorId(),
            );
            Response::json($this->hydrateTicket($ticket));
        } catch (\DomainException $e) {
            [$code, $msg] = explode(':', $e->getMessage(), 2) + ['DOMAIN_ERROR', $e->getMessage()];
            if ($code === 'NOT_FOUND') Response::notFound($msg);
            Response::error(422, $code, $msg);
        }
    }

    // ─── POST /api/tickets/bulk-assign ────────────────────────────────────────

    public function bulkAssign(Request $req, array $params): void
    {
        if (!$req->hasRole('staff', 'admin')) Response::forbidden();

        $ticketIds  = $req->input('ticketIds', []);
        $assigneeId = $req->input('assigneeId');
        $deptId     = $req->input('departmentId');

        $errors = [];
        if (empty($ticketIds) || !is_array($ticketIds)) {
            $errors[] = ['field' => 'ticketIds', 'message' => 'ticketIds must be a non-empty array'];
        } elseif (count($ticketIds) > 100) {
            $errors[] = ['field' => 'ticketIds', 'message' => 'Maximum 100 tickets per bulk assignment'];
        }
        if (!empty($errors)) Response::validationError($errors);

        try {
            $result = $this->ticketService->bulkAssign(
                $ticketIds,
                $assigneeId !== null ? (int) $assigneeId : null,
                $deptId     !== null ? (int) $deptId     : null,
                $req->actorId(),
            );
            Response::json($result);
        } catch (\DomainException $e) {
            [$code, $msg] = explode(':', $e->getMessage(), 2) + ['DOMAIN_ERROR', $e->getMessage()];
            Response::error(422, $code, $msg);
        }
    }

    // ─── POST /api/tickets/{id}/close ─────────────────────────────────────────

    public function close(Request $req, array $params): void
    {
        if (!$req->hasRole('staff', 'admin')) Response::forbidden();

        $id       = (int) ($params['id'] ?? 0);
        $response = $req->input('response');

        try {
            $ticket = $this->ticketService->closeTicket($id, $response, $req->actorId());
            Response::json($this->hydrateTicket($ticket));
        } catch (\DomainException $e) {
            [$code, $msg] = explode(':', $e->getMessage(), 2) + ['DOMAIN_ERROR', $e->getMessage()];
            if ($code === 'NOT_FOUND') Response::notFound($msg);
            if ($code === 'ALREADY_CLOSED') Response::conflict($code, $msg);
            Response::error(422, $code, $msg);
        }
    }

    // ─── POST /api/tickets/{id}/reopen ────────────────────────────────────────

    public function reopen(Request $req, array $params): void
    {
        if (!$req->hasRole('staff', 'admin')) Response::forbidden();

        $id     = (int) ($params['id'] ?? 0);
        $reason = $req->input('reason', '');

        if (empty(trim((string) $reason))) {
            Response::validationError([['field' => 'reason', 'message' => 'A reason is required to reopen a ticket']]);
        }

        try {
            $ticket = $this->ticketService->reopenTicket($id, (string) $reason, $req->actorId());
            Response::json($this->hydrateTicket($ticket));
        } catch (\DomainException $e) {
            [$code, $msg] = explode(':', $e->getMessage(), 2) + ['DOMAIN_ERROR', $e->getMessage()];
            if ($code === 'NOT_FOUND') Response::notFound($msg);
            if ($code === 'ALREADY_OPEN') Response::conflict($code, $msg);
            Response::error(422, $code, $msg);
        }
    }

    // ─── DELETE /api/tickets/{id} ─────────────────────────────────────────────

    public function delete(Request $req, array $params): void
    {
        if (!$req->hasRole('admin')) Response::forbidden('Ticket deletion requires admin role');

        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) Response::notFound();

        try {
            $this->ticketService->deleteTicket($id, $req->actorId());
            Response::noContent();
        } catch (\DomainException $e) {
            [$code, $msg] = explode(':', $e->getMessage(), 2) + ['DOMAIN_ERROR', $e->getMessage()];
            if ($code === 'NOT_FOUND') Response::notFound($msg);
            Response::error(422, $code, $msg);
        }
    }

    // ─── POST /api/tickets/{id}/responses ────────────────────────────────────

    public function postResponse(Request $req, array $params): void
    {
        if (!$req->hasRole('staff', 'admin')) Response::forbidden();

        $id   = (int) ($params['id'] ?? 0);
        $body = $req->input('body', '');

        if (empty(trim((string) $body))) {
            Response::validationError([['field' => 'body', 'message' => 'Response body is required']]);
        }

        try {
            $action = $this->ticketService->postResponse($id, (string) $body, $req->actorId());
            Response::created([
                'id'              => $action->id,
                'ticketId'        => $action->ticketId,
                'type'            => $action->type,
                'visibility'      => $action->visibility,
                'actorPersonId'   => $action->actorPersonId,
                'datetimeCreated' => $action->datetimeCreated,
                'payload'         => $action->payload ? json_decode($action->payload, true) : null,
            ]);
        } catch (\DomainException $e) {
            [$code, $msg] = explode(':', $e->getMessage(), 2) + ['DOMAIN_ERROR', $e->getMessage()];
            if ($code === 'NOT_FOUND') Response::notFound($msg);
            Response::error(422, $code, $msg);
        }
    }

    // ─── POST /api/tickets/{id}/comments ─────────────────────────────────────

    public function postComment(Request $req, array $params): void
    {
        if (!$req->hasRole('staff', 'admin')) Response::forbidden();

        $id   = (int) ($params['id'] ?? 0);
        $body = $req->input('body', '');

        if (empty(trim((string) $body))) {
            Response::validationError([['field' => 'body', 'message' => 'Comment body is required']]);
        }

        try {
            $action = $this->ticketService->postComment($id, (string) $body, $req->actorId());
            Response::created([
                'id'              => $action->id,
                'ticketId'        => $action->ticketId,
                'type'            => $action->type,
                'visibility'      => $action->visibility,
                'actorPersonId'   => $action->actorPersonId,
                'datetimeCreated' => $action->datetimeCreated,
                'payload'         => $action->payload ? json_decode($action->payload, true) : null,
            ]);
        } catch (\DomainException $e) {
            [$code, $msg] = explode(':', $e->getMessage(), 2) + ['DOMAIN_ERROR', $e->getMessage()];
            if ($code === 'NOT_FOUND') Response::notFound($msg);
            Response::error(422, $code, $msg);
        }
    }
}
```

**Step 3: crm/src/Controllers/Api/TicketHistoryController.php**

GET /api/tickets/{id}/history — returns paginated Action[] with visibility filtering per role.
Staff/admin see internal+external; unauthenticated/public see external only (F06).

```php
<?php
declare(strict_types=1);
namespace Controllers\Api;

use Http\Request;
use Http\Response;
use Repositories\TicketRepository;
use Repositories\ActionRepository;
use Repositories\PersonRepository;

class TicketHistoryController
{
    public function __construct(
        private TicketRepository  $tickets,
        private ActionRepository  $actions,
        private PersonRepository  $people,
    ) {}

    /**
     * GET /api/tickets/{id}/history
     *
     * Query params:
     *   page    (int, default 1)
     *   perPage (int, default 50, max 100)
     *
     * Returns: { data: Action[], meta: { page, perPage, total, pages }, errors: [] }
     */
    public function index(Request $req, array $params): void
    {
        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) Response::notFound();

        $ticket = $this->tickets->findById($id);
        if (!$ticket) Response::notFound('Ticket not found');

        $page    = max(1, (int) ($req->query['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($req->query['perPage'] ?? 50)));

        // Staff/admin see all actions; public/anonymous see external only
        $includeInternal = $req->hasRole('staff', 'admin');

        $result = $this->actions->findByTicketIdPaginated(
            $id,
            $includeInternal,
            $page,
            $perPage,
        );

        $rows = array_map(function (\Domain\Action $a) {
            $actor = null;
            if ($a->actorPersonId) {
                $p     = $this->people->findById($a->actorPersonId);
                $actor = $p ? ['id' => $p->id, 'name' => $p->fullName(), 'type' => 'person'] : ['id' => $a->actorPersonId, 'name' => null, 'type' => 'person'];
            }
            return [
                'id'              => $a->id,
                'ticketId'        => $a->ticketId,
                'type'            => $a->type,
                'visibility'      => $a->visibility,
                'actor'           => $actor,
                'datetimeCreated' => $a->datetimeCreated,
                'payload'         => $a->payload ? json_decode($a->payload, true) : null,
            ];
        }, $result['rows']);

        $total = $result['total'];
        $pages = (int) ceil($total / $perPage);

        Response::json($rows, 200, [
            'page'    => $page,
            'perPage' => $perPage,
            'total'   => $total,
            'pages'   => $pages,
        ]);
    }
}
```

**NOTE ON ActionRepository:** The TicketHistoryController calls `findByTicketIdPaginated()`.
If Plan 01/02 only defines `findByTicketId()` (non-paginated), add the paginated variant to ActionRepository now:

```php
// In crm/src/Repositories/ActionRepository.php — add this method:
public function findByTicketIdPaginated(
    int  $ticketId,
    bool $includeInternal = true,
    int  $page = 1,
    int  $perPage = 50,
): array {
    $where  = ['ticketId = :ticketId'];
    $params = ['ticketId' => $ticketId];

    if (!$includeInternal) {
        $where[] = "visibility = 'external'";
    }

    $whereClause = 'WHERE ' . implode(' AND ', $where);
    $sql = "SELECT * FROM actions $whereClause ORDER BY datetimeCreated ASC";

    return $this->paginate($sql, $params, fn($row) => \Domain\Action::fromRow($row), $page, $perPage);
}
```

Also add a `findDefault(string $primaryStatus): ?\Domain\Substatus` helper to SubstatusRepository if not present (used by TicketService):

```php
// In crm/src/Repositories/SubstatusRepository.php — add this method:
public function findDefault(string $primaryStatus): ?\Domain\Substatus
{
    $stmt = $this->pdo->prepare(
        "SELECT * FROM substatus WHERE primaryStatus = :ps AND isDefault = 1 AND active = 1 LIMIT 1"
    );
    $stmt->execute(['ps' => $primaryStatus]);
    $row = $stmt->fetch(\PDO::FETCH_ASSOC);
    return $row ? \Domain\Substatus::fromRow($row) : null;
}
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/crm

# PHP syntax checks
php -l src/Services/TicketService.php && echo "TicketService SYNTAX OK"
php -l src/Controllers/Api/TicketController.php && echo "TicketController SYNTAX OK"
php -l src/Controllers/Api/TicketHistoryController.php && echo "TicketHistoryController SYNTAX OK"

# Autoload still resolves
composer dump-autoload --quiet && echo "AUTOLOAD OK"

# Key structural assertions
grep -n 'class TicketService' src/Services/TicketService.php && echo "TICKETSERVICE CLASS OK"
grep -n 'function createTicket' src/Services/TicketService.php && echo "CREATE OK"
grep -n 'function closeTicket' src/Services/TicketService.php && echo "CLOSE OK"
grep -n 'function reopenTicket' src/Services/TicketService.php && echo "REOPEN OK"
grep -n 'function deleteTicket' src/Services/TicketService.php && echo "DELETE OK"
grep -n 'function bulkAssign' src/Services/TicketService.php && echo "BULKASSIGN OK"
grep -n 'function postResponse' src/Services/TicketService.php && echo "POST_RESPONSE OK"
grep -n 'function postComment' src/Services/TicketService.php && echo "POST_COMMENT OK"
grep -n 'class TicketController' src/Controllers/Api/TicketController.php && echo "TICKETCONTROLLER OK"
grep -n 'function hydrateTicket' src/Controllers/Api/TicketController.php && echo "HYDRATE OK"
grep -n 'class TicketHistoryController' src/Controllers/Api/TicketHistoryController.php && echo "HISTORYCONTROLLER OK"

# Confirm ActionRepository now has paginated method
grep -n 'findByTicketIdPaginated' src/Repositories/ActionRepository.php && echo "PAGINATED_HISTORY OK"

# Confirm SubstatusRepository has findDefault
grep -n 'findDefault' src/Repositories/SubstatusRepository.php && echo "SUBSTATUS_FINDDEFAULT OK"

# No accidental modification of legacy Application files
test ! -newer src/Application/Database.php src/Services/TicketService.php && echo "LEGACY UNTOUCHED OK" || echo "WARNING: Application files may have changed"
```
  </verify>
  <done>
- All three files pass `php -l` with no syntax errors
- `composer dump-autoload` exits 0 — Controllers\Api\ and Services\ namespaces resolve
- TicketService exposes: createTicket, updateTicket, assignTicket, bulkAssign, closeTicket, reopenTicket, deleteTicket, postResponse, postComment
- TicketController exposes: create, show, update, assign, bulkAssign, close, reopen, delete, postResponse, postComment
- TicketHistoryController exposes: index (GET /api/tickets/{id}/history)
- hydrateTicket() returns the full TechArch §4.2 Ticket shape with category/department/assignee/substatus refs and sla object
- ActionRepository has findByTicketIdPaginated() method
- SubstatusRepository has findDefault(string $primaryStatus) method
- All F00 lifecycle state transitions write an Action record to the actions table
- 'response' actions use visibility='external'; 'comment'/'assignment'/'closed'/'open'/'deleted' use visibility='internal'
- Legacy crm/src/Application/ files are NOT modified
  </done>
</task>

</tasks>

<verification>
```bash
cd /app/workspaces/pivota/uReport/crm

# All new files pass PHP lint
for f in src/Http/Request.php src/Http/Response.php src/Http/Router.php \
          src/Services/SlaService.php src/Services/TicketService.php \
          src/Controllers/Api/TicketController.php \
          src/Controllers/Api/TicketHistoryController.php; do
    php -l "$f" || exit 1
done
echo "ALL FILES SYNTAX VALID"

# Autoload coherent
composer dump-autoload --quiet && echo "AUTOLOAD OK"

# Integration contracts from Wave 1 are consumable
grep -n 'class TicketRepository' src/Repositories/TicketRepository.php && echo "CONTRACT: TicketRepository OK"
grep -n 'class ActionRepository' src/Repositories/ActionRepository.php && echo "CONTRACT: ActionRepository OK"

# Services structure check
grep -c 'function ' src/Services/TicketService.php | grep -q '^[89]$' && echo "TICKETSERVICE METHOD COUNT OK" || echo "INFO: TicketService has $(grep -c 'function ' src/Services/TicketService.php) methods"

# Controller handler methods
for method in create show update assign bulkAssign close reopen delete postResponse postComment; do
    grep -qn "function ${method}" src/Controllers/Api/TicketController.php && echo "HANDLER ${method} OK"
done

# History controller
grep -n 'function index' src/Controllers/Api/TicketHistoryController.php && echo "HISTORY INDEX OK"
```
</verification>

<success_criteria>
- All 7 new PHP files exist and pass `php -l` syntax check
- `composer dump-autoload` exits 0 with Http\, Services\, Controllers\Api\ namespaces registered
- TicketService has 9 public methods covering every F00 lifecycle transition
- Every lifecycle transition writes an immutable Action record (verified by grep for `$this->actions->insert`)
- TicketController properly gates mutating routes with hasRole() checks (staff/admin for CRUD, admin for delete)
- Response shape follows TechArch §4.2 Ticket TypeScript interface (hydrateTicket includes category, department, assignee, substatus, sla)
- GET /api/tickets/{id}/history filters by visibility based on caller role
- ActionRepository.findByTicketIdPaginated() and SubstatusRepository.findDefault() added
- No legacy crm/src/Application/ files modified
</success_criteria>

<output>
After completion, create `.planning/express/modernize-the-ureport-legacy-php-crm-imp/04-SUMMARY.md` with:
- Files created/modified
- Key decisions made
- Any deviations from this plan
- Integration contracts fulfilled from Wave 1
- Integration contracts provided to Wave 3
</output>
