---
phase: implement-the-full-ureport-modernization
plan: "05"
type: execute
wave: 2d
depends_on: [1, 2, 4]
files_modified:
  # Media (F10)
  - api/src/main/java/com/ureport/entity/Media.java
  - api/src/main/java/com/ureport/repository/MediaRepository.java
  - api/src/main/java/com/ureport/service/MediaService.java
  - api/src/main/java/com/ureport/controller/MediaController.java
  - api/src/main/java/com/ureport/config/MediaConfig.java
  # Bookmarks (F12)
  - api/src/main/java/com/ureport/entity/Bookmark.java
  - api/src/main/java/com/ureport/repository/BookmarkRepository.java
  - api/src/main/java/com/ureport/service/BookmarkService.java
  - api/src/main/java/com/ureport/controller/BookmarkController.java
  # API Clients (F13)
  - api/src/main/java/com/ureport/entity/Client.java
  - api/src/main/java/com/ureport/repository/ClientRepository.java
  - api/src/main/java/com/ureport/service/ClientService.java
  - api/src/main/java/com/ureport/controller/ClientController.java
  - api/src/main/java/com/ureport/util/ApiKeyHashUtil.java
  # Locations / Geo (F15)
  - api/src/main/java/com/ureport/entity/Location.java
  - api/src/main/java/com/ureport/entity/GeoCluster.java
  - api/src/main/java/com/ureport/entity/TicketGeoData.java
  - api/src/main/java/com/ureport/repository/LocationRepository.java
  - api/src/main/java/com/ureport/repository/GeoClusterRepository.java
  - api/src/main/java/com/ureport/repository/TicketGeoDataRepository.java
  - api/src/main/java/com/ureport/service/GeoService.java
  - api/src/main/java/com/ureport/controller/LocationController.java
  - api/src/main/java/com/ureport/scheduler/GeoClusterScheduler.java
  # Digest / Schedulers (F16)
  - api/src/main/java/com/ureport/service/NotificationService.java
  - api/src/main/java/com/ureport/scheduler/DigestNotificationScheduler.java
  - api/src/main/java/com/ureport/scheduler/AutoCloseScheduler.java
  - api/src/main/java/com/ureport/scheduler/AuditScheduler.java
  - api/src/main/java/com/ureport/config/SchedulerConfig.java
  - api/src/main/java/com/ureport/controller/AdminJobController.java
  # Metrics (F17)
  - api/src/main/java/com/ureport/service/MetricsService.java
  - api/src/main/java/com/ureport/controller/MetricsController.java
  # Response Templates (F20)
  - api/src/main/java/com/ureport/entity/ResponseTemplate.java
  - api/src/main/java/com/ureport/repository/ResponseTemplateRepository.java
  - api/src/main/java/com/ureport/service/ResponseTemplateService.java
  - api/src/main/java/com/ureport/controller/ResponseTemplateController.java
  # Tests
  - api/src/test/java/com/ureport/service/MediaServiceTest.java
  - api/src/test/java/com/ureport/service/BookmarkServiceTest.java
  - api/src/test/java/com/ureport/service/ClientServiceTest.java
  - api/src/test/java/com/ureport/service/GeoServiceTest.java
  - api/src/test/java/com/ureport/service/MetricsServiceTest.java
  - api/src/test/java/com/ureport/scheduler/DigestNotificationSchedulerTest.java
autonomous: true

features:
  implements: ["F10", "F12", "F13", "F15", "F16", "F17", "F20"]
  depends_on: ["F0", "F1", "F3", "F4", "F5", "F6", "F7", "F8", "F9"]
  enables: ["F2"]

