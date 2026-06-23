<?php
declare(strict_types=1);

// Load CRM autoloader
require_once __DIR__ . '/../crm/vendor/autoload.php';

// Environment overrides for integration tests
// CI sets these via phpunit.integration.xml <env> or docker compose environment.
// Local developers can override via a local .env.test file.
if (file_exists(__DIR__ . '/../.env.test')) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..', '.env.test');
    $dotenv->safeLoad();
}

// Shared HTTP client helper for integration tests.
// Wraps Guzzle (or native cURL) with base URL and session cookie jar.
if (!function_exists('integration_http_client')) {
    function integration_http_client(array $options = []): \GuzzleHttp\Client
    {
        return new \GuzzleHttp\Client(array_merge([
            'base_uri'        => getenv('TEST_APP_BASE_URL') ?: 'http://localhost:8080',
            'allow_redirects' => false,
            'http_errors'     => false,
            'timeout'         => 10,
        ], $options));
    }
}

// Test PDO connection helper.
if (!function_exists('integration_pdo')) {
    function integration_pdo(): \PDO
    {
        static $pdo = null;
        if ($pdo === null) {
            $pdo = new \PDO(
                getenv('TEST_DB_DSN') ?: 'mysql:host=127.0.0.1;dbname=ureport_test;charset=utf8mb4',
                getenv('TEST_DB_USER') ?: 'ureport_test',
                getenv('TEST_DB_PASS') ?: 'ureport_test',
                [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
            );
        }
        return $pdo;
    }
}

// Seed helper: insert a minimal active category for Open311 tests.
if (!function_exists('seed_open311_category')) {
    function seed_open311_category(): int
    {
        $pdo = integration_pdo();
        // Upsert a test department
        $pdo->exec("INSERT IGNORE INTO departments (id, name, active) VALUES (9001, 'Test Dept', 1)");
        // Upsert a test category with public posting permission
        $pdo->exec(
            "INSERT INTO categories (id, name, departmentId, active, postingPermission, displayPermission, slaDays)
             VALUES (9001, 'Pothole or Road Damage', 9001, 1, 'anonymous', 'public', 5)
             ON DUPLICATE KEY UPDATE name=VALUES(name), active=1, postingPermission='anonymous'"
        );
        return 9001;
    }
}

// Seed helper: insert a test API client with a known key.
if (!function_exists('seed_api_client')) {
    function seed_api_client(): array
    {
        $pdo      = integration_pdo();
        $rawKey   = 'test-integration-key-' . bin2hex(random_bytes(4));
        $keyHash  = password_hash($rawKey, PASSWORD_BCRYPT);
        $pdo->exec(
            "INSERT INTO clients (name, contactEmail, apiKeyHash, active)
             VALUES ('Test Client', 'test@example.com', " . $pdo->quote($keyHash) . ", 1)
             ON DUPLICATE KEY UPDATE apiKeyHash=VALUES(apiKeyHash)"
        );
        $id = (int) $pdo->lastInsertId();
        return ['id' => $id, 'key' => $rawKey, 'hash' => $keyHash];
    }
}
