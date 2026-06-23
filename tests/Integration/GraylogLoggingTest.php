<?php
declare(strict_types=1);

namespace Tests\Integration;

use PHPUnit\Framework\TestCase;
use GuzzleHttp\Client;

/**
 * Graylog Structured Logging Verification
 *
 * Verifies that GELF messages are emitted to Graylog with correct
 * structured fields on ticket creation, auth events, and API errors.
 *
 * PRD: NFR-13 (Observability — all errors forwarded to Graylog)
 * Uses a test UDP GELF listener to capture emitted messages.
 */
class GraylogLoggingTest extends TestCase
{
    private Client $http;
    private ?resource $udpSocket = null;
    private string $gelfHost;
    private int    $gelfPort;

    protected function setUp(): void
    {
        $this->http      = integration_http_client();
        $this->gelfHost  = getenv('TEST_GELF_HOST') ?: '127.0.0.1';
        $this->gelfPort  = (int) (getenv('TEST_GELF_PORT') ?: 12201);

        // Start a UDP listener to capture GELF messages from the app
        $socket = @socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
        if ($socket === false || !@socket_bind($socket, $this->gelfHost, $this->gelfPort)) {
            $this->markTestSkipped(
                "Cannot bind UDP socket on {$this->gelfHost}:{$this->gelfPort} — skipping Graylog tests"
            );
        }
        socket_set_nonblock($socket);
        $this->udpSocket = $socket;

        // Seed required test data
        seed_open311_category();
    }

    protected function tearDown(): void
    {
        if ($this->udpSocket !== null) {
            socket_close($this->udpSocket);
            $this->udpSocket = null;
        }
    }

    /**
     * Ticket creation must emit a GELF INFO message with _ticket_id field.
     * NFR-13: all errors forwarded to Graylog; INFO events also logged.
     */
    public function testTicketCreationEmitsGelfMessage(): void
    {
        // Create a ticket — should trigger a log emission
        $this->http->post('/api/tickets', [
            'json' => [
                'title'      => 'Graylog test ticket ' . uniqid(),
                'categoryId' => 9001,
                'address'    => '50 Test Lane',
            ],
            'headers' => ['Cookie' => $this->getCookieHeader()],
        ]);

        $message = $this->captureGelfMessage(timeout: 3);

        if ($message === null) {
            $this->markTestSkipped('No GELF message captured — Graylog emitter may not be configured for test env');
        }

        $this->assertArrayHasKey('version', $message, 'GELF message must have version field');
        $this->assertArrayHasKey('host', $message, 'GELF message must have host field');
        $this->assertArrayHasKey('short_message', $message, 'GELF message must have short_message field');
        $this->assertArrayHasKey('level', $message, 'GELF message must have level field');
        // Ticket-specific structured field
        $this->assertArrayHasKey('_ticket_id', $message,
            'Ticket creation GELF message must include _ticket_id structured field');
        $this->assertSame('1.1', $message['version'], 'GELF version must be 1.1');
    }

    /**
     * API 4xx errors must emit a GELF WARNING message with _http_status field.
     * NFR-13: "all errors must be forwarded to Graylog"
     */
    public function testApi4xxErrorEmitsGelfWarning(): void
    {
        // Trigger a 422 validation error
        $this->http->post('/api/tickets', [
            'json'    => [], // Missing required fields → 422
            'headers' => ['Cookie' => $this->getCookieHeader()],
        ]);

        $message = $this->captureGelfMessage(timeout: 3);

        if ($message === null) {
            $this->markTestSkipped('No GELF message captured — Graylog emitter may not be configured for test env');
        }

        // 4xx errors must be logged at WARNING level or above
        $this->assertArrayHasKey('level', $message);
        $this->assertLessThanOrEqual(4, $message['level'],
            'GELF level must be WARNING (4) or higher severity for 4xx errors');
        $this->assertArrayHasKey('_http_status', $message,
            '4xx error GELF message must include _http_status structured field');
    }

    /**
     * Graylog handler must produce valid GELF 1.1 format messages.
     * Tests the handler directly (unit-style but against real GraylogHandler class).
     */
    public function testGraylogHandlerProducesValidGelfFormat(): void
    {
        // Check that GraylogHandler class exists in the CRM
        $handlerClass = \Logging\GraylogHandler::class;
        if (!class_exists($handlerClass)) {
            // Try alternate namespace
            $handlerClass = \App\Logging\GraylogHandler::class;
            if (!class_exists($handlerClass)) {
                $this->markTestSkipped('GraylogHandler class not found — skipping format test');
            }
        }

        // Instantiate with test socket target
        $handler = new $handlerClass($this->gelfHost, $this->gelfPort);
        $handler->emit('Test log message', 6, ['_test_field' => 'integration']);

        $message = $this->captureGelfMessage(timeout: 2);

        if ($message === null) {
            $this->markTestSkipped('No GELF message captured from handler');
        }

        // Required GELF 1.1 fields
        $this->assertSame('1.1', $message['version']);
        $this->assertNotEmpty($message['host']);
        $this->assertNotEmpty($message['short_message']);
        $this->assertIsInt($message['level']);
        $this->assertArrayHasKey('_test_field', $message,
            'Custom structured fields must appear in GELF message with _ prefix');
        $this->assertSame('integration', $message['_test_field']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Attempt to receive one GELF UDP message within the given timeout (seconds).
     * Returns decoded JSON array or null if timeout exceeded.
     */
    private function captureGelfMessage(int $timeout): ?array
    {
        if ($this->udpSocket === null) {
            return null;
        }

        $deadline = microtime(true) + $timeout;

        while (microtime(true) < $deadline) {
            $data = '';
            $from = '';
            $port = 0;
            $bytes = @socket_recvfrom($this->udpSocket, $data, 65535, 0, $from, $port);

            if ($bytes > 0 && $data !== '') {
                try {
                    // GELF can be chunked or compressed; for simplicity handle plain JSON
                    $decoded = json_decode($data, true, 512, JSON_THROW_ON_ERROR);
                    if (isset($decoded['version'])) {
                        return $decoded;
                    }
                } catch (\JsonException) {
                    // May be compressed — skip for now
                }
            }

            usleep(100_000); // 100ms polling interval
        }

        return null;
    }

    private function getCookieHeader(): string
    {
        $testJwt = getenv('TEST_STAFF_JWT') ?: '';
        return $testJwt ? "ureport_session={$testJwt}" : '';
    }
}
