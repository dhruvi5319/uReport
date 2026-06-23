---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 10
type: execute
wave: 2
depends_on: [1]
files_modified:
  - crm/src/Controllers/Api/TicketController.php
  - crm/src/Services/TicketService.php
  - crm/src/Controllers/Api/OpenApiController.php
  - crm/public/api/openapi.json
  - crm/public/api/docs/index.html
autonomous: true

features:
  implements: ["F18", "F16"]
  depends_on: ["F0", "F6", "F8"]
  enables: ["F15"]

must_haves:
  truths:
    - "POST /api/tickets/{id}/merge closes the source ticket, sets mergedIntoTicketId, creates two actions records (one on source, one on target), and returns the merge result envelope"
    - "GET /api/tickets/{id}/merge-candidates returns open, non-merged, non-deleted tickets matching a search query that are not the source ticket"
    - "Merge validates: source != target, source not already merged, target is open and not merged, caller is staff/admin"
    - "Merge errors return correct HTTP codes: 422 SELF_MERGE, 409 ALREADY_MERGED, 409 TARGET_CLOSED, 409 TARGET_MERGED, 404 NOT_FOUND"
    - "GET /api/openapi.json returns a valid OpenAPI 3.1 JSON document listing all /api/ endpoints"
    - "GET /api/docs returns Swagger UI HTML that loads /api/openapi.json"
  artifacts:
    - path: "crm/src/Controllers/Api/TicketController.php"
      provides: "merge() and mergeCandidates() action methods added to existing TicketController"
      exports: ["merge", "mergeCandidates"]
    - path: "crm/src/Services/TicketService.php"
      provides: "mergeTickets() orchestration: validation, DB updates, dual action records, notification trigger"
      exports: ["mergeTickets"]
    - path: "crm/src/Controllers/Api/OpenApiController.php"
      provides: "Serves /api/openapi.json (raw spec), /api/openapi.yaml, and /api/docs (Swagger UI)"
      exports: ["OpenApiController"]
    - path: "crm/public/api/openapi.json"
      provides: "Static OpenAPI 3.1 spec document covering all /api/ endpoints"
      contains: "openapi: 3.1.0"
    - path: "crm/public/api/docs/index.html"
      provides: "Swagger UI HTML page loading openapi.json from /api/openapi.json"
      contains: "swagger-ui"
  key_links:
    - from: "crm/src/Controllers/Api/TicketController.php"
      to: "crm/src/Services/TicketService.php"
      via: "TicketService::mergeTickets() call"
      pattern: "mergeTickets"
    - from: "crm/src/Services/TicketService.php"
      to: "crm/src/Repositories/TicketRepository.php"
      via: "TicketRepository::setMerged() and findById()"
      pattern: "setMerged|findById"
    - from: "crm/src/Services/TicketService.php"
      to: "crm/src/Repositories/ActionRepository.php"
      via: "ActionRepository::insert() for dual merge action records"
      pattern: "insert.*merged|merged.*insert"
    - from: "crm/src/Controllers/Api/OpenApiController.php"
      to: "crm/public/api/openapi.json"
      via: "file_get_contents or readfile() of static spec"
      pattern: "openapi\\.json"

integration_contracts:
  requires:
    - from_plan: "02"
      artifact: "crm/src/Repositories/TicketRepository.php"
      exports: ["TicketRepository", "setMerged", "findById"]
      verify: "grep -n 'class TicketRepository' crm/src/Repositories/TicketRepository.php && grep -n 'setMerged' crm/src/Repositories/TicketRepository.php && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "crm/src/Repositories/ActionRepository.php"
      exports: ["ActionRepository", "insert"]
      verify: "grep -n 'class ActionRepository' crm/src/Repositories/ActionRepository.php && grep -n 'insert' crm/src/Repositories/ActionRepository.php && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "crm/src/Domain/Ticket.php"
      exports: ["Domain\\Ticket", "fromRow"]
      verify: "grep -n 'readonly class Ticket' crm/src/Domain/Ticket.php && grep -n 'fromRow' crm/src/Domain/Ticket.php && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "crm/src/Domain/Action.php"
      exports: ["Domain\\Action", "fromRow"]
      verify: "grep -n 'readonly class Action' crm/src/Domain/Action.php && grep -n 'fromRow' crm/src/Domain/Action.php && echo CONTRACT_OK"
  provides:
    - artifact: "crm/src/Controllers/Api/TicketController.php"
      exports: ["merge", "mergeCandidates"]
      shape: |
        POST /api/tickets/{id}/merge
        Request:  { "targetTicketId": int }
        Response 200: { "data": { "sourceTicketId": int, "targetTicketId": int, "status": "merged", "mergedAt": ISO8601 }, "meta": {}, "errors": [] }
        Response 422: { "errors": [{ "field": "targetTicketId", "message": "Cannot merge a ticket into itself", "code": "SELF_MERGE" }] }
        Response 409: { "errors": [{ "field": null, "message": "...", "code": "ALREADY_MERGED|TARGET_CLOSED|TARGET_MERGED" }] }

        GET /api/tickets/{id}/merge-candidates?q=string&page=1&perPage=25
        Response 200: { "data": [Ticket objects], "meta": { "total": int, "page": int, "perPage": int }, "errors": [] }
      verify: "grep -n 'function merge' crm/src/Controllers/Api/TicketController.php && grep -n 'mergeCandidates' crm/src/Controllers/Api/TicketController.php && echo CONTRACT_OK"
    - artifact: "crm/public/api/openapi.json"
      exports: ["OpenAPI 3.1 spec"]
      shape: |
        {
          "openapi": "3.1.0",
          "info": { "title": "uReport API", "version": "1.0.0" },
          "paths": { "/api/tickets": { ... }, "/api/tickets/{id}/merge": { ... }, ... }
        }
      verify: "grep -n '\"openapi\"' crm/public/api/openapi.json && grep -n '3.1.0' crm/public/api/openapi.json && echo CONTRACT_OK"
    - artifact: "crm/src/Controllers/Api/OpenApiController.php"
      exports: ["OpenApiController"]
      shape: |
        class OpenApiController {
          public function spec(): void;    // GET /api/openapi.json → 200 application/json
          public function yaml(): void;    // GET /api/openapi.yaml → 200 text/yaml
          public function docs(): void;    // GET /api/docs → 200 text/html (Swagger UI)
        }
      verify: "grep -n 'class OpenApiController' crm/src/Controllers/Api/OpenApiController.php && echo CONTRACT_OK"
