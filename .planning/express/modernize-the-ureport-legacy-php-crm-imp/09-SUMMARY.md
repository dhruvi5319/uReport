---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: "09"
subsystem: open311-and-bookmarks
tags: [open311, georeport-v2, bookmarks, api, controllers]
dependency_graph:
  requires:
    - plan: "01"
      artifacts: [TicketRepository, CategoryRepository, ClientRepository, BookmarkRepository]
    - plan: "02"
      artifacts: [Domain/Ticket, Domain/Category, Domain/Client, Domain/Bookmark]
  provides:
    - Controllers/Open311/ServicesController
    - Controllers/Open311/RequestsController
    - Controllers/Open311/DiscoveryController
    - Controllers/Api/BookmarkController
  affects:
    - Wave 3d frontend (bookmark UI)
    - External Open311 clients (spec compliance)
tech_stack:
  added: []
  patterns:
    - GeoReport v2 field mapping (Open311 spec frozen contract)
    - bcrypt api_key verification with hint-narrowed pre-filter
    - standard internal JSON envelope for internal APIs
    - Open311 error format for external endpoints
key_files:
  created:
    - crm/src/Controllers/Open311/ServicesController.php
    - crm/src/Controllers/Open311/RequestsController.php
    - crm/src/Controllers/Open311/DiscoveryController.php
    - crm/src/Controllers/Api/BookmarkController.php
  modified:
    - crm/src/Repositories/ClientRepository.php
    - crm/src/Repositories/BookmarkRepository.php
decisions:
  - "Used ClientRepository::findByApiKey() with password_verify() + 8-char hint pre-filter for bcrypt key validation instead of exact hash match"
  - "BookmarkController uses in-memory duplicate name check (iterates findByPersonId result) before DB insert — avoids extra query and catches edge cases before DB constraint fires"
  - "Open311 controllers use their own respondError() returning [{code,description}] format distinct from internal JSON envelope"
metrics:
  duration: "~15 minutes"
  completed: "2026-06-23"
  tasks_completed: 2
  files_created: 4
  files_modified: 2
---

# Phase modernize-the-ureport-legacy-php-crm-imp Plan 09: Open311 GeoReport v2 + Bookmarks API Summary

**One-liner:** Open311 GeoReport v2 endpoints with frozen field mapping and bcrypt api_key validation, plus user-scoped bookmark CRUD with 50-item limit.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Open311 GeoReport v2 Controllers | `04a94ec` | ServicesController, RequestsController, DiscoveryController + ClientRepository fix |
| 2 | Bookmarks API Controller | `5634e04` | BookmarkController + BookmarkRepository::create() |

## Files Created

### crm/src/Controllers/Open311/ServicesController.php
- `GET /open311/services` — maps active categories with `postingPermission IN ('public','anonymous')` to GeoReport v2 service objects
- `GET /open311/services/{service_code}` — full service definition with `attributes[]` for custom field metadata
- Supports `?format=xml` (wrapped in `<services><service>`) and `?format=json`
- Skips staff-only categories — not exposed via Open311

### crm/src/Controllers/Open311/RequestsController.php
- `POST /open311/requests` — validates api_key (bcrypt), validates service_code active + public/anonymous, requires lat/long OR address_string, maps Open311 fields to internal Ticket, inserts `open` action
- `GET /open311/requests` — paginated list with filters (service_code, status, start_date, end_date, page, page_size); supports comma-separated `service_request_id`
- `GET /open311/requests/{id}` — returns single-element array `[{...}]` per GeoReport v2 spec
- **Open311 field names preserved verbatim:** `long` (not `lng`), `address_string` (input), `service_request_id`, `requested_datetime`, `updated_datetime`, `expected_datetime`, `agency_responsible`
- `expected_datetime` computed as `datetimeOpened + category.slaDays` business days (Mon–Fri)
- `agency_responsible` = department name from `DepartmentRepository`
- Error format: `[{"code": N, "description": "..."}]` — NOT the internal `{data, meta, errors}` envelope

### crm/src/Controllers/Open311/DiscoveryController.php
- `GET /open311/discovery` — returns spec-compliant discovery document
- Supports `?format=xml` and `?format=json`
- Constructed from `$baseUrl` injected via DI

