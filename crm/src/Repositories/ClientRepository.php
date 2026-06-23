<?php

declare(strict_types=1);

namespace Repositories;

class ClientRepository extends AbstractRepository
{
    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM clients WHERE id = :id', [':id' => $id]);
    }

    public function findAll(bool $activeOnly = true): array
    {
        $w = $activeOnly ? 'WHERE active = 1' : '';
        return $this->fetchAll(
            "SELECT id, name, contactEmail, apiKeyHint, notes, active, createdAt, updatedAt FROM clients {$w} ORDER BY name"
        );
    }

    /** Never returns apiKeyHash in results — callers must use findHashById() for hash comparison. */
    public function findHashById(int $id): ?string
    {
        $row = $this->fetchOne('SELECT apiKeyHash FROM clients WHERE id = :id AND active = 1', [':id' => $id]);
        return $row['apiKeyHash'] ?? null;
    }

    public function create(array $data): int
    {
        return $this->insertRow(
            'INSERT INTO clients (name, contactEmail, apiKeyHash, apiKeyHint, notes, active) VALUES (:name, :contactEmail, :apiKeyHash, :apiKeyHint, :notes, :active)',
            [
                ':name'         => $data['name'],
                ':contactEmail' => $data['contactEmail'],
                ':apiKeyHash'   => $data['apiKeyHash'],
                ':apiKeyHint'   => $data['apiKeyHint'],
                ':notes'        => $data['notes'] ?? null,
                ':active'       => $data['active'] ?? 1,
            ]
        );
    }

    public function updateKey(int $id, string $newHash, string $newHint): int
    {
        return $this->execute(
            'UPDATE clients SET apiKeyHash = :h, apiKeyHint = :hint WHERE id = :id',
            [':h' => $newHash, ':hint' => $newHint, ':id' => $id]
        );
    }

    public function update(int $id, array $data): int
    {
        $sets   = [];
        $params = [':id' => $id];

        foreach (['name', 'contactEmail', 'notes', 'active'] as $col) {
            if (array_key_exists($col, $data)) {
                $sets[]            = "{$col} = :{$col}";
                $params[":{$col}"] = $data[$col];
            }
        }

        return empty($sets) ? 0 : $this->execute(
            'UPDATE clients SET ' . implode(', ', $sets) . ' WHERE id = :id',
            $params
        );
    }
}
