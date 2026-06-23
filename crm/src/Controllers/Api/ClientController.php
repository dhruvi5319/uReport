<?php
declare(strict_types=1);
namespace Controllers\Api;

use Domain\Client;
use Repositories\ClientRepository;

class ClientController
{
    public function __construct(
        private ClientRepository $clientRepo,
    ) {}

    // ── GET /api/clients ─────────────────────────────────────────────────────

    public function index(array $query, array $currentUser): array
    {
        $activeOnly = isset($query['active']) ? (bool) $query['active'] : true;
        $clients    = $this->clientRepo->findAll($activeOnly);

        return [
            'status' => 200,
            'body'   => [
                'data'   => array_map([$this, 'serialize'], $clients),
                'meta'   => ['total' => count($clients)],
                'errors' => [],
            ],
        ];
    }

    // ── POST /api/clients ────────────────────────────────────────────────────

    public function create(array $body, array $currentUser): array
    {
        $errors = $this->validate($body, isCreate: true);
        if ($errors) {
            return ['status' => 422, 'body' => ['data' => null, 'meta' => [], 'errors' => $errors]];
        }

        // Generate plain API key (32 hex chars = 128-bit entropy)
        $plainKey = $this->generateApiKey();
        $keyHash  = password_hash($plainKey, PASSWORD_BCRYPT);
        $keyHint  = substr($plainKey, 0, 8) . '…';

        $entity = new Client(
            id:           0,
            name:         trim($body['name']),
            contactEmail: trim($body['contactEmail']),
            apiKeyHash:   $keyHash,
            apiKeyHint:   $keyHint,
            notes:        $body['notes'] ?? null,
            active:       true,
            createdAt:    date('Y-m-d H:i:s'),
            updatedAt:    date('Y-m-d H:i:s'),
        );

        $saved = $this->clientRepo->save($entity);

        // Return full key ONCE — callers must save it; not retrievable later
        $data           = $this->serialize($saved);
        $data['apiKey'] = $plainKey;

        return [
            'status' => 201,
            'body'   => ['data' => $data, 'meta' => [], 'errors' => []],
        ];
    }

    // ── GET /api/clients/{id} ────────────────────────────────────────────────

    public function show(int $id, array $currentUser): array
    {
        $client = $this->clientRepo->findById($id);
        if (!$client) {
            return $this->notFound();
        }

        return [
            'status' => 200,
            'body'   => ['data' => $this->serialize($client), 'meta' => [], 'errors' => []],
        ];
    }

    // ── PUT /api/clients/{id} ────────────────────────────────────────────────

    public function update(int $id, array $body, array $currentUser): array
    {
        $client = $this->clientRepo->findById($id);
        if (!$client) {
            return $this->notFound();
        }

        $updated = new Client(
            id:           $client->id,
            name:         isset($body['name']) ? trim($body['name']) : $client->name,
            contactEmail: isset($body['contactEmail']) ? trim($body['contactEmail']) : $client->contactEmail,
            apiKeyHash:   $client->apiKeyHash,   // key is NOT updated here
            apiKeyHint:   $client->apiKeyHint,
            notes:        array_key_exists('notes', $body) ? $body['notes'] : $client->notes,
            active:       isset($body['active']) ? (bool) $body['active'] : $client->active,
            createdAt:    $client->createdAt,
            updatedAt:    date('Y-m-d H:i:s'),
        );

        $errors = $this->validate(['name' => $updated->name, 'contactEmail' => $updated->contactEmail], isCreate: false);
        if ($errors) {
            return ['status' => 422, 'body' => ['data' => null, 'meta' => [], 'errors' => $errors]];
        }

        $saved = $this->clientRepo->save($updated);

        return [
            'status' => 200,
            'body'   => ['data' => $this->serialize($saved), 'meta' => [], 'errors' => []],
        ];
    }

    // ── DELETE /api/clients/{id} ─────────────────────────────────────────────

    public function deactivate(int $id, array $currentUser): array
    {
        $client = $this->clientRepo->findById($id);
        if (!$client) {
            return $this->notFound();
        }

        // Soft-deactivate: set active = false (Open311 validation will reject future requests from this key)
        $deactivated = new Client(
            id:           $client->id,
            name:         $client->name,
            contactEmail: $client->contactEmail,
            apiKeyHash:   $client->apiKeyHash,
            apiKeyHint:   $client->apiKeyHint,
            notes:        $client->notes,
            active:       false,
            createdAt:    $client->createdAt,
            updatedAt:    date('Y-m-d H:i:s'),
        );

        $this->clientRepo->save($deactivated);

        return ['status' => 204, 'body' => null];
    }

    // ── POST /api/clients/{id}/regenerate-key ────────────────────────────────

    public function regenerateKey(int $id, array $currentUser): array
    {
        $client = $this->clientRepo->findById($id);
        if (!$client) {
            return $this->notFound();
        }

        $plainKey = $this->generateApiKey();
        $keyHash  = password_hash($plainKey, PASSWORD_BCRYPT);
        $keyHint  = substr($plainKey, 0, 8) . '…';

        $updated = new Client(
            id:           $client->id,
            name:         $client->name,
            contactEmail: $client->contactEmail,
            apiKeyHash:   $keyHash,
            apiKeyHint:   $keyHint,
            notes:        $client->notes,
            active:       $client->active,
            createdAt:    $client->createdAt,
            updatedAt:    date('Y-m-d H:i:s'),
        );

        $saved = $this->clientRepo->save($updated);

        // Return full key ONCE
        $data           = $this->serialize($saved);
        $data['apiKey'] = $plainKey;

        return [
            'status' => 200,
            'body'   => ['data' => $data, 'meta' => [], 'errors' => []],
        ];
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /**
     * Generate a cryptographically random API key (32 hex chars = 128-bit entropy).
     */
    private function generateApiKey(): string
    {
        return bin2hex(random_bytes(16));
    }

    private function validate(array $body, bool $isCreate): array
    {
        $errors = [];

        if ($isCreate && empty($body['name'])) {
            $errors[] = ['field' => 'name', 'message' => 'name is required', 'code' => 'REQUIRED'];
        }
        if ($isCreate && empty($body['contactEmail'])) {
            $errors[] = ['field' => 'contactEmail', 'message' => 'contactEmail is required', 'code' => 'REQUIRED'];
        }
        if (!empty($body['contactEmail']) && !filter_var($body['contactEmail'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = ['field' => 'contactEmail', 'message' => 'contactEmail must be a valid email address', 'code' => 'INVALID_EMAIL'];
        }

        return $errors;
    }

    /**
     * Serialize a Client for API response.
     * NEVER includes apiKeyHash — only apiKeyHint.
     */
    private function serialize(Client $c): array
    {
        return [
            'id'           => $c->id,
            'name'         => $c->name,
            'contactEmail' => $c->contactEmail,
            'apiKeyHint'   => $c->apiKeyHint,   // e.g. "a1b2c3d4…"
            'notes'        => $c->notes,
            'active'       => $c->active,
            'createdAt'    => $c->createdAt,
            'updatedAt'    => $c->updatedAt,
            // apiKey NOT included here — only returned on create/regenerate by callers
        ];
    }

    private function notFound(): array
    {
        return ['status' => 404, 'body' => ['data' => null, 'meta' => [], 'errors' => [
            ['field' => null, 'message' => 'API client not found', 'code' => 'NOT_FOUND']
        ]]];
    }
}
