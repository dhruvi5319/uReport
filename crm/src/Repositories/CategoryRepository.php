<?php
declare(strict_types=1);
namespace Repositories;

use Domain\Category;

class CategoryRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?Category
    {
        $stmt = $this->pdo->prepare('SELECT * FROM categories WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Category::fromRow($row) : null;
    }

    /** @return Category[] */
    public function findAll(bool $activeOnly = false): array
    {
        $sql = $activeOnly
            ? 'SELECT * FROM categories WHERE active = 1 ORDER BY name ASC'
            : 'SELECT * FROM categories ORDER BY name ASC';
        return $this->fetchAll($sql, [], fn($row) => Category::fromRow($row));
    }

    /** @return Category[] filtered by departmentId */
    public function findByDepartment(int $departmentId): array
    {
        return $this->fetchAll(
            'SELECT * FROM categories WHERE departmentId = :deptId AND active = 1 ORDER BY name ASC',
            ['deptId' => $departmentId],
            fn($row) => Category::fromRow($row),
        );
    }

    public function save(object $entity): Category
    {
        /** @var Category $entity */
        $data = [
            'name'              => $entity->name,
            'departmentId'      => $entity->departmentId,
            'groupId'           => $entity->groupId,
            'slaDays'           => $entity->slaDays,
            'displayPermission' => $entity->displayPermission,
            'postingPermission' => $entity->postingPermission,
            'defaultAssigneeId' => $entity->defaultAssigneeId,
            'autoCloseDays'     => $entity->autoCloseDays,
            'active'            => (int) $entity->active,
            'fields'            => $entity->fields,
        ];

        if ($entity->id > 0) {
            $set  = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
            $stmt = $this->pdo->prepare("UPDATE categories SET $set WHERE id = :id");
            $data['id'] = $entity->id;
            $stmt->execute($data);
        } else {
            $cols = implode(', ', array_keys($data));
            $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
            $stmt = $this->pdo->prepare("INSERT INTO categories ($cols) VALUES ($vals)");
            $stmt->execute($data);
            $entity = $this->findById($this->lastInsertId()) ?? $entity;
        }
        return $this->findById($entity->id) ?? $entity;
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("UPDATE categories SET active = 0 WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
}
