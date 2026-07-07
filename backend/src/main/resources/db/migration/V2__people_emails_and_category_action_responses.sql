-- V2: Add people_emails and category_action_responses tables
-- Required by NotificationService (Plan 04-03)

-- People Emails (notification addresses per person)
CREATE TABLE IF NOT EXISTS people_emails (
    id                      BIGSERIAL PRIMARY KEY,
    person_id               BIGINT NOT NULL REFERENCES people(id),
    email                   VARCHAR(255) NOT NULL,
    used_for_notifications  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_people_emails_person_id ON people_emails(person_id);
CREATE INDEX IF NOT EXISTS idx_people_emails_email     ON people_emails(email);

-- Category Action Responses (response templates per category+action pair)
CREATE TABLE IF NOT EXISTS category_action_responses (
    id          BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES categories(id),
    action_id   BIGINT NOT NULL REFERENCES actions(id),
    template    TEXT,
    reply_email VARCHAR(128)
);

CREATE INDEX IF NOT EXISTS idx_car_category_id ON category_action_responses(category_id);
CREATE INDEX IF NOT EXISTS idx_car_action_id   ON category_action_responses(action_id);
