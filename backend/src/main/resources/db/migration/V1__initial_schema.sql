-- V1: Initial MySQL schema for uReport CRM
-- snake_case column names per TechArch §3.4

SET FOREIGN_KEY_CHECKS=0;

-- CONTACT METHODS
CREATE TABLE contact_methods (
    id   INT          UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL
);
INSERT INTO contact_methods (name) VALUES ('Email'), ('Phone'), ('Web Form'), ('Other');

-- SUBSTATUS
CREATE TABLE substatus (
    id          INT          UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(25)  NOT NULL,
    description VARCHAR(128) NOT NULL,
    status      VARCHAR(10)  NOT NULL DEFAULT 'open',
    is_default  TINYINT(1)   NOT NULL DEFAULT 0
);
INSERT INTO substatus (status, name, description) VALUES
    ('closed', 'Resolved',  'This ticket has been taken care of'),
    ('closed', 'Duplicate', 'This ticket is a duplicate of another ticket'),
    ('closed', 'Bogus',     'This ticket is not actually a problem or has already been taken care of');

-- ACTIONS
CREATE TABLE actions (
    id          INT          UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(25)  NOT NULL,
    description VARCHAR(128) NOT NULL,
    type        VARCHAR(20)  NOT NULL DEFAULT 'department',
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
    id   INT          UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL
);
INSERT INTO issue_types (name) VALUES
    ('Comment'), ('Complaint'), ('Question'), ('Report'), ('Request'), ('Violation');

-- CATEGORY GROUPS
CREATE TABLE category_groups (
    id       INT      UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(50) NOT NULL,
    ordering SMALLINT
);
INSERT INTO category_groups (name) VALUES ('Streets'), ('Sanitation'), ('Other');

-- DEPARTMENTS (forward-declared; FK to people added after)
CREATE TABLE departments (
    id                INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(128) NOT NULL,
    default_person_id INT UNSIGNED
);

-- PEOPLE
CREATE TABLE people (
    id            INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    firstname     VARCHAR(128),
    middlename    VARCHAR(128),
    lastname      VARCHAR(128),
    organization  VARCHAR(128),
    address       VARCHAR(128),
    city          VARCHAR(128),
    state         VARCHAR(128),
    zip           VARCHAR(20),
    department_id INT UNSIGNED,
    username      VARCHAR(40)   UNIQUE,
    role          VARCHAR(30),
    CONSTRAINT fk_people_department_id FOREIGN KEY (department_id) REFERENCES departments(id)
);

ALTER TABLE departments
    ADD CONSTRAINT fk_departments_default_person
    FOREIGN KEY (default_person_id) REFERENCES people(id);

CREATE INDEX idx_people_department_id ON people(department_id);
CREATE INDEX idx_people_username      ON people(username);
CREATE INDEX idx_people_lastname      ON people(lastname);

-- PEOPLE EMAILS
CREATE TABLE people_emails (
    id                     INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    person_id              INT UNSIGNED  NOT NULL,
    email                  VARCHAR(255)  NOT NULL,
    label                  VARCHAR(10)   NOT NULL DEFAULT 'Other',
    used_for_notifications TINYINT(1)    NOT NULL DEFAULT 0,
    CONSTRAINT fk_people_emails_person_id FOREIGN KEY (person_id) REFERENCES people(id)
);
CREATE INDEX idx_people_emails_person_id ON people_emails(person_id);
CREATE INDEX idx_people_emails_email     ON people_emails(email);

-- PEOPLE PHONES
CREATE TABLE people_phones (
    id        INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    person_id INT UNSIGNED NOT NULL,
    number    VARCHAR(20),
    label     VARCHAR(10)  NOT NULL DEFAULT 'Other',
    CONSTRAINT fk_people_phones_person_id FOREIGN KEY (person_id) REFERENCES people(id)
);
CREATE INDEX idx_people_phones_person_id ON people_phones(person_id);

