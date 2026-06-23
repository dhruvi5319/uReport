<?php
declare(strict_types=1);
namespace Repositories;

use Domain\Bookmark;

class BookmarkRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?Bookmark
    {
        $stmt = $this->pdo->prepare('SELECT * FROM bookmarks WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Bookmark::fromRow($row) : null;
    }

    /** @return Bookmark[] */
    public function findByPersonId(int $personId): array
    {
        return $this->fetchAll(
            'SELECT * FROM bookmarks WHERE personId = :personId ORDER BY name ASC',
            ['personId' => $personId],
            fn($row) => Bookmark::fromRow($row),
        );
    }

    /**
     * INSERT only — no update (delete+create to replace).
     * Returns Bookmark with id set.
     */
    public function save(object $entity): Bookmark
    {
        /** @var Bookmark $entity */
        $data = [
            'personId'    => $entity->personId,
            'name'        => $entity->name,
            'filterState' => $entity->filterState,
        ];

        $cols = implode(', ', array_keys($data));
        $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
        $stmt = $this->pdo->prepare("INSERT INTO bookmarks ($cols) VALUES ($vals)");
        $stmt->execute($data);
        $newId = $this->lastInsertId();
        return $this->findById($newId) ?? $entity;
    }

    /** Hard delete — personal data, no historical reference needed */
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM bookmarks WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
}
