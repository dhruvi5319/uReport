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
