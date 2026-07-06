## Epic 10: Media / Photo Attachment Upload (F10)

Staff and public submitters can attach photos to tickets and action log entries. The modernized media handling supports multi-file upload, thumbnail preview, a lightbox gallery viewer, and deletion — all preserving existing media records from migration.

---

### US-10.1: Attach Photos to a Ticket at Creation (Staff)
**As a** Marcus Rivera (311 Operator), **I want to** drag-and-drop or pick photos on the New Case form, **so that** I can attach photographic evidence provided by the caller at the time of ticket creation.

**Acceptance Criteria:**
- [ ] New Case form includes a drag-and-drop zone and file picker button
- [ ] Selected files show thumbnail previews and individual "remove" buttons
- [ ] Up to 10 files per upload; each must be ≤ 10 MB and JPEG/PNG/GIF (MIME validated by magic bytes)
- [ ] Files are bundled with the ticket creation POST request (multipart/form-data)
- [ ] System generates an `internalFilename` (UUID + extension) and saves file to `{mediaRoot}/{ticket_id}/{internalFilename}`
- [ ] A `media` record is created for each file: `ticket_id`, `filename`, `internalFilename`, `mime_type`, `person_id = current user`
- [ ] File exceeding 10 MB shows error "File exceeds maximum 10 MB size" (HTTP 413)
- [ ] Unsupported MIME type shows error "Only JPEG, PNG, and GIF images are accepted" (HTTP 415)

**Priority:** P1 | **Feature Ref:** F10

---

### US-10.2: Attach a Photo to an Existing Ticket from the Field
**As a** Diane Kowalski (Department Field Supervisor), **I want to** attach a completion photo to an existing ticket from my phone while still at the job site, **so that** the case record has photographic evidence of the resolution without waiting until I return to the office.

**Acceptance Criteria:**
- [ ] "Attach Photo" button is available in the media gallery panel on case detail
- [ ] On mobile, file input uses `accept="image/*" capture` for native camera/gallery access
- [ ] `POST /api/tickets/{id}/media` accepts one or more files via multipart/form-data
- [ ] System processes each file: validates MIME by magic bytes, saves to disk, creates `media` record
- [ ] An "upload_media" system action entry is created in `ticket_history` for each upload
- [ ] Gallery thumbnails refresh immediately after upload; toast "Photo attached" confirms success
- [ ] Disk write failure returns HTTP 500: "File storage error — contact administrator"

**Priority:** P1 | **Feature Ref:** F10

---

### US-10.3: View Photos in the Case Detail Lightbox
**As a** Marcus Rivera (311 Operator), **I want to** click a photo thumbnail to view it full-size in a lightbox with navigation arrows, **so that** I can review photographic evidence without opening a new browser tab.

**Acceptance Criteria:**
- [ ] Case detail media gallery shows thumbnails (150×150 px) of all attached media, sorted by `media.uploaded ASC`
- [ ] Clicking a thumbnail opens a lightbox modal showing the full-resolution image
- [ ] Lightbox has previous/next buttons for navigating between multiple photos
- [ ] Each photo in lightbox shows: filename, upload date, uploader name
- [ ] Lightbox can be closed via "×" button or pressing Escape
- [ ] Focus is trapped inside the lightbox while open (ARIA modal pattern)
- [ ] Thumbnail URLs served at `GET /api/media/{mediaId}/thumbnail`; full-size at `GET /api/media/{mediaId}`
- [ ] Auth required for staff-only ticket media; public ticket media served without auth

**Priority:** P1 | **Feature Ref:** F10

---

### US-10.4: Delete an Attached Photo with Confirmation
**As a** Marcus Rivera (311 Operator), **I want to** delete an attached photo with a confirmation dialog, **so that** I can remove incorrectly attached files without permanent accidental deletion.

**Acceptance Criteria:**
- [ ] Hovering over a thumbnail reveals a delete button (icon button)
- [ ] Clicking delete shows confirmation dialog: "Delete this photo? This cannot be undone."
- [ ] On confirm: `DELETE /api/tickets/{id}/media/{mediaId}` removes the database record and the file on disk
- [ ] Gallery refreshes after deletion; toast "Photo deleted" confirms success
- [ ] Media not found returns HTTP 404: "Photo not found"
- [ ] Only authenticated staff may delete media from staff-only tickets

**Priority:** P1 | **Feature Ref:** F10

---
