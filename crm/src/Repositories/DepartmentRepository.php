<?php

declare(strict_types=1);

namespace Repositories;

class DepartmentRepository extends AbstractRepository
{
    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM departments WHERE id = :id', [':id' => $id]);
    }

    public function findAll(bool $activeOnly = true): array
    {
        $where = $activeOnly ? 'WHERE active = 1' : '';
        return $this->fetchAll("SELECT * FROM departments {$where} ORDER BY name");
    }

    public function create(array $data): int
    {
        return $this->insertRow(
            'INSERT INTO departments (name, defaultAssigneeId, active) VALUES (:name, :defaultAssigneeId, :active)',
            [
                ':name'              => $data['name'],
                ':defaultAssigneeId' => $data['defaultAssigneeId'] ?? null,
                ':active'            => $data['active'] ?? 1,
            ]
        );
    }

    public function update(int $id, array $data): int
    {
        $sets   = [];
        $params = [':id' => $id];

        foreach (['name', 'defaultAssigneeId', 'active'] as $col) {
            if (array_key_exists($col, $data)) {
                $sets[]            = "{$col} = :{$col}";
                $params[":{$col}"] = $data[$col];
            }
        }

        return empty($sets) ? 0 : $this->execute(
            'UPDATE departments SET ' . implode(', ', $sets) . ' WHERE id = :id',
            $params
        );
    }

    public function countActiveTickets(int $id): int
    {
        $row = $this->fetchOne(
            "SELECT COUNT(*) as cnt FROM tickets WHERE departmentId = :id AND status = 'open' AND deletedAt IS NULL",
            [':id' => $id]
        );
        return (int) ($row['cnt'] ?? 0);
    }
}
