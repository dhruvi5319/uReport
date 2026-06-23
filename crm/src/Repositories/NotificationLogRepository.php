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

    /** Notification logs are immutable audit records — throws LogicException. */
    public function delete(int $id): void
    {
        throw new \LogicException('Notification log entries are immutable and cannot be deleted.');
    }
}
