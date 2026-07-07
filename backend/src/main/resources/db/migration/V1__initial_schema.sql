-- uReport CRM - Initial PostgreSQL Schema
-- Migrated from MySQL schema; snake_case column names per TechArch §3.4

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(128) NOT NULL,
    default_person_id   BIGINT
);

-- People
CREATE TABLE IF NOT EXISTS people (
    id            BIGSERIAL PRIMARY KEY,
    firstname     VARCHAR(128),
    middlename    VARCHAR(128),
    lastname      VARCHAR(128),
    organization  VARCHAR(128),
    address       VARCHAR(128),
    city          VARCHAR(128),
    state         VARCHAR(128),
    zip           VARCHAR(20),
    department_id BIGINT REFERENCES departments(id),
    username      VARCHAR(40) UNIQUE,
    email         VARCHAR(255),
    phone         VARCHAR(50),
    role          VARCHAR(30),
    password_hash VARCHAR(255)
);

-- Contact Methods
CREATE TABLE IF NOT EXISTS contact_methods (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL
);
INSERT INTO contact_methods (name) VALUES ('Email') ON CONFLICT DO NOTHING;
INSERT INTO contact_methods (name) VALUES ('Phone') ON CONFLICT DO NOTHING;
INSERT INTO contact_methods (name) VALUES ('Web Form') ON CONFLICT DO NOTHING;
INSERT INTO contact_methods (name) VALUES ('Other') ON CONFLICT DO NOTHING;

-- Clients (Open311 API keys)
CREATE TABLE IF NOT EXISTS clients (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(128) NOT NULL,
    url                 VARCHAR(255),
    api_key             VARCHAR(50) NOT NULL,
    contact_person_id   BIGINT REFERENCES people(id),
    contact_method_id   BIGINT REFERENCES contact_methods(id)
);

-- Substatus
CREATE TABLE IF NOT EXISTS substatus (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(25) NOT NULL,
    description VARCHAR(128) NOT NULL,
    status      VARCHAR(10) NOT NULL DEFAULT 'open',
    is_default  BOOLEAN NOT NULL DEFAULT FALSE
);
INSERT INTO substatus (status, name, description) VALUES ('closed', 'Resolved', 'This ticket has been taken care of') ON CONFLICT DO NOTHING;
INSERT INTO substatus (status, name, description) VALUES ('closed', 'Duplicate', 'This ticket is a duplicate of another ticket') ON CONFLICT DO NOTHING;
INSERT INTO substatus (status, name, description) VALUES ('closed', 'Bogus', 'This ticket is not actually a problem or has already been taken care of') ON CONFLICT DO NOTHING;

-- Actions
CREATE TABLE IF NOT EXISTS actions (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(25) NOT NULL,
    description VARCHAR(128) NOT NULL,
    type        VARCHAR(20) NOT NULL DEFAULT 'department',
    template    TEXT,
    reply_email VARCHAR(128)
);
INSERT INTO actions (name, type, description) VALUES ('open',           'system', 'Opened by {actionPerson}') ON CONFLICT DO NOTHING;
INSERT INTO actions (name, type, description) VALUES ('assignment',     'system', '{enteredByPerson} assigned this case to {actionPerson}') ON CONFLICT DO NOTHING;
INSERT INTO actions (name, type, description) VALUES ('closed',         'system', 'Closed by {actionPerson}') ON CONFLICT DO NOTHING;
INSERT INTO actions (name, type, description) VALUES ('changeCategory', 'system', 'Changed category from {original:category_id} to {updated:category_id}') ON CONFLICT DO NOTHING;
INSERT INTO actions (name, type, description) VALUES ('changeLocation', 'system', 'Changed location from {original:location} to {updated:location}') ON CONFLICT DO NOTHING;
INSERT INTO actions (name, type, description) VALUES ('response',       'system', '{actionPerson} contacted {reportedByPerson_id}') ON CONFLICT DO NOTHING;
INSERT INTO actions (name, type, description) VALUES ('duplicate',      'system', '{duplicate:ticket_id} marked as a duplicate of this case.') ON CONFLICT DO NOTHING;
INSERT INTO actions (name, type, description) VALUES ('update',         'system', '{enteredByPerson} updated this case.') ON CONFLICT DO NOTHING;
INSERT INTO actions (name, type, description) VALUES ('comment',        'system', '{enteredByPerson} commented on this case.') ON CONFLICT DO NOTHING;
INSERT INTO actions (name, type, description) VALUES ('upload_media',   'system', '{enteredByPerson} uploaded an attachment.') ON CONFLICT DO NOTHING;

