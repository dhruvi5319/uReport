---

## 3. Data Model

### 3.1 Entity-Relationship Diagram

```
┌───────────────┐         ┌──────────────────┐
│ categoryGroups│         │   departments     │
│ id PK         │◀──┐     │ id PK             │◀──────────────┐
│ name          │   │     │ name              │               │
│ ordering      │   │     │ defaultPerson_id FK────────────┐  │
└───────────────┘   │     └──────────┬────────┘           │  │
                    │                │ id                  │  │
┌───────────────┐   │     ┌──────────▼────────────────┐   │  │
│   categories  │   │     │          people            │   │  │
│ id PK         │   │     │ id PK                      │   │  │
│ name          │   │     │ firstname                  │◀──┘  │
│ department_id ├───┼────▶│ lastname                   │      │
│ categoryGroup─┘   │     │ organization               │◀─────┤
│ defaultPerson_id ─┼────▶│ department_id FK───────────┼──────┘
│ active        │   │     │ username                   │
│ featured      │   │     │ role                       │
│ displayPerm   │   │     └────────────────────────────┘
│ postingPerm   │   │       │    │    │
│ slaDays       │   │       │    │    │
│ autoClose...  │   │     ┌─▼─┐┌─▼─┐┌─▼──────────┐
└───────┬───────┘   │     │   ││   ││            │
        │           │     │ p ││ p ││ p          │
┌───────▼───────┐   │     │ e ││ e ││ e          │
│cat_action_resp│   │     │ o ││ o ││ o          │
│ category_id FK│   │     │ p ││ p ││ p          │
│ action_id FK  │   │     │ l ││ l ││ l          │
│ template      │   │     │ e ││ e ││ e          │
│ replyEmail    │   │     │ E ││ P ││ A          │
└───────────────┘   │     │ m ││ h ││ d          │
                    │     │ a ││ o ││ d          │
┌───────────────┐   │     │ i ││ n ││ r          │
│dept_categories│   │     │ l ││ e ││ e          │
│ department_id ├───┘     │ s ││ s ││ s          │
│ category_id   │         └───┘└───┘└────────────┘
└───────────────┘
        
┌────────────────────────────────────────────────────────┐
│                        tickets                          │
│ id PK                                                   │
│ parent_id FK→tickets    category_id FK→categories       │
│ issueType_id FK         client_id FK→clients            │
│ enteredByPerson_id FK   reportedByPerson_id FK          │
│ assignedPerson_id FK    contactMethod_id FK             │
│ status (open/closed)    substatus_id FK→substatus       │
│ enteredDate  closedDate  lastModified                   │
│ location  latitude  longitude  city  state  zip         │
│ description  additionalFields  customFields             │
│ search_vector tsvector  ← FTS column (added by Flyway)  │
└────────────────────────────────────────────────────────┘
        │                    │
        │                    │
┌───────▼──────┐    ┌────────▼─────────┐
│ ticketHistory│    │  ticket_geodata   │
│ id PK        │    │ ticket_id PK FK   │
│ ticket_id FK │    │ cluster_id_0..6 FK│
│ enteredByPerson   └───────┬──────────┘
│ actionPerson │            │
│ action_id FK │    ┌───────▼──────────┐
│ enteredDate  │    │   geoclusters    │
│ actionDate   │    │ id PK            │
│ notes        │    │ level            │
│ sentNotif... │    │ center POINT     │
└──────────────┘    └──────────────────┘
        
┌──────────┐   ┌──────────┐   ┌──────────────┐   ┌─────────────┐
│  actions │   │substatus │   │  issueTypes  │   │contactMeth  │
│ id PK    │   │ id PK    │   │ id PK        │   │ id PK       │
│ name     │   │ name     │   │ name         │   │ name        │
│ type     │   │ status   │   └──────────────┘   └─────────────┘
│ template │   │ isDefault│
│ replyEmail│  └──────────┘
└──────────┘

┌───────────────┐   ┌──────────┐   ┌────────────┐
│dept_actions   │   │  media   │   │  bookmarks │
│department_id  │   │ id PK    │   │ id PK      │
│action_id      │   │ticket_id │   │ person_id  │
└───────────────┘   │filename  │   │ type       │
                    │mime_type │   │ name       │
┌───────────────┐   │uploaded  │   │ requestUri │
│   clients     │   │person_id │   └────────────┘
│ id PK         │   └──────────┘
│ name, url     │
│ api_key       │
│contactPerson  │
│contactMethod  │
└───────────────┘
```

