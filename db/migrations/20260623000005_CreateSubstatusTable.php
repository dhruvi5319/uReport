<?php

use Phinx\Migration\AbstractMigration;

final class CreateSubstatusTable extends AbstractMigration
{
    public function change(): void
    {
        $this->execute("
            CREATE TABLE substatus (
              id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
              label         VARCHAR(100) NOT NULL,
              primaryStatus ENUM('open','closed') NOT NULL,
              isDefault     TINYINT(1) NOT NULL DEFAULT 0,
              active        TINYINT(1) NOT NULL DEFAULT 1,
              sortOrder     INT UNSIGNED NOT NULL DEFAULT 0,
              createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              UNIQUE KEY uq_substatus_label_status (label, primaryStatus),
              INDEX idx_primaryStatus (primaryStatus),
              INDEX idx_active (active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        $this->execute("DROP TABLE IF EXISTS substatus");
    }
}
