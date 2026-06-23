<?php
declare(strict_types=1);
namespace Domain;

readonly class Template
{
    public function __construct(
        public int     $id,
        public string  $name,
        public ?string $subject,
        public string  $body,
        public ?string $slug,   // null for user-created; set for system templates
        public bool    $active,
        public string  $createdAt,
        public string  $updatedAt,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:        (int) $row['id'],
            name:      $row['name'],
            subject:   $row['subject'] ?? null,
            body:      $row['body'],
            slug:      $row['slug'] ?? null,
            active:    (bool) $row['active'],
            createdAt: $row['createdAt'],
            updatedAt: $row['updatedAt'],
        );
    }
}