---

<objective>
Implement ticket merge endpoint (F18) and OpenAPI 3.1 documentation infrastructure (F16) for Wave 2d.

Ticket merge (F18):
- `POST /api/tickets/{id}/merge` — closes source ticket, sets `mergedIntoTicketId`, writes dual action records (one `merged` action on source, one on target), triggers reporter notification, returns merge result envelope.
- `GET /api/tickets/{id}/merge-candidates` — returns paginated list of valid merge targets (open, non-merged, non-deleted, non-self).
- Orchestrated by `TicketService::mergeTickets()` (single DB transaction) calling `TicketRepository::setMerged()` and `ActionRepository::insert()` twice.

OpenAPI 3.1 documentation (F16):
- Static `crm/public/api/openapi.json` — hand-authored OpenAPI 3.1 spec covering all `/api/` endpoints defined across Wave 2a–2d.
- `OpenApiController` serves `GET /api/openapi.json`, `GET /api/openapi.yaml`, and `GET /api/docs` (Swagger UI CDN HTML).
- No code-generation tooling required — static spec file is the source of truth; `openapi-typescript` on the frontend reads it to produce TypeScript types in Wave 3a.

Purpose: Complete the Wave 2d backend surface. The OpenAPI spec is the integration contract consumed by the Wave 3a/3d frontend to generate type-safe API client types.

Output:
- `TicketController.php` — merge() and mergeCandidates() methods added
- `TicketService.php` — mergeTickets() service method
- `OpenApiController.php` — serves spec + Swagger UI
- `crm/public/api/openapi.json` — complete OpenAPI 3.1 spec
- `crm/public/api/docs/index.html` — Swagger UI HTML
</objective>

<feature_dependencies>
Implements: F18: Ticket Merging (POST /api/tickets/{id}/merge — close source, set mergedIntoTicketId, dual actions, reporter notification), F16: RESTful JSON API Backend (OpenAPI 3.1 spec generation at /api/openapi.json and Swagger UI at /api/docs)
Depends on: F0: Ticket Lifecycle (tickets table, TicketRepository, ActionRepository from Wave 1), F6: Audit Trail (ActionRepository.insert — immutable merged actions), F8: Notifications (NotificationService.send with ticket_merged template slug)
Enables: F15: SPA Frontend (Wave 3d MergeDialog consumes POST /api/tickets/{id}/merge and GET /api/tickets/{id}/merge-candidates; Wave 3a consumes openapi.json to generate TypeScript types via openapi-typescript)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@project_specs/TechArch-uReport.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/02-PLAN.md

# Key prior-wave artifacts consumed:
# - crm/src/Repositories/TicketRepository.php — setMerged(int $sourceId, int $targetId), findById(), findByFilters()
# - crm/src/Repositories/ActionRepository.php — insert(Action $action): Action (immutable)
# - crm/src/Domain/Ticket.php — readonly class with mergedIntoTicketId, status fields
# - crm/src/Domain/Action.php — readonly class with TYPES constant including 'merged'
</context>

<tasks>

<task type="auto">
  <name>Task 1: Ticket merge service and controller actions (F18)</name>
  <files>
    crm/src/Services/TicketService.php
    crm/src/Controllers/Api/TicketController.php
  </files>
  <action>
