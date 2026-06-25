-- =============================================================================
-- uReport Seed Data
-- System lookup table rows with stable IDs for backend service references
-- =============================================================================

-- contactMethods seed (F14)
INSERT INTO contactMethods (id, name, isSystem) VALUES
    (1, 'Email',    true),
    (2, 'Phone',    true),
    (3, 'Web Form', true),
    (4, 'Other',    true);
SELECT setval('contactmethods_id_seq', 4);

-- issueTypes seed (F19)
INSERT INTO issueTypes (id, name, isSystem) VALUES
    (1, 'Comment',   true),
    (2, 'Complaint', true),
    (3, 'Question',  true),
    (4, 'Report',    true),
    (5, 'Request',   true),
    (6, 'Violation', true);
SELECT setval('issuetypes_id_seq', 6);

-- substatus seed (F8)
INSERT INTO substatus (id, name, description, status, isDefault, isSystem) VALUES
    (1, 'Open',      'Ticket is open',                  'open',   true,  true),
    (2, 'Resolved',  'Issue has been resolved',          'closed', true,  true),
    (3, 'Duplicate', 'Ticket is a duplicate of another', 'closed', false, true),
    (4, 'Bogus',     'Ticket was invalid or bogus',      'closed', false, true);
SELECT setval('substatus_id_seq', 4);

-- actions seed (F9, F1)
INSERT INTO actions (id, name, description, type, template) VALUES
    (1,  'open',           'Ticket opened',                   'system', 'Ticket opened by {enteredByPerson}'),
    (2,  'assignment',     'Ticket assigned to person',        'system', 'Assigned to {actionPerson} by {enteredByPerson}'),
    (3,  'closed',         'Ticket closed',                   'system', 'Closed by {enteredByPerson}'),
    (4,  'changeCategory', 'Ticket category changed',         'system', 'Category changed from {original:category_id} to {updated:category_id} by {enteredByPerson}'),
    (5,  'changeLocation', 'Ticket location changed',         'system', 'Location changed from {original:location} to {updated:location} by {enteredByPerson}'),
    (6,  'response',       'Response recorded on ticket',     'system', 'Response recorded by {enteredByPerson}'),
    (7,  'duplicate',      'Ticket marked as duplicate',      'system', 'Marked as duplicate of #{duplicate:ticket_id} by {enteredByPerson}'),
    (8,  'update',         'Ticket updated',                  'system', 'Updated by {enteredByPerson}'),
    (9,  'comment',        'Comment added to ticket',         'system', 'Comment added by {enteredByPerson}'),
    (10, 'upload_media',   'Media uploaded to ticket',        'system', 'Media uploaded by {enteredByPerson}');
SELECT setval('actions_id_seq', 10);
