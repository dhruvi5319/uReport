---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 08
type: execute
wave: 2
depends_on: [1]
files_modified:
  - crm/src/Controllers/Api/TicketMediaController.php
  - crm/src/Services/NotificationService.php
  - crm/src/Services/SlaService.php
  - crm/src/Controllers/Api/ReportController.php
  - crm/src/Infrastructure/Cache/MetricsCache.php
  - crm/src/Console/DigestCronCommand.php
autonomous: true

features:
  implements: ["F7", "F8", "F9"]
  depends_on: ["F0", "F6", "F13"]
  enables: ["F15"]

must_haves:
  truths:
    - "Staff can upload a file to a ticket via POST /api/tickets/{id}/media and get a Media object back with thumbnailUrl populated for images"
    - "Uploading a file creates an actions record of type=upload and a media record in the DB"
    - "MIME validation uses finfo magic bytes (not Content-Type header); oversized files return 422"
    - "NotificationService dispatches transactional emails via PHPMailer using the correct template slug, substitutes template variables, logs to notification_log, and skips duplicate sends within 60-second window"
    - "DigestCronCommand generates per-department digest emails and sends them via NotificationService"
    - "All 8 report endpoints return correct aggregate data from MySQL; GET /api/metrics/sla returns SLA % and is cached 5 minutes"
    - "CSV export is available on all report endpoints via ?format=csv"
  artifacts:
    - path: "crm/src/Controllers/Api/TicketMediaController.php"
      provides: "POST /api/tickets/{id}/media, GET, DELETE handlers"
      exports: ["TicketMediaController"]
    - path: "crm/src/Services/NotificationService.php"
      provides: "Transactional email dispatch + dedup + retry"
      exports: ["NotificationService"]
    - path: "crm/src/Controllers/Api/ReportController.php"
      provides: "8 report endpoints + GET /api/metrics/sla"
      exports: ["ReportController"]
    - path: "crm/src/Services/SlaService.php"
      provides: "SLA computation (expectedCloseDate, pctElapsed, status)"
      exports: ["SlaService"]
    - path: "crm/src/Infrastructure/Cache/MetricsCache.php"
      provides: "In-memory 5-minute SLA metrics cache"
      exports: ["MetricsCache"]
    - path: "crm/src/Console/DigestCronCommand.php"
      provides: "CLI cron entry point for daily digest emails"
      exports: ["DigestCronCommand"]
  key_links:
    - from: "crm/src/Controllers/Api/TicketMediaController.php"
      to: "crm/src/Repositories/MediaRepository.php"
      via: "MediaRepository::save()"
      pattern: "MediaRepository"
    - from: "crm/src/Controllers/Api/TicketMediaController.php"
      to: "crm/src/Repositories/ActionRepository.php"
      via: "ActionRepository::insert() type=upload"
      pattern: "ActionRepository"
    - from: "crm/src/Services/NotificationService.php"
      to: "crm/src/Repositories/NotificationLogRepository.php"
      via: "dedup check + log write"
      pattern: "NotificationLogRepository"
    - from: "crm/src/Controllers/Api/ReportController.php"
      to: "crm/src/Infrastructure/Cache/MetricsCache.php"
      via: "MetricsCache::get/set on /api/metrics/sla"
      pattern: "MetricsCache"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "crm/src/Repositories/MediaRepository.php"
      exports: ["MediaRepository"]
      verify: "grep -n 'class MediaRepository' crm/src/Repositories/MediaRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "crm/src/Repositories/ActionRepository.php"
      exports: ["ActionRepository"]
      verify: "grep -n 'class ActionRepository' crm/src/Repositories/ActionRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "crm/src/Repositories/NotificationLogRepository.php"
      exports: ["NotificationLogRepository"]
      verify: "grep -n 'class NotificationLogRepository' crm/src/Repositories/NotificationLogRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "crm/src/Repositories/TemplateRepository.php"
      exports: ["TemplateRepository"]
      verify: "grep -n 'class TemplateRepository' crm/src/Repositories/TemplateRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "db/migrations/ (tables: media, notification_log, templates, actions, tickets)"
      exports: ["TABLE: media", "TABLE: notification_log", "TABLE: templates"]
      verify: "grep -rn 'class.*Migration' db/migrations/ | wc -l | grep -E '^1[0-9]$' && echo CONTRACT_OK"
  provides:
    - artifact: "crm/src/Controllers/Api/TicketMediaController.php"
      exports:
        - "GET /api/tickets/{id}/media → Media[]"
        - "POST /api/tickets/{id}/media → Media (201)"
        - "GET /api/tickets/{id}/media/{mediaId} → Media"
        - "DELETE /api/tickets/{id}/media/{mediaId} → 204"
      shape: |
        class TicketMediaController {
          public function list(int $ticketId): void;    // GET list
          public function upload(int $ticketId): void;  // POST multipart
          public function show(int $ticketId, int $mediaId): void;
          public function delete(int $ticketId, int $mediaId): void;
        }
      verify: "grep -n 'class TicketMediaController' crm/src/Controllers/Api/TicketMediaController.php && echo CONTRACT_OK"
    - artifact: "crm/src/Services/NotificationService.php"
      exports:
        - "NotificationService::send(string $templateSlug, string $to, array $vars, ?int $ticketId): void"
        - "NotificationService::sendDigest(int $departmentId): void"
      shape: |
        class NotificationService {
          public function send(string $templateSlug, string $to, array $vars, ?int $ticketId = null): void;
          public function sendDigest(int $departmentId): void;
        }
      verify: "grep -n 'class NotificationService' crm/src/Services/NotificationService.php && echo CONTRACT_OK"
    - artifact: "crm/src/Controllers/Api/ReportController.php"
      exports:
        - "GET /api/reports/activity"
        - "GET /api/reports/assignments"
        - "GET /api/reports/categories"
        - "GET /api/reports/departments"
        - "GET /api/reports/staff-performance"
        - "GET /api/reports/sla"
        - "GET /api/reports/volume"
        - "GET /api/reports/open-age"
        - "GET /api/metrics/sla (public, cached 5 min)"
      shape: |
        class ReportController {
          public function activity(): void;
          public function assignments(): void;
          public function categories(): void;
          public function departments(): void;
          public function staffPerformance(): void;
          public function sla(): void;
          public function volume(): void;
          public function openAge(): void;
          public function metrics(): void; // public, cached
        }
      verify: "grep -n 'class ReportController' crm/src/Controllers/Api/ReportController.php && echo CONTRACT_OK"
    - artifact: "crm/src/Services/SlaService.php"
      exports:
        - "SlaService::compute(array $ticket, int|null $slaDays): array"
      shape: |
        class SlaService {
          // Returns ['expectedCloseDate'=>string|null, 'status'=>'on_time'|'late'|'no_sla', 'pctElapsed'=>float|null]
          public function compute(array $ticket, ?int $slaDays): array;
          public function isOnTime(array $ticket, ?int $slaDays): bool;
        }
      verify: "grep -n 'class SlaService' crm/src/Services/SlaService.php && echo CONTRACT_OK"
    - artifact: "crm/src/Infrastructure/Cache/MetricsCache.php"
      exports:
        - "MetricsCache::get(string $key): mixed"
        - "MetricsCache::set(string $key, mixed $value, int $ttlSeconds): void"
      shape: |
        class MetricsCache {
          public function get(string $key): mixed;
          public function set(string $key, mixed $value, int $ttlSeconds = 300): void;
          public function has(string $key): bool;
        }
      verify: "grep -n 'class MetricsCache' crm/src/Infrastructure/Cache/MetricsCache.php && echo CONTRACT_OK"
---

<objective>
Implement the three data-intensive backend services for Wave 2c: media upload API (F7), transactional email notifications via PHPMailer (F8), and all reporting + metrics endpoints (F9).

Purpose: These services are the last Wave 2c backend deliverable, unlocking the Wave 3d frontend dashboards (reporting/notifications UI). Media upload is consumed by both ticket creation and the staff detail view. Notifications wire into every ticket mutation already built in Wave 2a. Reports give supervisors real-time visibility into SLA compliance.

Output:
- `TicketMediaController` — POST /api/tickets/{id}/media with MIME validation, thumbnail generation, media record + upload action
- `NotificationService` — PHPMailer SMTP dispatch, template variable substitution, dedup via notification_log, retry logic, digest batch
- `DigestCronCommand` — CLI entry point for daily digest cron job
- `SlaService` — SLA expectedCloseDate/pctElapsed/status computation (shared by TicketController + ReportController)
- `ReportController` — 8 report endpoints + GET /api/metrics/sla with 5-minute MetricsCache
- `MetricsCache` — in-memory (or Redis if configured) TTL cache for SLA metrics
</objective>

