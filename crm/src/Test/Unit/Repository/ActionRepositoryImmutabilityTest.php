<?php
declare(strict_types=1);
namespace Test\Unit\Repository;

use Repositories\ActionRepository;
use Infrastructure\Database\PdoConnection;
use PHPUnit\Framework\TestCase;

class ActionRepositoryImmutabilityTest extends TestCase
{
    protected function setUp(): void
    {
        // Inject in-memory SQLite so ActionRepository can instantiate without real DB
        $sqlite = new \PDO('sqlite::memory:');
        $sqlite->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        $sqlite->setAttribute(\PDO::ATTR_DEFAULT_FETCH_MODE, \PDO::FETCH_ASSOC);
        // Create minimal actions table for SQLite
        $sqlite->exec("
            CREATE TABLE IF NOT EXISTS actions (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                ticketId        INTEGER NOT NULL,
                type            TEXT NOT NULL,
                visibility      TEXT NOT NULL,
                actorPersonId   INTEGER,
                actorClientId   INTEGER,
                datetimeCreated TEXT NOT NULL,
                payload         TEXT
            )
        ");
        PdoConnection::set('default', $sqlite);
    }

    public function testDeleteThrowsLogicException(): void
    {
        // We test only the exception; no DB call happens before the throw
        $repo = new ActionRepository();
        $this->expectException(\LogicException::class);
        $repo->delete(1);
    }
}
