---

## Y0a: Database Schema — Core Tickets, History, Media, Auth, and Lookup Tables

**PostgreSQL 16 DDL. All timestamps are `TIMESTAMPTZ`. UUIDs use `gen_random_uuid()`. PostGIS extension required for geography columns.**

---

### Extensions

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

---

### issueTypes

```sql
CREATE TABLE issueTypes (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    isSystem    BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_issue_types_name UNIQUE (name)
);

-- Seed data
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

-- Indexes
CREATE INDEX idx_tickets_status        ON tickets (status);
CREATE INDEX idx_tickets_category      ON tickets (category_id);
CREATE INDEX idx_tickets_assignedPerson ON tickets (assignedPerson_id);
CREATE INDEX idx_tickets_reportedBy    ON tickets (reportedByPerson_id);
CREATE INDEX idx_tickets_enteredDate   ON tickets (enteredDate);
CREATE INDEX idx_tickets_closedDate    ON tickets (closedDate);
CREATE INDEX idx_tickets_lastModified  ON tickets (lastModified);
CREATE INDEX idx_tickets_substatus     ON tickets (substatus_id);
CREATE INDEX idx_tickets_client        ON tickets (client_id);
CREATE INDEX idx_tickets_parent        ON tickets (parent_id);
CREATE INDEX idx_tickets_fts           ON tickets USING GIN (search_vector);
CREATE INDEX idx_tickets_geo           ON tickets USING GIST (geo_point);

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

---

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

---

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

---

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

---

### token_blacklist

```sql
CREATE TABLE token_blacklist (
    jti         VARCHAR(36)  PRIMARY KEY,
    expiresAt   TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_token_blacklist_expiry ON token_blacklist (expiresAt);
```

---

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

### Notes on MySQL → PostgreSQL Mapping

| MySQL Type | PostgreSQL Equivalent | Notes |
|------------|----------------------|-------|
| `INT AUTO_INCREMENT` | `SERIAL` or `BIGSERIAL` | Use BIGSERIAL for high-volume tables (tickets, ticketHistory, media) |
| `ENUM('open','closed')` | `VARCHAR(20) CHECK (... IN (...))` | PostgreSQL ENUMs exist but CHECK constraints are more portable |
| `TEXT` | `TEXT` | Identical |
| `TINYINT(1)` | `BOOLEAN` | MySQL boolean equivalent |
| `DATETIME` | `TIMESTAMPTZ` | Always use timezone-aware timestamps |
| `JSON` | `JSONB` | PostgreSQL JSONB for indexable JSON |
| `POINT` (MySQL spatial) | `GEOGRAPHY(POINT, 4326)` (PostGIS) | Requires PostGIS extension |
| `VARCHAR(n)` | `VARCHAR(n)` | Identical |
| `FLOAT` / `DOUBLE` | `NUMERIC(9,6)` | Fixed precision for coordinates |
