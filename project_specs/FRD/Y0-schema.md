---

## Y0: Database Schema — Full PostgreSQL DDL

This section contains the complete PostgreSQL DDL for all 18 migrated tables plus the `search_vector` addition. This is the authoritative schema reference for Spring Data JPA entity definitions and Flyway migration `V1__initial_schema.sql`.

**Source:** `crm/scripts/mysql.sql` (authoritative MySQL reference)  
**Target:** PostgreSQL 15+  
**Migration tool:** Flyway

---

### V1__initial_schema.sql (All 18 Tables)

```sql
-- ============================================================
-- uReport CRM — PostgreSQL Schema
-- Migrated from MySQL by Flyway V1__initial_schema.sql
-- ============================================================

-- Disable FK checks temporarily via deferred constraints
SET CONSTRAINTS ALL DEFERRED;

-- ============================================================
-- departments (defined before people due to circular FK)
-- ============================================================
CREATE TABLE departments (
    id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name              VARCHAR(128) NOT NULL,
    defaultPerson_id  INTEGER
    -- FK to people added below after people table creation
);

-- ============================================================
-- people
-- ============================================================
CREATE TABLE people (
    id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    firstname      VARCHAR(128),
    middlename     VARCHAR(128),
    lastname       VARCHAR(128),
    organization   VARCHAR(128),
    address        VARCHAR(128),
    city           VARCHAR(128),
    state          VARCHAR(128),
    zip            VARCHAR(20),
    department_id  INTEGER,
    username       VARCHAR(40) UNIQUE,
    role           VARCHAR(30) CHECK (role IN ('admin', 'staff', 'public')),
    CONSTRAINT FK_people_department_id FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Add deferred FK from departments back to people
ALTER TABLE departments
    ADD CONSTRAINT FK_departments_defaultPerson_id
    FOREIGN KEY (defaultPerson_id) REFERENCES people(id)
    DEFERRABLE INITIALLY DEFERRED;

-- ============================================================
-- peopleEmails
-- ============================================================
CREATE TABLE "peopleEmails" (
    id                   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    person_id            INTEGER NOT NULL,
    email                VARCHAR(255) NOT NULL,
    label                VARCHAR(10) NOT NULL DEFAULT 'Other'
                             CHECK (label IN ('Home', 'Work', 'Other')),
    "usedForNotifications" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "FK_peopleEmails_person_id" FOREIGN KEY (person_id) REFERENCES people(id)
);

-- ============================================================
-- peoplePhones
-- ============================================================
CREATE TABLE "peoplePhones" (
    id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    person_id INTEGER NOT NULL,
    number    VARCHAR(20),
    label     VARCHAR(10) NOT NULL DEFAULT 'Other'
                  CHECK (label IN ('Main', 'Mobile', 'Work', 'Home', 'Fax', 'Pager', 'Other')),
    CONSTRAINT "FK_peoplePhones_person_id" FOREIGN KEY (person_id) REFERENCES people(id)
);

-- ============================================================
-- peopleAddresses
-- ============================================================
CREATE TABLE "peopleAddresses" (
    id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    person_id INTEGER NOT NULL,
    address   VARCHAR(128) NOT NULL,
    city      VARCHAR(128),
    state     VARCHAR(128),
    zip       VARCHAR(20),
    label     VARCHAR(10) NOT NULL DEFAULT 'Home'
                  CHECK (label IN ('Home', 'Business', 'Rental')),
    CONSTRAINT "FK_peopleAddresses_person_id" FOREIGN KEY (person_id) REFERENCES people(id)
);

-- ============================================================
-- contactMethods
-- ============================================================
CREATE TABLE "contactMethods" (
    id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(128) NOT NULL
);
INSERT INTO "contactMethods" (name) VALUES ('Email'), ('Phone'), ('Web Form'), ('Other');

-- ============================================================
-- clients (Open311 API clients)
-- ============================================================
CREATE TABLE clients (
    id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name              VARCHAR(128) NOT NULL,
    url               VARCHAR(255),
    api_key           VARCHAR(50) NOT NULL UNIQUE,
    "contactPerson_id" INTEGER NOT NULL,
    "contactMethod_id" INTEGER,
    CONSTRAINT "FK_clients_contactPerson_id" FOREIGN KEY ("contactPerson_id") REFERENCES people(id),
    CONSTRAINT "FK_clients_contactMethod_id" FOREIGN KEY ("contactMethod_id") REFERENCES "contactMethods"(id)
);

-- ============================================================
-- substatus
-- ============================================================
CREATE TABLE substatus (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(25) NOT NULL,
    description VARCHAR(128) NOT NULL,
    status      VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    "isDefault" BOOLEAN NOT NULL DEFAULT FALSE
);
INSERT INTO substatus (status, name, description) VALUES
    ('closed', 'Resolved',  'This ticket has been taken care of'),
    ('closed', 'Duplicate', 'This ticket is a duplicate of another ticket'),
    ('closed', 'Bogus',     'This ticket is not actually a problem or has already been taken care of');

-- ============================================================
-- actions (action type lookup)
-- ============================================================
CREATE TABLE actions (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(25) NOT NULL,
    description VARCHAR(128) NOT NULL,
    type        VARCHAR(15) NOT NULL DEFAULT 'department' CHECK (type IN ('system', 'department')),
    template    TEXT,
    "replyEmail" VARCHAR(128)
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
-- categoryGroups
-- ============================================================
CREATE TABLE "categoryGroups" (
    id       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name     VARCHAR(50) NOT NULL,
    ordering SMALLINT
);
INSERT INTO "categoryGroups" (name) VALUES ('Streets'), ('Sanitation'), ('Other');

-- ============================================================
-- categories
-- ============================================================
CREATE TABLE categories (
    id                       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                     VARCHAR(50) NOT NULL,
    description              VARCHAR(512),
    department_id            INTEGER NOT NULL,
    "defaultPerson_id"       INTEGER,
    "categoryGroup_id"       INTEGER,
    active                   BOOLEAN,
    featured                 BOOLEAN,
    "displayPermissionLevel"  VARCHAR(15) NOT NULL DEFAULT 'staff'
                                 CHECK ("displayPermissionLevel" IN ('staff', 'public', 'anonymous')),
    "postingPermissionLevel"  VARCHAR(15) NOT NULL DEFAULT 'staff'
                                 CHECK ("postingPermissionLevel" IN ('staff', 'public', 'anonymous')),
    "customFields"           TEXT,
    "lastModified"           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slaDays"                INTEGER CHECK ("slaDays" > 0),
    "notificationReplyEmail" VARCHAR(128),
    "autoCloseIsActive"      BOOLEAN,
    "autoCloseSubstatus_id"  INTEGER,
    CONSTRAINT FK_categories_department_id    FOREIGN KEY (department_id)      REFERENCES departments(id),
    CONSTRAINT "FK_categories_defaultPerson_id" FOREIGN KEY ("defaultPerson_id") REFERENCES people(id),
    CONSTRAINT "FK_categories_categoryGroup_id" FOREIGN KEY ("categoryGroup_id") REFERENCES "categoryGroups"(id)
);

-- ============================================================
-- category_action_responses
-- ============================================================
CREATE TABLE category_action_responses (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id INTEGER NOT NULL,
    action_id   INTEGER NOT NULL,
    template    TEXT,
    "replyEmail" VARCHAR(128),
    CONSTRAINT FK_car_category_id FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT FK_car_action_id   FOREIGN KEY (action_id)   REFERENCES actions(id)
);

-- ============================================================
-- department_actions (join table)
-- ============================================================
CREATE TABLE department_actions (
    department_id INTEGER NOT NULL,
    action_id     INTEGER NOT NULL,
    PRIMARY KEY (department_id, action_id),
    CONSTRAINT FK_da_department_id FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT FK_da_action_id     FOREIGN KEY (action_id)     REFERENCES actions(id)
);

-- ============================================================
-- department_categories (join table)
-- ============================================================
CREATE TABLE department_categories (
    department_id INTEGER NOT NULL,
    category_id   INTEGER NOT NULL,
    PRIMARY KEY (department_id, category_id),
    CONSTRAINT FK_dc_department_id FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT FK_dc_category_id   FOREIGN KEY (category_id)   REFERENCES categories(id)
);

-- ============================================================
-- issueTypes
-- ============================================================
CREATE TABLE "issueTypes" (
    id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(128) NOT NULL
);
INSERT INTO "issueTypes" (name) VALUES
    ('Comment'), ('Complaint'), ('Question'), ('Report'), ('Request'), ('Violation');

-- ============================================================
-- tickets (core entity)
-- ============================================================
CREATE TABLE tickets (
    id                    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    parent_id             INTEGER,
    category_id           INTEGER,
    "issueType_id"        INTEGER,
    client_id             INTEGER,
    "enteredByPerson_id"  INTEGER,
    "reportedByPerson_id" INTEGER,
    "assignedPerson_id"   INTEGER,
    "contactMethod_id"    INTEGER,
    "responseMethod_id"   INTEGER,
    "enteredDate"         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModified"        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addressId"           INTEGER,
    latitude              DOUBLE PRECISION,
    longitude             DOUBLE PRECISION,
    location              VARCHAR(128),
    city                  VARCHAR(128),
    state                 VARCHAR(128),
    zip                   VARCHAR(40),
    status                VARCHAR(20) NOT NULL DEFAULT 'open',
    "closedDate"          TIMESTAMPTZ,
    substatus_id          INTEGER,
    "additionalFields"    VARCHAR(255),
    "customFields"        TEXT,
    description           TEXT,
    CONSTRAINT FK_tickets_parent_id          FOREIGN KEY (parent_id)             REFERENCES tickets(id),
    CONSTRAINT FK_tickets_category_id        FOREIGN KEY (category_id)           REFERENCES categories(id),
    CONSTRAINT FK_tickets_client_id          FOREIGN KEY (client_id)             REFERENCES clients(id),
    CONSTRAINT "FK_tickets_enteredByPerson_id" FOREIGN KEY ("enteredByPerson_id") REFERENCES people(id),
    CONSTRAINT "FK_tickets_assignedPerson_id"  FOREIGN KEY ("assignedPerson_id")  REFERENCES people(id),
    CONSTRAINT FK_tickets_substatus_id       FOREIGN KEY (substatus_id)          REFERENCES substatus(id)
);

CREATE INDEX idx_tickets_status      ON tickets (status);
CREATE INDEX idx_tickets_category_id ON tickets (category_id);
CREATE INDEX idx_tickets_entered_date ON tickets ("enteredDate");
CREATE INDEX idx_tickets_assigned_person ON tickets ("assignedPerson_id");

-- ============================================================
-- ticketHistory (action audit trail)
-- ============================================================
CREATE TABLE "ticketHistory" (
    id                   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id            INTEGER NOT NULL,
    "enteredByPerson_id" INTEGER,
    "actionPerson_id"    INTEGER,
    action_id            INTEGER NOT NULL,
    "enteredDate"        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionDate"         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes                TEXT,
    data                 TEXT,
    "sentNotifications"  TEXT,
    CONSTRAINT "FK_ticketHistory_ticket_id"          FOREIGN KEY (ticket_id)            REFERENCES tickets(id),
    CONSTRAINT "FK_ticketHistory_enteredByPerson_id" FOREIGN KEY ("enteredByPerson_id") REFERENCES people(id),
    CONSTRAINT "FK_ticketHistory_actionPerson_id"    FOREIGN KEY ("actionPerson_id")    REFERENCES people(id),
    CONSTRAINT "FK_ticketHistory_action_id"          FOREIGN KEY (action_id)            REFERENCES actions(id)
);

CREATE INDEX "idx_ticketHistory_ticket_id" ON "ticketHistory" (ticket_id);
CREATE INDEX "idx_ticketHistory_entered_date" ON "ticketHistory" ("enteredDate");

-- ============================================================
-- media (photo attachments)
-- ============================================================
CREATE TABLE media (
    id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id         INTEGER NOT NULL,
    filename          VARCHAR(128) NOT NULL,
    "internalFilename" VARCHAR(50) NOT NULL,
    mime_type         VARCHAR(128),
    uploaded          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    person_id         INTEGER,
    CONSTRAINT FK_media_ticket_id FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    CONSTRAINT FK_media_person_id FOREIGN KEY (person_id) REFERENCES people(id)
);

CREATE INDEX idx_media_ticket_id ON media (ticket_id);

-- ============================================================
-- bookmarks (saved searches)
-- ============================================================
CREATE TABLE bookmarks (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    person_id   INTEGER NOT NULL,
    type        VARCHAR(128) NOT NULL DEFAULT 'search',
    name        VARCHAR(128),
    "requestUri" VARCHAR(1024) NOT NULL,
    CONSTRAINT FK_bookmarks_person_id FOREIGN KEY (person_id) REFERENCES people(id)
);

-- ============================================================
-- geoclusters (pre-computed map clusters)
-- ============================================================
CREATE TABLE geoclusters (
    id     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    level  SMALLINT NOT NULL,
    center POINT NOT NULL
);

CREATE INDEX idx_geoclusters_center ON geoclusters USING GIST (center);

-- ============================================================
-- ticket_geodata (per-ticket cluster membership)
-- ============================================================
CREATE TABLE ticket_geodata (
    ticket_id    INTEGER NOT NULL PRIMARY KEY,
    cluster_id_0 INTEGER,
    cluster_id_1 INTEGER,
    cluster_id_2 INTEGER,
    cluster_id_3 INTEGER,
    cluster_id_4 INTEGER,
    cluster_id_5 INTEGER,
    cluster_id_6 INTEGER,
    FOREIGN KEY (ticket_id)    REFERENCES tickets(id),
    FOREIGN KEY (cluster_id_0) REFERENCES geoclusters(id),
    FOREIGN KEY (cluster_id_1) REFERENCES geoclusters(id),
    FOREIGN KEY (cluster_id_2) REFERENCES geoclusters(id),
    FOREIGN KEY (cluster_id_3) REFERENCES geoclusters(id),
    FOREIGN KEY (cluster_id_4) REFERENCES geoclusters(id),
    FOREIGN KEY (cluster_id_5) REFERENCES geoclusters(id),
    FOREIGN KEY (cluster_id_6) REFERENCES geoclusters(id)
);

SET CONSTRAINTS ALL IMMEDIATE;
```

