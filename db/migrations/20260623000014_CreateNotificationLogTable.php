<?php

use Phinx\Migration\AbstractMigration;

final class CreateNotificationLogTable extends AbstractMigration
{
    public function change(): void
    {
        $this->execute("
            CREATE TABLE notification_log (
              id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
              ticketId        INT UNSIGNED NULL,
              templateSlug    VARCHAR(50) NOT NULL,
              recipientEmail  VARCHAR(255) NOT NULL,
              sentAt          DATETIME NULL,
              status          ENUM('sent','failed','skipped') NOT NULL DEFAULT 'sent',
              attemptCount    TINYINT UNSIGNED NOT NULL DEFAULT 1,
              errorMessage    TEXT NULL,
              createdAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              INDEX idx_ticketId (ticketId),
              INDEX idx_recipientEmail (recipientEmail(191)),
              INDEX idx_sentAt (sentAt),
              INDEX idx_status (status),
              CONSTRAINT fk_notif_ticket FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        $this->execute("DROP TABLE IF EXISTS notification_log");
    }
}