### crm/src/Controllers/Api/BookmarkController.php
- `GET /api/bookmarks` — all bookmarks for authenticated user (scoped by `personId`)
- `POST /api/bookmarks` — create with validation: name required (≤100 chars), filterState required object; enforces 50-bookmark limit (409 BOOKMARK_LIMIT); enforces name uniqueness per user (422 DUPLICATE_NAME)
- `GET /api/bookmarks/{id}` — single bookmark with ownership check (403 FORBIDDEN if different user)
- `DELETE /api/bookmarks/{id}` — ownership checked; 204 No Content on success
- `filterState` stored as JSON string in DB; decoded to object in responses
- Uses standard internal `{data, meta, errors}` envelope

## Files Modified

### crm/src/Repositories/ClientRepository.php (Rule 1 Auto-fix)
**Issue:** Existing `findByApiKeyHash(string $hash)` queries by exact hash — incompatible with bcrypt because the stored hash cannot be reconstructed from the plain key to match.

**Fix:** Added `findByApiKey(string $plainKey): ?Client` method that:
1. Extracts first 8 chars of plain key as hint prefix
2. Queries `WHERE apiKeyHint = :hint AND active = 1` to narrow candidates
3. Iterates results calling `password_verify($plainKey, $row['apiKeyHash'])`
4. Returns first matching Client or null

This avoids full-table bcrypt scan while maintaining security.

### crm/src/Repositories/BookmarkRepository.php (Rule 2 Auto-fix)
**Issue:** `BookmarkController::create()` needed `BookmarkRepository::create(array $data)` but the repository only had `save(object $entity)` requiring a domain object.

**Fix:** Added `create(array $data): \Domain\Bookmark` accepting `['personId', 'name', 'filterState']` keys, performing direct INSERT and returning the persisted Bookmark. Keeps `save()` intact for existing uses.

## Open311 Field Mapping Decisions

Per FRD §F01 frozen contract (TechArch §1.4) — field names MUST NOT change:

| Open311 Field | Internal Column | Note |
|---|---|---|
| `service_request_id` | `tickets.id` | Always string in output |
| `service_code` | `tickets.categoryId` | String in output |
| `long` | `ticket_geodata.lng` | Open311 uses `long`, internal uses `lng` |
| `address_string` | input only → `tickets.address` | Open311 input name differs from storage |
| `requested_datetime` | `tickets.datetimeOpened` | ISO 8601 / ATOM format |
| `updated_datetime` | `tickets.datetimeUpdated` | ISO 8601 / ATOM format |
| `expected_datetime` | computed: `datetimeOpened + slaDays` biz days | Empty string if no SLA |
| `agency_responsible` | `departments.name` | Via DepartmentRepository |

## Edge Cases Handled

1. **api_key absent vs invalid:** If `api_key` not in POST body → skip validation entirely (anonymous post to public/anonymous category allowed). If present but invalid → HTTP 400 "Invalid api_key".
2. **XML escaping:** All XML output uses `htmlspecialchars()` on all values to prevent injection.
3. **`expected_datetime` with no SLA:** Returns empty string `""` (not null) when `slaDays` is null/zero.
4. **Single-element array for GET /requests/{id}:** Returns `[{...}]` (array wrapping) per GeoReport v2 spec.
5. **Open311 posting permission gate:** Only categories with `postingPermission IN ('public','anonymous')` are accessible via Open311 endpoints. Staff-only returns 403.
6. **Bookmark name uniqueness:** Checked in-memory against `findByPersonId()` before INSERT; DB UNIQUE constraint is a second safety net.
7. **`filterState` round-trip:** Stored as raw JSON string; `json_decode()` to object on all read responses.

## Self-Check: PASSED

- `crm/src/Controllers/Open311/ServicesController.php` — FOUND
- `crm/src/Controllers/Open311/RequestsController.php` — FOUND
- `crm/src/Controllers/Open311/DiscoveryController.php` — FOUND
- `crm/src/Controllers/Api/BookmarkController.php` — FOUND
- Commit `04a94ec` — FOUND (Task 1)
- Commit `5634e04` — FOUND (Task 2)