<feature_dependencies>
Implements: F7: Media Attachments (TicketMediaController, MediaRepository, thumbnail generation, upload action), F8: Notification System (NotificationService, PHPMailer, template variable substitution, dedup, retry, digest cron), F9: Reporting & Metrics (ReportController — 8 report types, SlaService, MetricsCache, CSV export)
Depends on: F0: Ticket Lifecycle (ticket existence checks), F6: Audit Trail (ActionRepository — upload action), F13: Response Templates (TemplateRepository — notification bodies)
Enables: F15: SPA Frontend — Wave 3d (reporting dashboards, notification settings screen, media viewer)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/WAVE-SCHEDULE.md
@project_specs/TechArch-uReport.md

# Prior wave artifacts consumed by this plan:
# - crm/src/Repositories/MediaRepository.php (save, findByTicketId, softDelete)
# - crm/src/Repositories/ActionRepository.php (insert — immutable)
# - crm/src/Repositories/NotificationLogRepository.php (create, findRecent)
# - crm/src/Repositories/TemplateRepository.php (findBySlug)
# - crm/src/Domain/Media.php (readonly — fromRow)
# - crm/src/Domain/Action.php (readonly — TYPES const)
# - crm/src/Repositories/AbstractPdoRepository.php (paginate helper)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Media upload API (F7) — TicketMediaController with MIME validation and thumbnail generation</name>
  <files>
    crm/src/Controllers/Api/TicketMediaController.php
  </files>
  <action>
Create `crm/src/Controllers/Api/TicketMediaController.php` in namespace `Controllers\Api`.

This controller handles all media attachment operations for a ticket. It depends on: `MediaRepository`, `ActionRepository`, `TicketRepository`, and `RbacMiddleware` context (caller role + personId available via `$_REQUEST['_caller']` set by AuthMiddleware — same pattern as TicketController from Wave 2a).

**F7 API Surface (from TechArch §4.3 and FRD F07):**
```
GET    /api/tickets/{id}/media               → list attachments (visibility-checked)
POST   /api/tickets/{id}/media               → upload file (multipart/form-data)
GET    /api/tickets/{id}/media/{mediaId}     → get attachment metadata
DELETE /api/tickets/{id}/media/{mediaId}     → soft-delete (staff/admin)
```

**Allowed MIME types (from TechArch §6.7 MAX_UPLOAD_SIZE + FRD F07 validation):**
```php
private const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf',
];
private const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
```

**upload() method — step-by-step per FRD F07 Process: Upload File:**

1. Verify ticket exists and not deleted (TicketRepository::findById).
2. Validate `$_FILES['file']` present; check `$_FILES['file']['error'] === UPLOAD_ERR_OK`.
3. Read `MAX_UPLOAD_SIZE` constant (default `10 * 1024 * 1024`); return 422 `FILE_TOO_LARGE` if exceeded.
4. Use `finfo_file($_FILES['file']['tmp_name'], FILEINFO_MIME_TYPE)` to detect real MIME type (NOT Content-Type header).
5. If MIME not in ALLOWED_MIME_TYPES, return 422 `INVALID_FILE_TYPE`.
6. Check current media count for ticket (MediaRepository::countByTicketId); if ≥ max (20), return 422 `ATTACHMENT_LIMIT`.
7. Generate unique stored filename: `upload_{ticketId}_{uniqid()}.{ext}` where ext derived from MIME.
8. Move uploaded file to `UPLOAD_ROOT . '/' . $filename` using `move_uploaded_file()`.
9. If MIME is in IMAGE_MIME_TYPES, generate thumbnail:
   - Load with `imagecreatefromjpeg/png/gif/webp` per MIME.
   - Resize to max 300×300px preserving aspect ratio with `imagecopyresampled`.
   - Save as JPEG to `UPLOAD_ROOT . '/thumbs/' . $thumbFilename`.
   - `$thumbnailPath = 'thumbs/' . $thumbFilename`.
10. Create `Domain\Media` record with all fields; call `MediaRepository::save($media)`.
11. Create `Domain\Action` with `type='upload'`, `visibility='internal'`, `actorPersonId=$callerId`, `payload=json_encode(['mediaIds'=>[$newMedia->id]])`.
12. Call `ActionRepository::insert($action)`.
13. Return JSON envelope `{"data": <media object>, "meta": {}, "errors": []}` with HTTP 201.

**Media object shape (from TechArch TypeScript `Media` interface §4.2):**
```json
{
  "id": 88,
  "ticketId": 101,
  "filename": "upload_101_abc123.jpg",
  "originalName": "pothole-photo.jpg",
  "mimeType": "image/jpeg",
  "size": 2048576,
  "isImage": true,
  "thumbnailUrl": "/uploads/thumbs/upload_101_abc123_thumb.jpg",
  "downloadUrl": "/uploads/upload_101_abc123.jpg",
  "label": null,
  "sourceUrl": null,
  "createdAt": "2026-06-23T10:00:00Z"
}
```

**delete() method (FRD F07 Process: Delete Attachment):**
- Verify staff/admin role; return 403 if not.
- Soft-delete: `MediaRepository::softDelete($mediaId)` (sets `deletedAt = NOW()`).
- Return HTTP 204.

**list() and show() methods:**
- list(): fetch all non-deleted media for ticket; map to media object array.
- show(): fetch single media record; return 404 if not found or deleted.

**Error responses follow the JSON envelope pattern with HTTP status codes from TechArch §4.1:**
```php
private function error(int $status, string $code, string $message): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode(['data' => null, 'meta' => [], 'errors' => [['field' => null, 'code' => $code, 'message' => $message]]]);
    exit;
}
```

**NOTE on thumbnails dir:** Create `UPLOAD_ROOT . '/thumbs/'` if it doesn't exist using `mkdir(..., 0775, true)`.