must_haves:
  truths:
    - "Staff can upload a file to a ticket and it is stored on disk with a unique internal filename"
    - "GET /api/v1/media/{internalFilename}/thumbnail returns a generated thumbnail on first request and serves the cached version thereafter"
    - "Staff can create, list, and delete their own bookmarks; non-owner delete returns 403"
    - "POST /api/v1/clients generates and returns rawApiKey once; stored as SHA-256 lookup + BCrypt hash"
    - "Open311 POST /requests validates api_key using SHA-256 lookup then BCrypt verify against clients table"
    - "PATCH /api/v1/clients/{id} supports key rotation — new key takes effect immediately"
    - "Geo-cluster scheduler (nightly 2 AM) populates geoclusters and ticket_geodata tables"
    - "DigestNotificationScheduler (every 5 min) sends emails for ticketHistory rows with null sentNotifications"
    - "AutoCloseScheduler (nightly 1 AM) closes stale open tickets per category auto-close rules"
    - "AuditScheduler (weekly Sunday 3 AM) runs integrity checks and logs findings"
    - "GET /api/v1/metrics returns onTimePercentage for given category_id, numDays, effectiveDate"
    - "All 10 canned report endpoints under GET /api/v1/reports/{reportType} are accessible to staff"
    - "Response templates support CRUD; GET /api/v1/response-templates?action_id= filters by action"
  artifacts:
    - path: "api/src/main/java/com/ureport/service/MediaService.java"
      provides: "MediaService with upload(), serve(), thumbnail() methods"
      exports: ["MediaService", "upload", "serveFile", "thumbnail"]
    - path: "api/src/main/java/com/ureport/controller/MediaController.java"
      provides: "POST /api/v1/tickets/{id}/media, GET /api/v1/media/{filename}, GET /api/v1/media/{filename}/thumbnail"
    - path: "api/src/main/java/com/ureport/service/BookmarkService.java"
      provides: "BookmarkService CRUD with owner enforcement"
      exports: ["BookmarkService", "createBookmark", "listBookmarks", "deleteBookmark"]
    - path: "api/src/main/java/com/ureport/controller/BookmarkController.java"
      provides: "POST /api/v1/bookmarks, GET /api/v1/bookmarks, DELETE /api/v1/bookmarks/{id}"
    - path: "api/src/main/java/com/ureport/util/ApiKeyHashUtil.java"
      provides: "ApiKeyHashUtil with generateKey(), hashForLookup() (SHA-256), hashForStorage() (BCrypt), verify()"
      exports: ["ApiKeyHashUtil", "generateKey", "hashForLookup", "hashForStorage", "verify"]
    - path: "api/src/main/java/com/ureport/service/ClientService.java"
      provides: "ClientService CRUD + key generation/rotation + validation"
      exports: ["ClientService", "createClient", "validateApiKey", "rotateKey"]
    - path: "api/src/main/java/com/ureport/controller/ClientController.java"
      provides: "GET/POST /api/v1/clients, GET/PATCH/DELETE /api/v1/clients/{id}"
    - path: "api/src/main/java/com/ureport/service/GeoService.java"
      provides: "GeoService with address normalization and geo_point sync"
      exports: ["GeoService", "normalizeAddress", "syncGeoPoint"]
    - path: "api/src/main/java/com/ureport/scheduler/GeoClusterScheduler.java"
      provides: "GeoClusterScheduler @Scheduled nightly 2 AM rebuilding geoclusters + ticket_geodata"
    - path: "api/src/main/java/com/ureport/service/NotificationService.java"
      provides: "NotificationService with renderTemplate(), sendEmail(), updateSentNotifications()"
      exports: ["NotificationService", "renderTemplate", "sendEmail"]
    - path: "api/src/main/java/com/ureport/scheduler/DigestNotificationScheduler.java"
      provides: "DigestNotificationScheduler @Scheduled every 5 min"
    - path: "api/src/main/java/com/ureport/scheduler/AutoCloseScheduler.java"
      provides: "AutoCloseScheduler @Scheduled nightly 1 AM"
    - path: "api/src/main/java/com/ureport/scheduler/AuditScheduler.java"
      provides: "AuditScheduler @Scheduled weekly Sunday 3 AM"
    - path: "api/src/main/java/com/ureport/service/MetricsService.java"
      provides: "MetricsService with onTimePercentage() and 10 canned report queries"
      exports: ["MetricsService", "getOnTimePercentage", "getActivityReport", "getAssignmentsReport", "getCategoriesReport", "getStaffReport", "getSlaReport", "getVolumeReport"]
    - path: "api/src/main/java/com/ureport/controller/MetricsController.java"
      provides: "GET /api/v1/metrics, GET /api/v1/reports/{reportType}"
    - path: "api/src/main/java/com/ureport/service/ResponseTemplateService.java"
      provides: "ResponseTemplateService CRUD with action_id filter"
      exports: ["ResponseTemplateService", "createTemplate", "listTemplates", "updateTemplate", "deleteTemplate"]
    - path: "api/src/main/java/com/ureport/controller/ResponseTemplateController.java"
      provides: "GET/POST /api/v1/response-templates, GET/PUT/DELETE /api/v1/response-templates/{id}"
  key_links:
    - from: "MediaController.upload()"
      to: "TicketHistoryService.append()"
      via: "append upload_media history entry (action id=10)"
      pattern: "ticketHistoryService.append.*10"
    - from: "DigestNotificationScheduler"
      to: "ticketHistory.sentNotifications"
      via: "SELECT WHERE sentNotifications IS NULL → render → send → UPDATE sentNotifications"
      pattern: "sentNotifications.*IS NULL"
    - from: "AutoCloseScheduler"
      to: "TicketService.closeTicket()"
      via: "autoCloseIsActive=true AND lastModified < NOW()-slaDays → close with autoCloseSubstatus_id"
      pattern: "autoCloseIsActive.*slaDays"
    - from: "ApiKeyAuthenticationFilter (Wave 2a)"
      to: "ApiKeyHashUtil.verify()"
      via: "SHA-256 lookup on api_key_lookup column, then BCrypt verify on api_key_hash"
      pattern: "api_key_lookup.*api_key_hash"
    - from: "GeoClusterScheduler"
      to: "ticket_geodata"
      via: "nightly rebuild: assign cluster_id_0..6 per ticket lat/long"
      pattern: "cluster_id_0.*cluster_id_6"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "db/init/02-schema.sql"
      exports: ["media", "bookmarks", "clients", "locations", "geoclusters", "ticket_geodata", "responseTemplates", "ticketHistory", "categories", "tickets", "people", "peopleEmails"]
      verify: "grep -n 'CREATE TABLE media' db/init/02-schema.sql && grep -n 'CREATE TABLE bookmarks' db/init/02-schema.sql && grep -n 'api_key_hash' db/init/02-schema.sql && grep -n 'CREATE TABLE geoclusters' db/init/02-schema.sql && grep -n 'CREATE TABLE responseTemplates' db/init/02-schema.sql && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "api/src/main/java/com/ureport/service/TicketHistoryService.java"
      exports: ["TicketHistoryService.append"]
      verify: "grep -rn 'class TicketHistoryService' api/src/main/java/com/ureport/service/ && grep -n 'public.*append' api/src/main/java/com/ureport/service/TicketHistoryService.java && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "api/src/main/java/com/ureport/entity/Ticket.java"
      exports: ["Ticket"]
      verify: "grep -n '@Entity' api/src/main/java/com/ureport/entity/Ticket.java && grep -n 'class Ticket' api/src/main/java/com/ureport/entity/Ticket.java && echo CONTRACT_OK"
    - from_plan: "04"
      artifact: "api/src/main/java/com/ureport/service/CategoryService.java"
      exports: ["CategoryService", "findById", "autoCloseIsActive", "slaDays"]
      verify: "grep -n 'class CategoryService' api/src/main/java/com/ureport/service/CategoryService.java && grep -n 'autoClose' api/src/main/java/com/ureport/service/CategoryService.java && echo CONTRACT_OK"
    - from_plan: "04"
      artifact: "api/src/main/java/com/ureport/service/SubstatusService.java"
      exports: ["SubstatusService", "findDefaultForStatus"]
      verify: "grep -n 'class SubstatusService' api/src/main/java/com/ureport/service/SubstatusService.java && echo CONTRACT_OK"
  provides:
    - artifact: "api/src/main/java/com/ureport/service/MediaService.java"
      exports: ["MediaService"]
      shape: |
        @Service public class MediaService {
          MediaItem upload(Long ticketId, MultipartFile file, Integer personId);
          Resource serveFile(String internalFilename);
          Resource thumbnail(String internalFilename);
        }
      verify: "grep -n 'class MediaService' api/src/main/java/com/ureport/service/MediaService.java && grep -n 'upload' api/src/main/java/com/ureport/service/MediaService.java && echo CONTRACT_OK"
    - artifact: "api/src/main/java/com/ureport/util/ApiKeyHashUtil.java"
      exports: ["ApiKeyHashUtil", "generateKey", "hashForLookup", "hashForStorage", "verify"]
      shape: |
        @Component public class ApiKeyHashUtil {
          String generateKey();              // secure random UUID-based raw key
          String hashForLookup(String key);  // SHA-256 hex for api_key_lookup
          String hashForStorage(String key); // BCrypt for api_key_hash
          boolean verify(String rawKey, String lookupHash, String storageHash);
        }
      verify: "grep -n 'class ApiKeyHashUtil' api/src/main/java/com/ureport/util/ApiKeyHashUtil.java && grep -n 'hashForLookup' api/src/main/java/com/ureport/util/ApiKeyHashUtil.java && grep -n 'hashForStorage' api/src/main/java/com/ureport/util/ApiKeyHashUtil.java && echo CONTRACT_OK"
    - artifact: "api/src/main/java/com/ureport/service/ClientService.java"
      exports: ["ClientService", "validateApiKey"]
      shape: |
        @Service public class ClientService {
          ClientResponse createClient(CreateClientRequest req); // returns rawApiKey in response
          ClientResponse validateApiKey(String rawKey);          // SHA-256 lookup + BCrypt verify
          ClientResponse rotateKey(Integer clientId);            // returns new rawApiKey
        }
      verify: "grep -n 'class ClientService' api/src/main/java/com/ureport/service/ClientService.java && grep -n 'validateApiKey' api/src/main/java/com/ureport/service/ClientService.java && echo CONTRACT_OK"
    - artifact: "api/src/main/java/com/ureport/service/NotificationService.java"
      exports: ["NotificationService", "renderTemplate", "sendEmail"]
      shape: |
        @Service public class NotificationService {
          String renderTemplate(String template, Map<String,String> vars);
          void sendEmail(String to, String replyTo, String subject, String body);
          void processPendingNotifications(TicketHistory entry);
        }
      verify: "grep -n 'class NotificationService' api/src/main/java/com/ureport/service/NotificationService.java && grep -n 'renderTemplate' api/src/main/java/com/ureport/service/NotificationService.java && echo CONTRACT_OK"
    - artifact: "api/src/main/java/com/ureport/service/MetricsService.java"
      exports: ["MetricsService", "getOnTimePercentage", "getReport"]
      shape: |
        @Service public class MetricsService {
          MetricsResponse getOnTimePercentage(Integer categoryId, Integer numDays, LocalDate effectiveDate);
          ReportResponse getReport(String reportType, Map<String,String> params);
        }
      verify: "grep -n 'class MetricsService' api/src/main/java/com/ureport/service/MetricsService.java && grep -n 'getOnTimePercentage' api/src/main/java/com/ureport/service/MetricsService.java && echo CONTRACT_OK"
    - artifact: "api/src/main/java/com/ureport/service/ResponseTemplateService.java"
      exports: ["ResponseTemplateService", "listTemplates", "createTemplate"]
      shape: |
        @Service public class ResponseTemplateService {
          List<ResponseTemplateResponse> listTemplates(Integer actionId);
          ResponseTemplateResponse createTemplate(CreateResponseTemplateRequest req);
          ResponseTemplateResponse updateTemplate(Integer id, CreateResponseTemplateRequest req);
          void deleteTemplate(Integer id);
        }
      verify: "grep -n 'class ResponseTemplateService' api/src/main/java/com/ureport/service/ResponseTemplateService.java && grep -n 'listTemplates' api/src/main/java/com/ureport/service/ResponseTemplateService.java && echo CONTRACT_OK"
    - artifact: "api/src/main/java/com/ureport/service/BookmarkService.java"
      exports: ["BookmarkService", "createBookmark", "listBookmarks", "deleteBookmark"]
      shape: |
        @Service public class BookmarkService {
          BookmarkResponse createBookmark(Integer personId, CreateBookmarkRequest req);
          List<BookmarkResponse> listBookmarks(Integer personId);
          void deleteBookmark(Integer id, Integer personId); // throws PERMISSION_DENIED if not owner
        }
      verify: "grep -n 'class BookmarkService' api/src/main/java/com/ureport/service/BookmarkService.java && grep -n 'deleteBookmark' api/src/main/java/com/ureport/service/BookmarkService.java && echo CONTRACT_OK"
    - artifact: "api/src/main/java/com/ureport/service/GeoService.java"
      exports: ["GeoService", "normalizeAddress"]
      shape: |
        @Service public class GeoService {
          Location normalizeAddress(String address, String city, String state, String zip);
          void syncGeoPoint(Ticket ticket);
        }
      verify: "grep -n 'class GeoService' api/src/main/java/com/ureport/service/GeoService.java && echo CONTRACT_OK"
