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
            'changeset'   => $changeset,
            'contact'     => 'mailto:admin@' . parse_url($this->baseUrl, PHP_URL_HOST),
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
