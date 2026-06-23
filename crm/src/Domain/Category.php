<?php
declare(strict_types=1);
namespace Domain;

readonly class Category
{
    public function __construct(
        public int     $id,
        public string  $name,
        public int     $departmentId,
        public ?int    $groupId,
        public ?int    $slaDays,
        public string  $displayPermission,  // 'public'|'staff'|'anonymous'
        public string  $postingPermission,  // 'staff'|'public'|'anonymous'
        public ?int    $defaultAssigneeId,
        public ?int    $autoCloseDays,
        public bool    $active,
        public ?string $fields,             // raw JSON array string or null
        public string  $createdAt,
        public string  $updatedAt,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:                (int) $row['id'],
            name:              $row['name'],
            departmentId:      (int) $row['departmentId'],
            groupId:           isset($row['groupId']) ? (int) $row['groupId'] : null,
            slaDays:           isset($row['slaDays']) ? (int) $row['slaDays'] : null,
            displayPermission: $row['displayPermission'],
            postingPermission: $row['postingPermission'],
            defaultAssigneeId: isset($row['defaultAssigneeId']) ? (int) $row['defaultAssigneeId'] : null,
            autoCloseDays:     isset($row['autoCloseDays']) ? (int) $row['autoCloseDays'] : null,
            active:            (bool) $row['active'],
            fields:            $row['fields'] ?? null,
            createdAt:         $row['createdAt'],
            updatedAt:         $row['updatedAt'],
        );
    }
}
