---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 09
type: execute
wave: 2
depends_on: [1]
files_modified:
  - crm/src/Controllers/Open311/ServicesController.php
  - crm/src/Controllers/Open311/RequestsController.php
  - crm/src/Controllers/Open311/DiscoveryController.php
  - crm/src/Controllers/Api/BookmarkController.php
autonomous: true

features:
  implements: ["F1", "F12"]
  depends_on: ["F0", "F2", "F3", "F14"]
  enables: ["F15"]

must_haves:
  truths:
    - "GET /open311/discovery returns spec-compliant JSON and XML discovery document"
    - "GET /open311/services returns all active public-posting categories as GeoReport v2 service objects"
    - "GET /open311/services/{service_code} returns full service definition with custom attributes"
    - "POST /open311/requests validates api_key via bcrypt against clients.apiKeyHash, creates ticket, returns service_request_id"
    - "GET /open311/requests returns paginated Open311 request objects with correct field mappings"
    - "GET /open311/requests/{id} returns single-element array per GeoReport v2 spec"
    - "All /open311/ endpoints support ?format=xml and ?format=json output"
    - "GET /api/bookmarks returns only the authenticated user's bookmarks"
    - "POST /api/bookmarks creates bookmark scoped to authenticated user; enforces 50-bookmark limit"
    - "DELETE /api/bookmarks/{id} deletes only bookmarks owned by the authenticated user"
  artifacts:
    - path: "crm/src/Controllers/Open311/ServicesController.php"
      provides: "GET /open311/services and GET /open311/services/{service_code}"
      exports: ["ServicesController"]
    - path: "crm/src/Controllers/Open311/RequestsController.php"
      provides: "POST/GET /open311/requests and GET /open311/requests/{id}"
      exports: ["RequestsController"]
    - path: "crm/src/Controllers/Open311/DiscoveryController.php"
      provides: "GET /open311/discovery"
      exports: ["DiscoveryController"]
    - path: "crm/src/Controllers/Api/BookmarkController.php"
      provides: "GET/POST/DELETE /api/bookmarks"
      exports: ["BookmarkController"]
  key_links:
    - from: "crm/src/Controllers/Open311/RequestsController.php"
      to: "crm/src/Repositories/ClientRepository.php"
      via: "api_key bcrypt_verify against clients.apiKeyHash"
      pattern: "ClientRepository|apiKeyHash"
    - from: "crm/src/Controllers/Open311/RequestsController.php"
      to: "crm/src/Repositories/TicketRepository.php"
      via: "ticket create on POST /open311/requests"
      pattern: "TicketRepository"
    - from: "crm/src/Controllers/Open311/ServicesController.php"
      to: "crm/src/Repositories/CategoryRepository.php"
      via: "active public categories → service objects"
      pattern: "CategoryRepository"
    - from: "crm/src/Controllers/Api/BookmarkController.php"
      to: "crm/src/Repositories/BookmarkRepository.php"
      via: "findByPersonId, create, delete"
      pattern: "BookmarkRepository"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "crm/src/Repositories/TicketRepository.php"
      exports: ["TicketRepository"]
      verify: "grep -n 'class TicketRepository' crm/src/Repositories/TicketRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "crm/src/Repositories/CategoryRepository.php"
      exports: ["CategoryRepository"]
      verify: "grep -n 'class CategoryRepository' crm/src/Repositories/CategoryRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "crm/src/Repositories/ClientRepository.php"
      exports: ["ClientRepository", "findByKeyHash"]
      verify: "grep -n 'class ClientRepository' crm/src/Repositories/ClientRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "crm/src/Repositories/BookmarkRepository.php"
      exports: ["BookmarkRepository"]
      verify: "grep -n 'class BookmarkRepository' crm/src/Repositories/BookmarkRepository.php && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "crm/src/Domain/Ticket.php"
      exports: ["Domain\\Ticket", "fromRow"]
      verify: "grep -n 'readonly class Ticket' crm/src/Domain/Ticket.php && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "crm/src/Domain/Category.php"
      exports: ["Domain\\Category", "fromRow"]
      verify: "grep -n 'readonly class Category' crm/src/Domain/Category.php && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "crm/src/Domain/Client.php"
      exports: ["Domain\\Client", "apiKeyHash"]
      verify: "grep -n 'apiKeyHash' crm/src/Domain/Client.php && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "crm/src/Domain/Bookmark.php"
      exports: ["Domain\\Bookmark", "filterState"]
      verify: "grep -n 'readonly class Bookmark' crm/src/Domain/Bookmark.php && echo CONTRACT_OK"
  provides:
    - artifact: "crm/src/Controllers/Open311/ServicesController.php"
      exports: ["Open311\\ServicesController"]
      shape: |
        GET /open311/services → JSON array of service objects: [{service_code, service_name, description, metadata, type, keywords, group}]
        GET /open311/services/{service_code} → single service object with attributes[] for custom fields
        Supports ?format=xml wrapping in <services><service>…</service></services>
      verify: "grep -n 'class ServicesController' crm/src/Controllers/Open311/ServicesController.php && echo CONTRACT_OK"
    - artifact: "crm/src/Controllers/Open311/RequestsController.php"
      exports: ["Open311\\RequestsController"]
      shape: |
        POST /open311/requests → creates ticket, returns [{service_request_id, token}] or error [{code, description}]
        GET /open311/requests → paginated service request objects with spec fields
        GET /open311/requests/{id} → single-element array per GeoReport v2 spec
      verify: "grep -n 'class RequestsController' crm/src/Controllers/Open311/RequestsController.php && echo CONTRACT_OK"
    - artifact: "crm/src/Controllers/Open311/DiscoveryController.php"
      exports: ["Open311\\DiscoveryController"]
      shape: |
        GET /open311/discovery → {changeset, contact, key_service, endpoints[{specification, url, changeset, formats[]}]}
      verify: "grep -n 'class DiscoveryController' crm/src/Controllers/Open311/DiscoveryController.php && echo CONTRACT_OK"
    - artifact: "crm/src/Controllers/Api/BookmarkController.php"
      exports: ["Api\\BookmarkController"]
      shape: |
        GET /api/bookmarks → {data: Bookmark[], meta: {total}} scoped to authenticated personId
        POST /api/bookmarks → creates bookmark; 422 if name exists for user; 409 if 50-bookmark limit hit
        DELETE /api/bookmarks/{id} → 204; 403 if bookmark owned by different user
      verify: "grep -n 'class BookmarkController' crm/src/Controllers/Api/BookmarkController.php && echo CONTRACT_OK"