---

### 3.2 Complete PostgreSQL DDL (Flyway V1__initial_schema.sql)

#### Core Lookup Tables

```sql
-- ============================================================
-- CONTACT METHODS
-- ============================================================
CREATE TABLE contact_methods (
    id   SERIAL       PRIMARY KEY,
    name VARCHAR(128) NOT NULL
);
INSERT INTO contact_methods (name) VALUES ('Email'), ('Phone'), ('Web Form'), ('Other');

-- ============================================================
-- SUBSTATUS
-- ============================================================
CREATE TABLE substatus (
    id          SERIAL       PRIMARY KEY,
    name        VARCHAR(25)  NOT NULL,
    description VARCHAR(128) NOT NULL,
    status      VARCHAR(10)  NOT NULL DEFAULT 'open'
                             CHECK (status IN ('open', 'closed')),
    is_default  BOOLEAN      NOT NULL DEFAULT FALSE
);
INSERT INTO substatus (status, name, description) VALUES
    ('closed', 'Resolved',  'This ticket has been taken care of'),
    ('closed', 'Duplicate', 'This ticket is a duplicate of another ticket'),
    ('closed', 'Bogus',     'This ticket is not actually a problem or has already been taken care of');

-- ============================================================
-- ACTIONS
-- ============================================================
CREATE TABLE actions (
    id          SERIAL       PRIMARY KEY,
    name        VARCHAR(25)  NOT NULL,
    description VARCHAR(128) NOT NULL,
    type        VARCHAR(20)  NOT NULL DEFAULT 'department'
                             CHECK (type IN ('system', 'department')),
    template    TEXT,
    reply_email VARCHAR(128)
);
INSERT INTO actions (name, type, description) VALUES
    ('open',           'system', 'Opened by {actionPerson}'),
    ('assignment',     'system', '{enteredByPerson} assigned this case to {actionPerson}'),
    ('closed',         'system', 'Closed by {actionPerson}'),
    ('changeCategory', 'system', 'Changed category from {original:category_id} to {updated:category_id}'),
    ('changeLocation', 'system', 'Changed location from {original:location} to {updated:location}'),
    ('response',       'system', '{actionPerson} contacted {reportedByPerson_id}'),
    ('duplicate',      'system', '{duplicate:ticket_id} marked as a duplicate of this case.'),
    ('update',         'system', '{enteredByPerson} updated this case.'),
    ('comment',        'system', '{enteredByPerson} commented on this case.'),
    ('upload_media',   'system', '{enteredByPerson} uploaded an attachment.');

-- ============================================================
-- ISSUE TYPES
-- ============================================================
CREATE TABLE issue_types (
    id   SERIAL       PRIMARY KEY,
    name VARCHAR(128) NOT NULL
);
INSERT INTO issue_types (name) VALUES
    ('Comment'), ('Complaint'), ('Question'), ('Report'), ('Request'), ('Violation');

-- ============================================================
-- CATEGORY GROUPS
-- ============================================================
CREATE TABLE category_groups (
    id       SERIAL      PRIMARY KEY,
    name     VARCHAR(50) NOT NULL,
    ordering SMALLINT
);
INSERT INTO category_groups (name) VALUES ('Streets'), ('Sanitation'), ('Other');
```

#### People and Contact Tables

