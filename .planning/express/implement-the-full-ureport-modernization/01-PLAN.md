---
phase: implement-the-full-ureport-modernization
plan: "01"
type: execute
wave: 1
depends_on: []
files_modified:
  - db/init/01-extensions.sql
  - db/init/02-schema.sql
  - db/init/03-seed.sql
autonomous: true

features:
  implements: ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20"]
  depends_on: []
  enables: ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20"]

must_haves:
  truths:
    - "PostgreSQL container starts cleanly from a cold docker-compose up with no manual intervention"
    - "All 24 tables exist with correct columns, types, FKs, and constraints"
    - "FTS trigger fires on ticket INSERT/UPDATE and populates search_vector"
    - "geo_point is auto-synced from latitude/longitude on ticket INSERT/UPDATE"
    - "Seed data is present: 4 contactMethods, 6 issueTypes, 4 substatuses, 10 actions"
    - "refresh_tokens, token_blacklist, bookmarks, responseTemplates tables exist (auth/misc foundation)"
  artifacts:
    - path: "db/init/01-extensions.sql"
      provides: "postgis and pgcrypto extensions"
    - path: "db/init/02-schema.sql"
      provides: "all 24 tables + FTS/geo-sync triggers + all indexes"
    - path: "db/init/03-seed.sql"
      provides: "seed rows for contactMethods, issueTypes, substatus, actions"
  key_links:
    - from: "tickets.search_vector"
      to: "tickets_fts_update() trigger"
      via: "BEFORE INSERT OR UPDATE"
      pattern: "CREATE TRIGGER trig_tickets_fts"
    - from: "tickets.geo_point"
      to: "tickets_geo_sync() trigger"
      via: "BEFORE INSERT OR UPDATE"
      pattern: "CREATE TRIGGER trig_tickets_geo"
    - from: "departments.defaultPerson_id"
      to: "people.id"
      via: "ALTER TABLE departments ADD CONSTRAINT fk_departments_default_person"
      pattern: "ALTER TABLE departments"

integration_contracts:
  requires: []
  provides:
    - artifact: "db/init/02-schema.sql"
      exports:
        - "contactMethods"
        - "departments"
        - "people"
        - "peopleEmails"
        - "peoplePhones"
        - "peopleAddresses"
        - "clients"
        - "substatus"
        - "categoryGroups"
        - "categories"
        - "actions"
        - "category_action_responses"
        - "department_actions"
        - "department_categories"
        - "issueTypes"
        - "locations"
        - "tickets"
        - "ticketHistory"
        - "media"
        - "bookmarks"
        - "geoclusters"
        - "ticket_geodata"
        - "responseTemplates"
        - "refresh_tokens"
        - "token_blacklist"
      shape: |
        24 PostgreSQL 16 tables with PostGIS GEOGRAPHY columns, GIN/GIST indexes,
        FTS and geo-sync triggers, SERIAL/BIGSERIAL PKs, all FK constraints as
        specified in TechArch Section 02 DDL.
      verify: |
        grep -n 'CREATE TABLE tickets' db/init/02-schema.sql &&
        grep -n 'search_vector' db/init/02-schema.sql &&
        grep -n 'trig_tickets_fts' db/init/02-schema.sql &&
        grep -n 'trig_tickets_geo' db/init/02-schema.sql &&
        grep -n 'GEOGRAPHY(POINT' db/init/02-schema.sql &&
        grep -n 'token_blacklist' db/init/02-schema.sql &&
        echo CONTRACT_OK
    - artifact: "db/init/03-seed.sql"
      exports:
        - "contactMethods rows (id 1-4)"
        - "issueTypes rows (id 1-6)"
        - "substatus rows (id 1-4)"
        - "actions rows (id 1-10)"
      shape: |
        INSERT rows with explicit IDs and setval() calls to reset sequences.
        Backend waves depend on system IDs being stable (e.g., action id=1 is 'open').
      verify: |
        grep -n "INSERT INTO contactMethods" db/init/03-seed.sql &&
        grep -n "INSERT INTO issueTypes" db/init/03-seed.sql &&
        grep -n "INSERT INTO substatus" db/init/03-seed.sql &&
        grep -n "INSERT INTO actions" db/init/03-seed.sql &&
        echo CONTRACT_OK
