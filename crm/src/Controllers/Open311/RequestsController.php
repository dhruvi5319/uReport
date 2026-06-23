<?php
declare(strict_types=1);
namespace Controllers\Open311;

use Domain\Ticket;
use Repositories\CategoryRepository;
use Repositories\ClientRepository;
use Repositories\DepartmentRepository;
use Repositories\TicketRepository;
use Repositories\ActionRepository;
use Repositories\PersonRepository;

class RequestsController
{
    public function __construct(
        private readonly TicketRepository     $ticketRepo,
        private readonly ActionRepository     $actionRepo,
        private readonly CategoryRepository   $categoryRepo,
        private readonly ClientRepository     $clientRepo,
        private readonly DepartmentRepository $deptRepo,
        private readonly PersonRepository     $personRepo,
    ) {}

    /**
     * POST /open311/requests
     * Submit a new service request. Returns [{service_request_id, token}].
     */
    public function create(array $body, array $params = []): void
    {
        $format = $params['format'] ?? 'json';

        // Validate service_code
        $serviceCode = (int) ($body['service_code'] ?? 0);
        if ($serviceCode <= 0) {
            $this->respondError(400, 'service_code is required', $format);
            return;
        }

        $category = $this->categoryRepo->findById($serviceCode);
        if ($category === null || !$category->active) {
            $this->respondError(404, 'service_code not found', $format);
            return;
        }

        // Check posting permission — Open311 can only post to public/anonymous categories
        if (!in_array($category->postingPermission, ['public', 'anonymous'], true)) {
            $this->respondError(403, 'This service requires authentication', $format);
            return;
        }

        // Validate api_key if provided — bcrypt verification against clients.apiKeyHash
        $apiClientId = null;
        if (!empty($body['api_key'])) {
            $client = $this->clientRepo->findByApiKey($body['api_key']);
            if ($client === null || !$client->active) {
                $this->respondError(400, 'Invalid api_key', $format);
                return;
            }
            $apiClientId = $client->id;
        }

        // Validate location: at least one of lat/long or address_string required
        $lat  = isset($body['lat'])  ? (float) $body['lat']  : null;
        $long = isset($body['long']) ? (float) $body['long'] : null; // Open311 uses 'long'
        $addr = $body['address_string'] ?? null;

        if ($lat === null && $long === null && empty($addr)) {
            $this->respondError(400, 'lat/long or address_string required', $format);
            return;
        }

        // Build ticket data from Open311 fields
        $department = $this->deptRepo->findById($category->departmentId);

        // Resolve reporter person from contact fields (email lookup)
        $reporterPersonId = null;
        if (!empty($body['email'])) {
            $existingPerson   = $this->personRepo->findByEmail($body['email']);
            $reporterPersonId = $existingPerson?->id;
        }

        // Create the ticket via TicketRepository
        $newTicket = $this->ticketRepo->save(new Ticket(
            id:                 0,
            title:              $body['description'] ?? ('Open311 request: ' . $category->name),
            description:        $body['description'] ?? null,
            status:             'open',
            datetimeOpened:     date('Y-m-d H:i:s'),
            datetimeClosed:     null,
            datetimeUpdated:    date('Y-m-d H:i:s'),
            deletedAt:          null,
            categoryId:         $category->id,
            departmentId:       $category->departmentId,
            personId:           $category->defaultAssigneeId ?? ($department?->defaultAssigneeId ?? null),
            reporterPersonId:   $reporterPersonId,
            reporterName:       trim(($body['first_name'] ?? '') . ' ' . ($body['last_name'] ?? '')) ?: null,
            reporterEmail:      $body['email'] ?? null,
            reporterPhone:      $body['phone'] ?? null,
            address:            $addr,
            lat:                $lat !== null ? (string) $lat : null,
            lng:                $long !== null ? (string) $long : null,  // store as lng internally
            substatusId:        null,
            mergedIntoTicketId: null,
            apiClientId:        $apiClientId,
            customFields:       $this->buildCustomFields($category, $body),
        ));

        // Record open action
        $this->actionRepo->insert(new \Domain\Action(
            id:              0,
            ticketId:        $newTicket->id,
            type:            'open',
            visibility:      'external',
            actorPersonId:   null,
            actorClientId:   $apiClientId,
            datetimeCreated: date('Y-m-d H:i:s'),
            payload:         null,
        ));

        // Open311 success response: [{service_request_id, token}]
        http_response_code(201);
        $response = [['service_request_id' => (string) $newTicket->id, 'token' => '']];
        $this->respond($response, $format, 'service_requests', 'request');
    }