---

<objective>
Implement the Open311 GeoReport v2 endpoint surface (frozen contract) adapted to use the Wave 1 repository layer, plus the bookmarks API for saved searches.

Purpose: F1 (Open311) is the highest-priority external contract — external third-party clients depend on 100% spec compliance. F12 (bookmarks) enables the staff-facing saved-search workflow consumed by Wave 3d frontend.

Output:
- `crm/src/Controllers/Open311/ServicesController.php` — GET /open311/services, GET /open311/services/{service_code}
- `crm/src/Controllers/Open311/RequestsController.php` — POST/GET /open311/requests, GET /open311/requests/{id}
- `crm/src/Controllers/Open311/DiscoveryController.php` — GET /open311/discovery
- `crm/src/Controllers/Api/BookmarkController.php` — GET/POST/DELETE /api/bookmarks
</objective>

<feature_dependencies>
Implements: F1: Open311 GeoReport v2 API Compliance (all six endpoints, JSON+XML output, api_key validation, spec-compliant field mappings), F12: Bookmark/Saved Search Management (GET/POST/DELETE /api/bookmarks, 50-bookmark limit, user-scoped)
Depends on: F0: Ticket Lifecycle (TicketRepository — needed by POST /open311/requests), F2: Dept & Category (CategoryRepository — services list), F3: People (PersonRepository — reporter lookup), F14: API Client Mgmt (ClientRepository.findByKeyHash — api_key bcrypt validation)
Enables: F15: SPA Frontend (Wave 3d bookmark UI, Wave 4 Open311 compliance tests)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/WAVE-SCHEDULE.md
@project_specs/TechArch-uReport.md
@project_specs/FRD-uReport.md

# Wave 1 artifacts consumed by this plan:
@crm/src/Repositories/CategoryRepository.php
@crm/src/Repositories/TicketRepository.php
@crm/src/Repositories/ClientRepository.php
@crm/src/Repositories/BookmarkRepository.php
@crm/src/Domain/Ticket.php
@crm/src/Domain/Category.php
@crm/src/Domain/Bookmark.php
</context>

<tasks>

<task type="auto">
  <name>Task 1: Open311 GeoReport v2 Controllers (ServicesController, RequestsController, DiscoveryController)</name>
  <files>
    crm/src/Controllers/Open311/ServicesController.php
    crm/src/Controllers/Open311/RequestsController.php
    crm/src/Controllers/Open311/DiscoveryController.php
  </files>
  <action>
**CRITICAL CONSTRAINT:** All /open311/ paths, parameters, and response shapes are frozen per TechArch §1.4 and FRD F01. Do NOT change field names. Open311 uses `long` (not `lng`), `address_string` (not `address`), `service_request_id` (not `id`). Open311 error format is `[{"code": N, "description": "..."}]` — NOT the internal JSON envelope.

