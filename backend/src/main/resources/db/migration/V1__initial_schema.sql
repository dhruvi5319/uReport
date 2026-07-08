-- CONTACT METHODS
CREATE TABLE contact_methods (
    id   BIGSERIAL       PRIMARY KEY,
    name VARCHAR(128) NOT NULL
);
INSERT INTO contact_methods (name) VALUES ('Email'), ('Phone'), ('Web Form'), ('Other');

-- SUBSTATUS
CREATE TABLE substatus (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(128) NOT NULL,
    description VARCHAR(128),
    status      VARCHAR(10)  NOT NULL DEFAULT 'open'
                             CHECK (status IN ('open', 'closed')),
    is_default  BOOLEAN      NOT NULL DEFAULT FALSE
);
INSERT INTO substatus (status, name, description) VALUES
    ('closed', 'Resolved',  'This ticket has been taken care of'),
    ('closed', 'Duplicate', 'This ticket is a duplicate of another ticket'),
    ('closed', 'Bogus',     'This ticket is not actually a problem or has already been taken care of');

-- ACTIONS
CREATE TABLE actions (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(128) NOT NULL,
    description VARCHAR(128),
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

-- ISSUE TYPES
CREATE TABLE issue_types (
    id   BIGSERIAL       PRIMARY KEY,
    name VARCHAR(128) NOT NULL
);
INSERT INTO issue_types (name) VALUES
    ('Comment'), ('Complaint'), ('Question'), ('Report'), ('Request'), ('Violation');

-- CATEGORY GROUPS
CREATE TABLE category_groups (
    id       BIGSERIAL      PRIMARY KEY,
    name     VARCHAR(50) NOT NULL,
    ordering SMALLINT
);
INSERT INTO category_groups (name) VALUES ('Streets'), ('Sanitation'), ('Other');

-- DEPARTMENTS (forward-declared; FK to people added after)
CREATE TABLE departments (
    id                BIGSERIAL       PRIMARY KEY,
    name              VARCHAR(128) NOT NULL,
    default_person_id BIGINT
);

-- PEOPLE
CREATE TABLE people (
    id            BIGSERIAL       PRIMARY KEY,
    firstname     VARCHAR(128),
    middlename    VARCHAR(128),
    lastname      VARCHAR(128),
    organization  VARCHAR(128),
    address       VARCHAR(128),
    city          VARCHAR(128),
    state         VARCHAR(128),
    zip           VARCHAR(20),
    department_id   BIGINT      REFERENCES departments(id),
    username        VARCHAR(40)  UNIQUE,
    email           VARCHAR(255),
    phone           VARCHAR(40),
    password_hash   VARCHAR(255),
    role            VARCHAR(30)
                    CHECK (role IN ('admin', 'staff', 'public') OR role IS NULL)
);

ALTER TABLE departments
    ADD CONSTRAINT fk_departments_default_person
    FOREIGN KEY (default_person_id) REFERENCES people(id);

CREATE INDEX idx_people_department_id ON people(department_id);
CREATE INDEX idx_people_username      ON people(username);
CREATE INDEX idx_people_lastname      ON people(lastname);

-- PEOPLE EMAILS
CREATE TABLE people_emails (
    id                     BIGSERIAL       PRIMARY KEY,
    person_id              BIGINT      NOT NULL REFERENCES people(id),
    email                  VARCHAR(255) NOT NULL,
    label                  VARCHAR(10)  NOT NULL DEFAULT 'Other'
                           CHECK (label IN ('Home', 'Work', 'Other')),
    used_for_notifications BOOLEAN      NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_people_emails_person_id ON people_emails(person_id);
CREATE INDEX idx_people_emails_email     ON people_emails(email);

-- PEOPLE PHONES
CREATE TABLE people_phones (
    id        BIGSERIAL      PRIMARY KEY,
    person_id BIGINT     NOT NULL REFERENCES people(id),
    number    VARCHAR(20),
    label     VARCHAR(10) NOT NULL DEFAULT 'Other'
              CHECK (label IN ('Main', 'Mobile', 'Work', 'Home', 'Fax', 'Pager', 'Other'))
);
CREATE INDEX idx_people_phones_person_id ON people_phones(person_id);

-- PEOPLE ADDRESSES
CREATE TABLE people_addresses (
    id        BIGSERIAL       PRIMARY KEY,
    person_id BIGINT      NOT NULL REFERENCES people(id),
    address   VARCHAR(128) NOT NULL,
    city      VARCHAR(128),
    state     VARCHAR(128),
    zip       VARCHAR(20),
    label     VARCHAR(10)  NOT NULL DEFAULT 'Home'
              CHECK (label IN ('Home', 'Business', 'Rental'))
);
CREATE INDEX idx_people_addresses_person_id ON people_addresses(person_id);

-- CLIENTS
CREATE TABLE clients (
    id                BIGSERIAL       PRIMARY KEY,
    name              VARCHAR(128) NOT NULL,
    url               VARCHAR(255),
    api_key           VARCHAR(50)  NOT NULL UNIQUE,
    contact_person_id BIGINT      NOT NULL REFERENCES people(id),
    contact_method_id BIGINT      REFERENCES contact_methods(id)
);
CREATE INDEX idx_clients_api_key           ON clients(api_key);
CREATE INDEX idx_clients_contact_person_id ON clients(contact_person_id);

-- CATEGORIES
CREATE TABLE categories (
    id                       BIGSERIAL       PRIMARY KEY,
    name                     VARCHAR(50)  NOT NULL,
    description              VARCHAR(512),
    department_id            BIGINT      NOT NULL REFERENCES departments(id),
    default_person_id        BIGINT      REFERENCES people(id),
    category_group_id        BIGINT      REFERENCES category_groups(id),
    active                   BOOLEAN      NOT NULL DEFAULT TRUE,
    featured                 BOOLEAN      NOT NULL DEFAULT FALSE,
    display_permission_level VARCHAR(20)  NOT NULL DEFAULT 'staff'
                             CHECK (display_permission_level IN ('staff', 'public', 'anonymous')),
    posting_permission_level VARCHAR(20)  NOT NULL DEFAULT 'staff'
                             CHECK (posting_permission_level IN ('staff', 'public', 'anonymous')),
    custom_fields            TEXT,
    last_modified            TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sla_days                 INTEGER      CHECK (sla_days > 0),
    notification_reply_email VARCHAR(128),
    auto_close_is_active     BOOLEAN      NOT NULL DEFAULT FALSE,
    auto_close_substatus_id  BIGINT      REFERENCES substatus(id)
);
CREATE INDEX idx_categories_department_id     ON categories(department_id);
CREATE INDEX idx_categories_category_group_id ON categories(category_group_id);
CREATE INDEX idx_categories_default_person_id ON categories(default_person_id);
CREATE INDEX idx_categories_active            ON categories(active);

-- CATEGORY ACTION RESPONSES
CREATE TABLE category_action_responses (
    id          BIGSERIAL       PRIMARY KEY,
    category_id BIGINT      NOT NULL REFERENCES categories(id),
    action_id   BIGINT      NOT NULL REFERENCES actions(id),
    template    TEXT,
    reply_email VARCHAR(128)
);
CREATE INDEX idx_car_category_id ON category_action_responses(category_id);
CREATE INDEX idx_car_action_id   ON category_action_responses(action_id);

-- DEPARTMENT ACTIONS
CREATE TABLE department_actions (
    department_id BIGINT NOT NULL REFERENCES departments(id),
    action_id     BIGINT NOT NULL REFERENCES actions(id),
    PRIMARY KEY (department_id, action_id)
);

-- DEPARTMENT CATEGORIES
CREATE TABLE department_categories (
    department_id BIGINT NOT NULL REFERENCES departments(id),
    category_id   BIGINT NOT NULL REFERENCES categories(id),
    PRIMARY KEY (department_id, category_id)
);

-- TICKETS
CREATE TABLE tickets (
    id                    BIGSERIAL           PRIMARY KEY,
    parent_id             BIGINT          REFERENCES tickets(id),
    category_id           BIGINT          REFERENCES categories(id),
    issue_type_id         BIGINT          REFERENCES issue_types(id),
    client_id             BIGINT          REFERENCES clients(id),
    entered_by_person_id  BIGINT          REFERENCES people(id),
    reported_by_person_id BIGINT          REFERENCES people(id),
    assigned_person_id    BIGINT          REFERENCES people(id),
    contact_method_id     BIGINT          REFERENCES contact_methods(id),
    response_method_id    BIGINT          REFERENCES contact_methods(id),
    entered_date          TIMESTAMPTZ      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified         TIMESTAMPTZ      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    address_id            VARCHAR(256),
    latitude              DOUBLE PRECISION,
    longitude             DOUBLE PRECISION,
    location              VARCHAR(128),
    city                  VARCHAR(128),
    state                 VARCHAR(128),
    zip                   VARCHAR(40),
    status                VARCHAR(20)      NOT NULL DEFAULT 'open',
    closed_date           TIMESTAMPTZ,
    substatus_id          BIGINT          REFERENCES substatus(id),
    additional_fields     VARCHAR(255),
    custom_fields         TEXT,
    description           TEXT
);
CREATE INDEX idx_tickets_category_id            ON tickets(category_id);
CREATE INDEX idx_tickets_assigned_person_id     ON tickets(assigned_person_id);
CREATE INDEX idx_tickets_reported_by_person_id  ON tickets(reported_by_person_id);
CREATE INDEX idx_tickets_entered_by_person_id   ON tickets(entered_by_person_id);
CREATE INDEX idx_tickets_status                 ON tickets(status);
CREATE INDEX idx_tickets_entered_date           ON tickets(entered_date DESC);
CREATE INDEX idx_tickets_substatus_id           ON tickets(substatus_id);
CREATE INDEX idx_tickets_parent_id              ON tickets(parent_id);
CREATE INDEX idx_tickets_client_id              ON tickets(client_id);

-- TICKET HISTORY
CREATE TABLE ticket_history (
    id                   BIGSERIAL      PRIMARY KEY,
    ticket_id            BIGINT     NOT NULL REFERENCES tickets(id),
    entered_by_person_id BIGINT     REFERENCES people(id),
    action_person_id     BIGINT     REFERENCES people(id),
    action_id            BIGINT     NOT NULL REFERENCES actions(id),
    entered_date         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action_date          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes                TEXT,
    data                 TEXT,
    sent_notifications   TEXT
);
CREATE INDEX idx_ticket_history_ticket_id            ON ticket_history(ticket_id);
CREATE INDEX idx_ticket_history_entered_by_person_id ON ticket_history(entered_by_person_id);
CREATE INDEX idx_ticket_history_action_person_id     ON ticket_history(action_person_id);
CREATE INDEX idx_ticket_history_action_id            ON ticket_history(action_id);
CREATE INDEX idx_ticket_history_entered_date         ON ticket_history(entered_date DESC);

-- MEDIA
CREATE TABLE media (
    id                BIGSERIAL       PRIMARY KEY,
    ticket_id         BIGINT      NOT NULL REFERENCES tickets(id),
    filename          VARCHAR(128) NOT NULL,
    internal_filename VARCHAR(50)  NOT NULL UNIQUE,
    mime_type         VARCHAR(128),
    uploaded          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    person_id         BIGINT      REFERENCES people(id)
);
CREATE INDEX idx_media_ticket_id ON media(ticket_id);
CREATE INDEX idx_media_person_id ON media(person_id);
CREATE INDEX idx_media_uploaded  ON media(uploaded DESC);

-- BOOKMARKS
CREATE TABLE bookmarks (
    id          BIGSERIAL        PRIMARY KEY,
    person_id   BIGINT       NOT NULL REFERENCES people(id),
    type        VARCHAR(128)  NOT NULL DEFAULT 'search',
    name        VARCHAR(128),
    request_uri VARCHAR(1024) NOT NULL
);
CREATE INDEX idx_bookmarks_person_id ON bookmarks(person_id);

-- GEOCLUSTERS
CREATE TABLE geoclusters (
    id     BIGSERIAL   PRIMARY KEY,
    level  SMALLINT NOT NULL,
    center POINT    NOT NULL
);
CREATE INDEX idx_geoclusters_level ON geoclusters(level);

-- TICKET GEODATA
CREATE TABLE ticket_geodata (
    ticket_id    BIGINT PRIMARY KEY REFERENCES tickets(id),
    cluster_id_0 BIGINT REFERENCES geoclusters(id),
    cluster_id_1 BIGINT REFERENCES geoclusters(id),
    cluster_id_2 BIGINT REFERENCES geoclusters(id),
    cluster_id_3 BIGINT REFERENCES geoclusters(id),
    cluster_id_4 BIGINT REFERENCES geoclusters(id),
    cluster_id_5 BIGINT REFERENCES geoclusters(id),
    cluster_id_6 BIGINT REFERENCES geoclusters(id)
);
CREATE INDEX idx_ticket_geodata_cluster_0 ON ticket_geodata(cluster_id_0);
CREATE INDEX idx_ticket_geodata_cluster_1 ON ticket_geodata(cluster_id_1);