---

<objective>
Implement the remaining P1/P2 backend features for Wave 2d: Media upload and thumbnail caching
(F10), Bookmarks (F12), API client management (F13), Location/geo-cluster analysis with
scheduled rebuild (F15), Digest email notifications with three scheduled jobs (F16), Metrics
and reporting dashboard (F17), and Response templates (F20).

Purpose: These seven features complete the backend API surface. Wave 3c frontend (media
uploader, map view, bookmarks, metrics dashboard) and the Open311 api_key validation path
(Wave 2b, already built) both depend on services produced here.

Output:
- MediaController + MediaService (F10): file upload, disk storage, thumbnail generation, serve endpoints
- BookmarkController + BookmarkService (F12): CRUD with owner enforcement
- ClientController + ClientService + ApiKeyHashUtil (F13): dual-hash key generation, rotation, validation
- LocationController + GeoService + GeoClusterScheduler (F15): address registry, nightly geo-cluster rebuild
- NotificationService + DigestNotificationScheduler + AutoCloseScheduler + AuditScheduler (F16)
- MetricsController + MetricsService (F17): onTimePercentage + 10 canned reports
- ResponseTemplateController + ResponseTemplateService (F20): CRUD with action association
- Unit tests for all service classes (≥80% coverage target per NFR-9)
</objective>

<feature_dependencies>
Implements: F10 (Media upload, thumbnail caching, history entry, Open311 media_url),
            F12 (Bookmarks: CRUD, owner enforcement, staff-only),
            F13 (API clients: dual-hash key gen, rotation, Open311 api_key validation),
            F15 (Location/geo: canonical address registry, PostGIS geo-cluster nightly rebuild),
            F16 (Digest notifications: DigestNotificationScheduler, AutoCloseScheduler, AuditScheduler),
            F17 (Metrics: onTimePercentage, 10 canned reports),
            F20 (Response templates: CRUD, action_id association)
Depends on: F0/F1 (TicketService, TicketHistoryService.append() — from Wave 2a plan 02),
            F3/F4 (RBAC guards, JWT auth — from Wave 2a plan 02),
            F5/F7/F8/F9 (PersonService, CategoryService/SubstatusService, ActionService — from Wave 2c plan 04),
            DB schema Wave 1 (media, bookmarks, clients, locations, geoclusters, ticket_geodata,
            responseTemplates, ticketHistory.sentNotifications, peopleEmails.usedForNotifications,
            categories.autoCloseIsActive/slaDays/autoCloseSubstatus_id)
Enables: F2 (Open311 api_key validation path depends on ClientService.validateApiKey()),
         Wave 3c frontend (MediaUploader, TicketMapPage, BookmarksPage, MetricsDashboardPage, ReportsPage)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/implement-the-full-ureport-modernization/WAVE-SCHEDULE.md
@project_specs/TechArch-uReport.md   (Section 01: package structure; Section 02: DDL; Section 03: API)
@project_specs/FRD-uReport.md        (F10, F12, F13, F15, F16, F17, F20 feature sections)
@project_specs/PRD-uReport.md        (feature capabilities F10, F12, F13, F15, F16, F17, F20)
@project_specs/RTM-uReport.md        (traceability: TechArch components, test requirements)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Media, Bookmarks, API Clients (F10, F12, F13)</name>
  <files>
    api/src/main/java/com/ureport/entity/Media.java
    api/src/main/java/com/ureport/repository/MediaRepository.java
    api/src/main/java/com/ureport/service/MediaService.java
    api/src/main/java/com/ureport/controller/MediaController.java
    api/src/main/java/com/ureport/config/MediaConfig.java
    api/src/main/java/com/ureport/entity/Bookmark.java
    api/src/main/java/com/ureport/repository/BookmarkRepository.java
    api/src/main/java/com/ureport/service/BookmarkService.java
    api/src/main/java/com/ureport/controller/BookmarkController.java
    api/src/main/java/com/ureport/entity/Client.java
    api/src/main/java/com/ureport/repository/ClientRepository.java
    api/src/main/java/com/ureport/util/ApiKeyHashUtil.java
    api/src/main/java/com/ureport/service/ClientService.java
    api/src/main/java/com/ureport/controller/ClientController.java
    api/src/test/java/com/ureport/service/MediaServiceTest.java
    api/src/test/java/com/ureport/service/BookmarkServiceTest.java
    api/src/test/java/com/ureport/service/ClientServiceTest.java
  </files>
  <action>
Implement Media (F10), Bookmarks (F12), and API Client management (F13) in the Spring Boot
application rooted at `api/src/main/java/com/ureport/`.

---

### F10: Media / Attachment Upload and Thumbnail Caching

**Media.java** — JPA entity mapping to the `media` table from TechArch Section 02:
```sql
CREATE TABLE media (
    id                  BIGSERIAL PRIMARY KEY,
    ticket_id           BIGINT         NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    filename            VARCHAR(255)   NOT NULL,
    internalFilename    VARCHAR(255)   NOT NULL,
    mime_type           VARCHAR(100)   NOT NULL,
    uploaded            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    person_id           INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    CONSTRAINT uq_media_internal_filename UNIQUE (internalFilename)
);
```
Fields: id (Long), ticketId (Long), filename (String), internalFilename (String),
mime_type (String), uploaded (OffsetDateTime), personId (Integer).

