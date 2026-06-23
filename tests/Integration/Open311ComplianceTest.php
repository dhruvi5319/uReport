<?php
declare(strict_types=1);

namespace Tests\Integration;

use PHPUnit\Framework\TestCase;
use GuzzleHttp\Client;

/**
 * Open311 GeoReport v2 Compliance Test Suite
 *
 * Tests all six required Open311 endpoints against the running PHP application.
 * Asserts spec-compliant field names, JSON+XML formats, error formats, and api_key validation.
 *
 * Reference: http://wiki.open311.org/GeoReport_v2/
 * PRD: F1 (Open311 GeoReport v2 API Compliance), NFR-09 (Open311 Compliance)
 */
class Open311ComplianceTest extends TestCase
{
    private Client $http;
    private int    $categoryCode;

    protected function setUp(): void
    {
        $this->http         = integration_http_client();
        $this->categoryCode = seed_open311_category(); // inserts category ID 9001
    }

    // ─── GET /open311/services ────────────────────────────────────────────────

    public function testServicesListReturnsJsonArray(): void
    {
        $res  = $this->http->get('/open311/services.json');
        $body = json_decode((string) $res->getBody(), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame(200, $res->getStatusCode(), 'GET /open311/services must return 200');
        $this->assertIsArray($body, 'Response must be a JSON array');
        $this->assertNotEmpty($body, 'Services list must not be empty');

        // Verify required GeoReport v2 service object fields
        $service = $body[0];
        $this->assertArrayHasKey('service_code', $service);
        $this->assertArrayHasKey('service_name', $service);
        $this->assertArrayHasKey('metadata', $service);
        $this->assertArrayHasKey('type', $service);
        $this->assertArrayHasKey('keywords', $service);
        $this->assertArrayHasKey('group', $service);
        $this->assertArrayHasKey('description', $service);
    }

    public function testServicesListDoesNotExposeStaffOnlyCategories(): void
    {
        // Staff-only categories (postingPermission='staff') must NOT appear in the services list
        $pdo = integration_pdo();
        $pdo->exec(
            "INSERT INTO categories (id, name, departmentId, active, postingPermission, displayPermission)
             VALUES (9002, 'Staff Only Test Category', 9001, 1, 'staff', 'staff')
             ON DUPLICATE KEY UPDATE postingPermission='staff'"
        );

        $res  = $this->http->get('/open311/services.json');
        $body = json_decode((string) $res->getBody(), true, 512, JSON_THROW_ON_ERROR);

        $codes = array_column($body, 'service_code');
        $this->assertNotContains('9002', $codes, 'Staff-only categories must not appear in Open311 services list');
    }

    public function testServicesListXmlFormat(): void
    {
        $res = $this->http->get('/open311/services.xml');
        $this->assertSame(200, $res->getStatusCode());

        $contentType = $res->getHeaderLine('Content-Type');
        $this->assertStringContainsString('xml', $contentType, 'XML format must return application/xml content type');

        $xml = simplexml_load_string((string) $res->getBody());
        $this->assertNotFalse($xml, 'XML response must be valid XML');
        $this->assertSame('services', $xml->getName(), 'Root element must be <services>');
    }

    // ─── GET /open311/services/{service_code} ─────────────────────────────────

    public function testServiceDetailReturnsServiceWithAttributes(): void
    {
        $res  = $this->http->get("/open311/services/{$this->categoryCode}.json");
        $body = json_decode((string) $res->getBody(), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame(200, $res->getStatusCode());
        $this->assertIsArray($body);
        $this->assertNotEmpty($body);

        $service = $body[0];
        $this->assertSame((string) $this->categoryCode, $service['service_code']);
        $this->assertArrayHasKey('attributes', $service, 'Service detail must include attributes[] for custom fields');
        $this->assertIsArray($service['attributes']);
    }

    public function testServiceDetailReturns404ForUnknownCode(): void
    {
        $res  = $this->http->get('/open311/services/99999.json');
        $body = json_decode((string) $res->getBody(), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame(404, $res->getStatusCode());
        // Open311 error format: array of {code, description} objects
        $this->assertIsArray($body);
        $this->assertArrayHasKey('code', $body[0]);
        $this->assertArrayHasKey('description', $body[0]);
    }

    // ─── POST /open311/requests ───────────────────────────────────────────────

    public function testPostRequestCreatesTicketAndReturnsServiceRequestId(): void
    {
        $res = $this->http->post('/open311/requests.json', [
            'form_params' => [
                'service_code'   => (string) $this->categoryCode,
                'description'    => 'Integration test: large pothole on Oak Avenue',
                'address_string' => '123 Oak Avenue',    // Open311 field: address_string
                'first_name'     => 'Test',
                'last_name'      => 'Citizen',
                'email'          => 'citizen@test.example',
            ],
        ]);

        $body = json_decode((string) $res->getBody(), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame(201, $res->getStatusCode(), 'POST /open311/requests must return 201 on success');
        $this->assertIsArray($body);
        $this->assertNotEmpty($body);

        // GeoReport v2 success response: [{service_request_id, token}]
        $this->assertArrayHasKey('service_request_id', $body[0], 'Response must contain service_request_id (not id)');
        $this->assertNotEmpty($body[0]['service_request_id'], 'service_request_id must not be empty');
    }

    public function testPostRequestWithLatLong(): void
    {
        $res = $this->http->post('/open311/requests.json', [
            'form_params' => [
                'service_code' => (string) $this->categoryCode,
                'description'  => 'Integration test: geo-located request',
                'lat'          => '37.7749',
                'long'         => '-122.4194',   // MUST use 'long' not 'lng' per Open311 spec
            ],
        ]);

        $body = json_decode((string) $res->getBody(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame(201, $res->getStatusCode());
        $this->assertArrayHasKey('service_request_id', $body[0]);
    }

    public function testPostRequestWithValidApiKey(): void
    {
        $client = seed_api_client();

        $res = $this->http->post('/open311/requests.json', [
            'form_params' => [
                'service_code'   => (string) $this->categoryCode,
                'description'    => 'Integration test: api_key auth',
                'address_string' => '456 Elm Street',
                'api_key'        => $client['key'],
            ],
        ]);

        $body = json_decode((string) $res->getBody(), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame(201, $res->getStatusCode(), 'POST with valid api_key must return 201');
        $this->assertArrayHasKey('service_request_id', $body[0]);
    }

    public function testPostRequestWithInvalidApiKeyReturnsOpen311Error(): void
    {
        $res = $this->http->post('/open311/requests.json', [
            'form_params' => [
                'service_code'   => (string) $this->categoryCode,
                'description'    => 'Integration test: invalid key',
                'address_string' => '789 Pine Street',
                'api_key'        => 'totally-invalid-key-' . bin2hex(random_bytes(4)),
            ],
        ]);

        $body = json_decode((string) $res->getBody(), true, 512, JSON_THROW_ON_ERROR);

        // Must use Open311 error format [{code:N, description:"..."}], NOT {data,meta,errors}
        $this->assertSame(400, $res->getStatusCode());
        $this->assertIsArray($body);
        $this->assertArrayHasKey('code', $body[0], 'Open311 error format must be [{code, description}]');
        $this->assertArrayHasKey('description', $body[0]);
        // Must NOT use internal envelope
        $this->assertArrayNotHasKey('data', $body, 'Open311 errors must NOT use internal {data, meta, errors} envelope');
        $this->assertArrayNotHasKey('errors', $body);
    }

    public function testPostRequestWithoutLocationReturnsError(): void
    {
        $res = $this->http->post('/open311/requests.json', [
            'form_params' => [
                'service_code' => (string) $this->categoryCode,
                'description'  => 'No location provided',
                // Deliberately omit lat/long AND address_string
            ],
        ]);

        $this->assertSame(400, $res->getStatusCode(), 'POST without location must return 400');
    }

    // ─── GET /open311/requests ────────────────────────────────────────────────

    public function testGetRequestsReturnsList(): void
    {
        $res  = $this->http->get('/open311/requests.json');
        $body = json_decode((string) $res->getBody(), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame(200, $res->getStatusCode());
        $this->assertIsArray($body);

        if (!empty($body)) {
            $req = $body[0];
            // Verify required GeoReport v2 service_request fields
            $this->assertArrayHasKey('service_request_id', $req, 'Must have service_request_id (not id)');
            $this->assertArrayHasKey('status', $req);
            $this->assertArrayHasKey('service_code', $req);
            $this->assertArrayHasKey('requested_datetime', $req, 'Must have requested_datetime (not created_at)');
            $this->assertArrayHasKey('updated_datetime', $req);
            $this->assertArrayHasKey('address', $req);
            $this->assertArrayHasKey('agency_responsible', $req, 'Must have agency_responsible');
            // 'long' field (not 'lng')
            $this->assertArrayHasKey('long', $req, "Must use Open311 field name 'long' not 'lng'");
        }
    }

    public function testGetRequestsFilterByServiceCode(): void
    {
        $res  = $this->http->get("/open311/requests.json?service_code={$this->categoryCode}");
        $body = json_decode((string) $res->getBody(), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame(200, $res->getStatusCode());
        $this->assertIsArray($body);
        foreach ($body as $req) {
            $this->assertSame((string) $this->categoryCode, $req['service_code'],
                "All returned requests must match service_code filter {$this->categoryCode}");
        }
    }

    public function testGetRequestsXmlFormat(): void
    {
        $res = $this->http->get('/open311/requests.xml');
        $this->assertSame(200, $res->getStatusCode());

        $xml = simplexml_load_string((string) $res->getBody());
        $this->assertNotFalse($xml);
        $this->assertSame('service_requests', $xml->getName(), 'Root element must be <service_requests>');
    }

    // ─── GET /open311/requests/{service_request_id} ───────────────────────────

    public function testGetSingleRequestReturnsSingleElementArray(): void
    {
        // Create a ticket via POST first, get its ID
        $createRes = $this->http->post('/open311/requests.json', [
            'form_params' => [
                'service_code'   => (string) $this->categoryCode,
                'description'    => 'Integration test: single-request GET',
                'address_string' => '100 Test Lane',
            ],
        ]);
        $createBody = json_decode((string) $createRes->getBody(), true, 512, JSON_THROW_ON_ERROR);
        $srId = $createBody[0]['service_request_id'];

        // GeoReport v2: GET /requests/{id} must return single-element ARRAY [{...}], not plain object
        $res  = $this->http->get("/open311/requests/{$srId}.json");
        $body = json_decode((string) $res->getBody(), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame(200, $res->getStatusCode());
        $this->assertIsArray($body, 'GET /open311/requests/{id} must return an array (single-element per spec)');
        $this->assertCount(1, $body, 'Single-request GET must return exactly one element in array');
        $this->assertSame($srId, $body[0]['service_request_id']);
    }

    // ─── GET /open311/discovery ───────────────────────────────────────────────

    public function testDiscoveryDocumentReturnsSpecCompliantShape(): void
    {
        $res  = $this->http->get('/open311/discovery.json');
        $body = json_decode((string) $res->getBody(), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame(200, $res->getStatusCode());
        $this->assertArrayHasKey('changeset', $body);
        $this->assertArrayHasKey('contact', $body);
        $this->assertArrayHasKey('endpoints', $body);
        $this->assertIsArray($body['endpoints']);
        $this->assertNotEmpty($body['endpoints']);

        $endpoint = $body['endpoints'][0];
        $this->assertArrayHasKey('specification', $endpoint);
        $this->assertArrayHasKey('url', $endpoint);
        $this->assertArrayHasKey('formats', $endpoint);
        $this->assertContains('application/json', $endpoint['formats'],
            'Discovery must list application/json format');
        $this->assertContains('text/xml', $endpoint['formats'],
            'Discovery must list text/xml format');
    }

    public function testDiscoveryXmlFormat(): void
    {
        $res = $this->http->get('/open311/discovery.xml');
        $this->assertSame(200, $res->getStatusCode());

        $xml = simplexml_load_string((string) $res->getBody());
        $this->assertNotFalse($xml);
        $this->assertSame('discovery', $xml->getName(), 'Root element must be <discovery>');
        $this->assertTrue(isset($xml->changeset));
        $this->assertTrue(isset($xml->endpoints));
    }
}