**Context:** Wave 1 (plan 02) produced `TicketRepository` with `setMerged(int $sourceId, int $targetId): void` and `ActionRepository` with `insert(Domain\Action $action): Domain\Action`. The `Domain\Action::TYPES` constant includes `'merged'`. The `TicketController` may already exist from Wave 2a (if executing in parallel, treat it as new; if 2a ran first, ADD the merge methods without removing anything).

**Step 1: Create/update `crm/src/Services/TicketService.php`**

Add `mergeTickets()` method. If `TicketService.php` does not exist, create the class skeleton with only this method. If it exists from another wave, ADD `mergeTickets()` to the existing class without modifying other methods.

The method must be a single database transaction that:
1. Validates business rules (pre-transaction)
2. Executes the merge in a transaction (update ticket + two action inserts)
3. Triggers the reporter notification (post-transaction, non-fatal)

```php
<?php
declare(strict_types=1);
namespace Services;

use Domain\Action;
use Domain\Ticket;
use Repositories\TicketRepository;
use Repositories\ActionRepository;

class TicketService
{
    public function __construct(
        private TicketRepository $tickets,
        private ActionRepository $actions,
        // NotificationService injected if it exists from Wave 2c — optional dependency
        private ?object $notifications = null,
    ) {}

    /**
     * Merge source ticket into target ticket.
     *
     * From FRD F18 §Process: Execute Merge:
     * 1. source != target (422 SELF_MERGE)
     * 2. source.mergedIntoTicketId IS NULL (409 ALREADY_MERGED)
     * 3. target.status = 'open' (409 TARGET_CLOSED)
     * 4. target.mergedIntoTicketId IS NULL (409 TARGET_MERGED)
     * 5. Set source.status = 'closed', source.mergedIntoTicketId = target.id, source.datetimeClosed = NOW()
     * 6. Insert action on source: type='merged', payload.mergedIntoTicketId = target.id
     * 7. Insert action on target: type='merged', payload.mergedFromTicketId = source.id
     * 8. Send ticket_merged notification to source reporter
     * 9. (Solr sync deferred to SearchService — not in scope here)
     *
     * @param int $sourceId    The ticket being merged away
     * @param int $targetId    The canonical ticket to merge into
     * @param int $actorPersonId  The staff/admin person performing the merge
     * @return array{ sourceTicketId: int, targetTicketId: int, status: string, mergedAt: string }
     * @throws \InvalidArgumentException  with codes: SELF_MERGE, ALREADY_MERGED, TARGET_CLOSED, TARGET_MERGED, NOT_FOUND
     */
    public function mergeTickets(int $sourceId, int $targetId, int $actorPersonId): array
    {
        // Validate: source != target
        if ($sourceId === $targetId) {
            throw new \InvalidArgumentException('Cannot merge a ticket into itself', 422);
        }

        $source = $this->tickets->findById($sourceId);
        if ($source === null) {
            throw new \RuntimeException('Source ticket not found', 404);
        }

        $target = $this->tickets->findById($targetId);
        if ($target === null) {
            throw new \RuntimeException('Target ticket not found', 404);
        }

        // Validate: source not already merged
        if ($source->mergedIntoTicketId !== null) {
            throw new \RuntimeException('This ticket has already been merged', 409);
        }

        // Validate: target is open
        if ($target->status !== 'open') {
            throw new \RuntimeException('Cannot merge into a closed ticket', 409);
        }

        // Validate: target not itself merged
        if ($target->mergedIntoTicketId !== null) {
            throw new \RuntimeException('Cannot merge into a ticket that has already been merged', 409);
        }

        $mergedAt = date('Y-m-d H:i:s');

        // Execute in a transaction
        $this->tickets->beginTransaction();
        try {
            // Step 5: close source, set mergedIntoTicketId
            $this->tickets->setMerged($sourceId, $targetId);

            // Step 6: action on SOURCE — type='merged', payload.mergedIntoTicketId
            $sourceAction = new Action(
                id:              0,
                ticketId:        $sourceId,
                type:            'merged',
                visibility:      'internal',
                actorPersonId:   $actorPersonId,
                actorClientId:   null,
                datetimeCreated: $mergedAt,
                payload:         json_encode(['mergedIntoTicketId' => $targetId], JSON_THROW_ON_ERROR),
            );
            $this->actions->insert($sourceAction);

            // Step 7: action on TARGET — type='merged', payload.mergedFromTicketId
            $targetAction = new Action(
                id:              0,
                ticketId:        $targetId,
                type:            'merged',
                visibility:      'internal',
                actorPersonId:   $actorPersonId,
                actorClientId:   null,
                datetimeCreated: $mergedAt,
                payload:         json_encode(['mergedFromTicketId' => $sourceId], JSON_THROW_ON_ERROR),
            );
            $this->actions->insert($targetAction);

            $this->tickets->commit();
        } catch (\Throwable $e) {
            $this->tickets->rollback();
            throw $e;
        }

        // Step 8: Notify source reporter (non-fatal — notification failure must NOT abort the merge)
        // NotificationService is optional; only call it if injected and source has a reporter email
        if ($this->notifications !== null && method_exists($this->notifications, 'send')) {
            $updatedSource = $this->tickets->findById($sourceId);
            $reporterEmail = $updatedSource?->reporterEmail;
            if ($reporterEmail !== null && $reporterEmail !== '') {
                try {
                    $this->notifications->send(
                        slug:          'ticket_merged',
                        recipientEmail: $reporterEmail,
                        ticketId:      $sourceId,
                        vars:          [
                            'ticket_id'  => (string) $sourceId,
                            'ticket_url' => '#' . $targetId,
                        ],
                    );
                } catch (\Throwable) {
                    // Non-fatal: log but do not re-throw
                    error_log("ticket_merged notification failed for ticket $sourceId -> $targetId");
                }
            }
        }

        return [
            'sourceTicketId' => $sourceId,
            'targetTicketId' => $targetId,
            'status'         => 'merged',
            'mergedAt'       => (new \DateTime($mergedAt))->format(\DateTime::ATOM),
        ];
    }
}
```

