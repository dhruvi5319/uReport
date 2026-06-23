<?php
declare(strict_types=1);
namespace Controllers\Api;

class TicketController
{
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
                $code === 404                => 404,
                in_array($code, [409], true) => 409,
                default                      => 500,
            };
            $errorCode = match($e->getMessage()) {
                'This ticket has already been merged'                     => 'ALREADY_MERGED',
                'Cannot merge into a closed ticket'                       => 'TARGET_CLOSED',
                'Cannot merge into a ticket that has already been merged' => 'TARGET_MERGED',
                'Source ticket not found', 'Target ticket not found'      => 'NOT_FOUND',
                default                                                   => 'INTERNAL_ERROR',
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
        return $repo->findMergeCandidates($sourceId, $q, $page, $perPage);
    }

    /**
     * Emit JSON response and exit.
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
}
