<?php
declare(strict_types=1);
namespace Test\Unit\Domain;

use Domain\Person;
use PHPUnit\Framework\TestCase;

class PersonTest extends TestCase
{
    public function testFromRowCreatesTypedPerson(): void
    {
        $row = [
            'id'           => '5',
            'firstName'    => 'Alice',
            'lastName'     => 'Admin',
            'role'         => 'admin',
            'departmentId' => '3',
            'active'       => '1',
            'oidcSubject'  => 'sub|abc123',
            'createdAt'    => '2026-01-01 00:00:00',
            'updatedAt'    => '2026-01-01 00:00:00',
        ];
        $person = Person::fromRow($row);

        $this->assertSame(5, $person->id);
        $this->assertSame('Alice', $person->firstName);
        $this->assertSame('admin', $person->role);
        $this->assertSame(3, $person->departmentId);
        $this->assertTrue($person->active);
        $this->assertSame('Alice Admin', $person->fullName());
    }

    public function testFromRowNullDepartment(): void
    {
        $row = [
            'id' => '1', 'firstName' => 'Bob', 'lastName' => 'User',
            'role' => 'public', 'departmentId' => null, 'active' => '1',
            'oidcSubject' => null, 'createdAt' => '2026-01-01 00:00:00',
            'updatedAt' => '2026-01-01 00:00:00',
        ];
        $person = Person::fromRow($row);
        $this->assertNull($person->departmentId);
        $this->assertNull($person->oidcSubject);
    }
}