```php
<?php
declare(strict_types=1);
namespace Controllers\Api;

use Repositories\MediaRepository;
use Repositories\ActionRepository;
use Repositories\TicketRepository;
use Domain\Media;
use Domain\Action;

class TicketMediaController
{
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf',
    ];
    private const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    private const MIME_EXT_MAP = [
        'image/jpeg' => 'jpg', 'image/png' => 'png',
        'image/gif' => 'gif', 'image/webp' => 'webp', 'application/pdf' => 'pdf',
    ];

    public function __construct(
        private readonly TicketRepository $tickets,
        private readonly MediaRepository  $media,
        private readonly ActionRepository $actions,
    ) {}

    /** GET /api/tickets/{id}/media */
    public function list(int $ticketId): void
    {
        $ticket = $this->tickets->findById($ticketId);
        if ($ticket === null) { $this->error(404, 'NOT_FOUND', 'Ticket not found'); }

        $records = $this->media->findByTicketId($ticketId);
        $data    = array_map(fn($m) => $this->toApiShape($m), $records);

        $this->json(['data' => $data, 'meta' => ['total' => count($data)], 'errors' => []]);
    }

    /** POST /api/tickets/{id}/media */
    public function upload(int $ticketId): void
    {
        $ticket = $this->tickets->findById($ticketId);
        if ($ticket === null) { $this->error(404, 'NOT_FOUND', 'Ticket not found'); }

        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            $this->error(422, 'FILE_REQUIRED', 'A valid file upload is required');
        }

        $maxSize = defined('MAX_UPLOAD_SIZE') ? (int) MAX_UPLOAD_SIZE : 10485760;
        if ($_FILES['file']['size'] > $maxSize) {
            $this->error(422, 'FILE_TOO_LARGE', 'File exceeds maximum size of ' . ($maxSize / 1048576) . ' MB');
        }

        $finfo    = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($_FILES['file']['tmp_name']);

        if (!in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            $this->error(422, 'INVALID_FILE_TYPE', 'File type not allowed');
        }

        $currentCount = $this->media->countByTicketId($ticketId);
        $maxAttach    = defined('MAX_ATTACHMENTS_PER_TICKET') ? (int) MAX_ATTACHMENTS_PER_TICKET : 20;
        if ($currentCount >= $maxAttach) {
            $this->error(422, 'ATTACHMENT_LIMIT', 'Maximum attachments per ticket reached');
        }

        $uploadRoot = defined('UPLOAD_ROOT') ? UPLOAD_ROOT : sys_get_temp_dir() . '/ureport_uploads';
        if (!is_dir($uploadRoot)) { mkdir($uploadRoot, 0775, true); }

        $ext          = self::MIME_EXT_MAP[$mimeType] ?? 'bin';
        $filename     = 'upload_' . $ticketId . '_' . uniqid('', true) . '.' . $ext;
        $destPath     = $uploadRoot . '/' . $filename;
        $relPath      = $filename;
        $thumbPath    = null;

        if (!move_uploaded_file($_FILES['file']['tmp_name'], $destPath)) {
            $this->error(500, 'UPLOAD_FAILED', 'Failed to store uploaded file');
        }

        // Thumbnail for images
        if (in_array($mimeType, self::IMAGE_MIME_TYPES, true)) {
            $thumbDir = $uploadRoot . '/thumbs';
            if (!is_dir($thumbDir)) { mkdir($thumbDir, 0775, true); }

            $thumbFilename = 'upload_' . $ticketId . '_' . uniqid('', true) . '_thumb.jpg';
            $thumbDest     = $thumbDir . '/' . $thumbFilename;

            $src = match ($mimeType) {
                'image/jpeg' => imagecreatefromjpeg($destPath),
                'image/png'  => imagecreatefrompng($destPath),
                'image/gif'  => imagecreatefromgif($destPath),
                'image/webp' => imagecreatefromwebp($destPath),
            };

            if ($src !== false) {
                [$w, $h] = getimagesize($destPath);
                $maxDim   = 300;
                $scale    = min($maxDim / $w, $maxDim / $h, 1.0);
                $tw       = (int) round($w * $scale);
                $th       = (int) round($h * $scale);
                $thumb    = imagecreatetruecolor($tw, $th);
                imagecopyresampled($thumb, $src, 0, 0, 0, 0, $tw, $th, $w, $h);
                imagejpeg($thumb, $thumbDest, 85);
                imagedestroy($src);
                imagedestroy($thumb);
                $thumbPath = 'thumbs/' . $thumbFilename;
            }
        }

        $label        = isset($_POST['label']) ? trim($_POST['label']) : null;
        $callerId     = (int) ($_REQUEST['_callerId'] ?? 0) ?: null;

        $newMedia = new Media(
            id:            0,
            ticketId:      $ticketId,
            filename:      $filename,
            originalName:  $_FILES['file']['name'],
            mimeType:      $mimeType,
            size:          $_FILES['file']['size'],
            path:          $relPath,
            thumbnailPath: $thumbPath,
            sourceUrl:     null,
            label:         $label,
            deletedAt:     null,
            createdAt:     (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
        );

        $saved = $this->media->save($newMedia);

        // Record upload action (F6 — immutable audit trail)
        $action = new Action(
            id:              0,
            ticketId:        $ticketId,
            type:            'upload',
            visibility:      'internal',
            actorPersonId:   $callerId,
            actorClientId:   null,
            datetimeCreated: (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
            payload:         json_encode(['mediaIds' => [$saved->id]], JSON_THROW_ON_ERROR),
        );
        $this->actions->insert($action);

        http_response_code(201);
        $this->json(['data' => $this->toApiShape($saved), 'meta' => [], 'errors' => []]);
    }

    /** GET /api/tickets/{id}/media/{mediaId} */
    public function show(int $ticketId, int $mediaId): void
    {
        $record = $this->media->findById($mediaId);
        if ($record === null || $record->ticketId !== $ticketId || $record->deletedAt !== null) {
            $this->error(404, 'NOT_FOUND', 'Attachment not found');
        }
        $this->json(['data' => $this->toApiShape($record), 'meta' => [], 'errors' => []]);
    }

    /** DELETE /api/tickets/{id}/media/{mediaId} */
    public function delete(int $ticketId, int $mediaId): void
    {
        $callerRole = $_REQUEST['_callerRole'] ?? 'anonymous';
        if (!in_array($callerRole, ['staff', 'admin'], true)) {
            $this->error(403, 'FORBIDDEN', 'Staff or admin role required to delete attachments');
        }

        $record = $this->media->findById($mediaId);
        if ($record === null || $record->ticketId !== $ticketId) {
            $this->error(404, 'NOT_FOUND', 'Attachment not found');
        }

        $this->media->softDelete($mediaId);
        http_response_code(204);
        exit;
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private function toApiShape(Media $m): array
    {
        $baseUrl = defined('BASE_URL') ? rtrim(BASE_URL, '/') : '';
        $isImage = in_array($m->mimeType, self::IMAGE_MIME_TYPES, true);

        return [
            'id'           => $m->id,
            'ticketId'     => $m->ticketId,
            'filename'     => $m->filename,
            'originalName' => $m->originalName,
            'mimeType'     => $m->mimeType,
            'size'         => $m->size,
            'isImage'      => $isImage,
            'thumbnailUrl' => $m->thumbnailPath !== null ? $baseUrl . '/uploads/' . $m->thumbnailPath : null,
            'downloadUrl'  => $baseUrl . '/uploads/' . $m->path,
            'label'        => $m->label,
            'sourceUrl'    => $m->sourceUrl,
            'createdAt'    => $m->createdAt,
        ];
    }

    private function json(array $payload, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($payload, JSON_THROW_ON_ERROR);
        exit;
    }

    private function error(int $status, string $code, string $message): never
    {
        $this->json(['data' => null, 'meta' => [], 'errors' => [['field' => null, 'code' => $code, 'message' => $message]]], $status);
    }
}
```
  </action>
  <verify>
```bash
# PHP syntax check
php -l crm/src/Controllers/Api/TicketMediaController.php && echo "SYNTAX OK"

# Required class and methods present
grep -n 'class TicketMediaController' crm/src/Controllers/Api/TicketMediaController.php && echo "CLASS OK"
grep -n 'function upload' crm/src/Controllers/Api/TicketMediaController.php && echo "UPLOAD METHOD OK"
grep -n 'finfo_file\|new \\\\finfo\|FILEINFO_MIME_TYPE' crm/src/Controllers/Api/TicketMediaController.php && echo "MIME VALIDATION OK"
grep -n 'imagecopyresampled\|imagecreatefrom' crm/src/Controllers/Api/TicketMediaController.php && echo "THUMBNAIL OK"
grep -n "type.*upload\|'upload'" crm/src/Controllers/Api/TicketMediaController.php && echo "UPLOAD ACTION OK"
grep -n 'FILE_TOO_LARGE\|INVALID_FILE_TYPE\|ATTACHMENT_LIMIT' crm/src/Controllers/Api/TicketMediaController.php && echo "ERROR CODES OK"
```
  </verify>
  <done>
- `crm/src/Controllers/Api/TicketMediaController.php` exists and passes `php -l`
- `upload()` uses `finfo` magic bytes (not Content-Type header) for MIME detection
- Thumbnail generation uses `imagecopyresampled` for max 300×300px JPEG output for image MIME types
- `upload()` creates both a `media` record and an `actions` record (type=upload, payload.mediaIds)
- `delete()` enforces staff/admin role; performs soft-delete only
- Error codes match FRD F07: `FILE_TOO_LARGE`, `INVALID_FILE_TYPE`, `NOT_FOUND`, `FORBIDDEN`, `ATTACHMENT_LIMIT`
  </done>
</task>

<task type="auto">
  <name>Task 2: NotificationService (F8) with PHPMailer, dedup, retry, digest cron</name>
  <files>
    crm/src/Services/NotificationService.php
    crm/src/Console/DigestCronCommand.php
  </files>
  <action>
Create `crm/src/Services/NotificationService.php` in namespace `Services`.

**Dependencies (from TechArch §6.1):**
- `PHPMailer\PHPMailer\PHPMailer` (package: `phpmailer/phpmailer ^6.x`)
- `Repositories\TemplateRepository`
- `Repositories\NotificationLogRepository`
- `Repositories\DepartmentRepository`
- `Repositories\PersonRepository`
- `Repositories\TicketRepository`

**Configuration read from PHP constants (TechArch §6.7):**
```
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_TLS (bool), SMTP_FROM_ADDRESS, SMTP_FROM_NAME, BASE_URL
```

**Core method: send(string $templateSlug, string $to, array $vars, ?int $ticketId = null)**

FRD F08 Process steps:

1. Validate `$to` with `filter_var($to, FILTER_VALIDATE_EMAIL)`. If invalid, log warning to error_log and return (non-fatal per FRD F08 error states).
2. **Dedup check (FRD F08 validation — 60-second window):**
   Load recent log entry: `NotificationLogRepository::findRecentByRecipientAndTicket($to, $templateSlug, $ticketId, 60)`. If found with status='sent', return silently.
