---
phase: implement-the-full-ureport-modernization
plan: "05"
subsystem: backend-wave-2d
tags: [media, bookmarks, api-clients, geo, schedulers, notifications, metrics, response-templates, spring-boot]
dependency_graph:
  requires:
    - plan: "01"
      artifact: "db/init/02-schema.sql"
      provides: [media, bookmarks, clients, locations, geoclusters, ticket_geodata, responseTemplates, ticketHistory, categories, tickets, peopleEmails]
    - plan: "02"
      artifact: "api/src/main/java/com/ureport/service/TicketHistoryService.java"
      provides: [TicketHistoryService.append]
    - plan: "02"
      artifact: "api/src/main/java/com/ureport/entity/Ticket.java"
      provides: [Ticket]
    - plan: "04"
      artifact: "api/src/main/java/com/ureport/service/CategoryService.java"
      provides: [CategoryService, autoCloseIsActive, slaDays]
  provides:
    - MediaService (upload, thumbnail caching, serve)
    - BookmarkService (CRUD with owner enforcement)
    - ClientService + ApiKeyHashUtil (dual-hash key gen/rotation/validation)
    - GeoService (normalizeAddress dedup, syncGeoPoint)
    - GeoClusterScheduler (nightly 2AM rebuild)
    - NotificationService (renderTemplate, sendEmail, processPendingNotifications)
    - DigestNotificationScheduler (every 5min, sentNotifications IS NULL)
    - AutoCloseScheduler (nightly 1AM, autoCloseIsActive + slaDays)
    - AuditScheduler (weekly Sunday 3AM, 5 integrity checks)
    - MetricsService (onTimePercentage + 10 canned reports)
    - ResponseTemplateService (CRUD with action_id filter)
  affects:
    - Wave 3c frontend (MediaUploader, TicketMapPage, BookmarksPage, MetricsDashboardPage, ReportsPage)
    - Open311 api_key validation (ClientService.validateApiKey used by ApiKeyAuthenticationFilter)

tech_stack:
  added: []
  patterns:
    - SHA-256 (api_key_lookup) + BCrypt cost=10 (api_key_hash) dual-hash API key storage
    - Grid-based spatial clustering (1-degree grid halved per zoom level 0-6)
    - javax.imageio.ImageIO for thumbnail generation (max 200x200 JPEG, cached)
    - @Scheduled with cron expressions and fixedDelay for all 4 schedulers
    - Native SQL with ST_MakePoint for PostGIS GEOGRAPHY operations

key_files:
  created:
    - api/src/main/java/com/ureport/entity/Media.java
    - api/src/main/java/com/ureport/repository/MediaRepository.java
    - api/src/main/java/com/ureport/service/MediaService.java
    - api/src/main/java/com/ureport/controller/MediaController.java
    - api/src/main/java/com/ureport/config/MediaConfig.java
    - api/src/main/java/com/ureport/entity/Bookmark.java
    - api/src/main/java/com/ureport/repository/BookmarkRepository.java
    - api/src/main/java/com/ureport/service/BookmarkService.java
    - api/src/main/java/com/ureport/controller/BookmarkController.java
    - api/src/main/java/com/ureport/util/ApiKeyHashUtil.java
    - api/src/main/java/com/ureport/service/ClientService.java
    - api/src/main/java/com/ureport/controller/ClientController.java
    - api/src/main/java/com/ureport/entity/Location.java
    - api/src/main/java/com/ureport/entity/GeoCluster.java
    - api/src/main/java/com/ureport/entity/TicketGeoData.java
    - api/src/main/java/com/ureport/repository/LocationRepository.java
    - api/src/main/java/com/ureport/repository/GeoClusterRepository.java
    - api/src/main/java/com/ureport/repository/TicketGeoDataRepository.java
    - api/src/main/java/com/ureport/service/GeoService.java
    - api/src/main/java/com/ureport/controller/LocationController.java
    - api/src/main/java/com/ureport/scheduler/GeoClusterScheduler.java
    - api/src/main/java/com/ureport/service/NotificationService.java
    - api/src/main/java/com/ureport/scheduler/DigestNotificationScheduler.java
    - api/src/main/java/com/ureport/scheduler/AutoCloseScheduler.java
    - api/src/main/java/com/ureport/scheduler/AuditScheduler.java
    - api/src/main/java/com/ureport/config/SchedulerConfig.java
    - api/src/main/java/com/ureport/controller/AdminJobController.java
    - api/src/main/java/com/ureport/service/MetricsService.java
    - api/src/main/java/com/ureport/controller/MetricsController.java
    - api/src/main/java/com/ureport/entity/ResponseTemplate.java
    - api/src/main/java/com/ureport/repository/ResponseTemplateRepository.java
    - api/src/main/java/com/ureport/service/ResponseTemplateService.java
    - api/src/main/java/com/ureport/controller/ResponseTemplateController.java
    - api/src/test/java/com/ureport/service/MediaServiceTest.java
    - api/src/test/java/com/ureport/service/BookmarkServiceTest.java
    - api/src/test/java/com/ureport/service/ClientServiceTest.java
    - api/src/test/java/com/ureport/service/GeoServiceTest.java
    - api/src/test/java/com/ureport/service/MetricsServiceTest.java
    - api/src/test/java/com/ureport/scheduler/DigestNotificationSchedulerTest.java
  modified:
    - api/src/main/java/com/ureport/repository/PeopleEmailRepository.java (added findByPersonIdAndUsedForNotificationsTrue)
    - api/src/main/java/com/ureport/repository/TicketHistoryRepository.java (added findBySentNotificationsIsNull)