```sql
-- ============================================================
-- DEPARTMENTS  (forward-declared before people due to mutual FK)
-- ============================================================
CREATE TABLE departments (
    id                SERIAL       PRIMARY KEY,
    name              VARCHAR(128) NOT NULL,
    default_person_id INTEGER      -- FK added after people table
);

-- ============================================================
-- PEOPLE
-- ============================================================
CREATE TABLE people (
    id            SERIAL       PRIMARY KEY,
    firstname     VARCHAR(128),
    middlename    VARCHAR(128),
    lastname      VARCHAR(128),
    organization  VARCHAR(128),
    address       VARCHAR(128),
    city          VARCHAR(128),
    state         VARCHAR(128),
    zip           VARCHAR(20),
    department_id INTEGER      REFERENCES departments(id),
    username      VARCHAR(40)  UNIQUE,
    role          VARCHAR(30)
                  CHECK (role IN ('admin', 'staff', 'public') OR role IS NULL)
);

-- Add deferred FK for departments.default_person_id
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_default_person
    FOREIGN KEY (default_person_id) REFERENCES people(id);

CREATE INDEX idx_people_department_id ON people(department_id);
CREATE INDEX idx_people_username      ON people(username);
CREATE INDEX idx_people_lastname      ON people(lastname);

-- ============================================================
-- PEOPLE EMAILS
-- ============================================================
CREATE TABLE people_emails (
    id                    SERIAL       PRIMARY KEY,
    person_id             INTEGER      NOT NULL REFERENCES people(id),
    email                 VARCHAR(255) NOT NULL,
    label                 VARCHAR(10)  NOT NULL DEFAULT 'Other'
                          CHECK (label IN ('Home', 'Work', 'Other')),
    used_for_notifications BOOLEAN     NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_people_emails_person_id ON people_emails(person_id);
CREATE INDEX idx_people_emails_email     ON people_emails(email);

-- ============================================================
-- PEOPLE PHONES
-- ============================================================
CREATE TABLE people_phones (
    id        SERIAL      PRIMARY KEY,
    person_id INTEGER     NOT NULL REFERENCES people(id),
    number    VARCHAR(20),
    label     VARCHAR(10) NOT NULL DEFAULT 'Other'
              CHECK (label IN ('Main', 'Mobile', 'Work', 'Home', 'Fax', 'Pager', 'Other'))
);
CREATE INDEX idx_people_phones_person_id ON people_phones(person_id);

-- ============================================================
-- PEOPLE ADDRESSES
-- ============================================================
CREATE TABLE people_addresses (
    id        SERIAL       PRIMARY KEY,
    person_id INTEGER      NOT NULL REFERENCES people(id),
    address   VARCHAR(128) NOT NULL,
    city      VARCHAR(128),
    state     VARCHAR(128),
    zip       VARCHAR(20),
    label     VARCHAR(10)  NOT NULL DEFAULT 'Home'
              CHECK (label IN ('Home', 'Business', 'Rental'))
);
CREATE INDEX idx_people_addresses_person_id ON people_addresses(person_id);
```

#### Client / API Key Tables

```sql
-- ============================================================
-- CLIENTS (Open311 API consumers)
-- ============================================================
CREATE TABLE clients (
    id                 SERIAL       PRIMARY KEY,
    name               VARCHAR(128) NOT NULL,
    url                VARCHAR(255),
    api_key            VARCHAR(50)  NOT NULL UNIQUE,
    contact_person_id  INTEGER      NOT NULL REFERENCES people(id),
    contact_method_id  INTEGER      REFERENCES contact_methods(id)
);
CREATE INDEX idx_clients_api_key           ON clients(api_key);
CREATE INDEX idx_clients_contact_person_id ON clients(contact_person_id);
```

#### Category Tables

