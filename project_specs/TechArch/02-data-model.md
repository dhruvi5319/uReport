## Section 02: Data Model — PostgreSQL 16 DDL

**All timestamps: `TIMESTAMPTZ`. UUID generation: `gen_random_uuid()`. Required extensions: `postgis`, `pgcrypto`.**

---

## ER Diagram (ASCII)

```
contactMethods ──< tickets (contactMethod_id, responseMethod_id)
departments ──< people (department_id)
departments ──< categories (department_id)
departments >──< actions (department_actions)
departments >──< categories (department_categories)
people ──< tickets (reportedByPerson_id, assignedPerson_id, enteredByPerson_id)
people ──< peopleEmails
people ──< peoplePhones
people ──< peopleAddresses
people ──< bookmarks
people ──< refresh_tokens
people ─── departments (departments.defaultPerson_id)
clients ──< tickets (client_id)
clients → people (contactPerson_id)
clients → contactMethods (contactMethod_id)
categoryGroups ──< categories (categoryGroup_id)
substatus ──< tickets (substatus_id)
substatus ─── categories (autoCloseSubstatus_id)
categories ──< tickets (category_id)
categories ──< category_action_responses (category_id)
actions ──< ticketHistory (action_id)
actions ──< category_action_responses (action_id)
actions ──< responseTemplates (action_id)
issueTypes ──< tickets (issueType_id)
locations ──< tickets (addressId)
tickets ──< ticketHistory
tickets ──< media
tickets ─── ticket_geodata
geoclusters ──< ticket_geodata (cluster_id_0..6)
token_blacklist (standalone; cleaned by scheduler)
```

---

## DDL Creation Order

Tables must be created in this sequence (FK dependencies):

1. `contactMethods` → 2. `departments` → 3. `people` → 4. `ALTER TABLE departments ADD FK` →
5. `peopleEmails/Phones/Addresses` → 6. `clients` → 7. `substatus` → 8. `categoryGroups` →
9. `categories` → 10. `actions` → 11. `category_action_responses` → 12. `department_actions` →
13. `department_categories` → 14. `issueTypes` → 15. `locations` → 16. `tickets` →
17. `ticketHistory` → 18. `media` → 19. `bookmarks` → 20. `geoclusters` →
21. `ticket_geodata` → 22. `responseTemplates` → 23. `refresh_tokens` → 24. `token_blacklist`

---

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

---

## Lookup Tables

### contactMethods

```sql
CREATE TABLE contactMethods (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    isSystem    BOOLEAN         NOT NULL DEFAULT false,
    CONSTRAINT uq_contact_methods_name UNIQUE (name)
);

INSERT INTO contactMethods (id, name, isSystem) VALUES
    (1, 'Email',    true),
    (2, 'Phone',    true),
    (3, 'Web Form', true),
    (4, 'Other',    true);
SELECT setval('contactmethods_id_seq', 4);
```

### issueTypes

```sql
CREATE TABLE issueTypes (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    isSystem    BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_issue_types_name UNIQUE (name)
);

INSERT INTO issueTypes (id, name, isSystem) VALUES
    (1, 'Comment',   true),
    (2, 'Complaint', true),
    (3, 'Question',  true),
    (4, 'Report',    true),
    (5, 'Request',   true),
    (6, 'Violation', true);
SELECT setval('issuetypes_id_seq', 6);
```

---

## People & Organization Tables

### departments

```sql
CREATE TABLE departments (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100)    NOT NULL,
    defaultPerson_id    INTEGER,        -- FK added after people (see ALTER below)
    CONSTRAINT uq_departments_name UNIQUE (name)
);
```

### people

```sql
CREATE TABLE people (
    id              SERIAL PRIMARY KEY,
    firstname       VARCHAR(100)    NOT NULL,
    middlename      VARCHAR(100),
    lastname        VARCHAR(100)    NOT NULL,
    organization    VARCHAR(200),
    address         VARCHAR(255),
    city            VARCHAR(100),
    state           VARCHAR(2),
    zip             VARCHAR(10),
    department_id   INTEGER         REFERENCES departments(id) ON DELETE SET NULL,
    username        VARCHAR(100),
    passwordHash    VARCHAR(255),
    role            VARCHAR(20)     CHECK (role IN ('staff', 'public', 'anonymous')),
    deletedAt       TIMESTAMPTZ,
    CONSTRAINT uq_people_username UNIQUE (username)
);

-- Resolve circular dependency: departments.defaultPerson_id → people
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_default_person
    FOREIGN KEY (defaultPerson_id) REFERENCES people(id) ON DELETE SET NULL;

CREATE INDEX idx_people_department  ON people (department_id);
CREATE INDEX idx_people_role        ON people (role);
CREATE INDEX idx_people_username    ON people (username);
CREATE INDEX idx_people_name        ON people (lastname, firstname);
CREATE INDEX idx_people_deleted     ON people (deletedAt) WHERE deletedAt IS NULL;
```