**MediaRepository.java** — `JpaRepository<Media, Long>` with method:
- `List<Media> findByTicketId(Long ticketId)`
- `Optional<Media> findByInternalFilename(String internalFilename)`

**MediaConfig.java** — `@Configuration` reading `APP_MEDIA_PATH` env var (default `/app/media`)
and exposing `mediaPath()` bean. Also configure `spring.servlet.multipart.max-file-size` and
`spring.servlet.multipart.max-request-size` to 10MB each.

**MediaService.java** — `@Service` with:
```java
// Upload a file to a ticket
MediaItem upload(Long ticketId, MultipartFile file, Integer personId);
// Serve original file as Resource
Resource serveFile(String internalFilename);
// Serve cached thumbnail; generate on first request
Resource thumbnail(String internalFilename);
```

Upload logic (F10.1):
1. Validate ticket exists (load from TicketRepository).
2. Generate `internalFilename = UUID.randomUUID() + "." + extension`.
3. Write file bytes to `${APP_MEDIA_PATH}/${internalFilename}`.
4. Insert `media` row via MediaRepository.
5. Append `upload_media` history entry via `TicketHistoryService.append(ticketId, 10L, personId, null, null, null)` (action id=10 per seed data).
6. Return `MediaItem` DTO (id, ticket_id, filename, internalFilename, mime_type, uploaded, person_id, url, thumbnailUrl).

Thumbnail logic (F10.2):
- Thumbnail directory: `${APP_MEDIA_PATH}/thumbnails/`.
- Thumbnail filename: `thumb_${internalFilename}`.
- On first request: if thumbnail file does NOT exist, use `javax.imageio.ImageIO` to read the
  original, scale to max 200×200 preserving aspect ratio, write JPEG to thumbnail path.
- Always serve from thumbnail path.
- If mime_type is not an image (not `image/*`), return 404 (no thumbnail for non-images).

**MediaController.java** — REST controller:
```
POST   /api/v1/tickets/{id}/media        — upload file (per category postingPermissionLevel)
GET    /api/v1/tickets/{id}/media        — list media on ticket (per category displayPermissionLevel)
DELETE /api/v1/tickets/{id}/media/{mediaId} — delete media (staff only)
GET    /api/v1/media/{internalFilename}            — serve original file
GET    /api/v1/media/{internalFilename}/thumbnail  — serve thumbnail
```
- Upload: accept `@RequestParam("file") MultipartFile file`, call `mediaService.upload()`.
- Serve: set `Content-Type` from `media.mime_type`, return `InputStreamResource`.
- Delete: delete file from disk (original + thumbnail if exists), delete `media` row.
- Auth: `@PreAuthorize("hasRole('STAFF')")` on delete. Upload follows category permission (check
  category displayPermissionLevel >= caller role).

---

### F12: Bookmarks (Staff Saved Searches)

**Bookmark.java** — JPA entity mapping to `bookmarks` table:
```sql
CREATE TABLE bookmarks (
    id          SERIAL PRIMARY KEY,
    person_id   INTEGER         NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    type        VARCHAR(50)     NOT NULL DEFAULT 'search',
    name        VARCHAR(200)    NOT NULL,
    requestUri  VARCHAR(2048)   NOT NULL,
    createdAt   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
```
Fields: id (Integer), personId (Integer), type (String default "search"), name (String),
requestUri (String), createdAt (OffsetDateTime).

**BookmarkRepository.java** — `JpaRepository<Bookmark, Integer>` with:
- `List<Bookmark> findByPersonIdOrderByCreatedAtDesc(Integer personId)`

**BookmarkService.java** — `@Service`:
- `BookmarkResponse createBookmark(Integer personId, CreateBookmarkRequest req)` — insert bookmark linked to current staff user.
- `List<BookmarkResponse> listBookmarks(Integer personId)` — returns all bookmarks for the person ordered by createdAt DESC.
- `void deleteBookmark(Integer id, Integer personId)` — loads bookmark; if `bookmark.personId != personId` throws `PermissionDeniedException("PERMISSION_DENIED", "You do not have permission to delete this bookmark")`; otherwise deletes.

**BookmarkController.java** — `@RestController @PreAuthorize("hasRole('STAFF')")`:
```
POST   /api/v1/bookmarks        — create bookmark (body: {name, requestUri, type?})
GET    /api/v1/bookmarks        — list bookmarks for authenticated user
DELETE /api/v1/bookmarks/{id}   — delete bookmark (owner-only; 403 if not owner, 404 if not found)
```
Extract `personId` from `SecurityContextHolder` (set by JwtAuthenticationFilter in Wave 2a).

---

### F13: API Client Management

**Client.java** — JPA entity mapping to `clients` table:
```sql
CREATE TABLE clients (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(200)    NOT NULL,
    url                 VARCHAR(500),
    api_key_hash        VARCHAR(255)    NOT NULL,   -- BCrypt hash for secure storage
    api_key_lookup      VARCHAR(64)     NOT NULL,   -- SHA-256 hex for fast indexed lookup
    contactPerson_id    INTEGER         REFERENCES people(id) ON DELETE SET NULL,
    contactMethod_id    INTEGER         REFERENCES contactMethods(id) ON DELETE SET NULL,
    CONSTRAINT uq_clients_api_key_lookup UNIQUE (api_key_lookup)
);
```
Fields: id, name, url, apiKeyHash, apiKeyLookup, contactPersonId, contactMethodId.

**ClientRepository.java** — `JpaRepository<Client, Integer>` with:
- `Optional<Client> findByApiKeyLookup(String sha256Hex)` — fast indexed lookup for authentication.

**ApiKeyHashUtil.java** — `@Component`:
```java
// Generate a cryptographically secure raw API key (UUID-based, 36+ chars)
public String generateKey();

// SHA-256 hex of rawKey — stored in api_key_lookup for O(1) indexed find
public String hashForLookup(String rawKey);

// BCrypt hash of rawKey (cost=10) — stored in api_key_hash for secure storage
public String hashForStorage(String rawKey);

// Verify: first hashForLookup matches, then BCrypt check api_key_hash
public boolean verify(String rawKey, String storedLookup, String storedHash);
```
Use `java.security.MessageDigest` for SHA-256 (hex-encoded), `org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder` (cost 10) for BCrypt.

**ClientService.java** — `@Service`:
- `ClientCreatedResponse createClient(CreateClientRequest req)` — generate rawApiKey, compute lookup + hash, insert client row, return DTO with `rawApiKey` field populated (only time it is returned).
- `ClientResponse getClient(Integer id)` — return client details WITHOUT rawApiKey.
- `List<ClientResponse> listClients()` — return all clients.
- `ClientResponse updateClient(Integer id, UpdateClientRequest req)` — update name/url/contactPerson_id/contactMethod_id; does NOT change api_key unless caller explicitly requests rotation.
- `ClientCreatedResponse rotateKey(Integer id)` — generate new rawApiKey, update api_key_hash + api_key_lookup on the client row, return DTO with new `rawApiKey` (F13.3 key rotation; takes effect immediately).
- `void deleteClient(Integer id)` — hard delete.
- `Client validateApiKey(String rawKey)` — SHA-256 lookup → BCrypt verify; throws 403 if not found (used by ApiKeyAuthenticationFilter in Wave 2a, now wired to this service).

