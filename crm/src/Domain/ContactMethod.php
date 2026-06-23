<?php
declare(strict_types=1);
namespace Domain;

readonly class ContactMethod
{
    public function __construct(
        public int     $id,
        public int     $personId,
        public string  $type,       // 'email'|'phone'|'address'
        public string  $value,
        public ?string $phoneType,  // 'mobile'|'office'|'home'|null
        public bool    $isPrimary,
        public ?string $label,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:         (int) $row['id'],
            personId:   (int) $row['personId'],
            type:       $row['type'],
            value:      $row['value'],
            phoneType:  $row['phoneType'] ?? null,
            isPrimary:  (bool) $row['isPrimary'],
            label:      $row['label'] ?? null,
        );
    }
}