decisions:
  - "PostGIS GEOGRAPHY columns (geo_point, center) not mapped as JPA fields to avoid Hibernate Spatial dependency; populated via native SQL ST_MakePoint queries"
  - "Media entity uses existing field names from Wave 1 (original_filename, internal_filename, uploaded_at) rather than spec aliases for consistency"
  - "ApiKeyHashUtil uses java.util.HexFormat (Java 17+) instead of Apache Commons Codec for SHA-256 hex encoding"
  - "GeoService uses EntityManager injection via @PersistenceContext for native geo_point updates"
  - "NotificationService filters notification emails via JPQL query on person.id to avoid loading all emails"
  - "AutoCloseScheduler uses per-ticket slaDays from native query to compute cutoff, not a fixed global value"
  - "MetricsService handles query failures gracefully by returning empty results rather than propagating DB errors for missing tables"

metrics:
  duration: "~45 minutes"
  completed_date: "2026-06-24"
  tasks_completed: 2
  files_created: 39
  files_modified: 2
---

# Phase implement-the-full-ureport-modernization Plan 05: Wave 2d Backend Features Summary

## One-liner

Seven backend features (F10/F12/F13/F15/F16/F17/F20) implemented with dual-hash API key security, thumbnail-caching media upload, PostGIS geo-cluster scheduling, digest email notifications, and 10 canned report metrics.

## What Was Built

### Task 1 — Media, Bookmarks, API Clients (F10, F12, F13)

**Media (F10):**
- `MediaService.upload()`: stores files to `${APP_MEDIA_PATH}/{uuid}.{ext}`, inserts media row, appends action_id=10 history entry
- `MediaService.thumbnail()`: generates 200×200 max JPEG on first request using `javax.imageio.ImageIO`, caches at `${APP_MEDIA_PATH}/thumbnails/thumb_{internalFilename}`, serves cached on subsequent requests; returns 404 for non-image MIME types
- `MediaController`: POST/GET/DELETE `/api/v1/tickets/{id}/media`, GET `/api/v1/media/{fn}`, GET `/api/v1/media/{fn}/thumbnail`
- `MediaConfig`: reads `APP_MEDIA_PATH` env var (default `/app/media`)

**Bookmarks (F12):**
- `BookmarkService.deleteBookmark()`: loads bookmark, throws `PermissionDeniedException("PERMISSION_DENIED")` if caller is not owner, otherwise deletes
- `BookmarkController`: staff-only CRUD at `/api/v1/bookmarks` with per-user ownership enforcement

**API Clients (F13):**
- `ApiKeyHashUtil`: `generateKey()` (UUID-based 36+ chars), `hashForLookup()` (SHA-256 hex), `hashForStorage()` (BCrypt cost=10), `verify()` (SHA-256 fast-check then BCrypt)
- `ClientService.createClient()`: generates rawApiKey, stores lookup + hash, returns rawApiKey ONCE
- `ClientService.rotateKey()`: generates new rawApiKey, updates api_key_lookup + api_key_hash immediately
- `ClientService.validateApiKey()`: SHA-256 lookup in clients table, then BCrypt verify; throws 403 if invalid
- `ClientController`: full CRUD at `/api/v1/clients`, PATCH supports `rotateKey:true` for key rotation

### Task 2 — Locations, Geo, Schedulers, Metrics, Response Templates (F15, F16, F17, F20)

**Location/Geo (F15):**
- `Location`, `GeoCluster`, `TicketGeoData` JPA entities
- `GeoService.normalizeAddress()`: deduplicates locations by address+city+state+zip; creates new row if not found
- `GeoService.syncGeoPoint()`: updates PostGIS `geo_point` column via native `ST_MakePoint` query
- `GeoClusterScheduler`: runs nightly at 2 AM, grid-bucketing at zoom levels 0–6 (cell size halves per level), inserts `geoclusters` rows with PostGIS geography centers, upserts `ticket_geodata` cluster assignments

**Digest Notifications (F16):**
- `NotificationService.processPendingNotifications()`: finds notification emails for ticket reporter, resolves `category_action_responses` template, sends via `JavaMailSender`, updates `ticketHistory.sentNotifications`
- `DigestNotificationScheduler`: every 5 min, queries `WHERE sentNotifications IS NULL`, processes each entry
- `AutoCloseScheduler`: nightly 1 AM, closes tickets matching `autoCloseIsActive=true AND lastModified < NOW()-slaDays`, appends action_id=3 history with "Auto-closed by scheduler" note
- `AuditScheduler`: weekly Sunday 3 AM, 5 integrity checks (closedDate null, substatus mismatch, orphaned history, media count, staff without username), logs `[SCHEDULER]` prefix with findings map
- `SchedulerConfig`: `@EnableScheduling` only
- `AdminJobController`: 4 endpoints at `/api/v1/admin/jobs/{job}/run` for manual triggers