**Create `crm/src/Controllers/Open311/ServicesController.php`**

Handles `GET /open311/services` and `GET /open311/services/{service_code}`.

Maps `categories` records (active=1, postingPermission IN ('public','anonymous')) to GeoReport v2 service objects. Supports `?format=xml` or `?format=json` (default json).

```php
<?php
declare(strict_types=1);
namespace Controllers\Open311;

use Repositories\CategoryRepository;

class ServicesController
{
    public function __construct(
        private readonly CategoryRepository $categoryRepo,
    ) {}

    /**
     * GET /open311/services[?format=xml|json][&jurisdiction_id=...]
     * Returns GeoReport v2 services list.
     */
    public function index(array $params = []): void
    {
        // Load active categories that allow public or anonymous posting
        $categories = $this->categoryRepo->findAll(activeOnly: true);
        $services   = [];

        foreach ($categories as $cat) {
            if (!in_array($cat->postingPermission, ['public', 'anonymous'], true)) {
                continue; // staff-only categories not exposed via Open311
            }
            $services[] = $this->categoryToServiceObject($cat);
        }

        $this->respond($services, $params['format'] ?? 'json', 'services', 'service');
    }

    /**
     * GET /open311/services/{service_code}[?format=xml|json]
     * Returns a single service definition with attributes[] for custom fields.
     */
    public function show(int $serviceCode, array $params = []): void
    {
        $cat = $this->categoryRepo->findById($serviceCode);

        if ($cat === null || !$cat->active) {
            $this->respondError(404, 'service_code not found', $params['format'] ?? 'json');
            return;
        }

        $service = $this->categoryToServiceObject($cat);

        // Add attributes[] for custom field definitions (Open311 metadata)
        $service['attributes'] = [];
        if ($cat->fields !== null) {
            $fields = json_decode($cat->fields, true, 512, JSON_THROW_ON_ERROR);
            foreach ($fields as $field) {
                $attr = [
                    'variable'    => true,
                    'code'        => $field['code'],
                    'datatype'    => $this->mapFieldType($field['type']),
                    'required'    => (bool) ($field['required'] ?? false),
                    'description' => $field['label'],
                    'order'       => 1,
                    'values'      => [],
                ];
                if ($field['type'] === 'select' && !empty($field['options'])) {
                    foreach ($field['options'] as $i => $opt) {
                        $attr['values'][] = ['key' => $opt, 'name' => $opt];
                    }
                }
                $service['attributes'][] = $attr;
            }
        }

        $this->respond([$service], $params['format'] ?? 'json', 'services', 'service');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function categoryToServiceObject(\Domain\Category $cat): array
    {
        return [
            'service_code' => (string) $cat->id,
            'service_name' => $cat->name,
            'description'  => '',
            'metadata'     => $cat->fields !== null,
            'type'         => 'realtime',
            'keywords'     => [],
            'group'        => '', // category group name could be added if groupId resolved
        ];
    }

    /** Map internal field type → Open311 datatype string */
    private function mapFieldType(string $type): string
    {
        return match ($type) {
            'text'     => 'string',
            'select'   => 'singlevaluelist',
            'date'     => 'datetime',
            'checkbox' => 'boolean',
            default    => 'string',
        };
    }

    private function respond(array $data, string $format, string $rootEl, string $itemEl): void
    {
        if ($format === 'xml') {
            header('Content-Type: application/xml; charset=utf-8');
            echo $this->toXml($data, $rootEl, $itemEl);
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
            echo '<?xml version="1.0" encoding="utf-8"?><errors><error><code>'.$code.'</code><description>'.htmlspecialchars($desc).'</description></error></errors>';
        } else {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($error, JSON_THROW_ON_ERROR);
        }
    }

    private function toXml(array $items, string $rootEl, string $itemEl): string
    {
        $xml = '<?xml version="1.0" encoding="utf-8"?>' . "\n" . "<{$rootEl}>\n";
        foreach ($items as $item) {
            $xml .= "  <{$itemEl}>\n";
            foreach ($item as $key => $value) {
                if (is_array($value)) {
                    $xml .= "    <{$key}>\n";
                    foreach ($value as $child) {
                        if (is_array($child)) {
                            $xml .= "      <value>\n";
                            foreach ($child as $ck => $cv) {
                                $xml .= "        <{$ck}>" . htmlspecialchars((string) $cv) . "</{$ck}>\n";
                            }
                            $xml .= "      </value>\n";
                        } else {
                            $xml .= '      ' . htmlspecialchars((string) $child) . "\n";
                        }
                    }
                    $xml .= "    </{$key}>\n";
                } else {
                    $xml .= "    <{$key}>" . htmlspecialchars((string) $value) . "</{$key}>\n";
                }
            }
            $xml .= "  </{$itemEl}>\n";
        }
        $xml .= "</{$rootEl}>\n";
        return $xml;
    }
}
```

