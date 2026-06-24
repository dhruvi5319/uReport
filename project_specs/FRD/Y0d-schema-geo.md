---

## Y0d: Database Schema — Geo, Locations, and Miscellaneous

---

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

---

### geoclusters

```sql
CREATE TABLE geoclusters (
    id      BIGSERIAL PRIMARY KEY,
    level   SMALLINT            NOT NULL CHECK (level BETWEEN 0 AND 6),
    center  GEOGRAPHY(POINT, 4326) NOT NULL
);

CREATE INDEX idx_geoclusters_level  ON geoclusters (level);
CREATE INDEX idx_geoclusters_center ON geoclusters USING GIST (center);
```

---

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

### responseTemplates

```sql
-- (Also declared in Y0a for reference; canonical DDL here)
CREATE TABLE IF NOT EXISTS responseTemplates (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200)    NOT NULL,
    template    TEXT            NOT NULL,
    action_id   INTEGER         REFERENCES actions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_response_templates_action ON responseTemplates (action_id);
```

---

### DDL Dependency Order

The tables must be created in this order to satisfy FK constraints:

1. `contactMethods`
2. `departments` (without FK to people initially)
3. `people` (references departments)
4. `ALTER TABLE departments ADD CONSTRAINT ... FOREIGN KEY (defaultPerson_id) REFERENCES people`
5. `peopleEmails`, `peoplePhones`, `peopleAddresses` (reference people)
6. `clients` (references people, contactMethods)
7. `substatus`
8. `categoryGroups`
9. `categories` (references departments, people, categoryGroups, substatus)
10. `actions`
11. `category_action_responses` (references categories, actions)
12. `department_actions` (references departments, actions)
13. `department_categories` (references departments, categories)
14. `issueTypes`
15. `locations`
16. `tickets` (references categories, people, clients, contactMethods, locations, substatus, issueTypes)
17. `ticketHistory` (references tickets, people, actions)
18. `media` (references tickets, people)
19. `bookmarks` (references people)
20. `geoclusters`
21. `ticket_geodata` (references tickets, geoclusters)
22. `responseTemplates` (references actions)
23. `refresh_tokens` (references people)
24. `token_blacklist` (no FKs)

---

### Migration Notes (MySQL → PostgreSQL)

- All `INT AUTO_INCREMENT` PKs become `SERIAL` (or `BIGSERIAL` for high-volume tables).
- MySQL `ENUM` types become `VARCHAR(n) CHECK (value IN (...))` for portability.
- MySQL `TINYINT(1)` booleans become PostgreSQL `BOOLEAN`.
- MySQL `DATETIME` becomes `TIMESTAMPTZ` (timezone-aware).
- MySQL `JSON` becomes `JSONB` (binary JSON with GIN index support).
- MySQL spatial `POINT` becomes PostGIS `GEOGRAPHY(POINT, 4326)`.
- MySQL `TEXT` stays `TEXT`.
- All `FOREIGN KEY ... ON DELETE` behaviors are preserved.
- Sequence values must be reset after data migration: `SELECT setval('tablename_id_seq', (SELECT MAX(id) FROM tablename))` for each table.
