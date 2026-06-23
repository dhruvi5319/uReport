---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: "07"
subsystem: crm/src/Services + crm/src/Controllers/Api
tags: [solr, solarium, search, geocoding, geospatial, csv-export, php]

dependency_graph:
  requires:
    - "crm/src/Repositories/TicketRepository.php (findByIds, findById)"
    - "crm/src/Repositories/AbstractPdoRepository.php (AbstractPdoRepository)"
    - "crm/src/Domain/Ticket.php (Domain\\Ticket)"
    - "crm/src/Infrastructure/Database/PdoConnection.php (PdoConnection::get)"
  provides:
    - "crm/src/Services/SearchService.php (SearchService — Solarium wrapper, search, syncTicket, deleteTicket)"
    - "crm/src/Services/AddressService.php (AddressService — google/nominatim/city_gis/none geocoding)"
    - "crm/src/Services/GeoClusterService.php (GeoClusterService — Solr heatmap + MySQL fallback)"
    - "crm/src/Controllers/Api/SearchController.php (GET /api/tickets + ?export=csv)"
    - "crm/src/Controllers/Api/GeoController.php (GET /api/tickets/clusters, GET /api/geocode, GET /api/tickets/{id}/location)"
  affects:
    - "Wave 3c frontend: SearchBar, FilterPanel, TicketMap, ClusterLayer all depend on these endpoints"
    - "Wave 2a ticket mutations: syncTicket()/deleteTicket() keep Solr index current"

tech_stack:
  added:
    - "solarium/solarium ^6.3 (Solr 9.x PHP client)"
  patterns:
    - "Service wrapper pattern: SearchService wraps ALL Solr calls (TechArch §2.1)"
    - "Provider abstraction: AddressService dispatches on ADDRESS_SERVICE_TYPE env var"
    - "Graceful degradation: GeoClusterService falls back to MySQL geoclusters table when Solr unavailable"
    - "In-memory cache: AddressService caches geocoding results by md5(address)"
    - "Constructor injection with nullable defaults for testability"

key_files:
  created:
    - crm/src/Services/SearchService.php
    - crm/src/Services/AddressService.php
    - crm/src/Services/GeoClusterService.php
    - crm/src/Controllers/Api/SearchController.php
    - crm/src/Controllers/Api/GeoController.php
  modified:
    - crm/composer.json (solarium/solarium pinned to ^6.3; Services\\ already in autoload)

decisions:
  - "solarium/solarium version pinned to ^6.3 (not @stable) per plan spec — provides Solarium 6.x API stability"
  - "AddressService in-memory cache uses md5(strtolower(trim(address))) as cache key — cheap, prevents redundant external API calls per request lifecycle"
  - "GeoClusterService fallback to geoclusters MySQL table on any Solr exception — non-fatal degradation per TechArch §3.3"
  - "SearchService::searchForExport() reuses search() with perPage=5000 — consistent filter logic, single code path"
  - "CSV export streams directly to php://output with UTF-8 BOM for Excel compatibility"
  - "Solr filter query keys use md5(filter_string) to guarantee unique FQ component keys"
  - "bbox geom string for Solr heatmap uses [minLng minLat TO maxLng maxLat] format (lng before lat per Solr spatial convention)"

metrics:
  duration: "~15 minutes"
  completed: "2026-06-23"
  tasks_completed: 2
  files_created: 5
  files_modified: 1
---

# Phase modernize-the-ureport-legacy-php-crm-imp Plan 07: Solr Search + Geospatial Services Summary

**One-liner:** Solarium ^6.3 client wrapper (SearchService) + geocoding abstraction (AddressService, 4 providers, in-memory cache) + Solr spatial heatmap cluster service with MySQL fallback (GeoClusterService) + SearchController (GET /api/tickets, CSV export) + GeoController (clusters, geocode, location).

## Tasks Completed

### Task 1: SearchService + AddressService + GeoClusterService + composer.json

**Commit:** `8c59950`

**Files created:**
- `crm/src/Services/SearchService.php`
- `crm/src/Services/AddressService.php`
- `crm/src/Services/GeoClusterService.php`

**Files modified:**
- `crm/composer.json` — `solarium/solarium` version pinned from `@stable` to `^6.3`

