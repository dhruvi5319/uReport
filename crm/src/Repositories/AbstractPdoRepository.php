<?php
declare(strict_types=1);
namespace Repositories;

use Infrastructure\Database\PdoConnection;

abstract class AbstractPdoRepository
{
    protected \PDO $pdo;

    public function __construct()
    {
        $this->pdo = PdoConnection::get();
    }

    /**
     * Execute a SELECT and return ['rows' => Domain[], 'total' => int].
     * $hydrate is a callable(array $row): object.
     */
    protected function paginate(
        string   $sql,
        array    $params,
        callable $hydrate,
        int      $page    = 1,
        int      $perPage = 25,
    ): array {
        $page    = max(1, $page);
        $perPage = max(1, min(100, $perPage));

        // Count query
        $countSql = "SELECT COUNT(*) AS cnt FROM ($sql) AS _sub";
        $stmt     = $this->pdo->prepare($countSql);
        $stmt->execute($params);
        $total = (int) $stmt->fetchColumn();

        // Data query
        $offset = ($page - 1) * $perPage;
        $stmt   = $this->pdo->prepare("$sql LIMIT :limit OFFSET :offset");
        // Bind named params first, then add pagination
        foreach ($params as $key => $val) {
            $stmt->bindValue(":$key", $val);
        }
        $stmt->bindValue(':limit',  $perPage, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset,  \PDO::PARAM_INT);
        $stmt->execute();

        $rows = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $rows[] = $hydrate($row);
        }

        return ['rows' => $rows, 'total' => $total];
    }

    /**
     * Execute a SELECT with no pagination; returns array of hydrated objects.
     */
    protected function fetchAll(string $sql, array $params, callable $hydrate): array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $rows[] = $hydrate($row);
        }
        return $rows;
    }

    /** Return last inserted auto-increment ID */
    protected function lastInsertId(): int
    {
        return (int) $this->pdo->lastInsertId();
    }

    public function beginTransaction(): void { $this->pdo->beginTransaction(); }
    public function commit(): void           { $this->pdo->commit(); }
    public function rollback(): void         { $this->pdo->rollBack(); }
}
