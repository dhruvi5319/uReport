<?php
declare(strict_types=1);
namespace Test\Unit\Repository;

use Domain\ContactMethod;
use Repositories\ContactMethodRepository;
use Infrastructure\Database\PdoConnection;
use PHPUnit\Framework\TestCase;

class ContactMethodRepositoryPrimaryTest extends TestCase
{
    private \PDO $sqlite;

    protected function setUp(): void
    {
        // Build a minimal SQLite schema mirroring contactMethods table
        $this->sqlite = new \PDO('sqlite::memory:');
        $this->sqlite->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        $this->sqlite->setAttribute(\PDO::ATTR_DEFAULT_FETCH_MODE, \PDO::FETCH_ASSOC);
        $this->sqlite->exec("
            CREATE TABLE contactMethods (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                personId  INTEGER NOT NULL,
                type      TEXT NOT NULL,
                value     TEXT NOT NULL,
                phoneType TEXT,
                isPrimary INTEGER NOT NULL DEFAULT 0,
                label     TEXT
            )
        ");
        // Seed two existing emails, first is primary
        $this->sqlite->exec("
            INSERT INTO contactMethods (personId, type, value, isPrimary) VALUES
            (1, 'email', 'old@example.com', 1),
            (1, 'email', 'other@example.com', 0)
        ");
        PdoConnection::set('default', $this->sqlite);
    }

    public function testSavingNewPrimaryDemotesExistingPrimary(): void
    {
        $repo = new ContactMethodRepository();

        $newMethod = new ContactMethod(
            id:        0,
            personId:  1,
            type:      'email',
            value:     'new@example.com',
            phoneType: null,
            isPrimary: true,
            label:     null,
        );

        $saved = $repo->save($newMethod);

        // The new one should be primary
        $this->assertTrue($saved->isPrimary);

        // The old primary should be demoted
        $stmt = $this->sqlite->query(
            "SELECT * FROM contactMethods WHERE value = 'old@example.com'"
        );
        $old = $stmt->fetch(\PDO::FETCH_ASSOC);
        $this->assertSame(0, (int) $old['isPrimary'], 'Old primary should be demoted');
    }
}