**ClientController.java** — `@RestController @PreAuthorize("hasRole('STAFF')")`:
```
GET    /api/v1/clients           — list clients
POST   /api/v1/clients           — create client (returns rawApiKey once)
GET    /api/v1/clients/{id}      — client detail (no rawApiKey)
PATCH  /api/v1/clients/{id}      — update or rotate key (if body includes rotateKey:true)
DELETE /api/v1/clients/{id}      — delete client
```

---

### Tests

**MediaServiceTest.java** — unit tests:
- `testUpload_storesFileAndCreatesMediaRow()` — mock TicketRepository, MediaRepository, TicketHistoryService; verify media row inserted and history appended with action_id=10.
- `testThumbnail_generatedOnFirstRequest()` — verify thumbnail created at expected path.
- `testThumbnail_servedFromCacheOnSecondRequest()` — verify ImageIO not called twice (use spy).
- Error: upload on non-existent ticket throws NotFoundException.

**BookmarkServiceTest.java** — unit tests:
- `testDeleteBookmark_ownerSucceeds()`.
- `testDeleteBookmark_nonOwnerThrowsPermissionDenied()` — verify 403 code.
- `testListBookmarks_returnsSortedByCreatedAt()`.

**ClientServiceTest.java** — unit tests:
- `testCreateClient_rawApiKeyInResponse()` — verify rawApiKey present, api_key_hash stored as BCrypt.
- `testRotateKey_changesLookupAndHash()` — verify old lookup no longer matches.
- `testValidateApiKey_invalidKey_throws403()`.
- `testValidateApiKey_validKey_returnsClient()`.
  </action>
  <verify>
find api/src/main/java/com/ureport/service/MediaService.java api/src/main/java/com/ureport/util/ApiKeyHashUtil.java api/src/main/java/com/ureport/service/ClientService.java api/src/main/java/com/ureport/service/BookmarkService.java -type f 2>&1 | grep -c "\.java" | grep -q "4" && echo FILES_EXIST &&
grep -n "class MediaService" api/src/main/java/com/ureport/service/MediaService.java &&
grep -n "upload" api/src/main/java/com/ureport/service/MediaService.java &&
grep -n "thumbnail" api/src/main/java/com/ureport/service/MediaService.java &&
grep -n "hashForLookup" api/src/main/java/com/ureport/util/ApiKeyHashUtil.java &&
grep -n "hashForStorage" api/src/main/java/com/ureport/util/ApiKeyHashUtil.java &&
grep -n "validateApiKey" api/src/main/java/com/ureport/service/ClientService.java &&
grep -n "deleteBookmark" api/src/main/java/com/ureport/service/BookmarkService.java &&
grep -n "PERMISSION_DENIED\|PermissionDenied" api/src/main/java/com/ureport/service/BookmarkService.java &&
echo TASK1_CHECKS_PASSED
  </verify>
  <done>
- Media.java, MediaRepository.java, MediaService.java, MediaController.java, MediaConfig.java exist
- MediaService.upload() stores file at ${APP_MEDIA_PATH}/{uuid}.{ext}, inserts media row, appends action_id=10 history
- MediaService.thumbnail() generates thumbnail on first request, caches at ${APP_MEDIA_PATH}/thumbnails/thumb_{internalFilename}
- GET /api/v1/media/{internalFilename} serves original; GET /api/v1/media/{internalFilename}/thumbnail serves thumbnail
- Bookmark.java, BookmarkRepository.java, BookmarkService.java, BookmarkController.java exist
- BookmarkService.deleteBookmark() throws PermissionDeniedException when caller is not owner
- Client.java, ClientRepository.java, ApiKeyHashUtil.java, ClientService.java, ClientController.java exist
- ApiKeyHashUtil.hashForLookup() uses SHA-256 hex; hashForStorage() uses BCrypt cost 10
- ClientService.createClient() returns rawApiKey once; ClientService.rotateKey() rotates immediately
- Unit tests pass for MediaService (upload + thumbnail), BookmarkService (owner enforcement), ClientService (key lifecycle)
  </done>
</task>

<feature_dependencies>
Implements: F10 (Media upload — MediaService, MediaController, Media entity),
            F12 (Bookmarks — BookmarkService owner enforcement, BookmarkController CRUD),
            F13 (API clients — ApiKeyHashUtil dual-hash, ClientService key lifecycle, ClientController)
Depends on: Wave 1 DB (media, bookmarks, clients tables),
            Wave 2a TicketHistoryService.append() (action_id=10 for upload_media history entry),
            Wave 2a JWT SecurityContext (personId extraction for bookmark ownership)
Enables: Open311 api_key validation (ClientService.validateApiKey() used by ApiKeyAuthenticationFilter),
         Wave 3c MediaUploader component and BookmarksPage
</feature_dependencies>

<task type="auto">
  <name>Task 2: Locations, Geo-Cluster Scheduler, Digest Notifications, Metrics, Response Templates (F15, F16, F17, F20)</name>
  <files>
    api/src/main/java/com/ureport/entity/Location.java
    api/src/main/java/com/ureport/entity/GeoCluster.java
    api/src/main/java/com/ureport/entity/TicketGeoData.java
    api/src/main/java/com/ureport/repository/LocationRepository.java
    api/src/main/java/com/ureport/repository/GeoClusterRepository.java
    api/src/main/java/com/ureport/repository/TicketGeoDataRepository.java
    api/src/main/java/com/ureport/service/GeoService.java
    api/src/main/java/com/ureport/controller/LocationController.java
    api/src/main/java/com/ureport/scheduler/GeoClusterScheduler.java
    api/src/main/java/com/ureport/service/NotificationService.java
    api/src/main/java/com/ureport/scheduler/DigestNotificationScheduler.java
    api/src/main/java/com/ureport/scheduler/AutoCloseScheduler.java
    api/src/main/java/com/ureport/scheduler/AuditScheduler.java
    api/src/main/java/com/ureport/config/SchedulerConfig.java
    api/src/main/java/com/ureport/controller/AdminJobController.java
    api/src/main/java/com/ureport/service/MetricsService.java
    api/src/main/java/com/ureport/controller/MetricsController.java
    api/src/main/java/com/ureport/entity/ResponseTemplate.java
    api/src/main/java/com/ureport/repository/ResponseTemplateRepository.java
    api/src/main/java/com/ureport/service/ResponseTemplateService.java
    api/src/main/java/com/ureport/controller/ResponseTemplateController.java
    api/src/test/java/com/ureport/service/GeoServiceTest.java
    api/src/test/java/com/ureport/service/MetricsServiceTest.java
    api/src/test/java/com/ureport/scheduler/DigestNotificationSchedulerTest.java
  </files>
  <action>
Implement Location/geo (F15), Digest notifications + schedulers (F16), Metrics (F17), and
Response templates (F20).

---

### F15: Location / Address Management and Geo-Cluster Analysis

