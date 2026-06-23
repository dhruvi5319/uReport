<?php

use Phinx\Migration\AbstractMigration;

final class CreateGeoclustersTable extends AbstractMigration
{
    public function change(): void
    {
        $this->execute("
            CREATE TABLE geoclusters (
              id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
              lat         DECIMAL(10,7) NOT NULL,
              lng         DECIMAL(10,7) NOT NULL,
              zoom        TINYINT UNSIGNED NOT NULL COMMENT 'Map zoom level 1–20',
              count       INT UNSIGNED NOT NULL DEFAULT 0,
              updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              INDEX idx_lat_lng_zoom (lat, lng, zoom)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        $this->execute("DROP TABLE IF EXISTS geoclusters");
    }
}
