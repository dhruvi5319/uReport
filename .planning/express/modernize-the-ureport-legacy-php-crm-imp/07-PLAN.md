---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 07
type: execute
wave: 2
depends_on: [1]
files_modified:
  - crm/src/Services/SearchService.php
  - crm/src/Services/AddressService.php
  - crm/src/Services/GeoClusterService.php
  - crm/src/Controllers/Api/SearchController.php
  - crm/src/Controllers/Api/GeoController.php
  - crm/composer.json
autonomous: true

features:
  implements: ["F4", "F5"]
  depends_on: ["F0", "F2", "F3", "F6", "F16"]
  enables: ["F4", "F5", "F15"]

must_haves:
  truths:
    - "GET /api/tickets returns Solr-powered full-text results with pagination and facets"
    - "GET /api/tickets?export=csv streams a CSV response of filtered results"
    - "GET /api/tickets/clusters returns geo-cluster array from Solr spatial heatmap"
    - "GET /api/geocode?address=... returns lat/lng from configurable address service"
    - "Geocoding calls are cached by address string to avoid redundant external API calls"
    - "SearchService wraps all Solarium client calls behind a single PHP class"
    - "AddressService abstracts geocoding provider via ADDRESS_SERVICE_TYPE env var"
  artifacts:
    - path: "crm/src/Services/SearchService.php"
      provides: "Solarium client wrapper — full-text search, facets, geo-cluster queries"
      exports: ["SearchService"]
    - path: "crm/src/Services/AddressService.php"
      provides: "Geocoding/reverse-geocoding abstraction over Google/Nominatim/city_gis/none"
      exports: ["AddressService"]
    - path: "crm/src/Services/GeoClusterService.php"
      provides: "Solr spatial heatmap → GeoCluster[] array with geoclusters table cache"
      exports: ["GeoClusterService"]
    - path: "crm/src/Controllers/Api/SearchController.php"
      provides: "GET /api/tickets — delegates to SearchService, hydrates from MySQL"
      exports: ["SearchController"]
    - path: "crm/src/Controllers/Api/GeoController.php"
      provides: "GET /api/tickets/clusters, GET /api/geocode, GET /api/tickets/{id}/location"
      exports: ["GeoController"]
  key_links:
    - from: "crm/src/Controllers/Api/SearchController.php"
      to: "crm/src/Services/SearchService.php"
      via: "constructor injection"
      pattern: "SearchService"
    - from: "crm/src/Services/SearchService.php"
      to: "Solarium\\Client"
      via: "Solarium PHP client"
      pattern: "Solarium"
    - from: "crm/src/Controllers/Api/GeoController.php"
      to: "crm/src/Services/AddressService.php"
      via: "constructor injection"
      pattern: "AddressService"
    - from: "crm/src/Services/GeoClusterService.php"
      to: "crm/src/Services/SearchService.php"
      via: "Solr spatial heatmap query"
      pattern: "SearchService"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "crm/src/Repositories/TicketRepository.php"
      exports: ["TicketRepository::findByIds", "TicketRepository::findByFilters"]
      verify: "grep -n 'findByIds' crm/src/Repositories/TicketRepository.php && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "crm/src/Repositories/AbstractPdoRepository.php"
      exports: ["AbstractPdoRepository"]
      verify: "grep -n 'abstract class AbstractPdoRepository' crm/src/Repositories/AbstractPdoRepository.php && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "crm/src/Domain/Ticket.php"
      exports: ["Domain\\Ticket"]
      verify: "grep -n 'readonly class Ticket' crm/src/Domain/Ticket.php && echo CONTRACT_OK"
  provides:
    - artifact: "crm/src/Services/SearchService.php"
      exports: ["SearchService::search(array \$params): array", "SearchService::buildSolrQuery(array \$params): \\Solarium\\QueryType\\Select\\Query\\Query", "SearchService::syncTicket(int \$ticketId): void", "SearchService::deleteTicket(int \$ticketId): void"]
      shape: |
        namespace Services;
        class SearchService {
          public function __construct(private \Solarium\Client $solr, private \Repositories\TicketRepository $tickets) {}
          /** Returns ['ids' => int[], 'total' => int, 'facets' => array] */
          public function search(array $params): array;
          /** Push/update single ticket document into Solr index */
          public function syncTicket(int $ticketId): void;
          /** Remove ticket document from Solr */
          public function deleteTicket(int $ticketId): void;
        }
      verify: "grep -n 'class SearchService' crm/src/Services/SearchService.php && grep -n 'function search' crm/src/Services/SearchService.php && echo CONTRACT_OK"
    - artifact: "crm/src/Services/AddressService.php"
      exports: ["AddressService::geocode(string \$address): ?array", "AddressService::reverseGeocode(float \$lat, float \$lng): ?string"]
      shape: |
        namespace Services;
        class AddressService {
          /** Returns ['lat' => float, 'lng' => float, 'addressNormalized' => string] or null on failure */
          public function geocode(string $address): ?array;
          /** Returns human-readable address string or null */
          public function reverseGeocode(float $lat, float $lng): ?string;
        }
      verify: "grep -n 'class AddressService' crm/src/Services/AddressService.php && grep -n 'function geocode' crm/src/Services/AddressService.php && echo CONTRACT_OK"
    - artifact: "crm/src/Services/GeoClusterService.php"
      exports: ["GeoClusterService::getClusters(array \$params): array"]
      shape: |
        namespace Services;
        class GeoClusterService {
          /** Returns GeoCluster[] = [['lat'=>float,'lng'=>float,'count'=>int,'zoom'=>int], ...] */
          public function getClusters(array $params): array;
        }
      verify: "grep -n 'class GeoClusterService' crm/src/Services/GeoClusterService.php && grep -n 'function getClusters' crm/src/Services/GeoClusterService.php && echo CONTRACT_OK"
    - artifact: "crm/src/Controllers/Api/SearchController.php"
      exports: ["SearchController::index(): void  (GET /api/tickets)"]
      shape: |
        namespace Controllers\Api;
        class SearchController {
          /** GET /api/tickets — search + filters + pagination + CSV export */
          public function index(): void;
        }
      verify: "grep -n 'class SearchController' crm/src/Controllers/Api/SearchController.php && echo CONTRACT_OK"
    - artifact: "crm/src/Controllers/Api/GeoController.php"
      exports: ["GeoController::clusters(): void  (GET /api/tickets/clusters)", "GeoController::geocode(): void  (GET /api/geocode)", "GeoController::location(int \$ticketId): void  (GET /api/tickets/{id}/location)"]
      shape: |
        namespace Controllers\Api;
        class GeoController {
          public function clusters(): void;
          public function geocode(): void;
          public function location(int $ticketId): void;
        }
      verify: "grep -n 'class GeoController' crm/src/Controllers/Api/GeoController.php && echo CONTRACT_OK"
---

<objective>
Implement Solr-powered full-text search (SearchService wrapping Solarium client) with paginated results, faceted filters, CSV export, and Solr index sync — plus geospatial services: AddressService abstraction over Google/Nominatim/city_gis geocoding providers, and GeoClusterService returning Solr spatial heatmap cluster arrays. Expose via SearchController (GET /api/tickets) and GeoController (GET /api/tickets/clusters, GET /api/geocode, GET /api/tickets/{id}/location).

