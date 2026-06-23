<?php
declare(strict_types=1);
namespace Domain;

readonly class Person
{
    public function __construct(
        public int     $id,
        public string  $firstName,
        public string  $lastName,
        public string  $role,         // 'admin'|'staff'|'public'
        public ?int    $departmentId,
        public bool    $active,
        public ?string $oidcSubject,
        public string  $createdAt,
        public string  $updatedAt,
    ) {}

    public function fullName(): string
    {
        return trim($this->firstName.' '.$this->lastName);
    }

    public static function fromRow(array $row): static
    {
        return new static(
            id:           (int) $row['id'],
            firstName:    $row['firstName'],
            lastName:     $row['lastName'],
            role:         $row['role'],
            departmentId: isset($row['departmentId']) ? (int) $row['departmentId'] : null,
            active:       (bool) $row['active'],
            oidcSubject:  $row['oidcSubject'] ?? null,
            createdAt:    $row['createdAt'],
            updatedAt:    $row['updatedAt'],
        );
    }
}
