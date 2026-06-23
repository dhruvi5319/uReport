---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - db/migrations/20260623000001_CreateCategoryGroupsTable.php
  - db/migrations/20260623000002_CreatePeopleTable.php
  - db/migrations/20260623000003_CreateDepartmentsTable.php
  - db/migrations/20260623000004_CreateContactMethodsTable.php
  - db/migrations/20260623000005_CreateSubstatusTable.php
  - db/migrations/20260623000006_CreateClientsTable.php
  - db/migrations/20260623000007_CreateCategoriesTable.php
  - db/migrations/20260623000008_CreateTicketsTable.php
  - db/migrations/20260623000009_CreateActionsTable.php
  - db/migrations/20260623000010_CreateMediaTable.php
  - db/migrations/20260623000011_CreateTicketGeodataTable.php
  - db/migrations/20260623000012_CreateTemplatesTable.php
  - db/migrations/20260623000013_CreateBookmarksTable.php
  - db/migrations/20260623000014_CreateNotificationLogTable.php
  - db/migrations/20260623000015_CreateGeoclustersTable.php
  - db/migrations/20260623000016_CreateSessionsTable.php
  - db/phinx.php
  - crm/composer.json
  - crm/src/Infrastructure/Database/PdoConnection.php
  - crm/src/Repositories/AbstractRepository.php
  - crm/src/Repositories/TicketRepository.php
  - crm/src/Repositories/ActionRepository.php
  - crm/src/Repositories/PersonRepository.php
  - crm/src/Repositories/DepartmentRepository.php
  - crm/src/Repositories/CategoryRepository.php
  - crm/src/Repositories/SubstatusRepository.php
  - crm/src/Repositories/ClientRepository.php
  - crm/src/Repositories/MediaRepository.php
  - crm/src/Repositories/BookmarkRepository.php
  - crm/src/Repositories/TemplateRepository.php
  - crm/src/Repositories/NotificationLogRepository.php
autonomous: true

features:
  implements: ["F0", "F2", "F3", "F5", "F6", "F7", "F8", "F11", "F12", "F13", "F14", "F17", "F18"]
  depends_on: []
  enables: ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F16", "F17", "F18"]

must_haves:
  truths:
    - "All 16 tables exist in the MySQL schema with correct columns, types, constraints, and indexes"
    - "Phinx migrations run cleanly on a fresh database (phinx migrate exits 0)"
    - "Each repository class instantiates with a PDO connection and exposes typed query methods"
    - "Foreign key dependency order is respected — no migration fails due to missing parent table"
    - "The actions table has immutability enforced at the application layer (no update/delete methods exist)"
  artifacts:
    - path: "db/phinx.php"
      provides: "Phinx configuration pointing to MySQL with DSN from environment"
      contains: "return ["
    - path: "db/migrations/20260623000001_CreateCategoryGroupsTable.php"
      provides: "categoryGroups table DDL"
      contains: "categoryGroups"
    - path: "db/migrations/20260623000008_CreateTicketsTable.php"
      provides: "tickets table DDL — core entity"
      contains: "mergedIntoTicketId"
    - path: "crm/src/Infrastructure/Database/PdoConnection.php"
      provides: "PDO singleton with transaction helpers"
      exports: ["getInstance", "beginTransaction", "commit", "rollback"]
    - path: "crm/src/Repositories/AbstractRepository.php"
      provides: "Base repository with shared PDO access"
      exports: ["AbstractRepository"]
    - path: "crm/src/Repositories/TicketRepository.php"
      provides: "Ticket CRUD + filter queries"
      exports: ["TicketRepository"]
    - path: "crm/src/Repositories/ActionRepository.php"
      provides: "Append-only action insert (no update/delete methods)"
      exports: ["ActionRepository"]
  key_links:
    - from: "db/phinx.php"
      to: "db/migrations/"
      via: "Phinx migration runner"
      pattern: "getMigrationPaths"
    - from: "crm/src/Repositories/AbstractRepository.php"
      to: "crm/src/Infrastructure/Database/PdoConnection.php"
      via: "constructor injection"
      pattern: "PdoConnection"
    - from: "crm/src/Repositories/TicketRepository.php"
      to: "AbstractRepository"
      via: "class extension"
      pattern: "extends AbstractRepository"

integration_contracts:
  requires: []
  provides:
    - artifact: "db/migrations/ (16 migration files)"
      exports:
        - "TABLE: categoryGroups (id, name, sortOrder, active)"
        - "TABLE: people (id, firstName, lastName, role ENUM(admin,staff,public), departmentId, active, oidcSubject, createdAt, updatedAt)"
        - "TABLE: departments (id, name, defaultAssigneeId, active, createdAt, updatedAt)"
        - "TABLE: contactMethods (id, personId, type ENUM(email,phone,address), value, phoneType, isPrimary, label)"
        - "TABLE: substatus (id, label, primaryStatus ENUM(open,closed), isDefault, active, sortOrder, createdAt, updatedAt)"
        - "TABLE: clients (id, name, contactEmail, apiKeyHash, apiKeyHint, notes, active, createdAt, updatedAt)"
        - "TABLE: categories (id, name, departmentId, groupId, slaDays, displayPermission, postingPermission, defaultAssigneeId, autoCloseDays, active, fields JSON, createdAt, updatedAt)"
        - "TABLE: tickets (id, title, description, status, datetimeOpened, datetimeClosed, datetimeUpdated, deletedAt, categoryId, departmentId, personId, reporterPersonId, reporterName, reporterEmail, reporterPhone, address, lat, lng, substatusId, mergedIntoTicketId, apiClientId, customFields JSON)"
        - "TABLE: actions (id, ticketId, type ENUM(open,assignment,closed,reopen,response,comment,upload,deleted,merged,substatus,notification_sent), visibility ENUM(external,internal), actorPersonId, actorClientId, datetimeCreated, payload JSON)"
        - "TABLE: media (id, ticketId, filename, originalName, mimeType, size, path, thumbnailPath, sourceUrl, label, deletedAt, createdAt)"
        - "TABLE: ticket_geodata (id, ticketId, lat, lng, address, addressNormalized, geoStatus ENUM(located,pending,failed), updatedAt)"
        - "TABLE: templates (id, name, subject, body, slug, active, createdAt, updatedAt)"
        - "TABLE: bookmarks (id, personId, name, filterState JSON, createdAt)"
        - "TABLE: notification_log (id, ticketId, templateSlug, recipientEmail, sentAt, status ENUM(sent,failed,skipped), attemptCount, errorMessage, createdAt)"
        - "TABLE: geoclusters (id, lat, lng, zoom, count, updatedAt)"
        - "TABLE: sessions (id, personId, jwtJti, expiresAt, revokedAt, createdAt)"
      shape: "All tables InnoDB, utf8mb4_unicode_ci, UTC timestamps"
      verify: "grep -rn 'class.*Migration' db/migrations/ | wc -l | grep -E '^16$' && echo CONTRACT_OK"
    - artifact: "crm/src/Infrastructure/Database/PdoConnection.php"
      exports: ["PdoConnection::getInstance(): PDO", "beginTransaction()", "commit()", "rollback()"]
      shape: "Singleton pattern; DSN from DB_HOST/DB_NAME/DB_USER/DB_PASS env vars"
      verify: "grep -n 'getInstance' crm/src/Infrastructure/Database/PdoConnection.php && echo CONTRACT_OK"
    - artifact: "crm/src/Repositories/ (11 typed repository files)"
      exports:
        - "TicketRepository: findById, findAll, create, update, softDelete"
        - "ActionRepository: insert (no update/delete)"
        - "PersonRepository: findById, findByOidcSubject, findAll, create, update"
        - "DepartmentRepository: findById, findAll, create, update"
        - "CategoryRepository: findById, findAll, create, update"
        - "SubstatusRepository: findById, findAll, create, update"
        - "ClientRepository: findById, findByKeyHash, create, update"
        - "MediaRepository: findByTicketId, create, softDelete"
        - "BookmarkRepository: findByPersonId, create, delete"
        - "TemplateRepository: findById, findBySlug, findAll, create, update"
        - "NotificationLogRepository: create, findRecent"
      shape: "All extend AbstractRepository; constructor accepts PdoConnection"
      verify: "grep -rn 'extends AbstractRepository' crm/src/Repositories/ | wc -l | grep -E '^1[01]$' && echo CONTRACT_OK"
