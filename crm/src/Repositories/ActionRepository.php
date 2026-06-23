<?php

declare(strict_types=1);

namespace Repositories;

class ActionRepository extends AbstractRepository
{
    /**
     * Insert an immutable action record. Returns the new action ID.
     * No update() or delete() methods exist — actions are append-only (F6).
     */
    public function insert(array $data): int
    {
        return $this->insertRow(
            'INSERT INTO actions
             (ticketId, type, visibility, actorPersonId, actorClientId, payload)
             VALUES
             (:ticketId, :type, :visibility, :actorPersonId, :actorClientId, :payload)',
            [
                ':ticketId'      => $data['ticketId'],
                ':type'          => $data['type'],
                ':visibility'    => $data['visibility'] ?? 'internal',
                ':actorPersonId' => $data['actorPersonId'] ?? null,
                ':actorClientId' => $data['actorClientId'] ?? null,
                ':payload'       => isset($data['payload'])
                                     ? json_encode($data['payload'], JSON_THROW_ON_ERROR)
                                     : null,
            ]
        );
    }

    public function findByTicketId(int $ticketId, bool $includeInternal = true, int $page = 1, int $perPage = 50): array
    {
        $where  = ['ticketId = :ticketId'];
        $params = [':ticketId' => $ticketId];

        if (!$includeInternal) {
            $where[] = "visibility = 'external'";
        }

        $offset      = ($page - 1) * $perPage;
        $whereClause = 'WHERE ' . implode(' AND ', $where);

        return $this->fetchAll(
            "SELECT * FROM actions {$whereClause} ORDER BY datetimeCreated ASC LIMIT {$perPage} OFFSET {$offset}",
            $params
        );
    }
}
