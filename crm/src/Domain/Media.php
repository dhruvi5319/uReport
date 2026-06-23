<?php
declare(strict_types=1);
namespace Domain;

readonly class Media
{
    public function __construct(
        public int     $id,
        public int     $ticketId,
        public string  $filename,
        public ?string $originalName,
        public string  $mimeType,
        public int     $size,
        public string  $path,
        public ?string $thumbnailPath,
        public ?string $sourceUrl,
        public ?string $label,
        public ?string $deletedAt,
        public string  $createdAt,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:            (int) $row['id'],
            ticketId:      (int) $row['ticketId'],
            filename:      $row['filename'],
            originalName:  $row['originalName'] ?? null,
            mimeType:      $row['mimeType'],
            size:          (int) $row['size'],
            path:          $row['path'],
            thumbnailPath: $row['thumbnailPath'] ?? null,
            sourceUrl:     $row['sourceUrl'] ?? null,
            label:         $row['label'] ?? null,
            deletedAt:     $row['deletedAt'] ?? null,
            createdAt:     $row['createdAt'],
        );
    }
}