-- Category Groups
CREATE TABLE IF NOT EXISTS category_groups (
    id       BIGSERIAL PRIMARY KEY,
    name     VARCHAR(50) NOT NULL,
    ordering SMALLINT
);
INSERT INTO category_groups (name) VALUES ('Streets') ON CONFLICT DO NOTHING;
INSERT INTO category_groups (name) VALUES ('Sanitation') ON CONFLICT DO NOTHING;
INSERT INTO category_groups (name) VALUES ('Other') ON CONFLICT DO NOTHING;

-- Issue Types
CREATE TABLE IF NOT EXISTS issue_types (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL
);
INSERT INTO issue_types (name) VALUES ('Comment')   ON CONFLICT DO NOTHING;
INSERT INTO issue_types (name) VALUES ('Complaint')  ON CONFLICT DO NOTHING;
INSERT INTO issue_types (name) VALUES ('Question')   ON CONFLICT DO NOTHING;
INSERT INTO issue_types (name) VALUES ('Report')     ON CONFLICT DO NOTHING;
INSERT INTO issue_types (name) VALUES ('Request')    ON CONFLICT DO NOTHING;
INSERT INTO issue_types (name) VALUES ('Violation')  ON CONFLICT DO NOTHING;

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id                        BIGSERIAL PRIMARY KEY,
    name                      VARCHAR(50) NOT NULL,
    description               VARCHAR(512),
    department_id             BIGINT NOT NULL REFERENCES departments(id),
    default_person_id         BIGINT REFERENCES people(id),
    category_group_id         BIGINT REFERENCES category_groups(id),
    active                    BOOLEAN,
    featured                  BOOLEAN,
    display_permission_level  VARCHAR(20) NOT NULL DEFAULT 'staff',
    posting_permission_level  VARCHAR(20) NOT NULL DEFAULT 'staff',
    custom_fields             TEXT,
    last_modified             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sla_days                  INTEGER,
    notification_reply_email  VARCHAR(128),
    auto_close_is_active      BOOLEAN,
    auto_close_substatus_id   BIGINT REFERENCES substatus(id)
);

-- Department Actions
CREATE TABLE IF NOT EXISTS department_actions (
    department_id BIGINT NOT NULL REFERENCES departments(id),
    action_id     BIGINT NOT NULL REFERENCES actions(id),
    PRIMARY KEY (department_id, action_id)
);

-- Department Categories
CREATE TABLE IF NOT EXISTS department_categories (
    department_id BIGINT NOT NULL REFERENCES departments(id),
    category_id   BIGINT NOT NULL REFERENCES categories(id),
    PRIMARY KEY (department_id, category_id)
);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
    id                    BIGSERIAL PRIMARY KEY,
    parent_id             BIGINT REFERENCES tickets(id),
    category_id           BIGINT REFERENCES categories(id),
    issue_type_id         BIGINT REFERENCES issue_types(id),
    client_id             BIGINT REFERENCES clients(id),
    entered_by_person_id  BIGINT REFERENCES people(id),
    reported_by_person_id BIGINT REFERENCES people(id),
    assigned_person_id    BIGINT REFERENCES people(id),
    contact_method_id     BIGINT REFERENCES contact_methods(id),
    substatus_id          BIGINT REFERENCES substatus(id),
    entered_date          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    address_id            VARCHAR(50),
    latitude              DOUBLE PRECISION,
    longitude             DOUBLE PRECISION,
    location              VARCHAR(128),
    city                  VARCHAR(128),
    state                 VARCHAR(128),
    zip                   VARCHAR(40),
    status                VARCHAR(20) NOT NULL DEFAULT 'open',
    closed_date           TIMESTAMP,
    additional_fields     VARCHAR(255),
    custom_fields         TEXT,
    description           TEXT
);

-- Ticket History
CREATE TABLE IF NOT EXISTS ticket_history (
    id                    BIGSERIAL PRIMARY KEY,
    ticket_id             BIGINT NOT NULL REFERENCES tickets(id),
    entered_by_person_id  BIGINT REFERENCES people(id),
    action_person_id      BIGINT REFERENCES people(id),
    action_id             BIGINT NOT NULL REFERENCES actions(id),
    entered_date          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action_date           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes                 TEXT,
    data                  TEXT,
    sent_notifications    TEXT
);

-- Media
CREATE TABLE IF NOT EXISTS media (
    id                BIGSERIAL PRIMARY KEY,
    ticket_id         BIGINT NOT NULL REFERENCES tickets(id),
    filename          VARCHAR(128) NOT NULL,
    internal_filename VARCHAR(50) NOT NULL,
    mime_type         VARCHAR(128),
    uploaded          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    person_id         BIGINT REFERENCES people(id)
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
    id          BIGSERIAL PRIMARY KEY,
    person_id   BIGINT NOT NULL REFERENCES people(id),
    type        VARCHAR(128) NOT NULL DEFAULT 'search',
    name        VARCHAR(128),
    request_uri VARCHAR(1024) NOT NULL
);