3. Fetch template: `TemplateRepository::findBySlug($templateSlug)`. If not found, log error to error_log; use fallback plain-text email with just the ticket URL.
4. **Template variable substitution:** Replace `{{key}}` placeholders in both `$template->subject` and `$template->body` using `$vars` array:
   ```php
   $body    = preg_replace_callback('/\{\{(\w+)\}\}/', fn($m) => $vars[$m[1]] ?? $m[0], $template->body);
   $subject = preg_replace_callback('/\{\{(\w+)\}\}/', fn($m) => $vars[$m[1]] ?? $m[0], $template->subject ?? '');
   ```
5. **Send via PHPMailer with retry (max 3, exponential backoff):**
   ```php
   $mail = new PHPMailer(true);
   $mail->isSMTP();
   $mail->Host        = SMTP_HOST;
   $mail->Port        = (int) SMTP_PORT;
   $mail->SMTPAuth    = !empty(SMTP_USER);
   $mail->Username    = SMTP_USER ?? '';
   $mail->Password    = SMTP_PASS ?? '';
   $mail->SMTPSecure  = SMTP_TLS ? PHPMailer::ENCRYPTION_STARTTLS : '';
   $mail->setFrom(SMTP_FROM_ADDRESS, SMTP_FROM_NAME ?? 'uReport');
   $mail->addAddress($to);
   $mail->Subject     = $subject;
   $mail->Body        = $body;
   $mail->isHTML(false); // plain text; HTML version is a future enhancement
   ```
   Retry loop up to 3 attempts with `sleep(2 ** $attempt)` backoff. On all-fail, set `$status = 'failed'` and `$errorMessage` = exception message.
6. **Log to notification_log:**
   ```
   notification_log.ticketId = $ticketId
   notification_log.templateSlug = $templateSlug
   notification_log.recipientEmail = $to
   notification_log.sentAt = NOW() (if sent)
   notification_log.status = 'sent' | 'failed'
   notification_log.attemptCount = actual attempt count
   notification_log.errorMessage = null | exception message
   ```
   Call `NotificationLogRepository::create($logData)`.

**sendDigest(int $departmentId) method (FRD F08 Process: Digest Email):**

1. Fetch all active staff in department: `PersonRepository::findWithFilters(['departmentId' => $departmentId, 'role' => 'staff', 'active' => true])`.
2. Fetch all open tickets in department (last 7 days opened OR still open): `TicketRepository::findByFilters(['departmentId' => $departmentId, 'status' => 'open'])`.
3. If no open tickets (count = 0), skip — FRD F08: "only sent if ≥ 1 open tickets".
4. Build `$vars` for the digest template: `['department' => $deptName, 'open_count' => count($tickets), 'ticket_list' => implode("\n", ...)]`.
5. For each staff member, fetch primary email from `contactMethods`; call `$this->send('digest_daily', $email, $vars, null)` (no ticketId for digest).

```php
<?php
declare(strict_types=1);
namespace Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;
use Repositories\TemplateRepository;
use Repositories\NotificationLogRepository;
use Repositories\PersonRepository;
use Repositories\DepartmentRepository;
use Repositories\TicketRepository;

class NotificationService
{
    public function __construct(
        private readonly TemplateRepository        $templates,
        private readonly NotificationLogRepository $notifLog,
        private readonly PersonRepository          $persons,
        private readonly DepartmentRepository      $departments,
        private readonly TicketRepository          $tickets,
    ) {}

    /**
     * Send a transactional notification email.
     * Non-fatal: logs errors, never throws.
     *
     * @param string   $templateSlug  One of: ticket_created, ticket_assigned, ticket_response, ticket_closed, ticket_merged
     * @param string   $to            Recipient email address
     * @param array    $vars          Template variable substitutions (['ticket_id' => 101, 'title' => '...'])
     * @param int|null $ticketId      For notification_log dedup (null for digest)
     */
    public function send(string $templateSlug, string $to, array $vars, ?int $ticketId = null): void
    {
        // 1. Validate email
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            error_log("[NotificationService] Invalid recipient email skipped: {$to}");
            return;
        }

        // 2. Dedup check (60-second window — FRD F08)
        if ($ticketId !== null && $this->notifLog->hasSentRecently($to, $templateSlug, $ticketId, 60)) {
            return; // Skip duplicate silently
        }

        // 3. Fetch template
        $template = $this->templates->findBySlug($templateSlug);
        [$subject, $body] = $template
            ? [$this->interpolate($template->subject ?? 'Notification', $vars), $this->interpolate($template->body, $vars)]
            : ['Notification', 'Please visit ' . (defined('BASE_URL') ? BASE_URL : '') . ' for updates.'];

        // 4–5. Send via PHPMailer with retry
        $status       = 'failed';
        $errorMessage = null;
        $attempts     = 0;

        for ($attempt = 0; $attempt < 3; $attempt++) {
            $attempts++;
            try {
                $mail = $this->buildMailer();
                $mail->addAddress($to);
                $mail->Subject = $subject;
                $mail->Body    = $body;
                $mail->send();
                $status = 'sent';
                break;
            } catch (PHPMailerException $e) {
                $errorMessage = $e->getMessage();
                if ($attempt < 2) {
                    sleep(2 ** $attempt); // 1s, 2s backoff
                }
            }
        }

        if ($status === 'failed') {
            error_log("[NotificationService] SMTP failed after {$attempts} attempts for {$to}: {$errorMessage}");
        }

        // 6. Log to notification_log (F8 schema surface)
        $this->notifLog->create([
            'ticketId'       => $ticketId,
            'templateSlug'   => $templateSlug,
            'recipientEmail' => $to,
            'sentAt'         => $status === 'sent' ? (new \DateTimeImmutable())->format('Y-m-d H:i:s') : null,
            'status'         => $status,
            'attemptCount'   => $attempts,
            'errorMessage'   => $errorMessage,
        ]);
    }

    /**
     * Send daily digest to all active staff in a department (FRD F08 Process: Digest Email).
     */
    public function sendDigest(int $departmentId): void
    {
        $dept = $this->departments->findById($departmentId);
        if ($dept === null || !$dept->active) {
            return;
        }

        $openTickets = $this->tickets->findByFilters(['departmentId' => $departmentId, 'status' => 'open'], 1, 500);
        $ticketRows  = $openTickets['rows'] ?? $openTickets;
        if (empty($ticketRows)) {
            return; // FRD F08: only send if ≥ 1 open tickets
        }

        $staffList = $this->persons->findWithFilters([
            'departmentId' => $departmentId,
            'active'       => true,
        ], 1, 200);
        $staffRows = $staffList['rows'] ?? $staffList;

        $ticketLines = array_map(
            fn($t) => "  #{$t->id}: {$t->title} (opened {$t->datetimeOpened})",
            $ticketRows
        );

        $vars = [
            'department'  => $dept->name,
            'open_count'  => (string) count($ticketRows),
            'ticket_list' => implode("\n", $ticketLines),
        ];

        foreach ($staffRows as $person) {
            // Get primary email from contactMethods (simplified: find first email contact)
            // In full implementation PersonRepository::findPrimaryEmail() would be used
            // For now use a method that can be added to PersonRepository in wave 3d
            $email = $this->getPrimaryEmail($person->id);
            if ($email !== null) {
                $this->send('digest_daily', $email, $vars, null);
            }
        }
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private function interpolate(string $text, array $vars): string
    {
        return preg_replace_callback(
            '/\{\{(\w+)\}\}/',
            fn($m) => $vars[$m[1]] ?? $m[0],
            $text
        );
    }

    private function buildMailer(): PHPMailer
    {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = defined('SMTP_HOST') ? SMTP_HOST : 'localhost';
        $mail->Port       = defined('SMTP_PORT') ? (int) SMTP_PORT : 1025;
        $mail->SMTPAuth   = defined('SMTP_USER') && SMTP_USER !== '';
        $mail->Username   = defined('SMTP_USER') ? SMTP_USER : '';
        $mail->Password   = defined('SMTP_PASS') ? SMTP_PASS : '';
        $mail->SMTPSecure = (defined('SMTP_TLS') && SMTP_TLS) ? PHPMailer::ENCRYPTION_STARTTLS : '';
        $mail->setFrom(
            defined('SMTP_FROM_ADDRESS') ? SMTP_FROM_ADDRESS : 'noreply@localhost',
            defined('SMTP_FROM_NAME')    ? SMTP_FROM_NAME    : 'uReport'
        );
        $mail->isHTML(false);
        return $mail;
    }

    private function getPrimaryEmail(int $personId): ?string
    {
        // Direct PDO query for primary email — avoids loading ContactMethodRepository
        // This is acceptable here because PersonRepository doesn't embed contact methods
        $pdo  = \Infrastructure\Database\PdoConnection::get();
        $stmt = $pdo->prepare(
            "SELECT value FROM contactMethods WHERE personId = :pid AND type = 'email' AND isPrimary = 1 LIMIT 1"
        );
        $stmt->execute(['pid' => $personId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? $row['value'] : null;
    }
}
```

