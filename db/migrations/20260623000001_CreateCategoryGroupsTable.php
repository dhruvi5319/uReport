<?php

use Phinx\Migration\AbstractMigration;

final class CreateCategoryGroupsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->execute("
            CREATE TABLE categoryGroups (
              id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
              name        VARCHAR(255) NOT NULL,
              sortOrder   INT UNSIGNED NOT NULL DEFAULT 0,
              active      TINYINT(1) NOT NULL DEFAULT 1,
              PRIMARY KEY (id),
              UNIQUE KEY uq_group_name (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        $this->execute("DROP TABLE IF EXISTS categoryGroups");
    }
}
