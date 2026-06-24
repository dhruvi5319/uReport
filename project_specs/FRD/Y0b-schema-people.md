---

## Y0b: Database Schema — People, Clients, Contact Methods, Departments

---

### contactMethods

```sql
CREATE TABLE contactMethods (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    isSystem    BOOLEAN         NOT NULL DEFAULT false,
    CONSTRAINT uq_contact_methods_name UNIQUE (name)
);

-- Seed data (stable IDs)
INSERT INTO contactMethods (id, name, isSystem) VALUES
    (1, 'Email',    true),
    (2, 'Phone',    true),
    (3, 'Web Form', true),
    (4, 'Other',    true);
SELECT setval('contactmethods_id_seq', 4);
```

---

### departments

```sql
CREATE TABLE departments (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100)    NOT NULL,
    defaultPerson_id    INTEGER,        -- FK added after people table (see below)
    CONSTRAINT uq_departments_name UNIQUE (name)
);
```

---

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

-- Add FK from departments to people (post-creation to avoid circular dependency)
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_default_person
    FOREIGN KEY (defaultPerson_id) REFERENCES people(id) ON DELETE SET NULL;

CREATE INDEX idx_people_department  ON people (department_id);
CREATE INDEX idx_people_role        ON people (role);
CREATE INDEX idx_people_username    ON people (username);
CREATE INDEX idx_people_name        ON people (lastname, firstname);
CREATE INDEX idx_people_deleted     ON people (deletedAt) WHERE deletedAt IS NULL;
```

---

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

---

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

---

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

---

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

### department_actions

```sql
CREATE TABLE department_actions (
    department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    action_id       INTEGER NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    PRIMARY KEY (department_id, action_id)
);
```

---

### department_categories

```sql
CREATE TABLE department_categories (
    department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (department_id, category_id)
);
```

---

### Notes

- `people.deletedAt`: Soft-delete pattern. Application filters `WHERE deletedAt IS NULL` for active people. Physical delete blocked by FK constraints.
- `clients.api_key_hash` stores BCrypt-hashed raw key (for secure comparison). `clients.api_key_lookup` stores SHA-256(raw_key) for indexed fast lookup (raw key never stored).
- `departments.defaultPerson_id` FK is added after `people` to avoid a circular dependency at DDL time.
- `department_actions` and `department_categories` are explicit join tables preserving the MySQL many-to-many relationships.
