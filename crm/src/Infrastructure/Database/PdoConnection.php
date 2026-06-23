<?php
declare(strict_types=1);
namespace Infrastructure\Database;

class PdoConnection
{
    private static array $instances = [];

    public static function get(string $db = 'default'): \PDO
    {
        global $DATABASES;

        if (!isset(self::$instances[$db]) && !empty($DATABASES[$db])) {
            $conf = $DATABASES[$db];
            $pdo  = new \PDO($conf['dsn'], $conf['user'], $conf['pass']);
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
            $pdo->setAttribute(\PDO::ATTR_DEFAULT_FETCH_MODE, \PDO::FETCH_ASSOC);
            $pdo->exec("SET NAMES utf8mb4");
            self::$instances[$db] = $pdo;
        }
        return self::$instances[$db];
    }

    /** Allow injecting a test PDO (replaces singleton) */
    public static function set(string $db, \PDO $pdo): void
    {
        self::$instances[$db] = $pdo;
    }
}