**Location.java** — JPA entity for `locations` table:
```sql
CREATE TABLE locations (
    id          SERIAL PRIMARY KEY,
    address     VARCHAR(255)    NOT NULL,
    city        VARCHAR(100),
    state       VARCHAR(2),
    zip         VARCHAR(10),
    latitude    NUMERIC(9,6),
    longitude   NUMERIC(9,6),
    geo_point   GEOGRAPHY(POINT, 4326)
);
```
Fields: id (Integer), address (String), city, state, zip, latitude (BigDecimal), longitude (BigDecimal).
NOTE: `geo_point` is a PostGIS GEOGRAPHY column — map as `@Column(columnDefinition = "GEOGRAPHY(POINT, 4326)")` with type `org.locationtech.jts.geom.Point` (Hibernate Spatial) or store as a raw-column and populate via DB trigger only (the `tickets_geo_sync` trigger already handles tickets). For `locations` table, update geo_point in GeoService using a native JPQL update: `UPDATE locations SET geo_point = ST_MakePoint(:lon, :lat)::geography WHERE id = :id`.

**GeoCluster.java** — JPA entity for `geoclusters`:
```sql
CREATE TABLE geoclusters (
    id      BIGSERIAL PRIMARY KEY,
    level   SMALLINT               NOT NULL CHECK (level BETWEEN 0 AND 6),
    center  GEOGRAPHY(POINT, 4326) NOT NULL
);
```
Fields: id (Long), level (Short). Handle center as native column; use `@Column(columnDefinition = "GEOGRAPHY(POINT, 4326)")`.

**TicketGeoData.java** — JPA entity for `ticket_geodata`:
```sql
CREATE TABLE ticket_geodata (
    ticket_id    BIGINT PRIMARY KEY REFERENCES tickets(id) ON DELETE CASCADE,
    cluster_id_0 BIGINT REFERENCES geoclusters(id) ON DELETE SET NULL,
    ...
    cluster_id_6 BIGINT REFERENCES geoclusters(id) ON DELETE SET NULL
);
```
Fields: ticketId (Long PK), clusterId0 through clusterId6 (Long nullable).

**LocationRepository.java** — `JpaRepository<Location, Integer>` with:
- `Optional<Location> findByAddressAndCityAndStateAndZip(String address, String city, String state, String zip)` — deduplicate canonical addresses.

**GeoClusterRepository.java** — `JpaRepository<GeoCluster, Long>` with:
- `void deleteByLevel(Short level)` — clear all clusters for a given zoom level before rebuild.

**TicketGeoDataRepository.java** — `JpaRepository<TicketGeoData, Long>`.

**GeoService.java** — `@Service`:
- `Location normalizeAddress(String address, String city, String state, String zip)` — look up existing location by address+city+state+zip; if not found, create new Location row (latitude/longitude null until enriched; geo_point synced via native query). Returns the Location entity.
- `void syncGeoPoint(Location loc)` — if lat/long set, execute native query to set geo_point.
- `void assignTicketToLocation(Ticket ticket)` — if ticket has lat/long and no addressId, call normalizeAddress to create/find a Location and set ticket.addressId.

**LocationController.java** — `@RestController @PreAuthorize("hasRole('STAFF')")`:
```
GET  /api/v1/locations      — list locations (paginated, q param for address search)
GET  /api/v1/locations/{id} — location detail
POST /api/v1/locations      — create canonical location record
```

**GeoClusterScheduler.java** — `@Component`, `@Scheduled` nightly at 2 AM (cron = "0 0 2 * * ?"):
```java
@Scheduled(cron = "${app.scheduler.geo-cluster.cron:0 0 2 * * ?}")
public void rebuildGeoClusters() {
    // 1. Log start: [SCHEDULER] GeoClusterScheduler starting at {now}
    // 2. For zoom levels 0–6:
    //    a. DELETE from geoclusters WHERE level = zoomLevel
    //    b. SELECT DISTINCT tickets with lat/long
    //    c. K-means or grid-based spatial grouping at this zoom level:
    //       - Use a simple grid: bucket tickets into cells of size (180 / 2^level) degrees
    //       - Compute centroid of each non-empty cell
    //       - INSERT geoclusters row with level + center GEOGRAPHY
    //    d. For each ticket in cell, INSERT/UPDATE ticket_geodata.cluster_id_{level}
    // 3. Log completion: [SCHEDULER] GeoClusterScheduler completed in {ms}ms; {N} clusters at {M} levels
}
```
The spatial algorithm: use grid bucketing (each zoom level halves the cell size). For level 0:
cell size = 1 degree (~111km); level 6: cell size ~1.7km. Assign each geo-tagged ticket to the
cell at each zoom level; compute cell centroid as average lat/long; store as geoclusters.center
via native SQL `ST_MakePoint(avgLon, avgLat)::geography`.

Importantly: clear the entire level's geoclusters first (CASCADE deletes ticket_geodata rows for
that level via FK ON DELETE SET NULL), then rebuild fresh. Use `@Transactional`.

---

### F16: Digest Email Notifications

**NotificationService.java** — `@Service`:
```java
// Render action template variable substitution (reuses TemplateVariableResolver from Wave 2a)
String renderTemplate(String template, Map<String,String> vars);

// Send email via Spring JavaMailSender
void sendEmail(String to, String replyTo, String subject, String body);

// Process all pending notification history entries for a ticket
void processPendingNotifications(TicketHistory entry);
```
`processPendingNotifications` logic (F16.1):
1. Find all `peopleEmails` rows for the ticket's `reportedByPerson_id` where `usedForNotifications = true`.
2. For each email: look up `category_action_responses` for this ticket's `category_id` + `entry.action_id`; use its `template` if set, else fall back to `actions.template`.
3. Use `category_action_responses.replyEmail` if set, else `categories.notificationReplyEmail`.
4. Render template with `TemplateVariableResolver` (from Wave 2a).
5. Send email via `JavaMailSender`.
6. Collect all addressed emails into a comma-separated string.
7. Update `ticketHistory.sentNotifications = collectedEmails` via TicketHistoryRepository.

**DigestNotificationScheduler.java** — `@Component`:
```java
@Scheduled(fixedDelayString = "${app.scheduler.digest.delay-ms:300000}")
public void processDigestNotifications() {
    // 1. SELECT ticketHistory WHERE sentNotifications IS NULL (index: idx_history_sn_null)
    // 2. For each entry: call notificationService.processPendingNotifications(entry)
    // 3. Log: [SCHEDULER] DigestNotificationScheduler processed {N} entries
}
```

**AutoCloseScheduler.java** — `@Component`:
```java
@Scheduled(cron = "${app.scheduler.auto-close.cron:0 0 1 * * ?}")
public void autoCloseStaleTickets() {
    // 1. SELECT tickets WHERE status = 'open'
    //    AND category.autoCloseIsActive = true
    //    AND category.slaDays IS NOT NULL
    //    AND lastModified < NOW() - INTERVAL '${slaDays} days'
    // 2. For each ticket: close with category.autoCloseSubstatus_id
    //    using native query or TicketService.closeTicket() equivalent
    // 3. Append 'closed' history entry (action_id=3) with notes='Auto-closed by scheduler'
    // 4. Log: [SCHEDULER] AutoCloseScheduler closed {N} tickets
}
```
Use native JPQL: `SELECT t FROM Ticket t JOIN Category c ON t.categoryId = c.id WHERE t.status = 'open' AND c.autoCloseIsActive = true AND c.slaDays IS NOT NULL AND t.lastModified < :cutoff`.
Set cutoff per-ticket: `NOW() - slaDays days` (evaluate per category slaDays).

