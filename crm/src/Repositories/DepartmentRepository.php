<?php
declare(strict_types=1);
namespace Repositories;

use Domain\Department;

class DepartmentRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?Department
    {
        $stmt = $this->pdo->prepare('SELECT * FROM departments WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Department::fromRow($row) : null;
    }

    /** @return Department[] */
    public function findAll(bool $activeOnly = true): array
    {
        $sql = $activeOnly
            ? 'SELECT * FROM departments WHERE active = 1 ORDER BY name ASC'
            : 'SELECT * FROM departments ORDER BY name ASC';
        return $this->fetchAll($sql, [], fn($row) => Department::fromRow($row));
    }

    public function save(object $entity): Department
    {
        /** @var Department $entity */
        $data = [
            'name'              => $entity->name,
            'defaultAssigneeId' => $entity->defaultAssigneeId,
            'active'            => (int) $entity->active,
        ];

        if ($entity->id > 0) {
            $set  = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
            $stmt = $this->pdo->prepare("UPDATE departments SET $set WHERE id = :id");
            $data['id'] = $entity->id;
            $stmt->execute($data);
        } else {
            $cols = implode(', ', array_keys($data));
            $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
            $stmt = $this->pdo->prepare("INSERT INTO departments ($cols) VALUES ($vals)");
            $stmt->execute($data);
            $entity = $this->findById($this->lastInsertId()) ?? $entity;
        }
        return $this->findById($entity->id) ?? $entity;
    }

    /** Soft-deactivate */
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("UPDATE departments SET active = 0 WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
}
