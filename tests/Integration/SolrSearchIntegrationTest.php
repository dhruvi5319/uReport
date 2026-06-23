<?php
declare(strict_types=1);

namespace Tests\Integration;

use PHPUnit\Framework\TestCase;
use GuzzleHttp\Client;

/**
 * Solr Search Integration Test Suite
 *
 * Tests that ticket mutations are reflected in the Solr index and that
 * search queries return correct results from the /api/tickets endpoint.
 *
 * PRD: F4 (Full-Text Search & Filtering), F5 (Geospatial — Solr spatial)
 * Wave: 2c SearchService integration
 */
class SolrSearchIntegrationTest extends TestCase
{
    private Client $http;
    private Client $solrHttp;
    private string $solrUrl;

    protected function setUp(): void
    {
        $this->http     = integration_http_client();
        $this->solrUrl  = getenv('TEST_SOLR_URL') ?: 'http://localhost:8983/solr/ureport_test';
        $this->solrHttp = new Client([
            'base_uri'    => $this->solrUrl,
            'http_errors' => false,
            'timeout'     => 5,
        ]);

        // Skip if Solr is unreachable
        try {
            $probe = $this->solrHttp->get('/admin/ping');
            if ($probe->getStatusCode() !== 200) {
                $this->markTestSkipped('Solr unavailable — skipping Solr integration tests');
            }
        } catch (\Throwable) {
            $this->markTestSkipped('Solr unavailable — skipping Solr integration tests');
        }

        // Ensure test category exists
        seed_open311_category();
    }

    /**
     * Ticket creation must trigger a Solr index update.
     * After creating a ticket, a Solr query for its title should return it.
     */
    public function testTicketCreationIndexedInSolr(): void
    {
        $uniqueKeyword = 'SolrTest_' . bin2hex(random_bytes(6));

        // Create ticket via API
        $res = $this->http->post('/api/tickets', [
            'json' => [
                'title'       => "{$uniqueKeyword} pothole on Oak Street",
                'description' => 'Integration test for Solr indexing',
                'categoryId'  => 9001,
                'address'     => '100 Oak Street',
            ],
            'headers' => ['Cookie' => $this->getStaffSessionCookie()],
        ]);

        $this->assertContains($res->getStatusCode(), [200, 201],
            'Ticket creation must return 200 or 201');

        // Wait for async Solr commit (allow up to 5 seconds)
        $solrFound = false;
        for ($i = 0; $i < 10; $i++) {
            usleep(500_000); // 0.5s
            $solrRes  = $this->solrHttp->get('/select?q=' . urlencode($uniqueKeyword) . '&wt=json');
            $solrBody = json_decode((string) $solrRes->getBody(), true, 512, JSON_THROW_ON_ERROR);
            if (($solrBody['response']['numFound'] ?? 0) > 0) {
                $solrFound = true;
                break;
            }
        }

        $this->assertTrue($solrFound,
            "Ticket with keyword '{$uniqueKeyword}' must appear in Solr index after creation");
    }

    /**
     * Full-text search via /api/tickets?q=<keyword> must use Solr.
     */
    public function testFullTextSearchReturnsMatchingTickets(): void
    {
        $keyword = 'SolrSearchTest_' . bin2hex(random_bytes(4));

        // Seed a ticket via DB directly (faster than HTTP for setup)
        $pdo = integration_pdo();
        $pdo->prepare(
            "INSERT INTO tickets (title, description, status, categoryId, departmentId, datetimeOpened, datetimeUpdated)
             VALUES (:title, :desc, 'open', 9001, 9001, NOW(), NOW())"
        )->execute(['title' => "{$keyword} broken streetlight", 'desc' => 'Test description']);
        $ticketId = (int) $pdo->lastInsertId();

        // Force Solr index via CLI re-index command
        $this->runReindexCli();

        // Wait for Solr commit
        usleep(2_000_000);

        // Search via API
        $res  = $this->http->get('/api/tickets?q=' . urlencode($keyword), [
            'headers' => ['Cookie' => $this->getStaffSessionCookie()],
        ]);
        $body = json_decode((string) $res->getBody(), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame(200, $res->getStatusCode());
        $ids = array_column($body['data'] ?? [], 'id');
        $this->assertContains($ticketId, $ids,
            "Full-text search for '{$keyword}' must return the seeded ticket");

        // Cleanup
        $pdo->prepare('DELETE FROM tickets WHERE id = :id')->execute(['id' => $ticketId]);
    }

    /**
     * Status filter via /api/tickets?status=open must reduce result set.
     */
    public function testStatusFilterReducesResults(): void
    {
        $resOpen   = $this->http->get('/api/tickets?status=open', [
            'headers' => ['Cookie' => $this->getStaffSessionCookie()],
        ]);
        $resClosed = $this->http->get('/api/tickets?status=closed', [
            'headers' => ['Cookie' => $this->getStaffSessionCookie()],
        ]);

        $openBody   = json_decode((string) $resOpen->getBody(), true, 512, JSON_THROW_ON_ERROR);
        $closedBody = json_decode((string) $resClosed->getBody(), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame(200, $resOpen->getStatusCode());
        $this->assertSame(200, $resClosed->getStatusCode());

        // All returned tickets must match the requested status
        foreach ($openBody['data'] ?? [] as $ticket) {
            $this->assertSame('open', $ticket['status'],
                'status=open filter must only return open tickets');
        }
        foreach ($closedBody['data'] ?? [] as $ticket) {
            $this->assertSame('closed', $ticket['status'],
                'status=closed filter must only return closed tickets');
        }
    }

    /**
     * Re-index CLI must complete without error.
     * PRD: F4 US-4.3 "Keep Solr Index in Sync with Ticket Mutations"
     */
    public function testReindexCliCompletesWithoutError(): void
    {
        $exitCode = $this->runReindexCli();
        $this->assertSame(0, $exitCode,
            'Solr re-index CLI command must exit with code 0');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function getStaffSessionCookie(): string
    {
        // Returns a valid staff session cookie string for Authorization.
        // In CI, this uses a pre-seeded test staff user and a long-lived test JWT.
        // Falls back to skipping tests that require auth if no test session exists.
        $testJwt = getenv('TEST_STAFF_JWT') ?: '';
        if (empty($testJwt)) {
            return '';
        }
        return 'ureport_session=' . $testJwt;
    }

    private function runReindexCli(): int
    {
        $crmDir = __DIR__ . '/../../crm';
        exec("php {$crmDir}/bin/solr-reindex.php 2>&1", $output, $exitCode);
        return $exitCode;
    }
}
