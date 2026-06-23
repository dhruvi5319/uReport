<?php

declare(strict_types=1);

namespace Repositories;

class BookmarkRepository extends AbstractRepository
{
    public function findByPersonId(int $personId): array
    {
        $rows = $this->fetchAll(
            'SELECT * FROM bookmarks WHERE personId = :pid ORDER BY name',
            [':pid' => $personId]
        );
        return array_map(
            fn($r) => array_merge($r, ['filterState' => $this->decodeJson($r['filterState'])]),
            $rows
        );
    }

    public function findById(int $id): ?array
    {
        $row = $this->fetchOne('SELECT * FROM bookmarks WHERE id = :id', [':id' => $id]);
        if ($row) {
            $row['filterState'] = $this->decodeJson($row['filterState']);
        }
        return $row;
    }

    public function countByPersonId(int $personId): int
    {
        $row = $this->fetchOne(
            'SELECT COUNT(*) as cnt FROM bookmarks WHERE personId = :pid',
            [':pid' => $personId]
        );
        return (int) ($row['cnt'] ?? 0);
    }

    public function create(array $data): int
    {
        return $this->insertRow(
            'INSERT INTO bookmarks (personId, name, filterState) VALUES (:personId, :name, :filterState)',
            [
                ':personId'    => $data['personId'],
                ':name'        => $data['name'],
                ':filterState' => json_encode($data['filterState'], JSON_THROW_ON_ERROR),
            ]
        );
    }

    public function delete(int $id): int
    {
        return $this->execute('DELETE FROM bookmarks WHERE id = :id', [':id' => $id]);
    }
}