---

<objective>
Establish the complete MySQL schema for all 16 uReport tables via versioned Phinx migration scripts, configure the Phinx migration infrastructure, and scaffold typed PHP repository classes (backed by PDO) for all primary entities. This wave produces the foundational data access layer that all backend waves (2a–2d) depend on. No business logic — pure schema + data access contracts.

Purpose: Every subsequent wave relies on these table definitions and repository interfaces. Getting column names, types, constraints, and foreign key order correct here prevents cascading failures across all later plans.

Output:
- 16 Phinx migration files under db/migrations/ (exact DDL from TechArch §3.2–3.3)
- db/phinx.php configuration
- crm/src/Infrastructure/Database/PdoConnection.php (PDO singleton)
- crm/src/Repositories/AbstractRepository.php (base class)
- 11 typed repository classes under crm/src/Repositories/
- composer.json updated with robmorgan/phinx dependency
</objective>

<feature_dependencies>
Implements: F0: Ticket Lifecycle (tickets, actions tables), F2: Dept & Category Mgmt (departments, categories, categoryGroups), F3: People & Contacts (people, contactMethods), F5: Geospatial (ticket_geodata, geoclusters), F6: Audit Trail (actions table — immutable), F7: Media Attachments (media table), F8: Notifications (notification_log, templates tables), F11: Authentication (sessions, people.oidcSubject), F12: Bookmarks (bookmarks table), F13: Templates (templates table + seed slugs), F14: API Client Mgmt (clients table with apiKeyHash), F17: Substatus Mgmt (substatus table), F18: Ticket Merging (tickets.mergedIntoTicketId)
Depends on: None
Enables: F0, F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12, F13, F14, F16, F17, F18 — all backend and frontend waves require the schema to exist
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/WAVE-SCHEDULE.md
@project_specs/TechArch-uReport.md

Key existing structure:
- Legacy PHP application lives in crm/
- crm/composer.json uses PSR-4 autoload: Application\\ → src/Application, Domain\\ → src/Domain
- No db/ directory exists yet — create it
- No src/Repositories/ or src/Infrastructure/ exist yet — create them
- Autoload namespace for new code: add "Repositories\\" → "src/Repositories" and "Infrastructure\\" → "src/Infrastructure" to crm/composer.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Phinx infrastructure + 16 migration files with exact DDL</name>
  <files>
    db/phinx.php
    db/migrations/20260623000001_CreateCategoryGroupsTable.php
    db/migrations/20260623000002_CreatePeopleTable.php
    db/migrations/20260623000003_CreateDepartmentsTable.php
    db/migrations/20260623000004_CreateContactMethodsTable.php
    db/migrations/20260623000005_CreateSubstatusTable.php
    db/migrations/20260623000006_CreateClientsTable.php
    db/migrations/20260623000007_CreateCategoriesTable.php
    db/migrations/20260623000008_CreateTicketsTable.php
    db/migrations/20260623000009_CreateActionsTable.php
    db/migrations/20260623000010_CreateMediaTable.php
    db/migrations/20260623000011_CreateTicketGeodataTable.php
    db/migrations/20260623000012_CreateTemplatesTable.php
    db/migrations/20260623000013_CreateBookmarksTable.php
    db/migrations/20260623000014_CreateNotificationLogTable.php
    db/migrations/20260623000015_CreateGeoclustersTable.php
    db/migrations/20260623000016_CreateSessionsTable.php
    crm/composer.json
  </files>
  <action>
**Step 1: Update crm/composer.json**

Add `robmorgan/phinx` to require block and add new PSR-4 autoload entries:

```json
"require": {
    "robmorgan/phinx": "^0.16"
},
"autoload": {
    "psr-4": {
        "Application\\": "src/Application",
        "Domain\\":      "src/Domain",
        "Infrastructure\\": "src/Infrastructure",
        "Repositories\\": "src/Repositories"
    }
}
```

**Step 2: Create db/phinx.php**

```php
<?php
// db/phinx.php — Phinx migration configuration for uReport
return [
    'paths' => [
        'migrations' => __DIR__ . '/migrations',
        'seeds'      => __DIR__ . '/seeds',
    ],
    'environments' => [
        'default_migration_table' => 'phinx_migrations',
        'default_environment' => 'development',
        'development' => [
            'adapter' => 'mysql',
            'host'    => getenv('DB_HOST') ?: 'db',
            'name'    => getenv('DB_NAME') ?: 'ureport',
            'user'    => getenv('DB_USER') ?: 'ureport',
            'pass'    => getenv('DB_PASS') ?: 'ureport',
            'port'    => getenv('DB_PORT') ?: '3306',
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ],
        'production' => [
            'adapter' => 'mysql',
            'host'    => getenv('DB_HOST'),
            'name'    => getenv('DB_NAME'),
            'user'    => getenv('DB_USER'),
            'pass'    => getenv('DB_PASS'),
            'port'    => getenv('DB_PORT') ?: '3306',
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ],
    ],
    'version_order' => 'creation',
];
```

**Step 3: Create all 16 migration files**

CRITICAL: Migration execution ORDER matters for foreign key resolution. Create migrations in this dependency order:

**DEPENDENCY ORDER (must follow exactly):**
1. `categoryGroups` — no FKs
2. `people` — needs departments (circular with departments; resolve by deferring the FK from people→departments; add it in the departments migration or via a separate AddForeignKeys migration — see note below)
3. `departments` — needs people (for defaultAssigneeId FK)
4. `contactMethods` — needs people
5. `substatus` — no FKs
6. `clients` — no FKs
7. `categories` — needs departments, categoryGroups, people
8. `tickets` — needs categories, departments, people, substatus, clients
9. `actions` — needs tickets, people, clients
10. `media` — needs tickets
11. `ticket_geodata` — needs tickets
12. `templates` — no FKs
13. `bookmarks` — needs people
14. `notification_log` — needs tickets
15. `geoclusters` — no FKs
16. `sessions` — needs people

