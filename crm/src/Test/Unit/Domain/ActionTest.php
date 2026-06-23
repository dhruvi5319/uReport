<?php
declare(strict_types=1);
namespace Test\Unit\Domain;

use Domain\Action;
use PHPUnit\Framework\TestCase;

class ActionTest extends TestCase
{
    public function testFromRowCreatesTypedAction(): void
    {
        $row = [
            'id'              => '10',
            'ticketId'        => '42',
            'type'            => 'open',
            'visibility'      => 'internal',
            'actorPersonId'   => '5',
            'actorClientId'   => null,
            'datetimeCreated' => '2026-06-23 10:00:00',
            'payload'         => '{"note":"initial open"}',
        ];
        $action = Action::fromRow($row);

        $this->assertSame(10, $action->id);
        $this->assertSame(42, $action->ticketId);
        $this->assertSame('open', $action->type);
        $this->assertSame(5, $action->actorPersonId);
        $this->assertNull($action->actorClientId);
        $this->assertSame('{"note":"initial open"}', $action->payload);
    }

    public function testActionTypesConstantContainsAllEnumValues(): void
    {
        $expected = [
            'open','assignment','closed','reopen',
            'response','comment','upload',
            'deleted','merged','substatus','notification_sent',
        ];
        $actual = Action::TYPES;
        sort($expected);
        sort($actual);
        $this->assertSame($expected, $actual);
    }
}
