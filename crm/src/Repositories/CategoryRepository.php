<?php

declare(strict_types=1);

namespace Repositories;

class CategoryRepository extends AbstractRepository
{
    public function findById(int $id): ?array
    {
        $row = $this->fetchOne('SELECT * FROM categories WHERE id = :id', [':id' => $id]);
        if ($row) {
            $row['fields'] = $this->decodeJson($row['fields']);
        }
        return $row;
    }

    public function findAll(array $filters = []): array
    {
        $where  = ['1=1'];
        $params = [];

        if (isset($filters['active'])) {
            $where[]           = 'active = :active';
            $params[':active'] = (int) $filters['active'];
        }
        if (!empty($filters['departmentId'])) {
            $where[]         = 'departmentId = :deptId';
            $params[':deptId'] = $filters['departmentId'];
        }

        $rows = $this->fetchAll(
            'SELECT * FROM categories WHERE ' . implode(' AND ', $where) . ' ORDER BY name',
            $params
        );

        return array_map(fn($r) => array_merge($r, ['fields' => $this->decodeJson($r['fields'])]), $rows);
    }

    public function create(array $data): int
    {
        return $this->insertRow(
            'INSERT INTO categories (name, departmentId, groupId, slaDays, displayPermission, postingPermission, defaultAssigneeId, autoCloseDays, active, fields)
             VALUES (:name, :departmentId, :groupId, :slaDays, :displayPermission, :postingPermission, :defaultAssigneeId, :autoCloseDays, :active, :fields)',
            [
                ':name'               => $data['name'],
                ':departmentId'       => $data['departmentId'],
                ':groupId'            => $data['groupId'] ?? null,
                ':slaDays'            => $data['slaDays'] ?? null,
                ':displayPermission'  => $data['displayPermission'] ?? 'public',
                ':postingPermission'  => $data['postingPermission'] ?? 'public',
                ':defaultAssigneeId'  => $data['defaultAssigneeId'] ?? null,
                ':autoCloseDays'      => $data['autoCloseDays'] ?? 0,
                ':active'             => $data['active'] ?? 1,
                ':fields'             => isset($data['fields'])
                                          ? json_encode($data['fields'], JSON_THROW_ON_ERROR)
                                          : null,
            ]
        );
    }

    public function update(int $id, array $data): int
    {
        $sets   = [];
        $params = [':id' => $id];
        $cols   = ['name', 'departmentId', 'groupId', 'slaDays', 'displayPermission', 'postingPermission', 'defaultAssigneeId', 'autoCloseDays', 'active'];

        foreach ($cols as $col) {
            if (array_key_exists($col, $data)) {
                $sets[]            = "{$col} = :{$col}";
                $params[":{$col}"] = $data[$col];
            }
        }

        if (array_key_exists('fields', $data)) {
            $sets[]           = 'fields = :fields';
            $params[':fields'] = $data['fields'] !== null
                                  ? json_encode($data['fields'], JSON_THROW_ON_ERROR)
                                  : null;
        }

        return empty($sets) ? 0 : $this->execute(
            'UPDATE categories SET ' . implode(', ', $sets) . ' WHERE id = :id',
            $params
        );
    }
}