**CIRCULAR FK RESOLUTION (people ↔ departments):**
- `people` table created first WITHOUT the `departmentId` FK constraint (column present but no CONSTRAINT line)
- `departments` table created second WITH `fk_dept_assignee` FOREIGN KEY (defaultAssigneeId) REFERENCES people(id)
- Migration 003 (`CreateDepartmentsTable`) ALSO adds the FK from people.departmentId → departments(id) using `$this->execute("ALTER TABLE people ADD CONSTRAINT fk_people_department FOREIGN KEY (departmentId) REFERENCES departments(id)")`

Each migration class extends `Phinx\Migration\AbstractMigration`. Use `$this->execute()` with the exact SQL DDL from TechArch §3.2–3.3. Do NOT use Phinx table builder API — copy the verbatim DDL SQL via execute() for precision.

**Migration 01: categoryGroups**
```php
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
```

**Migration 02: people** (no FK to departments yet — added in migration 03)
```php
<?php
use Phinx\Migration\AbstractMigration;

final class CreatePeopleTable extends AbstractMigration
{
    public function change(): void
    {
        $this->execute("
            CREATE TABLE people (
              id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
              firstName     VARCHAR(100) NOT NULL,
              lastName      VARCHAR(100) NOT NULL,
              role          ENUM('admin','staff','public') NOT NULL DEFAULT 'public',
              departmentId  INT UNSIGNED NULL,
              active        TINYINT(1) NOT NULL DEFAULT 1,
              oidcSubject   VARCHAR(255) NULL COMMENT 'OIDC sub claim — unique per provider',
              createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              UNIQUE KEY uq_oidc_subject (oidcSubject),
              INDEX idx_role (role),
              INDEX idx_active (active),
              INDEX idx_departmentId (departmentId)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        $this->execute("DROP TABLE IF EXISTS people");
    }
}
```

**Migration 03: departments** (and adds FK from people→departments)
```php
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
```

**Migration 04: contactMethods**
```php
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
```

**Migration 05: substatus**
```php
$this->execute("
    CREATE TABLE substatus (
      id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
      label         VARCHAR(100) NOT NULL,
      primaryStatus ENUM('open','closed') NOT NULL,
      isDefault     TINYINT(1) NOT NULL DEFAULT 0,
      active        TINYINT(1) NOT NULL DEFAULT 1,
      sortOrder     INT UNSIGNED NOT NULL DEFAULT 0,
      createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_substatus_label_status (label, primaryStatus),
      INDEX idx_primaryStatus (primaryStatus),
      INDEX idx_active (active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");
```

**Migration 06: clients**
```php
$this->execute("
    CREATE TABLE clients (
      id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name          VARCHAR(255) NOT NULL,
      contactEmail  VARCHAR(255) NOT NULL,
      apiKeyHash    VARCHAR(255) NOT NULL COMMENT 'bcrypt(apiKey) — plain key never stored',
      apiKeyHint    VARCHAR(20)  NOT NULL COMMENT 'First 8 chars of plain key for display',
      notes         TEXT NULL,
      active        TINYINT(1) NOT NULL DEFAULT 1,
      createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_client_name (name),
      INDEX idx_active (active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");
```

**Migration 07: categories**
```php
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
```

**Migration 08: tickets**
```php
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
```

**Migration 09: actions**
```php
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
```

**Migration 10: media**
```php
$this->execute("
    CREATE TABLE media (
      id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
      ticketId        INT UNSIGNED NOT NULL,
      filename        VARCHAR(255) NOT NULL COMMENT 'Stored filename on disk',
      originalName    VARCHAR(255) NULL      COMMENT 'Original filename from uploader',
      mimeType        VARCHAR(100) NOT NULL,
      size            INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'File size in bytes',
      path            VARCHAR(500) NOT NULL  COMMENT 'Relative path under upload root',
      thumbnailPath   VARCHAR(500) NULL,
      sourceUrl       VARCHAR(2048) NULL    COMMENT 'Open311 media_url reference (URL, not downloaded)',
      label           VARCHAR(255) NULL,
      deletedAt       DATETIME NULL,
      createdAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_ticketId (ticketId),
      INDEX idx_deletedAt (deletedAt),
      CONSTRAINT fk_media_ticket FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");
```

**Migration 11: ticket_geodata**
```php
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
```

**Migration 12: templates** (with system template seed data)
```php
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
```

**Migration 13: bookmarks**
```php
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
```

**Migration 14: notification_log**
```php
$this->execute("
    CREATE TABLE notification_log (
      id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
      ticketId        INT UNSIGNED NULL,
      templateSlug    VARCHAR(50) NOT NULL,
      recipientEmail  VARCHAR(255) NOT NULL,
      sentAt          DATETIME NULL,
      status          ENUM('sent','failed','skipped') NOT NULL DEFAULT 'sent',
      attemptCount    TINYINT UNSIGNED NOT NULL DEFAULT 1,
      errorMessage    TEXT NULL,
      createdAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_ticketId (ticketId),
      INDEX idx_recipientEmail (recipientEmail(191)),
      INDEX idx_sentAt (sentAt),
      INDEX idx_status (status),
      CONSTRAINT fk_notif_ticket FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");
```

**Migration 15: geoclusters**
```php
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
```

**Migration 16: sessions**
```php
$this->execute("
    CREATE TABLE sessions (
      id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      personId    INT UNSIGNED NOT NULL,
      jwtJti      VARCHAR(255) NOT NULL UNIQUE COMMENT 'JWT jti claim — used for revocation',
      expiresAt   DATETIME NOT NULL,
      revokedAt   DATETIME NULL,
      createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_personId (personId),
      INDEX idx_jwtJti (jwtJti),
      INDEX idx_expiresAt (expiresAt),
      CONSTRAINT fk_session_person FOREIGN KEY (personId) REFERENCES people(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");
```
  </action>
  <verify>
```bash
# Verify 16 migration files created
ls db/migrations/ | wc -l | grep -E '^16$' && echo "MIGRATION COUNT OK"

# Verify phinx.php exists and is syntactically valid PHP
php -l db/phinx.php && echo "PHINX CONFIG VALID"

# Verify tickets migration contains mergedIntoTicketId (F18 requirement)
grep -n 'mergedIntoTicketId' db/migrations/20260623000008_CreateTicketsTable.php && echo "SELF_REF_FK OK"

# Verify actions migration contains all required action types
grep -n 'notification_sent' db/migrations/20260623000009_CreateActionsTable.php && echo "ACTION_ENUM OK"

# Verify people migration has oidcSubject (F11 requirement)
grep -n 'oidcSubject' db/migrations/20260623000002_CreatePeopleTable.php && echo "OIDC_SUBJECT OK"

# Verify clients migration has apiKeyHash (F14 requirement)
grep -n 'apiKeyHash' db/migrations/20260623000006_CreateClientsTable.php && echo "API_KEY_HASH OK"

# Verify templates migration has seed data slugs (F13 requirement)
grep -n 'ticket_created' db/migrations/20260623000012_CreateTemplatesTable.php && echo "TEMPLATE_SEEDS OK"

# Validate all migration files as PHP syntax
for f in db/migrations/*.php; do php -l "$f"; done && echo "ALL MIGRATIONS VALID PHP"
```
  </verify>
  <done>
