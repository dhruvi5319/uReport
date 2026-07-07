---
status: complete
phase: 04-core-case-management-backend
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md]
started: 2026-07-07T22:45:00Z
updated: 2026-07-07T22:48:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Create a Ticket
expected: POST /api/tickets with a valid JWT (STAFF role), category ID, location, and description returns HTTP 201 with the new ticket ID. A ticket_history row with action "open" is also created. The response TicketDetailDto includes slaDueDate and isOverdue fields.
result: skipped
reason: Docker socket inaccessible in sandbox (permission denied on /var/run/docker.sock); dev server could not start

### 2. Close and Reopen a Ticket
expected: POST /api/tickets/{id}/close with a substatus ID returns HTTP 200 and creates an immutable ticket_history entry. POST /api/tickets/{id}/reopen returns HTTP 200 and creates another history entry. Each transition is recorded; the ticket status reflects the change.
result: skipped
reason: Docker socket inaccessible in sandbox; dev server could not start

### 3. Bulk Ticket Operations
expected: POST /api/tickets/bulk with an action (assign, close, or status-change) and up to 100 ticket IDs returns HTTP 200 with a BulkOperationResult showing successCount, failureCount, and per-ticket results. A ticket_history row is created for each successfully mutated ticket.
result: skipped
reason: Docker socket inaccessible in sandbox; dev server could not start

### 4. SLA Overdue Flag
expected: A ticket in "open" status whose entered_date + category.sla_days is in the past has isOverdue=true in its TicketDetailDto response. A closed ticket or one within SLA has isOverdue=false.
result: skipped
reason: Docker socket inaccessible in sandbox; dev server could not start

### 5. Log an Action on a Ticket
expected: POST /api/tickets/{id}/history with a valid action type and notes returns HTTP 201. The action appears in GET /api/tickets/{id}/history. STAFF users can only log actions permitted by their department's department_actions list; ADMIN users can log any action.
result: skipped
reason: Docker socket inaccessible in sandbox; dev server could not start

### 6. Non-Fatal Email Notification
expected: When logging an action with email notification enabled, if SMTP is unavailable or misconfigured, the action is still logged successfully (HTTP 201). A WARN-level log appears but no error is returned to the caller.
result: skipped
reason: Docker socket inaccessible in sandbox; dev server could not start

### 7. Upload Media to a Ticket
expected: POST /api/tickets/{id}/media with a JPEG or PNG file returns HTTP 201 with a MediaDto containing id, originalFilename, mimeType, url, and thumbnailUrl. Uploading a PDF returns HTTP 415 (unsupported media type). An oversized file is rejected with HTTP 413.
result: skipped
reason: Docker socket inaccessible in sandbox; dev server could not start

### 8. Thumbnail Generation
expected: After a successful JPEG/PNG upload, GET /api/media/{mediaId}/thumbnail returns a 150x150 pixel image with the correct Content-Type header. The thumbnail is a separate file from the original.
result: skipped
reason: Docker socket inaccessible in sandbox; dev server could not start

### 9. Open311 Client CRUD (Admin Only)
expected: POST /api/clients (ADMIN JWT) creates a client and returns the api_key in the response — this is the only response that includes the key. Subsequent GET /api/clients/{id} returns the client with api_key as null. A STAFF-role JWT receives HTTP 403 on all /api/clients endpoints.
result: skipped
reason: Docker socket inaccessible in sandbox; dev server could not start

## Summary

total: 9
passed: 0
issues: 0
pending: 0
skipped: 9

## Gaps

[none yet]
