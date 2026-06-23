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
     *
     * Visibility: Staff/admin see all actions; public/anonymous see external only (F06).
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
                $actor = $p
                    ? ['id' => $p->id, 'name' => $p->fullName(), 'type' => 'person']
                    : ['id' => $a->actorPersonId, 'name' => null, 'type' => 'person'];
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
