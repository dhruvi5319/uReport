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
        // NotificationService injected if it exists from Wave 2c — optional dependency
        private ?object $notifications = null,
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

    // ─── Merge (from Wave 2a Plan 10) ─────────────────────────────────────────

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
     *
     * @param int $sourceId      The ticket being merged away
     * @param int $targetId      The canonical ticket to merge into
     * @param int $actorPersonId The staff/admin person performing the merge
     * @return array{ sourceTicketId: int, targetTicketId: int, status: string, mergedAt: string }
     * @throws \InvalidArgumentException with codes: SELF_MERGE
     * @throws \RuntimeException         with codes: ALREADY_MERGED, TARGET_CLOSED, TARGET_MERGED, NOT_FOUND
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
            $this->actions->insert(new Action(
                id:              0,
                ticketId:        $sourceId,
                type:            'merged',
                visibility:      'internal',
                actorPersonId:   $actorPersonId,
                actorClientId:   null,
                datetimeCreated: $mergedAt,
                payload:         json_encode(['mergedIntoTicketId' => $targetId], JSON_THROW_ON_ERROR),
            ));

            // Step 7: action on TARGET — type='merged', payload.mergedFromTicketId
            $this->actions->insert(new Action(
                id:              0,
                ticketId:        $targetId,
                type:            'merged',
                visibility:      'internal',
                actorPersonId:   $actorPersonId,
                actorClientId:   null,
                datetimeCreated: $mergedAt,
                payload:         json_encode(['mergedFromTicketId' => $sourceId], JSON_THROW_ON_ERROR),
            ));

            $this->tickets->commit();
        } catch (\Throwable $e) {
            $this->tickets->rollback();
            throw $e;
        }

        // Step 8: Notify source reporter (non-fatal)
        if ($this->notifications !== null && method_exists($this->notifications, 'send')) {
            $updatedSource = $this->tickets->findById($sourceId);
            $reporterEmail = $updatedSource?->reporterEmail;
            if ($reporterEmail !== null && $reporterEmail !== '') {
                try {
                    $this->notifications->send(
                        slug:           'ticket_merged',
                        recipientEmail: $reporterEmail,
                        ticketId:       $sourceId,
                        vars:           [
                            'ticket_id'  => (string) $sourceId,
                            'ticket_url' => '#' . $targetId,
                        ],
                    );
                } catch (\Throwable) {
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
