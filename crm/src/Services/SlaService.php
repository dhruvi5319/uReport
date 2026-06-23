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
