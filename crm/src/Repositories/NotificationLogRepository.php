<?php
declare(strict_types=1);
namespace Repositories;

use Domain\NotificationLog;

class NotificationLogRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?NotificationLog
    {
        $stmt = $this->pdo->prepare('SELECT * FROM notification_log WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? NotificationLog::fromRow($row) : null;
    }

    /** @return NotificationLog[] */
    public function findByTicketId(int $ticketId): array
    {
        return $this->fetchAll(
            'SELECT * FROM notification_log WHERE ticketId = :ticketId ORDER BY createdAt ASC',
            ['ticketId' => $ticketId],
            fn($row) => NotificationLog::fromRow($row),
        );
    }

    /** INSERT only — audit trail, no update/delete */
    public function insert(NotificationLog $entry): NotificationLog
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO notification_log (ticketId, templateSlug, recipientEmail, sentAt, status, attemptCount, errorMessage)
             VALUES (:ticketId, :templateSlug, :recipientEmail, :sentAt, :status, :attemptCount, :errorMessage)'
        );
        $stmt->execute([
            'ticketId'       => $entry->ticketId,
            'templateSlug'   => $entry->templateSlug,
            'recipientEmail' => $entry->recipientEmail,
            'sentAt'         => $entry->sentAt,
            'status'         => $entry->status,
            'attemptCount'   => $entry->attemptCount,
            'errorMessage'   => $entry->errorMessage,
        ]);
        return $this->findById($this->lastInsertId()) ?? $entry;
    }

    /** Delegates to insert(). $entity MUST be a Domain\NotificationLog. */
    public function save(object $entity): NotificationLog
    {
        /** @var NotificationLog $entity */
        return $this->insert($entity);
    }

    /**
     * Dedup check for NotificationService (FRD F08 — 60-second window).
     * Returns true if a 'sent' record exists for the same recipient, template, and ticket
     * within the given window.
     */
    public function hasSentRecently(string $email, string $slug, int $ticketId, int $withinSeconds): bool
    {
        $stmt = $this->pdo->prepare(
            "SELECT COUNT(*) FROM notification_log
             WHERE recipientEmail = :email AND templateSlug = :slug AND ticketId = :tid
               AND status = 'sent' AND sentAt >= DATE_SUB(NOW(), INTERVAL :seconds SECOND)"
        );
        $stmt->execute(['email' => $email, 'slug' => $slug, 'tid' => $ticketId, 'seconds' => $withinSeconds]);
        return (int) $stmt->fetchColumn() > 0;
    }

    /**
     * Insert a new notification log row from raw data array.
     * Used by NotificationService after each send attempt.
     * Returns the new record's auto-increment id.
     */
    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO notification_log (ticketId, templateSlug, recipientEmail, sentAt, status, attemptCount, errorMessage)
             VALUES (:ticketId, :templateSlug, :recipientEmail, :sentAt, :status, :attemptCount, :errorMessage)'
        );
        $stmt->execute([
            'ticketId'       => $data['ticketId'],
            'templateSlug'   => $data['templateSlug'],
            'recipientEmail' => $data['recipientEmail'],
            'sentAt'         => $data['sentAt'],
            'status'         => $data['status'],
            'attemptCount'   => $data['attemptCount'] ?? 1,
            'errorMessage'   => $data['errorMessage'],
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    /** Notification logs are immutable audit records — throws LogicException. */
    public function delete(int $id): void
    {
        throw new \LogicException('Notification log entries are immutable and cannot be deleted.');
    }
}
