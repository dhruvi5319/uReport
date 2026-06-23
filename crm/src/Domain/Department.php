<?php
declare(strict_types=1);
namespace Domain;

readonly class Department
{
    public function __construct(
        public int     $id,
        public string  $name,
        public ?int    $defaultAssigneeId,
        public bool    $active,
        public string  $createdAt,
        public string  $updatedAt,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:                (int) $row['id'],
            name:              $row['name'],
            defaultAssigneeId: isset($row['defaultAssigneeId']) ? (int) $row['defaultAssigneeId'] : null,
            active:            (bool) $row['active'],
            createdAt:         $row['createdAt'],
            updatedAt:         $row['updatedAt'],
        );
    }
}