- 16 migration files exist under db/migrations/ with names matching 20260623000001_Create*.php through 20260623000016_Create*.php
- db/phinx.php is valid PHP and references db/migrations path
- tickets table DDL includes mergedIntoTicketId self-referential FK
- actions table DDL includes all 11 type ENUM values including notification_sent
- people table DDL includes oidcSubject VARCHAR(255) NULL UNIQUE
- clients table DDL includes apiKeyHash and apiKeyHint columns
- templates table includes 6 seed rows with correct slugs
- circular FK between people↔departments is resolved: departments migration adds FK to people.departmentId after departments table exists
- All migration files pass php -l syntax check
  </done>
</task>

<task type="auto">
  <name>Task 2: PDO infrastructure + typed repository base classes</name>
  <files>
    crm/src/Infrastructure/Database/PdoConnection.php
    crm/src/Repositories/AbstractRepository.php
    crm/src/Repositories/TicketRepository.php
    crm/src/Repositories/ActionRepository.php
    crm/src/Repositories/PersonRepository.php
    crm/src/Repositories/DepartmentRepository.php
    crm/src/Repositories/CategoryRepository.php
    crm/src/Repositories/SubstatusRepository.php
    crm/src/Repositories/ClientRepository.php
    crm/src/Repositories/MediaRepository.php
    crm/src/Repositories/BookmarkRepository.php
    crm/src/Repositories/TemplateRepository.php
    crm/src/Repositories/NotificationLogRepository.php
  </files>
  <action>
**Create crm/src/Infrastructure/Database/PdoConnection.php**

Singleton PDO with transaction helpers. DSN built from env vars matching phinx.php config.

```php
<?php

declare(strict_types=1);

namespace Infrastructure\Database;

use PDO;
use PDOException;

/**
 * PDO singleton with transaction helpers.
 * DSN from DB_HOST / DB_NAME / DB_USER / DB_PASS / DB_PORT environment variables.
 */
final class PdoConnection
{
    private static ?PDO $instance = null;

    private function __construct() {}

    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            $host    = getenv('DB_HOST') ?: 'db';
            $port    = getenv('DB_PORT') ?: '3306';
            $dbname  = getenv('DB_NAME') ?: 'ureport';
            $user    = getenv('DB_USER') ?: 'ureport';
            $pass    = getenv('DB_PASS') ?: 'ureport';

            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

            try {
                self::$instance = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone = '+00:00'",
                ]);
            } catch (PDOException $e) {
                throw new \RuntimeException('Database connection failed: ' . $e->getMessage(), (int) $e->getCode(), $e);
            }
        }

        return self::$instance;
    }

    public static function beginTransaction(): void
    {
        self::getInstance()->beginTransaction();
    }

    public static function commit(): void
    {
        self::getInstance()->commit();
    }

    public static function rollback(): void
    {
        if (self::getInstance()->inTransaction()) {
            self::getInstance()->rollBack();
        }
    }

    /** Reset singleton (for testing). */
    public static function reset(): void
    {
        self::$instance = null;
    }
}
```

**Create crm/src/Repositories/AbstractRepository.php**

Base class providing shared PDO access. All concrete repositories extend this.

```php
<?php

declare(strict_types=1);

namespace Repositories;

use Infrastructure\Database\PdoConnection;
use PDO;

abstract class AbstractRepository
{
    protected PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? PdoConnection::getInstance();
    }

    /** Execute a SELECT and return all rows. */
    protected function fetchAll(string $sql, array $params = []): array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /** Execute a SELECT and return a single row or null. */
    protected function fetchOne(string $sql, array $params = []): ?array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        return $row !== false ? $row : null;
    }

    /** Execute a mutating statement (INSERT/UPDATE/DELETE). Returns affected row count. */
    protected function execute(string $sql, array $params = []): int
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }

    /** Execute INSERT and return the last insert ID. */
    protected function insert(string $sql, array $params = []): int
    {
        $this->execute($sql, $params);
        return (int) $this->pdo->lastInsertId();
    }

    /** Decode a JSON column value; returns null if null/empty. */
    protected function decodeJson(?string $json): mixed
    {
        if ($json === null || $json === '') {
            return null;
        }
        return json_decode($json, true, 512, JSON_THROW_ON_ERROR);
    }
}
```

**Create crm/src/Repositories/TicketRepository.php**

Core repository for the tickets table. Provides typed CRUD and basic filter query. Full Solr-integrated search belongs in SearchService (wave 2c); this layer only does direct SQL queries.

```php
<?php

declare(strict_types=1);

namespace Repositories;

class TicketRepository extends AbstractRepository
{
    public function findById(int $id): ?array
    {
        return $this->fetchOne(
            'SELECT * FROM tickets WHERE id = :id AND deletedAt IS NULL',
            [':id' => $id]
        );
    }

    public function findAll(array $filters = [], int $page = 1, int $perPage = 25): array
    {
        $where  = ['t.deletedAt IS NULL'];
        $params = [];

        if (!empty($filters['status'])) {
            $where[]             = 't.status = :status';
            $params[':status']   = $filters['status'];
        }
        if (!empty($filters['categoryId'])) {
            $where[]               = 't.categoryId = :categoryId';
            $params[':categoryId'] = $filters['categoryId'];
        }
        if (!empty($filters['departmentId'])) {
            $where[]                 = 't.departmentId = :departmentId';
            $params[':departmentId'] = $filters['departmentId'];
        }
        if (!empty($filters['personId'])) {
            $where[]             = 't.personId = :personId';
            $params[':personId'] = $filters['personId'];
        }
        if (!empty($filters['substatusId'])) {
            $where[]                = 't.substatusId = :substatusId';
            $params[':substatusId'] = $filters['substatusId'];
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);
        $offset      = ($page - 1) * $perPage;

        $sql = "SELECT t.* FROM tickets t {$whereClause}
                ORDER BY t.datetimeOpened DESC
                LIMIT {$perPage} OFFSET {$offset}";

        return $this->fetchAll($sql, $params);
    }

    public function countAll(array $filters = []): int
    {
        $where  = ['deletedAt IS NULL'];
        $params = [];

        if (!empty($filters['status'])) {
            $where[]           = 'status = :status';
            $params[':status'] = $filters['status'];
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);
        $row         = $this->fetchOne("SELECT COUNT(*) as cnt FROM tickets {$whereClause}", $params);
        return (int) ($row['cnt'] ?? 0);
    }

    public function create(array $data): int
    {
        return $this->insert(
            'INSERT INTO tickets
             (title, description, status, categoryId, departmentId, personId,
              reporterPersonId, reporterName, reporterEmail, reporterPhone,
              address, lat, lng, substatusId, apiClientId, customFields)
             VALUES
             (:title, :description, :status, :categoryId, :departmentId, :personId,
              :reporterPersonId, :reporterName, :reporterEmail, :reporterPhone,
              :address, :lat, :lng, :substatusId, :apiClientId, :customFields)',
            [
                ':title'            => $data['title'],
                ':description'      => $data['description'] ?? null,
                ':status'           => $data['status'] ?? 'open',
                ':categoryId'       => $data['categoryId'],
                ':departmentId'     => $data['departmentId'],
                ':personId'         => $data['personId'] ?? null,
                ':reporterPersonId' => $data['reporterPersonId'] ?? null,
                ':reporterName'     => $data['reporterName'] ?? null,
                ':reporterEmail'    => $data['reporterEmail'] ?? null,
                ':reporterPhone'    => $data['reporterPhone'] ?? null,
                ':address'          => $data['address'] ?? null,
                ':lat'              => $data['lat'] ?? null,
                ':lng'              => $data['lng'] ?? null,
                ':substatusId'      => $data['substatusId'] ?? null,
                ':apiClientId'      => $data['apiClientId'] ?? null,
                ':customFields'     => isset($data['customFields'])
                                        ? json_encode($data['customFields'], JSON_THROW_ON_ERROR)
                                        : null,
            ]
        );
    }

    public function update(int $id, array $data): int
    {
        $sets   = [];
        $params = [':id' => $id];

        $updatable = [
            'title', 'description', 'status', 'categoryId', 'departmentId',
            'personId', 'address', 'lat', 'lng', 'substatusId',
            'datetimeClosed', 'mergedIntoTicketId',
        ];

        foreach ($updatable as $col) {
            if (array_key_exists($col, $data)) {
                $sets[]            = "{$col} = :{$col}";
                $params[":{$col}"] = $data[$col];
            }
        }

        if (empty($sets)) {
            return 0;
        }

        return $this->execute(
            'UPDATE tickets SET ' . implode(', ', $sets) . ' WHERE id = :id',
            $params
        );
    }

    public function softDelete(int $id): int
    {
        return $this->execute(
            'UPDATE tickets SET deletedAt = NOW() WHERE id = :id',
            [':id' => $id]
        );
    }
}
```