---

<objective>
Create the complete PostgreSQL 16 database schema that is the universal foundation for all 9
build waves. Produce three SQL init scripts consumed by the `postgis/postgis:16-3.4` Docker
container via `./db/init/docker-entrypoint-initdb.d` volume mount.

Purpose: Every backend and frontend wave depends on this schema existing exactly as specified.
No backend entity, repository, or service can compile or run correctly without the correct
table names, column names, types, FKs, and seed data produced here.

Output:
- `db/init/01-extensions.sql` — postgis + pgcrypto extensions
- `db/init/02-schema.sql` — all 24 tables, all indexes, FTS trigger, geo-sync trigger
- `db/init/03-seed.sql` — contactMethods, issueTypes, substatus, actions seed rows
</objective>

<feature_dependencies>
Implements: F0–F20: All 21 features — the database schema is the universal foundation.
Every table, trigger, and seed row directly supports one or more PRD features.
Depends on: None (Wave 1 root — no prior plans)
Enables: F0 (tickets table), F1 (ticketHistory, actions), F2 (categories, clients, media),
F3 (people.role), F4 (refresh_tokens, token_blacklist), F5 (people, peopleEmails/Phones/Addresses),
F6 (departments, department_actions/categories), F7 (categories, categoryGroups),
F8 (substatus), F9 (actions, category_action_responses), F10 (media),
F11 (tickets.search_vector GIN index + FTS trigger), F12 (bookmarks),
F13 (clients with api_key_hash + api_key_lookup), F14 (contactMethods),
F15 (locations, geoclusters, ticket_geodata with GEOGRAPHY columns),
F16 (ticketHistory.sentNotifications, categories.autoCloseIsActive/slaDays,
     peopleEmails.usedForNotifications),
F17 (tickets, ticketHistory, categories),
F18 (cross-cutting — no dedicated table, enabled by schema completeness),
F19 (issueTypes), F20 (responseTemplates)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/implement-the-full-ureport-modernization/WAVE-SCHEDULE.md
@project_specs/TechArch-uReport.md   (Section 02: Data Model — PostgreSQL 16 DDL — primary source)
@project_specs/PRD-uReport.md        (Feature definitions F0–F20)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create db/init directory and extension script</name>
  <files>db/init/01-extensions.sql</files>
  <action>
Create the directory `db/init/` at the repository root (this is the directory mounted as
`./db/init:/docker-entrypoint-initdb.d` in docker-compose.yml per TechArch Section 00).

Create `db/init/01-extensions.sql` with the following content EXACTLY as specified in
TechArch Section 02 — no additions, no removals:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

The file name `01-extensions.sql` ensures PostgreSQL runs it first (alphabetical init order).
  </action>
  <verify>
ls db/init/01-extensions.sql && cat db/init/01-extensions.sql | grep -c 'CREATE EXTENSION' | grep -q 2 && echo OK
  </verify>
  <done>
File db/init/01-extensions.sql exists and contains exactly two CREATE EXTENSION lines for
postgis and pgcrypto.
  </done>
</task>

<feature_dependencies>
Implements: F11 (PostGIS enables geo_point GEOGRAPHY(POINT,4326) on tickets + locations),
F15 (PostGIS ST_DWithin radius queries, GIST spatial indexes on geoclusters and ticket_geodata),
F4 (pgcrypto enables gen_random_uuid() for refresh_tokens.id UUID PK)
Depends on: None
Enables: All tables that use GEOGRAPHY columns or UUID generation
</feature_dependencies>

<task type="auto">
  <name>Task 2: Write complete PostgreSQL schema DDL (all 24 tables + triggers + indexes)</name>
  <files>db/init/02-schema.sql</files>
  <action>
Create `db/init/02-schema.sql` containing ALL 24 tables in the exact FK-dependency creation
order from TechArch Section 02, with all indexes, constraints, and triggers verbatim.

CRITICAL: Copy every column name, type, constraint, and index EXACTLY from TechArch Section 02.
Do NOT abstract, rename, or simplify any spec. Backend JPA entities in Wave 2 map field names
directly to these column names. Any deviation breaks compilation.

