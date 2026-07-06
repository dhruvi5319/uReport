ALTER TABLE tickets ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
CREATE INDEX idx_tickets_search_vector ON tickets USING GIN (search_vector);

CREATE OR REPLACE FUNCTION tickets_search_vector_update()
RETURNS TRIGGER AS $$
DECLARE
    reporter_firstname TEXT := '';
    reporter_lastname  TEXT := '';
    category_name      TEXT := '';
BEGIN
    IF NEW.reported_by_person_id IS NOT NULL THEN
        SELECT COALESCE(firstname, ''), COALESCE(lastname, '')
        INTO reporter_firstname, reporter_lastname
        FROM people WHERE id = NEW.reported_by_person_id;
    END IF;
    IF NEW.category_id IS NOT NULL THEN
        SELECT COALESCE(name, '')
        INTO category_name
        FROM categories WHERE id = NEW.category_id;
    END IF;
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.id::TEXT, '')),    'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.location, '')),    'B') ||
        setweight(to_tsvector('english', reporter_lastname),             'C') ||
        setweight(to_tsvector('english', reporter_firstname),            'C') ||
        setweight(to_tsvector('english', category_name),                 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_search_vector_trigger
BEFORE INSERT OR UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION tickets_search_vector_update();

UPDATE tickets SET search_vector = NULL WHERE id > 0;