**Create crm/src/Repositories/ActionRepository.php**

CRITICAL: This repository has NO update() or delete() methods — actions are immutable per TechArch §3.2 and F6 requirements. Only insert() is exposed.

```php
<?php

declare(strict_types=1);

namespace Repositories;

class ActionRepository extends AbstractRepository
{
    /**
     * Insert an immutable action record. Returns the new action ID.
     * No update() or delete() methods exist — actions are append-only (F6).
     */
    public function insert(array $data): int
    {
        return $this->insert(
            'INSERT INTO actions
             (ticketId, type, visibility, actorPersonId, actorClientId, payload)
             VALUES
             (:ticketId, :type, :visibility, :actorPersonId, :actorClientId, :payload)',
            [
                ':ticketId'      => $data['ticketId'],
                ':type'          => $data['type'],
                ':visibility'    => $data['visibility'] ?? 'internal',
                ':actorPersonId' => $data['actorPersonId'] ?? null,
                ':actorClientId' => $data['actorClientId'] ?? null,
                ':payload'       => isset($data['payload'])
                                     ? json_encode($data['payload'], JSON_THROW_ON_ERROR)
                                     : null,
            ]
        );
    }

    public function findByTicketId(int $ticketId, bool $includeInternal = true, int $page = 1, int $perPage = 50): array
    {
        $where  = ['ticketId = :ticketId'];
        $params = [':ticketId' => $ticketId];

        if (!$includeInternal) {
            $where[] = "visibility = 'external'";
        }

        $offset      = ($page - 1) * $perPage;
        $whereClause = 'WHERE ' . implode(' AND ', $where);

        return $this->fetchAll(
            "SELECT * FROM actions {$whereClause} ORDER BY datetimeCreated ASC LIMIT {$perPage} OFFSET {$offset}",
            $params
        );
    }
}
```

**Create crm/src/Repositories/PersonRepository.php**

```php
<?php

declare(strict_types=1);

namespace Repositories;

class PersonRepository extends AbstractRepository
{
    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM people WHERE id = :id', [':id' => $id]);
    }

    public function findByOidcSubject(string $subject): ?array
    {
        return $this->fetchOne(
            'SELECT * FROM people WHERE oidcSubject = :sub',
            [':sub' => $subject]
        );
    }

    public function findAll(array $filters = [], int $page = 1, int $perPage = 25): array
    {
        $where  = ['1=1'];
        $params = [];

        if (isset($filters['active'])) {
            $where[]           = 'active = :active';
            $params[':active'] = (int) $filters['active'];
        }
        if (!empty($filters['role'])) {
            $where[]         = 'role = :role';
            $params[':role'] = $filters['role'];
        }
        if (!empty($filters['departmentId'])) {
            $where[]                 = 'departmentId = :departmentId';
            $params[':departmentId'] = $filters['departmentId'];
        }

        $offset      = ($page - 1) * $perPage;
        $whereClause = 'WHERE ' . implode(' AND ', $where);

        return $this->fetchAll(
            "SELECT * FROM people {$whereClause} ORDER BY lastName, firstName LIMIT {$perPage} OFFSET {$offset}",
            $params
        );
    }

    public function create(array $data): int
    {
        return $this->insert(
            'INSERT INTO people (firstName, lastName, role, departmentId, active, oidcSubject)
             VALUES (:firstName, :lastName, :role, :departmentId, :active, :oidcSubject)',
            [
                ':firstName'    => $data['firstName'],
                ':lastName'     => $data['lastName'],
                ':role'         => $data['role'] ?? 'public',
                ':departmentId' => $data['departmentId'] ?? null,
                ':active'       => $data['active'] ?? 1,
                ':oidcSubject'  => $data['oidcSubject'] ?? null,
            ]
        );
    }

    public function update(int $id, array $data): int
    {
        $sets   = [];
        $params = [':id' => $id];

        foreach (['firstName', 'lastName', 'role', 'departmentId', 'active', 'oidcSubject'] as $col) {
            if (array_key_exists($col, $data)) {
                $sets[]            = "{$col} = :{$col}";
                $params[":{$col}"] = $data[$col];
            }
        }

        if (empty($sets)) {
            return 0;
        }

        return $this->execute(
            'UPDATE people SET ' . implode(', ', $sets) . ' WHERE id = :id',
            $params
        );
    }
}
```

**Create remaining repositories — DepartmentRepository, CategoryRepository, SubstatusRepository, ClientRepository, MediaRepository, BookmarkRepository, TemplateRepository, NotificationLogRepository**

Each follows the same pattern: extends AbstractRepository, typed methods matching the table schema.

