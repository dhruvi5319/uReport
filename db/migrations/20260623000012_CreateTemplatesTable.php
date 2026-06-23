<?php

use Phinx\Migration\AbstractMigration;

final class CreateTemplatesTable extends AbstractMigration
{
    public function change(): void
    {
        $this->execute("
            CREATE TABLE templates (
              id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
              name        VARCHAR(255) NOT NULL,
              subject     VARCHAR(255) NULL,
              body        TEXT NOT NULL,
              slug        VARCHAR(50)  NULL UNIQUE COMMENT 'System templates only; null for user-created',
              active      TINYINT(1) NOT NULL DEFAULT 1,
              createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              UNIQUE KEY uq_template_name (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        // Seed system templates (slugs from TechArch §3.3)
        $this->execute("
            INSERT INTO templates (name, subject, body, slug, active) VALUES
            ('Ticket Created',   'Your service request has been received',     'Your ticket #{{ticket_id}} ({{title}}) has been received and will be reviewed by our team.', 'ticket_created',   1),
            ('Ticket Assigned',  'A ticket has been assigned to you',          'Ticket #{{ticket_id}} ({{title}}) in {{department}} has been assigned to you.',               'ticket_assigned',  1),
            ('Ticket Response',  'An update on your service request',          'Staff has posted a response on ticket #{{ticket_id}} ({{title}}): {{response_body}}',         'ticket_response',  1),
            ('Ticket Closed',    'Your service request has been closed',       'Ticket #{{ticket_id}} ({{title}}) has been closed. Status: {{status}}.',                      'ticket_closed',    1),
            ('Ticket Merged',    'Your service request has been merged',       'Ticket #{{ticket_id}} has been merged into ticket {{ticket_url}}.',                           'ticket_merged',    1),
            ('Daily Digest',     'Daily open ticket digest for {{department}}','Please find the daily summary of open tickets for {{department}} attached.',                   'digest_daily',     1)
        ");
    }

    public function down(): void
    {
        $this->execute("DROP TABLE IF EXISTS templates");
    }
}
