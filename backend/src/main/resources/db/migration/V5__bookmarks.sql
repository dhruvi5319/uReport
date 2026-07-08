-- Phase 6: Bookmark/saved search table (SEARCH-01)
-- Stores named search queries scoped to a person.

CREATE TABLE IF NOT EXISTS bookmarks (
    id          BIGSERIAL PRIMARY KEY,
    person_id   BIGINT        NOT NULL,
    type        VARCHAR(50)   NOT NULL DEFAULT 'search',
    name        VARCHAR(255),
    request_uri TEXT          NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_person_id ON bookmarks (person_id);
