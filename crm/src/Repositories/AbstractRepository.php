<?php

declare(strict_types=1);

namespace Repositories;

use Infrastructure\Database\PdoConnection;
use PDO;

abstract class AbstractRepository
{
    protected PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? PdoConnection::getInstance();
    }

    /** Execute a SELECT and return all rows. */
    protected function fetchAll(string $sql, array $params = []): array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /** Execute a SELECT and return a single row or null. */
    protected function fetchOne(string $sql, array $params = []): ?array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        return $row !== false ? $row : null;
    }

    /** Execute a mutating statement (INSERT/UPDATE/DELETE). Returns affected row count. */
    protected function execute(string $sql, array $params = []): int
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }

    /** Execute INSERT and return the last insert ID. */
    protected function insertRow(string $sql, array $params = []): int
    {
        $this->execute($sql, $params);
        return (int) $this->pdo->lastInsertId();
    }

    /** Decode a JSON column value; returns null if null/empty. */
    protected function decodeJson(?string $json): mixed
    {
        if ($json === null || $json === '') {
            return null;
        }
        return json_decode($json, true, 512, JSON_THROW_ON_ERROR);
    }
}
