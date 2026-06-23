<?php
declare(strict_types=1);
namespace Repositories;

use Domain\Substatus;

class SubstatusRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?Substatus
    {
        $stmt = $this->pdo->prepare('SELECT * FROM substatus WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Substatus::fromRow($row) : null;
    }

    /** @return Substatus[] */
    public function findAll(bool $activeOnly = true): array
    {
        $sql = $activeOnly
            ? 'SELECT * FROM substatus WHERE active = 1 ORDER BY sortOrder ASC'
            : 'SELECT * FROM substatus ORDER BY sortOrder ASC';
        return $this->fetchAll($sql, [], fn($row) => Substatus::fromRow($row));
    }

    /** @return Substatus[] */
    public function findByPrimaryStatus(string $status): array
    {
        return $this->fetchAll(
            'SELECT * FROM substatus WHERE primaryStatus = :status AND active = 1 ORDER BY sortOrder ASC',
            ['status' => $status],
            fn($row) => Substatus::fromRow($row),
        );
    }

    public function save(object $entity): Substatus
    {
        /** @var Substatus $entity */
        $data = [
            'label'         => $entity->label,
            'primaryStatus' => $entity->primaryStatus,
            'isDefault'     => (int) $entity->isDefault,
            'active'        => (int) $entity->active,
            'sortOrder'     => $entity->sortOrder,
        ];

        if ($entity->id > 0) {
            $set  = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
            $stmt = $this->pdo->prepare("UPDATE substatus SET $set WHERE id = :id");
            $data['id'] = $entity->id;
            $stmt->execute($data);
            return $this->findById($entity->id) ?? $entity;
        } else {
            $cols = implode(', ', array_keys($data));
            $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
            $stmt = $this->pdo->prepare("INSERT INTO substatus ($cols) VALUES ($vals)");
            $stmt->execute($data);
            $newId = $this->lastInsertId();
            return $this->findById($newId) ?? $entity;
        }
    }

    /** Soft-deactivate (tickets.substatusId ON DELETE SET NULL handles FK cascade) */
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("UPDATE substatus SET active = 0 WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
}
