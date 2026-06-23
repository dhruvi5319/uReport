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
        // Only include non-deleted docs. Index stores deletedAt as datetime or empty.
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

        $ids = [];
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
     * Returns ['ids' => int[], 'total' => int, 'facets' => array]
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

    /**
     * Expose raw Solarium client for GeoClusterService spatial queries.
     */
    public function getSolrClient(): SolariumClient
    {
        return $this->solr;
    }
}