**Step 2: Add merge methods to `crm/src/Controllers/Api/TicketController.php`**

If `TicketController.php` does not exist, create it with the two merge methods only (Wave 2a adds the other ticket methods in parallel — do NOT duplicate them here if the file exists). If it exists from Wave 2a, ADD the two methods to the existing class.

The two methods to add:

```php
    /**
     * POST /api/tickets/{id}/merge
     * Body: { "targetTicketId": int }
     * Auth: staff/admin (enforced by RbacMiddleware upstream)
     *
     * From TechArch §4.3 and FRD F18:
     * - 200: merge result envelope
     * - 422: SELF_MERGE
     * - 409: ALREADY_MERGED | TARGET_CLOSED | TARGET_MERGED
     * - 404: NOT_FOUND (source or target missing)
     * - 403: caller not staff/admin (middleware handles this)
     */
    public function merge(int $id): void
    {
        // Parse and validate body
        $body = json_decode((string) file_get_contents('php://input'), true) ?? [];
        $targetTicketId = isset($body['targetTicketId']) ? (int) $body['targetTicketId'] : null;

        if ($targetTicketId === null || $targetTicketId <= 0) {
            $this->jsonResponse(422, [
                'data'   => null,
                'meta'   => (object) [],
                'errors' => [['field' => 'targetTicketId', 'message' => 'targetTicketId is required and must be a positive integer', 'code' => 'VALIDATION_ERROR']],
            ]);
            return;
        }

        // Actor comes from AuthMiddleware context (set on $_REQUEST or a context object)
        // Convention from Wave 2a: actor person ID is stored in $_REQUEST['_actorPersonId']
        $actorPersonId = (int) ($_REQUEST['_actorPersonId'] ?? 0);

        $service = new \Services\TicketService(
            new \Repositories\TicketRepository(),
            new \Repositories\ActionRepository(),
        );

        try {
            $result = $service->mergeTickets($id, $targetTicketId, $actorPersonId);
            $this->jsonResponse(200, ['data' => $result, 'meta' => (object) [], 'errors' => []]);
        } catch (\InvalidArgumentException $e) {
            // 422 SELF_MERGE
            $this->jsonResponse(422, [
                'data'   => null,
                'meta'   => (object) [],
                'errors' => [['field' => 'targetTicketId', 'message' => $e->getMessage(), 'code' => 'SELF_MERGE']],
            ]);
        } catch (\RuntimeException $e) {
            $code = $e->getCode();
            $httpStatus = match(true) {
                $code === 404                          => 404,
                in_array($code, [409], true)           => 409,
                default                                => 500,
            };
            $errorCode = match($e->getMessage()) {
                'This ticket has already been merged'                        => 'ALREADY_MERGED',
                'Cannot merge into a closed ticket'                          => 'TARGET_CLOSED',
                'Cannot merge into a ticket that has already been merged'    => 'TARGET_MERGED',
                'Source ticket not found', 'Target ticket not found'         => 'NOT_FOUND',
                default                                                      => 'INTERNAL_ERROR',
            };
            $this->jsonResponse($httpStatus, [
                'data'   => null,
                'meta'   => (object) [],
                'errors' => [['field' => null, 'message' => $e->getMessage(), 'code' => $errorCode]],
            ]);
        }
    }

    /**
     * GET /api/tickets/{id}/merge-candidates?q=string&page=1&perPage=25
     * Returns open, non-merged, non-deleted tickets that are not the source ticket.
     * Used by the frontend MergeDialog to search for a target ticket.
     *
     * From TechArch §4.3:
     * GET /api/tickets/{id}/merge-candidates  staff/admin  Search valid merge targets
     */
    public function mergeCandidates(int $id): void
    {
        $q       = trim($_GET['q'] ?? '');
        $page    = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = min(50, max(1, (int) ($_GET['perPage'] ?? 25)));

        $ticketRepo = new \Repositories\TicketRepository();

        // Build filters: open, not merged, not deleted (findByFilters excludes deletedAt by default)
        // We also exclude the source ticket itself ($id)
        $filters = [
            'status'           => 'open',
            'excludeId'        => $id,     // TicketRepository::findByFilters must honour this
            'notMerged'        => true,    // Only tickets with mergedIntoTicketId IS NULL
        ];
        if ($q !== '') {
            $filters['titleLike'] = $q;
        }

        // NOTE: if TicketRepository::findByFilters does not yet support excludeId/notMerged/titleLike,
        // extend it here with a direct query instead of calling findByFilters:
        try {
            $result = $this->findMergeCandidatesRaw($ticketRepo, $id, $q, $page, $perPage);
            $this->jsonResponse(200, [
                'data'   => $result['rows'],
                'meta'   => [
                    'total'   => $result['total'],
                    'page'    => $page,
                    'perPage' => $perPage,
                    'pages'   => (int) ceil($result['total'] / $perPage),
                ],
                'errors' => [],
            ]);
        } catch (\Throwable $e) {
            $this->jsonResponse(500, [
                'data'   => null,
                'meta'   => (object) [],
                'errors' => [['field' => null, 'message' => 'Internal error', 'code' => 'INTERNAL_ERROR']],
            ]);
        }
    }

    /**
     * Direct PDO query for merge candidates — avoids dependency on Solr for this simple filter.
     * Returns ['rows' => array of raw ticket rows, 'total' => int]
     */
    private function findMergeCandidatesRaw(
        \Repositories\TicketRepository $repo,
        int $sourceId,
        string $q,
        int $page,
        int $perPage
    ): array {
        // Access the PDO via the repository's pdo property (protected — use reflection or a dedicated method)
        // Preferred: add a public findMergeCandidates() to TicketRepository.
        // Fallback used here: call findByFilters with available filter options.
        // The full filter with titleLike and notMerged requires extending TicketRepository — do that below.
        $results = $repo->findMergeCandidates($sourceId, $q, $page, $perPage);
        return $results;
    }

    /**
     * Emit JSON response and exit.
     * If this helper already exists in the controller from Wave 2a, do NOT redefine it.
     */
    private function jsonResponse(int $status, mixed $body): void
    {
        if (!headers_sent()) {
            http_response_code($status);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        // Do not exit() — middleware/router may handle that
    }
```

