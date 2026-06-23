<?php

declare(strict_types=1);

namespace Repositories;

class NotificationLogRepository extends AbstractRepository
{
    public function create(array $data): int
    {
        return $this->insertRow(
            'INSERT INTO notification_log (ticketId, templateSlug, recipientEmail, sentAt, status, attemptCount, errorMessage)
             VALUES (:ticketId, :templateSlug, :recipientEmail, :sentAt, :status, :attemptCount, :errorMessage)',
            [
                ':ticketId'       => $data['ticketId'] ?? null,
                ':templateSlug'   => $data['templateSlug'],
                ':recipientEmail' => $data['recipientEmail'],
                ':sentAt'         => $data['sentAt'] ?? date('Y-m-d H:i:s'),
                ':status'         => $data['status'] ?? 'sent',
                ':attemptCount'   => $data['attemptCount'] ?? 1,
                ':errorMessage'   => $data['errorMessage'] ?? null,
            ]
        );
    }

    /** Deduplication check: returns true if same (ticketId, templateSlug, recipientEmail) was sent within $seconds. */
    public function isDuplicate(int $ticketId, string $templateSlug, string $recipientEmail, int $seconds = 60): bool
    {
        $row = $this->fetchOne(
            "SELECT id FROM notification_log WHERE ticketId = :tid AND templateSlug = :slug AND recipientEmail = :email AND status = 'sent' AND sentAt >= DATE_SUB(NOW(), INTERVAL :sec SECOND) LIMIT 1",
            [':tid' => $ticketId, ':slug' => $templateSlug, ':email' => $recipientEmail, ':sec' => $seconds]
        );
        return $row !== null;
    }

    public function findRecent(int $ticketId, int $limit = 20): array
    {
        return $this->fetchAll(
            'SELECT * FROM notification_log WHERE ticketId = :tid ORDER BY createdAt DESC LIMIT ' . $limit,
            [':tid' => $ticketId]
        );
    }
}