Purpose: Wave 3c frontend (search, map view, citizen portal) depends on these services being available. Ticket create/update flows in Wave 2a also need Solr sync to keep the index current.

Output:
- crm/src/Services/SearchService.php — Solarium wrapper
- crm/src/Services/AddressService.php — geocoding abstraction
- crm/src/Services/GeoClusterService.php — Solr spatial heatmap → cluster array
- crm/src/Controllers/Api/SearchController.php — GET /api/tickets (+ ?export=csv)
- crm/src/Controllers/Api/GeoController.php — cluster, geocode, location endpoints
- crm/composer.json updated with solarium/solarium dependency
</objective>

<feature_dependencies>
Implements: F4: Full-Text Search & Filtering (SearchService, SearchController, GET /api/tickets, CSV export, Solr sync), F5: Geospatial Features (AddressService geocoding abstraction, GeoClusterService, GET /api/tickets/clusters, GET /api/geocode, GET /api/tickets/{id}/location)
Depends on: F0: Ticket Lifecycle (TicketRepository.findByIds used for hydration after Solr ID fetch), F16: JSON API Backend (API framework kernel from Wave 2a — middleware, envelope, auth), F6: Audit Trail (schema layer from Wave 1)
Enables: F4, F5 in Wave 3c frontend — SearchBar, FilterPanel, TicketMap, ClusterLayer components all require these endpoints
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/WAVE-SCHEDULE.md
@project_specs/TechArch-uReport.md
@project_specs/FRD-uReport.md

Key context:
- Repository layer (Wave 1): TicketRepository.findByIds(), TicketRepository.findByFilters(), Domain\Ticket::fromRow() — all exist
- AbstractPdoRepository with PdoConnection::get() in crm/src/Repositories/AbstractPdoRepository.php
- Solr config comes from existing legacy site_config.php constants: SOLR_HOST, SOLR_PORT, SOLR_PATH (or env vars SOLR_HOST/SOLR_PORT/SOLR_CORE)
- ADDRESS_SERVICE_TYPE env var: 'google' | 'nominatim' | 'city_gis' | 'none'
- ADDRESS_SERVICE_URL, ADDRESS_SERVICE_KEY env vars for provider config
- Geocoding results should be cached by address string (array cache; Redis optional)
- Solarium PHP client (solarium/solarium ^6) used for all Solr interaction
- TechArch §2.1: SearchService wraps all Solr calls; AddressService is geocoding abstraction
- TechArch §3.3: geoclusters table (id, lat, lng, zoom, count, updatedAt) — populated by Solr spatial heatmap job
- ticket_geodata table: (id, ticketId, lat, lng, address, addressNormalized, geoStatus ENUM(located,pending,failed), updatedAt)
- FRD F04 search params: q, status, substatusId, categoryId, departmentId, assigneeId, reporterEmail, dateFrom, dateTo, lat, lng, radius, bbox, sort, page, perPage, export
- FRD F04 response: { data: Ticket[], meta: { total, page, perPage, pages, facets: { status, category, department } } }
- FRD F05: GET /api/tickets/clusters with bbox, zoom, plus standard search filters → GeoCluster[]
- FRD F05: GET /api/geocode?address=... → { lat, lng, addressNormalized } (staff only)
</context>

<tasks>

<task type="auto">
  <name>Task 1: SearchService (Solarium client wrapper) + AddressService + GeoClusterService</name>
  <files>
    crm/src/Services/SearchService.php
    crm/src/Services/AddressService.php
    crm/src/Services/GeoClusterService.php
    crm/composer.json
  </files>
  <action>
**Step 1: Add solarium/solarium to composer.json**

In crm/composer.json, add to the `require` block:
```json
"solarium/solarium": "^6.3"
```

Also ensure `Services\\` namespace is registered under autoload.psr-4:
```json
"Services\\": "src/Services"
```

**Step 2: Create crm/src/Services/SearchService.php**

SearchService wraps ALL Solr calls per TechArch §2.1. Uses solarium/solarium ^6 client.

