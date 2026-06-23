---

## Y0a: Database Schema — Core Tables

Full DDL for the core entities. All tables use InnoDB engine, `utf8mb4` charset. All `id` columns are `INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY` unless noted. Timestamps default to UTC.

---

### Table: `tickets`

```sql
CREATE TABLE tickets (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title               VARCHAR(255) NOT NULL,
  description         TEXT,
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
  reporterPersonId    INT UNSIGNED NULL COMMENT 'Reporter (may be null for anonymous)',

  -- Reporter fields (for anonymous/non-registered reporters)
  reporterName        VARCHAR(255) NULL,
  reporterEmail       VARCHAR(255) NULL,
  reporterPhone       VARCHAR(50) NULL,

  -- Location
  address             VARCHAR(500) NULL,
  lat                 DECIMAL(10,7) NULL,
  lng                 DECIMAL(10,7) NULL,

  -- State
  substatusId         INT UNSIGNED NULL,
  mergedIntoTicketId  INT UNSIGNED NULL COMMENT 'FK to tickets.id (self-referential)',

  -- Open311 client attribution
  apiClientId         INT UNSIGNED NULL COMMENT 'FK to clients.id',

  -- Custom fields (category-specific, JSON)
  customFields        JSON NULL,

  PRIMARY KEY (id),
  INDEX idx_status (status),
  INDEX idx_categoryId (categoryId),
  INDEX idx_departmentId (departmentId),
  INDEX idx_personId (personId),
  INDEX idx_datetimeOpened (datetimeOpened),
  INDEX idx_datetimeClosed (datetimeClosed),
  INDEX idx_deletedAt (deletedAt),

  CONSTRAINT fk_tickets_category    FOREIGN KEY (categoryId)         REFERENCES categories(id),
  CONSTRAINT fk_tickets_department  FOREIGN KEY (departmentId)       REFERENCES departments(id),
  CONSTRAINT fk_tickets_assignee    FOREIGN KEY (personId)           REFERENCES people(id),
  CONSTRAINT fk_tickets_reporter    FOREIGN KEY (reporterPersonId)   REFERENCES people(id),
  CONSTRAINT fk_tickets_substatus   FOREIGN KEY (substatusId)        REFERENCES substatus(id),
  CONSTRAINT fk_tickets_merged      FOREIGN KEY (mergedIntoTicketId) REFERENCES tickets(id),
  CONSTRAINT fk_tickets_client      FOREIGN KEY (apiClientId)        REFERENCES clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `people`

```sql
CREATE TABLE people (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  firstName     VARCHAR(100) NOT NULL,
  lastName      VARCHAR(100) NOT NULL,
  role          ENUM('admin','staff','public') NOT NULL DEFAULT 'public',
  departmentId  INT UNSIGNED NULL,
  active        TINYINT(1) NOT NULL DEFAULT 1,
  oidcSubject   VARCHAR(255) NULL UNIQUE COMMENT 'OIDC sub claim',
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_role (role),
  INDEX idx_active (active),
  INDEX idx_departmentId (departmentId),

  CONSTRAINT fk_people_department FOREIGN KEY (departmentId) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `contactMethods`

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `departments`

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `categories`

```sql
CREATE TABLE categories (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name                VARCHAR(255) NOT NULL,
  departmentId        INT UNSIGNED NOT NULL,
  groupId             INT UNSIGNED NULL,
  slaDays             INT UNSIGNED NULL COMMENT 'NULL = no SLA',
  displayPermission   ENUM('public','staff','anonymous') NOT NULL DEFAULT 'public',
  postingPermission   ENUM('staff','public','anonymous') NOT NULL DEFAULT 'public',
  defaultAssigneeId   INT UNSIGNED NULL,
  autoCloseDays       INT UNSIGNED NULL DEFAULT 0 COMMENT '0 = disabled',
  active              TINYINT(1) NOT NULL DEFAULT 1,
  fields              JSON NULL COMMENT 'Array of custom field definition objects',
  createdAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_cat_name (name),
  INDEX idx_departmentId (departmentId),
  INDEX idx_active (active),

  CONSTRAINT fk_cat_department FOREIGN KEY (departmentId) REFERENCES departments(id),
  CONSTRAINT fk_cat_group      FOREIGN KEY (groupId)      REFERENCES categoryGroups(id),
  CONSTRAINT fk_cat_assignee   FOREIGN KEY (defaultAssigneeId) REFERENCES people(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `categoryGroups`

```sql
CREATE TABLE categoryGroups (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL,
  sortOrder   INT UNSIGNED NOT NULL DEFAULT 0,
  active      TINYINT(1) NOT NULL DEFAULT 1,

  PRIMARY KEY (id),
  UNIQUE KEY uq_group_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `actions`

```sql
CREATE TABLE actions (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticketId        INT UNSIGNED NOT NULL,
  type            ENUM('open','assignment','closed','reopen','response','comment',
                       'upload','deleted','merged','substatus','notification_sent') NOT NULL,
  visibility      ENUM('external','internal') NOT NULL DEFAULT 'internal',
  actorPersonId   INT UNSIGNED NULL,
  actorClientId   INT UNSIGNED NULL,
  datetimeCreated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payload         JSON NULL,

  PRIMARY KEY (id),
  INDEX idx_ticketId (ticketId),
  INDEX idx_type (type),
  INDEX idx_datetimeCreated (datetimeCreated),

  CONSTRAINT fk_action_ticket FOREIGN KEY (ticketId)      REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_action_person FOREIGN KEY (actorPersonId) REFERENCES people(id),
  CONSTRAINT fk_action_client FOREIGN KEY (actorClientId) REFERENCES clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

> **Immutability note:** No `UPDATE` or `DELETE` statements should ever be issued against `actions`. Enforce via application layer and consider a `BEFORE UPDATE` / `BEFORE DELETE` trigger that raises an error.

---

### Table: `media`

```sql
CREATE TABLE media (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticketId        INT UNSIGNED NOT NULL,
  filename        VARCHAR(255) NOT NULL COMMENT 'Stored filename on disk',
  originalName    VARCHAR(255) NULL COMMENT 'Original filename from uploader',
  mimeType        VARCHAR(100) NOT NULL,
  size            INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'File size in bytes',
  path            VARCHAR(500) NOT NULL COMMENT 'Relative path under upload root',
  thumbnailPath   VARCHAR(500) NULL,
  sourceUrl       VARCHAR(2048) NULL COMMENT 'Open311 media_url reference',
  label           VARCHAR(255) NULL,
  deletedAt       DATETIME NULL,
  createdAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_ticketId (ticketId),
  INDEX idx_deletedAt (deletedAt),

  CONSTRAINT fk_media_ticket FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `ticket_geodata`

```sql
CREATE TABLE ticket_geodata (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticketId            INT UNSIGNED NOT NULL UNIQUE,
  lat                 DECIMAL(10,7) NULL,
  lng                 DECIMAL(10,7) NULL,
  address             VARCHAR(500) NULL,
  addressNormalized   VARCHAR(500) NULL COMMENT 'Normalized form from geocoder',
  geoStatus           ENUM('located','pending','failed') NOT NULL DEFAULT 'pending',
  updatedAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_lat_lng (lat, lng),

  CONSTRAINT fk_geodata_ticket FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

*End of Y0a — core schema chunk. Continue to `Y0b-schema-supporting.md` for substatus, templates, bookmarks, clients, sessions, notification_log, geoclusters.*
