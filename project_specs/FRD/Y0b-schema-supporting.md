---

## Y0b: Database Schema — Supporting Tables

Continuation of schema DDL. All tables use InnoDB engine, `utf8mb4` charset.

---

### Table: `substatus`

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `clients`

```sql
CREATE TABLE clients (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(255) NOT NULL,
  contactEmail  VARCHAR(255) NOT NULL,
  apiKeyHash    VARCHAR(255) NOT NULL COMMENT 'bcrypt hash of the API key',
  apiKeyHint    VARCHAR(20) NOT NULL COMMENT 'First 8 chars of the key for display',
  notes         TEXT NULL,
  active        TINYINT(1) NOT NULL DEFAULT 1,
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_client_name (name),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

> **Note:** The plain-text API key is generated on create/regenerate and returned once. Only the bcrypt hash is stored. On validation, hash the provided key and compare with `apiKeyHash`.

---

### Table: `bookmarks`

```sql
CREATE TABLE bookmarks (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  personId    INT UNSIGNED NOT NULL,
  name        VARCHAR(100) NOT NULL,
  filterState JSON NOT NULL COMMENT 'Serialized search filter state',
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_bookmark_person_name (personId, name),
  INDEX idx_personId (personId),

  CONSTRAINT fk_bookmark_person FOREIGN KEY (personId) REFERENCES people(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `templates`

```sql
CREATE TABLE templates (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL,
  subject     VARCHAR(255) NULL,
  body        TEXT NOT NULL,
  slug        VARCHAR(50) NULL UNIQUE COMMENT 'System templates only; null for user-created',
  active      TINYINT(1) NOT NULL DEFAULT 1,
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_template_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**System template slugs (seed data):**

| Slug | Purpose |
|------|---------|
| `ticket_created` | Confirmation to reporter on ticket creation |
| `ticket_assigned` | Notification to new assignee |
| `ticket_response` | Notification to reporter when staff posts response |
| `ticket_closed` | Notification to reporter on ticket closure |
| `ticket_merged` | Notification to reporter of merged ticket |
| `digest_daily` | Daily digest email for department staff |

---

### Table: `notification_log`

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

  CONSTRAINT fk_notif_ticket FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `geoclusters`

```sql
CREATE TABLE geoclusters (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  lat         DECIMAL(10,7) NOT NULL,
  lng         DECIMAL(10,7) NOT NULL,
  zoom        TINYINT UNSIGNED NOT NULL COMMENT 'Map zoom level 1-20',
  count       INT UNSIGNED NOT NULL DEFAULT 0,
  updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_lat_lng_zoom (lat, lng, zoom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

> **Note:** `geoclusters` is a pre-computed cache table populated by a Solr spatial clustering job. It is not source-of-truth data — it can be rebuilt from Solr. The API `/api/tickets/clusters` may query this table or call Solr directly depending on implementation.

---

### Table: `sessions` (optional — for server-side session invalidation)

```sql
CREATE TABLE sessions (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  personId    INT UNSIGNED NOT NULL,
  jwtJti      VARCHAR(255) NOT NULL UNIQUE COMMENT 'JWT ID claim for revocation',
  expiresAt   DATETIME NOT NULL,
  revokedAt   DATETIME NULL,
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_personId (personId),
  INDEX idx_jwtJti (jwtJti),
  INDEX idx_expiresAt (expiresAt),

  CONSTRAINT fk_session_person FOREIGN KEY (personId) REFERENCES people(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Schema Migration Notes

- All schema changes must be provided as versioned migration scripts (e.g., Phinx migrations).
- The `tickets.mergedIntoTicketId` column is a new addition to the existing schema.
- The `people.oidcSubject` column may already exist in some legacy deployments (check before adding).
- The `categories.fields` JSON column should default to `NULL`; existing rows will have `NULL` and are treated as having no custom fields.
- The `clients.apiKeyHash` replaces any plain-text `apiKey` column in the legacy `clients` table; migration should hash existing keys.
- `ticketHistory` table (legacy name for `actions`) — confirm the legacy table name and alias if needed.
- New tables (`sessions`, `notification_log`, `templates`) are additive — no existing data affected.

---

*End of Y0b — supporting schema chunk.*