### peopleEmails

```sql
CREATE TABLE peopleEmails (
    id                      SERIAL PRIMARY KEY,
    person_id               INTEGER         NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    email                   VARCHAR(255)    NOT NULL,
    label                   VARCHAR(50),    -- 'Home', 'Work', 'Other'
    usedForNotifications    BOOLEAN         NOT NULL DEFAULT false
);

CREATE INDEX idx_people_emails_person  ON peopleEmails (person_id);
CREATE INDEX idx_people_emails_email   ON peopleEmails (email);
CREATE INDEX idx_people_emails_notify  ON peopleEmails (person_id) WHERE usedForNotifications = true;
```

### peoplePhones

```sql
CREATE TABLE peoplePhones (
    id          SERIAL PRIMARY KEY,
    person_id   INTEGER         NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    number      VARCHAR(30)     NOT NULL,
    label       VARCHAR(50)     -- 'Main', 'Mobile', 'Work', 'Home', 'Fax', 'Pager', 'Other'
);

CREATE INDEX idx_people_phones_person ON peoplePhones (person_id);
```

### peopleAddresses

```sql
CREATE TABLE peopleAddresses (
    id          SERIAL PRIMARY KEY,
    person_id   INTEGER         NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    address     VARCHAR(255)    NOT NULL,
    city        VARCHAR(100),
    state       VARCHAR(2),
    zip         VARCHAR(10),
    label       VARCHAR(50)     -- 'Home', 'Business', 'Rental'
);

CREATE INDEX idx_people_addresses_person ON peopleAddresses (person_id);
```

### clients

```sql
CREATE TABLE clients (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(200)    NOT NULL,
    url                 VARCHAR(500),
    api_key_hash        VARCHAR(255)    NOT NULL,   -- BCrypt hash for secure storage
    api_key_lookup      VARCHAR(64)     NOT NULL,   -- SHA-256 hex for fast indexed lookup
    contactPerson_id    INTEGER         REFERENCES people(id) ON DELETE SET NULL,
    contactMethod_id    INTEGER         REFERENCES contactMethods(id) ON DELETE SET NULL,
    CONSTRAINT uq_clients_api_key_lookup UNIQUE (api_key_lookup)
);

CREATE INDEX idx_clients_contact_person ON clients (contactPerson_id);
```

---

## Category & Action Tables

### substatus

```sql
CREATE TABLE substatus (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    description TEXT,
    status      VARCHAR(10)     NOT NULL CHECK (status IN ('open', 'closed')),
    isDefault   BOOLEAN         NOT NULL DEFAULT false,
    isSystem    BOOLEAN         NOT NULL DEFAULT false
);

CREATE INDEX idx_substatus_status    ON substatus (status);
CREATE INDEX idx_substatus_default   ON substatus (status) WHERE isDefault = true;

INSERT INTO substatus (id, name, description, status, isDefault, isSystem) VALUES
    (1, 'Open',      'Ticket is open',                  'open',   true,  true),
    (2, 'Resolved',  'Issue has been resolved',          'closed', true,  true),
    (3, 'Duplicate', 'Ticket is a duplicate of another', 'closed', false, true),
    (4, 'Bogus',     'Ticket was invalid or bogus',      'closed', false, true);
SELECT setval('substatus_id_seq', 4);
```

### categoryGroups

```sql
CREATE TABLE categoryGroups (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    ordering    INTEGER         NOT NULL DEFAULT 0
);

CREATE INDEX idx_category_groups_ordering ON categoryGroups (ordering);
```

### categories