-- PEOPLE ADDRESSES
CREATE TABLE people_addresses (
    id        INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    person_id INT UNSIGNED  NOT NULL,
    address   VARCHAR(128)  NOT NULL,
    city      VARCHAR(128),
    state     VARCHAR(128),
    zip       VARCHAR(20),
    label     VARCHAR(10)   NOT NULL DEFAULT 'Home',
    CONSTRAINT fk_people_addresses_person_id FOREIGN KEY (person_id) REFERENCES people(id)
);
CREATE INDEX idx_people_addresses_person_id ON people_addresses(person_id);

-- CLIENTS
CREATE TABLE clients (
    id                INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(128)  NOT NULL,
    url               VARCHAR(255),
    api_key           VARCHAR(50)   NOT NULL UNIQUE,
    contact_person_id INT UNSIGNED  NOT NULL,
    contact_method_id INT UNSIGNED,
    CONSTRAINT fk_clients_contact_person FOREIGN KEY (contact_person_id) REFERENCES people(id),
    CONSTRAINT fk_clients_contact_method FOREIGN KEY (contact_method_id) REFERENCES contact_methods(id)
);
CREATE INDEX idx_clients_api_key           ON clients(api_key);
CREATE INDEX idx_clients_contact_person_id ON clients(contact_person_id);

-- CATEGORIES
CREATE TABLE categories (
    id                       INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name                     VARCHAR(50)   NOT NULL,
    description              VARCHAR(512),
    department_id            INT UNSIGNED  NOT NULL,
    default_person_id        INT UNSIGNED,
    category_group_id        INT UNSIGNED,
    active                   TINYINT(1)    NOT NULL DEFAULT 1,
    featured                 TINYINT(1)    NOT NULL DEFAULT 0,
    display_permission_level VARCHAR(20)   NOT NULL DEFAULT 'staff',
    posting_permission_level VARCHAR(20)   NOT NULL DEFAULT 'staff',
    custom_fields            TEXT,
    last_modified            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sla_days                 INT,
    notification_reply_email VARCHAR(128),
    auto_close_is_active     TINYINT(1)    NOT NULL DEFAULT 0,
    auto_close_substatus_id  INT UNSIGNED,
    CONSTRAINT fk_categories_department    FOREIGN KEY (department_id)           REFERENCES departments(id),
    CONSTRAINT fk_categories_person        FOREIGN KEY (default_person_id)       REFERENCES people(id),
    CONSTRAINT fk_categories_group         FOREIGN KEY (category_group_id)       REFERENCES category_groups(id),
    CONSTRAINT fk_categories_substatus     FOREIGN KEY (auto_close_substatus_id) REFERENCES substatus(id)
);
CREATE INDEX idx_categories_department_id     ON categories(department_id);
CREATE INDEX idx_categories_category_group_id ON categories(category_group_id);
CREATE INDEX idx_categories_default_person_id ON categories(default_person_id);
CREATE INDEX idx_categories_active            ON categories(active);

-- CATEGORY ACTION RESPONSES
CREATE TABLE category_action_responses (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NOT NULL,
    action_id   INT UNSIGNED NOT NULL,
    template    TEXT,
    reply_email VARCHAR(128),
    CONSTRAINT fk_car_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_car_action   FOREIGN KEY (action_id)   REFERENCES actions(id)
);
CREATE INDEX idx_car_category_id ON category_action_responses(category_id);
CREATE INDEX idx_car_action_id   ON category_action_responses(action_id);

-- DEPARTMENT ACTIONS
CREATE TABLE department_actions (
    department_id INT UNSIGNED NOT NULL,
    action_id     INT UNSIGNED NOT NULL,
    PRIMARY KEY (department_id, action_id),
    CONSTRAINT fk_dept_actions_dept   FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT fk_dept_actions_action FOREIGN KEY (action_id)     REFERENCES actions(id)
);

-- DEPARTMENT CATEGORIES
CREATE TABLE department_categories (
    department_id INT UNSIGNED NOT NULL,
    category_id   INT UNSIGNED NOT NULL,
    PRIMARY KEY (department_id, category_id),
    CONSTRAINT fk_dept_cats_dept     FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT fk_dept_cats_category FOREIGN KEY (category_id)   REFERENCES categories(id)
);

