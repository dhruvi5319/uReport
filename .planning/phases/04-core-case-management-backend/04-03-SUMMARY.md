---
plan: 04-03
phase: 04-core-case-management-backend
status: complete
self_check: passed
completed: 2026-07-07T21:00:00Z
---

# Plan 04-03: Action Logging + Notifications — Summary

## What Was Built

`NotificationService` provides SMTP email dispatch via `JavaMailSender` with non-fatal failure semantics — `MailException` is caught and logged at WARN level, never propagated to callers. `TicketHistoryService` handles action logging with full validation (ticket/action existence, notes requirement for "response" actions, department_action filter for STAFF users with ADMIN bypass), and resolves response templates using a `CategoryActionResponse → Action → null` priority chain. `TicketHistoryController` exposes four REST endpoints — `POST /api/tickets/{id}/history` (STAFF/ADMIN only), `GET /api/actions`, and `GET /api/categories/{id}/action-responses/{actionId}` — along with an integration test (`TicketHistoryIT`) covering the full action-logging flow.

## Tasks Completed

| Task | Status | Files Created/Modified |
|------|--------|----------------------|
| Task 1: NotificationService + domain/repository layer | ✓ Complete | NotificationService.java, ActionRepository.java, DepartmentActionRepository.java, CategoryActionResponseRepository.java, application.yml |
| Task 2: TicketHistoryController + TicketHistoryService + integration test | ✓ Complete | TicketHistoryController.java, TicketHistoryService.java, TicketHistoryIT.java |

## Key Files

- `backend/src/main/java/com/ureport/crm/service/NotificationService.java` — SMTP email dispatch; non-fatal `MailException` handling; reply-email resolution via `CategoryActionResponse → Action → system default` priority chain
- `backend/src/main/java/com/ureport/crm/service/TicketHistoryService.java` — Action logging with validation (404/400/403), department_action filter for STAFF, ADMIN bypass (T-04-12), actionPersonId validation (T-04-13), response template lookup
- `backend/src/main/java/com/ureport/crm/controller/TicketHistoryController.java` — `POST /api/tickets/{id}/history` (STAFF/ADMIN, returns 201), `GET /api/actions`, `GET /api/categories/{id}/action-responses/{actionId}`

## Self-Check: PASSED

All three key files confirmed present and contain the expected implementation. Controller maps to correct endpoints per API spec §4.3. Service enforces all documented security controls (T-04-12 through T-04-17).

## Decisions

- **Non-fatal SMTP (T-04-15):** Email failures catch `MailException` and log at WARN level — ticket action logging must never be blocked by email infrastructure issues.
- **Reply-email priority chain:** `CategoryActionResponse.reply_email` → `Action.reply_email` → `notification.reply-email` system property; enables per-category and per-action customisation without code changes.
- **Response template priority chain:** Same pattern — `CategoryActionResponse.template` → `Action.template` → `null`; allows category-specific template overrides.
- **ADMIN bypasses department filter (T-04-12):** `ROLE_ADMIN` users skip the `department_actions` check; only `ROLE_STAFF` is restricted to their department's permitted actions.
- **`actionPersonId` defaults to currentUser (T-04-13):** If `actionPersonId` is omitted from the request, the authenticated user's ID is used; if supplied, existence is validated with a 400 on failure.
- **`sentNotifications` persisted as JSON array:** The list of email addresses to which delivery was attempted is serialized to a JSON string on the `TicketHistory` row — provides an audit trail without a separate join table.
- **GET /api/tickets/{id}/history delegated to TicketController:** Per controller comment, the GET history endpoint is handled by `TicketController.getHistory()` (already implemented) to avoid duplicate route registration.
