<?php
declare(strict_types=1);
namespace Controllers\Api;

class OpenApiController
{
    private string $specPath;
    private string $docsPath;

    public function __construct()
    {
        // Resolve paths relative to this file's location (src/Controllers/Api/ → 3 levels up → public/)
        $publicDir      = dirname(__DIR__, 3) . '/public';
        $this->specPath = $publicDir . '/api/openapi.json';
        $this->docsPath = $publicDir . '/api/docs/index.html';
    }

    /**
     * GET /api/openapi.json — serve the raw OpenAPI 3.1 JSON spec
     */
    public function spec(): void
    {
        if (!file_exists($this->specPath)) {
            http_response_code(404);
            echo json_encode(['error' => 'OpenAPI spec not found']);
            return;
        }
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: public, max-age=300');
        readfile($this->specPath);
    }

    /**
     * GET /api/openapi.yaml — serve the spec as YAML
     * Converts JSON to YAML on-the-fly if symfony/yaml is available; otherwise redirects to JSON.
     */
    public function yaml(): void
    {
        if (!file_exists($this->specPath)) {
            http_response_code(404);
            return;
        }
        // If symfony/yaml is available, convert; otherwise redirect to JSON
        if (class_exists(\Symfony\Component\Yaml\Yaml::class)) {
            $json = file_get_contents($this->specPath);
            if ($json === false) {
                http_response_code(500);
                return;
            }
            $data = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
            header('Content-Type: application/yaml; charset=utf-8');
            echo \Symfony\Component\Yaml\Yaml::dump($data, 10, 2);
        } else {
            // Graceful degradation: redirect to JSON
            header('Location: /api/openapi.json', true, 302);
        }
    }

    /**
     * GET /api/docs — serve the Swagger UI HTML page
     */
    public function docs(): void
    {
        if (!file_exists($this->docsPath)) {
            http_response_code(404);
            echo '<!DOCTYPE html><html><body>API docs not found.</body></html>';
            return;
        }
        header('Content-Type: text/html; charset=utf-8');
        header('X-Frame-Options: SAMEORIGIN');
        readfile($this->docsPath);
    }
}