```php
<?php

declare(strict_types=1);

namespace Services;

use Repositories\TicketRepository;
use Solarium\Client as SolariumClient;
use Solarium\Core\Client\Adapter\Curl;
use Symfony\Component\EventDispatcher\EventDispatcher;

/**
 * SearchService — wraps all Apache Solr 9.x interactions.
 *
 * Responsibilities:
 * - Full-text search with faceted filters (F4)
 * - CSV export query (F4)
 * - Ticket document sync/delete on mutations (F4)
 * - Geo-cluster spatial heatmap queries (F5, delegated to GeoClusterService)
 *
 * Solr connection is configured from environment:
 *   SOLR_HOST  (default: solr)
 *   SOLR_PORT  (default: 8983)
 *   SOLR_CORE  (default: ureport)
 */
class SearchService
{
    private SolariumClient $solr;
    private TicketRepository $tickets;

    public function __construct(?SolariumClient $solr = null, ?TicketRepository $tickets = null)
    {
        $this->tickets = $tickets ?? new TicketRepository();
        $this->solr    = $solr ?? $this->buildSolrClient();
    }

    private function buildSolrClient(): SolariumClient
    {
        $config = [
            'endpoint' => [
                'default' => [
                    'host'    => getenv('SOLR_HOST') ?: 'solr',
                    'port'    => (int) (getenv('SOLR_PORT') ?: 8983),
                    'path'    => '/',
                    'core'    => getenv('SOLR_CORE') ?: 'ureport',
                    'timeout' => 5,
                ],
            ],
        ];

        return new SolariumClient(new Curl(), new EventDispatcher(), $config);
    }

    /**
     * Execute full-text search with filters.
     *
     * Accepted $params keys (all optional):
     *   q, status, substatusId, categoryId (int|int[]), departmentId (int|int[]),
     *   assigneeId, reporterEmail, dateFrom (Y-m-d), dateTo (Y-m-d),
     *   lat, lng, radius (meters), bbox (minLat,minLng,maxLat,maxLng),
     *   sort (date_desc|date_asc|sla_asc|assignee|category),
     *   page (int, default 1), perPage (int, default 25, max 100)
     *
     * Returns:
     *   ['ids' => int[], 'total' => int, 'facets' => ['status' => [...], 'category' => [...], 'department' => [...]]]
     */
    public function search(array $params): array
    {
        $query = $this->solr->createSelect();
        $query->setFields(['id']);

        // ── Full-text keyword ──
        if (!empty($params['q'])) {
            $safe = $query->getHelper()->escapeTerm(
                strip_tags(substr($params['q'], 0, 500))
            );
            $query->setQuery("title:{$safe} OR description:{$safe} OR address:{$safe} OR responses:{$safe}");
        } else {
            $query->setQuery('*:*');
        }

        // ── Filters ──
        $fq = ['deletedAt:[* TO NOW]']; // exclude deleted; Solr field deletedAt must be null → use NOT
        // Actually: only include non-deleted docs. Index stores deletedAt as datetime or empty.
        // Use negative filter: -deletedAt:[* TO *]
        $fq = ['-deletedAt:[* TO *]'];

        if (!empty($params['status'])) {
            $fq[] = 'status:' . $params['status'];
        }
        if (!empty($params['substatusId'])) {
            $fq[] = 'substatusId:' . (int) $params['substatusId'];
        }
        if (!empty($params['categoryId'])) {
            $ids  = is_array($params['categoryId']) ? $params['categoryId'] : [$params['categoryId']];
            $fq[] = 'categoryId:(' . implode(' OR ', array_map('intval', $ids)) . ')';
        }
        if (!empty($params['departmentId'])) {
            $ids  = is_array($params['departmentId']) ? $params['departmentId'] : [$params['departmentId']];
            $fq[] = 'departmentId:(' . implode(' OR ', array_map('intval', $ids)) . ')';
        }
        if (!empty($params['assigneeId'])) {
            $fq[] = 'personId:' . (int) $params['assigneeId'];
        }
        if (!empty($params['reporterEmail'])) {
            $fq[] = 'reporterEmail:' . $query->getHelper()->escapePhrase($params['reporterEmail']);
        }
        if (!empty($params['dateFrom'])) {
            $fq[] = 'datetimeOpened:[' . $params['dateFrom'] . 'T00:00:00Z TO *]';
        }
        if (!empty($params['dateTo'])) {
            $fq[] = 'datetimeOpened:[* TO ' . $params['dateTo'] . 'T23:59:59Z]';
        }
        // Geo bbox filter
        if (!empty($params['bbox'])) {
            [$minLat, $minLng, $maxLat, $maxLng] = explode(',', $params['bbox']);
            $fq[] = "lat:[{$minLat} TO {$maxLat}] AND lng:[{$minLng} TO {$maxLng}]";
        }
        // Geo radius filter using Solr spatial
        if (!empty($params['lat']) && !empty($params['lng']) && !empty($params['radius'])) {
            $distKm = round((float) $params['radius'] / 1000, 3);
            $fq[]   = sprintf('{!geofilt sfield=location pt=%s,%s d=%s}', $params['lat'], $params['lng'], $distKm);
        }

        foreach ($fq as $filter) {
            $query->createFilterQuery(md5($filter))->setQuery($filter);
        }

        // ── Sort ──
        $sortMap = [
            'date_desc' => ['datetimeOpened' => \Solarium\QueryType\Select\Query\Query::SORT_DESC],
            'date_asc'  => ['datetimeOpened' => \Solarium\QueryType\Select\Query\Query::SORT_ASC],
            'sla_asc'   => ['slaDueDate'     => \Solarium\QueryType\Select\Query\Query::SORT_ASC],
            'assignee'  => ['assigneeName'   => \Solarium\QueryType\Select\Query\Query::SORT_ASC],
            'category'  => ['categoryName'   => \Solarium\QueryType\Select\Query\Query::SORT_ASC],
        ];
        $sort = $sortMap[$params['sort'] ?? 'date_desc'] ?? $sortMap['date_desc'];
        foreach ($sort as $field => $dir) {
            $query->addSort($field, $dir);
        }

        // ── Pagination ──
        $page    = max(1, (int) ($params['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($params['perPage'] ?? 25)));
        $query->setStart(($page - 1) * $perPage)->setRows($perPage);

        // ── Facets (status, categoryId, departmentId) ──
        $facets = $query->getFacetSet();
        $facets->createFacetField('status')->setField('status');
        $facets->createFacetField('category')->setField('categoryId');
        $facets->createFacetField('department')->setField('departmentId');

        // ── Execute ──
        try {
            $result = $this->solr->select($query);
        } catch (\Exception $e) {
            throw new \RuntimeException('Search service unavailable: ' . $e->getMessage(), 503, $e);
        }

        $ids   = [];
        foreach ($result as $doc) {
            $ids[] = (int) $doc->id;
        }

        $facetData = [];
        foreach (['status', 'category', 'department'] as $facetName) {
            $facetData[$facetName] = [];
            $facet = $result->getFacetSet()->getFacet($facetName);
            if ($facet) {
                foreach ($facet as $value => $count) {
                    $facetData[$facetName][(string) $value] = $count;
                }
            }
        }

        return [
            'ids'    => $ids,
            'total'  => $result->getNumFound(),
            'facets' => $facetData,
        ];
    }

    /**
     * CSV export — same filters as search() but returns ALL matching IDs (up to 5000).
     * Returns ['ids' => int[], 'total' => int]
     */
    public function searchForExport(array $params): array
    {
        $params['page']    = 1;
        $params['perPage'] = 5000;
        return $this->search($params);
    }

    /**
     * Sync a single ticket into the Solr index.
     * Called after any ticket create/update/close/reopen.
     */
    public function syncTicket(int $ticketId): void
    {
        $ticket = $this->tickets->findById($ticketId);
        if ($ticket === null) {
            return;
        }

        $update = $this->solr->createUpdate();
        $doc    = $update->createDocument();

        $doc->id              = $ticket->id;
        $doc->title           = $ticket->title;
        $doc->description     = $ticket->description ?? '';
        $doc->status          = $ticket->status;
        $doc->categoryId      = $ticket->categoryId;
        $doc->departmentId    = $ticket->departmentId;
        $doc->personId        = $ticket->personId;
        $doc->substatusId     = $ticket->substatusId;
        $doc->reporterEmail   = $ticket->reporterEmail ?? '';
        $doc->address         = $ticket->address ?? '';
        $doc->datetimeOpened  = $ticket->datetimeOpened
            ? str_replace(' ', 'T', $ticket->datetimeOpened) . 'Z'
            : null;
        $doc->datetimeClosed  = $ticket->datetimeClosed
            ? str_replace(' ', 'T', $ticket->datetimeClosed) . 'Z'
            : null;
        $doc->mergedIntoTicketId = $ticket->mergedIntoTicketId;
        $doc->deletedAt       = $ticket->deletedAt
            ? str_replace(' ', 'T', $ticket->deletedAt) . 'Z'
            : null;

        // Geo point field (Solr location type: "lat,lng")
        if ($ticket->lat !== null && $ticket->lng !== null) {
            $doc->location = $ticket->lat . ',' . $ticket->lng;
        }

        $update->addDocument($doc);
        $update->addCommit();

        try {
            $this->solr->update($update);
        } catch (\Exception $e) {
            // Non-fatal: log but don't fail the ticket mutation
            error_log('[SearchService] Solr sync failed for ticket ' . $ticketId . ': ' . $e->getMessage());
        }
    }

    /**
     * Remove a ticket document from the Solr index (on hard delete).
     */
    public function deleteTicket(int $ticketId): void
    {
        try {
            $update = $this->solr->createUpdate();
            $update->addDeleteById((string) $ticketId);
            $update->addCommit();
            $this->solr->update($update);
        } catch (\Exception $e) {
            error_log('[SearchService] Solr delete failed for ticket ' . $ticketId . ': ' . $e->getMessage());
        }
    }

    /** Expose raw Solarium client for GeoClusterService spatial queries */
    public function getSolrClient(): SolariumClient
    {
        return $this->solr;
    }
}
```

**Step 3: Create crm/src/Services/AddressService.php**

Abstraction over geocoding providers. Reads ADDRESS_SERVICE_TYPE env var.

