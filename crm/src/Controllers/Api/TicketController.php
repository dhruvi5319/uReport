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
use Repositories\ActionRepository;

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

    // ─── POST /api/tickets/{id}/merge (from Wave 2a Plan 10) ─────────────────

    /**
     * POST /api/tickets/{id}/merge
     * Body: { "targetTicketId": int }
     * Auth: staff/admin
     */
    public function merge(Request $req, array $params): void
    {
        if (!$req->hasRole('staff', 'admin')) Response::forbidden();

        $id             = (int) ($params['id'] ?? 0);
        $targetTicketId = $req->input('targetTicketId');

        if ($targetTicketId === null || (int)$targetTicketId <= 0) {
            Response::validationError([['field' => 'targetTicketId', 'message' => 'targetTicketId is required and must be a positive integer']]);
        }

        try {
            $result = $this->ticketService->mergeTickets($id, (int)$targetTicketId, $req->actorId());
            Response::json($result);
        } catch (\InvalidArgumentException $e) {
            Response::error(422, 'SELF_MERGE', $e->getMessage());
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
            if ($httpStatus === 404) Response::notFound($e->getMessage());
            Response::error($httpStatus, $errorCode, $e->getMessage());
        }
    }

    // ─── GET /api/tickets/{id}/merge-candidates ──────────────────────────────

    /**
     * GET /api/tickets/{id}/merge-candidates?q=string&page=1&perPage=25
     * Returns open, non-merged, non-deleted tickets for merge target search.
     */
    public function mergeCandidates(Request $req, array $params): void
    {
        if (!$req->hasRole('staff', 'admin')) Response::forbidden();

        $id      = (int) ($params['id'] ?? 0);
        $q       = trim($req->query['q'] ?? '');
        $page    = max(1, (int) ($req->query['page'] ?? 1));
        $perPage = min(50, max(1, (int) ($req->query['perPage'] ?? 25)));

        try {
            $result = $this->tickets->findMergeCandidates($id, $q, $page, $perPage);
            Response::json($result['rows'], 200, [
                'total'   => $result['total'],
                'page'    => $page,
                'perPage' => $perPage,
                'pages'   => (int) ceil($result['total'] / $perPage),
            ]);
        } catch (\Throwable $e) {
            Response::error(500, 'INTERNAL_ERROR', 'Internal error');
        }
    }
}
