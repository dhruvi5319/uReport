---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: "04"
subsystem: ticket-lifecycle-api
tags: [php, rest-api, ticket-lifecycle, sla, http-kernel]
dependency-graph:
  requires:
    - "01: TicketRepository, ActionRepository, CategoryRepository, DepartmentRepository, PersonRepository, SubstatusRepository"
  provides:
    - "TicketController: all ticket CRUD/lifecycle endpoints"
    - "TicketHistoryController: GET /api/tickets/{id}/history"
    - "TicketService: full ticket lifecycle orchestration"
    - "SlaService: SLA computation with Ticket|array input"
    - "Response: JSON envelope builder"
    - "Router: pattern-matching route dispatch"
    - "Request: HTTP request wrapper with auth context"
  affects:
    - "Wave 3a SPA frontend (consumes these ticket endpoints)"
    - "ReportController (uses SlaService compute())"
tech-stack:
  added: []
  patterns:
    - "Service layer orchestrating repositories (TicketService)"
    - "Thin HTTP controller delegates to service layer"
    - "JSON envelope pattern: {data, meta, errors}"
    - "Action-write-on-state-change for audit trail"
    - "Role-based access: hasRole(staff, admin) guards mutating endpoints"
key-files:
  created:
    - crm/src/Http/Request.php
    - crm/src/Http/Response.php
    - crm/src/Http/Router.php
    - crm/src/Services/SlaService.php
    - crm/src/Controllers/Api/TicketHistoryController.php
  modified:
    - crm/src/Services/TicketService.php
    - crm/src/Controllers/Api/TicketController.php
    - crm/src/Repositories/ActionRepository.php
    - crm/src/Repositories/SubstatusRepository.php
decisions:
  - "SlaService::compute() accepts Ticket|array union type for backward compatibility with ReportController (uses raw PDO rows)"
  - "TicketController retains merge/mergeCandidates methods from prior plan (Plan 10) alongside new lifecycle endpoints"
  - "Router passes params array to handlers while also injecting into request for backward compat"
  - "Request.php updated with new public readonly properties (method/path/segments/query) while keeping legacy getMethod/getPath/getCallerId aliases"
metrics:
  duration: "~45 minutes"
  completed: "2026-06-23"
  tasks: 2
  files: 9
---

# Phase modernize-the-ureport-legacy-php-crm-imp Plan 04: Ticket Lifecycle REST API Summary

**One-liner:** Full ticket lifecycle REST endpoints (F0, F6) with TicketService orchestration, HTTP kernel (Request/Response/Router), and SlaService with business-day SLA computation.

## What Was Built

### Task 1: HTTP Kernel (Request, Response, Router) + SlaService

**crm/src/Http/Request.php** — HTTP request wrapper updated to expose:
- Public readonly props: `method`, `path`, `segments`, `query`
- Auth context: `setActor()`, `actorId()`, `actorRole()`, `hasRole()`
- Body access: `all()`, `input()`
- Backward-compatible aliases for prior plan code: `getMethod()`, `getPath()`, `getCallerId()`

**crm/src/Http/Response.php** — JSON envelope builder implementing TechArch §4.1:
- `json(data, status, meta)`, `created(data)`, `noContent()`, `error(status, code, message)`
- Convenience: `unauthorized()`, `forbidden()`, `notFound()`, `validationError()`, `conflict()`

**crm/src/Http/Router.php** — Pattern-matching router:
- `register(method, pattern, handler)` with `{paramName}` placeholders
- `dispatch(Request)` extracts named params and passes as `$params[]` array to handler
- Supports both new `(Request, array $params)` and legacy `[ClassName::class, 'method']` handler styles

**crm/src/Services/SlaService.php** — SLA computation:
- `compute(Ticket|array, ?int $slaDays)` returns `{slaDays, expectedCloseDate, status, pctElapsed}`
- Uses business-day calendar (Mon–Fri) for accuracy
- Accepts both `Ticket` objects and raw PDO row arrays (backward compat)

### Task 2: TicketService + TicketController + TicketHistoryController

**crm/src/Services/TicketService.php** — Full lifecycle orchestration:
- `createTicket()`, `updateTicket()`, `assignTicket()`, `bulkAssign()`
- `closeTicket()`, `reopenTicket()`, `deleteTicket()`
- `postResponse()`, `postComment()`
- `mergeTickets()` retained from prior Plan 10

Every lifecycle transition writes an immutable `Action` record via `ActionRepository::insert()`.

