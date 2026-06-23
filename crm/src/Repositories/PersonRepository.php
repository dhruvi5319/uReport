<?php
declare(strict_types=1);
namespace Repositories;

use Domain\Person;

class PersonRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?Person
    {
        $stmt = $this->pdo->prepare('SELECT * FROM people WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Person::fromRow($row) : null;
    }

    public function findByOidcSubject(string $sub): ?Person
    {
        $stmt = $this->pdo->prepare('SELECT * FROM people WHERE oidcSubject = :sub LIMIT 1');
        $stmt->execute(['sub' => $sub]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Person::fromRow($row) : null;
    }

    public function findByEmail(string $email): ?Person
    {
        $stmt = $this->pdo->prepare(
            'SELECT p.* FROM people p
             JOIN contactMethods cm ON cm.personId = p.id
             WHERE cm.type = \'email\' AND cm.value = :email LIMIT 1'
        );
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Person::fromRow($row) : null;
    }

    public function findWithFilters(array $filters = [], int $page = 1, int $perPage = 25): array
    {
        $where  = [];
        $params = [];

        if (isset($filters['role'])) {
            $where[]        = 'p.role = :role';
            $params['role'] = $filters['role'];
        }
        if (isset($filters['departmentId'])) {
            $where[]                = 'p.departmentId = :departmentId';
            $params['departmentId'] = $filters['departmentId'];
        }
        if (isset($filters['active'])) {
            $where[]          = 'p.active = :active';
            $params['active'] = (int) $filters['active'];
        }

        $whereClause = $where ? 'WHERE '.implode(' AND ', $where) : '';
        $sql = "SELECT p.* FROM people p $whereClause ORDER BY p.lastName ASC, p.firstName ASC";

        return $this->paginate($sql, $params, fn($row) => Person::fromRow($row), $page, $perPage);
    }

    public function save(object $entity): Person
    {
        /** @var Person $entity */
        $data = [
            'firstName'    => $entity->firstName,
            'lastName'     => $entity->lastName,
            'role'         => $entity->role,
            'departmentId' => $entity->departmentId,
            'active'       => (int) $entity->active,
            'oidcSubject'  => $entity->oidcSubject,
        ];

        if ($entity->id > 0) {
            $set  = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
            $stmt = $this->pdo->prepare("UPDATE people SET $set WHERE id = :id");
            $data['id'] = $entity->id;
            $stmt->execute($data);
            return $this->findById($entity->id) ?? $entity;
        } else {
            $cols = implode(', ', array_keys($data));
            $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
            $stmt = $this->pdo->prepare("INSERT INTO people ($cols) VALUES ($vals)");
            $stmt->execute($data);
            $newId = $this->lastInsertId();
            return $this->findById($newId) ?? $entity;
        }
    }

    /** Soft-deactivate: preserve record for history */
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("UPDATE people SET active = 0 WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
}