```php
<?php

declare(strict_types=1);

namespace Services;

/**
 * AddressService — geocoding/reverse-geocoding abstraction.
 *
 * Provider selected by ADDRESS_SERVICE_TYPE env var:
 *   'google'    → Google Maps Geocoding API (requires ADDRESS_SERVICE_KEY)
 *   'nominatim' → OpenStreetMap Nominatim (free, no key required)
 *   'city_gis'  → Custom GIS endpoint (requires ADDRESS_SERVICE_URL + optional KEY)
 *   'none'      → Geocoding disabled; lat/lng from caller is stored as-is
 *
 * Results are cached in-memory by address string.
 *
 * F5: Geocode on Ticket Create, Reverse Geocode on Coordinate-Only Submit
 */
class AddressService
{
    private string $type;
    private string $url;
    private string $key;

    /** Simple in-memory cache: address → result */
    private static array $geocodeCache = [];

    public function __construct(?string $type = null, ?string $url = null, ?string $key = null)
    {
        $this->type = $type ?? (getenv('ADDRESS_SERVICE_TYPE') ?: 'none');
        $this->url  = $url  ?? (getenv('ADDRESS_SERVICE_URL') ?: '');
        $this->key  = $key  ?? (getenv('ADDRESS_SERVICE_KEY') ?: '');
    }

    /**
     * Geocode an address string → coordinates.
     *
     * Returns ['lat' => float, 'lng' => float, 'addressNormalized' => string]
     * or null if geocoding fails / disabled.
     */
    public function geocode(string $address): ?array
    {
        if ($this->type === 'none' || $address === '') {
            return null;
        }

        $cacheKey = md5(strtolower(trim($address)));
        if (isset(self::$geocodeCache[$cacheKey])) {
            return self::$geocodeCache[$cacheKey];
        }

        $result = match ($this->type) {
            'google'    => $this->geocodeGoogle($address),
            'nominatim' => $this->geocodeNominatim($address),
            'city_gis'  => $this->geocodeCityGis($address),
            default     => null,
        };

        if ($result !== null) {
            self::$geocodeCache[$cacheKey] = $result;
        }

        return $result;
    }

    /**
     * Reverse-geocode coordinates → human-readable address string.
     * Returns address string or null on failure.
     */
    public function reverseGeocode(float $lat, float $lng): ?string
    {
        if ($this->type === 'none') {
            return null;
        }

        return match ($this->type) {
            'google'    => $this->reverseGeocodeGoogle($lat, $lng),
            'nominatim' => $this->reverseGeocodeNominatim($lat, $lng),
            'city_gis'  => $this->reverseGeocodeCityGis($lat, $lng),
            default     => null,
        };
    }

    // ── Google Maps ───────────────────────────────────────────────────────────

    private function geocodeGoogle(string $address): ?array
    {
        $url      = 'https://maps.googleapis.com/maps/api/geocode/json?' . http_build_query([
            'address' => $address,
            'key'     => $this->key,
        ]);
        $response = $this->httpGet($url);
        if ($response === null) {
            return null;
        }
        $data = json_decode($response, true);
        if (($data['status'] ?? '') !== 'OK' || empty($data['results'][0])) {
            return null;
        }
        $loc = $data['results'][0]['geometry']['location'];
        return [
            'lat'               => (float) $loc['lat'],
            'lng'               => (float) $loc['lng'],
            'addressNormalized' => $data['results'][0]['formatted_address'] ?? $address,
        ];
    }

    private function reverseGeocodeGoogle(float $lat, float $lng): ?string
    {
        $url      = 'https://maps.googleapis.com/maps/api/geocode/json?' . http_build_query([
            'latlng' => "{$lat},{$lng}",
            'key'    => $this->key,
        ]);
        $response = $this->httpGet($url);
        if ($response === null) {
            return null;
        }
        $data = json_decode($response, true);
        return $data['results'][0]['formatted_address'] ?? null;
    }

    // ── Nominatim ─────────────────────────────────────────────────────────────

    private function geocodeNominatim(string $address): ?array
    {
        $baseUrl  = $this->url ?: 'https://nominatim.openstreetmap.org';
        $url      = $baseUrl . '/search?' . http_build_query([
            'q'              => $address,
            'format'         => 'json',
            'limit'          => 1,
            'addressdetails' => 1,
        ]);
        $response = $this->httpGet($url, ['User-Agent: uReport/1.0']);
        if ($response === null) {
            return null;
        }
        $data = json_decode($response, true);
        if (empty($data[0])) {
            return null;
        }
        return [
            'lat'               => (float) $data[0]['lat'],
            'lng'               => (float) $data[0]['lon'],
            'addressNormalized' => $data[0]['display_name'] ?? $address,
        ];
    }

    private function reverseGeocodeNominatim(float $lat, float $lng): ?string
    {
        $baseUrl  = $this->url ?: 'https://nominatim.openstreetmap.org';
        $url      = $baseUrl . '/reverse?' . http_build_query([
            'lat'    => $lat,
            'lon'    => $lng,
            'format' => 'json',
        ]);
        $response = $this->httpGet($url, ['User-Agent: uReport/1.0']);
        if ($response === null) {
            return null;
        }
        $data = json_decode($response, true);
        return $data['display_name'] ?? null;
    }

    // ── City GIS ──────────────────────────────────────────────────────────────

    private function geocodeCityGis(string $address): ?array
    {
        if ($this->url === '') {
            return null;
        }
        $url      = $this->url . '?' . http_build_query(['address' => $address, 'key' => $this->key]);
        $response = $this->httpGet($url);
        if ($response === null) {
            return null;
        }
        $data = json_decode($response, true);
        if (empty($data['lat']) || empty($data['lng'])) {
            return null;
        }
        return [
            'lat'               => (float) $data['lat'],
            'lng'               => (float) $data['lng'],
            'addressNormalized' => $data['address'] ?? $address,
        ];
    }

    private function reverseGeocodeCityGis(float $lat, float $lng): ?string
    {
        if ($this->url === '') {
            return null;
        }
        $url      = $this->url . '/reverse?' . http_build_query(['lat' => $lat, 'lng' => $lng, 'key' => $this->key]);
        $response = $this->httpGet($url);
        if ($response === null) {
            return null;
        }
        $data = json_decode($response, true);
        return $data['address'] ?? null;
    }

    // ── HTTP helper ───────────────────────────────────────────────────────────

    private function httpGet(string $url, array $headers = []): ?string
    {
        $ctx = stream_context_create([
            'http' => [
                'timeout'        => 5,
                'ignore_errors'  => true,
                'header'         => implode("\r\n", $headers),
            ],
        ]);

        $response = @file_get_contents($url, false, $ctx);
        return $response !== false ? $response : null;
    }

    /** Clear in-memory cache (for testing) */
    public static function clearCache(): void
    {
        self::$geocodeCache = [];
    }
}
```

**Step 4: Create crm/src/Services/GeoClusterService.php**

Uses Solr spatial heatmap facet to build cluster array; falls back to geoclusters table cache.