**AuditScheduler.java** — `@Component`:
```java
@Scheduled(cron = "${app.scheduler.audit.cron:0 0 3 * * SUN}")
public void auditDataIntegrity() {
    // Checks per F16.3 / RTM-F16.3:
    // 1. Closed tickets without closedDate → log count
    // 2. Tickets where substatus.status != tickets.status → log count
    // 3. Orphaned ticketHistory rows (no corresponding ticket) → log count (should be 0 due to CASCADE)
    // 4. Media rows where disk file missing → log count
    // 5. Staff people (role='staff') without username → log count
    // Log: [SCHEDULER] AuditScheduler completed at {now}: findings = {...}
}
```

**SchedulerConfig.java** — `@Configuration @EnableScheduling`:
```java
@Configuration
@EnableScheduling
public class SchedulerConfig {
    // No additional beans required — just enables @Scheduled support
}
```

**AdminJobController.java** — `@RestController @PreAuthorize("hasRole('STAFF')")`:
```
POST /api/v1/admin/jobs/digest-notifications/run  — trigger DigestNotificationScheduler manually
POST /api/v1/admin/jobs/auto-close/run             — trigger AutoCloseScheduler manually
POST /api/v1/admin/jobs/audit/run                  — trigger AuditScheduler manually
POST /api/v1/admin/jobs/geo-cluster/run            — trigger GeoClusterScheduler manually
```
Each endpoint calls the corresponding public scheduler method directly and returns 200 `{"status":"triggered"}`.

---

### F17: Metrics and Reporting Dashboard

**MetricsService.java** — `@Service`:

**onTimePercentage (F17.1):**
```java
MetricsResponse getOnTimePercentage(Integer categoryId, Integer numDays, LocalDate effectiveDate);
```
Logic: query tickets WHERE category_id = categoryId AND status = 'closed'
AND closedDate >= (effectiveDate - numDays days) AND closedDate <= effectiveDate.
Count total closed tickets in window. Count onTime = those where
`closedDate <= enteredDate + slaDays days` (from categories.slaDays).
Return: `{ category_id, categoryName, numDays, effectiveDate, onTimePercentage, closedCount, onTimeCount }`.

**10 Canned Reports (F17.2)** — `ReportResponse getReport(String reportType, Map<String,String> params)`:

| reportType | Query Logic |
|---|---|
| `activity` | Tickets opened + closed per day in date range (enteredDateFrom/To) |
| `assignments` | GROUP BY assignedPerson_id, COUNT tickets; join person name |
| `categories` | GROUP BY category_id, COUNT tickets; join category name |
| `staff` | Per staff person: tickets entered + assigned counts |
| `person` | All tickets for a specific person_id (reportedBy or assignedTo) |
| `sla` | Tickets grouped by onTime/late based on slaDays vs closedDate |
| `volume` | Ticket count per week/month in date range |
| `current` | Currently open tickets by category; include count + oldest ticket date |
| `opened` | Tickets opened in the given day/period (default: today) |
| `closed` | Tickets closed in the given day/period (default: today) |

All reports: `@PreAuthorize("hasRole('STAFF')")`. Return `{ reportType, generatedAt, data: [...] }`.

**MetricsController.java**:
```
GET /api/v1/metrics?category_id=&numDays=&effectiveDate=  — staff only
GET /api/v1/reports/{reportType}?startDate=&endDate=&...   — staff only
```
Valid reportType values: activity, assignments, categories, staff, person, sla, volume, current, opened, closed.
Return 400 `INVALID_REPORT_TYPE` for unknown reportType values.

---

### F20: Response Templates

**ResponseTemplate.java** — JPA entity for `responseTemplates` table:
```sql
CREATE TABLE responseTemplates (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200)    NOT NULL,
    template    TEXT            NOT NULL,
    action_id   INTEGER         REFERENCES actions(id) ON DELETE SET NULL
);
```
Fields: id (Integer), name (String), template (String), actionId (Integer nullable).

**ResponseTemplateRepository.java** — `JpaRepository<ResponseTemplate, Integer>` with:
- `List<ResponseTemplate> findByActionId(Integer actionId)`
- `List<ResponseTemplate> findAll()` (provided by JpaRepository)

**ResponseTemplateService.java** — `@Service`:
- `List<ResponseTemplateResponse> listTemplates(Integer actionId)` — if actionId provided, filter by actionId; else return all. Include actionName from actions join.
- `ResponseTemplateResponse createTemplate(CreateResponseTemplateRequest req)` — validate action_id exists if provided; insert.
- `ResponseTemplateResponse updateTemplate(Integer id, CreateResponseTemplateRequest req)` — update name/template/action_id; 404 if not found.
- `void deleteTemplate(Integer id)` — 404 if not found.

**ResponseTemplateController.java** — `@RestController @PreAuthorize("hasRole('STAFF')")`:
```
GET    /api/v1/response-templates              — list all (or ?action_id= to filter)
POST   /api/v1/response-templates              — create template
GET    /api/v1/response-templates/{id}         — template detail
PUT    /api/v1/response-templates/{id}         — update template
DELETE /api/v1/response-templates/{id}         — delete template
```

---

### Tests

**GeoServiceTest.java**:
- `testNormalizeAddress_createsNewLocation()` — verify new Location row created for unknown address.
- `testNormalizeAddress_returnsExistingLocation()` — verify dedup by address+city+state+zip.

**MetricsServiceTest.java**:
- `testGetOnTimePercentage_allOnTime()` — mock tickets all closed within slaDays → 100.0%.
- `testGetOnTimePercentage_noneOnTime()` — mock tickets all late → 0.0%.
- `testGetReport_invalidType_throws()` — verify 400 error code.
- `testGetReport_activity_returnsData()` — mock ticket data; verify response shape.

**DigestNotificationSchedulerTest.java**:
- `testProcessDigestNotifications_sendsEmailsAndUpdatesSentNotifications()` — mock TicketHistoryRepository returning entry with null sentNotifications; mock NotificationService; verify sentNotifications updated after send.
- `testProcessDigestNotifications_skipsEntriesWithSentNotifications()` — verify entries where sentNotifications IS NOT NULL are not reprocessed.
  </action>
  <verify>
find api/src/main/java/com/ureport/service/GeoService.java \
     api/src/main/java/com/ureport/scheduler/GeoClusterScheduler.java \
     api/src/main/java/com/ureport/service/NotificationService.java \
     api/src/main/java/com/ureport/scheduler/DigestNotificationScheduler.java \
     api/src/main/java/com/ureport/scheduler/AutoCloseScheduler.java \
     api/src/main/java/com/ureport/scheduler/AuditScheduler.java \
     api/src/main/java/com/ureport/service/MetricsService.java \
     api/src/main/java/com/ureport/service/ResponseTemplateService.java \
     -type f 2>&1 | grep -c "\.java" | grep -q "8" && echo FILES_EXIST &&
grep -n "class GeoClusterScheduler" api/src/main/java/com/ureport/scheduler/GeoClusterScheduler.java &&
grep -n "@Scheduled" api/src/main/java/com/ureport/scheduler/GeoClusterScheduler.java &&
grep -n "@Scheduled" api/src/main/java/com/ureport/scheduler/DigestNotificationScheduler.java &&
grep -n "@Scheduled" api/src/main/java/com/ureport/scheduler/AutoCloseScheduler.java &&
grep -n "@Scheduled" api/src/main/java/com/ureport/scheduler/AuditScheduler.java &&
grep -n "sentNotifications" api/src/main/java/com/ureport/scheduler/DigestNotificationScheduler.java &&
grep -n "autoCloseIsActive\|slaDays" api/src/main/java/com/ureport/scheduler/AutoCloseScheduler.java &&
grep -n "getOnTimePercentage" api/src/main/java/com/ureport/service/MetricsService.java &&
grep -n "getReport" api/src/main/java/com/ureport/service/MetricsService.java &&
grep -n "listTemplates" api/src/main/java/com/ureport/service/ResponseTemplateService.java &&
grep -n "@EnableScheduling" api/src/main/java/com/ureport/config/SchedulerConfig.java &&
echo TASK2_CHECKS_PASSED
  </verify>
  <done>