---

Also add `hasSentRecently()` method stub note for `NotificationLogRepository` (the repository was scaffolded in Wave 1 — add this query method if not present):

In `crm/src/Repositories/NotificationLogRepository.php`, ensure this method exists (add if missing):
```php
public function hasSentRecently(string $email, string $slug, int $ticketId, int $withinSeconds): bool
{
    $stmt = $this->pdo->prepare(
        "SELECT COUNT(*) FROM notification_log
         WHERE recipientEmail = :email AND templateSlug = :slug AND ticketId = :tid
           AND status = 'sent' AND sentAt >= DATE_SUB(NOW(), INTERVAL :seconds SECOND)"
    );
    $stmt->execute(['email' => $email, 'slug' => $slug, 'tid' => $ticketId, 'seconds' => $withinSeconds]);
    return (int) $stmt->fetchColumn() > 0;
}

public function create(array $data): int
{
    $stmt = $this->pdo->prepare(
        'INSERT INTO notification_log (ticketId, templateSlug, recipientEmail, sentAt, status, attemptCount, errorMessage)
         VALUES (:ticketId, :templateSlug, :recipientEmail, :sentAt, :status, :attemptCount, :errorMessage)'
    );
    $stmt->execute([
        'ticketId'       => $data['ticketId'],
        'templateSlug'   => $data['templateSlug'],
        'recipientEmail' => $data['recipientEmail'],
        'sentAt'         => $data['sentAt'],
        'status'         => $data['status'],
        'attemptCount'   => $data['attemptCount'] ?? 1,
        'errorMessage'   => $data['errorMessage'],
    ]);
    return (int) $this->pdo->lastInsertId();
}
```

---

Create `crm/src/Console/DigestCronCommand.php` — CLI entry point for scheduled digest emails (FRD F08 Process: Digest Email, step 1):

```php
<?php
declare(strict_types=1);
namespace Console;

use Services\NotificationService;
use Repositories\DepartmentRepository;

/**
 * CLI cron entry point: php crm/console.php digest
 *
 * Scheduled via cron: 0 7 * * * php /var/www/html/crm/console.php digest
 */
class DigestCronCommand
{
    public function __construct(
        private readonly NotificationService  $notifier,
        private readonly DepartmentRepository $departments,
    ) {}

    public function execute(): void
    {
        $depts = $this->departments->findAll(activeOnly: true);
        foreach ($depts as $dept) {
            echo "[digest] Sending digest for department: {$dept->name} (id={$dept->id})\n";
            $this->notifier->sendDigest($dept->id);
        }
        echo "[digest] Done.\n";
    }
}
```
  </action>
  <verify>
```bash
# PHP syntax
php -l crm/src/Services/NotificationService.php && echo "NOTIF SYNTAX OK"
php -l crm/src/Console/DigestCronCommand.php && echo "DIGEST SYNTAX OK"

# Key structural checks
grep -n 'class NotificationService' crm/src/Services/NotificationService.php && echo "CLASS OK"
grep -n 'PHPMailer' crm/src/Services/NotificationService.php && echo "PHPMAILER OK"
grep -n 'hasSentRecently\|dedup\|60' crm/src/Services/NotificationService.php && echo "DEDUP OK"
grep -n 'interpolate\|preg_replace_callback' crm/src/Services/NotificationService.php && echo "TEMPLATE_VARS OK"
grep -n 'for.*attempt\|attempt < 3\|backoff\|sleep' crm/src/Services/NotificationService.php && echo "RETRY OK"
grep -n 'notifLog->create\|notification_log' crm/src/Services/NotificationService.php && echo "LOG OK"
grep -n 'sendDigest\|DigestCronCommand' crm/src/Console/DigestCronCommand.php && echo "DIGEST CMD OK"
```
  </verify>
  <done>
- `crm/src/Services/NotificationService.php` exists and passes `php -l`
- `send()` validates recipient email with `filter_var(FILTER_VALIDATE_EMAIL)` — skips silently on invalid
- Dedup check uses `NotificationLogRepository::hasSentRecently()` with 60-second window
- Template variable substitution uses `preg_replace_callback` with `{{key}}` pattern
- Retry loop: max 3 attempts with exponential backoff (`sleep(2 ** $attempt)`)
- All sends logged to `notification_log` with status, attemptCount, errorMessage
- `sendDigest()` skips departments with 0 open tickets
- `crm/src/Console/DigestCronCommand.php` iterates all active departments and calls `sendDigest()`
  </done>
</task>

<task type="auto">
  <name>Task 3: SlaService, MetricsCache, and ReportController with all 8 report endpoints (F9)</name>
  <files>
    crm/src/Services/SlaService.php
    crm/src/Infrastructure/Cache/MetricsCache.php
    crm/src/Controllers/Api/ReportController.php
  </files>
  <action>
**Step 1: Create `crm/src/Services/SlaService.php`** in namespace `Services`.

Computes SLA status per FRD F09 Process: SLA Calculation:
- `expectedCloseDate = datetimeOpened + (slaDays × 8 working hours)` (simplified: calendar days × 8h not business-hour-aware in MVP — FRD says "business days" but implementation note: use calendar days for MVP simplicity, same as legacy)
- Actually use `slaDays` as calendar days for MVP (matching legacy behavior): `expectedCloseDate = datetimeOpened + INTERVAL slaDays DAY`

```php
<?php
declare(strict_types=1);
namespace Services;

class SlaService
{
    /**
     * Compute SLA info for a ticket row.
     * @param  array{datetimeOpened: string, datetimeClosed: ?string, status: string} $ticket
     * @param  int|null $slaDays  From category.slaDays; null = no SLA configured
     * @return array{expectedCloseDate: string|null, status: 'on_time'|'late'|'no_sla', pctElapsed: float|null}
     */
    public function compute(array $ticket, ?int $slaDays): array
    {
        if ($slaDays === null || $slaDays <= 0) {
            return ['expectedCloseDate' => null, 'status' => 'no_sla', 'pctElapsed' => null];
        }

        $opened   = new \DateTimeImmutable($ticket['datetimeOpened']);
        $expected = $opened->modify("+{$slaDays} days");
        $now      = new \DateTimeImmutable();

        $comparisonPoint = ($ticket['status'] === 'closed' && !empty($ticket['datetimeClosed']))
            ? new \DateTimeImmutable($ticket['datetimeClosed'])
            : $now;

        $totalSeconds   = $expected->getTimestamp() - $opened->getTimestamp();
        $elapsedSeconds = $comparisonPoint->getTimestamp() - $opened->getTimestamp();
        $pctElapsed     = $totalSeconds > 0 ? round(($elapsedSeconds / $totalSeconds) * 100, 1) : null;

        $slaStatus = $comparisonPoint <= $expected ? 'on_time' : 'late';

        return [
            'expectedCloseDate' => $expected->format('Y-m-d'),
            'status'            => $slaStatus,
            'pctElapsed'        => $pctElapsed,
        ];
    }

    public function isOnTime(array $ticket, ?int $slaDays): bool
    {
        return $this->compute($ticket, $slaDays)['status'] === 'on_time';
    }
}
```

---

**Step 2: Create `crm/src/Infrastructure/Cache/MetricsCache.php`** in namespace `Infrastructure\Cache`.

In-memory TTL cache (PHP static array). If Redis is configured (`REDIS_HOST` constant defined), falls back to Redis. Default: in-memory only. 5-minute TTL for SLA metrics endpoint.

```php
<?php
declare(strict_types=1);
namespace Infrastructure\Cache;

class MetricsCache
{
    /** @var array<string, array{value: mixed, expiresAt: int}> */
    private static array $store = [];

    public function get(string $key): mixed
    {
        if (isset(self::$store[$key]) && self::$store[$key]['expiresAt'] > time()) {
            return self::$store[$key]['value'];
        }
        unset(self::$store[$key]);
        return null;
    }

    public function set(string $key, mixed $value, int $ttlSeconds = 300): void
    {
        self::$store[$key] = ['value' => $value, 'expiresAt' => time() + $ttlSeconds];
    }

    public function has(string $key): bool
    {
        return $this->get($key) !== null;
    }

    /** Invalidate a cache entry. */
    public function delete(string $key): void
    {
        unset(self::$store[$key]);
    }
}
```

