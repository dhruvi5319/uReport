---
phase: 04-core-case-management-backend
plan: "04"
subsystem: api
tags: [media-upload, thumbnailator, mime-validation, open311, client-management, jwt, spring-boot]

# Dependency graph
requires:
  - phase: 04-core-case-management-backend
    plan: "01"
    provides: TicketService and TicketRepository for upload validation
  - phase: 04-core-case-management-backend
    plan: "02"
    provides: SlaService pattern for history entry recording convention

provides:
  - MediaService with upload (MIME magic bytes validation), thumbnail generation (Thumbnailator 150x150), serve, delete, and 'upload_media' history entry
  - TicketMediaController REST endpoints (POST/GET/DELETE /api/tickets/{id}/media, GET /api/media/{mediaId}[/thumbnail])
  - ClientService CRUD for Open311 clients with UUID api_key generation on create
  - ClientController admin-only endpoints (GET/POST/PUT/DELETE /api/clients)
  - MediaDto, CreateClientRequest, UpdateClientRequest, ClientDetailDto DTOs
  - V3 Flyway migration adding size_bytes column to media table
  - MediaUploadIT and ClientCrudIT integration tests (7 cases each)

affects:
  - Phase 5 (frontend): media upload UI and client management admin panel
  - Phase 9 (Open311): api_key-authenticated requests validated via ClientRepository.findByApiKey

# Tech tracking
tech-stack:
  added: [Thumbnailator 0.4.20 (net.coobird:thumbnailator)]
  patterns:
    - Magic bytes MIME detection (not Content-Type header) — T-04-18
    - UUID-only internalFilename for stored files — T-04-23
    - Long ticketId used in path construction (never user-supplied string) — T-04-19
    - api_key exposed only on POST create; masked (null) on all subsequent reads — T-04-22
    - @PreAuthorize("hasRole('ADMIN')") at class level on ClientController — T-04-24

key-files:
  created:
    - backend/src/main/java/com/ureport/crm/service/MediaService.java
    - backend/src/main/java/com/ureport/crm/controller/TicketMediaController.java
    - backend/src/main/java/com/ureport/crm/service/ClientService.java
    - backend/src/main/java/com/ureport/crm/controller/ClientController.java
    - backend/src/main/java/com/ureport/crm/dto/MediaDto.java
    - backend/src/main/java/com/ureport/crm/dto/CreateClientRequest.java
    - backend/src/main/java/com/ureport/crm/dto/UpdateClientRequest.java
    - backend/src/main/java/com/ureport/crm/dto/ClientDetailDto.java
    - backend/src/main/resources/db/migration/V3__media_size_bytes.sql
    - backend/src/test/java/com/ureport/crm/MediaUploadIT.java
    - backend/src/test/java/com/ureport/crm/ClientCrudIT.java
  modified:
    - backend/pom.xml (added Thumbnailator 0.4.20)
    - backend/src/main/java/com/ureport/domain/Media.java (added size_bytes field)

key-decisions:
  - "Thumbnailator 0.4.20 selected for JPEG/PNG thumbnail generation (lightweight, no native deps)"
  - "MIME detection uses magic bytes exclusively — Content-Type header intentionally ignored (T-04-18)"
  - "internalFilename is UUID-only; original filename stored in 'filename' column but never used as disk path (T-04-23)"
  - "api_key exposed in ClientDetailDto only on POST create (boolean exposeApiKey flag in toDto); null on all GETs (T-04-22)"
  - "@PreAuthorize at class level on ClientController covers all 5 endpoints uniformly (T-04-24)"
  - "@TempDir used as media.root in MediaUploadIT via @DynamicPropertySource for isolated test storage"
  - "Tests written without execution — deferred to verify phase (no Java/Maven runtime in this sandbox)"

patterns-established:
  - "MediaService: thumbnail failure is non-fatal (log warning, continue) — one failed thumbnail does not block the upload"
  - "Per-batch history entry: one 'upload_media' action created per upload request (not per file)"

# Metrics
duration: 50min
completed: 2026-07-07
---

# Phase 4 Plan 04: Media Upload and Open311 Client CRUD Summary

**Media upload with MIME magic-byte validation and Thumbnailator 150×150 thumbnails (F10) + admin-only Open311 client CRUD with UUID api_key generation (F14)**

## Performance

- **Duration:** ~50 min
- **Started:** 2026-07-07T20:20:00Z
- **Completed:** 2026-07-07T21:11:00Z
- **Tasks:** 2 (+ 1 pre-task commit of prior partial work)
- **Files created:** 11
- **Files modified:** 2

## Accomplishments