**Step 3: Add `findMergeCandidates()` to `crm/src/Repositories/TicketRepository.php`**

This is a targeted addition to the existing `TicketRepository` from Wave 1 (plan 02). ADD the method — do NOT remove or rewrite existing methods.

```php
    /**
     * Find valid merge targets for a given source ticket.
     * Valid targets are: open, not merged (mergedIntoTicketId IS NULL), not deleted, not the source itself.
     * Optional: filter by title substring match on $q.
     * Returns ['rows' => array[], 'total' => int].
     */
    public function findMergeCandidates(
        int    $sourceId,
        string $q       = '',
        int    $page    = 1,
        int    $perPage = 25,
    ): array {
        $where  = [
            't.deletedAt IS NULL',
            "t.status = 'open'",
            't.mergedIntoTicketId IS NULL',
            't.id != :sourceId',
        ];
        $params = ['sourceId' => $sourceId];

        if ($q !== '') {
            $where[]         = '(t.title LIKE :q OR t.description LIKE :q)';
            $params['q']     = '%' . $q . '%';
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);
        $sql = "SELECT t.* FROM tickets t $whereClause ORDER BY t.datetimeOpened DESC";

        return $this->paginate($sql, $params, fn($row) => \Domain\Ticket::fromRow($row), $page, $perPage);
    }
```

**Important notes for execution:**
- `TicketController.php` may already exist from Wave 2a. If it does: ADD the three methods (`merge`, `mergeCandidates`, `findMergeCandidatesRaw`) to the existing class. Do NOT add a duplicate `jsonResponse()` if it already exists.
- `TicketService.php` may already exist from Wave 2a/2c. If it does: ADD the `mergeTickets()` method to the existing class. Do NOT rewrite the constructor if it already accepts different arguments — instead add `mergeTickets()` using constructor-injected `$this->tickets` and `$this->actions`.
- `TicketRepository.php` from plan 02: ADD `findMergeCandidates()` — do NOT modify existing methods.
- All new action records use `new Action(id: 0, ...)` — the ActionRepository::insert() assigns the real id.
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/crm

# Merge method exists in TicketController
grep -n 'function merge\b' src/Controllers/Api/TicketController.php && echo "MERGE METHOD OK"

# mergeCandidates method exists in TicketController
grep -n 'function mergeCandidates' src/Controllers/Api/TicketController.php && echo "MERGE_CANDIDATES METHOD OK"

# TicketService::mergeTickets exists
grep -n 'function mergeTickets' src/Services/TicketService.php && echo "SERVICE_METHOD OK"

# Dual action inserts exist in TicketService
grep -c 'actions->insert' src/Services/TicketService.php | grep -E '^2$' && echo "DUAL_ACTION_INSERT OK"

