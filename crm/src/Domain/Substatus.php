<?php
declare(strict_types=1);
namespace Domain;

readonly class Substatus
{
    public function __construct(
        public int    $id,
        public string $label,
        public string $primaryStatus,  // 'open'|'closed'
        public bool   $isDefault,
        public bool   $active,
        public int    $sortOrder,
        public string $createdAt,
        public string $updatedAt,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:            (int) $row['id'],
            label:         $row['label'],
            primaryStatus: $row['primaryStatus'],
            isDefault:     (bool) $row['isDefault'],
            active:        (bool) $row['active'],
            sortOrder:     (int) $row['sortOrder'],
            createdAt:     $row['createdAt'],
            updatedAt:     $row['updatedAt'],
        );
    }
}
