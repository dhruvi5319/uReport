<?php

use Phinx\Migration\AbstractMigration;

final class CreateTicketGeodataTable extends AbstractMigration
{
    public function change(): void
    {
        $this->execute("
            CREATE TABLE ticket_geodata (
              id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
              ticketId            INT UNSIGNED NOT NULL,
              lat                 DECIMAL(10,7) NULL,
              lng                 DECIMAL(10,7) NULL,
              address             VARCHAR(500) NULL,
              addressNormalized   VARCHAR(500) NULL COMMENT 'Canonical form returned by geocoder',
              geoStatus           ENUM('located','pending','failed') NOT NULL DEFAULT 'pending',
              updatedAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              UNIQUE KEY uq_geodata_ticket (ticketId),
              INDEX idx_lat_lng (lat, lng),
              INDEX idx_geoStatus (geoStatus),
              CONSTRAINT fk_geodata_ticket FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        $this->execute("DROP TABLE IF EXISTS ticket_geodata");
    }
}