---

**Step 3: Create `crm/src/Controllers/Api/ReportController.php`** in namespace `Controllers\Api`.

All 8 report endpoints from TechArch §4.3 Reporting + GET /api/metrics/sla:

```
GET /api/reports/activity         → ActivityReport shape (FRD F09 Outputs)
GET /api/reports/assignments      → AssignmentReport[] shape
GET /api/reports/categories       → category volume + SLA rates
GET /api/reports/departments      → department volume + resolution
GET /api/reports/staff-performance → per-staff response times
GET /api/reports/sla              → on-time/late breakdown by category
GET /api/reports/volume           → daily/weekly/monthly trends
GET /api/reports/open-age         → tickets open past SLA
GET /api/metrics/sla              → public, lightweight, cached 5 min
```

**Common filter parsing (FRD F09 Inputs):**
```
dateFrom  (ISO 8601, default: 30 days ago)
dateTo    (ISO 8601, default: today)
categoryId (optional int)
departmentId (optional int)
assigneeId (optional int)
format    ('json'|'csv', default: 'json')
```

**CSV export:** When `?format=csv`, stream `Content-Disposition: attachment; filename="report.csv"` response instead of JSON.

**auth check:** All report endpoints (except `metrics`) require `staff` or `admin` role.

**metrics endpoint:** Public, no auth required, cached 5 minutes using MetricsCache.