---

**Create `crm/src/Controllers/Open311/RequestsController.php`**

Handles `POST /open311/requests`, `GET /open311/requests`, `GET /open311/requests/{id}`.

Field mapping (Open311 → internal from FRD §F01):
| Open311 Field          | Internal Column              |
|------------------------|------------------------------|
| service_request_id     | tickets.id                   |
| service_code           | tickets.categoryId           |
| status                 | tickets.status               |
| description            | tickets.description          |
| lat                    | ticket_geodata.lat           |
| long                   | ticket_geodata.lng (NOTE: Open311 uses `long`) |
| address                | tickets.address              |
| requested_datetime     | tickets.datetimeOpened       |
| updated_datetime       | tickets.datetimeUpdated      |
| expected_datetime      | datetimeOpened + category.slaDays business days |
| agency_responsible     | departments.name             |

```php
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

        // Validate api_key if provided
        $apiClientId = null;
        if (!empty($body['api_key'])) {
            $client = $this->clientRepo->findByKeyHash($body['api_key']);
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

        // Resolve or create reporter person from contact fields
        $reporterPersonId = null;
        if (!empty($body['email'])) {
            $existingPerson = $this->personRepo->findByEmail($body['email']);
            $reporterPersonId = $existingPerson?->id;
        }

        $ticketData = [
            'title'             => $body['description'] ?? ('Open311 request: ' . $category->name),
            'description'       => $body['description'] ?? null,
            'status'            => 'open',
            'categoryId'        => $category->id,
            'departmentId'      => $category->departmentId,
            'personId'          => $category->defaultAssigneeId ?? ($department?->defaultAssigneeId ?? null),
            'reporterPersonId'  => $reporterPersonId,
            'reporterName'      => trim(($body['first_name'] ?? '') . ' ' . ($body['last_name'] ?? '')) ?: null,
            'reporterEmail'     => $body['email'] ?? null,
            'reporterPhone'     => $body['phone'] ?? null,
            'address'           => $addr,
            'lat'               => $lat !== null ? (string) $lat : null,
            'lng'               => $long !== null ? (string) $long : null,  // store as lng internally
            'apiClientId'       => $apiClientId,
            'customFields'      => null,
        ];

        // Map attribute[] custom fields
        if ($category->fields !== null) {
            $fieldDefs = json_decode($category->fields, true, 512, JSON_THROW_ON_ERROR);
            $customValues = [];
            foreach ($fieldDefs as $fd) {
                $key = 'attribute[' . $fd['code'] . ']';
                if (isset($body[$key])) {
                    $customValues[$fd['code']] = $body[$key];
                }
            }
            if (!empty($customValues)) {
                $ticketData['customFields'] = json_encode($customValues, JSON_THROW_ON_ERROR);
            }
        }

        // Handle media_url (store as sourceUrl reference — not downloaded)
        if (!empty($body['media_url'])) {
            // Will be stored as a media record with sourceUrl; for now pass to ticket service
            // Full media handling is in Wave 2c; here we just record the URL in customFields if needed
            // Per FRD: media_url field on tickets.media → sourceUrl column
        }

        // Create the ticket via TicketRepository
        $newTicket = $this->ticketRepo->save(new Ticket(
            id:                 0,
            title:              $ticketData['title'],
            description:        $ticketData['description'],
            status:             'open',
            datetimeOpened:     date('Y-m-d H:i:s'),
            datetimeClosed:     null,
            datetimeUpdated:    date('Y-m-d H:i:s'),
            deletedAt:          null,
            categoryId:         $ticketData['categoryId'],
            departmentId:       $ticketData['departmentId'],
            personId:           $ticketData['personId'],
            reporterPersonId:   $ticketData['reporterPersonId'],
            reporterName:       $ticketData['reporterName'],
            reporterEmail:      $ticketData['reporterEmail'],
            reporterPhone:      $ticketData['reporterPhone'],
            address:            $ticketData['address'],
            lat:                $ticketData['lat'],
            lng:                $ticketData['lng'],
            substatusId:        null,
            mergedIntoTicketId: null,
            apiClientId:        $ticketData['apiClientId'],
            customFields:       $ticketData['customFields'],
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

        // Handle comma-separated service_request_id list
        if (!empty($params['service_request_id'])) {
            $ids    = array_map('intval', explode(',', $params['service_request_id']));
            $tickets = $this->ticketRepo->findByIds($ids);
            $data   = array_map(fn($t) => $this->ticketToServiceRequest($t), $tickets);
            $this->respond($data, $format, 'service_requests', 'request');
            return;
        }

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
            $dt = new \DateTime($ticket->datetimeOpened);
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
```