```php
<?php

declare(strict_types=1);

namespace Services;

use Infrastructure\Database\PdoConnection;

/**
 * GeoClusterService — returns ticket geo-cluster data for map density rendering.
 *
 * Primary source: Solr spatial heatmap facet (live, filtered by search params).
 * Fallback: geoclusters MySQL cache table (pre-computed, unfiltered).
 *
 * F5: Geo-Cluster Map Data process
 */
class GeoClusterService
{
    private SearchService $search;
    private \PDO $pdo;

    public function __construct(?SearchService $search = null, ?\PDO $pdo = null)
    {
        $this->search = $search ?? new SearchService();
        $this->pdo    = $pdo ?? PdoConnection::get();
    }

    /**
     * Return cluster array for map rendering.
     *
     * $params accepted keys: bbox, zoom (1–20), plus all SearchService filter params.
     *
     * Returns array of:
     *   [['lat' => float, 'lng' => float, 'count' => int, 'zoom' => int], ...]
     */
    public function getClusters(array $params): array
    {
        $zoom = max(1, min(20, (int) ($params['zoom'] ?? 10)));

        // Attempt Solr spatial heatmap
        try {
            return $this->getFromSolr($params, $zoom);
        } catch (\Exception $e) {
            // Fall back to MySQL geoclusters cache
            error_log('[GeoClusterService] Solr unavailable, falling back to geoclusters table: ' . $e->getMessage());
            return $this->getFromCache($zoom, $params['bbox'] ?? null);
        }
    }

    /**
     * Query Solr spatial heatmap facet to build dynamic clusters.
     */
    private function getFromSolr(array $params, int $zoom): array
    {
        $solr  = $this->search->getSolrClient();
        $query = $solr->createSelect();
        $query->setQuery('*:*');
        $query->setRows(0); // we only need facets, not docs

        // Apply same filters as search (excluding pagination/sort)
        $fq = ['-deletedAt:[* TO *]'];
        if (!empty($params['status'])) {
            $fq[] = 'status:' . $params['status'];
        }
        if (!empty($params['categoryId'])) {
            $ids  = is_array($params['categoryId']) ? $params['categoryId'] : [$params['categoryId']];
            $fq[] = 'categoryId:(' . implode(' OR ', array_map('intval', $ids)) . ')';
        }
        if (!empty($params['departmentId'])) {
            $ids  = is_array($params['departmentId']) ? $params['departmentId'] : [$params['departmentId']];
            $fq[] = 'departmentId:(' . implode(' OR ', array_map('intval', $ids)) . ')';
        }
        if (!empty($params['bbox'])) {
            [$minLat, $minLng, $maxLat, $maxLng] = explode(',', $params['bbox']);
            $fq[] = "lat:[{$minLat} TO {$maxLat}] AND lng:[{$minLng} TO {$maxLng}]";
        }
        foreach ($fq as $filter) {
            $query->createFilterQuery(md5($filter))->setQuery($filter);
        }

        // Spatial heatmap facet — grid resolution tied to zoom level
        $gridLevel = max(1, min(11, (int) round($zoom * 0.55)));

        // Use JSON facets for heatmap (Solr 7+)
        $query->getParams()->add('json.facet', json_encode([
            'heatmap' => [
                'type'       => 'heatmap',
                'field'      => 'location',
                'gridLevel'  => $gridLevel,
                'geom'       => !empty($params['bbox'])
                    ? sprintf('[%s %s TO %s %s]',
                        $params['bbox'][1] ?? -180,
                        $params['bbox'][0] ?? -90,
                        $params['bbox'][3] ?? 180,
                        $params['bbox'][2] ?? 90)
                    : '[-180 -90 TO 180 90]',
                'distErrPct' => 0.1,
            ],
        ]));

        $result   = $solr->select($query);
        $response = $result->getData();

        $clusters = [];
        $heatmap  = $response['facets']['heatmap'] ?? null;

        if ($heatmap && !empty($heatmap['counts_ints2D'])) {
            $minLat  = (float) ($heatmap['minY'] ?? -90);
            $maxLat  = (float) ($heatmap['maxY'] ?? 90);
            $minLng  = (float) ($heatmap['minX'] ?? -180);
            $maxLng  = (float) ($heatmap['maxX'] ?? 180);
            $rows    = $heatmap['rows']   ?? 1;
            $columns = $heatmap['columns'] ?? 1;
            $latStep = ($maxLat - $minLat) / max(1, $rows);
            $lngStep = ($maxLng - $minLng) / max(1, $columns);

            foreach ($heatmap['counts_ints2D'] as $r => $row) {
                if (!is_array($row)) {
                    continue;
                }
                foreach ($row as $c => $count) {
                    if ($count > 0) {
                        $clusters[] = [
                            'lat'   => round($minLat + ($r + 0.5) * $latStep, 6),
                            'lng'   => round($minLng + ($c + 0.5) * $lngStep, 6),
                            'count' => (int) $count,
                            'zoom'  => $zoom,
                        ];
                    }
                }
            }
        }

        return $clusters;
    }

    /**
     * Fallback: read from the geoclusters MySQL cache table.
     * Optionally filter by bbox.
     */
    private function getFromCache(int $zoom, ?string $bbox): array
    {
        $where  = ['zoom = :zoom'];
        $params = ['zoom' => $zoom];

        if ($bbox !== null) {
            [$minLat, $minLng, $maxLat, $maxLng] = explode(',', $bbox);
            $where[]          = 'lat BETWEEN :minLat AND :maxLat';
            $where[]          = 'lng BETWEEN :minLng AND :maxLng';
            $params['minLat'] = $minLat;
            $params['maxLat'] = $maxLat;
            $params['minLng'] = $minLng;
            $params['maxLng'] = $maxLng;
        }

        $sql  = 'SELECT lat, lng, count, zoom FROM geoclusters WHERE ' . implode(' AND ', $where);
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        $clusters = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $clusters[] = [
                'lat'   => (float) $row['lat'],
                'lng'   => (float) $row['lng'],
                'count' => (int) $row['count'],
                'zoom'  => (int) $row['zoom'],
            ];
        }

        return $clusters;
    }
}
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/crm

# composer.json has solarium dependency
grep -n 'solarium/solarium' composer.json && echo "SOLARIUM_DEP OK"

# Services namespace in autoload
grep -n '"Services\\\\"' composer.json && echo "SERVICES_NS OK"

# All three service files exist
ls src/Services/SearchService.php src/Services/AddressService.php src/Services/GeoClusterService.php && echo "SERVICE_FILES OK"

# SearchService has required public methods
grep -n 'function search\b' src/Services/SearchService.php && echo "SEARCH_METHOD OK"
grep -n 'function syncTicket\b' src/Services/SearchService.php && echo "SYNC_METHOD OK"
grep -n 'function deleteTicket\b' src/Services/SearchService.php && echo "DELETE_METHOD OK"

# AddressService has geocode + reverseGeocode
grep -n 'function geocode\b' src/Services/AddressService.php && echo "GEOCODE_METHOD OK"
grep -n 'function reverseGeocode\b' src/Services/AddressService.php && echo "REVERSE_METHOD OK"

# GeoClusterService has getClusters
grep -n 'function getClusters\b' src/Services/GeoClusterService.php && echo "CLUSTERS_METHOD OK"

# PHP syntax check all three
php -l src/Services/SearchService.php && php -l src/Services/AddressService.php && php -l src/Services/GeoClusterService.php && echo "PHP_SYNTAX OK"

# Autoload dump
composer dump-autoload --quiet && echo "AUTOLOAD OK"
```
  </verify>
  <done>
