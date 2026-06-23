<?php

use Phinx\Migration\AbstractMigration;

final class CreateContactMethodsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->execute("
            CREATE TABLE contactMethods (
              id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
              personId    INT UNSIGNED NOT NULL,
              type        ENUM('email','phone','address') NOT NULL,
              value       VARCHAR(500) NOT NULL,
              phoneType   ENUM('mobile','office','home') NULL,
              isPrimary   TINYINT(1) NOT NULL DEFAULT 0,
              label       VARCHAR(100) NULL,
              PRIMARY KEY (id),
              INDEX idx_personId (personId),
              INDEX idx_type_value (type, value(191)),
              CONSTRAINT fk_contact_person FOREIGN KEY (personId) REFERENCES people(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        $this->execute("DROP TABLE IF EXISTS contactMethods");
    }
}
