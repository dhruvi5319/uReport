<?php

use Phinx\Migration\AbstractMigration;

final class CreateMediaTable extends AbstractMigration
{
    public function change(): void
    {
        $this->execute("
            CREATE TABLE media (
              id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
              ticketId        INT UNSIGNED NOT NULL,
              filename        VARCHAR(255) NOT NULL COMMENT 'Stored filename on disk',
              originalName    VARCHAR(255) NULL      COMMENT 'Original filename from uploader',
              mimeType        VARCHAR(100) NOT NULL,
              size            INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'File size in bytes',
              path            VARCHAR(500) NOT NULL  COMMENT 'Relative path under upload root',
              thumbnailPath   VARCHAR(500) NULL,
              sourceUrl       VARCHAR(2048) NULL    COMMENT 'Open311 media_url reference (URL, not downloaded)',
              label           VARCHAR(255) NULL,
              deletedAt       DATETIME NULL,
              createdAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              INDEX idx_ticketId (ticketId),
              INDEX idx_deletedAt (deletedAt),
              CONSTRAINT fk_media_ticket FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        $this->execute("DROP TABLE IF EXISTS media");
    }
}
