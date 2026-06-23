<?php

use Phinx\Migration\AbstractMigration;

final class CreatePeopleTable extends AbstractMigration
{
    public function change(): void
    {
        $this->execute("
            CREATE TABLE people (
              id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
              firstName     VARCHAR(100) NOT NULL,
              lastName      VARCHAR(100) NOT NULL,
              role          ENUM('admin','staff','public') NOT NULL DEFAULT 'public',
              departmentId  INT UNSIGNED NULL,
              active        TINYINT(1) NOT NULL DEFAULT 1,
              oidcSubject   VARCHAR(255) NULL COMMENT 'OIDC sub claim — unique per provider',
              createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              UNIQUE KEY uq_oidc_subject (oidcSubject),
              INDEX idx_role (role),
              INDEX idx_active (active),
              INDEX idx_departmentId (departmentId)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        $this->execute("DROP TABLE IF EXISTS people");
    }
}