**DepartmentRepository:**
```php
<?php
declare(strict_types=1);
namespace Repositories;

class DepartmentRepository extends AbstractRepository
{
    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM departments WHERE id = :id', [':id' => $id]);
    }

    public function findAll(bool $activeOnly = true): array
    {
        $where = $activeOnly ? 'WHERE active = 1' : '';
        return $this->fetchAll("SELECT * FROM departments {$where} ORDER BY name");
    }

    public function create(array $data): int
    {
        return $this->insert(
            'INSERT INTO departments (name, defaultAssigneeId, active) VALUES (:name, :defaultAssigneeId, :active)',
            [':name' => $data['name'], ':defaultAssigneeId' => $data['defaultAssigneeId'] ?? null, ':active' => $data['active'] ?? 1]
        );
    }

    public function update(int $id, array $data): int
    {
        $sets = []; $params = [':id' => $id];
        foreach (['name', 'defaultAssigneeId', 'active'] as $col) {
            if (array_key_exists($col, $data)) { $sets[] = "{$col} = :{$col}"; $params[":{$col}"] = $data[$col]; }
        }
        return empty($sets) ? 0 : $this->execute('UPDATE departments SET ' . implode(', ', $sets) . ' WHERE id = :id', $params);
    }

    public function countActiveTickets(int $id): int
    {
        $row = $this->fetchOne("SELECT COUNT(*) as cnt FROM tickets WHERE departmentId = :id AND status = 'open' AND deletedAt IS NULL", [':id' => $id]);
        return (int) ($row['cnt'] ?? 0);
    }
}
```

**CategoryRepository:**
```php
<?php
declare(strict_types=1);
namespace Repositories;

class CategoryRepository extends AbstractRepository
{
    public function findById(int $id): ?array
    {
        $row = $this->fetchOne('SELECT * FROM categories WHERE id = :id', [':id' => $id]);
        if ($row) { $row['fields'] = $this->decodeJson($row['fields']); }
        return $row;
    }

    public function findAll(array $filters = []): array
    {
        $where = ['1=1']; $params = [];
        if (isset($filters['active'])) { $where[] = 'active = :active'; $params[':active'] = (int)$filters['active']; }
        if (!empty($filters['departmentId'])) { $where[] = 'departmentId = :deptId'; $params[':deptId'] = $filters['departmentId']; }
        $rows = $this->fetchAll('SELECT * FROM categories WHERE ' . implode(' AND ', $where) . ' ORDER BY name', $params);
        return array_map(fn($r) => array_merge($r, ['fields' => $this->decodeJson($r['fields'])]), $rows);
    }

    public function create(array $data): int
    {
        return $this->insert(
            'INSERT INTO categories (name, departmentId, groupId, slaDays, displayPermission, postingPermission, defaultAssigneeId, autoCloseDays, active, fields)
             VALUES (:name, :departmentId, :groupId, :slaDays, :displayPermission, :postingPermission, :defaultAssigneeId, :autoCloseDays, :active, :fields)',
            [
                ':name' => $data['name'], ':departmentId' => $data['departmentId'],
                ':groupId' => $data['groupId'] ?? null, ':slaDays' => $data['slaDays'] ?? null,
                ':displayPermission' => $data['displayPermission'] ?? 'public',
                ':postingPermission' => $data['postingPermission'] ?? 'public',
                ':defaultAssigneeId' => $data['defaultAssigneeId'] ?? null,
                ':autoCloseDays' => $data['autoCloseDays'] ?? 0, ':active' => $data['active'] ?? 1,
                ':fields' => isset($data['fields']) ? json_encode($data['fields'], JSON_THROW_ON_ERROR) : null,
            ]
        );
    }

    public function update(int $id, array $data): int
    {
        $sets = []; $params = [':id' => $id];
        $cols = ['name','departmentId','groupId','slaDays','displayPermission','postingPermission','defaultAssigneeId','autoCloseDays','active'];
        foreach ($cols as $col) {
            if (array_key_exists($col, $data)) { $sets[] = "{$col} = :{$col}"; $params[":{$col}"] = $data[$col]; }
        }
        if (array_key_exists('fields', $data)) {
            $sets[] = 'fields = :fields';
            $params[':fields'] = $data['fields'] !== null ? json_encode($data['fields'], JSON_THROW_ON_ERROR) : null;
        }
        return empty($sets) ? 0 : $this->execute('UPDATE categories SET ' . implode(', ', $sets) . ' WHERE id = :id', $params);
    }
}
```

**SubstatusRepository:**
```php
<?php
declare(strict_types=1);
namespace Repositories;

class SubstatusRepository extends AbstractRepository
{
    public function findById(int $id): ?array { return $this->fetchOne('SELECT * FROM substatus WHERE id = :id', [':id' => $id]); }
    public function findAll(bool $activeOnly = true): array {
        $w = $activeOnly ? 'WHERE active = 1' : '';
        return $this->fetchAll("SELECT * FROM substatus {$w} ORDER BY primaryStatus, sortOrder");
    }
    public function findDefault(string $primaryStatus): ?array {
        return $this->fetchOne("SELECT * FROM substatus WHERE primaryStatus = :ps AND isDefault = 1 AND active = 1 LIMIT 1", [':ps' => $primaryStatus]);
    }
    public function create(array $data): int {
        return $this->insert(
            'INSERT INTO substatus (label, primaryStatus, isDefault, active, sortOrder) VALUES (:label, :primaryStatus, :isDefault, :active, :sortOrder)',
            [':label' => $data['label'], ':primaryStatus' => $data['primaryStatus'], ':isDefault' => $data['isDefault'] ?? 0, ':active' => $data['active'] ?? 1, ':sortOrder' => $data['sortOrder'] ?? 0]
        );
    }
    public function clearDefault(string $primaryStatus, int $exceptId = 0): void {
        $this->execute('UPDATE substatus SET isDefault = 0 WHERE primaryStatus = :ps AND id != :id', [':ps' => $primaryStatus, ':id' => $exceptId]);
    }
    public function update(int $id, array $data): int {
        $sets = []; $params = [':id' => $id];
        foreach (['label','primaryStatus','isDefault','active','sortOrder'] as $col) {
            if (array_key_exists($col, $data)) { $sets[] = "{$col} = :{$col}"; $params[":{$col}"] = $data[$col]; }
        }
        return empty($sets) ? 0 : $this->execute('UPDATE substatus SET ' . implode(', ', $sets) . ' WHERE id = :id', $params);
    }
}
```

**ClientRepository:**
```php
<?php
declare(strict_types=1);
namespace Repositories;

class ClientRepository extends AbstractRepository
{
    public function findById(int $id): ?array { return $this->fetchOne('SELECT * FROM clients WHERE id = :id', [':id' => $id]); }
    public function findAll(bool $activeOnly = true): array {
        $w = $activeOnly ? 'WHERE active = 1' : '';
        return $this->fetchAll("SELECT id, name, contactEmail, apiKeyHint, notes, active, createdAt, updatedAt FROM clients {$w} ORDER BY name");
    }
    /** Never returns apiKeyHash in results — callers must use raw PDO for hash comparison. */
    public function findHashById(int $id): ?string {
        $row = $this->fetchOne('SELECT apiKeyHash FROM clients WHERE id = :id AND active = 1', [':id' => $id]);
        return $row['apiKeyHash'] ?? null;
    }
    public function create(array $data): int {
        return $this->insert(
            'INSERT INTO clients (name, contactEmail, apiKeyHash, apiKeyHint, notes, active) VALUES (:name, :contactEmail, :apiKeyHash, :apiKeyHint, :notes, :active)',
            [':name' => $data['name'], ':contactEmail' => $data['contactEmail'], ':apiKeyHash' => $data['apiKeyHash'], ':apiKeyHint' => $data['apiKeyHint'], ':notes' => $data['notes'] ?? null, ':active' => $data['active'] ?? 1]
        );
    }
    public function updateKey(int $id, string $newHash, string $newHint): int {
        return $this->execute('UPDATE clients SET apiKeyHash = :h, apiKeyHint = :hint WHERE id = :id', [':h' => $newHash, ':hint' => $newHint, ':id' => $id]);
    }
    public function update(int $id, array $data): int {
        $sets = []; $params = [':id' => $id];
        foreach (['name','contactEmail','notes','active'] as $col) {
            if (array_key_exists($col, $data)) { $sets[] = "{$col} = :{$col}"; $params[":{$col}"] = $data[$col]; }
        }
        return empty($sets) ? 0 : $this->execute('UPDATE clients SET ' . implode(', ', $sets) . ' WHERE id = :id', $params);
    }
}
```

