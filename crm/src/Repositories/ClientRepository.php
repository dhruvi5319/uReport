<?php
declare(strict_types=1);
namespace Repositories;

use Domain\Client;

class ClientRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?Client
    {
        $stmt = $this->pdo->prepare('SELECT * FROM clients WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Client::fromRow($row) : null;
    }

    /** Used for Open311 API key validation */
    public function findByApiKeyHash(string $hash): ?Client
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM clients WHERE apiKeyHash = :hash AND active = 1 LIMIT 1'
        );
        $stmt->execute(['hash' => $hash]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Client::fromRow($row) : null;
    }

    /**
     * Validate a plain-text api_key against bcrypt hashes in clients table.
     * Uses the first 8-char hint to narrow candidate set before full bcrypt verify.
     * Returns the matching active Client or null.
     */
    public function findByApiKey(string $plainKey): ?Client
    {
        // Use apiKeyHint (first 8 chars) to pre-filter candidates and avoid full-table bcrypt scan
        $hint = substr($plainKey, 0, 8);
        $stmt = $this->pdo->prepare(
            'SELECT * FROM clients WHERE apiKeyHint = :hint AND active = 1'
        );
        $stmt->execute(['hint' => $hint]);
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            if (password_verify($plainKey, $row['apiKeyHash'])) {
                return Client::fromRow($row);
            }
        }
        return null;
    }

    /** @return Client[] */
    public function findAll(bool $activeOnly = true): array
    {
        $sql = $activeOnly
            ? 'SELECT * FROM clients WHERE active = 1 ORDER BY name ASC'
            : 'SELECT * FROM clients ORDER BY name ASC';
        return $this->fetchAll($sql, [], fn($row) => Client::fromRow($row));
    }

    public function save(object $entity): Client
    {
        /** @var Client $entity */
        // NOTE: apiKeyHash is bcrypt — caller is responsible for hashing before passing to save()
        $data = [
            'name'         => $entity->name,
            'contactEmail' => $entity->contactEmail,
            'apiKeyHash'   => $entity->apiKeyHash,
            'apiKeyHint'   => $entity->apiKeyHint,
            'notes'        => $entity->notes,
            'active'       => (int) $entity->active,
        ];

        if ($entity->id > 0) {
            $set  = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
            $stmt = $this->pdo->prepare("UPDATE clients SET $set WHERE id = :id");
            $data['id'] = $entity->id;
            $stmt->execute($data);
            return $this->findById($entity->id) ?? $entity;
        } else {
            $cols = implode(', ', array_keys($data));
            $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
            $stmt = $this->pdo->prepare("INSERT INTO clients ($cols) VALUES ($vals)");
            $stmt->execute($data);
            $newId = $this->lastInsertId();
            return $this->findById($newId) ?? $entity;
        }
    }

    /** Soft-deactivate */
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("UPDATE clients SET active = 0 WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
}