# findMergeCandidates added to TicketRepository
grep -n 'function findMergeCandidates' src/Repositories/TicketRepository.php && echo "REPO_METHOD OK"

# Transaction wraps the merge in TicketService
grep -n 'beginTransaction\|commit\|rollback' src/Services/TicketService.php && echo "TRANSACTION OK"

# PHPStan on new files (requires Wave 1 repos to exist for type resolution)
vendor/bin/phpstan analyse src/Services/TicketService.php src/Controllers/Api/TicketController.php --level=6 --no-progress 2>&1 | tail -5
```
  </verify>
  <done>
- `TicketController::merge(int $id)` exists and handles POST /api/tickets/{id}/merge
- `TicketController::mergeCandidates(int $id)` exists and handles GET /api/tickets/{id}/merge-candidates
- `TicketService::mergeTickets(int $sourceId, int $targetId, int $actorPersonId)` exists
- Transaction wraps: setMerged() + two ActionRepository::insert() calls
- Correct exception codes map to HTTP 422 (SELF_MERGE), 409 (ALREADY_MERGED, TARGET_CLOSED, TARGET_MERGED), 404 (NOT_FOUND)
- `TicketRepository::findMergeCandidates()` added — returns open, non-merged, non-source, optionally title-filtered candidates
- PHPStan level 6+ passes on new files
  </done>
</task>

<task type="auto">
  <name>Task 2: Static OpenAPI 3.1 spec and Swagger UI controller (F16)</name>
  <files>
    crm/public/api/openapi.json
    crm/public/api/docs/index.html
    crm/src/Controllers/Api/OpenApiController.php
  </files>
  <action>
**Context:** The OpenAPI spec must cover ALL `/api/` endpoints from Waves 2a–2d. It is a static JSON file served at `/api/openapi.json`. The frontend (Wave 3a) uses `openapi-typescript` to generate TypeScript types from this file. The Swagger UI at `/api/docs` loads this file for interactive browsing.

**From TechArch §4.3 (OpenAPI Documentation):**
```
GET /api/docs          staff  Swagger UI HTML page
GET /api/openapi.json  staff  OpenAPI 3.1 JSON spec
GET /api/openapi.yaml  staff  OpenAPI 3.1 YAML spec
```

**Step 1: Create `crm/public/api/openapi.json`**

Write the complete OpenAPI 3.1 JSON spec. It MUST include:
- `openapi: "3.1.0"`
- `info.title: "uReport API"`, `info.version: "1.0.0"`
- All paths from TechArch §4.3 covering Tickets, Search, Geo, Reporting, Departments, Categories, People, Substatuses, Templates, API Clients, Bookmarks, Auth, and the merge endpoints from F18
- The `ApiEnvelope<T>` response wrapper schema `{ data, meta, errors }` from TechArch §4.1
- The canonical TypeScript interface shapes from TechArch §4.2 expressed as JSON Schema components
- Security scheme: `BearerAuth` (JWT in `Authorization: Bearer` or cookie `ureport_session`)
- Tags grouping endpoints by domain: tickets, search, geo, reports, admin-departments, admin-categories, admin-people, admin-substatuses, admin-templates, admin-clients, bookmarks, auth

The spec must be valid against OpenAPI 3.1. Key paths to include (from TechArch §4.3):

**Tickets:**
- POST /api/tickets — createTicket
- GET /api/tickets — listTickets (search/filter)
- GET /api/tickets/{id} — getTicket
- PUT /api/tickets/{id} — updateTicket
- DELETE /api/tickets/{id} — deleteTicket
- POST /api/tickets/{id}/assign — assignTicket
- POST /api/tickets/{id}/close — closeTicket
- POST /api/tickets/{id}/reopen — reopenTicket
- POST /api/tickets/{id}/responses — postResponse
- POST /api/tickets/{id}/comments — postComment
- POST /api/tickets/{id}/merge — mergeTicket (F18)
- GET /api/tickets/{id}/merge-candidates — getMergeCandidates (F18)
- GET /api/tickets/{id}/history — getTicketHistory
- GET /api/tickets/{id}/media — listMedia
- POST /api/tickets/{id}/media — uploadMedia
- DELETE /api/tickets/{id}/media/{mediaId} — deleteMedia
- GET /api/tickets/clusters — getClusters
- POST /api/tickets/bulk-assign — bulkAssign

**Reports & Geo:**
- GET /api/reports/activity, /api/reports/assignments, /api/reports/categories, /api/reports/departments, /api/reports/staff-performance, /api/reports/sla, /api/reports/volume, /api/reports/open-age
- GET /api/metrics/sla
- GET /api/geocode, GET /api/tickets/{id}/location

**Admin:**
- GET/POST /api/departments, GET/PUT/DELETE /api/departments/{id}
- GET/POST /api/categories, GET/PUT/DELETE /api/categories/{id}
- GET/POST/PUT/DELETE /api/category-groups, /api/category-groups/{id}
- GET/POST /api/people, GET/PUT/DELETE /api/people/{id}
- GET/POST/PUT/DELETE /api/people/{id}/contact-methods, /api/people/{id}/contact-methods/{cmId}
- GET/POST/GET/PUT/DELETE /api/substatuses, /api/substatuses/{id}
- GET/POST/GET/PUT/DELETE /api/templates, /api/templates/{id}
- GET/POST/GET/PUT/DELETE/POST /api/clients, /api/clients/{id}, /api/clients/{id}/regenerate-key
- GET/POST/GET/DELETE /api/bookmarks, /api/bookmarks/{id}
- GET/PUT /api/notifications/settings

**Auth:**
- GET /auth/login, GET /auth/callback, POST /auth/logout, GET /auth/me

Write the file as valid compact JSON. Use `$ref` to reuse schemas defined in `#/components/schemas`. Define at minimum these component schemas matching TechArch §4.2 TypeScript interfaces:
- `Ticket`, `Action`, `Media`, `Person`, `Department`, `Category`, `CategoryGroup`, `Substatus`, `Template`, `ApiClient`, `Bookmark`, `GeoCluster`, `SlaMetric`, `ActivityReport`, `AssignmentReport`
- Request bodies: `CreateTicketBody`, `UpdateTicketBody`, `AssignTicketBody`, `CloseTicketBody`, `ReopenTicketBody`, `MergeTicketBody`, `PostResponseBody`, `PostCommentBody`, `CreateDepartmentBody`, `CreateCategoryBody`, `CreatePersonBody`, `CreateContactMethodBody`, `CreateSubstatusBody`, `CreateTemplateBody`, `CreateApiClientBody`, `CreateBookmarkBody`
- Standard error: `ApiError { field, message, code }`
- Standard envelope: `ApiEnvelope { data, meta: PaginationMeta, errors: [ApiError] }`