#### SearchService (`crm/src/Services/SearchService.php`)

Wraps ALL Solr interactions per TechArch §2.1. Uses Solarium PHP client with Curl adapter.

| Method | Description |
|--------|-------------|
| `search(array $params): array` | Full-text search with all FRD F04 filter params; returns `['ids', 'total', 'facets']` |
| `searchForExport(array $params): array` | Same as search but sets perPage=5000 for export |
| `syncTicket(int $ticketId): void` | Push/update ticket document to Solr index; non-fatal on failure |
| `deleteTicket(int $ticketId): void` | Remove ticket document from Solr index; non-fatal on failure |
| `getSolrClient(): SolariumClient` | Exposes Solarium client for GeoClusterService spatial queries |

**Filter params handled:** q (full-text: title/description/address/responses), status, substatusId, categoryId (multi), departmentId (multi), assigneeId, reporterEmail, dateFrom/dateTo (datetimeOpened range), bbox (lat/lng ranges), lat+lng+radius (geofilt spatial filter)

**Facets:** status, categoryId, departmentId (returned on every search)

**Sort options:** date_desc, date_asc, sla_asc, assignee, category

**Solr connection:** SOLR_HOST/SOLR_PORT/SOLR_CORE env vars (defaults: solr/8983/ureport)

#### AddressService (`crm/src/Services/AddressService.php`)

Geocoding/reverse-geocoding abstraction. Provider from `ADDRESS_SERVICE_TYPE` env var:

| Provider | Config | Notes |
|----------|--------|-------|
| `google` | ADDRESS_SERVICE_KEY | Google Maps Geocoding API |
| `nominatim` | ADDRESS_SERVICE_URL (optional) | OpenStreetMap, User-Agent: uReport/1.0 |
| `city_gis` | ADDRESS_SERVICE_URL + optional KEY | Custom GIS endpoint |
| `none` | — | Geocoding disabled; returns null |

**Cache:** Static in-memory array keyed by `md5(strtolower(trim(address)))` — prevents redundant HTTP calls per request.

**`geocode(string $address): ?array`** → `['lat' => float, 'lng' => float, 'addressNormalized' => string]` or null

**`reverseGeocode(float $lat, float $lng): ?string`** → address string or null

#### GeoClusterService (`crm/src/Services/GeoClusterService.php`)

**Primary path:** Solr JSON facet API with spatial heatmap — `json.facet` param, `type: heatmap`, `field: location`, `gridLevel` proportional to zoom (zoom × 0.55, clamped 1–11).

**Fallback:** MySQL `geoclusters` table with `zoom = :zoom` filter + optional bbox bounds when Solr throws any exception.

**Returns:** `[['lat' => float, 'lng' => float, 'count' => int, 'zoom' => int], ...]`

### Task 2: SearchController + GeoController

**Commit:** `9f10ae8` (committed by concurrent plan-03 execution — files existed on disk with identical content)

**Files created:**
- `crm/src/Controllers/Api/SearchController.php`
- `crm/src/Controllers/Api/GeoController.php`

#### SearchController (`crm/src/Controllers/Api/SearchController.php`)

Handles `GET /api/tickets` — delegates to SearchService for Solr IDs, hydrates from `TicketRepository::findByIds()`.

**JSON envelope:** `{ data: Ticket[], meta: { total, page, perPage, pages, facets }, errors: [] }`

**CSV export (`?export=csv`):**
- Streams `text/csv; charset=UTF-8` with `Content-Disposition: attachment; filename="tickets.csv"`
- UTF-8 BOM for Excel compatibility
- HTTP 413 if total > 5000 rows
- HTTP 503 if Solr unavailable

**All F4 query params:** q, status, substatusId, categoryId[], departmentId[], assigneeId, reporterEmail, dateFrom, dateTo, lat, lng, radius, bbox, sort, page, perPage, export

#### GeoController (`crm/src/Controllers/Api/GeoController.php`)

