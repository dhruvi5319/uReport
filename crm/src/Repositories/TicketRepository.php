<?php
declare(strict_types=1);
namespace Repositories;

use Domain\Ticket;

class TicketRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?Ticket
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM tickets WHERE id = :id AND deletedAt IS NULL'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Ticket::fromRow($row) : null;
    }

    /** Find including soft-deleted (for admin / audit) */
    public function findByIdIncludeDeleted(int $id): ?Ticket
    {
        $stmt = $this->pdo->prepare('SELECT * FROM tickets WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Ticket::fromRow($row) : null;
    }

    /**
     * Filtered list — used by SearchController (MySQL fallback when Solr unavailable).
     * $filters keys: status, categoryId, departmentId, personId, substatusId,
     *                reporterEmail, dateFrom, dateTo, deletedAt (boolean).
     * Returns ['rows' => Ticket[], 'total' => int].
     */
    public function findByFilters(
        array  $filters = [],
        int    $page    = 1,
        int    $perPage = 25,
        string $order   = 'datetimeOpened DESC',
    ): array {
        $where  = ['t.deletedAt IS NULL'];
        $params = [];

        if (!empty($filters['status'])) {
            $where[]          = 't.status = :status';
            $params['status'] = $filters['status'];
        }
        if (!empty($filters['categoryId'])) {
            $where[]              = 't.categoryId = :categoryId';
            $params['categoryId'] = $filters['categoryId'];
        }
        if (!empty($filters['departmentId'])) {
            $where[]                = 't.departmentId = :departmentId';
            $params['departmentId'] = $filters['departmentId'];
        }
        if (!empty($filters['personId'])) {
            $where[]            = 't.personId = :personId';
            $params['personId'] = $filters['personId'];
        }
        if (!empty($filters['substatusId'])) {
            $where[]               = 't.substatusId = :substatusId';
            $params['substatusId'] = $filters['substatusId'];
        }
        if (!empty($filters['reporterEmail'])) {
            $where[]                 = 't.reporterEmail = :reporterEmail';
            $params['reporterEmail'] = $filters['reporterEmail'];
        }
        if (!empty($filters['dateFrom'])) {
            $where[]            = 't.datetimeOpened >= :dateFrom';
            $params['dateFrom'] = $filters['dateFrom'];
        }
        if (!empty($filters['dateTo'])) {
            $where[]          = 't.datetimeOpened <= :dateTo';
            $params['dateTo'] = $filters['dateTo'];
        }

        $whereClause = $where ? 'WHERE '.implode(' AND ', $where) : '';
        $sql = "SELECT t.* FROM tickets t $whereClause ORDER BY t.$order";

        return $this->paginate($sql, $params, fn($row) => Ticket::fromRow($row), $page, $perPage);
    }

    /**
     * Insert or update a ticket.
     * For INSERT: $ticket->id must be 0 or negative (not set).
     * Returns Ticket with id populated.
     */
    public function save(object $entity): Ticket
    {
        /** @var Ticket $entity */
        $data = [
            'title'              => $entity->title,
            'description'        => $entity->description,
            'status'             => $entity->status,
            'datetimeOpened'     => $entity->datetimeOpened,
            'datetimeClosed'     => $entity->datetimeClosed,
            'categoryId'         => $entity->categoryId,
            'departmentId'       => $entity->departmentId,
            'personId'           => $entity->personId,
            'reporterPersonId'   => $entity->reporterPersonId,
            'reporterName'       => $entity->reporterName,
            'reporterEmail'      => $entity->reporterEmail,
            'reporterPhone'      => $entity->reporterPhone,
            'address'            => $entity->address,
            'lat'                => $entity->lat,
            'lng'                => $entity->lng,
            'substatusId'        => $entity->substatusId,
            'mergedIntoTicketId' => $entity->mergedIntoTicketId,
            'apiClientId'        => $entity->apiClientId,
            'customFields'       => $entity->customFields,
        ];

        if ($entity->id > 0) {
            // UPDATE
            $set  = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
            $stmt = $this->pdo->prepare("UPDATE tickets SET $set WHERE id = :id");
            $data['id'] = $entity->id;
            $stmt->execute($data);
            return $this->findById($entity->id) ?? $entity;
        } else {
            // INSERT
            $cols = implode(', ', array_keys($data));
            $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
            $stmt = $this->pdo->prepare("INSERT INTO tickets ($cols) VALUES ($vals)");
            $stmt->execute($data);
            $newId = $this->lastInsertId();
            return $this->findById($newId) ?? Ticket::fromRow(array_merge($data, ['id' => $newId, 'datetimeUpdated' => date('Y-m-d H:i:s'), 'deletedAt' => null]));
        }
    }

    /** Soft-delete by setting deletedAt = NOW() */
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("UPDATE tickets SET deletedAt = NOW() WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }

    /** For merge: set mergedIntoTicketId and close source ticket */
    public function setMerged(int $sourceId, int $targetId): void
    {
        $stmt = $this->pdo->prepare(
            "UPDATE tickets SET mergedIntoTicketId = :targetId, status = 'closed', datetimeClosed = NOW() WHERE id = :sourceId"
        );
        $stmt->execute(['targetId' => $targetId, 'sourceId' => $sourceId]);
    }

    /**
     * Find valid merge targets for a given source ticket.
     * Valid targets are: open, not merged (mergedIntoTicketId IS NULL), not deleted, not the source itself.
     * Optional: filter by title substring match on $q.
     * Returns ['rows' => Ticket[], 'total' => int].
     */
    public function findMergeCandidates(
        int    $sourceId,
        string $q       = '',
        int    $page    = 1,
        int    $perPage = 25,
    ): array {
        $where  = [
            't.deletedAt IS NULL',
            "t.status = 'open'",
            't.mergedIntoTicketId IS NULL',
            't.id != :sourceId',
        ];
        $params = ['sourceId' => $sourceId];

        if ($q !== '') {
            $where[]     = '(t.title LIKE :q OR t.description LIKE :q)';
            $params['q'] = '%' . $q . '%';
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);
        $sql = "SELECT t.* FROM tickets t $whereClause ORDER BY t.datetimeOpened DESC";

        return $this->paginate($sql, $params, fn($row) => \Domain\Ticket::fromRow($row), $page, $perPage);
    }

    /**
     * Count tickets belonging to a department.
     * Used by DepartmentController to guard deactivation (F02 HAS_ACTIVE_TICKETS check).
     *
     * @param int  $deptId    Department ID
     * @param bool $statusOpen When true, count only tickets with status = 'open'
     */
    public function countByDepartment(int $deptId, bool $statusOpen = false): int
    {
        $sql    = 'SELECT COUNT(*) FROM tickets WHERE departmentId = :deptId AND deletedAt IS NULL';
        $params = ['deptId' => $deptId];
        if ($statusOpen) {
            $sql .= " AND status = 'open'";
        }
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
    }

    /** Find tickets matching IDs (used after Solr returns IDs) */
    public function findByIds(array $ids): array
    {
        if (empty($ids)) { return []; }
        $in   = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $this->pdo->prepare("SELECT * FROM tickets WHERE id IN ($in) AND deletedAt IS NULL");
        $stmt->execute(array_values($ids));
        $rows = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $rows[] = Ticket::fromRow($row);
        }
        return $rows;
    }
}
