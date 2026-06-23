## 3. Data Model

### 3.1 Entity Relationship Diagram

```
categoryGroups ──┐
                 │ groupId (nullable)
departments ─────┼──── categories ─────────────────────────────────────────┐
     │           │       │ defaultAssigneeId (nullable FK → people)         │
     │ defaultAssigneeId │                                                  │
     │           │       │                                                  │
   people ◄──────┴───────┘                                                  │
     │ id                                                                    │
     │◄──── contactMethods (1:many)                                          │
     │◄──── bookmarks (1:many)                                               │
     │                  ┌────────────── tickets ────────────────────────────┘
     │                  │  categoryId FK
     │ personId (assignee)    departmentId FK
     │ reporterPersonId       substatusId FK → substatus
     └──────────────────►     mergedIntoTicketId FK (self-ref)
                         │    apiClientId FK → clients
                         │
                         ├──── actions (1:many)
                         │       actorPersonId FK → people
                         │       actorClientId FK → clients
                         │
                         ├──── media (1:many)
                         │
                         ├──── ticket_geodata (1:1)
                         │
                         └──── notification_log (1:many)

substatus (standalone lookup table)
clients   (standalone lookup table)
templates (standalone lookup table)
sessions  (optional — for JWT revocation)
geoclusters (cache table — populated by Solr job)
```

### 3.2 Complete DDL — Core Tables

All tables: InnoDB engine, utf8mb4 charset, UTC timestamps.

#### Table: `departments`

```sql
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `categoryGroups`

```sql
CREATE TABLE categoryGroups (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL,
  sortOrder   INT UNSIGNED NOT NULL DEFAULT 0,
  active      TINYINT(1) NOT NULL DEFAULT 1,

  PRIMARY KEY (id),
  UNIQUE KEY uq_group_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `people`

```sql
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
  INDEX idx_departmentId (departmentId),

  CONSTRAINT fk_people_department FOREIGN KEY (departmentId) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `contactMethods`

```sql
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `categories`

```sql
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **`categories.fields` JSON schema** (array of custom field definition objects):
> ```json
> [
>   {
>     "code": "severity",
>     "label": "Severity Level",
>     "type": "select",
>     "required": false,
>     "options": ["low", "medium", "high", "critical"]
>   }
> ]
> ```

#### Table: `substatus`

```sql
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `clients`

```sql
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **Security:** The plain-text API key is returned once on create/regenerate. Only `apiKeyHash` (bcrypt) is persisted. On Open311 validation, the provided key is hashed and compared with `apiKeyHash`.

#### Table: `tickets`

```sql
CREATE TABLE tickets (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title               VARCHAR(255) NOT NULL,
  description         TEXT NULL,
  status              ENUM('open','closed') NOT NULL DEFAULT 'open',
  datetimeOpened      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  datetimeClosed      DATETIME NULL,
  datetimeUpdated     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt           DATETIME NULL,

  -- Routing
  categoryId          INT UNSIGNED NOT NULL,
  departmentId        INT UNSIGNED NOT NULL,

  -- People references
  personId            INT UNSIGNED NULL COMMENT 'Assignee (staff)',
  reporterPersonId    INT UNSIGNED NULL COMMENT 'Registered reporter (nullable for anonymous)',

  -- Anonymous / Open311 reporter fields
  reporterName        VARCHAR(255) NULL,
  reporterEmail       VARCHAR(255) NULL,
  reporterPhone       VARCHAR(50)  NULL,

  -- Location (denormalized copy; authoritative copy in ticket_geodata)
  address             VARCHAR(500) NULL,
  lat                 DECIMAL(10,7) NULL,
  lng                 DECIMAL(10,7) NULL,

  -- State
  substatusId         INT UNSIGNED NULL,
  mergedIntoTicketId  INT UNSIGNED NULL COMMENT 'Self-referential FK for merge',

  -- Open311 client attribution
  apiClientId         INT UNSIGNED NULL,

  -- Category-specific custom field values
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `actions`

```sql
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **Immutability:** No `UPDATE` or `DELETE` on `actions` is permitted. Enforce via application layer. Consider `BEFORE UPDATE` / `BEFORE DELETE` MySQL triggers that raise `SIGNAL SQLSTATE '45000'`.

#### Table: `media`

```sql
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `ticket_geodata`

```sql
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.3 Complete DDL — Supporting Tables

#### Table: `templates`

```sql
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**System template seed data (slugs):**

| Slug | Purpose |
|------|---------|
| `ticket_created` | Confirmation to reporter on ticket creation |
| `ticket_assigned` | Notification to new assignee |
| `ticket_response` | Notification to reporter when staff posts a response |
| `ticket_closed` | Notification to reporter on closure |
| `ticket_merged` | Notification to reporter of merged (source) ticket |
| `digest_daily` | Daily digest email to department staff |

#### Table: `bookmarks`

```sql
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `notification_log`

```sql
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `geoclusters`

```sql
CREATE TABLE geoclusters (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  lat         DECIMAL(10,7) NOT NULL,
  lng         DECIMAL(10,7) NOT NULL,
  zoom        TINYINT UNSIGNED NOT NULL COMMENT 'Map zoom level 1–20',
  count       INT UNSIGNED NOT NULL DEFAULT 0,
  updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_lat_lng_zoom (lat, lng, zoom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **Note:** `geoclusters` is a pre-computed cache table populated by a Solr spatial heatmap job. It can be fully rebuilt from Solr at any time.

#### Table: `sessions` (optional — server-side JWT revocation)

```sql
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.4 Schema Migration Notes

- All schema changes are delivered as versioned **Phinx** migration scripts under `db/migrations/`.
- `tickets.mergedIntoTicketId` is a new column — migration adds it with `DEFAULT NULL`.
- `people.oidcSubject` may already exist in some legacy deployments — migration checks with `IF NOT EXISTS`.
- `clients.apiKeyHash` replaces any plain-text `apiKey` column — migration hashes existing keys with bcrypt and adds `apiKeyHint`.
- `categories.fields` JSON column is additive — existing rows default to `NULL` (treated as no custom fields).
- `templates`, `sessions`, `notification_log` are new tables — additive, no existing data affected.
- Legacy `ticketHistory` table (if named differently) is aliased or renamed to `actions` via migration.

---
