<?php
declare(strict_types=1);
namespace Repositories;

use Domain\Media;

class MediaRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?Media
    {
        $stmt = $this->pdo->prepare('SELECT * FROM media WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Media::fromRow($row) : null;
    }

    /** @return Media[] */
    public function findByTicketId(int $ticketId, bool $includeDeleted = false): array
    {
        $sql = $includeDeleted
            ? 'SELECT * FROM media WHERE ticketId = :ticketId ORDER BY createdAt ASC'
            : 'SELECT * FROM media WHERE ticketId = :ticketId AND deletedAt IS NULL ORDER BY createdAt ASC';
        return $this->fetchAll($sql, ['ticketId' => $ticketId], fn($row) => Media::fromRow($row));
    }

    public function save(object $entity): Media
    {
        /** @var Media $entity */
        $data = [
            'ticketId'      => $entity->ticketId,
            'filename'      => $entity->filename,
            'originalName'  => $entity->originalName,
            'mimeType'      => $entity->mimeType,
            'size'          => $entity->size,
            'path'          => $entity->path,
            'thumbnailPath' => $entity->thumbnailPath,
            'sourceUrl'     => $entity->sourceUrl,
            'label'         => $entity->label,
        ];

        if ($entity->id > 0) {
            $set  = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
            $stmt = $this->pdo->prepare("UPDATE media SET $set WHERE id = :id");
            $data['id'] = $entity->id;
            $stmt->execute($data);
            return $this->findById($entity->id) ?? $entity;
        } else {
            $cols = implode(', ', array_keys($data));
            $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
            $stmt = $this->pdo->prepare("INSERT INTO media ($cols) VALUES ($vals)");
            $stmt->execute($data);
            $newId = $this->lastInsertId();
            return $this->findById($newId) ?? $entity;
        }
    }

    /** Soft-delete */
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("UPDATE media SET deletedAt = NOW() WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
}