```sql
CREATE TABLE categories (
    id                          SERIAL PRIMARY KEY,
    name                        VARCHAR(200)    NOT NULL,
    description                 TEXT,
    department_id               INTEGER         REFERENCES departments(id) ON DELETE SET NULL,
    defaultPerson_id            INTEGER         REFERENCES people(id) ON DELETE SET NULL,
    categoryGroup_id            INTEGER         REFERENCES categoryGroups(id) ON DELETE SET NULL,
    active                      BOOLEAN         NOT NULL DEFAULT true,
    featured                    BOOLEAN         NOT NULL DEFAULT false,
    displayPermissionLevel      VARCHAR(20)     NOT NULL DEFAULT 'anonymous'
                                                CHECK (displayPermissionLevel IN ('staff','public','anonymous')),
    postingPermissionLevel      VARCHAR(20)     NOT NULL DEFAULT 'anonymous'
                                                CHECK (postingPermissionLevel IN ('staff','public','anonymous')),
    customFields                JSONB,
    lastModified                TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    slaDays                     INTEGER,
    notificationReplyEmail      VARCHAR(255),
    autoCloseIsActive           BOOLEAN         NOT NULL DEFAULT false,
    autoCloseSubstatus_id       INTEGER         REFERENCES substatus(id) ON DELETE SET NULL
);

CREATE INDEX idx_categories_department      ON categories (department_id);
CREATE INDEX idx_categories_group           ON categories (categoryGroup_id);
CREATE INDEX idx_categories_active          ON categories (active) WHERE active = true;
CREATE INDEX idx_categories_posting_perm    ON categories (postingPermissionLevel);
```

### actions

```sql
CREATE TABLE actions (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    description TEXT,
    type        VARCHAR(20)     NOT NULL CHECK (type IN ('system', 'department')),
    template    TEXT,
    replyEmail  VARCHAR(255)
);

CREATE INDEX idx_actions_type ON actions (type);

INSERT INTO actions (id, name, description, type, template) VALUES
    (1,  'open',           'Ticket opened',                   'system', 'Ticket opened by {enteredByPerson}'),
    (2,  'assignment',     'Ticket assigned to person',        'system', 'Assigned to {actionPerson} by {enteredByPerson}'),
    (3,  'closed',         'Ticket closed',                   'system', 'Closed by {enteredByPerson}'),
    (4,  'changeCategory', 'Ticket category changed',         'system', 'Category changed from {original:category_id} to {updated:category_id} by {enteredByPerson}'),
    (5,  'changeLocation', 'Ticket location changed',         'system', 'Location changed from {original:location} to {updated:location} by {enteredByPerson}'),
    (6,  'response',       'Response recorded on ticket',     'system', 'Response recorded by {enteredByPerson}'),
    (7,  'duplicate',      'Ticket marked as duplicate',      'system', 'Marked as duplicate of #{duplicate:ticket_id} by {enteredByPerson}'),
    (8,  'update',         'Ticket updated',                  'system', 'Updated by {enteredByPerson}'),
    (9,  'comment',        'Comment added to ticket',         'system', 'Comment added by {enteredByPerson}'),
    (10, 'upload_media',   'Media uploaded to ticket',        'system', 'Media uploaded by {enteredByPerson}');
SELECT setval('actions_id_seq', 10);
```

### category_action_responses

```sql
CREATE TABLE category_action_responses (
    id              SERIAL PRIMARY KEY,
    category_id     INTEGER     NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    action_id       INTEGER     NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    template        TEXT,
    replyEmail      VARCHAR(255),
    CONSTRAINT uq_cat_action_response UNIQUE (category_id, action_id)
);

CREATE INDEX idx_cat_action_responses_category ON category_action_responses (category_id);
CREATE INDEX idx_cat_action_responses_action   ON category_action_responses (action_id);
```

### department_actions

```sql
CREATE TABLE department_actions (
    department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    action_id       INTEGER NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    PRIMARY KEY (department_id, action_id)
);
```

### department_categories

```sql
CREATE TABLE department_categories (
    department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (department_id, category_id)
);
```

---

## Core Ticket Tables

### locations

```sql
CREATE TABLE locations (
    id          SERIAL PRIMARY KEY,
    address     VARCHAR(255)    NOT NULL,
    city        VARCHAR(100),
    state       VARCHAR(2),
    zip         VARCHAR(10),
    latitude    NUMERIC(9,6),
    longitude   NUMERIC(9,6),
    geo_point   GEOGRAPHY(POINT, 4326)
);

CREATE INDEX idx_locations_geo   ON locations USING GIST (geo_point);
CREATE INDEX idx_locations_addr  ON locations (address, city, state, zip);
```

