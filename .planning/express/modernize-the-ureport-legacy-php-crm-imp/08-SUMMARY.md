---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: "08"
subsystem: backend-wave2c
tags: [media-upload, notifications, reporting, sla, phpmailer, metrics-cache]
dependency_graph:
  requires:
    - plan: "01"
      artifacts: [MediaRepository, ActionRepository, NotificationLogRepository, TemplateRepository]
  provides:
    - TicketMediaController (POST/GET/DELETE /api/tickets/{id}/media)
    - NotificationService (PHPMailer SMTP dispatch, dedup, retry, digest)
    - DigestCronCommand (CLI cron entry)
    - SlaService (calendar-day SLA computation)
    - MetricsCache (in-memory 5-minute TTL cache)
    - ReportController (9 endpoints: 8 staff + 1 public)
  affects:
    - All ticket mutation endpoints (F8 notifications wired here)
    - Wave 3d frontend dashboards (F15 — report + notification UIs)
tech_stack:
  added:
    - PHPMailer\PHPMailer (already in composer.json @stable)
    - GD extension (imagecreatefrom*, imagecopyresampled, imagejpeg) for thumbnail generation
  patterns:
    - Static in-memory TTL cache (MetricsCache::$store — no Redis dependency for MVP)
    - Calendar-day SLA (not business-hour — matching legacy uReport behaviour)
    - JSON envelope pattern {"data":…,"meta":…,"errors":[]} throughout
    - finfo magic-byte MIME detection (not Content-Type header)
key_files:
  created:
    - crm/src/Controllers/Api/TicketMediaController.php
    - crm/src/Services/NotificationService.php
    - crm/src/Console/DigestCronCommand.php
    - crm/src/Services/SlaService.php
    - crm/src/Infrastructure/Cache/MetricsCache.php
    - crm/src/Controllers/Api/ReportController.php
  modified:
    - crm/src/Repositories/MediaRepository.php (added countByTicketId, softDelete)
    - crm/src/Repositories/NotificationLogRepository.php (added hasSentRecently, create)
decisions:
  - Calendar-day SLA for MVP (not business-hours) — matches legacy uReport behaviour per plan note
  - Static PHP array MetricsCache (no Redis dependency) — sufficient for per-worker 5-min cache
  - SlaService signature changed to array $ticket (not Domain\Ticket) for ReportController raw-row compatibility
  - DigestCronCommand wraps each department in try/catch to prevent one failure aborting all departments
metrics:
  duration: "~15 minutes"
  completed: "2026-06-23"
  tasks_completed: 3
  files_created: 6
  files_modified: 2
---

# Phase modernize-the-ureport-legacy-php-crm-imp Plan 08: Media Upload, Notifications & Reporting Summary

**One-liner:** PHPMailer notification dispatch with 60-second dedup, finfo MIME-validated media upload with GD thumbnail generation, 9-endpoint reporting suite with 5-minute in-memory MetricsCache and CSV export.

## Objective

Implement the three remaining Wave 2c backend services: media upload API (F7), transactional email notifications via PHPMailer (F8), and all reporting + SLA metrics endpoints (F9). These are the last Wave 2c deliverables, unlocking Wave 3d frontend dashboards.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | TicketMediaController (F7) | `99ea108` | TicketMediaController.php, MediaRepository.php (patch) |
| 2 | NotificationService + DigestCronCommand (F8) | `3bbee66` | NotificationService.php, DigestCronCommand.php, NotificationLogRepository.php (patch) |
| 3 | SlaService + MetricsCache + ReportController (F9) | `9e34821` | SlaService.php, MetricsCache.php, ReportController.php |

## Files Created