- composer.json includes `solarium/solarium: ^6.3` in require block and `Services\\` in psr-4 autoload
- crm/src/Services/SearchService.php exists with public methods: search(), searchForExport(), syncTicket(), deleteTicket(), getSolrClient()
- crm/src/Services/AddressService.php exists with public methods: geocode(), reverseGeocode(); respects ADDRESS_SERVICE_TYPE env var (google|nominatim|city_gis|none); in-memory cache by address
- crm/src/Services/GeoClusterService.php exists with public method getClusters(); falls back to geoclusters table when Solr unavailable
- All three files pass `php -l` syntax check
- `composer dump-autoload` exits 0
  </done>
</task>

<task type="auto">
  <name>Task 2: SearchController (GET /api/tickets + CSV export) + GeoController (clusters, geocode, location)</name>
  <files>
    crm/src/Controllers/Api/SearchController.php
    crm/src/Controllers/Api/GeoController.php
  </files>
  <action>
**Create crm/src/Controllers/Api/SearchController.php**

Handles `GET /api/tickets` with full filter params, pagination, and CSV export mode.
Delegates search to SearchService (Solr IDs), hydrates records from TicketRepository.findByIds().
Returns standard JSON envelope: `{ data: Ticket[], meta: { total, page, perPage, pages, facets } }`.

From TechArch §4.3:
```
GET /api/tickets  — Any (role-filtered) — Search/list tickets
GET /api/tickets?export=csv — staff/admin — CSV export
```

From FRD F04 — CSV columns: Ticket ID, Title, Status, Substatus, Category, Department, Assignee, Reporter, Address, Date Opened, Date Closed, SLA Days, Late.
From FRD F04 — export cap: 5000 rows max (HTTP 413 if exceeded).

```php
<?php

declare(strict_types=1);

namespace Controllers\Api;

use Repositories\TicketRepository;
use Services\SearchService;

/**
 * SearchController — GET /api/tickets (list + search + CSV export).
 *
 * F4: Full-Text Search & Filtering
 *
 * Search flow:
 *   1. Parse filter params from query string
 *   2. Call SearchService::search() → Solr returns IDs + facets + total
 *   3. Hydrate full Ticket records from MySQL via TicketRepository::findByIds()
 *   4. Return JSON envelope or CSV stream
 */
class SearchController
{
    private SearchService $searchService;
    private TicketRepository $tickets;

    public function __construct(?SearchService $searchService = null, ?TicketRepository $tickets = null)
    {
        $this->searchService = $searchService ?? new SearchService();
        $this->tickets       = $tickets ?? new TicketRepository();
    }

    /**
     * GET /api/tickets
     * Query params: q, status, substatusId, categoryId, departmentId, assigneeId,
     *               reporterEmail, dateFrom, dateTo, lat, lng, radius, bbox,
     *               sort, page, perPage, export (csv)
     */
    public function index(): void
    {
        $params = $this->parseParams();

        // ── CSV Export mode ──
        if (!empty($params['export']) && $params['export'] === 'csv') {
            $this->streamCsvExport($params);
            return;
        }

        // ── Normal paginated search ──
        try {
            $result = $this->searchService->search($params);
        } catch (\RuntimeException $e) {
            if ($e->getCode() === 503) {
                http_response_code(503);
                $this->jsonResponse(['data' => null, 'meta' => [], 'errors' => [
                    ['field' => null, 'message' => 'Search service is temporarily unavailable', 'code' => 'SEARCH_UNAVAILABLE'],
                ]]);
                return;
            }
            throw $e;
        }

        $page    = max(1, (int) ($params['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($params['perPage'] ?? 25)));
        $total   = $result['total'];
        $pages   = $total > 0 ? (int) ceil($total / $perPage) : 0;

        // Hydrate from MySQL
        $ticketRows = $this->tickets->findByIds($result['ids']);

        $this->jsonResponse([
            'data'   => array_map([$this, 'ticketToArray'], $ticketRows),
            'meta'   => [
                'total'   => $total,
                'page'    => $page,
                'perPage' => $perPage,
                'pages'   => $pages,
                'facets'  => $result['facets'],
            ],
            'errors' => [],
        ]);
    }

    private function streamCsvExport(array $params): void
    {
        try {
            $result = $this->searchService->searchForExport($params);
        } catch (\RuntimeException $e) {
            http_response_code(503);
            $this->jsonResponse(['data' => null, 'meta' => [], 'errors' => [
                ['field' => null, 'message' => 'Search service unavailable for export', 'code' => 'SEARCH_UNAVAILABLE'],
            ]]);
            return;
        }

        if ($result['total'] > 5000) {
            http_response_code(413);
            $this->jsonResponse(['data' => null, 'meta' => [], 'errors' => [
                ['field' => null, 'message' => 'Export exceeds maximum 5000 rows; refine filters', 'code' => 'EXPORT_TOO_LARGE'],
            ]]);
            return;
        }

        $tickets = $this->tickets->findByIds($result['ids']);

        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="tickets.csv"');
        header('Cache-Control: no-cache');

        $out = fopen('php://output', 'w');

        // BOM for Excel compatibility
        fwrite($out, "\xEF\xBB\xBF");

        // F04 CSV columns: Ticket ID, Title, Status, Substatus, Category, Department, Assignee, Reporter, Address, Date Opened, Date Closed, SLA Days, Late
        fputcsv($out, [
            'Ticket ID', 'Title', 'Status', 'Substatus ID', 'Category ID', 'Department ID',
            'Assignee ID', 'Reporter Name', 'Reporter Email', 'Address',
            'Date Opened', 'Date Closed', 'SLA Days', 'Merged Into',
        ]);

        foreach ($tickets as $ticket) {
            fputcsv($out, [
                $ticket->id,
                $ticket->title,
                $ticket->status,
                $ticket->substatusId ?? '',
                $ticket->categoryId,
                $ticket->departmentId,
                $ticket->personId ?? '',
                $ticket->reporterName ?? '',
                $ticket->reporterEmail ?? '',
                $ticket->address ?? '',
                $ticket->datetimeOpened,
                $ticket->datetimeClosed ?? '',
                '', // SLA days — requires category join; placeholder for wave 2a enrichment
                $ticket->mergedIntoTicketId ?? '',
            ]);
        }

        fclose($out);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function parseParams(): array
    {
        return [
            'q'             => $_GET['q'] ?? null,
            'status'        => $_GET['status'] ?? null,
            'substatusId'   => isset($_GET['substatusId']) ? (int) $_GET['substatusId'] : null,
            'categoryId'    => isset($_GET['categoryId'])
                ? (is_array($_GET['categoryId']) ? $_GET['categoryId'] : [(int) $_GET['categoryId']])
                : null,
            'departmentId'  => isset($_GET['departmentId'])
                ? (is_array($_GET['departmentId']) ? $_GET['departmentId'] : [(int) $_GET['departmentId']])
                : null,
            'assigneeId'    => isset($_GET['assigneeId']) ? (int) $_GET['assigneeId'] : null,
            'reporterEmail' => $_GET['reporterEmail'] ?? null,
            'dateFrom'      => $_GET['dateFrom'] ?? null,
            'dateTo'        => $_GET['dateTo'] ?? null,
            'lat'           => isset($_GET['lat']) ? (float) $_GET['lat'] : null,
            'lng'           => isset($_GET['lng']) ? (float) $_GET['lng'] : null,
            'radius'        => isset($_GET['radius']) ? (int) $_GET['radius'] : null,
            'bbox'          => $_GET['bbox'] ?? null,
            'sort'          => $_GET['sort'] ?? 'date_desc',
            'page'          => isset($_GET['page']) ? (int) $_GET['page'] : 1,
            'perPage'       => isset($_GET['perPage']) ? (int) $_GET['perPage'] : 25,
            'export'        => $_GET['export'] ?? null,
        ];
    }

    private function ticketToArray(\Domain\Ticket $ticket): array
    {
        return [
            'id'                  => $ticket->id,
            'title'               => $ticket->title,
            'description'         => $ticket->description,
            'status'              => $ticket->status,
            'categoryId'          => $ticket->categoryId,
            'departmentId'        => $ticket->departmentId,
            'assigneeId'          => $ticket->personId,
            'reporterPersonId'    => $ticket->reporterPersonId,
            'reporterName'        => $ticket->reporterName,
            'reporterEmail'       => $ticket->reporterEmail,
            'reporterPhone'       => $ticket->reporterPhone,
            'address'             => $ticket->address,
            'lat'                 => $ticket->lat !== null ? (float) $ticket->lat : null,
            'lng'                 => $ticket->lng !== null ? (float) $ticket->lng : null,
            'substatusId'         => $ticket->substatusId,
            'mergedIntoTicketId'  => $ticket->mergedIntoTicketId,
            'customFields'        => $ticket->customFields !== null
                ? json_decode($ticket->customFields, true)
                : null,
            'datetimeOpened'      => $ticket->datetimeOpened,
            'datetimeClosed'      => $ticket->datetimeClosed,
            'datetimeUpdated'     => $ticket->datetimeUpdated,
        ];
    }

    private function jsonResponse(array $data): void
    {
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=UTF-8');
        }
        echo json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }
}
```