**crm/src/Controllers/Api/TicketController.php** — HTTP controller:
- `POST /api/tickets` → `create()` (201 with full hydrated ticket)
- `GET /api/tickets/{id}` → `show()` (200 with full hydrated ticket)
- `PUT /api/tickets/{id}` → `update()` (200, staff/admin only)
- `POST /api/tickets/{id}/assign` → `assign()` (200, staff/admin only)
- `POST /api/tickets/bulk-assign` → `bulkAssign()` (200, staff/admin only, max 100)
- `POST /api/tickets/{id}/close` → `close()` (200, staff/admin only)
- `POST /api/tickets/{id}/reopen` → `reopen()` (200, staff/admin only, reason required)
- `DELETE /api/tickets/{id}` → `delete()` (204, admin only)
- `POST /api/tickets/{id}/responses` → `postResponse()` (201, staff/admin only)
- `POST /api/tickets/{id}/comments` → `postComment()` (201, staff/admin only)
- `POST /api/tickets/{id}/merge` → `merge()` retained
- `GET /api/tickets/{id}/merge-candidates` → `mergeCandidates()` retained

`hydrateTicket()` joins category, department, assignee, substatus refs and adds SLA info per TechArch §4.2.

**crm/src/Controllers/Api/TicketHistoryController.php** — History endpoint:
- `GET /api/tickets/{id}/history` → `index()` with pagination (`page`, `perPage`)
- Staff/admin: all actions (internal + external)
- Public/anonymous: external visibility only

### Repository Extensions

**crm/src/Repositories/ActionRepository.php** — Added:
- `findByTicketIdPaginated(ticketId, includeInternal, page, perPage)` → `{rows, total}`

**crm/src/Repositories/SubstatusRepository.php** — Added:
- `findDefault(string $primaryStatus)` for state transition defaults

## Integration Contracts Fulfilled

| Contract | Source | Status |
|----------|--------|--------|
| TicketRepository | Plan 01 | ✅ Consumed |
| ActionRepository | Plan 01 | ✅ Consumed + Extended |
| CategoryRepository | Plan 01 | ✅ Consumed |
| DepartmentRepository | Plan 01 | ✅ Consumed |
| PersonRepository | Plan 01 | ✅ Consumed |
| SubstatusRepository | Plan 01 | ✅ Consumed + Extended |

## Integration Contracts Provided

| Artifact | Consumers |
|----------|-----------|
| TicketController (all ticket endpoints) | Wave 3a SPA frontend |
| TicketHistoryController (GET history) | Wave 3a SPA frontend |
| TicketService (domain methods) | Future Wave 2x plans |
| SlaService (compute) | ReportController, TicketController |
| Response (JSON envelope) | All API controllers |
| Router (dispatch) | Http\Kernel |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SlaService signature mismatch with existing code**
- **Found during:** Task 1 verification / post-commit review
- **Issue:** The existing SlaService.php (from a prior plan) used `array $ticket` parameter, but the plan spec required `Ticket $ticket`. ReportController passes raw PDO rows (arrays) to `slaService->compute()`.
- **Fix:** Changed signature to `Ticket|array $ticket` union type using PHP 8 union types. Internal logic normalizes to extract `datetimeOpened` and `datetimeClosed` from either type.
- **Files modified:** `crm/src/Services/SlaService.php`
- **Commit:** c52361c

**2. [Rule 2 - Missing] TicketController merge/mergeCandidates preserved**
- **Found during:** Task 2
- **Issue:** Existing TicketController.php had `merge()` and `mergeCandidates()` methods from Plan 10 (ticket merge F18). The plan spec would have replaced the file.
- **Fix:** Rewrote TicketController to include all plan spec methods plus retained the existing merge/mergeCandidates, updating them to use the new Request API.
- **Files modified:** `crm/src/Controllers/Api/TicketController.php`
- **Commit:** 7d68639

**3. [Rule 2 - Missing] Router backward compatibility**
- **Found during:** Task 1 - Kernel.php uses old Router API with `[ClassName::class, 'method']` array handlers
- **Issue:** Plan spec Router only supported callable handlers; existing Kernel.php registers routes with array handlers.
- **Fix:** Router `call()` method supports both `callable` and `[ClassName::class, 'method']` array handlers. Uses ReflectionMethod to determine if handler accepts 1 or 2 params.
- **Files modified:** `crm/src/Http/Router.php`
- **Commit:** 5f69634

## Self-Check

All artifact files verified to exist:
- ✅ crm/src/Http/Request.php
- ✅ crm/src/Http/Response.php
- ✅ crm/src/Http/Router.php
- ✅ crm/src/Services/SlaService.php
- ✅ crm/src/Services/TicketService.php
- ✅ crm/src/Controllers/Api/TicketController.php
- ✅ crm/src/Controllers/Api/TicketHistoryController.php
- ✅ crm/src/Repositories/ActionRepository.php (findByTicketIdPaginated added)
- ✅ crm/src/Repositories/SubstatusRepository.php (findDefault added)

All commits verified:
- ✅ 5f69634: HTTP kernel + SlaService (Task 1)
- ✅ 7d68639: TicketService + TicketController + TicketHistoryController (Task 2)
- ✅ c52361c: SlaService backward compat fix

Legacy Application files unmodified: ✅

## Self-Check: PASSED
