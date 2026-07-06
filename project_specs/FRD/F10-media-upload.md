---

## F10: Media / Photo Attachment Upload

**Priority:** P1 — High

### Description

Staff and public submitters can attach photos to tickets. Staff can also attach photos to individual action log entries. The modernized media handling supports multi-file upload with thumbnail preview during upload, a photo gallery on the case detail, and a lightbox viewer for full-size photo review. All existing media records and stored file paths are preserved from the MySQL migration.

### Terminology

- **internalFilename** — A system-generated filename used for on-disk storage (separate from the original filename). Stored in `media.internalFilename`.
- **Lightbox** — A full-screen modal overlay showing a full-resolution image with navigation between multiple attachments.
- **Thumbnail** — A small (e.g., 150×150 px) version of an uploaded image displayed in the gallery grid.
- **File storage path** — Files are stored on disk at a configurable base path. The path structure includes the ticket ID: `{mediaRoot}/{ticket_id}/{internalFilename}`. The same path structure is preserved from the PHP implementation.

### Sub-features

- Multi-file upload input (drag-and-drop on desktop, native picker on mobile)
- Upload at ticket creation (bundled with ticket POST)
- Upload attached to action log entry (POST /api/tickets/{id}/media)
- Thumbnail preview during upload with progress indicator
- Photo gallery grid on case detail (all media for ticket)
- Lightbox viewer (previous/next navigation between photos)
- Delete media with confirmation
- Public submission photo upload (see F2)

### Process — Upload at Case Creation (Staff)

1. On the New Case form (`/cases/new`), a drag-and-drop zone and file picker button are provided.
2. Staff selects or drops files; thumbnails preview in the upload zone.
3. On ticket submit: files are sent as multipart form fields alongside ticket data to `POST /api/tickets`.
4. System saves ticket; then processes each file:
   - Generates `internalFilename` (UUID + file extension).
   - Saves file to disk at `{mediaRoot}/{ticket_id}/{internalFilename}`.
   - Creates `media` record: `ticket_id`, `filename` (original), `internalFilename`, `mime_type`, `person_id = current user`.
5. Returns created ticket with `mediaCount` in response.

### Process — Upload to Existing Ticket / Action

1. Staff on case detail clicks "Attach Photo" in the media gallery panel or in the action log form.
2. File picker opens; staff selects files.
3. `POST /api/tickets/{id}/media` with `multipart/form-data` containing one or more files.
4. System processes each file (same steps as above).
5. System creates an `upload_media` action entry in `ticket_history` (see F9 §System Action Types).
6. Gallery refreshes with new thumbnails; toast "Photo attached".

### Process — View Gallery / Lightbox

1. Case detail renders a photo gallery grid showing thumbnails of all `media` records for the ticket.
2. Thumbnails are sorted by `media.uploaded ASC`.
3. Clicking a thumbnail opens the lightbox overlay showing the full-resolution image.
4. Lightbox has previous/next buttons to navigate between photos.
5. Each photo shows: filename, upload date, uploader name.
6. Lightbox can be closed via "×" button or pressing Escape.

### Process — Delete Media

1. Staff hovers over a thumbnail; a delete button appears.
2. Confirmation dialog: "Delete this photo? This cannot be undone."
3. On confirm: `DELETE /api/tickets/{id}/media/{mediaId}`.
4. System removes the `media` record from the database.
5. File on disk is also deleted.
6. Gallery refreshes; toast "Photo deleted".

### Inputs

| Field | Type | Required | Validation |
|---|---|---|---|
| `files` | file[] | [R] | Min 1 file per upload request |
| `ticket_id` | integer | [R] | Path param; must reference existing ticket |
| `mime_type` | string | auto-detected | Must be: `image/jpeg`, `image/png`, `image/gif` |

**File constraints:**
- Maximum file size: 10 MB per file
- Accepted MIME types: `image/jpeg`, `image/png`, `image/gif`
- Maximum files per upload request: 10
- MIME type is validated by reading file magic bytes (not trusting Content-Type header alone)

### Outputs

- `media` record(s) created with ID, ticket_id, filename, internalFilename, mime_type, uploaded, person_id
- `ticket_history` entry for `upload_media` action (on staff upload)
- Thumbnail URL returned in response: `/api/media/{mediaId}/thumbnail`
- Full-size URL: `/api/media/{mediaId}`

### Media URL Scheme

| URL | Description |
|---|---|
| `GET /api/media/{mediaId}` | Full-resolution original file (streaming) |
| `GET /api/media/{mediaId}/thumbnail` | 150×150 thumbnail (generated on first request, cached) |

Authentication: media URLs for tickets with `displayPermissionLevel = 'staff'` require JWT. Media for public/anonymous tickets may be served without auth.

### Validation Rules

- File size: max 10 MB per file; reject with 413 if exceeded.
- MIME type: must be `image/jpeg`, `image/png`, or `image/gif`; validated by magic bytes.
- File count per request: max 10.
- `ticket_id` must reference an existing ticket.
- User must be authenticated to upload to staff-only tickets.
- Public submission uploads: permitted without auth (ticket in public/anonymous posting category).

### Error States

| Scenario | HTTP Status | Message |
|---|---|---|
| File too large | 413 | "File exceeds maximum 10 MB size" |
| Unsupported MIME type | 415 | "Only JPEG, PNG, and GIF images are accepted" |
| Too many files | 400 | "Maximum 10 files per upload" |
| Ticket not found | 404 | "Case not found" |
| Disk write failure | 500 | "File storage error — contact administrator" |
| Media not found (DELETE) | 404 | "Photo not found" |

### API Surface

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/tickets/{id}/media` | JWT | Upload media to ticket |
| GET | `/api/tickets/{id}/media` | JWT* | List media for ticket |
| DELETE | `/api/tickets/{id}/media/{mediaId}` | JWT | Delete media |
| GET | `/api/media/{mediaId}` | JWT* | Serve full-resolution file |
| GET | `/api/media/{mediaId}/thumbnail` | JWT* | Serve thumbnail |

*Auth required for staff-only tickets; public tickets served without auth.

### Schema Surface

- `media` — core entity: ticket_id, filename, internalFilename, mime_type, uploaded, person_id