**Create crm/src/Controllers/Api/GeoController.php**

Handles three geo endpoints from TechArch §4.3 and FRD F05:

```
GET /api/tickets/clusters    — GeoCluster[] for map density
GET /api/geocode             — Geocode address string (staff only)
GET /api/tickets/{id}/location — ticket_geodata record
```

```php
<?php

declare(strict_types=1);

namespace Controllers\Api;

use Infrastructure\Database\PdoConnection;
use Services\AddressService;
use Services\GeoClusterService;

/**
 * GeoController — geospatial endpoints.
 *
 * F5: Geospatial Features
 *
 * Endpoints:
 *   GET /api/tickets/clusters      — cluster map data
 *   GET /api/geocode               — address → lat/lng (staff utility)
 *   GET /api/tickets/{id}/location — ticket_geodata record
 */
class GeoController
{
    private GeoClusterService $clusters;
    private AddressService $address;
    private \PDO $pdo;

    public function __construct(
        ?GeoClusterService $clusters = null,
        ?AddressService    $address  = null,
        ?\PDO              $pdo      = null,
    ) {
        $this->clusters = $clusters ?? new GeoClusterService();
        $this->address  = $address  ?? new AddressService();
        $this->pdo      = $pdo      ?? PdoConnection::get();
    }

    /**
     * GET /api/tickets/clusters
     * Query params: bbox, zoom, plus any search filter params (status, categoryId, etc.)
     *
     * Returns: { data: GeoCluster[], meta: {}, errors: [] }
     * GeoCluster: { lat: float, lng: float, count: int, zoom: int }
     */
    public function clusters(): void
    {
        $params = [
            'bbox'         => $_GET['bbox'] ?? null,
            'zoom'         => isset($_GET['zoom']) ? (int) $_GET['zoom'] : 10,
            'status'       => $_GET['status'] ?? null,
            'categoryId'   => isset($_GET['categoryId'])
                ? (is_array($_GET['categoryId']) ? $_GET['categoryId'] : [(int) $_GET['categoryId']])
                : null,
            'departmentId' => isset($_GET['departmentId'])
                ? (is_array($_GET['departmentId']) ? $_GET['departmentId'] : [(int) $_GET['departmentId']])
                : null,
        ];

        // Validate bbox if present
        if ($params['bbox'] !== null) {
            $parts = explode(',', $params['bbox']);
            if (count($parts) !== 4) {
                http_response_code(422);
                $this->jsonResponse(['data' => null, 'meta' => [], 'errors' => [
                    ['field' => 'bbox', 'message' => 'Bounding box must be minLat,minLng,maxLat,maxLng', 'code' => 'INVALID_BBOX'],
                ]]);
                return;
            }
        }

        // Validate zoom
        $zoom = max(1, min(20, $params['zoom']));
        $params['zoom'] = $zoom;

        $clusterData = $this->clusters->getClusters($params);

        $this->jsonResponse([
            'data'   => $clusterData,
            'meta'   => [],
            'errors' => [],
        ]);
    }

    /**
     * GET /api/geocode?address=<string>
     * Staff only — geocode utility for SPA map picker.
     *
     * Returns: { data: { lat, lng, addressNormalized }, meta: {}, errors: [] }
     * From TechArch §4.3: GET /api/geocode | staff | Geocode address string
     */
    public function geocode(): void
    {
        $address = trim($_GET['address'] ?? '');

        if ($address === '') {
            http_response_code(422);
            $this->jsonResponse(['data' => null, 'meta' => [], 'errors' => [
                ['field' => 'address', 'message' => 'Address parameter is required', 'code' => 'ADDRESS_REQUIRED'],
            ]]);
            return;
        }

        if (mb_strlen($address) > 500) {
            http_response_code(422);
            $this->jsonResponse(['data' => null, 'meta' => [], 'errors' => [
                ['field' => 'address', 'message' => 'Address must be 500 characters or less', 'code' => 'ADDRESS_TOO_LONG'],
            ]]);
            return;
        }

        $result = $this->address->geocode($address);

        if ($result === null) {
            // Non-fatal per FRD F05: geocoding failure is not an error, just no result
            http_response_code(422);
            $this->jsonResponse(['data' => null, 'meta' => [], 'errors' => [
                ['field' => 'address', 'message' => 'Address could not be geocoded; please provide coordinates manually', 'code' => 'ADDRESS_NOT_FOUND'],
            ]]);
            return;
        }

        $this->jsonResponse([
            'data'   => [
                'lat'               => $result['lat'],
                'lng'               => $result['lng'],
                'addressNormalized' => $result['addressNormalized'],
            ],
            'meta'   => [],
            'errors' => [],
        ]);
    }

    /**
     * GET /api/tickets/{id}/location
     * Returns ticket_geodata record for a specific ticket.
     * From TechArch §4.3: GET /api/tickets/{id}/location | Any (visibility-checked)
     */
    public function location(int $ticketId): void
    {
        $stmt = $this->pdo->prepare(
            'SELECT tg.* FROM ticket_geodata tg
             JOIN tickets t ON t.id = tg.ticketId
             WHERE tg.ticketId = :ticketId AND t.deletedAt IS NULL'
        );
        $stmt->execute(['ticketId' => $ticketId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($row === false) {
            http_response_code(404);
            $this->jsonResponse(['data' => null, 'meta' => [], 'errors' => [
                ['field' => null, 'message' => 'Ticket not found or has no location data', 'code' => 'NOT_FOUND'],
            ]]);
            return;
        }

        $this->jsonResponse([
            'data'   => [
                'ticketId'          => (int) $row['ticketId'],
                'lat'               => $row['lat'] !== null ? (float) $row['lat'] : null,
                'lng'               => $row['lng'] !== null ? (float) $row['lng'] : null,
                'address'           => $row['address'],
                'addressNormalized' => $row['addressNormalized'],
                'geoStatus'         => $row['geoStatus'],
            ],
            'meta'   => [],
            'errors' => [],
        ]);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private function jsonResponse(array $data): void
    {
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=UTF-8');
        }
        echo json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }
}
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/crm

# Both controller files exist
ls src/Controllers/Api/SearchController.php src/Controllers/Api/GeoController.php && echo "CONTROLLER_FILES OK"

# SearchController has required methods
grep -n 'function index\b' src/Controllers/Api/SearchController.php && echo "SEARCH_INDEX OK"
grep -n 'export=csv\|streamCsvExport' src/Controllers/Api/SearchController.php && echo "CSV_EXPORT OK"

# GeoController has all three endpoint methods
grep -n 'function clusters\b' src/Controllers/Api/GeoController.php && echo "CLUSTERS_METHOD OK"
grep -n 'function geocode\b' src/Controllers/Api/GeoController.php && echo "GEOCODE_METHOD OK"
grep -n 'function location\b' src/Controllers/Api/GeoController.php && echo "LOCATION_METHOD OK"

# GeoController references ticket_geodata table (F5 schema)
grep -n 'ticket_geodata' src/Controllers/Api/GeoController.php && echo "GEODATA_TABLE OK"

# PHP syntax check both controllers
php -l src/Controllers/Api/SearchController.php && php -l src/Controllers/Api/GeoController.php && echo "PHP_SYNTAX OK"

# SearchController uses SearchService and TicketRepository
grep -n 'SearchService' src/Controllers/Api/SearchController.php && echo "SEARCH_SERVICE_REF OK"
grep -n 'TicketRepository' src/Controllers/Api/SearchController.php && echo "TICKET_REPO_REF OK"

# GeoController uses GeoClusterService and AddressService
grep -n 'GeoClusterService' src/Controllers/Api/GeoController.php && echo "CLUSTER_SERVICE_REF OK"
grep -n 'AddressService' src/Controllers/Api/GeoController.php && echo "ADDRESS_SERVICE_REF OK"

# Full autoload still clean
composer dump-autoload --quiet && echo "AUTOLOAD OK"
```
  </verify>
  <done>
