<?php

use Phinx\Migration\AbstractMigration;

final class CreateActionsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->execute("
            CREATE TABLE actions (
              id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
              ticketId        INT UNSIGNED NOT NULL,
              type            ENUM(
                                'open','assignment','closed','reopen',
                                'response','comment','upload',
                                'deleted','merged','substatus','notification_sent'
                              ) NOT NULL,
              visibility      ENUM('external','internal') NOT NULL DEFAULT 'internal',
              actorPersonId   INT UNSIGNED NULL,
              actorClientId   INT UNSIGNED NULL,
              datetimeCreated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              payload         JSON NULL,
              PRIMARY KEY (id),
              INDEX idx_ticketId (ticketId),
              INDEX idx_type (type),
              INDEX idx_datetimeCreated (datetimeCreated),
              INDEX idx_actorPersonId (actorPersonId),
              CONSTRAINT fk_action_ticket FOREIGN KEY (ticketId)      REFERENCES tickets(id) ON DELETE CASCADE,
              CONSTRAINT fk_action_person FOREIGN KEY (actorPersonId) REFERENCES people(id),
              CONSTRAINT fk_action_client FOREIGN KEY (actorClientId) REFERENCES clients(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        $this->execute("DROP TABLE IF EXISTS actions");
    }
}