```sql
-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
    id                      SERIAL       PRIMARY KEY,
    name                    VARCHAR(50)  NOT NULL,
    description             VARCHAR(512),
    department_id           INTEGER      NOT NULL REFERENCES departments(id),
    default_person_id       INTEGER      REFERENCES people(id),
    category_group_id       INTEGER      REFERENCES category_groups(id),
    active                  BOOLEAN      NOT NULL DEFAULT TRUE,
    featured                BOOLEAN      NOT NULL DEFAULT FALSE,
    display_permission_level VARCHAR(20) NOT NULL DEFAULT 'staff'
                             CHECK (display_permission_level IN ('staff', 'public', 'anonymous')),
    posting_permission_level VARCHAR(20) NOT NULL DEFAULT 'staff'
                             CHECK (posting_permission_level IN ('staff', 'public', 'anonymous')),
    custom_fields           TEXT,
    last_modified           TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sla_days                INTEGER      CHECK (sla_days > 0),
    notification_reply_email VARCHAR(128),
    auto_close_is_active    BOOLEAN      NOT NULL DEFAULT FALSE,
    auto_close_substatus_id INTEGER      REFERENCES substatus(id)
);
CREATE INDEX idx_categories_department_id    ON categories(department_id);
CREATE INDEX idx_categories_category_group_id ON categories(category_group_id);
CREATE INDEX idx_categories_active           ON categories(active);

-- ============================================================
-- CATEGORY ACTION RESPONSES (response templates per category+action)
-- ============================================================
CREATE TABLE category_action_responses (
    id          SERIAL   PRIMARY KEY,
    category_id INTEGER  NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    action_id   INTEGER  NOT NULL REFERENCES actions(id),
    template    TEXT,
    reply_email VARCHAR(128)
);
CREATE INDEX idx_car_category_id ON category_action_responses(category_id);
CREATE INDEX idx_car_action_id   ON category_action_responses(action_id);

-- ============================================================
-- DEPARTMENT ACTIONS (allowed action types per department)
-- ============================================================
CREATE TABLE department_actions (
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    action_id     INTEGER NOT NULL REFERENCES actions(id),
    PRIMARY KEY (department_id, action_id)
);

-- ============================================================
-- DEPARTMENT CATEGORIES (secondary department-category mapping)
-- ============================================================
CREATE TABLE department_categories (
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    category_id   INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (department_id, category_id)
);
```

#### Core Ticket Tables