---

### V2__search_vector.sql

```sql
-- Add full-text search vector column to tickets
ALTER TABLE tickets ADD COLUMN search_vector TSVECTOR;

-- GIN index for fast FTS queries
CREATE INDEX idx_tickets_search_vector ON tickets USING GIN (search_vector);

-- Trigger function to keep search_vector in sync
CREATE OR REPLACE FUNCTION update_ticket_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.id::text, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.location, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_vector
BEFORE INSERT OR UPDATE OF description, location ON tickets
FOR EACH ROW EXECUTE FUNCTION update_ticket_search_vector();

-- Backfill for existing rows
UPDATE tickets SET search_vector =
    setweight(to_tsvector('english', coalesce(id::text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'B');
```

---

### Entity Relationship Summary

```
departments ←——— people (department_id)
     |
     └——→ categories (department_id)
               |
               └——→ tickets (category_id)
                        |
                        ├——→ ticketHistory (ticket_id)
                        ├——→ media (ticket_id)
                        └——→ ticket_geodata (ticket_id)
                                   |
                                   └——→ geoclusters (cluster_id_0..6)

people ←——— tickets (reportedByPerson_id, assignedPerson_id, enteredByPerson_id)
people ←——— peopleEmails (person_id)
people ←——— peoplePhones (person_id)
people ←——— peopleAddresses (person_id)
people ←——— bookmarks (person_id)
people ←——— clients (contactPerson_id)

categories ←——— categoryGroups (categoryGroup_id)
categories ←——— category_action_responses (category_id)
actions ←——— category_action_responses (action_id)
actions ←——— department_actions (action_id)
departments ←——— department_actions (department_id)
departments ←——— department_categories (department_id)
categories ←——— department_categories (category_id)

substatus ←——— tickets (substatus_id)
issueTypes ←——— tickets (issueType_id)
contactMethods ←——— tickets (contactMethod_id)
clients ←——— tickets (client_id)
```