**Creation order (per TechArch "DDL Creation Order"):**
1→contactMethods 2→departments 3→people 4→ALTER TABLE departments (FK to people)
5→peopleEmails/peoplePhones/peopleAddresses 6→clients 7→substatus 8→categoryGroups
9→categories 10→actions 11→category_action_responses 12→department_actions
13→department_categories 14→issueTypes 15→locations 16→tickets
17→ticketHistory 18→media 19→bookmarks 20→geoclusters 21→ticket_geodata
22→responseTemplates 23→refresh_tokens 24→token_blacklist

---

### 1. contactMethods

```sql
CREATE TABLE contactMethods (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    isSystem    BOOLEAN         NOT NULL DEFAULT false,
    CONSTRAINT uq_contact_methods_name UNIQUE (name)
);
```

### 2. departments

```sql
CREATE TABLE departments (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100)    NOT NULL,
    defaultPerson_id    INTEGER,        -- FK added after people (see ALTER below)
    CONSTRAINT uq_departments_name UNIQUE (name)
);
```

### 3. people

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

### 4. peopleEmails

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

### 5. peoplePhones

```sql
CREATE TABLE peoplePhones (
    id          SERIAL PRIMARY KEY,
    person_id   INTEGER         NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    number      VARCHAR(30)     NOT NULL,
    label       VARCHAR(50)     -- 'Main', 'Mobile', 'Work', 'Home', 'Fax', 'Pager', 'Other'
);

CREATE INDEX idx_people_phones_person ON peoplePhones (person_id);
```

### 6. peopleAddresses

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

### 7. clients

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

### 8. substatus

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
```

### 9. categoryGroups

```sql
CREATE TABLE categoryGroups (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    ordering    INTEGER         NOT NULL DEFAULT 0
);

CREATE INDEX idx_category_groups_ordering ON categoryGroups (ordering);
```

### 10. categories

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

### 11. actions

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
```

### 12. category_action_responses

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

### 13. department_actions

```sql
CREATE TABLE department_actions (
    department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    action_id       INTEGER NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    PRIMARY KEY (department_id, action_id)
);
```

### 14. department_categories

```sql
CREATE TABLE department_categories (
    department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (department_id, category_id)
);
```

### 15. issueTypes

```sql
CREATE TABLE issueTypes (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    isSystem    BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_issue_types_name UNIQUE (name)
);
```

### 16. locations

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

### 17. tickets

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

### 18. ticketHistory

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

### 19. media

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

### 20. bookmarks

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

### 21. geoclusters

```sql
CREATE TABLE geoclusters (
    id      BIGSERIAL PRIMARY KEY,
    level   SMALLINT               NOT NULL CHECK (level BETWEEN 0 AND 6),
    center  GEOGRAPHY(POINT, 4326) NOT NULL
);

CREATE INDEX idx_geoclusters_level  ON geoclusters (level);
CREATE INDEX idx_geoclusters_center ON geoclusters USING GIST (center);
```

### 22. ticket_geodata

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

### 23. responseTemplates

```sql
CREATE TABLE responseTemplates (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200)    NOT NULL,
    template    TEXT            NOT NULL,
    action_id   INTEGER         REFERENCES actions(id) ON DELETE SET NULL
);

CREATE INDEX idx_response_templates_action ON responseTemplates (action_id);
```

### 24. refresh_tokens

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

### 25. token_blacklist

```sql
CREATE TABLE token_blacklist (
    jti         VARCHAR(36)  PRIMARY KEY,
    expiresAt   TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_token_blacklist_expiry ON token_blacklist (expiresAt);
```
  </action>
  <verify>
grep -c 'CREATE TABLE' db/init/02-schema.sql &&
grep -n 'trig_tickets_fts' db/init/02-schema.sql &&
grep -n 'trig_tickets_geo' db/init/02-schema.sql &&
grep -n 'GEOGRAPHY(POINT' db/init/02-schema.sql &&
grep -n 'token_blacklist' db/init/02-schema.sql &&
grep -n 'search_vector' db/init/02-schema.sql &&
grep -n 'ALTER TABLE departments' db/init/02-schema.sql &&
echo ALL_SCHEMA_CHECKS_PASSED
  </verify>
  <done>
