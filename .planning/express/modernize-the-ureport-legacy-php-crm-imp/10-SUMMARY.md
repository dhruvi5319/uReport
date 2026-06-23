---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 10
type: summary
completed: 2026-06-23
duration_minutes: 15
tasks_completed: 2
tasks_total: 2
implements: [F18, F16]
---

# Plan 10 Summary: Ticket Merge Endpoint (F18) + OpenAPI 3.1 Spec (F16)

## One-liner

Ticket merge with transactional dual-action records and complete 52-path OpenAPI 3.1 spec with Swagger UI.

## Files Created / Modified

### Created
- `crm/src/Services/TicketService.php` — `mergeTickets()` orchestration: validation, DB transaction, dual action inserts, non-fatal notification
- `crm/src/Controllers/Api/TicketController.php` — `merge()` and `mergeCandidates()` API action methods
- `crm/src/Controllers/Api/OpenApiController.php` — `spec()`, `yaml()`, `docs()` methods serving static spec + Swagger UI
- `crm/public/api/openapi.json` — Complete OpenAPI 3.1 spec (52 paths, 34 schemas, all Wave 2a–2d endpoints)
- `crm/public/api/docs/index.html` — Swagger UI v5 CDN HTML

### Modified
- `crm/src/Repositories/TicketRepository.php` — Added `findMergeCandidates()` method for paginated open/non-merged candidate search

## Merge Endpoint Contract (F18)

### POST /api/tickets/{id}/merge

**Request body:**
```json
{ "targetTicketId": 42 }
```

**Response 200 (success):**
```json
{
  "data": {
    "sourceTicketId": 7,
    "targetTicketId": 42,
    "status": "merged",
    "mergedAt": "2024-01-15T10:30:00+00:00"
  },
  "meta": {},
  "errors": []
}
```

**Error codes:**
| HTTP | Code            | Trigger                                           |
|------|-----------------|---------------------------------------------------|
| 422  | SELF_MERGE      | `targetTicketId == source ticket id`              |
| 409  | ALREADY_MERGED  | `source.mergedIntoTicketId IS NOT NULL`           |
| 409  | TARGET_CLOSED   | `target.status != 'open'`                         |
| 409  | TARGET_MERGED   | `target.mergedIntoTicketId IS NOT NULL`           |
| 404  | NOT_FOUND       | Source or target ticket does not exist            |
| 422  | VALIDATION_ERROR| `targetTicketId` missing or not a positive int   |

**Side effects on success:**
1. `tickets.status = 'closed'`, `tickets.mergedIntoTicketId = targetId`, `tickets.datetimeClosed = NOW()` on source (in transaction)
2. Action record on source: `type='merged'`, `payload={"mergedIntoTicketId": targetId}` (in transaction)
3. Action record on target: `type='merged'`, `payload={"mergedFromTicketId": sourceId}` (in transaction)
4. `ticket_merged` notification sent to `source.reporterEmail` (post-transaction, non-fatal)

### GET /api/tickets/{id}/merge-candidates

**Query params:** `q` (title/description search), `page`, `perPage` (max 50)

**Response 200:**
```json
{
  "data": [/* Ticket objects */],
  "meta": { "total": 100, "page": 1, "perPage": 25, "pages": 4 },
  "errors": []
}
```

**Filter criteria (all must be true):**
- `status = 'open'`
- `mergedIntoTicketId IS NULL`
- `deletedAt IS NULL`
- `id != sourceId`
- Optional: `title LIKE %q% OR description LIKE %q%`

## OpenAPI Spec Coverage (F16)

**Location:** `GET /api/openapi.json` → `crm/public/api/openapi.json`  
**Swagger UI:** `GET /api/docs` → `crm/public/api/docs/index.html`  
**YAML:** `GET /api/openapi.yaml` (converts JSON via symfony/yaml if available; falls back to redirect to JSON)

