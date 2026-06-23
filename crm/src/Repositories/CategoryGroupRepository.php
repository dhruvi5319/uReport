<?php
declare(strict_types=1);
namespace Repositories;

use Domain\CategoryGroup;

class CategoryGroupRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?CategoryGroup
    {
        $stmt = $this->pdo->prepare('SELECT * FROM categoryGroups WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? CategoryGroup::fromRow($row) : null;
    }

    /** @return CategoryGroup[] */
    public function findAll(bool $activeOnly = false): array
    {
        $sql = $activeOnly
            ? 'SELECT * FROM categoryGroups WHERE active = 1 ORDER BY sortOrder ASC, name ASC'
            : 'SELECT * FROM categoryGroups ORDER BY sortOrder ASC, name ASC';
        return $this->fetchAll($sql, [], fn($row) => CategoryGroup::fromRow($row));
    }

    public function findByName(string $name): ?CategoryGroup
    {
        $stmt = $this->pdo->prepare('SELECT * FROM categoryGroups WHERE name = :name LIMIT 1');
        $stmt->execute(['name' => $name]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? CategoryGroup::fromRow($row) : null;
    }

    public function save(object $entity): CategoryGroup
    {
        /** @var CategoryGroup $entity */
        $data = [
            'name'      => $entity->name,
            'sortOrder' => $entity->sortOrder,
            'active'    => (int) $entity->active,
        ];

        if ($entity->id > 0) {
            $set  = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
            $stmt = $this->pdo->prepare("UPDATE categoryGroups SET $set WHERE id = :id");
            $data['id'] = $entity->id;
            $stmt->execute($data);
            return $this->findById($entity->id) ?? $entity;
        } else {
            $cols = implode(', ', array_keys($data));
            $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
            $stmt = $this->pdo->prepare("INSERT INTO categoryGroups ($cols) VALUES ($vals)");
            $stmt->execute($data);
            return $this->findById((int) $this->pdo->lastInsertId()) ?? $entity;
        }
    }

    /**
     * Hard delete — only safe when no categories reference this group.
     * The caller (CategoryGroupController) is responsible for checking.
     */
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM categoryGroups WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }

    /**
     * Expose the raw PDO connection for ad-hoc uniqueness queries in controllers.
     */
    public function getRawPdo(): \PDO
    {
        return $this->pdo;
    }
}