```sql
-- ============================================================
-- TICKETS
-- ============================================================
CREATE TABLE tickets (
    id                    SERIAL        PRIMARY KEY,
    parent_id             INTEGER       REFERENCES tickets(id),
    category_id           INTEGER       REFERENCES categories(id),
    issue_type_id         INTEGER       REFERENCES issue_types(id),
    client_id             INTEGER       REFERENCES clients(id),
    entered_by_person_id  INTEGER       REFERENCES people(id),
    reported_by_person_id INTEGER       REFERENCES people(id),
    assigned_person_id    INTEGER       REFERENCES people(id),
    contact_method_id     INTEGER       REFERENCES contact_methods(id),
    response_method_id    INTEGER       REFERENCES contact_methods(id),
    entered_date          TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified         TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    address_id            INTEGER,
    latitude              DOUBLE PRECISION,
    longitude             DOUBLE PRECISION,
    location              VARCHAR(128),
    city                  VARCHAR(128),
    state                 VARCHAR(128),
    zip                   VARCHAR(40),
    status                VARCHAR(20)   NOT NULL DEFAULT 'open'
                          CHECK (status IN ('open', 'closed')),
    closed_date           TIMESTAMPTZ,
    substatus_id          INTEGER       REFERENCES substatus(id),
    additional_fields     VARCHAR(255),
    custom_fields         TEXT,
    description           TEXT,
    -- Full-text search vector (populated by trigger V2__search_vector.sql)
    search_vector         TSVECTOR
);

CREATE INDEX idx_tickets_category_id           ON tickets(category_id);
CREATE INDEX idx_tickets_assigned_person_id    ON tickets(assigned_person_id);
CREATE INDEX idx_tickets_reported_by_person_id ON tickets(reported_by_person_id);
CREATE INDEX idx_tickets_entered_by_person_id  ON tickets(entered_by_person_id);
CREATE INDEX idx_tickets_status                ON tickets(status);
CREATE INDEX idx_tickets_entered_date          ON tickets(entered_date DESC);
CREATE INDEX idx_tickets_substatus_id          ON tickets(substatus_id);
CREATE INDEX idx_tickets_parent_id             ON tickets(parent_id);
CREATE INDEX idx_tickets_client_id             ON tickets(client_id);

-- ============================================================
-- TICKET HISTORY (immutable audit trail)
-- ============================================================
CREATE TABLE ticket_history (
    id                    SERIAL      PRIMARY KEY,
    ticket_id             INTEGER     NOT NULL REFERENCES tickets(id),
    entered_by_person_id  INTEGER     REFERENCES people(id),
    action_person_id      INTEGER     REFERENCES people(id),
    action_id             INTEGER     NOT NULL REFERENCES actions(id),
    entered_date          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action_date           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes                 TEXT,
    data                  TEXT,
    sent_notifications    TEXT        -- JSON array of email addresses notified
);
CREATE INDEX idx_ticket_history_ticket_id             ON ticket_history(ticket_id);
CREATE INDEX idx_ticket_history_entered_by_person_id  ON ticket_history(entered_by_person_id);
CREATE INDEX idx_ticket_history_action_person_id      ON ticket_history(action_person_id);
CREATE INDEX idx_ticket_history_action_id             ON ticket_history(action_id);
CREATE INDEX idx_ticket_history_entered_date          ON ticket_history(entered_date DESC);

-- ============================================================
-- MEDIA
-- ============================================================
CREATE TABLE media (
    id                SERIAL       PRIMARY KEY,
    ticket_id         INTEGER      NOT NULL REFERENCES tickets(id),
    filename          VARCHAR(128) NOT NULL,
    internal_filename VARCHAR(50)  NOT NULL UNIQUE,
    mime_type         VARCHAR(128),
    uploaded          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    person_id         INTEGER      REFERENCES people(id)
);
CREATE INDEX idx_media_ticket_id  ON media(ticket_id);
CREATE INDEX idx_media_person_id  ON media(person_id);
CREATE INDEX idx_media_uploaded   ON media(uploaded DESC);

-- ============================================================
-- BOOKMARKS (saved searches per user)
-- ============================================================
CREATE TABLE bookmarks (
    id          SERIAL        PRIMARY KEY,
    person_id   INTEGER       NOT NULL REFERENCES people(id),
    type        VARCHAR(128)  NOT NULL DEFAULT 'search',
    name        VARCHAR(128),
    request_uri VARCHAR(1024) NOT NULL
);
CREATE INDEX idx_bookmarks_person_id ON bookmarks(person_id);

-- ============================================================
-- GEOCLUSTERS (pre-computed geographic clusters)
-- ============================================================
CREATE TABLE geoclusters (
    id     SERIAL   PRIMARY KEY,
    level  SMALLINT NOT NULL,
    -- PostGIS point: SRID 4326; stored as (longitude, latitude)
    center POINT    NOT NULL
);
CREATE INDEX idx_geoclusters_level ON geoclusters(level);

-- ============================================================
-- TICKET GEODATA (maps ticket to zoom-level cluster)
-- ============================================================
CREATE TABLE ticket_geodata (
    ticket_id    INTEGER PRIMARY KEY REFERENCES tickets(id),
    cluster_id_0 INTEGER REFERENCES geoclusters(id),
    cluster_id_1 INTEGER REFERENCES geoclusters(id),
    cluster_id_2 INTEGER REFERENCES geoclusters(id),
    cluster_id_3 INTEGER REFERENCES geoclusters(id),
    cluster_id_4 INTEGER REFERENCES geoclusters(id),
    cluster_id_5 INTEGER REFERENCES geoclusters(id),
    cluster_id_6 INTEGER REFERENCES geoclusters(id)
);
CREATE INDEX idx_ticket_geodata_cluster_0 ON ticket_geodata(cluster_id_0);
CREATE INDEX idx_ticket_geodata_cluster_1 ON ticket_geodata(cluster_id_1);
```

---

### 3.3 Full-Text Search — Flyway V2__search_vector.sql

```sql
-- Add search_vector column (idempotent if run after V1)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- GIN index for sub-100ms FTS queries
CREATE INDEX idx_tickets_search_vector ON tickets USING GIN (search_vector);

-- Trigger function to maintain search_vector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION tickets_search_vector_update()
RETURNS TRIGGER AS $$
DECLARE
    reporter_firstname TEXT := '';
    reporter_lastname  TEXT := '';
    category_name      TEXT := '';
BEGIN
    -- Resolve reporter name
    IF NEW.reported_by_person_id IS NOT NULL THEN
        SELECT COALESCE(firstname, ''), COALESCE(lastname, '')
        INTO reporter_firstname, reporter_lastname
        FROM people WHERE id = NEW.reported_by_person_id;
    END IF;

    -- Resolve category name
    IF NEW.category_id IS NOT NULL THEN
        SELECT COALESCE(name, '')
        INTO category_name
        FROM categories WHERE id = NEW.category_id;
    END IF;

    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.id::TEXT, '')),    'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.location, '')),    'B') ||
        setweight(to_tsvector('english', reporter_lastname),             'C') ||
        setweight(to_tsvector('english', reporter_firstname),            'C') ||
        setweight(to_tsvector('english', category_name),                 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_search_vector_trigger
BEFORE INSERT OR UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION tickets_search_vector_update();

-- Backfill existing rows after migration
UPDATE tickets SET search_vector = NULL WHERE id > 0;
-- (trigger fires on UPDATE, populating search_vector for all rows)
```

