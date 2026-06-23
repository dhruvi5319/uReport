<?php

use Phinx\Migration\AbstractMigration;

final class CreateSessionsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->execute("
            CREATE TABLE sessions (
              id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
              personId    INT UNSIGNED NOT NULL,
              jwtJti      VARCHAR(255) NOT NULL UNIQUE COMMENT 'JWT jti claim — used for revocation',
              expiresAt   DATETIME NOT NULL,
              revokedAt   DATETIME NULL,
              createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              INDEX idx_personId (personId),
              INDEX idx_jwtJti (jwtJti),
              INDEX idx_expiresAt (expiresAt),
              CONSTRAINT fk_session_person FOREIGN KEY (personId) REFERENCES people(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        $this->execute("DROP TABLE IF EXISTS sessions");
    }
}