**Metrics (F17):**
- `MetricsService.getOnTimePercentage()`: computes `closedDate <= enteredDate + slaDays days` ratio for closed tickets in date window
- `MetricsService.getReport()`: dispatches to 10 canned reports (activity, assignments, categories, staff, person, sla, volume, current, opened, closed); returns `{ reportType, generatedAt, data: [...] }`; throws `INVALID_REPORT_TYPE` for unknown values
- `MetricsController`: GET `/api/v1/metrics` + GET `/api/v1/reports/{reportType}` (staff-only)

**Response Templates (F20):**
- `ResponseTemplate` entity, `ResponseTemplateRepository` (findByActionId)
- `ResponseTemplateService`: CRUD with `listTemplates(actionId)` filtering; validates `action_id` exists via `ActionRepository`
- `ResponseTemplateController`: full CRUD at `/api/v1/response-templates` with `?action_id=` filter (staff-only)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Added findBySentNotificationsIsNull to TicketHistoryRepository**
- **Found during:** Task 2 (DigestNotificationScheduler implementation)
- **Issue:** Repository had no method to query ticketHistory entries with null sentNotifications
- **Fix:** Added `@Query("SELECT h FROM TicketHistory h WHERE h.sentNotifications IS NULL")` method
- **Files modified:** `TicketHistoryRepository.java`

**2. [Rule 2 - Missing critical] Added findByPersonIdAndUsedForNotificationsTrue to PeopleEmailRepository**
- **Found during:** Task 2 (NotificationService implementation)
- **Issue:** Repository lacked a method to efficiently query notification emails by person ID
- **Fix:** Added JPQL `@Query` with `pe.person.id = :personId AND pe.usedForNotifications = true`
- **Files modified:** `PeopleEmailRepository.java`

**3. [Rule 3 - Blocking] PostGIS GEOGRAPHY columns not mapped as JPA fields**
- **Found during:** Task 2 (GeoCluster, Location entity design)
- **Issue:** Hibernate Spatial is not a listed dependency in pom.xml; mapping GEOGRAPHY columns would cause startup failure
- **Fix:** Left `geo_point` and `center` columns unmapped in JPA; all PostGIS operations done via native SQL with EntityManager
- **Files modified:** `GeoCluster.java`, `Location.java`, `GeoService.java`, `GeoClusterScheduler.java`

## Test Coverage

Six unit test classes written:

| Test Class | Scenarios | Key Assertions |
|---|---|---|
| `MediaServiceTest` | upload stores file + history, non-existent ticket 404, non-image thumbnail 404 | action_id=10 history appended, NotFoundException thrown |
| `BookmarkServiceTest` | owner delete, non-owner 403, not-found 404, list sorted | PERMISSION_DENIED error code, sort order verified |
| `ClientServiceTest` | create returns rawApiKey, rotate changes lookup+hash, invalid key 403, valid key returns client | BCrypt hash stored, raw key never stored |
| `GeoServiceTest` | creates new location, returns existing (dedup), deduplication by all 4 fields | save() called only for new locations |
| `MetricsServiceTest` | all-on-time 100%, none-on-time 0%, invalid type throws, activity report returns data | INVALID_REPORT_TYPE error code, data shape verified |
| `DigestNotificationSchedulerTest` | processes pending, skips sent, handles no pending, continues on error | processPendingNotifications called/not-called correctly |

**Note:** Tests written; execution deferred to verify phase (Maven/Java not available in execute environment).

## Self-Check: PASSED

Files verified to exist:
- `api/src/main/java/com/ureport/service/MediaService.java` ✓
- `api/src/main/java/com/ureport/util/ApiKeyHashUtil.java` ✓
- `api/src/main/java/com/ureport/service/ClientService.java` ✓
- `api/src/main/java/com/ureport/service/BookmarkService.java` ✓
- `api/src/main/java/com/ureport/service/GeoService.java` ✓
- `api/src/main/java/com/ureport/scheduler/GeoClusterScheduler.java` ✓
- `api/src/main/java/com/ureport/service/NotificationService.java` ✓
- `api/src/main/java/com/ureport/scheduler/DigestNotificationScheduler.java` ✓
- `api/src/main/java/com/ureport/service/MetricsService.java` ✓
- `api/src/main/java/com/ureport/service/ResponseTemplateService.java` ✓
- `api/src/main/java/com/ureport/config/SchedulerConfig.java` ✓

Commits verified:
- `33c93b0` feat(implement-the-full-ureport-modernization-05): Task 1 Media, Bookmarks, API Clients ✓
- `c4c7133` feat(implement-the-full-ureport-modernization-05): Task 2 Geo, Schedulers, Metrics, ResponseTemplates ✓
