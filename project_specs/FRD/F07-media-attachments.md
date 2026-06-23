---

## F07: Media Attachments

**Description:** Tickets can have images and files attached to them — either uploaded by the constituent at submission time or added by staff during the resolution workflow. Attachments are stored with their metadata in the `media` table, displayed in the ticket detail view, and recorded in the audit trail as upload actions. The Open311 POST endpoint also accepts a `media_url` field pointing to a remote image.

**Terminology:**
- **Media Record:** The database record tracking a file attachment. Maps to `media` table.
- **Upload Action:** An `actions` record of type `upload` that references one or more media records.
- **Thumbnail:** A resized preview image generated server-side for image attachments (JPEG, PNG, GIF, WebP).
- **media_url:** The Open311 field allowing a remote image URL to be associated with a service request.
- **File Size Limit:** Configurable maximum upload size per file (default 10 MB).
- **Allowed Types:** Configurable list of permitted MIME types.

**Sub-features:**
- Upload image files (JPEG, PNG, GIF, WebP) to a ticket
- Upload non-image files (PDF and other document types) to a ticket
- Associate attachments with a specific action in the ticket history
- Generate and serve image thumbnails
- Provide download links for all attachment types
- Enforce configurable file size and MIME type limits
- Support `media_url` field from Open311 POST (store URL reference, not the file itself)
- Delete attachment (admin/staff with appropriate permission)

---

### F07 Process: Upload File

1. Staff or public user submits `POST /api/tickets/{id}/media` with `multipart/form-data`.
2. System validates file size ≤ configured `MAX_UPLOAD_SIZE` (default 10 MB).
3. System validates MIME type against allowed list.
4. System generates a unique filename and stores the file in the configured upload directory.
5. For image types (JPEG, PNG, GIF, WebP), system generates a thumbnail (max 300×300px, JPEG).
6. System creates a `media` record with `ticketId`, `filename`, `originalName`, `mimeType`, `size`, `thumbnailPath`.
7. System creates an `actions` record with `type = 'upload'`, `payload.mediaIds = [id]`.
8. System updates Solr index for the ticket.
9. System returns the media record with HTTP 201.

### F07 Process: Retrieve Attachments

1. Client requests `GET /api/tickets/{id}/media`.
2. System returns list of `media` records for the ticket.
3. Each record includes a signed URL or direct path for download/thumbnail.
4. Visibility enforcement: if ticket is staff-only category, caller must be staff/admin.

### F07 Process: Delete Attachment

1. Staff/admin requests `DELETE /api/tickets/{id}/media/{mediaId}`.
2. System verifies caller has staff or admin role.
3. System soft-deletes the `media` record (`deletedAt = NOW()`).
4. System does **not** remove the physical file immediately (garbage collection handles orphan cleanup).
5. System returns HTTP 204.

### F07 Process: Open311 media_url

1. Open311 POST request includes `media_url` field.
2. System stores the URL in `media` table as `sourceUrl`, `mimeType = 'external'`, without downloading the file.
3. Thumbnail is not generated for URL-referenced media.
4. Upload action is created referencing this media record.

---

### F07 Inputs

**Upload:**
- `file` (binary, required): The file content (`multipart/form-data`)
- `label` (string, optional, max 255): Human-readable label for the attachment

**Open311 URL reference:**
- `media_url` (string): Valid HTTP/HTTPS URL pointing to an image

---

### F07 Outputs

**Media object:**
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

---

### F07 Validation

- File size must not exceed `MAX_UPLOAD_SIZE` (configurable, default 10 MB)
- MIME type must be in `ALLOWED_MIME_TYPES` list (configurable; default: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`)
- `media_url` must be a valid absolute HTTP/HTTPS URL if provided
- Ticket must exist and not be deleted
- Caller must have posting permission for the ticket's category (see F10)
- Max attachments per ticket: configurable (default 20)

---

### F07 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| File exceeds size limit | 422 | FILE_TOO_LARGE | "File exceeds maximum size of 10 MB" |
| Disallowed MIME type | 422 | INVALID_FILE_TYPE | "File type not allowed" |
| Ticket not found | 404 | NOT_FOUND | "Ticket not found" |
| Attachment count limit reached | 422 | ATTACHMENT_LIMIT | "Maximum attachments per ticket reached" |
| Delete without permission | 403 | FORBIDDEN | "Staff or admin role required to delete attachments" |
| Invalid media_url | 422 | INVALID_URL | "media_url must be a valid HTTP/HTTPS URL" |

---

### F07 API Surface (this feature)

Full schemas: see `Y1a-api-tickets.md` §Media.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tickets/{id}/media` | Any (visibility-checked) | List ticket attachments |
| POST | `/api/tickets/{id}/media` | Any (role-checked) | Upload attachment |
| GET | `/api/tickets/{id}/media/{mediaId}` | Any (visibility-checked) | Get attachment metadata |
| DELETE | `/api/tickets/{id}/media/{mediaId}` | staff/admin | Delete attachment |

---

### F07 Schema Surface (this feature)

Table: `media`. See `Y0a-schema-core.md` §media.

Key columns:
- `id`, `ticketId` (FK → tickets), `filename`, `originalName`, `mimeType`, `size` (bytes)
- `path` (server file path), `thumbnailPath` (nullable), `sourceUrl` (nullable — for Open311 media_url)
- `label` (nullable), `deletedAt` (nullable), `createdAt`
- `isImage` (computed or stored boolean)