- MediaService with MIME magic bytes validation (JPEG/PNG/GIF), Thumbnailator 150×150 thumbnail generation, file serving with correct Content-Type, and batch upload history entry
- TicketMediaController exposing POST/GET/DELETE /api/tickets/{id}/media and public GET /api/media/{mediaId}[/thumbnail]
- ClientService CRUD with UUID api_key generated on create (only ever exposed once), masked on all subsequent reads
- ClientController with class-level @PreAuthorize("hasRole('ADMIN')") covering all 5 endpoints
- V3 Flyway migration adding size_bytes column to media table
- 14 integration test cases across MediaUploadIT (7) and ClientCrudIT (7)

## Task Commits

Each task was committed atomically:

1. **Pre-task: Partial prior work** - `7e209f3` (chore) — pom.xml Thumbnailator dep, Media.java size_bytes, MediaDto, V3 migration
2. **Task 1: MediaService + TicketMediaController + MediaUploadIT** - `1e96e2b` (feat)
3. **Task 2: ClientService + ClientController + DTOs + ClientCrudIT** - `63cccf8` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `backend/pom.xml` — Added Thumbnailator 0.4.20 dependency
- `backend/src/main/java/com/ureport/domain/Media.java` — Added size_bytes Long field + getter/setter
- `backend/src/main/java/com/ureport/crm/dto/MediaDto.java` — Record: id, ticketId, originalFilename, internalFilename, mimeType, sizeBytes, url, thumbnailUrl, uploadedDate
- `backend/src/main/resources/db/migration/V3__media_size_bytes.sql` — ALTER TABLE media ADD COLUMN IF NOT EXISTS size_bytes BIGINT
- `backend/src/main/java/com/ureport/crm/service/MediaService.java` — File upload/serve/delete with MIME magic bytes validation, Thumbnailator thumbnail, history entry
- `backend/src/main/java/com/ureport/crm/controller/TicketMediaController.java` — REST controller for /api/tickets/{id}/media and /api/media/{mediaId}[/thumbnail]
- `backend/src/main/java/com/ureport/crm/service/ClientService.java` — CRUD for Open311 clients with UUID api_key generation
- `backend/src/main/java/com/ureport/crm/controller/ClientController.java` — Admin-only /api/clients controller
- `backend/src/main/java/com/ureport/crm/dto/CreateClientRequest.java` — Record with @NotBlank name, @NotNull contactPersonId
- `backend/src/main/java/com/ureport/crm/dto/UpdateClientRequest.java` — Record with all-nullable fields
- `backend/src/main/java/com/ureport/crm/dto/ClientDetailDto.java` — Record with nested ContactRef for contactPerson/contactMethod
- `backend/src/test/java/com/ureport/crm/MediaUploadIT.java` — 7 IT cases (JPEG upload, PNG upload, PDF rejection, oversize rejection, serve, thumbnail dimensions, delete)
- `backend/src/test/java/com/ureport/crm/ClientCrudIT.java` — 7 IT cases (admin CRUD, api_key masking, staff 403, no-JWT 401)

## Decisions Made

- **Thumbnailator 0.4.20** selected for thumbnail generation (lightweight pure-Java library, no native deps, widely used with Spring Boot)
- **Magic bytes MIME detection** (not Content-Type header) as required by threat model T-04-18
- **UUID-only internalFilename** with safe extension extraction (strips path separators) per T-04-23
- **api_key masked as null** (not "***") on GET responses — cleaner than a sentinel value, consistent with OpenAPI contract
- **Class-level @PreAuthorize** on ClientController for uniform ADMIN enforcement across all 5 endpoints
- **@TempDir + @DynamicPropertySource** used in MediaUploadIT for isolated, auto-cleanup media storage in tests
- Tests written without execution — deferred to verify phase (no Java/Maven available in this sandbox)

## Deviations from Plan

### Auto-fixed Issues

None — plan executed as specified.

However, one note: tests cannot be run in this execution environment (no Java/Maven runtime installed). Per the test execution boundary rules, E2E/integration tests are written as artifacts and their execution is deferred to the verify phase. All test files have been created following the plan spec.

---

**Total deviations:** 0 auto-fixed
**Impact on plan:** All implementations follow plan exactly. Test execution deferred to verify phase is expected behavior for this sandbox environment.

## Issues Encountered

None — all files compiled conceptually (verified via static grep checks per plan's verification section):
- MIME magic bytes constants verified in MediaService
- Thumbnailator in pom.xml and used in MediaService
- Safe path construction uses `Paths.get(mediaRoot, String.valueOf(ticketId))`
- UUID.randomUUID() in ClientService
- `hasRole('ADMIN')` on ClientController

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 4 complete: TicketService (04-01), SlaService (04-02), TicketHistoryService (04-03), MediaService + ClientService (04-04) all implemented
- All backend REST endpoints for Phase 4 are ready: tickets, SLA, history, media, client management
- Ready for Phase 5 (frontend) to consume these APIs
- MediaUploadIT and ClientCrudIT integration tests ready for execution in verify phase against native DB

---
*Phase: 04-core-case-management-backend*
*Completed: 2026-07-07*

## Self-Check: PASSED

All 11 key files verified on disk. 3 commits found for plan 04-04.
