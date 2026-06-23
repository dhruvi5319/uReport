<?php

use Phinx\Migration\AbstractMigration;

final class CreateBookmarksTable extends AbstractMigration
{
    public function change(): void
    {
        $this->execute("
            CREATE TABLE bookmarks (
              id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
              personId    INT UNSIGNED NOT NULL,
              name        VARCHAR(100) NOT NULL,
              filterState JSON NOT NULL COMMENT 'Serialized search filter state (F04 params)',
              createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              UNIQUE KEY uq_bookmark_person_name (personId, name),
              INDEX idx_personId (personId),
              CONSTRAINT fk_bookmark_person FOREIGN KEY (personId) REFERENCES people(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        $this->execute("DROP TABLE IF EXISTS bookmarks");
    }
}
