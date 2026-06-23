<?php
declare(strict_types=1);
namespace Domain;

readonly class CategoryGroup
{
    public function __construct(
        public int    $id,
        public string $name,
        public int    $sortOrder,
        public bool   $active,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:        (int) $row['id'],
            name:      $row['name'],
            sortOrder: (int) $row['sortOrder'],
            active:    (bool) $row['active'],
        );
    }
}