**MediaRepository:**
```php
<?php
declare(strict_types=1);
namespace Repositories;

class MediaRepository extends AbstractRepository
{
    public function findByTicketId(int $ticketId): array { return $this->fetchAll('SELECT * FROM media WHERE ticketId = :tid AND deletedAt IS NULL ORDER BY createdAt', [':tid' => $ticketId]); }
    public function findById(int $id): ?array { return $this->fetchOne('SELECT * FROM media WHERE id = :id AND deletedAt IS NULL', [':id' => $id]); }
    public function create(array $data): int {
        return $this->insert(
            'INSERT INTO media (ticketId, filename, originalName, mimeType, size, path, thumbnailPath, sourceUrl, label) VALUES (:ticketId, :filename, :originalName, :mimeType, :size, :path, :thumbnailPath, :sourceUrl, :label)',
            [':ticketId' => $data['ticketId'], ':filename' => $data['filename'], ':originalName' => $data['originalName'] ?? null, ':mimeType' => $data['mimeType'], ':size' => $data['size'] ?? 0, ':path' => $data['path'], ':thumbnailPath' => $data['thumbnailPath'] ?? null, ':sourceUrl' => $data['sourceUrl'] ?? null, ':label' => $data['label'] ?? null]
        );
    }
    public function softDelete(int $id): int { return $this->execute('UPDATE media SET deletedAt = NOW() WHERE id = :id', [':id' => $id]); }
    public function countByTicketId(int $ticketId): int {
        $row = $this->fetchOne('SELECT COUNT(*) as cnt FROM media WHERE ticketId = :tid AND deletedAt IS NULL', [':tid' => $ticketId]);
        return (int)($row['cnt'] ?? 0);
    }
}
```

**BookmarkRepository:**
```php
<?php
declare(strict_types=1);
namespace Repositories;

class BookmarkRepository extends AbstractRepository
{
    public function findByPersonId(int $personId): array {
        $rows = $this->fetchAll('SELECT * FROM bookmarks WHERE personId = :pid ORDER BY name', [':pid' => $personId]);
        return array_map(fn($r) => array_merge($r, ['filterState' => $this->decodeJson($r['filterState'])]), $rows);
    }
    public function findById(int $id): ?array {
        $row = $this->fetchOne('SELECT * FROM bookmarks WHERE id = :id', [':id' => $id]);
        if ($row) { $row['filterState'] = $this->decodeJson($row['filterState']); }
        return $row;
    }
    public function countByPersonId(int $personId): int {
        $row = $this->fetchOne('SELECT COUNT(*) as cnt FROM bookmarks WHERE personId = :pid', [':pid' => $personId]);
        return (int)($row['cnt'] ?? 0);
    }
    public function create(array $data): int {
        return $this->insert(
            'INSERT INTO bookmarks (personId, name, filterState) VALUES (:personId, :name, :filterState)',
            [':personId' => $data['personId'], ':name' => $data['name'], ':filterState' => json_encode($data['filterState'], JSON_THROW_ON_ERROR)]
        );
    }
    public function delete(int $id): int { return $this->execute('DELETE FROM bookmarks WHERE id = :id', [':id' => $id]); }
}
```

**TemplateRepository:**
```php
<?php
declare(strict_types=1);
namespace Repositories;

class TemplateRepository extends AbstractRepository
{
    public function findById(int $id): ?array { return $this->fetchOne('SELECT * FROM templates WHERE id = :id', [':id' => $id]); }
    public function findBySlug(string $slug): ?array { return $this->fetchOne('SELECT * FROM templates WHERE slug = :slug AND active = 1', [':slug' => $slug]); }
    public function findAll(bool $activeOnly = true): array {
        $w = $activeOnly ? 'WHERE active = 1' : '';
        return $this->fetchAll("SELECT * FROM templates {$w} ORDER BY name");
    }
    public function create(array $data): int {
        return $this->insert(
            'INSERT INTO templates (name, subject, body, active) VALUES (:name, :subject, :body, :active)',
            [':name' => $data['name'], ':subject' => $data['subject'] ?? null, ':body' => $data['body'], ':active' => $data['active'] ?? 1]
        );
    }
    public function update(int $id, array $data): int {
        $sets = []; $params = [':id' => $id];
        foreach (['name','subject','body','active'] as $col) {
            if (array_key_exists($col, $data)) { $sets[] = "{$col} = :{$col}"; $params[":{$col}"] = $data[$col]; }
        }
        // System templates (slug IS NOT NULL) cannot have their slug changed
        return empty($sets) ? 0 : $this->execute('UPDATE templates SET ' . implode(', ', $sets) . ' WHERE id = :id', $params);
    }
    public function isSystemTemplate(int $id): bool {
        $row = $this->fetchOne('SELECT slug FROM templates WHERE id = :id', [':id' => $id]);
        return $row !== null && $row['slug'] !== null;
    }
}
```

**NotificationLogRepository:**
```php
<?php
declare(strict_types=1);
namespace Repositories;

class NotificationLogRepository extends AbstractRepository
{
    public function create(array $data): int {
        return $this->insert(
            'INSERT INTO notification_log (ticketId, templateSlug, recipientEmail, sentAt, status, attemptCount, errorMessage) VALUES (:ticketId, :templateSlug, :recipientEmail, :sentAt, :status, :attemptCount, :errorMessage)',
            [':ticketId' => $data['ticketId'] ?? null, ':templateSlug' => $data['templateSlug'], ':recipientEmail' => $data['recipientEmail'], ':sentAt' => $data['sentAt'] ?? date('Y-m-d H:i:s'), ':status' => $data['status'] ?? 'sent', ':attemptCount' => $data['attemptCount'] ?? 1, ':errorMessage' => $data['errorMessage'] ?? null]
        );
    }

    /** Deduplication check: returns true if same (ticketId, templateSlug, recipientEmail) was sent within $seconds. */
    public function isDuplicate(int $ticketId, string $templateSlug, string $recipientEmail, int $seconds = 60): bool {
        $row = $this->fetchOne(
            "SELECT id FROM notification_log WHERE ticketId = :tid AND templateSlug = :slug AND recipientEmail = :email AND status = 'sent' AND sentAt >= DATE_SUB(NOW(), INTERVAL :sec SECOND) LIMIT 1",
            [':tid' => $ticketId, ':slug' => $templateSlug, ':email' => $recipientEmail, ':sec' => $seconds]
        );
        return $row !== null;
    }

    public function findRecent(int $ticketId, int $limit = 20): array {
        return $this->fetchAll('SELECT * FROM notification_log WHERE ticketId = :tid ORDER BY createdAt DESC LIMIT ' . $limit, [':tid' => $ticketId]);
    }
}
```
  </action>
  <verify>