db/init/02-schema.sql exists. Contains:
- All 24 CREATE TABLE statements with exact column definitions from TechArch Section 02
- ALTER TABLE departments ADD CONSTRAINT fk_departments_default_person (circular FK resolution)
- tickets_fts_update() trigger function and trig_tickets_fts trigger
- tickets_geo_sync() trigger function and trig_tickets_geo trigger
- GEOGRAPHY(POINT, 4326) columns on tickets and locations and geoclusters
- GIN index on tickets.search_vector, GIST indexes on geo columns
- All scalar indexes, FK constraints, CHECK constraints, UNIQUE constraints
  </done>
</task>

<feature_dependencies>
Implements: F0 (tickets table with all fields), F1 (ticketHistory + actions tables),
F2 (categories, categoryGroups, clients, media tables — Open311 surface),
F3 (people.role CHECK('staff','public','anonymous')),
F4 (refresh_tokens, token_blacklist, people.username/passwordHash),
F5 (people, peopleEmails, peoplePhones, peopleAddresses),
F6 (departments, department_actions, department_categories),
F7 (categories with customFields JSONB, slaDays, autoCloseIsActive, categoryGroups),
F8 (substatus table with status CHECK and isDefault),
F9 (actions, category_action_responses, department_actions),
F10 (media table with UNIQUE internalFilename),
F11 (tickets.search_vector TSVECTOR + GIN index + tickets_fts_update() trigger),
F12 (bookmarks table),
F13 (clients.api_key_hash + api_key_lookup UNIQUE),
F14 (contactMethods table — referenced by tickets.contactMethod_id and responseMethod_id),
F15 (locations, geoclusters GEOGRAPHY, ticket_geodata cluster_id_0..6, tickets_geo_sync trigger),
F16 (ticketHistory.sentNotifications, categories.notificationReplyEmail/autoCloseIsActive/slaDays,
     peopleEmails.usedForNotifications),
F17 (tickets, ticketHistory, categories — metrics/reports surface),
F19 (issueTypes table),
F20 (responseTemplates table)
Depends on: Task 1 (extensions must be installed before GEOGRAPHY columns can be created)
Enables: All Wave 2a–2d backend waves, all Wave 3a–3c frontend waves
</feature_dependencies>

<task type="auto">
  <name>Task 3: Write seed data SQL for system lookup tables</name>
  <files>db/init/03-seed.sql</files>
  <action>
Create `db/init/03-seed.sql` with ALL seed INSERT statements exactly as specified in
TechArch Section 02. These rows have hard-coded IDs because backend services reference
them by stable ID (e.g., action id=1 is always 'open', substatus id=1 is always 'Open').

Copy VERBATIM from TechArch Section 02:

```sql
-- contactMethods seed (F14)
INSERT INTO contactMethods (id, name, isSystem) VALUES
    (1, 'Email',    true),
    (2, 'Phone',    true),
    (3, 'Web Form', true),
    (4, 'Other',    true);
SELECT setval('contactmethods_id_seq', 4);

-- issueTypes seed (F19)
INSERT INTO issueTypes (id, name, isSystem) VALUES
    (1, 'Comment',   true),
    (2, 'Complaint', true),
    (3, 'Question',  true),
    (4, 'Report',    true),
    (5, 'Request',   true),
    (6, 'Violation', true);
SELECT setval('issuetypes_id_seq', 6);

-- substatus seed (F8)
INSERT INTO substatus (id, name, description, status, isDefault, isSystem) VALUES
    (1, 'Open',      'Ticket is open',                  'open',   true,  true),
    (2, 'Resolved',  'Issue has been resolved',          'closed', true,  true),
    (3, 'Duplicate', 'Ticket is a duplicate of another', 'closed', false, true),
    (4, 'Bogus',     'Ticket was invalid or bogus',      'closed', false, true);
SELECT setval('substatus_id_seq', 4);

-- actions seed (F9, F1)
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

The file name `03-seed.sql` ensures PostgreSQL runs it after `02-schema.sql`.
  </action>
  <verify>
grep -n "INSERT INTO contactMethods" db/init/03-seed.sql &&
grep -n "INSERT INTO issueTypes" db/init/03-seed.sql &&
grep -n "INSERT INTO substatus" db/init/03-seed.sql &&
grep -n "INSERT INTO actions" db/init/03-seed.sql &&
grep -c "setval" db/init/03-seed.sql | grep -q 4 &&
echo SEED_CHECKS_PASSED
  </verify>
  <done>
db/init/03-seed.sql exists and contains:
- 4 contactMethods rows (Email/Phone/Web Form/Other) with setval reset to 4
- 6 issueTypes rows (Comment/Complaint/Question/Report/Request/Violation) with setval reset to 6
- 4 substatus rows (Open/Resolved/Duplicate/Bogus) with isDefault/isSystem flags, setval reset to 4
- 10 actions rows (open/assignment/closed/changeCategory/changeLocation/response/
  duplicate/update/comment/upload_media) with template strings, setval reset to 10
  </done>
</task>

<feature_dependencies>
Implements: F8 (substatus seed — Open(1), Resolved(2), Duplicate(3), Bogus(4)),
F9 (actions seed — 10 system action types with template variable strings),
F14 (contactMethods seed — Email(1), Phone(2), Web Form(3), Other(4)),
F19 (issueTypes seed — Comment(1)..Violation(6))
Depends on: Task 2 (tables must exist before seed inserts can run)
Enables: All backend services that reference system IDs by stable integer value
(TicketService references action id=1 for 'open', substatus id=1 for default open state, etc.)
</feature_dependencies>

</tasks>

<verification>
After all three tasks complete:

1. Verify file structure:
```bash
ls -la db/init/
# Expected: 01-extensions.sql, 02-schema.sql, 03-seed.sql
```

2. Verify table count in schema:
```bash
grep -c 'CREATE TABLE' db/init/02-schema.sql
# Expected: 24
```

3. Verify triggers present:
```bash
grep -E 'trig_tickets_fts|trig_tickets_geo' db/init/02-schema.sql
# Expected: 2 lines (CREATE TRIGGER statements)
```

4. Verify all seed tables covered:
```bash
grep -E 'INSERT INTO (contactMethods|issueTypes|substatus|actions)' db/init/03-seed.sql
# Expected: 4 matches
```

5. Docker smoke test (if Docker available):
```bash
docker run --rm -e POSTGRES_DB=ureport -e POSTGRES_USER=ureport -e POSTGRES_PASSWORD=test \
  -v "$(pwd)/db/init:/docker-entrypoint-initdb.d" \
  postgis/postgis:16-3.4 \
  postgres --version && echo DOCKER_SMOKE_OK
```
</verification>

<success_criteria>
- db/init/ directory contains exactly 3 SQL files (01, 02, 03)
- 02-schema.sql defines 24 CREATE TABLE statements in FK-safe order
- tickets table has: search_vector TSVECTOR, geo_point GEOGRAPHY(POINT, 4326),
  BIGSERIAL PK, 25 columns total as specified in TechArch
- FTS trigger (trig_tickets_fts) and geo-sync trigger (trig_tickets_geo) present
- departments-people circular FK resolved via ALTER TABLE after people is created
- refresh_tokens.id is UUID PRIMARY KEY DEFAULT gen_random_uuid() (requires pgcrypto)
- 03-seed.sql seeds 4 contactMethods, 6 issueTypes, 4 substatuses, 10 actions with
  correct IDs and setval() sequence resets
- All 4 integration_contracts.provides.verify commands exit 0
</success_criteria>

<output>
After completion, create `.planning/express/implement-the-full-ureport-modernization/01-SUMMARY.md`
summarizing:
- Files created: db/init/01-extensions.sql, db/init/02-schema.sql, db/init/03-seed.sql
- Table count: 24 tables
- Seed rows: 4 contactMethods, 6 issueTypes, 4 substatuses, 10 actions
- Triggers: trig_tickets_fts, trig_tickets_geo
- Extensions: postgis, pgcrypto
- Any deviations from spec (should be none)
</output>
