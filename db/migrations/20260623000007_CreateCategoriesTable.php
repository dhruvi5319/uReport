<?php

use Phinx\Migration\AbstractMigration;

final class CreateCategoriesTable extends AbstractMigration
{
    public function change(): void
    {
        $this->execute("
            CREATE TABLE categories (
              id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
              name                VARCHAR(255) NOT NULL,
              departmentId        INT UNSIGNED NOT NULL,
              groupId             INT UNSIGNED NULL,
              slaDays             INT UNSIGNED NULL COMMENT 'NULL = no SLA configured',
              displayPermission   ENUM('public','staff','anonymous') NOT NULL DEFAULT 'public',
              postingPermission   ENUM('staff','public','anonymous') NOT NULL DEFAULT 'public',
              defaultAssigneeId   INT UNSIGNED NULL,
              autoCloseDays       INT UNSIGNED NULL DEFAULT 0 COMMENT '0 or NULL = disabled',
              active              TINYINT(1) NOT NULL DEFAULT 1,
              fields              JSON NULL COMMENT 'Array of custom field definition objects',
              createdAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updatedAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              UNIQUE KEY uq_cat_name (name),
              INDEX idx_departmentId (departmentId),
              INDEX idx_groupId (groupId),
              INDEX idx_active (active),
              CONSTRAINT fk_cat_department FOREIGN KEY (departmentId) REFERENCES departments(id),
              CONSTRAINT fk_cat_group      FOREIGN KEY (groupId)      REFERENCES categoryGroups(id),
              CONSTRAINT fk_cat_assignee   FOREIGN KEY (defaultAssigneeId) REFERENCES people(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        $this->execute("DROP TABLE IF EXISTS categories");
    }
}
