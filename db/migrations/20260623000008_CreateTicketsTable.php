<?php

use Phinx\Migration\AbstractMigration;

final class CreateTicketsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->execute("
            CREATE TABLE tickets (
              id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
              title               VARCHAR(255) NOT NULL,
              description         TEXT NULL,
              status              ENUM('open','closed') NOT NULL DEFAULT 'open',
              datetimeOpened      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              datetimeClosed      DATETIME NULL,
              datetimeUpdated     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              deletedAt           DATETIME NULL,
              categoryId          INT UNSIGNED NOT NULL,
              departmentId        INT UNSIGNED NOT NULL,
              personId            INT UNSIGNED NULL COMMENT 'Assignee (staff)',
              reporterPersonId    INT UNSIGNED NULL COMMENT 'Registered reporter (nullable for anonymous)',
              reporterName        VARCHAR(255) NULL,
              reporterEmail       VARCHAR(255) NULL,
              reporterPhone       VARCHAR(50)  NULL,
              address             VARCHAR(500) NULL,
              lat                 DECIMAL(10,7) NULL,
              lng                 DECIMAL(10,7) NULL,
              substatusId         INT UNSIGNED NULL,
              mergedIntoTicketId  INT UNSIGNED NULL COMMENT 'Self-referential FK for merge',
              apiClientId         INT UNSIGNED NULL,
              customFields        JSON NULL,
              PRIMARY KEY (id),
              INDEX idx_status (status),
              INDEX idx_categoryId (categoryId),
              INDEX idx_departmentId (departmentId),
              INDEX idx_personId (personId),
              INDEX idx_reporterPersonId (reporterPersonId),
              INDEX idx_substatusId (substatusId),
              INDEX idx_datetimeOpened (datetimeOpened),
              INDEX idx_datetimeClosed (datetimeClosed),
              INDEX idx_deletedAt (deletedAt),
              INDEX idx_reporterEmail (reporterEmail),
              CONSTRAINT fk_tickets_category    FOREIGN KEY (categoryId)         REFERENCES categories(id),
              CONSTRAINT fk_tickets_department  FOREIGN KEY (departmentId)       REFERENCES departments(id),
              CONSTRAINT fk_tickets_assignee    FOREIGN KEY (personId)           REFERENCES people(id),
              CONSTRAINT fk_tickets_reporter    FOREIGN KEY (reporterPersonId)   REFERENCES people(id),
              CONSTRAINT fk_tickets_substatus   FOREIGN KEY (substatusId)        REFERENCES substatus(id),
              CONSTRAINT fk_tickets_merged      FOREIGN KEY (mergedIntoTicketId) REFERENCES tickets(id),
              CONSTRAINT fk_tickets_client      FOREIGN KEY (apiClientId)        REFERENCES clients(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        $this->execute("DROP TABLE IF EXISTS tickets");
    }
}