-- TICKETS
CREATE TABLE tickets (
    id                    INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    parent_id             INT UNSIGNED,
    category_id           INT UNSIGNED,
    issue_type_id         INT UNSIGNED,
    client_id             INT UNSIGNED,
    entered_by_person_id  INT UNSIGNED,
    reported_by_person_id INT UNSIGNED,
    assigned_person_id    INT UNSIGNED,
    contact_method_id     INT UNSIGNED,
    response_method_id    INT UNSIGNED,
    entered_date          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    address_id            INT,
    latitude              DOUBLE,
    longitude             DOUBLE,
    location              VARCHAR(128),
    city                  VARCHAR(128),
    state                 VARCHAR(128),
    zip                   VARCHAR(40),
    status                VARCHAR(20)   NOT NULL DEFAULT 'open',
    closed_date           DATETIME,
    substatus_id          INT UNSIGNED,
    additional_fields     VARCHAR(255),
    custom_fields         TEXT,
    description           TEXT,
    CONSTRAINT fk_tickets_parent         FOREIGN KEY (parent_id)             REFERENCES tickets(id),
    CONSTRAINT fk_tickets_category       FOREIGN KEY (category_id)           REFERENCES categories(id),
    CONSTRAINT fk_tickets_issue_type     FOREIGN KEY (issue_type_id)         REFERENCES issue_types(id),
    CONSTRAINT fk_tickets_client         FOREIGN KEY (client_id)             REFERENCES clients(id),
    CONSTRAINT fk_tickets_entered_by     FOREIGN KEY (entered_by_person_id)  REFERENCES people(id),
    CONSTRAINT fk_tickets_reported_by    FOREIGN KEY (reported_by_person_id) REFERENCES people(id),
    CONSTRAINT fk_tickets_assigned_to    FOREIGN KEY (assigned_person_id)    REFERENCES people(id),
    CONSTRAINT fk_tickets_contact_method FOREIGN KEY (contact_method_id)     REFERENCES contact_methods(id),
    CONSTRAINT fk_tickets_response_method FOREIGN KEY (response_method_id)   REFERENCES contact_methods(id),
    CONSTRAINT fk_tickets_substatus      FOREIGN KEY (substatus_id)          REFERENCES substatus(id)
);
CREATE INDEX idx_tickets_category_id            ON tickets(category_id);
CREATE INDEX idx_tickets_assigned_person_id     ON tickets(assigned_person_id);
CREATE INDEX idx_tickets_reported_by_person_id  ON tickets(reported_by_person_id);
CREATE INDEX idx_tickets_entered_by_person_id   ON tickets(entered_by_person_id);
CREATE INDEX idx_tickets_status                 ON tickets(status);
CREATE INDEX idx_tickets_entered_date           ON tickets(entered_date);
CREATE INDEX idx_tickets_substatus_id           ON tickets(substatus_id);
CREATE INDEX idx_tickets_parent_id              ON tickets(parent_id);
CREATE INDEX idx_tickets_client_id              ON tickets(client_id);

-- TICKET HISTORY
CREATE TABLE ticket_history (
    id                   INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ticket_id            INT UNSIGNED NOT NULL,
    entered_by_person_id INT UNSIGNED,
    action_person_id     INT UNSIGNED,
    action_id            INT UNSIGNED NOT NULL,
    entered_date         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action_date          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes                TEXT,
    data                 TEXT,
    sent_notifications   TEXT,
    CONSTRAINT fk_ticket_history_ticket      FOREIGN KEY (ticket_id)            REFERENCES tickets(id),
    CONSTRAINT fk_ticket_history_entered_by  FOREIGN KEY (entered_by_person_id) REFERENCES people(id),
    CONSTRAINT fk_ticket_history_action_by   FOREIGN KEY (action_person_id)     REFERENCES people(id),
    CONSTRAINT fk_ticket_history_action      FOREIGN KEY (action_id)            REFERENCES actions(id)
);
CREATE INDEX idx_ticket_history_ticket_id            ON ticket_history(ticket_id);
CREATE INDEX idx_ticket_history_entered_by_person_id ON ticket_history(entered_by_person_id);
CREATE INDEX idx_ticket_history_action_person_id     ON ticket_history(action_person_id);
CREATE INDEX idx_ticket_history_action_id            ON ticket_history(action_id);
CREATE INDEX idx_ticket_history_entered_date         ON ticket_history(entered_date);

