<?php

use Phinx\Migration\AbstractMigration;

final class CreateDepartmentsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->execute("
            CREATE TABLE departments (
              id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
              name                VARCHAR(255) NOT NULL,
              defaultAssigneeId   INT UNSIGNED NULL,
              active              TINYINT(1) NOT NULL DEFAULT 1,
              createdAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updatedAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              UNIQUE KEY uq_dept_name (name),
              INDEX idx_active (active),
              CONSTRAINT fk_dept_assignee FOREIGN KEY (defaultAssigneeId) REFERENCES people(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        // Resolve circular FK: now that departments exists, add the FK from people.departmentId
        $this->execute("
            ALTER TABLE people
            ADD CONSTRAINT fk_people_department
            FOREIGN KEY (departmentId) REFERENCES departments(id)
        ");
    }

    public function down(): void
    {
        $this->execute("ALTER TABLE people DROP FOREIGN KEY fk_people_department");
        $this->execute("DROP TABLE IF EXISTS departments");
    }
}