- crm/src/Controllers/Api/SearchController.php exists with index() handling GET /api/tickets — parses all F4 filter params (q, status, substatusId, categoryId, departmentId, assigneeId, reporterEmail, dateFrom, dateTo, lat, lng, radius, bbox, sort, page, perPage) and export=csv
- CSV export: streams text/csv with Content-Disposition attachment, BOM, F4-specified columns, 5000-row cap (HTTP 413 if exceeded)
- Solr 503 is caught and returned as { errors: [{ code: SEARCH_UNAVAILABLE }] }
- crm/src/Controllers/Api/GeoController.php exists with clusters(), geocode(), location() methods
- clusters() accepts bbox, zoom, status, categoryId, departmentId — returns GeoCluster[] via GeoClusterService
- geocode() validates address param, calls AddressService, returns { lat, lng, addressNormalized } or 422 ADDRESS_NOT_FOUND
- location() queries ticket_geodata JOIN tickets WHERE ticketId = :id, returns all geodata fields or 404
- All PHP syntax checks pass; composer dump-autoload exits 0
  </done>
</task>

</tasks>

<verification>
```bash
cd /app/workspaces/pivota/uReport/crm

# All 5 new files exist
ls src/Services/SearchService.php \
   src/Services/AddressService.php \
   src/Services/GeoClusterService.php \
   src/Controllers/Api/SearchController.php \
   src/Controllers/Api/GeoController.php && echo "ALL_FILES_PRESENT"

# Verify integration contracts
grep -n 'class SearchService' src/Services/SearchService.php && echo CONTRACT_OK
grep -n 'class AddressService' src/Services/AddressService.php && echo CONTRACT_OK
grep -n 'class GeoClusterService' src/Services/GeoClusterService.php && echo CONTRACT_OK
grep -n 'class SearchController' src/Controllers/Api/SearchController.php && echo CONTRACT_OK
grep -n 'class GeoController' src/Controllers/Api/GeoController.php && echo CONTRACT_OK

# PHP syntax check all 5
for f in src/Services/SearchService.php src/Services/AddressService.php src/Services/GeoClusterService.php src/Controllers/Api/SearchController.php src/Controllers/Api/GeoController.php; do
  php -l "$f" || echo "SYNTAX ERROR: $f"
done && echo "ALL_SYNTAX OK"

# composer.json has solarium dependency and Services autoload
grep '"solarium/solarium"' composer.json && echo "SOLARIUM_DEP OK"
grep '"Services\\\\"' composer.json && echo "SERVICES_AUTOLOAD OK"

# composer dump-autoload clean
composer dump-autoload --quiet && echo "AUTOLOAD CLEAN"

# Verify Wave 1 contracts are consumed correctly
grep -n 'findByIds' src/Controllers/Api/SearchController.php && echo "WAVE1_CONTRACT_CONSUMED OK"
grep -n 'PdoConnection' src/Controllers/Api/GeoController.php && echo "WAVE1_PDO_CONSUMED OK"
```
</verification>

<success_criteria>
- `SearchService` wraps all Solr interactions via Solarium client; no direct curl-to-Solr elsewhere
- `SearchService::search()` returns `['ids', 'total', 'facets']`; controllers hydrate from MySQL
- `AddressService` dispatches to the correct provider based on `ADDRESS_SERVICE_TYPE` env var; results are in-memory cached
- `GeoClusterService::getClusters()` returns Solr heatmap data or falls back to `geoclusters` MySQL cache table on Solr failure
- `GET /api/tickets` returns `{ data: Ticket[], meta: { total, page, perPage, pages, facets } }` JSON envelope
- `GET /api/tickets?export=csv` streams a UTF-8 CSV with BOM; HTTP 413 if > 5000 rows
- `GET /api/tickets/clusters` returns `GeoCluster[]` with `lat, lng, count, zoom` fields
- `GET /api/geocode?address=` returns `{ lat, lng, addressNormalized }` or 422 `ADDRESS_NOT_FOUND`
- `GET /api/tickets/{id}/location` returns `ticket_geodata` fields or 404
- All 5 PHP files pass `php -l`; `composer dump-autoload` exits 0
</success_criteria>

<output>
After completion, create `.planning/express/modernize-the-ureport-legacy-php-crm-imp/07-SUMMARY.md` with:
- Files created/modified
- Key decisions made (Solarium client version, geocoding cache strategy, cluster fallback)
- Integration contract status (what Wave 3c can now consume)
- Any deviations from spec
</output>