-- MEDIA
CREATE TABLE media (
    id                INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ticket_id         INT UNSIGNED  NOT NULL,
    filename          VARCHAR(128)  NOT NULL,
    internal_filename VARCHAR(50)   NOT NULL UNIQUE,
    mime_type         VARCHAR(128),
    uploaded          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    person_id         INT UNSIGNED,
    CONSTRAINT fk_media_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    CONSTRAINT fk_media_person FOREIGN KEY (person_id) REFERENCES people(id)
);
CREATE INDEX idx_media_ticket_id ON media(ticket_id);
CREATE INDEX idx_media_person_id ON media(person_id);
CREATE INDEX idx_media_uploaded  ON media(uploaded);

-- BOOKMARKS
CREATE TABLE bookmarks (
    id          INT UNSIGNED   NOT NULL AUTO_INCREMENT PRIMARY KEY,
    person_id   INT UNSIGNED   NOT NULL,
    type        VARCHAR(128)   NOT NULL DEFAULT 'search',
    name        VARCHAR(128),
    request_uri VARCHAR(1024)  NOT NULL,
    CONSTRAINT fk_bookmarks_person FOREIGN KEY (person_id) REFERENCES people(id)
);
CREATE INDEX idx_bookmarks_person_id ON bookmarks(person_id);

-- GEOCLUSTERS
CREATE TABLE geoclusters (
    id     INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    level  SMALLINT     NOT NULL,
    center POINT        NOT NULL
);
CREATE INDEX idx_geoclusters_level ON geoclusters(level);

-- TICKET GEODATA
CREATE TABLE ticket_geodata (
    ticket_id    INT UNSIGNED NOT NULL PRIMARY KEY,
    cluster_id_0 INT UNSIGNED,
    cluster_id_1 INT UNSIGNED,
    cluster_id_2 INT UNSIGNED,
    cluster_id_3 INT UNSIGNED,
    cluster_id_4 INT UNSIGNED,
    cluster_id_5 INT UNSIGNED,
    cluster_id_6 INT UNSIGNED,
    CONSTRAINT fk_tgd_ticket     FOREIGN KEY (ticket_id)    REFERENCES tickets(id),
    CONSTRAINT fk_tgd_cluster_0  FOREIGN KEY (cluster_id_0) REFERENCES geoclusters(id),
    CONSTRAINT fk_tgd_cluster_1  FOREIGN KEY (cluster_id_1) REFERENCES geoclusters(id),
    CONSTRAINT fk_tgd_cluster_2  FOREIGN KEY (cluster_id_2) REFERENCES geoclusters(id),
    CONSTRAINT fk_tgd_cluster_3  FOREIGN KEY (cluster_id_3) REFERENCES geoclusters(id),
    CONSTRAINT fk_tgd_cluster_4  FOREIGN KEY (cluster_id_4) REFERENCES geoclusters(id),
    CONSTRAINT fk_tgd_cluster_5  FOREIGN KEY (cluster_id_5) REFERENCES geoclusters(id),
    CONSTRAINT fk_tgd_cluster_6  FOREIGN KEY (cluster_id_6) REFERENCES geoclusters(id)
);
CREATE INDEX idx_ticket_geodata_cluster_0 ON ticket_geodata(cluster_id_0);
CREATE INDEX idx_ticket_geodata_cluster_1 ON ticket_geodata(cluster_id_1);

SET FOREIGN_KEY_CHECKS=1;