```php
<?php
declare(strict_types=1);
namespace Controllers\Api;

use Infrastructure\Cache\MetricsCache;
use Infrastructure\Database\PdoConnection;
use Services\SlaService;

class ReportController
{
    private readonly \PDO $pdo;

    public function __construct(
        private readonly MetricsCache $cache,
        private readonly SlaService   $sla,
    ) {
        $this->pdo = PdoConnection::get();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private function requireStaff(): void
    {
        $role = $_REQUEST['_callerRole'] ?? 'anonymous';
        if (!in_array($role, ['staff', 'admin'], true)) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode(['data' => null, 'meta' => [], 'errors' => [['field' => null, 'code' => 'FORBIDDEN', 'message' => 'Staff or admin role required for reports']]]);
            exit;
        }
    }

    private function filters(): array
    {
        $dateFrom = isset($_GET['dateFrom']) ? $_GET['dateFrom'] : date('Y-m-d', strtotime('-30 days'));
        $dateTo   = isset($_GET['dateTo'])   ? $_GET['dateTo']   : date('Y-m-d');
        return [
            'dateFrom'     => $dateFrom . ' 00:00:00',
            'dateTo'       => $dateTo   . ' 23:59:59',
            'categoryId'   => !empty($_GET['categoryId'])   ? (int) $_GET['categoryId']   : null,
            'departmentId' => !empty($_GET['departmentId']) ? (int) $_GET['departmentId'] : null,
            'assigneeId'   => !empty($_GET['assigneeId'])   ? (int) $_GET['assigneeId']   : null,
            'format'       => $_GET['format'] ?? 'json',
        ];
    }

    private function json(array $data, array $meta = []): never
    {
        header('Content-Type: application/json');
        echo json_encode(['data' => $data, 'meta' => $meta, 'errors' => []], JSON_THROW_ON_ERROR);
        exit;
    }

    private function csv(array $rows, string $filename, array $headers): never
    {
        header('Content-Type: text/csv');
        header("Content-Disposition: attachment; filename=\"{$filename}\"");
        $out = fopen('php://output', 'w');
        fputcsv($out, $headers);
        foreach ($rows as $row) { fputcsv($out, array_values($row)); }
        fclose($out);
        exit;
    }

    private function addFilters(\PDOStatement $stmt, array $f): void {} // no-op — binds are inline

    // ── report endpoints ──────────────────────────────────────────────────────

    /** GET /api/reports/activity — ActivityReport shape (FRD F09) */
    public function activity(): void
    {
        $this->requireStaff();
        $f = $this->filters();

        $stmt = $this->pdo->prepare(
            'SELECT
               COUNT(*) AS totalOpened,
               SUM(status = \'closed\') AS totalClosed,
               SUM(status = \'open\') AS openAtPeriodEnd
             FROM tickets
             WHERE datetimeOpened BETWEEN :from AND :to AND deletedAt IS NULL'
        );
        $stmt->execute(['from' => $f['dateFrom'], 'to' => $f['dateTo']]);
        $agg = $stmt->fetch(\PDO::FETCH_ASSOC);

        // by-day breakdown
        $stmt2 = $this->pdo->prepare(
            'SELECT DATE(datetimeOpened) AS date,
                    COUNT(*) AS opened,
                    SUM(status=\'closed\') AS closed
             FROM tickets
             WHERE datetimeOpened BETWEEN :from AND :to AND deletedAt IS NULL
             GROUP BY DATE(datetimeOpened)
             ORDER BY date ASC'
        );
        $stmt2->execute(['from' => $f['dateFrom'], 'to' => $f['dateTo']]);
        $byDay = $stmt2->fetchAll(\PDO::FETCH_ASSOC);

        $result = [
            'period'           => ['from' => substr($f['dateFrom'], 0, 10), 'to' => substr($f['dateTo'], 0, 10)],
            'totalOpened'      => (int) $agg['totalOpened'],
            'totalClosed'      => (int) $agg['totalClosed'],
            'openAtPeriodEnd'  => (int) $agg['openAtPeriodEnd'],
            'byDay'            => array_map(fn($r) => ['date' => $r['date'], 'opened' => (int) $r['opened'], 'closed' => (int) $r['closed']], $byDay),
        ];

        if ($f['format'] === 'csv') {
            $this->csv($byDay, 'activity-report.csv', ['date', 'opened', 'closed']);
        }
        $this->json($result);
    }

    /** GET /api/reports/assignments — AssignmentReport[] (FRD F09 Outputs) */
    public function assignments(): void
    {
        $this->requireStaff();
        $f = $this->filters();

        $stmt = $this->pdo->prepare(
            'SELECT t.personId AS assigneeId,
                    CONCAT(p.firstName, \' \', p.lastName) AS assigneeName,
                    SUM(t.status = \'open\')   AS open,
                    SUM(t.status = \'closed\') AS closed,
                    AVG(CASE WHEN t.datetimeClosed IS NOT NULL
                        THEN TIMESTAMPDIFF(DAY, t.datetimeOpened, t.datetimeClosed) END) AS avgDaysToClose
             FROM tickets t
             LEFT JOIN people p ON p.id = t.personId
             WHERE t.datetimeOpened BETWEEN :from AND :to AND t.deletedAt IS NULL
             GROUP BY t.personId, assigneeName
             ORDER BY closed DESC'
        );
        $stmt->execute(['from' => $f['dateFrom'], 'to' => $f['dateTo']]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $data = array_map(fn($r) => [
            'assigneeId'    => $r['assigneeId'] ? (int) $r['assigneeId'] : null,
            'assigneeName'  => $r['assigneeName'] ?? 'Unassigned',
            'open'          => (int) $r['open'],
            'closed'        => (int) $r['closed'],
            'avgDaysToClose'=> $r['avgDaysToClose'] !== null ? round((float) $r['avgDaysToClose'], 1) : null,
        ], $rows);

        if ($f['format'] === 'csv') {
            $this->csv($data, 'assignments-report.csv', ['assigneeId', 'assigneeName', 'open', 'closed', 'avgDaysToClose']);
        }
        $this->json($data);
    }

    /** GET /api/reports/categories — category volume + SLA rates */
    public function categories(): void
    {
        $this->requireStaff();
        $f = $this->filters();

        $stmt = $this->pdo->prepare(
            'SELECT t.categoryId,
                    c.name AS categoryName,
                    c.slaDays,
                    COUNT(*) AS total,
                    SUM(t.status = \'open\')   AS open,
                    SUM(t.status = \'closed\') AS closed
             FROM tickets t
             JOIN categories c ON c.id = t.categoryId
             WHERE t.datetimeOpened BETWEEN :from AND :to AND t.deletedAt IS NULL
             GROUP BY t.categoryId, c.name, c.slaDays
             ORDER BY total DESC'
        );
        $stmt->execute(['from' => $f['dateFrom'], 'to' => $f['dateTo']]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Compute SLA on-time/late per category using SlaService
        $data = array_map(function ($r) use ($f) {
            // Fetch closed tickets for this category in range to compute SLA
            $s2 = $this->pdo->prepare(
                'SELECT datetimeOpened, datetimeClosed, status FROM tickets
                 WHERE categoryId = :cid AND status = \'closed\'
                   AND datetimeOpened BETWEEN :from AND :to AND deletedAt IS NULL'
            );
            $s2->execute(['cid' => $r['categoryId'], 'from' => $f['dateFrom'], 'to' => $f['dateTo']]);
            $closed   = $s2->fetchAll(\PDO::FETCH_ASSOC);
            $onTime   = 0;
            $late     = 0;
            foreach ($closed as $t) {
                $slaInfo = $this->sla->compute($t, $r['slaDays'] ? (int) $r['slaDays'] : null);
                if ($slaInfo['status'] === 'on_time') $onTime++;
                elseif ($slaInfo['status'] === 'late') $late++;
            }
            $totalClosed = count($closed);
            return [
                'categoryId'   => (int) $r['categoryId'],
                'categoryName' => $r['categoryName'],
                'slaDays'      => $r['slaDays'] ? (int) $r['slaDays'] : null,
                'total'        => (int) $r['total'],
                'open'         => (int) $r['open'],
                'closed'       => (int) $r['closed'],
                'onTime'       => $onTime,
                'late'         => $late,
                'onTimePct'    => $totalClosed > 0 ? round($onTime / $totalClosed * 100, 1) : null,
            ];
        }, $rows);

        if ($f['format'] === 'csv') {
            $this->csv($data, 'categories-report.csv', ['categoryId', 'categoryName', 'slaDays', 'total', 'open', 'closed', 'onTime', 'late', 'onTimePct']);
        }
        $this->json($data);
    }

    /** GET /api/reports/departments — department volume + resolution */
    public function departments(): void
    {
        $this->requireStaff();
        $f = $this->filters();

        $stmt = $this->pdo->prepare(
            'SELECT t.departmentId,
                    d.name AS departmentName,
                    COUNT(*) AS total,
                    SUM(t.status = \'open\')   AS open,
                    SUM(t.status = \'closed\') AS closed,
                    AVG(CASE WHEN t.datetimeClosed IS NOT NULL
                        THEN TIMESTAMPDIFF(DAY, t.datetimeOpened, t.datetimeClosed) END) AS avgDaysToClose
             FROM tickets t
             JOIN departments d ON d.id = t.departmentId
             WHERE t.datetimeOpened BETWEEN :from AND :to AND t.deletedAt IS NULL
             GROUP BY t.departmentId, d.name
             ORDER BY total DESC'
        );
        $stmt->execute(['from' => $f['dateFrom'], 'to' => $f['dateTo']]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $data = array_map(fn($r) => [
            'departmentId'   => (int) $r['departmentId'],
            'departmentName' => $r['departmentName'],
            'total'          => (int) $r['total'],
            'open'           => (int) $r['open'],
            'closed'         => (int) $r['closed'],
            'avgDaysToClose' => $r['avgDaysToClose'] !== null ? round((float) $r['avgDaysToClose'], 1) : null,
        ], $rows);

        if ($f['format'] === 'csv') {
            $this->csv($data, 'departments-report.csv', ['departmentId', 'departmentName', 'total', 'open', 'closed', 'avgDaysToClose']);
        }
        $this->json($data);
    }

    /** GET /api/reports/staff-performance — per-staff response times */
    public function staffPerformance(): void
    {
        $this->requireStaff();
        $f = $this->filters();

        // Count responses posted (actions type=response) and avg response time
        $stmt = $this->pdo->prepare(
            'SELECT a.actorPersonId,
                    CONCAT(p.firstName, \' \', p.lastName) AS staffName,
                    COUNT(a.id) AS responseCount,
                    COUNT(DISTINCT a.ticketId) AS ticketsHandled
             FROM actions a
             JOIN people p ON p.id = a.actorPersonId
             WHERE a.type = \'response\'
               AND a.datetimeCreated BETWEEN :from AND :to
             GROUP BY a.actorPersonId, staffName
             ORDER BY responseCount DESC'
        );
        $stmt->execute(['from' => $f['dateFrom'], 'to' => $f['dateTo']]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $data = array_map(fn($r) => [
            'staffId'         => (int) $r['actorPersonId'],
            'staffName'       => $r['staffName'],
            'responseCount'   => (int) $r['responseCount'],
            'ticketsHandled'  => (int) $r['ticketsHandled'],
        ], $rows);

        if ($f['format'] === 'csv') {
            $this->csv($data, 'staff-performance-report.csv', ['staffId', 'staffName', 'responseCount', 'ticketsHandled']);
        }
        $this->json($data);
    }

    /** GET /api/reports/sla — on-time/late breakdown by category */
    public function sla(): void
    {
        $this->requireStaff();
        // Reuse same computation as metrics() but without cache, with date filters
        $f    = $this->filters();
        $data = $this->computeSlaMetrics($f['dateFrom'], $f['dateTo']);

        if ($f['format'] === 'csv') {
            $this->csv($data, 'sla-report.csv', ['categoryId', 'categoryName', 'totalClosed', 'onTime', 'late', 'onTimePct']);
        }
        $this->json($data);
    }

    /** GET /api/reports/volume — daily/weekly/monthly trends */
    public function volume(): void
    {
        $this->requireStaff();
        $f        = $this->filters();
        $grouping = $_GET['grouping'] ?? 'daily'; // daily | weekly | monthly

        $dateExpr = match ($grouping) {
            'weekly'  => "DATE_FORMAT(datetimeOpened, '%Y-W%u')",
            'monthly' => "DATE_FORMAT(datetimeOpened, '%Y-%m')",
            default   => 'DATE(datetimeOpened)',
        };

        $stmt = $this->pdo->prepare(
            "SELECT {$dateExpr} AS period,
                    COUNT(*) AS opened,
                    SUM(status = 'closed') AS closed
             FROM tickets
             WHERE datetimeOpened BETWEEN :from AND :to AND deletedAt IS NULL
             GROUP BY period
             ORDER BY period ASC"
        );
        $stmt->execute(['from' => $f['dateFrom'], 'to' => $f['dateTo']]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $data = array_map(fn($r) => ['period' => $r['period'], 'opened' => (int) $r['opened'], 'closed' => (int) $r['closed']], $rows);

        if ($f['format'] === 'csv') {
            $this->csv($data, 'volume-report.csv', ['period', 'opened', 'closed']);
        }
        $this->json($data);
    }

    /** GET /api/reports/open-age — tickets open past SLA */
    public function openAge(): void
    {
        $this->requireStaff();
        $f = $this->filters();

        $stmt = $this->pdo->prepare(
            'SELECT t.id, t.title, t.datetimeOpened, c.name AS categoryName, c.slaDays,
                    CONCAT(p.firstName, \' \', p.lastName) AS assigneeName
             FROM tickets t
             JOIN categories c ON c.id = t.categoryId
             LEFT JOIN people p ON p.id = t.personId
             WHERE t.status = \'open\' AND t.deletedAt IS NULL
               AND c.slaDays IS NOT NULL
               AND DATE_ADD(t.datetimeOpened, INTERVAL c.slaDays DAY) < NOW()
             ORDER BY t.datetimeOpened ASC
             LIMIT 500'
        );
        $stmt->execute();
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $data = array_map(fn($r) => [
            'ticketId'       => (int) $r['id'],
            'title'          => $r['title'],
            'categoryName'   => $r['categoryName'],
            'assigneeName'   => $r['assigneeName'] ?? 'Unassigned',
            'datetimeOpened' => $r['datetimeOpened'],
            'slaDays'        => (int) $r['slaDays'],
            'daysOverdue'    => (int) max(0, (new \DateTimeImmutable())->diff(new \DateTimeImmutable($r['datetimeOpened']))->days - (int) $r['slaDays']),
        ], $rows);

        if ($f['format'] === 'csv') {
            $this->csv($data, 'open-age-report.csv', ['ticketId', 'title', 'categoryName', 'assigneeName', 'datetimeOpened', 'slaDays', 'daysOverdue']);
        }
        $this->json($data);
    }

    /**
     * GET /api/metrics/sla — Public lightweight SLA % per category.
     * Response cached 5 minutes (MetricsCache) per FRD F09 Process: Metrics Endpoint.
     */
    public function metrics(): void
    {
        // Public endpoint — no role check required
        $cacheKey = 'sla_metrics_' . ($_GET['days'] ?? '30');
        $cached   = $this->cache->get($cacheKey);

        if ($cached !== null) {
            $this->json($cached);
        }

        $days    = min(365, max(1, (int) ($_GET['days'] ?? 30)));
        $dateFrom = date('Y-m-d H:i:s', strtotime("-{$days} days"));
        $dateTo   = date('Y-m-d H:i:s');

        $data = $this->computeSlaMetrics($dateFrom, $dateTo);
        $this->cache->set($cacheKey, $data, 300); // 5-minute cache
        $this->json($data);
    }

    // ── SLA metrics computation (shared by sla() + metrics()) ────────────────

    /**
     * Compute SLA metrics per category for a date range.
     * Returns SlaMetric[] shape from TechArch TypeScript §4.2.
     */
    private function computeSlaMetrics(string $dateFrom, string $dateTo): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT t.categoryId, c.name AS categoryName, c.slaDays,
                    t.datetimeOpened, t.datetimeClosed, t.status
             FROM tickets t
             JOIN categories c ON c.id = t.categoryId
             WHERE t.status = \'closed\'
               AND t.datetimeOpened BETWEEN :from AND :to
               AND t.deletedAt IS NULL
               AND c.slaDays IS NOT NULL'
        );
        $stmt->execute(['from' => $dateFrom, 'to' => $dateTo]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $byCategory = [];
        foreach ($rows as $row) {
            $cid = (int) $row['categoryId'];
            if (!isset($byCategory[$cid])) {
                $byCategory[$cid] = [
                    'categoryId'   => $cid,
                    'categoryName' => $row['categoryName'],
                    'totalClosed'  => 0,
                    'onTime'       => 0,
                    'late'         => 0,
                ];
            }
            $slaInfo = $this->sla->compute($row, (int) $row['slaDays']);
            $byCategory[$cid]['totalClosed']++;
            if ($slaInfo['status'] === 'on_time') $byCategory[$cid]['onTime']++;
            elseif ($slaInfo['status'] === 'late')  $byCategory[$cid]['late']++;
        }

        return array_values(array_map(function ($cat) {
            $cat['onTimePct'] = $cat['totalClosed'] > 0
                ? round($cat['onTime'] / $cat['totalClosed'] * 100, 1)
                : 0.0;
            return $cat;
        }, $byCategory));
    }
}
```
  </action>
  <verify>