---

**Create `crm/src/Controllers/Open311/DiscoveryController.php`**

Handles `GET /open311/discovery`. Returns the Open311 discovery document listing all available endpoints.

```php
<?php
declare(strict_types=1);
namespace Controllers\Open311;

class DiscoveryController
{
    public function __construct(
        private readonly string $baseUrl,
    ) {}

    /**
     * GET /open311/discovery[?format=xml|json]
     * Returns GeoReport v2 discovery document.
     */
    public function show(array $params = []): void
    {
        $format    = $params['format'] ?? 'json';
        $changeset = '2026-06-23T00:00:00Z';

        $discovery = [
            'changeset' => $changeset,
            'contact'   => 'mailto:admin@' . parse_url($this->baseUrl, PHP_URL_HOST),
            'key_service' => '',
            'endpoints'   => [
                [
                    'specification' => 'http://wiki.open311.org/GeoReport_v2/',
                    'url'           => rtrim($this->baseUrl, '/') . '/open311',
                    'changeset'     => $changeset,
                    'formats'       => ['application/json', 'text/xml'],
                ],
            ],
        ];

        if ($format === 'xml') {
            header('Content-Type: application/xml; charset=utf-8');
            $xml  = '<?xml version="1.0" encoding="utf-8"?>' . "\n<discovery>\n";
            $xml .= '  <changeset>' . htmlspecialchars($discovery['changeset']) . "</changeset>\n";
            $xml .= '  <contact>' . htmlspecialchars($discovery['contact']) . "</contact>\n";
            $xml .= "  <endpoints>\n";
            foreach ($discovery['endpoints'] as $ep) {
                $xml .= "    <endpoint>\n";
                $xml .= '      <specification>' . htmlspecialchars($ep['specification']) . "</specification>\n";
                $xml .= '      <url>' . htmlspecialchars($ep['url']) . "</url>\n";
                $xml .= '      <changeset>' . htmlspecialchars($ep['changeset']) . "</changeset>\n";
                $xml .= "      <formats>\n";
                foreach ($ep['formats'] as $fmt) {
                    $xml .= '        <format>' . htmlspecialchars($fmt) . "</format>\n";
                }
                $xml .= "      </formats>\n";
                $xml .= "    </endpoint>\n";
            }
            $xml .= "  </endpoints>\n</discovery>\n";
            echo $xml;
        } else {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($discovery, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        }
    }
}
```
  </action>
  <verify>
```bash
# Verify all three controller files exist
ls crm/src/Controllers/Open311/ServicesController.php \
   crm/src/Controllers/Open311/RequestsController.php \
   crm/src/Controllers/Open311/DiscoveryController.php && echo "OPEN311 FILES OK"

# Verify Open311 field names preserved verbatim (no 'lng' instead of 'long')
grep -n "'long'" crm/src/Controllers/Open311/RequestsController.php && echo "FIELD_LONG OK"
grep -n "service_request_id" crm/src/Controllers/Open311/RequestsController.php && echo "SRQ_ID OK"
grep -n "address_string" crm/src/Controllers/Open311/RequestsController.php && echo "ADDR_STRING OK"

# Verify api_key validation goes through ClientRepository
grep -n "clientRepo\|findByKeyHash\|apiKeyHash" crm/src/Controllers/Open311/RequestsController.php && echo "APIKEY_VALIDATION OK"

# Verify error format is Open311 spec ([{"code":N,"description":"..."}]) not internal envelope
grep -n '"description"' crm/src/Controllers/Open311/RequestsController.php && echo "ERROR_FORMAT OK"

# Verify XML output is supported in all three controllers
grep -c "application/xml" crm/src/Controllers/Open311/ServicesController.php && echo "SERVICES_XML OK"
grep -c "application/xml" crm/src/Controllers/Open311/RequestsController.php && echo "REQUESTS_XML OK"
grep -c "application/xml" crm/src/Controllers/Open311/DiscoveryController.php && echo "DISCOVERY_XML OK"

# PHP syntax check
php -l crm/src/Controllers/Open311/ServicesController.php && echo "SERVICES_SYNTAX OK"
php -l crm/src/Controllers/Open311/RequestsController.php && echo "REQUESTS_SYNTAX OK"
php -l crm/src/Controllers/Open311/DiscoveryController.php && echo "DISCOVERY_SYNTAX OK"
```
  </verify>
  <done>