### `crm/src/Controllers/Api/TicketMediaController.php`
Implements F7 media attachment API:
- `list(int $ticketId)` — GET /api/tickets/{id}/media → Media[] (non-deleted)
- `upload(int $ticketId)` — POST multipart/form-data; validates MIME via `finfo` magic bytes; generates 300×300 JPEG thumbnail via GD `imagecopyresampled`; creates both media record and `type=upload` action
- `show(int $ticketId, int $mediaId)` — GET /api/tickets/{id}/media/{mediaId}
- `delete(int $ticketId, int $mediaId)` — staff/admin only, soft-delete via `softDelete()`
- Error codes: `FILE_TOO_LARGE`, `INVALID_FILE_TYPE`, `ATTACHMENT_LIMIT`, `FILE_REQUIRED`, `UPLOAD_FAILED`, `FORBIDDEN`, `NOT_FOUND`

### `crm/src/Services/NotificationService.php`
Implements F8 transactional email dispatch:
- `send(string $templateSlug, string $to, array $vars, ?int $ticketId)` — validates email with `filter_var`, deduplicates via `hasSentRecently()` (60-second window), fetches template by slug, substitutes `{{key}}` placeholders, dispatches via PHPMailer SMTP with 3-attempt exponential backoff (1s, 2s), logs every attempt to `notification_log`
- `sendDigest(int $departmentId)` — sends daily digest to active staff; skips departments with 0 open tickets

### `crm/src/Console/DigestCronCommand.php`
CLI cron entry point (scheduled: `0 7 * * * php crm/console.php digest`):
- Iterates all active departments, calls `sendDigest()` per department
- Per-department try/catch prevents one failure from aborting all subsequent departments

### `crm/src/Services/SlaService.php`
Implements F9 SLA computation (replaced prior business-days version):
- `compute(array $ticket, ?int $slaDays)` — uses calendar days (MVP, matching legacy); returns `['expectedCloseDate', 'status', 'pctElapsed']` with `status ∈ {on_time, late, no_sla}`
- `isOnTime(array $ticket, ?int $slaDays)` — convenience boolean wrapper

### `crm/src/Infrastructure/Cache/MetricsCache.php`
In-memory TTL cache for SLA metrics:
- Static `$store` array backing; per-request in-process caching
- Methods: `get`, `set`, `has`, `delete`, `flush`
- Default TTL: 300 seconds (5 minutes)

### `crm/src/Controllers/Api/ReportController.php`
Implements F9 reporting suite — 9 public methods:

| Method | Route | Auth | Notes |
|--------|-------|------|-------|
| `activity()` | GET /api/reports/activity | staff/admin | Totals + daily breakdown |
| `assignments()` | GET /api/reports/assignments | staff/admin | Per-assignee + avg days to close |
| `categories()` | GET /api/reports/categories | staff/admin | Volume + SLA rates via SlaService |
| `departments()` | GET /api/reports/departments | staff/admin | Volume + avg resolution |
| `staffPerformance()` | GET /api/reports/staff-performance | staff/admin | Response counts + tickets handled |
| `sla()` | GET /api/reports/sla | staff/admin | On-time/late by category |
| `volume()` | GET /api/reports/volume | staff/admin | daily/weekly/monthly grouping |
| `openAge()` | GET /api/reports/open-age | staff/admin | Overdue open tickets |
| `metrics()` | GET /api/metrics/sla | **PUBLIC** | 5-min cached, lightweight |

All endpoints support `?format=csv` returning `Content-Disposition: attachment`.

## Files Modified

### `crm/src/Repositories/MediaRepository.php` (Rule 2 — missing critical methods)
Added:
- `countByTicketId(int $ticketId): int` — required by `upload()` for attachment limit enforcement
- `softDelete(int $id): void` — aliased by `TicketMediaController::delete()`; `delete()` now delegates to it

### `crm/src/Repositories/NotificationLogRepository.php` (Rule 2 — missing critical methods)
Added:
- `hasSentRecently(string $email, string $slug, int $ticketId, int $withinSeconds): bool` — required by `NotificationService` dedup
- `create(array $data): int` — required by `NotificationService` logging after each send attempt

