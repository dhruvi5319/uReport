---

## Y0c: Database Schema — Categories, Actions, Substatus

---

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

-- Seed data
INSERT INTO substatus (id, name, description, status, isDefault, isSystem) VALUES
    (1, 'Open',      'Ticket is open',                  'open',   true,  true),
    (2, 'Resolved',  'Issue has been resolved',          'closed', true,  true),
    (3, 'Duplicate', 'Ticket is a duplicate of another', 'closed', false, true),
    (4, 'Bogus',     'Ticket was invalid or bogus',      'closed', false, true);
SELECT setval('substatus_id_seq', 4);
```

---

### categoryGroups

```sql
CREATE TABLE categoryGroups (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    ordering    INTEGER         NOT NULL DEFAULT 0
);

CREATE INDEX idx_category_groups_ordering ON categoryGroups (ordering);
```

---

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

---

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

-- System action seed data
INSERT INTO actions (id, name, description, type, template) VALUES
    (1,  'open',            'Ticket opened',                             'system', 'Ticket opened by {enteredByPerson}'),
    (2,  'assignment',      'Ticket assigned to person',                 'system', 'Assigned to {actionPerson} by {enteredByPerson}'),
    (3,  'closed',          'Ticket closed',                             'system', 'Closed by {enteredByPerson}'),
    (4,  'changeCategory',  'Ticket category changed',                   'system', 'Category changed from {original:category_id} to {updated:category_id} by {enteredByPerson}'),
    (5,  'changeLocation',  'Ticket location changed',                   'system', 'Location changed from {original:location} to {updated:location} by {enteredByPerson}'),
    (6,  'response',        'Response recorded on ticket',               'system', 'Response recorded by {enteredByPerson}'),
    (7,  'duplicate',       'Ticket marked as duplicate',                'system', 'Marked as duplicate of #{duplicate:ticket_id} by {enteredByPerson}'),
    (8,  'update',          'Ticket updated',                            'system', 'Updated by {enteredByPerson}'),
    (9,  'comment',         'Comment added to ticket',                   'system', 'Comment added by {enteredByPerson}'),
    (10, 'upload_media',    'Media uploaded to ticket',                  'system', 'Media uploaded by {enteredByPerson}');
SELECT setval('actions_id_seq', 10);
```

---

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

---

### Notes

- `substatus.isDefault` uniqueness per status: enforced at application layer (F08 process step). DB allows multiple defaults but app logic maintains invariant.
- `categories.customFields` JSONB schema format is defined in F07. No DB-level JSON schema validation; application layer validates structure on write.
- `actions` seed IDs 1–10 are stable system records. Action IDs above 10 are department-created custom actions.
- `category_action_responses` UNIQUE constraint on `(category_id, action_id)` ensures one override per category+action combination; application performs upsert.