**Spec stats:** 52 paths, 34 component schemas, 3 reusable responses, 2 security schemes

**Tag coverage:**
- `tickets` — 15 paths (CRUD + assign/close/reopen/responses/comments/merge/merge-candidates/history/media/clusters/bulk-assign)
- `geo` — 3 paths (geocode, clusters, ticket location)
- `reports` — 9 paths (activity/assignments/categories/departments/staff-performance/sla/volume/open-age/metrics)
- `admin-departments` — 5 paths (CRUD)
- `admin-categories` — 9 paths (categories CRUD + category-groups CRUD)
- `admin-people` — 7 paths (people CRUD + contact-methods CRUD)
- `admin-substatuses` — 4 paths (CRUD)
- `admin-templates` — 4 paths (CRUD + notification settings)
- `admin-clients` — 5 paths (CRUD + regenerate-key)
- `bookmarks` — 4 paths (list/create/get/delete)
- `auth` — 7 paths (login/callback/logout/me + openapi.json/yaml/docs)

**Key component schemas:**
- `Ticket`, `Action`, `Media`, `Person`, `Department`, `Category`, `CategoryGroup`, `Substatus`, `Template`, `ApiClient`, `Bookmark`, `GeoCluster`, `SlaMetric`, `ActivityReport`, `AssignmentReport`
- Request bodies: all CRUD operations + `MergeTicketBody` (`{targetTicketId: integer}`)
- `ApiEnvelope`, `PaginationMeta`, `ApiError`
- Security: `BearerAuth` (JWT) + `CookieAuth` (`ureport_session`)

## Deviations from Plan

### Parallel Plan Execution Artifact
- **Found during:** Task 2 commit
- **Issue:** Parallel plan-05 execution picked up the newly written Task 2 files (openapi.json, docs/index.html, OpenApiController.php) since they were created as untracked files before plan-05's git add ran. The files appear in commit `ecf2b66` (plan-05's commit) rather than a dedicated plan-10 Task 2 commit.
- **Impact:** None — all files are correctly committed to the repository with the right content. Task 1 files are in their own commit `21e9d9f`. The functional result is identical.
- **Fix:** No fix required; files exist in repo.

### No Other Deviations
All other plan elements executed exactly as written:
- `TicketController.php` did not exist (new file, not from a prior Wave 2a run)
- `TicketService.php` did not exist (new file)
- `TicketRepository.findMergeCandidates()` added without modifying existing methods

## Commits

| Task | Commit  | Description |
|------|---------|-------------|
| 1    | 21e9d9f | feat(modernize-10): implement ticket merge endpoint F18 |
| 2    | ecf2b66 | Task 2 files committed (picked up by parallel plan-05 run) |

## Integration Contracts Verified

- ✅ `TicketRepository::setMerged(int, int)` exists (from plan-02)
- ✅ `ActionRepository::insert(Action): Action` exists (from plan-02)
- ✅ `Domain\Action::TYPES` includes `'merged'` (from plan-02)
- ✅ `Domain\Ticket::mergedIntoTicketId` exists (from plan-02)
- ✅ `AbstractPdoRepository::beginTransaction/commit/rollback` exist

## Self-Check: PASSED

```
✅ crm/src/Services/TicketService.php — exists, mergeTickets() present
✅ crm/src/Controllers/Api/TicketController.php — exists, merge() + mergeCandidates() present
✅ crm/src/Controllers/Api/OpenApiController.php — exists, spec/yaml/docs() present
✅ crm/public/api/openapi.json — valid JSON, openapi: 3.1.0, 52 paths
✅ crm/public/api/docs/index.html — exists, references swagger-ui and /api/openapi.json
✅ crm/src/Repositories/TicketRepository.php — findMergeCandidates() added
✅ Transaction wraps setMerged() + 2x actions.insert()
✅ Dual action inserts (source + target)
✅ All merge validation error codes map correctly
```