```bash
# Verify all repository files exist
ls crm/src/Repositories/ | wc -l | grep -E '^1[12]$' && echo "REPO COUNT OK"

# Verify PHP syntax on all new files
for f in crm/src/Infrastructure/Database/PdoConnection.php crm/src/Repositories/*.php; do php -l "$f" || exit 1; done && echo "ALL PHP VALID"

# Verify ActionRepository has no update() or delete() method (immutability check)
grep -n 'function update\|function delete' crm/src/Repositories/ActionRepository.php && echo "FAIL: ActionRepository must not have update/delete" || echo "IMMUTABILITY OK"

# Verify AbstractRepository is extended by all concrete repositories
grep -rn 'extends AbstractRepository' crm/src/Repositories/ | wc -l | grep -E '^1[01]$' && echo "INHERITANCE OK"

# Verify PdoConnection has getInstance
grep -n 'getInstance' crm/src/Infrastructure/Database/PdoConnection.php && echo "PDO_SINGLETON OK"

# Verify TicketRepository has softDelete (not hard delete)
grep -n 'softDelete' crm/src/Repositories/TicketRepository.php && echo "SOFT_DELETE OK"

# Verify composer.json includes phinx and new namespaces
grep -n 'robmorgan/phinx' crm/composer.json && echo "PHINX_DEP OK"
grep -n 'Infrastructure' crm/composer.json && echo "INFRA_NAMESPACE OK"
grep -n 'Repositories' crm/composer.json && echo "REPO_NAMESPACE OK"
```
  </verify>
  <done>
- 11 repository classes exist under crm/src/Repositories/ (AbstractRepository + 10 entity repos)
- PdoConnection.php exists with getInstance(), beginTransaction(), commit(), rollback() methods
- All PHP files pass syntax check (php -l)
- ActionRepository has NO update() or delete() methods — only insert() and findByTicketId()
- All concrete repositories extend AbstractRepository
- SubstatusRepository has clearDefault() for isDefault auto-clear logic (F17)
- ClientRepository returns apiKeyHash only via findHashById(), never in findAll() results (F14 security)
- BookmarkRepository has countByPersonId() to support 50-bookmark limit check (F12)
- TemplateRepository has isSystemTemplate() to prevent system template deletion (F13)
- NotificationLogRepository has isDuplicate() for 60-second deduplication (F8)
- crm/composer.json includes robmorgan/phinx dependency and Infrastructure\\ and Repositories\\ PSR-4 autoload entries
  </done>
</task>

</tasks>

<verification>
After both tasks complete, verify the full wave 1 deliverable:

```bash
# 1. Count all migration files
ls db/migrations/*.php | wc -l | grep -E '^16$' && echo "16 MIGRATIONS OK"

# 2. Verify PHP syntax on all files
for f in db/phinx.php db/migrations/*.php crm/src/Infrastructure/Database/PdoConnection.php crm/src/Repositories/*.php; do
  php -l "$f" || { echo "SYNTAX ERROR: $f"; exit 1; }
done && echo "ALL PHP SYNTAX VALID"

# 3. Verify all 16 table names are present across migrations
for tbl in categoryGroups people departments contactMethods substatus clients categories tickets actions media ticket_geodata templates bookmarks notification_log geoclusters sessions; do
  grep -rl "CREATE TABLE ${tbl}" db/migrations/ > /dev/null && echo "TABLE ${tbl}: OK" || echo "TABLE ${tbl}: MISSING"
done

# 4. Verify critical columns (FKs and business-critical fields)
grep -rn 'mergedIntoTicketId' db/migrations/ && echo "SELF_REF_FK OK"
grep -rn 'oidcSubject' db/migrations/ && echo "OIDC_SUBJECT OK"
grep -rn 'apiKeyHash' db/migrations/ && echo "API_KEY_HASH OK"
grep -rn 'notification_sent' db/migrations/ && echo "ACTION_ENUM OK"
grep -rn 'ticket_created' db/migrations/ && echo "TEMPLATE_SEEDS OK"
grep -rn 'fk_people_department.*ALTER' db/migrations/ && echo "CIRCULAR_FK_RESOLVED OK"

# 5. Verify integration contracts
grep -n 'getInstance' crm/src/Infrastructure/Database/PdoConnection.php && echo "CONTRACT: PDO OK"
grep -rn 'extends AbstractRepository' crm/src/Repositories/ | wc -l | grep -E '^1[01]$' && echo "CONTRACT: REPOS OK"

# 6. Verify ActionRepository immutability
! grep -q 'function update\|function delete' crm/src/Repositories/ActionRepository.php && echo "CONTRACT: ACTIONS IMMUTABLE OK"
```
</verification>

<success_criteria>
Wave 1 (database) is complete when:
- [ ] 16 Phinx migration files exist in db/migrations/ with timestamps 20260623000001–20260623000016
- [ ] db/phinx.php is valid PHP and references db/migrations path
- [ ] All 16 tables represented: categoryGroups, people, departments, contactMethods, substatus, clients, categories, tickets, actions, media, ticket_geodata, templates, bookmarks, notification_log, geoclusters, sessions
- [ ] Circular FK between people↔departments is resolved via ALTER TABLE in migration 03
- [ ] tickets.mergedIntoTicketId self-referential FK present (F18)
- [ ] people.oidcSubject column present (F11)
- [ ] clients.apiKeyHash + apiKeyHint columns present (F14)
- [ ] actions.type ENUM includes all 11 values including notification_sent (F8)
- [ ] 6 system template seed rows inserted with correct slugs (F13)
- [ ] crm/src/Infrastructure/Database/PdoConnection.php singleton with transaction helpers
- [ ] crm/src/Repositories/AbstractRepository.php with fetchAll/fetchOne/execute/insert/decodeJson helpers
- [ ] 10 typed entity repositories, all extending AbstractRepository
- [ ] ActionRepository has NO update() or delete() — immutability enforced
- [ ] crm/composer.json includes robmorgan/phinx and Infrastructure\\ + Repositories\\ PSR-4 namespaces
- [ ] All PHP files pass php -l syntax check
</success_criteria>

<output>
After completion, create `.planning/express/modernize-the-ureport-legacy-php-crm-imp/01-SUMMARY.md` summarizing:
- Migration files created and their table coverage
- Repository classes created and their key method contracts
- Circular FK resolution approach used
- Any deviations from TechArch DDL (flag conflicts, do not silently diverge)
</output>
