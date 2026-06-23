<?php
declare(strict_types=1);
namespace Repositories;

use Domain\Action;

class ActionRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?Action
    {
        $stmt = $this->pdo->prepare('SELECT * FROM actions WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Action::fromRow($row) : null;
    }

    /** @return Action[] */
    public function findByTicketId(int $ticketId): array
    {
        return $this->fetchAll(
            'SELECT * FROM actions WHERE ticketId = :ticketId ORDER BY datetimeCreated ASC',
            ['ticketId' => $ticketId],
            fn($row) => Action::fromRow($row),
        );
    }

    /** Insert a new action; returns the persisted Action with id set. */
    public function insert(Action $action): Action
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO actions (ticketId, type, visibility, actorPersonId, actorClientId, datetimeCreated, payload)
             VALUES (:ticketId, :type, :visibility, :actorPersonId, :actorClientId, :datetimeCreated, :payload)'
        );
        $stmt->execute([
            'ticketId'        => $action->ticketId,
            'type'            => $action->type,
            'visibility'      => $action->visibility,
            'actorPersonId'   => $action->actorPersonId,
            'actorClientId'   => $action->actorClientId,
            'datetimeCreated' => $action->datetimeCreated,
            'payload'         => $action->payload,
        ]);
        return $this->findById($this->lastInsertId()) ?? $action;
    }

    /** Delegates to insert(). $entity MUST be a Domain\Action. */
    public function save(object $entity): Action
    {
        /** @var Action $entity */
        return $this->insert($entity);
    }

    /** Actions are immutable — throws LogicException. */
    public function delete(int $id): void
    {
        throw new \LogicException('Actions are immutable and cannot be deleted.');
    }
}
