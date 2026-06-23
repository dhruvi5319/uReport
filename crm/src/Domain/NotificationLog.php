<?php
declare(strict_types=1);
namespace Domain;

readonly class NotificationLog
{
    public function __construct(
        public int     $id,
        public ?int    $ticketId,
        public string  $templateSlug,
        public string  $recipientEmail,
        public ?string $sentAt,
        public string  $status,         // 'sent'|'failed'|'skipped'
        public int     $attemptCount,
        public ?string $errorMessage,
        public string  $createdAt,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:             (int) $row['id'],
            ticketId:       isset($row['ticketId']) ? (int) $row['ticketId'] : null,
            templateSlug:   $row['templateSlug'],
            recipientEmail: $row['recipientEmail'],
            sentAt:         $row['sentAt'] ?? null,
            status:         $row['status'],
            attemptCount:   (int) $row['attemptCount'],
            errorMessage:   $row['errorMessage'] ?? null,
            createdAt:      $row['createdAt'],
        );
    }
}
