<?php

declare(strict_types=1);

namespace Repositories;

class MediaRepository extends AbstractRepository
{
    public function findByTicketId(int $ticketId): array
    {
        return $this->fetchAll(
            'SELECT * FROM media WHERE ticketId = :tid AND deletedAt IS NULL ORDER BY createdAt',
            [':tid' => $ticketId]
        );
    }

    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM media WHERE id = :id AND deletedAt IS NULL', [':id' => $id]);
    }

    public function create(array $data): int
    {
        return $this->insertRow(
            'INSERT INTO media (ticketId, filename, originalName, mimeType, size, path, thumbnailPath, sourceUrl, label)
             VALUES (:ticketId, :filename, :originalName, :mimeType, :size, :path, :thumbnailPath, :sourceUrl, :label)',
            [
                ':ticketId'      => $data['ticketId'],
                ':filename'      => $data['filename'],
                ':originalName'  => $data['originalName'] ?? null,
                ':mimeType'      => $data['mimeType'],
                ':size'          => $data['size'] ?? 0,
                ':path'          => $data['path'],
                ':thumbnailPath' => $data['thumbnailPath'] ?? null,
                ':sourceUrl'     => $data['sourceUrl'] ?? null,
                ':label'         => $data['label'] ?? null,
            ]
        );
    }

    public function softDelete(int $id): int
    {
        return $this->execute('UPDATE media SET deletedAt = NOW() WHERE id = :id', [':id' => $id]);
    }

    public function countByTicketId(int $ticketId): int
    {
        $row = $this->fetchOne(
            'SELECT COUNT(*) as cnt FROM media WHERE ticketId = :tid AND deletedAt IS NULL',
            [':tid' => $ticketId]
        );
        return (int) ($row['cnt'] ?? 0);
    }
}
