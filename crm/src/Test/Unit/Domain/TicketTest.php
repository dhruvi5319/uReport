<?php
declare(strict_types=1);
namespace Test\Unit\Domain;

use Domain\Ticket;
use PHPUnit\Framework\TestCase;

class TicketTest extends TestCase
{
    private function sampleRow(): array
    {
        return [
            'id'                 => '42',
            'title'              => 'Pothole on Main St',
            'description'        => 'Large pothole near intersection',
            'status'             => 'open',
            'datetimeOpened'     => '2026-06-23 10:00:00',
            'datetimeClosed'     => null,
            'datetimeUpdated'    => '2026-06-23 10:00:00',
            'deletedAt'          => null,
            'categoryId'         => '1',
            'departmentId'       => '2',
            'personId'           => null,
            'reporterPersonId'   => null,
            'reporterName'       => 'John Smith',
            'reporterEmail'      => 'john@example.com',
            'reporterPhone'      => null,
            'address'            => '123 Main St',
            'lat'                => '43.1234567',
            'lng'                => '-79.5678901',
            'substatusId'        => null,
            'mergedIntoTicketId' => null,
            'apiClientId'        => null,
            'customFields'       => null,
        ];
    }

    public function testFromRowCreatesTypedTicket(): void
    {
        $ticket = Ticket::fromRow($this->sampleRow());

        $this->assertSame(42, $ticket->id);
        $this->assertSame('Pothole on Main St', $ticket->title);
        $this->assertSame('open', $ticket->status);
        $this->assertSame(1, $ticket->categoryId);
        $this->assertSame(2, $ticket->departmentId);
        $this->assertNull($ticket->personId);
        $this->assertNull($ticket->deletedAt);
        $this->assertNull($ticket->customFields);
    }

    public function testFromRowNullablesAreNull(): void
    {
        $ticket = Ticket::fromRow($this->sampleRow());

        $this->assertNull($ticket->datetimeClosed);
        $this->assertNull($ticket->reporterPersonId);
        $this->assertNull($ticket->substatusId);
        $this->assertNull($ticket->mergedIntoTicketId);
        $this->assertNull($ticket->apiClientId);
    }

    public function testTicketIsReadonly(): void
    {
        $ticket = Ticket::fromRow($this->sampleRow());

        $this->expectException(\Error::class);
        // @phpstan-ignore-next-line
        $ticket->id = 99; // readonly — must throw
    }
}
