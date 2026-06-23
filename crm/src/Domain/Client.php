<?php
declare(strict_types=1);
namespace Domain;

readonly class Client
{
    public function __construct(
        public int     $id,
        public string  $name,
        public string  $contactEmail,
        public string  $apiKeyHash,   // bcrypt hash — never expose in API responses
        public string  $apiKeyHint,   // first 8 chars of plain key
        public ?string $notes,
        public bool    $active,
        public string  $createdAt,
        public string  $updatedAt,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:           (int) $row['id'],
            name:         $row['name'],
            contactEmail: $row['contactEmail'],
            apiKeyHash:   $row['apiKeyHash'],
            apiKeyHint:   $row['apiKeyHint'],
            notes:        $row['notes'] ?? null,
            active:       (bool) $row['active'],
            createdAt:    $row['createdAt'],
            updatedAt:    $row['updatedAt'],
        );
    }
}