    /**
     * GET /open311/requests[?service_request_id=&service_code=&status=&start_date=&end_date=&page=&page_size=&format=]
     * Returns paginated service request objects.
     */
    public function index(array $params = []): void
    {
        $format = $params['format'] ?? 'json';

        // Handle comma-separated service_request_id list
        if (!empty($params['service_request_id'])) {
            $ids     = array_map('intval', explode(',', $params['service_request_id']));
            $tickets = $this->ticketRepo->findByIds($ids);
            $data    = array_map(fn($t) => $this->ticketToServiceRequest($t), $tickets);
            $this->respond($data, $format, 'service_requests', 'request');
            return;
        }

        // Build filters for TicketRepository
        $filters = [];
        if (!empty($params['service_code'])) {
            $filters['categoryId'] = (int) $params['service_code'];
        }
        if (!empty($params['status'])) {
            $filters['status'] = $params['status'];
        }
        if (!empty($params['start_date'])) {
            $filters['dateFrom'] = $params['start_date'];
        }
        if (!empty($params['end_date'])) {
            $filters['dateTo'] = $params['end_date'];
        }

        $page     = max(1, (int) ($params['page'] ?? 1));
        $pageSize = min(200, max(1, (int) ($params['page_size'] ?? 50)));

        $result  = $this->ticketRepo->findByFilters($filters, $page, $pageSize);
        $tickets = $result['rows'];

        $data = array_map(fn($t) => $this->ticketToServiceRequest($t), $tickets);
        $this->respond($data, $format, 'service_requests', 'request');
    }

    /**
     * GET /open311/requests/{service_request_id}[?format=xml|json]
     * Returns single-element array per GeoReport v2 spec.
     */
    public function show(int $id, array $params = []): void
    {
        $format = $params['format'] ?? 'json';
        $ticket = $this->ticketRepo->findById($id);

        if ($ticket === null) {
            $this->respondError(404, 'Service request not found', $format);
            return;
        }

        $data = [$this->ticketToServiceRequest($ticket)];
        $this->respond($data, $format, 'service_requests', 'request');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Map a Ticket domain object to a GeoReport v2 service_request object.
     * From FRD §F01 field mapping table (preserved verbatim).
     */
    private function ticketToServiceRequest(Ticket $ticket): array
    {
        // Compute expected_datetime from datetimeOpened + category.slaDays (business days)
        $expectedDatetime = '';
        $category = $this->categoryRepo->findById($ticket->categoryId);
        if ($category !== null && $category->slaDays !== null && $category->slaDays > 0) {
            $dt   = new \DateTime($ticket->datetimeOpened);
            $days = 0;
            while ($days < $category->slaDays) {
                $dt->modify('+1 day');
                if ($dt->format('N') < 6) { // Mon–Fri
                    $days++;
                }
            }
            $expectedDatetime = $dt->format(\DateTime::ATOM);
        }

        // agency_responsible = departments.name
        $agencyName = '';
        $dept = $this->deptRepo->findById($ticket->departmentId);
        if ($dept !== null) {
            $agencyName = $dept->name;
        }

        return [
            'service_request_id' => (string) $ticket->id,
            'status'             => $ticket->status,
            'status_notes'       => '',
            'service_name'       => $category?->name ?? '',
            'service_code'       => (string) $ticket->categoryId,
            'description'        => $ticket->description ?? '',
            'agency_responsible' => $agencyName,
            'service_notice'     => '',
            'requested_datetime' => (new \DateTime($ticket->datetimeOpened))->format(\DateTime::ATOM),
            'updated_datetime'   => (new \DateTime($ticket->datetimeUpdated))->format(\DateTime::ATOM),
            'expected_datetime'  => $expectedDatetime,
            'address'            => $ticket->address ?? '',
            'address_id'         => '',
            'zipcode'            => '',
            'lat'                => $ticket->lat !== null ? (float) $ticket->lat : null,
            'long'               => $ticket->lng !== null ? (float) $ticket->lng : null, // Open311 uses 'long'
            'media_url'          => '',
        ];
    }

    /**
     * Build customFields JSON from Open311 attribute[] parameters mapped to category field defs.
     */
    private function buildCustomFields(\Domain\Category $category, array $body): ?string
    {
        if ($category->fields === null) {
            return null;
        }
        $fieldDefs    = json_decode($category->fields, true, 512, JSON_THROW_ON_ERROR);
        $customValues = [];
        foreach ($fieldDefs as $fd) {
            $key = 'attribute[' . $fd['code'] . ']';
            if (isset($body[$key])) {
                $customValues[$fd['code']] = $body[$key];
            }
        }
        return !empty($customValues) ? json_encode($customValues, JSON_THROW_ON_ERROR) : null;
    }

    private function respond(array $data, string $format, string $rootEl, string $itemEl): void
    {
        if ($format === 'xml') {
            header('Content-Type: application/xml; charset=utf-8');
            $xml = '<?xml version="1.0" encoding="utf-8"?>' . "\n<{$rootEl}>\n";
            foreach ($data as $item) {
                $xml .= "  <{$itemEl}>\n";
                foreach ($item as $key => $val) {
                    $xml .= "    <{$key}>" . htmlspecialchars((string) ($val ?? '')) . "</{$key}>\n";
                }
                $xml .= "  </{$itemEl}>\n";
            }
            $xml .= "</{$rootEl}>\n";
            echo $xml;
        } else {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        }
    }

    private function respondError(int $code, string $desc, string $format): void
    {
        http_response_code($code);
        $error = [['code' => $code, 'description' => $desc]];
        if ($format === 'xml') {
            header('Content-Type: application/xml; charset=utf-8');
            echo '<?xml version="1.0" encoding="utf-8"?><errors><error><code>' . $code . '</code><description>' . htmlspecialchars($desc) . '</description></error></errors>';
        } else {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($error, JSON_THROW_ON_ERROR);
        }
    }
}