---

### 3.4 Column Name Mapping (MySQL → PostgreSQL)

The MySQL schema uses camelCase column names. PostgreSQL uses snake_case per convention.

| MySQL Column | PostgreSQL Column | Table |
|---|---|---|
| `defaultPerson_id` | `default_person_id` | `departments` |
| `department_id` | `department_id` | `people` |
| `usedForNotifications` | `used_for_notifications` | `people_emails` |
| `contactPerson_id` | `contact_person_id` | `clients` |
| `contactMethod_id` | `contact_method_id` | `clients` |
| `defaultPerson_id` | `default_person_id` | `categories` |
| `categoryGroup_id` | `category_group_id` | `categories` |
| `displayPermissionLevel` | `display_permission_level` | `categories` |
| `postingPermissionLevel` | `posting_permission_level` | `categories` |
| `lastModified` | `last_modified` | `categories` |
| `slaDays` | `sla_days` | `categories` |
| `notificationReplyEmail` | `notification_reply_email` | `categories` |
| `autoCloseIsActive` | `auto_close_is_active` | `categories` |
| `autoCloseSubstatus_id` | `auto_close_substatus_id` | `categories` |
| `category_id` | `category_id` | `category_action_responses` |
| `action_id` | `action_id` | `category_action_responses` |
| `replyEmail` | `reply_email` | `category_action_responses`, `actions` |
| `issueType_id` | `issue_type_id` | `tickets` |
| `client_id` | `client_id` | `tickets` |
| `enteredByPerson_id` | `entered_by_person_id` | `tickets` |
| `reportedByPerson_id` | `reported_by_person_id` | `tickets` |
| `assignedPerson_id` | `assigned_person_id` | `tickets` |
| `contactMethod_id` | `contact_method_id` | `tickets` |
| `responseMethod_id` | `response_method_id` | `tickets` |
| `enteredDate` | `entered_date` | `tickets` |
| `lastModified` | `last_modified` | `tickets` |
| `addressId` | `address_id` | `tickets` |
| `closedDate` | `closed_date` | `tickets` |
| `substatus_id` | `substatus_id` | `tickets` |
| `additionalFields` | `additional_fields` | `tickets` |
| `customFields` | `custom_fields` | `tickets` |
| `enteredByPerson_id` | `entered_by_person_id` | `ticket_history` |
| `actionPerson_id` | `action_person_id` | `ticket_history` |
| `action_id` | `action_id` | `ticket_history` |
| `enteredDate` | `entered_date` | `ticket_history` |
| `actionDate` | `action_date` | `ticket_history` |
| `sentNotifications` | `sent_notifications` | `ticket_history` |
| `internalFilename` | `internal_filename` | `media` |
| `mime_type` | `mime_type` | `media` (unchanged) |
| `person_id` | `person_id` | `media` (unchanged) |
| `requestUri` | `request_uri` | `bookmarks` |
| `isDefault` | `is_default` | `substatus` |

**MySQL type mappings:**
- `INT UNSIGNED` → `INTEGER` (PostgreSQL has no unsigned; application enforces non-negative)
- `TINYINT(1)` → `BOOLEAN`
- `TINYINT UNSIGNED` → `SMALLINT`
- `FLOAT(17,14)` → `DOUBLE PRECISION`
- `DATETIME` → `TIMESTAMPTZ`
- `TIMESTAMP` → `TIMESTAMPTZ`
- `ENUM(...)` → `VARCHAR(n)` with `CHECK` constraint (preserves values; avoids PostgreSQL enum type migration complexity)
- `POINT` → `POINT` (PostgreSQL native; no PostGIS required for simple lat/lon storage; use PostGIS `GEOGRAPHY` if spatial queries needed)

---