- All three Open311 controller files exist under crm/src/Controllers/Open311/
- ServicesController maps categories to GeoReport v2 service objects; skips staff-only categories
- RequestsController uses Open311 field name `long` (not `lng`) for longitude in both input and output
- RequestsController uses `address_string` for input address (Open311 spec), stores as `address` internally
- RequestsController validates `api_key` via `ClientRepository::findByKeyHash()` (bcrypt compare)
- RequestsController creates ticket via `TicketRepository::save()` and inserts `open` action via `ActionRepository::insert()`
- Error responses use Open311 format `[{"code":N,"description":"..."}]` — NOT the internal `{data,meta,errors}` envelope
- All three controllers support `?format=xml` output wrapped in correct Open311 XML element names
- GET /open311/requests/{id} returns single-element array `[{...}]` per GeoReport v2 spec
- `expected_datetime` computed as `datetimeOpened + category.slaDays` business days (Mon–Fri)
- All three files pass `php -l` syntax check
  </done>
</task>

<task type="auto">
  <name>Task 2: Bookmarks API Controller (GET/POST/DELETE /api/bookmarks)</name>
  <files>
    crm/src/Controllers/Api/BookmarkController.php
  </files>
  <action>
**Create `crm/src/Controllers/Api/BookmarkController.php`**

Implements the bookmarks API from TechArch §4.3 (Bookmarks section):

```
GET    /api/bookmarks       → list authenticated user's bookmarks
POST   /api/bookmarks       → create bookmark scoped to authenticated user
GET    /api/bookmarks/{id}  → get single bookmark + filterState
DELETE /api/bookmarks/{id}  → delete bookmark (owner only)
```

From FRD §F12:
- Bookmarks are user-scoped; no cross-user visibility
- 50-bookmark limit per user (POST returns 409 if at limit)
- `filterState` is a JSON object matching F04 TicketSearchParams
- `name` must be unique per user (unique key: personId+name)

BookmarkRepository methods needed (from Wave 1 integration contract):
- `findByPersonId(int $personId): Bookmark[]`
- `create(array $data): Bookmark` where data = {personId, name, filterState JSON}
- `delete(int $id): void`
- `findById(int $id): ?Bookmark`
- `countByPersonId(int $personId): int` (may need to add to repo; use inline SQL if missing)

Response format uses the standard internal JSON envelope: `{"data": ..., "meta": {...}, "errors": []}`.