### tickets

```sql
CREATE TABLE tickets (
    id                      BIGSERIAL PRIMARY KEY,
    parent_id               BIGINT         REFERENCES tickets(id) ON DELETE SET NULL,
    category_id             INTEGER        NOT NULL REFERENCES categories(id),
    issueType_id            INTEGER        REFERENCES issueTypes(id),
    client_id               INTEGER        REFERENCES clients(id) ON DELETE SET NULL,
    enteredByPerson_id      INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    reportedByPerson_id     INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    assignedPerson_id       INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    contactMethod_id        INTEGER        REFERENCES contactMethods(id),
    responseMethod_id       INTEGER        REFERENCES contactMethods(id),
    enteredDate             TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    lastModified            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    addressId               INTEGER        REFERENCES locations(id) ON DELETE SET NULL,
    latitude                NUMERIC(9,6),
    longitude               NUMERIC(9,6),
    geo_point               GEOGRAPHY(POINT, 4326),
    location                TEXT,
    city                    VARCHAR(100),
    state                   VARCHAR(2),
    zip                     VARCHAR(10),
    status                  VARCHAR(20)    NOT NULL DEFAULT 'open'
                                           CHECK (status IN ('open','closed')),
    closedDate              TIMESTAMPTZ,
    substatus_id            INTEGER        REFERENCES substatus(id),
    additionalFields        JSONB,
    customFields            JSONB,
    description             TEXT           NOT NULL,
    search_vector           TSVECTOR
);

-- Scalar indexes
CREATE INDEX idx_tickets_status         ON tickets (status);
CREATE INDEX idx_tickets_category       ON tickets (category_id);
CREATE INDEX idx_tickets_assignedPerson ON tickets (assignedPerson_id);
CREATE INDEX idx_tickets_reportedBy     ON tickets (reportedByPerson_id);
CREATE INDEX idx_tickets_enteredDate    ON tickets (enteredDate);
CREATE INDEX idx_tickets_closedDate     ON tickets (closedDate);
CREATE INDEX idx_tickets_lastModified   ON tickets (lastModified);
CREATE INDEX idx_tickets_substatus      ON tickets (substatus_id);
CREATE INDEX idx_tickets_client         ON tickets (client_id);
CREATE INDEX idx_tickets_parent         ON tickets (parent_id);
-- FTS index
CREATE INDEX idx_tickets_fts            ON tickets USING GIN (search_vector);
-- Geo index
CREATE INDEX idx_tickets_geo            ON tickets USING GIST (geo_point);

-- FTS update trigger
CREATE OR REPLACE FUNCTION tickets_fts_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.location, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.city, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW.zip, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_tickets_fts
    BEFORE INSERT OR UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION tickets_fts_update();

-- geo_point sync trigger
CREATE OR REPLACE FUNCTION tickets_geo_sync() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geo_point := ST_MakePoint(NEW.longitude, NEW.latitude)::geography;
    ELSE
        NEW.geo_point := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_tickets_geo
    BEFORE INSERT OR UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION tickets_geo_sync();
```

### ticketHistory

```sql
CREATE TABLE ticketHistory (
    id                  BIGSERIAL PRIMARY KEY,
    ticket_id           BIGINT         NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    enteredByPerson_id  INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    actionPerson_id     INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    action_id           INTEGER        NOT NULL REFERENCES actions(id),
    enteredDate         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    actionDate          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    notes               TEXT,
    data                JSONB,
    sentNotifications   TEXT
);

CREATE INDEX idx_history_ticket     ON ticketHistory (ticket_id);
CREATE INDEX idx_history_action     ON ticketHistory (action_id);
CREATE INDEX idx_history_entered    ON ticketHistory (enteredDate);
CREATE INDEX idx_history_sn_null    ON ticketHistory (ticket_id) WHERE sentNotifications IS NULL;
```

### media

```sql
CREATE TABLE media (
    id                  BIGSERIAL PRIMARY KEY,
    ticket_id           BIGINT         NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    filename            VARCHAR(255)   NOT NULL,
    internalFilename    VARCHAR(255)   NOT NULL,
    mime_type           VARCHAR(100)   NOT NULL,
    uploaded            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    person_id           INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    CONSTRAINT uq_media_internal_filename UNIQUE (internalFilename)
);

CREATE INDEX idx_media_ticket ON media (ticket_id);
```

