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
                        slug:           'ticket_merged',
                        recipientEmail: $reporterEmail,
                        ticketId:       $sourceId,
                        vars:           [
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