```php
<?php
declare(strict_types=1);
namespace Controllers\Api;

use Repositories\BookmarkRepository;

class BookmarkController
{
    /** Maximum bookmarks allowed per user (F12). */
    private const MAX_BOOKMARKS = 50;

    public function __construct(
        private readonly BookmarkRepository $bookmarkRepo,
    ) {}

    /**
     * GET /api/bookmarks
     * Returns all bookmarks for the authenticated user.
     * $personId comes from the JWT session (set by AuthMiddleware before dispatch).
     */
    public function index(int $personId): void
    {
        $bookmarks = $this->bookmarkRepo->findByPersonId($personId);

        $data = array_map(fn($b) => $this->bookmarkToArray($b), $bookmarks);

        http_response_code(200);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'data'   => $data,
            'meta'   => ['total' => count($data)],
            'errors' => [],
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }

    /**
     * POST /api/bookmarks
     * Create a new bookmark scoped to authenticated user.
     * Body: {name: string, filterState: object}
     */
    public function create(array $body, int $personId): void
    {
        // Validate required fields
        $errors = [];
        if (empty($body['name']) || !is_string($body['name'])) {
            $errors[] = ['field' => 'name', 'message' => 'name is required'];
        } elseif (strlen($body['name']) > 100) {
            $errors[] = ['field' => 'name', 'message' => 'name must be 100 characters or fewer'];
        }
        if (empty($body['filterState']) || !is_array($body['filterState'])) {
            $errors[] = ['field' => 'filterState', 'message' => 'filterState is required and must be an object'];
        }

        if (!empty($errors)) {
            http_response_code(422);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['data' => null, 'meta' => [], 'errors' => $errors], JSON_THROW_ON_ERROR);
            return;
        }

        // Enforce 50-bookmark limit per user (F12)
        $existing = $this->bookmarkRepo->findByPersonId($personId);
        if (count($existing) >= self::MAX_BOOKMARKS) {
            http_response_code(409);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'data'   => null,
                'meta'   => [],
                'errors' => [['field' => null, 'message' => 'Bookmark limit reached (max ' . self::MAX_BOOKMARKS . ')', 'code' => 'BOOKMARK_LIMIT']],
            ], JSON_THROW_ON_ERROR);
            return;
        }

        // Check name uniqueness per user (DB has UNIQUE KEY uq_bookmark_person_name(personId, name))
        foreach ($existing as $bm) {
            if ($bm->name === $body['name']) {
                http_response_code(422);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode([
                    'data'   => null,
                    'meta'   => [],
                    'errors' => [['field' => 'name', 'message' => 'A bookmark with this name already exists', 'code' => 'DUPLICATE_NAME']],
                ], JSON_THROW_ON_ERROR);
                return;
            }
        }

        $filterStateJson = json_encode($body['filterState'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);

        $bookmark = $this->bookmarkRepo->create([
            'personId'    => $personId,
            'name'        => $body['name'],
            'filterState' => $filterStateJson,
        ]);

        http_response_code(201);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'data'   => $this->bookmarkToArray($bookmark),
            'meta'   => [],
            'errors' => [],
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }

    /**
     * GET /api/bookmarks/{id}
     * Returns a single bookmark for the authenticated user.
     */
    public function show(int $id, int $personId): void
    {
        $bookmark = $this->bookmarkRepo->findById($id);

        if ($bookmark === null) {
            http_response_code(404);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['data' => null, 'meta' => [], 'errors' => [['field' => null, 'message' => 'Bookmark not found', 'code' => 'NOT_FOUND']]], JSON_THROW_ON_ERROR);
            return;
        }

        // Enforce ownership — bookmarks are user-scoped (F12)
        if ($bookmark->personId !== $personId) {
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['data' => null, 'meta' => [], 'errors' => [['field' => null, 'message' => 'Forbidden', 'code' => 'FORBIDDEN']]], JSON_THROW_ON_ERROR);
            return;
        }

        http_response_code(200);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'data'   => $this->bookmarkToArray($bookmark),
            'meta'   => [],
            'errors' => [],
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }

    /**
     * DELETE /api/bookmarks/{id}
     * Deletes a bookmark owned by the authenticated user. Returns 204.
     */
    public function delete(int $id, int $personId): void
    {
        $bookmark = $this->bookmarkRepo->findById($id);

        if ($bookmark === null) {
            http_response_code(404);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['data' => null, 'meta' => [], 'errors' => [['field' => null, 'message' => 'Bookmark not found', 'code' => 'NOT_FOUND']]], JSON_THROW_ON_ERROR);
            return;
        }

        // Enforce ownership — only owner can delete their bookmark (F12)
        if ($bookmark->personId !== $personId) {
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['data' => null, 'meta' => [], 'errors' => [['field' => null, 'message' => 'Forbidden', 'code' => 'FORBIDDEN']]], JSON_THROW_ON_ERROR);
            return;
        }

        $this->bookmarkRepo->delete($id);

        http_response_code(204);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function bookmarkToArray(\Domain\Bookmark $bookmark): array
    {
        return [
            'id'          => $bookmark->id,
            'personId'    => $bookmark->personId,
            'name'        => $bookmark->name,
            'filterState' => json_decode($bookmark->filterState, true, 512, JSON_THROW_ON_ERROR),
            'createdAt'   => $bookmark->createdAt,
        ];
    }
}
```

Additionally, ensure `BookmarkRepository` has the methods this controller requires. If `BookmarkRepository::findById()` or `BookmarkRepository::create()` are missing from the Wave 1 implementation, add them now:

```php
// Add to BookmarkRepository if missing:

public function findById(int $id): ?\Domain\Bookmark
{
    $stmt = $this->pdo->prepare('SELECT * FROM bookmarks WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch(\PDO::FETCH_ASSOC);
    return $row ? \Domain\Bookmark::fromRow($row) : null;
}

public function create(array $data): \Domain\Bookmark
{
    $stmt = $this->pdo->prepare(
        'INSERT INTO bookmarks (personId, name, filterState) VALUES (:personId, :name, :filterState)'
    );
    $stmt->execute([
        'personId'    => $data['personId'],
        'name'        => $data['name'],
        'filterState' => $data['filterState'],
    ]);
    return $this->findById((int) $this->pdo->lastInsertId());
}
```
  </action>
  <verify>
```bash
# Verify BookmarkController file exists
ls crm/src/Controllers/Api/BookmarkController.php && echo "BOOKMARK_CONTROLLER OK"

# Verify 50-bookmark limit constant is defined
grep -n "MAX_BOOKMARKS = 50" crm/src/Controllers/Api/BookmarkController.php && echo "LIMIT_OK"

# Verify ownership check on delete and show
grep -n "personId !== \$personId\|403" crm/src/Controllers/Api/BookmarkController.php && echo "OWNERSHIP_CHECK OK"

# Verify standard JSON envelope is used (not Open311 format)
grep -n '"data"\|"meta"\|"errors"' crm/src/Controllers/Api/BookmarkController.php && echo "ENVELOPE OK"

# Verify filterState is decoded from JSON when serializing response
grep -n "json_decode.*filterState\|filterState.*json_decode" crm/src/Controllers/Api/BookmarkController.php && echo "FILTERSTATE_DECODE OK"

# Verify 204 on successful delete
grep -n "response_code(204)" crm/src/Controllers/Api/BookmarkController.php && echo "DELETE_204 OK"

# PHP syntax check
php -l crm/src/Controllers/Api/BookmarkController.php && echo "BOOKMARK_SYNTAX OK"

# Verify BookmarkRepository has required methods
grep -n "findByPersonId\|findById\|create\|delete" crm/src/Repositories/BookmarkRepository.php && echo "REPO_METHODS OK"
```
  </verify>
  <done>