**Step 2: Create `crm/public/api/docs/index.html`**

Minimal Swagger UI HTML page loading from CDN (swagger-ui v5 from unpkg):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>uReport API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
      deepLinking: true,
      tryItOutEnabled: true,
    });
  </script>
</body>
</html>
```

**Step 3: Create `crm/src/Controllers/Api/OpenApiController.php`**

Thin controller that serves the spec file and Swagger UI. Auth: staff/admin enforced by RbacMiddleware upstream.

```php
<?php
declare(strict_types=1);
namespace Controllers\Api;

class OpenApiController
{
    private string $specPath;
    private string $docsPath;

    public function __construct()
    {
        // Resolve paths relative to this file's location
        $publicDir      = dirname(__DIR__, 3) . '/public';
        $this->specPath = $publicDir . '/api/openapi.json';
        $this->docsPath = $publicDir . '/api/docs/index.html';
    }

    /**
     * GET /api/openapi.json — serve the raw OpenAPI 3.1 JSON spec
     */
    public function spec(): void
    {
        if (!file_exists($this->specPath)) {
            http_response_code(404);
            echo json_encode(['error' => 'OpenAPI spec not found']);
            return;
        }
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: public, max-age=300');
        readfile($this->specPath);
    }

    /**
     * GET /api/openapi.yaml — serve the spec as YAML
     * Converts JSON to YAML on-the-fly. Requires symfony/yaml or fallback to JSON redirect.
     */
    public function yaml(): void
    {
        if (!file_exists($this->specPath)) {
            http_response_code(404);
            return;
        }
        // If symfony/yaml is available, convert; otherwise redirect to JSON
        if (class_exists(\Symfony\Component\Yaml\Yaml::class)) {
            $json = file_get_contents($this->specPath);
            $data = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
            header('Content-Type: application/yaml; charset=utf-8');
            echo \Symfony\Component\Yaml\Yaml::dump($data, 10, 2);
        } else {
            // Graceful degradation: redirect to JSON
            header('Location: /api/openapi.json', true, 302);
        }
    }