Three geospatial endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/tickets/clusters` | `clusters()` | bbox (4-part validation), zoom (1–20), status/categoryId/departmentId filters → GeoCluster[] |
| `GET /api/geocode` | `geocode()` | address (required, ≤500 chars) → `{ lat, lng, addressNormalized }` or 422 ADDRESS_NOT_FOUND |
| `GET /api/tickets/{id}/location` | `location(int $id)` | ticket_geodata JOIN tickets (not deleted) → geodata fields or 404 NOT_FOUND |

## Integration Contracts Verified

- ✅ `SearchService::search()` returns `['ids' => int[], 'total' => int, 'facets' => array]`
- ✅ `SearchService::syncTicket(int $ticketId): void` and `deleteTicket(int $ticketId): void` exist
- ✅ `AddressService::geocode(string $address): ?array` returns `['lat', 'lng', 'addressNormalized']` or null
- ✅ `AddressService::reverseGeocode(float $lat, float $lng): ?string` returns string or null
- ✅ `GeoClusterService::getClusters(array $params): array` returns `[['lat', 'lng', 'count', 'zoom'], ...]`
- ✅ `SearchController::index(): void` handles GET /api/tickets with all F4 params + ?export=csv
- ✅ `GeoController::clusters(): void` handles GET /api/tickets/clusters
- ✅ `GeoController::geocode(): void` handles GET /api/geocode
- ✅ `GeoController::location(int $ticketId): void` handles GET /api/tickets/{id}/location
- ✅ `TicketRepository::findByIds()` consumed in SearchController (Wave 1 contract)
- ✅ `PdoConnection::get()` consumed in GeoController (Wave 1 contract)
- ✅ `composer.json` has `solarium/solarium ^6.3` and `Services\\` in autoload psr-4

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Concurrent plan-03 committed SearchController.php and GeoController.php before Task 2 atomic commit**
- **Found during:** Task 2 commit (git reported "nothing to commit" after staging the two controller files)
- **Issue:** Plan-03 ran concurrently and committed our Task 2 files (with identical content) in commit `9f10ae8` as part of its HTTP kernel + middleware work. The files on disk were correct but already in the git tree.
- **Fix:** No fix needed — content identical; acknowledged as expected parallel-wave execution behavior. The controllers satisfy all plan-07 done criteria.
- **Files:** `crm/src/Controllers/Api/SearchController.php`, `crm/src/Controllers/Api/GeoController.php`

**2. [Rule 1 - Bug] Fixed Solr heatmap geom string format**
- **Found during:** Task 1 implementation review
- **Issue:** The plan's `GeoClusterService` code used array index syntax (`$params['bbox'][1]`) to access parts of the comma-delimited bbox string, which would return individual characters, not coordinate components.
- **Fix:** Added explicit `explode(',', $params['bbox'])` before building the `geom` string, following the Solr spatial WKT convention `[minLng minLat TO maxLng maxLat]` (longitude before latitude per GeoJSON standard).
- **Files modified:** `crm/src/Services/GeoClusterService.php`
- **Commit:** `8c59950`

## Verification Notes

PHP and composer are not installed in this development environment (project uses Docker for runtime). All files have been manually verified for:
- Correct namespace declarations (`Services\`, `Controllers\Api\`)
- Required public method signatures per integration contracts
- Correct class names matching plan artifacts
- PHP 8.5 syntax (match expressions, readonly classes, named arguments, constructor promotion)

Runtime verification (`php -l`, `composer dump-autoload`) should be run in the Docker environment.

## Self-Check: PASSED

**Files verified to exist on disk:**
- ✅ `crm/src/Services/SearchService.php` — EXISTS
- ✅ `crm/src/Services/AddressService.php` — EXISTS
- ✅ `crm/src/Services/GeoClusterService.php` — EXISTS
- ✅ `crm/src/Controllers/Api/SearchController.php` — EXISTS
- ✅ `crm/src/Controllers/Api/GeoController.php` — EXISTS

**Key method presence confirmed:**
- ✅ SearchService: search(), syncTicket(), deleteTicket(), getSolrClient(), searchForExport()
- ✅ AddressService: geocode(), reverseGeocode()
- ✅ GeoClusterService: getClusters()
- ✅ SearchController: index()
- ✅ GeoController: clusters(), geocode(), location()

**Commits verified:**
- ✅ `8c59950` — Task 1: SearchService, AddressService, GeoClusterService, composer.json
- ✅ `9f10ae8` — Task 2: SearchController, GeoController (committed by concurrent plan-03)