- `crm/src/Controllers/Api/BookmarkController.php` exists with index, create, show, delete methods
- `MAX_BOOKMARKS = 50` constant enforced on POST; returns HTTP 409 with BOOKMARK_LIMIT error code when exceeded
- Name uniqueness per user validated before DB insert (duplicate returns HTTP 422 DUPLICATE_NAME)
- Ownership enforced on GET /api/bookmarks/{id} and DELETE /api/bookmarks/{id}; returns HTTP 403 FORBIDDEN for cross-user access
- DELETE returns HTTP 204 No Content on success
- GET /api/bookmarks returns `{data: [{id, personId, name, filterState: {object}, createdAt}], meta: {total}, errors: []}`
- `filterState` is stored as JSON string in DB; decoded to object in API responses
- `BookmarkRepository` has `findById()`, `findByPersonId()`, `create()`, `delete()` methods
- File passes `php -l` syntax check
  </done>
</task>

</tasks>

<verification>
```bash
# All four controller files exist
ls crm/src/Controllers/Open311/ServicesController.php \
   crm/src/Controllers/Open311/RequestsController.php \
   crm/src/Controllers/Open311/DiscoveryController.php \
   crm/src/Controllers/Api/BookmarkController.php && echo "ALL_FILES OK"

# Open311 spec compliance: correct field names preserved
grep -n "'long'" crm/src/Controllers/Open311/RequestsController.php && echo "OPEN311_LONG OK"
grep -n "service_request_id" crm/src/Controllers/Open311/RequestsController.php && echo "OPEN311_SRQ OK"
grep -n "address_string" crm/src/Controllers/Open311/RequestsController.php && echo "OPEN311_ADDR OK"
grep -n "requested_datetime" crm/src/Controllers/Open311/RequestsController.php && echo "OPEN311_REQDT OK"
grep -n "agency_responsible" crm/src/Controllers/Open311/RequestsController.php && echo "OPEN311_AGENCY OK"

# api_key validation via bcrypt (ClientRepository used)
grep -n "clientRepo\|findByKeyHash" crm/src/Controllers/Open311/RequestsController.php && echo "APIKEY_BCRYPT OK"

# Open311 error format (not internal envelope) in Open311 controllers
grep -n '"description"' crm/src/Controllers/Open311/RequestsController.php | grep -v "echo\|html" && echo "OPEN311_ERROR_FORMAT OK"

# Bookmark 50-limit enforced
grep -n "MAX_BOOKMARKS = 50" crm/src/Controllers/Api/BookmarkController.php && echo "BOOKMARK_LIMIT OK"

# All PHP files syntactically valid
for f in crm/src/Controllers/Open311/*.php crm/src/Controllers/Api/BookmarkController.php; do
    php -l "$f" || exit 1
done && echo "ALL_SYNTAX OK"
```
</verification>

<success_criteria>
- Open311 controllers (ServicesController, RequestsController, DiscoveryController) exist under crm/src/Controllers/Open311/
- BookmarkController exists under crm/src/Controllers/Api/
- Open311 field names match GeoReport v2 spec exactly (`long` not `lng`, `address_string` not `address`, `service_request_id`, `requested_datetime`, `agency_responsible`)
- api_key validated by `ClientRepository::findByKeyHash()` using bcrypt comparison against `clients.apiKeyHash`
- Open311 error format is `[{"code": N, "description": "..."}]` — NOT the internal `{data, meta, errors}` envelope
- All /open311/ endpoints support `?format=xml` and `?format=json` output
- GET /open311/requests/{id} returns single-element array `[{...}]` per GeoReport v2 spec
- Bookmark CRUD is scoped to authenticated user (personId from JWT session)
- 50-bookmark limit enforced on POST with HTTP 409 BOOKMARK_LIMIT response
- DELETE /api/bookmarks/{id} returns HTTP 204 No Content
- All four controller files pass `php -l` syntax check
</success_criteria>

<output>
After completion, create `.planning/express/modernize-the-ureport-legacy-php-crm-imp/09-SUMMARY.md` documenting:
- Files created/modified
- Open311 field mapping decisions (spec-compliance notes)
- BookmarkRepository methods added if any were missing from Wave 1
- Any edge cases handled (circular FK, XML escaping, api_key absent vs invalid)
</output>