```bash
# PHP syntax checks
php -l crm/src/Services/SlaService.php && echo "SLA SYNTAX OK"
php -l crm/src/Infrastructure/Cache/MetricsCache.php && echo "CACHE SYNTAX OK"
php -l crm/src/Controllers/Api/ReportController.php && echo "REPORT SYNTAX OK"

# Structural checks
grep -n 'class SlaService' crm/src/Services/SlaService.php && echo "SLA CLASS OK"
grep -n 'function compute' crm/src/Services/SlaService.php && echo "SLA COMPUTE OK"
grep -n "on_time.*late.*no_sla\|'no_sla'\|'on_time'\|'late'" crm/src/Services/SlaService.php && echo "SLA STATUS VALUES OK"

grep -n 'class MetricsCache' crm/src/Infrastructure/Cache/MetricsCache.php && echo "CACHE CLASS OK"
grep -n 'function get\|function set\|function has' crm/src/Infrastructure/Cache/MetricsCache.php && echo "CACHE METHODS OK"

grep -n 'class ReportController' crm/src/Controllers/Api/ReportController.php && echo "REPORT CLASS OK"
grep -n 'function activity\|function assignments\|function categories\|function departments' crm/src/Controllers/Api/ReportController.php && echo "REPORT METHODS 1-4 OK"
grep -n 'function staffPerformance\|function sla\|function volume\|function openAge\|function metrics' crm/src/Controllers/Api/ReportController.php && echo "REPORT METHODS 5-9 OK"
grep -n 'cache->get\|cache->set\|300\|5.*min\|MetricsCache' crm/src/Controllers/Api/ReportController.php && echo "METRICS CACHE OK"
grep -n 'format.*csv\|csv\|Content-Disposition' crm/src/Controllers/Api/ReportController.php && echo "CSV EXPORT OK"
grep -n 'requireStaff\|FORBIDDEN' crm/src/Controllers/Api/ReportController.php && echo "AUTH CHECK OK"
# metrics() should NOT call requireStaff (public endpoint)
grep -n 'function metrics' crm/src/Controllers/Api/ReportController.php | grep -v 'requireStaff' && echo "METRICS PUBLIC OK"
```
  </verify>
  <done>
- `SlaService::compute()` returns `['expectedCloseDate', 'status', 'pctElapsed']` with `status` = `on_time | late | no_sla`
- `MetricsCache` provides in-memory TTL cache with `get/set/has/delete` methods
- `ReportController` has exactly 9 public methods: `activity`, `assignments`, `categories`, `departments`, `staffPerformance`, `sla`, `volume`, `openAge`, `metrics`
- All 8 staff report methods call `requireStaff()` and return 403 for non-staff callers
- `metrics()` is public — no `requireStaff()` call
- `metrics()` uses `MetricsCache` with 300-second (5-minute) TTL
- All report endpoints support `?format=csv` returning `Content-Disposition: attachment`
- All three files pass `php -l` syntax check
  </done>
</task>

</tasks>

<verification>
```bash
# All 6 new files pass PHP syntax check
for f in crm/src/Controllers/Api/TicketMediaController.php \
          crm/src/Services/NotificationService.php \
          crm/src/Console/DigestCronCommand.php \
          crm/src/Services/SlaService.php \
          crm/src/Infrastructure/Cache/MetricsCache.php \
          crm/src/Controllers/Api/ReportController.php; do
  php -l "$f" && echo "OK: $f" || echo "FAIL: $f"
done

# Wave 1 contract artifacts consumed by this plan still present
grep -n 'class MediaRepository' crm/src/Repositories/MediaRepository.php && echo "CONTRACT: MediaRepository OK"
grep -n 'class ActionRepository' crm/src/Repositories/ActionRepository.php && echo "CONTRACT: ActionRepository OK"
grep -n 'class NotificationLogRepository' crm/src/Repositories/NotificationLogRepository.php && echo "CONTRACT: NotifLogRepo OK"
grep -n 'class TemplateRepository' crm/src/Repositories/TemplateRepository.php && echo "CONTRACT: TemplateRepo OK"

# Integration contract provides verified
grep -n 'class TicketMediaController' crm/src/Controllers/Api/TicketMediaController.php && echo "PROVIDES: TicketMediaController OK"
grep -n 'class NotificationService' crm/src/Services/NotificationService.php && echo "PROVIDES: NotificationService OK"
grep -n 'class ReportController' crm/src/Controllers/Api/ReportController.php && echo "PROVIDES: ReportController OK"
grep -n 'class SlaService' crm/src/Services/SlaService.php && echo "PROVIDES: SlaService OK"
grep -n 'class MetricsCache' crm/src/Infrastructure/Cache/MetricsCache.php && echo "PROVIDES: MetricsCache OK"
```
</verification>

<success_criteria>
- `TicketMediaController` implements all 4 endpoints; `upload()` validates MIME via `finfo` magic bytes, enforces size limit, generates 300×300 JPEG thumbnails for images, creates both media record and upload action
- `NotificationService::send()` dispatches PHPMailer SMTP emails using configured constants, substitutes `{{variable}}` template placeholders, deduplicates via `notification_log`, retries up to 3 times with exponential backoff
- `DigestCronCommand` iterates all active departments and calls `sendDigest()` per department; digest is skipped for departments with 0 open tickets
- `SlaService::compute()` returns correct `on_time | late | no_sla` status with `expectedCloseDate` and `pctElapsed`
- `ReportController` exposes all 9 endpoints; 8 staff endpoints enforce `staff/admin` role; `metrics` is public and cached 5 minutes
- All 6 files pass `php -l` PHP syntax check
- CSV export available on all report endpoints via `?format=csv`
</success_criteria>

<output>
After completion, create `.planning/express/modernize-the-ureport-legacy-php-crm-imp/08-SUMMARY.md` documenting:
- Files created and their key exported classes/methods
- Integration contracts fulfilled (media upload, notifications, reports)
- Any implementation decisions made (e.g., calendar-day SLA vs business-hours, in-memory MetricsCache vs Redis)
</output>
