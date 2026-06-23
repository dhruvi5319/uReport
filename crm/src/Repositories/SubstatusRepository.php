<?php

declare(strict_types=1);

namespace Repositories;

class SubstatusRepository extends AbstractRepository
{
    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM substatus WHERE id = :id', [':id' => $id]);
    }

    public function findAll(bool $activeOnly = true): array
    {
        $w = $activeOnly ? 'WHERE active = 1' : '';
        return $this->fetchAll("SELECT * FROM substatus {$w} ORDER BY primaryStatus, sortOrder");
    }

    public function findDefault(string $primaryStatus): ?array
    {
        return $this->fetchOne(
            'SELECT * FROM substatus WHERE primaryStatus = :ps AND isDefault = 1 AND active = 1 LIMIT 1',
            [':ps' => $primaryStatus]
        );
    }

    public function create(array $data): int
    {
        return $this->insertRow(
            'INSERT INTO substatus (label, primaryStatus, isDefault, active, sortOrder) VALUES (:label, :primaryStatus, :isDefault, :active, :sortOrder)',
            [
                ':label'         => $data['label'],
                ':primaryStatus' => $data['primaryStatus'],
                ':isDefault'     => $data['isDefault'] ?? 0,
                ':active'        => $data['active'] ?? 1,
                ':sortOrder'     => $data['sortOrder'] ?? 0,
            ]
        );
    }

    public function clearDefault(string $primaryStatus, int $exceptId = 0): void
    {
        $this->execute(
            'UPDATE substatus SET isDefault = 0 WHERE primaryStatus = :ps AND id != :id',
            [':ps' => $primaryStatus, ':id' => $exceptId]
        );
    }

    public function update(int $id, array $data): int
    {
        $sets   = [];
        $params = [':id' => $id];

        foreach (['label', 'primaryStatus', 'isDefault', 'active', 'sortOrder'] as $col) {
            if (array_key_exists($col, $data)) {
                $sets[]            = "{$col} = :{$col}";
                $params[":{$col}"] = $data[$col];
            }
        }

        return empty($sets) ? 0 : $this->execute(
            'UPDATE substatus SET ' . implode(', ', $sets) . ' WHERE id = :id',
            $params
        );
    }
}