## Integration Contracts Fulfilled

| Contract | Status |
|----------|--------|
| MediaRepository::save(), findByTicketId() | ✅ consumed by TicketMediaController |
| ActionRepository::insert() type=upload | ✅ consumed by TicketMediaController::upload() |
| NotificationLogRepository::hasSentRecently() + create() | ✅ added + consumed by NotificationService |
| TemplateRepository::findBySlug() | ✅ consumed by NotificationService |
| SlaService::compute(array, ?int) | ✅ produced; consumed by ReportController |
| MetricsCache::get/set | ✅ produced; consumed by ReportController::metrics() |
| GET /api/metrics/sla (public, cached 5 min) | ✅ implemented |
| CSV export on all report endpoints | ✅ implemented via ?format=csv |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing Critical] `MediaRepository::countByTicketId()` and `softDelete()` missing**
- **Found during:** Task 1 (TicketMediaController depends on these)
- **Issue:** MediaRepository scaffolded in Wave 1 had `delete()` but lacked `countByTicketId()` and the `softDelete()` alias expected by the plan's controller code
- **Fix:** Added `countByTicketId()` (COUNT query) and `softDelete()` (alias for soft-delete), with `delete()` now delegating to `softDelete()`
- **Files modified:** `crm/src/Repositories/MediaRepository.php`
- **Commit:** `99ea108`

**2. [Rule 2 — Missing Critical] `NotificationLogRepository::hasSentRecently()` and `create()` missing**
- **Found during:** Task 2 (NotificationService depends on these)
- **Issue:** NotificationLogRepository had `insert(NotificationLog)` but lacked the `hasSentRecently()` dedup method and the array-based `create()` method expected by NotificationService
- **Fix:** Added both methods as specified in the plan
- **Files modified:** `crm/src/Repositories/NotificationLogRepository.php`
- **Commit:** `3bbee66`

**3. [Rule 1 — Signature change] SlaService signature replaced**
- **Found during:** Task 3 (ReportController passes raw DB rows, not Domain\Ticket objects)
- **Issue:** Prior SlaService (from an earlier wave) accepted `Domain\Ticket $ticket` and used business-day calculation. The plan requires `array $ticket` for DB-row compatibility and calendar days
- **Fix:** Replaced implementation with calendar-day, array-based signature per plan specification
- **Files modified:** `crm/src/Services/SlaService.php`
- **Commit:** `9e34821`

## Implementation Decisions

1. **Calendar-day SLA (not business-hours):** The plan explicitly notes "use calendar days for MVP simplicity, same as legacy". SlaService uses `$opened->modify("+{$slaDays} days")`.

2. **In-memory MetricsCache (not Redis):** PHP static array is sufficient for the 5-minute SLA metrics cache within a PHP-FPM worker's lifetime. Redis integration point is documented for future enhancement.

3. **DigestCronCommand per-department error isolation:** Wrapped each `sendDigest()` call in a try/catch so one department failure doesn't abort remaining departments — more robust than the plan's bare loop.

4. **`match` with `@` suppression in thumbnail generation:** Added `@` prefix to image creation functions (`@imagecreatefromjpeg` etc.) to avoid PHP warnings on corrupt images, returning `false` gracefully.

## Self-Check

### Files exist:
- [x] `crm/src/Controllers/Api/TicketMediaController.php`
- [x] `crm/src/Services/NotificationService.php`
- [x] `crm/src/Console/DigestCronCommand.php`
- [x] `crm/src/Services/SlaService.php`
- [x] `crm/src/Infrastructure/Cache/MetricsCache.php`
- [x] `crm/src/Controllers/Api/ReportController.php`

### Commits exist:
- [x] `99ea108` — TicketMediaController (F7)
- [x] `3bbee66` — NotificationService + DigestCronCommand (F8)
- [x] `9e34821` — SlaService + MetricsCache + ReportController (F9)

## Self-Check: PASSED
