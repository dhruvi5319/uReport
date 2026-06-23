<?php
declare(strict_types=1);
namespace Controllers\Api;

use Repositories\MediaRepository;
use Repositories\ActionRepository;
use Repositories\TicketRepository;
use Domain\Media;
use Domain\Action;

/**
 * Handles media attachment operations for tickets.
 *
 * Routes (from TechArch §4.3, FRD F07):
 *   GET    /api/tickets/{id}/media               → list attachments
 *   POST   /api/tickets/{id}/media               → upload file (multipart/form-data)
 *   GET    /api/tickets/{id}/media/{mediaId}     → get attachment metadata
 *   DELETE /api/tickets/{id}/media/{mediaId}     → soft-delete (staff/admin only)
 */
class TicketMediaController
{
    /** Allowed MIME types — validated via finfo magic bytes (NOT Content-Type header) */
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf',
    ];

    /** Image MIME types that support thumbnail generation */
    private const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    /** MIME → file extension map for stored filename generation */
    private const MIME_EXT_MAP = [
        'image/jpeg'      => 'jpg',
        'image/png'       => 'png',
        'image/gif'       => 'gif',
        'image/webp'      => 'webp',
        'application/pdf' => 'pdf',
    ];

    public function __construct(
        private readonly TicketRepository $tickets,
        private readonly MediaRepository  $media,
        private readonly ActionRepository $actions,
    ) {}

    // ── Public route handlers ─────────────────────────────────────────────────

    /**
     * GET /api/tickets/{id}/media
     * Returns all non-deleted attachments for a ticket.
     */
    public function list(int $ticketId): void
    {
        $ticket = $this->tickets->findById($ticketId);
        if ($ticket === null) {
            $this->error(404, 'NOT_FOUND', 'Ticket not found');
        }

        $records = $this->media->findByTicketId($ticketId);
        $data    = array_map(fn($m) => $this->toApiShape($m), $records);

        $this->json(['data' => $data, 'meta' => ['total' => count($data)], 'errors' => []]);
    }

    /**
     * POST /api/tickets/{id}/media
     * Upload a file attachment. Validates MIME type via finfo magic bytes.
     * Generates 300×300 JPEG thumbnail for image types.
     * Creates both a media record and an upload action (F6 audit trail).
     */
    public function upload(int $ticketId): void
    {
        // 1. Verify ticket exists and is not deleted
        $ticket = $this->tickets->findById($ticketId);
        if ($ticket === null) {
            $this->error(404, 'NOT_FOUND', 'Ticket not found');
        }

        // 2. Validate file upload present and successful
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            $this->error(422, 'FILE_REQUIRED', 'A valid file upload is required');
        }

        // 3. File size validation (MAX_UPLOAD_SIZE constant or 10 MB default)
        $maxSize = defined('MAX_UPLOAD_SIZE') ? (int) MAX_UPLOAD_SIZE : 10485760;
        if ($_FILES['file']['size'] > $maxSize) {
            $this->error(422, 'FILE_TOO_LARGE', 'File exceeds maximum size of ' . ($maxSize / 1048576) . ' MB');
        }

        // 4. MIME type detection via finfo magic bytes (NOT Content-Type header — FRD F07)
        $finfo    = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($_FILES['file']['tmp_name']);

        // 5. Validate MIME type is in the allowed list
        if (!in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            $this->error(422, 'INVALID_FILE_TYPE', 'File type not allowed');
        }

        // 6. Attachment count limit (MAX_ATTACHMENTS_PER_TICKET constant or 20 default)
        $currentCount = $this->media->countByTicketId($ticketId);
        $maxAttach    = defined('MAX_ATTACHMENTS_PER_TICKET') ? (int) MAX_ATTACHMENTS_PER_TICKET : 20;
        if ($currentCount >= $maxAttach) {
            $this->error(422, 'ATTACHMENT_LIMIT', 'Maximum attachments per ticket reached');
        }

        // 7. Ensure upload root directory exists
        $uploadRoot = defined('UPLOAD_ROOT') ? UPLOAD_ROOT : sys_get_temp_dir() . '/ureport_uploads';
        if (!is_dir($uploadRoot)) {
            mkdir($uploadRoot, 0775, true);
        }

        // Generate unique stored filename: upload_{ticketId}_{uniqid}.{ext}
        $ext      = self::MIME_EXT_MAP[$mimeType] ?? 'bin';
        $filename = 'upload_' . $ticketId . '_' . uniqid('', true) . '.' . $ext;
        $destPath = $uploadRoot . '/' . $filename;
        $relPath  = $filename;
        $thumbPath = null;

        // 8. Move uploaded file to permanent storage
        if (!move_uploaded_file($_FILES['file']['tmp_name'], $destPath)) {
            $this->error(500, 'UPLOAD_FAILED', 'Failed to store uploaded file');
        }

        // 9. Generate thumbnail for image MIME types (max 300×300 JPEG, preserving aspect ratio)
        if (in_array($mimeType, self::IMAGE_MIME_TYPES, true)) {
            $thumbDir = $uploadRoot . '/thumbs';
            if (!is_dir($thumbDir)) {
                mkdir($thumbDir, 0775, true);
            }

            $thumbFilename = 'upload_' . $ticketId . '_' . uniqid('', true) . '_thumb.jpg';
            $thumbDest     = $thumbDir . '/' . $thumbFilename;

            $src = match ($mimeType) {
                'image/jpeg' => @imagecreatefromjpeg($destPath),
                'image/png'  => @imagecreatefrompng($destPath),
                'image/gif'  => @imagecreatefromgif($destPath),
                'image/webp' => @imagecreatefromwebp($destPath),
                default      => false,
            };

            if ($src !== false) {
                [$w, $h] = getimagesize($destPath);
                $maxDim  = 300;
                $scale   = min($maxDim / $w, $maxDim / $h, 1.0);
                $tw      = (int) round($w * $scale);
                $th      = (int) round($h * $scale);
                $thumb   = imagecreatetruecolor($tw, $th);
                imagecopyresampled($thumb, $src, 0, 0, 0, 0, $tw, $th, $w, $h);
                imagejpeg($thumb, $thumbDest, 85);
                imagedestroy($src);
                imagedestroy($thumb);
                $thumbPath = 'thumbs/' . $thumbFilename;
            }
        }

        // 10. Create Domain\Media record
        $label    = isset($_POST['label']) ? trim($_POST['label']) : null;
        $callerId = (int) ($_REQUEST['_callerId'] ?? 0) ?: null;

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

        // 11–12. Record upload action (F6 — immutable audit trail)
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

        // 13. Return 201 Created with media object
        http_response_code(201);
        $this->json(['data' => $this->toApiShape($saved), 'meta' => [], 'errors' => []]);
    }

    /**
     * GET /api/tickets/{id}/media/{mediaId}
     * Returns metadata for a single attachment.
     */
    public function show(int $ticketId, int $mediaId): void
    {
        $record = $this->media->findById($mediaId);
        if ($record === null || $record->ticketId !== $ticketId || $record->deletedAt !== null) {
            $this->error(404, 'NOT_FOUND', 'Attachment not found');
        }
        $this->json(['data' => $this->toApiShape($record), 'meta' => [], 'errors' => []]);
    }

    /**
     * DELETE /api/tickets/{id}/media/{mediaId}
     * Soft-deletes an attachment. Requires staff or admin role.
     */
    public function delete(int $ticketId, int $mediaId): void
    {
        // Verify staff/admin role (FRD F07 Process: Delete Attachment)
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

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Map a Domain\Media object to the API response shape.
     * Matches TechArch TypeScript Media interface §4.2.
     */
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

    /**
     * Emit a JSON response and terminate.
     */
    private function json(array $payload, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($payload, JSON_THROW_ON_ERROR);
        exit;
    }

    /**
     * Emit a JSON error envelope and terminate.
     */
    private function error(int $status, string $code, string $message): never
    {
        $this->json(
            ['data' => null, 'meta' => [], 'errors' => [['field' => null, 'code' => $code, 'message' => $message]]],
            $status
        );
    }
}
