<?php
declare(strict_types=1);
namespace Services;

/**
 * SLA computation service (FRD F09 Process: SLA Calculation).
 *
 * Computes SLA status, expected close date, and percentage elapsed for a ticket.
 *
 * MVP implementation uses calendar days (matching legacy uReport behaviour).
 * Business-hour-aware computation is deferred to a future enhancement.
 *
 * Integration contract:
 *   SlaService::compute(array $ticket, ?int $slaDays): array
 *   Returns: ['expectedCloseDate' => string|null, 'status' => 'on_time'|'late'|'no_sla', 'pctElapsed' => float|null]
 */
class SlaService
{
    /**
     * Compute SLA info for a ticket row.
     *
     * @param  array{datetimeOpened: string, datetimeClosed: ?string, status: string} $ticket
     *         Raw ticket data (from DB row or Ticket domain object properties).
     * @param  int|null $slaDays  From category.slaDays; null = no SLA configured
     * @return array{expectedCloseDate: string|null, status: 'on_time'|'late'|'no_sla', pctElapsed: float|null}
     */
    public function compute(array $ticket, ?int $slaDays): array
    {
        if ($slaDays === null || $slaDays <= 0) {
            return ['expectedCloseDate' => null, 'status' => 'no_sla', 'pctElapsed' => null];
        }

        $opened   = new \DateTimeImmutable($ticket['datetimeOpened']);
        $expected = $opened->modify("+{$slaDays} days");
        $now      = new \DateTimeImmutable();

        // For closed tickets: compare against close time; for open tickets: compare against now
        $comparisonPoint = ($ticket['status'] === 'closed' && !empty($ticket['datetimeClosed']))
            ? new \DateTimeImmutable($ticket['datetimeClosed'])
            : $now;

        $totalSeconds   = $expected->getTimestamp() - $opened->getTimestamp();
        $elapsedSeconds = $comparisonPoint->getTimestamp() - $opened->getTimestamp();
        $pctElapsed     = $totalSeconds > 0 ? round(($elapsedSeconds / $totalSeconds) * 100, 1) : null;

        $slaStatus = $comparisonPoint <= $expected ? 'on_time' : 'late';

        return [
            'expectedCloseDate' => $expected->format('Y-m-d'),
            'status'            => $slaStatus,
            'pctElapsed'        => $pctElapsed,
        ];
    }

    /**
     * Convenience method: returns true if the ticket is on time, false if late or no SLA.
     *
     * @param array    $ticket   Same shape as compute() $ticket parameter
     * @param int|null $slaDays  Category SLA days; null = no SLA
     */
    public function isOnTime(array $ticket, ?int $slaDays): bool
    {
        return $this->compute($ticket, $slaDays)['status'] === 'on_time';
    }
}