- Location.java, GeoCluster.java, TicketGeoData.java entities exist; LocationRepository, GeoClusterRepository, TicketGeoDataRepository exist
- GeoService.normalizeAddress() deduplicates locations by address+city+state+zip
- GeoClusterScheduler @Scheduled(cron nightly 2 AM) rebuilds geoclusters + ticket_geodata at zoom levels 0–6 using grid bucketing; logs [SCHEDULER] entries
- NotificationService.processPendingNotifications() reads usedForNotifications emails, resolves category_action_responses template, calls JavaMailSender, updates sentNotifications
- DigestNotificationScheduler @Scheduled(fixedDelay 5 min) queries ticketHistory WHERE sentNotifications IS NULL; processes each entry
- AutoCloseScheduler @Scheduled(cron nightly 1 AM) closes stale tickets per category autoCloseIsActive + slaDays + autoCloseSubstatus_id; appends closed history
- AuditScheduler @Scheduled(cron weekly Sunday 3 AM) runs 5 integrity checks and logs findings
- SchedulerConfig @EnableScheduling present; AdminJobController exposes manual trigger endpoints for all 4 jobs
- MetricsService.getOnTimePercentage() calculates onTimePercentage (closedDate <= enteredDate + slaDays)
- MetricsService.getReport() supports all 10 reportType values; returns 400 for unknown types
- MetricsController: GET /api/v1/metrics + GET /api/v1/reports/{reportType} staff-only
- ResponseTemplate.java entity, ResponseTemplateRepository, ResponseTemplateService CRUD with action_id filter
- ResponseTemplateController: full CRUD at /api/v1/response-templates staff-only
- Unit tests pass for GeoService (address dedup), MetricsService (onTime calculation), DigestNotificationScheduler (sentNotifications update)
  </done>
</task>

<feature_dependencies>
Implements: F15 (GeoService, GeoClusterScheduler nightly rebuild, LocationController, PostGIS geo_point),
            F16 (NotificationService, DigestNotificationScheduler, AutoCloseScheduler, AuditScheduler, SchedulerConfig),
            F17 (MetricsService with onTimePercentage + 10 canned reports, MetricsController),
            F20 (ResponseTemplateService CRUD + action_id filter, ResponseTemplateController)
Depends on: Wave 1 DB (locations, geoclusters, ticket_geodata, ticketHistory.sentNotifications,
            categories.autoCloseIsActive/slaDays/notificationReplyEmail,
            peopleEmails.usedForNotifications, responseTemplates tables),
            Wave 2a TicketHistoryService, TicketService (auto-close needs close logic),
            Wave 2a JWT auth (AdminJobController staff-only guard),
            Wave 2c CategoryService (autoCloseIsActive, slaDays, notificationReplyEmail fields),
            Wave 2c SubstatusService (autoCloseSubstatus_id lookup)
Enables: Wave 3c frontend (TicketMapPage with geo-clusters, MetricsDashboardPage/ReportsPage,
         BookmarksPage sidebar integration, ResponseTemplate picker on ticket response form)
</feature_dependencies>

</tasks>

<verification>
After both tasks complete, verify the full Wave 2d surface:

```bash
# 1. All service classes exist
find api/src/main/java/com/ureport/service/ -name "*.java" | sort | grep -E "(Media|Bookmark|Client|Geo|Notification|Metrics|ResponseTemplate)Service"

# 2. All scheduler classes exist and have @Scheduled annotations
grep -rn "@Scheduled" api/src/main/java/com/ureport/scheduler/

# 3. ApiKeyHashUtil dual-hash methods present
grep -n "hashForLookup\|hashForStorage\|generateKey" api/src/main/java/com/ureport/util/ApiKeyHashUtil.java

# 4. DigestNotificationScheduler queries sentNotifications IS NULL
grep -rn "sentNotifications" api/src/main/java/com/ureport/scheduler/DigestNotificationScheduler.java

# 5. AdminJobController exposes all 4 manual trigger endpoints
grep -n "geo-cluster\|digest-notifications\|auto-close\|audit" api/src/main/java/com/ureport/controller/AdminJobController.java

# 6. MetricsService covers all 10 report types
grep -n "activity\|assignments\|categories\|staff\|person\|sla\|volume\|current\|opened\|closed" api/src/main/java/com/ureport/service/MetricsService.java

# 7. Build compiles (requires Wave 2a + 2c classes to be present)
cd api && mvn compile -q && echo BUILD_OK

# 8. Unit tests pass
cd api && mvn test -pl . -q && echo TESTS_OK
```
</verification>

<success_criteria>
- All 7 features implemented: F10, F12, F13, F15, F16, F17, F20
- MediaService.upload() stores file, inserts media row, appends action_id=10 history entry
- MediaService.thumbnail() generates on first request, serves cached on subsequent requests
- BookmarkService.deleteBookmark() enforces owner-only rule (403 for non-owner)
- ApiKeyHashUtil uses SHA-256 for api_key_lookup (fast indexed find) and BCrypt cost=10 for api_key_hash (secure storage)
- ClientService.createClient() returns rawApiKey exactly once in response; rotateKey() is immediately effective
- GeoClusterScheduler runs nightly at 2 AM (configurable); rebuilds geoclusters + ticket_geodata for zoom levels 0–6
- DigestNotificationScheduler runs every 5 min (configurable); processes ticketHistory rows with null sentNotifications; updates sentNotifications after send
- AutoCloseScheduler runs nightly 1 AM (configurable); closes tickets per autoCloseIsActive + slaDays rule; appends closed history
- AuditScheduler runs weekly Sunday 3 AM (configurable); runs 5 integrity checks; logs all findings with [SCHEDULER] prefix
- AdminJobController exposes 4 manual trigger endpoints (digest, auto-close, audit, geo-cluster) at /api/v1/admin/jobs/{job}/run
- MetricsService.getOnTimePercentage() returns correct ratio using closedDate vs (enteredDate + slaDays) window
- All 10 canned report types return data in { reportType, generatedAt, data: [...] } shape
- ResponseTemplateService listTemplates() filters by action_id when provided; returns all when omitted
- SchedulerConfig has @EnableScheduling
- All integration_contracts.provides.verify commands exit 0
- Unit tests: MediaServiceTest, BookmarkServiceTest, ClientServiceTest, GeoServiceTest, MetricsServiceTest, DigestNotificationSchedulerTest all pass
</success_criteria>

<output>
After completion, create `.planning/express/implement-the-full-ureport-modernization/05-SUMMARY.md`
summarizing:
- Features implemented: F10, F12, F13, F15, F16, F17, F20
- Files created (service, controller, entity, repository, scheduler, config counts)
- Key behaviors: media upload path, thumbnail caching, ApiKeyHashUtil dual-hash, scheduler cron schedules, metrics logic
- Any deviations from TechArch spec (should be none)
- Test results: pass/fail counts
</output>
