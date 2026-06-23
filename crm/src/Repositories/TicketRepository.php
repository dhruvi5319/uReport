<?php

declare(strict_types=1);

namespace Repositories;

class TicketRepository extends AbstractRepository
{
    public function findById(int $id): ?array
    {
        return $this->fetchOne(
            'SELECT * FROM tickets WHERE id = :id AND deletedAt IS NULL',
            [':id' => $id]
        );
    }

    public function findAll(array $filters = [], int $page = 1, int $perPage = 25): array
    {
        $where  = ['t.deletedAt IS NULL'];
        $params = [];

        if (!empty($filters['status'])) {
            $where[]           = 't.status = :status';
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['categoryId'])) {
            $where[]               = 't.categoryId = :categoryId';
            $params[':categoryId'] = $filters['categoryId'];
        }
        if (!empty($filters['departmentId'])) {
            $where[]                 = 't.departmentId = :departmentId';
            $params[':departmentId'] = $filters['departmentId'];
        }
        if (!empty($filters['personId'])) {
            $where[]             = 't.personId = :personId';
            $params[':personId'] = $filters['personId'];
        }
        if (!empty($filters['substatusId'])) {
            $where[]                = 't.substatusId = :substatusId';
            $params[':substatusId'] = $filters['substatusId'];
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);
        $offset      = ($page - 1) * $perPage;

        $sql = "SELECT t.* FROM tickets t {$whereClause}
                ORDER BY t.datetimeOpened DESC
                LIMIT {$perPage} OFFSET {$offset}";

        return $this->fetchAll($sql, $params);
    }

    public function countAll(array $filters = []): int
    {
        $where  = ['deletedAt IS NULL'];
        $params = [];

        if (!empty($filters['status'])) {
            $where[]           = 'status = :status';
            $params[':status'] = $filters['status'];
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);
        $row         = $this->fetchOne("SELECT COUNT(*) as cnt FROM tickets {$whereClause}", $params);
        return (int) ($row['cnt'] ?? 0);
    }

    public function create(array $data): int
    {
        return $this->insertRow(
            'INSERT INTO tickets
             (title, description, status, categoryId, departmentId, personId,
              reporterPersonId, reporterName, reporterEmail, reporterPhone,
              address, lat, lng, substatusId, apiClientId, customFields)
             VALUES
             (:title, :description, :status, :categoryId, :departmentId, :personId,
              :reporterPersonId, :reporterName, :reporterEmail, :reporterPhone,
              :address, :lat, :lng, :substatusId, :apiClientId, :customFields)',
            [
                ':title'            => $data['title'],
                ':description'      => $data['description'] ?? null,
                ':status'           => $data['status'] ?? 'open',
                ':categoryId'       => $data['categoryId'],
                ':departmentId'     => $data['departmentId'],
                ':personId'         => $data['personId'] ?? null,
                ':reporterPersonId' => $data['reporterPersonId'] ?? null,
                ':reporterName'     => $data['reporterName'] ?? null,
                ':reporterEmail'    => $data['reporterEmail'] ?? null,
                ':reporterPhone'    => $data['reporterPhone'] ?? null,
                ':address'          => $data['address'] ?? null,
                ':lat'              => $data['lat'] ?? null,
                ':lng'              => $data['lng'] ?? null,
                ':substatusId'      => $data['substatusId'] ?? null,
                ':apiClientId'      => $data['apiClientId'] ?? null,
                ':customFields'     => isset($data['customFields'])
                                        ? json_encode($data['customFields'], JSON_THROW_ON_ERROR)
                                        : null,
            ]
        );
    }

    public function update(int $id, array $data): int
    {
        $sets   = [];
        $params = [':id' => $id];

        $updatable = [
            'title', 'description', 'status', 'categoryId', 'departmentId',
            'personId', 'address', 'lat', 'lng', 'substatusId',
            'datetimeClosed', 'mergedIntoTicketId',
        ];

        foreach ($updatable as $col) {
            if (array_key_exists($col, $data)) {
                $sets[]            = "{$col} = :{$col}";
                $params[":{$col}"] = $data[$col];
            }
        }

        if (empty($sets)) {
            return 0;
        }

        return $this->execute(
            'UPDATE tickets SET ' . implode(', ', $sets) . ' WHERE id = :id',
            $params
        );
    }

    public function softDelete(int $id): int
    {
        return $this->execute(
            'UPDATE tickets SET deletedAt = NOW() WHERE id = :id',
            [':id' => $id]
        );
    }
}
