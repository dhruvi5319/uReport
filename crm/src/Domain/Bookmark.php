<?php
declare(strict_types=1);
namespace Domain;

readonly class Bookmark
{
    public function __construct(
        public int    $id,
        public int    $personId,
        public string $name,
        public string $filterState, // raw JSON string (F04 search params)
        public string $createdAt,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:          (int) $row['id'],
            personId:    (int) $row['personId'],
            name:        $row['name'],
            filterState: $row['filterState'],
            createdAt:   $row['createdAt'],
        );
    }
}
