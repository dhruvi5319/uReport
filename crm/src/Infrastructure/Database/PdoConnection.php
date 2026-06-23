<?php

declare(strict_types=1);

namespace Infrastructure\Database;

use PDO;
use PDOException;

/**
 * PDO connection provider.
 *
 * Provides two access patterns:
 *   - get(string $db)/set(string $db, PDO): multi-database support with test injection
 *   - getInstance(): backward-compat alias for get('default')
 *
 * Uses $DATABASES global (legacy config) if set, falls back to DB_* env vars.
 */
class PdoConnection
{
    private static array $instances = [];

    private function __construct() {}

    /**
     * Get PDO connection by database key.
     * Uses $DATABASES global if set; falls back to DB_* env vars for 'default'.
     */
    public static function get(string $db = 'default'): PDO
    {
        if (!isset(self::$instances[$db])) {
            global $DATABASES;

            if (!empty($DATABASES[$db])) {
                $conf = $DATABASES[$db];
                $pdo  = new PDO($conf['dsn'], $conf['user'], $conf['pass']);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                $pdo->exec("SET NAMES utf8mb4");
                self::$instances[$db] = $pdo;
            } elseif ($db === 'default') {
                // Fallback to environment variables
                $host   = getenv('DB_HOST') ?: 'db';
                $port   = getenv('DB_PORT') ?: '3306';
                $dbname = getenv('DB_NAME') ?: 'ureport';
                $user   = getenv('DB_USER') ?: 'ureport';
                $pass   = getenv('DB_PASS') ?: 'ureport';

                $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

                try {
                    self::$instances[$db] = new PDO($dsn, $user, $pass, [
                        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES   => false,
                        PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone = '+00:00'",
                    ]);
                } catch (PDOException $e) {
                    throw new \RuntimeException('Database connection failed: ' . $e->getMessage(), (int) $e->getCode(), $e);
                }
            } else {
                throw new \RuntimeException("No database configuration found for key: $db");
            }
        }

        return self::$instances[$db];
    }

    /** Allow injecting a test PDO (replaces singleton for given key). */
    public static function set(string $db, PDO $pdo): void
    {
        self::$instances[$db] = $pdo;
    }

    /** Backward-compat alias for get('default'). */
    public static function getInstance(): PDO
    {
        return self::get('default');
    }

    public static function beginTransaction(): void
    {
        self::get()->beginTransaction();
    }

    public static function commit(): void
    {
        self::get()->commit();
    }

    public static function rollback(): void
    {
        if (self::get()->inTransaction()) {
            self::get()->rollBack();
        }
    }

    /** Reset singleton for a key (for testing). */
    public static function reset(string $db = 'default'): void
    {
        unset(self::$instances[$db]);
    }
}
