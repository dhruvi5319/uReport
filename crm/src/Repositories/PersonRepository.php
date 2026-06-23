<?php

declare(strict_types=1);

namespace Repositories;

class PersonRepository extends AbstractRepository
{
    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM people WHERE id = :id', [':id' => $id]);
    }

    public function findByOidcSubject(string $subject): ?array
    {
        return $this->fetchOne(
            'SELECT * FROM people WHERE oidcSubject = :sub',
            [':sub' => $subject]
        );
    }

    public function findAll(array $filters = [], int $page = 1, int $perPage = 25): array
    {
        $where  = ['1=1'];
        $params = [];

        if (isset($filters['active'])) {
            $where[]           = 'active = :active';
            $params[':active'] = (int) $filters['active'];
        }
        if (!empty($filters['role'])) {
            $where[]         = 'role = :role';
            $params[':role'] = $filters['role'];
        }
        if (!empty($filters['departmentId'])) {
            $where[]                 = 'departmentId = :departmentId';
            $params[':departmentId'] = $filters['departmentId'];
        }

        $offset      = ($page - 1) * $perPage;
        $whereClause = 'WHERE ' . implode(' AND ', $where);

        return $this->fetchAll(
            "SELECT * FROM people {$whereClause} ORDER BY lastName, firstName LIMIT {$perPage} OFFSET {$offset}",
            $params
        );
    }

    public function create(array $data): int
    {
        return $this->insertRow(
            'INSERT INTO people (firstName, lastName, role, departmentId, active, oidcSubject)
             VALUES (:firstName, :lastName, :role, :departmentId, :active, :oidcSubject)',
            [
                ':firstName'    => $data['firstName'],
                ':lastName'     => $data['lastName'],
                ':role'         => $data['role'] ?? 'public',
                ':departmentId' => $data['departmentId'] ?? null,
                ':active'       => $data['active'] ?? 1,
                ':oidcSubject'  => $data['oidcSubject'] ?? null,
            ]
        );
    }

    public function update(int $id, array $data): int
    {
        $sets   = [];
        $params = [':id' => $id];

        foreach (['firstName', 'lastName', 'role', 'departmentId', 'active', 'oidcSubject'] as $col) {
            if (array_key_exists($col, $data)) {
                $sets[]            = "{$col} = :{$col}";
                $params[":{$col}"] = $data[$col];
            }
        }

        if (empty($sets)) {
            return 0;
        }

        return $this->execute(
            'UPDATE people SET ' . implode(', ', $sets) . ' WHERE id = :id',
            $params
        );
    }
}
