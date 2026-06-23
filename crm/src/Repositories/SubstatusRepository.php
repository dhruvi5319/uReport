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
    public function findAll(bool $activeOnly = true, ?string $primaryStatus = null): array
    {
        $where  = [];
        $params = [];

        if ($activeOnly) {
            $where[] = 'active = 1';
        }
        if ($primaryStatus !== null) {
            $where[]              = 'primaryStatus = :ps';
            $params['ps']         = $primaryStatus;
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $sql = "SELECT * FROM substatus $whereClause ORDER BY sortOrder ASC, label ASC";
        return $this->fetchAll($sql, $params, fn($row) => Substatus::fromRow($row));
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

    /**
     * Clear isDefault flag for all substatuses with the given primaryStatus.
     * Used by SubstatusController to enforce single-default-per-primaryStatus invariant.
     *
     * @param string   $primaryStatus 'open' or 'closed'
     * @param int|null $excludeId     Optionally exclude a specific substatus ID from the clear
     */
    public function clearDefaults(string $primaryStatus, ?int $excludeId = null): void
    {
        if ($excludeId !== null) {
            $stmt = $this->pdo->prepare(
                'UPDATE substatus SET isDefault = 0 WHERE primaryStatus = :ps AND id != :excludeId'
            );
            $stmt->execute(['ps' => $primaryStatus, 'excludeId' => $excludeId]);
        } else {
            $stmt = $this->pdo->prepare(
                'UPDATE substatus SET isDefault = 0 WHERE primaryStatus = :ps'
            );
            $stmt->execute(['ps' => $primaryStatus]);
        }
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

    /**
     * Find the default substatus for a given primary status ('open' or 'closed').
     * Used by TicketService when transitioning ticket states.
     */
    public function findDefault(string $primaryStatus): ?Substatus
    {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM substatus WHERE primaryStatus = :ps AND isDefault = 1 AND active = 1 LIMIT 1"
        );
        $stmt->execute(['ps' => $primaryStatus]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Substatus::fromRow($row) : null;
    }

    /** Soft-deactivate (tickets.substatusId ON DELETE SET NULL handles FK cascade) */
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("UPDATE substatus SET active = 0 WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
}
