<?php

use Phinx\Migration\AbstractMigration;

final class CreateClientsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->execute("
            CREATE TABLE clients (
              id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
              name          VARCHAR(255) NOT NULL,
              contactEmail  VARCHAR(255) NOT NULL,
              apiKeyHash    VARCHAR(255) NOT NULL COMMENT 'bcrypt(apiKey) — plain key never stored',
              apiKeyHint    VARCHAR(20)  NOT NULL COMMENT 'First 8 chars of plain key for display',
              notes         TEXT NULL,
              active        TINYINT(1) NOT NULL DEFAULT 1,
              createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              UNIQUE KEY uq_client_name (name),
              INDEX idx_active (active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        $this->execute("DROP TABLE IF EXISTS clients");
    }
}