    /**
     * GET /api/docs — serve the Swagger UI HTML page
     */
    public function docs(): void
    {
        if (!file_exists($this->docsPath)) {
            http_response_code(404);
            echo '<!DOCTYPE html><html><body>API docs not found.</body></html>';
            return;
        }
        header('Content-Type: text/html; charset=utf-8');
        header('X-Frame-Options: SAMEORIGIN');
        readfile($this->docsPath);
    }
}
```

**Step 4: Verify the spec references the merge endpoint**

After writing openapi.json, confirm it includes:
- `/api/tickets/{id}/merge` with POST method and `MergeTicketBody` request body
- `/api/tickets/{id}/merge-candidates` with GET method
- `MergeTicketBody` schema: `{ targetTicketId: integer }`

The spec does NOT need to cover `/open311/` endpoints — those are preserved verbatim and documented separately (TechArch §4.1 note).
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/crm

# Verify openapi.json exists and is valid JSON
php -r "
  \$json = file_get_contents('public/api/openapi.json');
  \$data = json_decode(\$json, true);
  if (json_last_error() !== JSON_ERROR_NONE) { exit(1); }
  echo 'JSON VALID' . PHP_EOL;
"

# Verify OpenAPI 3.1 version declared
grep -n '"openapi"' public/api/openapi.json && grep -n '"3.1.0"' public/api/openapi.json && echo "OPENAPI_VERSION OK"

# Verify merge endpoint documented
grep -n 'merge' public/api/openapi.json | grep -v 'mergedIntoTicketId\|mergedFrom\|merged.*action' | head -5 && echo "MERGE_ENDPOINT_IN_SPEC OK"

# Verify Swagger UI HTML exists
ls public/api/docs/index.html && echo "SWAGGER_UI_HTML OK"

# Verify OpenApiController exists with spec/docs/yaml methods
grep -n 'function spec\|function docs\|function yaml' src/Controllers/Api/OpenApiController.php && echo "OPENAPI_CONTROLLER OK"

# Verify Swagger UI HTML references swagger-ui
grep -n 'swagger-ui' public/api/docs/index.html && echo "SWAGGER_UI_REF OK"

# Verify spec references /api/openapi.json in the Swagger UI page
grep -n 'openapi.json' public/api/docs/index.html && echo "SPEC_URL_IN_UI OK"

# PHPStan on OpenApiController
vendor/bin/phpstan analyse src/Controllers/Api/OpenApiController.php --level=6 --no-progress 2>&1 | tail -3
```
  </verify>
  <done>
- `crm/public/api/openapi.json` exists, is valid JSON, declares `"openapi": "3.1.0"`, and includes all major endpoint paths from TechArch §4.3 including `/api/tickets/{id}/merge`
- `crm/public/api/docs/index.html` exists and references `swagger-ui` and `/api/openapi.json`
- `OpenApiController` exists with `spec()`, `yaml()`, `docs()` methods
- `OpenApiController::spec()` serves `application/json` from the static spec file
- `OpenApiController::docs()` serves the Swagger UI HTML page
- PHPStan level 6 passes on `OpenApiController.php`
  </done>
</task>

</tasks>

<verification>
```bash
cd /app/workspaces/pivota/uReport/crm

echo "=== MERGE ENDPOINT ==="
grep -n 'function merge\b' src/Controllers/Api/TicketController.php && echo "OK: merge() in TicketController"
grep -n 'function mergeCandidates' src/Controllers/Api/TicketController.php && echo "OK: mergeCandidates() in TicketController"
grep -n 'function mergeTickets' src/Services/TicketService.php && echo "OK: mergeTickets() in TicketService"
grep -n 'function findMergeCandidates' src/Repositories/TicketRepository.php && echo "OK: findMergeCandidates() in TicketRepository"

echo "=== OPENAPI ==="
grep -n '"openapi".*"3.1.0"' public/api/openapi.json && echo "OK: OpenAPI 3.1"
grep -n '/api/tickets/' public/api/openapi.json | wc -l && echo "ticket paths in spec"
grep -n 'swagger-ui' public/api/docs/index.html && echo "OK: Swagger UI HTML"
grep -n 'function spec' src/Controllers/Api/OpenApiController.php && echo "OK: OpenApiController"

echo "=== CONTRACTS ==="
grep -n 'setMerged' src/Repositories/TicketRepository.php && echo "OK: setMerged in TicketRepository"
grep -n 'class ActionRepository' src/Repositories/ActionRepository.php && echo "OK: ActionRepository exists"
```
</verification>

<success_criteria>
- `POST /api/tickets/{id}/merge` closes source ticket, sets `mergedIntoTicketId`, inserts two `merged` action records (source + target), returns `{ data: { sourceTicketId, targetTicketId, status: "merged", mergedAt } }`
- Merge validation returns correct HTTP/error codes: 422/SELF_MERGE, 409/ALREADY_MERGED, 409/TARGET_CLOSED, 409/TARGET_MERGED, 404/NOT_FOUND
- `GET /api/tickets/{id}/merge-candidates` returns paginated open non-merged tickets excluding source
- `GET /api/openapi.json` returns valid OpenAPI 3.1 JSON with all Wave 2a–2d endpoints documented
- `GET /api/docs` returns Swagger UI HTML loading the spec from `/api/openapi.json`
- PHPStan level 6+ passes on all new PHP files
- Wave 3d frontend can call `POST /api/tickets/{id}/merge` and display merge result
- Wave 3a frontend can run `npx openapi-typescript /api/openapi.json --output lib/api/generated/types.ts` to generate TypeScript types
</success_criteria>

<output>
After completion, create `.planning/express/modernize-the-ureport-legacy-php-crm-imp/10-SUMMARY.md` with:
- Files created/modified
- Merge endpoint contract: request body shape, response shape, error codes
- OpenAPI spec location and coverage summary
- Any deviations from the plan (e.g., TicketController already existed from Wave 2a)
</output>