---

## Auth Tables

### refresh_tokens

```sql
CREATE TABLE refresh_tokens (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id   INTEGER         NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    createdAt   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    expiresAt   TIMESTAMPTZ     NOT NULL,
    revoked     BOOLEAN         NOT NULL DEFAULT false
);

CREATE INDEX idx_refresh_tokens_person  ON refresh_tokens (person_id);
CREATE INDEX idx_refresh_tokens_expiry  ON refresh_tokens (expiresAt) WHERE revoked = false;
```

### token_blacklist

```sql
CREATE TABLE token_blacklist (
    jti         VARCHAR(36)  PRIMARY KEY,
    expiresAt   TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_token_blacklist_expiry ON token_blacklist (expiresAt);
```

---

## Geo Tables

### geoclusters

```sql
CREATE TABLE geoclusters (
    id      BIGSERIAL PRIMARY KEY,
    level   SMALLINT               NOT NULL CHECK (level BETWEEN 0 AND 6),
    center  GEOGRAPHY(POINT, 4326) NOT NULL
);

CREATE INDEX idx_geoclusters_level  ON geoclusters (level);
CREATE INDEX idx_geoclusters_center ON geoclusters USING GIST (center);
```

### ticket_geodata

```sql
CREATE TABLE ticket_geodata (
    ticket_id       BIGINT  PRIMARY KEY REFERENCES tickets(id) ON DELETE CASCADE,
    cluster_id_0    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_1    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_2    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_3    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_4    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_5    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_6    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL
);

CREATE INDEX idx_ticket_geodata_c0 ON ticket_geodata (cluster_id_0);
CREATE INDEX idx_ticket_geodata_c1 ON ticket_geodata (cluster_id_1);
CREATE INDEX idx_ticket_geodata_c2 ON ticket_geodata (cluster_id_2);
CREATE INDEX idx_ticket_geodata_c3 ON ticket_geodata (cluster_id_3);
CREATE INDEX idx_ticket_geodata_c4 ON ticket_geodata (cluster_id_4);
CREATE INDEX idx_ticket_geodata_c5 ON ticket_geodata (cluster_id_5);
CREATE INDEX idx_ticket_geodata_c6 ON ticket_geodata (cluster_id_6);
```

---

## Miscellaneous Tables

### bookmarks

```sql
CREATE TABLE bookmarks (
    id          SERIAL PRIMARY KEY,
    person_id   INTEGER         NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    type        VARCHAR(50)     NOT NULL DEFAULT 'search',
    name        VARCHAR(200)    NOT NULL,
    requestUri  VARCHAR(2048)   NOT NULL,
    createdAt   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookmarks_person ON bookmarks (person_id);
```

### responseTemplates

```sql
CREATE TABLE responseTemplates (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200)    NOT NULL,
    template    TEXT            NOT NULL,
    action_id   INTEGER         REFERENCES actions(id) ON DELETE SET NULL
);

CREATE INDEX idx_response_templates_action ON responseTemplates (action_id);
```

---

## MySQL → PostgreSQL Type Mapping

| MySQL Type | PostgreSQL Equivalent | Notes |
|------------|----------------------|-------|
| `INT AUTO_INCREMENT` | `SERIAL` | `BIGSERIAL` for high-volume tables |
| `ENUM('open','closed')` | `VARCHAR(20) CHECK (value IN (...))` | More portable than PG ENUM |
| `TINYINT(1)` | `BOOLEAN` | Exact semantic match |
| `DATETIME` | `TIMESTAMPTZ` | Always timezone-aware |
| `JSON` | `JSONB` | Binary JSON; supports GIN indexing |
| `POINT` (MySQL spatial) | `GEOGRAPHY(POINT, 4326)` (PostGIS) | Requires PostGIS extension |
| `VARCHAR(n)` | `VARCHAR(n)` | Identical |
| `FLOAT` / `DOUBLE` | `NUMERIC(9,6)` | Fixed precision for lat/long |
| `TEXT` | `TEXT` | Identical |

**Post-migration sequence reset:**
```sql
-- Run after data migration for every SERIAL table:
SELECT setval('tablename_id_seq', (SELECT MAX(id) FROM tablename));
```
