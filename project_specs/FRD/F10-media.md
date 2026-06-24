---

## F10: Media / Attachment Upload and Thumbnail Caching

**Description:** Staff and (permission-permitted) public users can attach images and files to tickets. Uploaded media is stored on disk with an opaque internal filename. Image thumbnails are generated on first request and served from a cache directory. Media is listed on the ticket detail view and included in Open311 API responses as `media_url`. Every upload triggers an `upload_media` history entry.

---

### Terminology

- **internalFilename:** A UUID-based opaque filename assigned by the server on upload, used for secure file access.
- **filename:** The original human-readable filename as supplied by the uploader.
- **mime_type:** MIME type of the uploaded file (e.g., `image/jpeg`, `application/pdf`).
- **Thumbnail:** A resized version of an uploaded image, generated on first request and cached on disk.
- **media endpoint:** `GET /api/v1/media/{internalFilename}` — serves the original file. `GET /api/v1/media/{internalFilename}/thumbnail` — serves the thumbnail.
- **upload_media:** The system action type recorded in `ticketHistory` when files are attached.

---

### Sub-features

- Upload one or more files to a ticket
- Store file metadata in `media` table
- Generate and cache image thumbnails on first request
- Serve original and thumbnail files via media endpoint
- List all attachments on ticket detail
- Include media URL in Open311 API responses
- Record upload_media history entry on each upload
- Restrict upload by user role

---

### Process

#### Upload Media
1. Client POSTs multipart/form-data to `POST /api/v1/tickets/{ticketId}/media` with one or more file parts.
2. System validates caller has permission to upload to this ticket (staff always allowed; public/anonymous per category postingPermissionLevel).
3. System validates file count ≤ 10 per request; each file ≤ 20MB.
4. For each file:
   a. System generates a UUID-based `internalFilename` (e.g., `3f7c9b12-...jpg`).
   b. System saves file to `$MEDIA_STORAGE_PATH/{internalFilename}`.
   c. System inserts `media` row with `filename`, `internalFilename`, `mime_type`, `uploaded = NOW()`, `person_id`, `ticket_id`.
5. System appends a single `ticketHistory` entry with action `upload_media` and `data = { "mediaIds": [ids] }`.
6. Returns array of created media objects.

#### Serve Media File
1. Client GETs `/api/v1/media/{internalFilename}`.
2. System looks up `media` by `internalFilename`.
3. System validates caller's display permission for the ticket's category.
4. System streams file from `$MEDIA_STORAGE_PATH/{internalFilename}` with correct `Content-Type`.
5. If file not found on disk → 404.

#### Serve Thumbnail
1. Client GETs `/api/v1/media/{internalFilename}/thumbnail`.
2. System checks if thumbnail exists in `$THUMBNAIL_CACHE_PATH/{internalFilename}_thumb.jpg`.
3. If not cached: system generates thumbnail (max 200×200px, JPEG) from original file.
4. System saves thumbnail to cache path.
5. System streams thumbnail with `Content-Type: image/jpeg`.
6. If original is not an image → returns original file or 415 (Unsupported Media Type).

#### Delete Media
1. Staff DELETEs `/api/v1/tickets/{ticketId}/media/{mediaId}`.
2. System removes `media` row.
3. System deletes file from disk and thumbnail from cache if present.
4. System appends history entry with action `update` noting media deletion.

---

### Inputs

- Multipart form fields:
  - File binary data (one or more parts).
  - `ticket_id` (from URL path).
- Upload context: `person_id` from JWT (or null for anonymous/API submissions).

---

### Outputs

- **Media object:** id, ticket_id, filename, internalFilename, mime_type, uploaded (ISO 8601), person_id, url (constructed from base URL + internalFilename), thumbnailUrl.
- **Media list:** Array of media objects on ticket detail.
- **Open311 media_url:** URL string of first media item when responding to Open311 requests.

---

### Validation Rules

- File count per upload request: max 10 files.
- File size per file: max 20MB (configurable via `app.media.maxSizeMb`).
- Allowed MIME types (configurable, default): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`, `text/plain`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
- `internalFilename` must be unique (UUID generation effectively guarantees this).
- Caller must have at minimum the posting permission level for the ticket's category to upload.
- Files are served with appropriate `Content-Disposition: inline` or `attachment` header based on MIME type.
- Thumbnails are only generated for image/* MIME types.
- Thumbnail dimensions: max 200×200px, preserving aspect ratio.
- Disk storage path must be a mounted Docker volume (`/app/media`).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Ticket not found | 404 | TICKET_NOT_FOUND | "Ticket not found" |
| No files in upload | 422 | NO_FILE | "No files provided" |
| File exceeds size limit | 413 | FILE_TOO_LARGE | "File exceeds maximum allowed size" |
| Unsupported MIME type | 415 | UNSUPPORTED_MEDIA | "File type not allowed" |
| Too many files in one request | 422 | TOO_MANY_FILES | "Maximum 10 files per upload" |
| Media not found | 404 | MEDIA_NOT_FOUND | "Media not found" |
| File missing from disk | 404 | FILE_NOT_FOUND | "File data not found on server" |
| Permission denied for category | 403 | PERMISSION_DENIED | "Insufficient permission to upload to this ticket" |

---

### API Surface (this feature)

See full schemas in `Y1b-api-tickets.md §Media`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/tickets/{id}/media` | staff/public (per category) | Upload files to ticket |
| GET | `/api/v1/tickets/{id}/media` | staff/public (per category display) | List media for ticket |
| DELETE | `/api/v1/tickets/{id}/media/{mediaId}` | staff | Delete media item |
| GET | `/api/v1/media/{internalFilename}` | staff/public (per category display) | Serve file |
| GET | `/api/v1/media/{internalFilename}/thumbnail` | staff/public (per category display) | Serve thumbnail |

---

### Schema Surface (this feature)

Table: `media`. See `Y0a-schema-core.md §Media`.

Key columns: id (BIGSERIAL PK), ticket_id (FK tickets), filename (VARCHAR 255), internalFilename (VARCHAR 255 UNIQUE), mime_type (VARCHAR 100), uploaded (TIMESTAMPTZ DEFAULT NOW()), person_id (FK people, nullable).
