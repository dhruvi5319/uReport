<?php
declare(strict_types=1);
namespace Repositories;

use Domain\ContactMethod;

class ContactMethodRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?ContactMethod
    {
        $stmt = $this->pdo->prepare('SELECT * FROM contactMethods WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? ContactMethod::fromRow($row) : null;
    }

    /** @return ContactMethod[] */
    public function findByPersonId(int $personId): array
    {
        return $this->fetchAll(
            'SELECT * FROM contactMethods WHERE personId = :personId ORDER BY isPrimary DESC, id ASC',
            ['personId' => $personId],
            fn($row) => ContactMethod::fromRow($row),
        );
    }

    /** Returns the isPrimary=1, type='email' record or first email for a person */
    public function findPrimaryEmail(int $personId): ?ContactMethod
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM contactMethods
             WHERE personId = :personId AND type = \'email\'
             ORDER BY isPrimary DESC LIMIT 1'
        );
        $stmt->execute(['personId' => $personId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? ContactMethod::fromRow($row) : null;
    }

    /**
     * If $entity->id > 0 → UPDATE; otherwise → INSERT.
     * Before saving with isPrimary=true, call demotePrimariesForPerson() first.
     */
    public function save(object $entity): ContactMethod
    {
        /** @var ContactMethod $entity */
        $data = [
            'personId'  => $entity->personId,
            'type'      => $entity->type,
            'value'     => $entity->value,
            'phoneType' => $entity->phoneType,
            'isPrimary' => (int) $entity->isPrimary,
            'label'     => $entity->label,
        ];

        if ($entity->id > 0) {
            $set  = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
            $stmt = $this->pdo->prepare("UPDATE contactMethods SET $set WHERE id = :id");
            $data['id'] = $entity->id;
            $stmt->execute($data);
            return $this->findById($entity->id) ?? $entity;
        } else {
            $cols = implode(', ', array_keys($data));
            $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
            $stmt = $this->pdo->prepare("INSERT INTO contactMethods ($cols) VALUES ($vals)");
            $stmt->execute($data);
            $newId = $this->lastInsertId();
            return $this->findById($newId) ?? $entity;
        }
    }

    /** Hard delete — no historical dependency */
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM contactMethods WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }

    /**
     * Demote all existing primary contact methods of a given type for a person.
     * Call before saving a new/updated contact method with isPrimary=true (F03 process).
     */
    public function demotePrimariesForPerson(int $personId, string $type): void
    {
        $stmt = $this->pdo->prepare(
            "UPDATE contactMethods SET isPrimary = 0 WHERE personId = :personId AND type = :type"
        );
        $stmt->execute(['personId' => $personId, 'type' => $type]);
    }

    /**
     * Check email uniqueness across all contactMethods of type 'email'.
     * Returns true if the email is already in use (by a different contact method).
     */
    public function emailExists(string $email, ?int $excludeContactMethodId = null): bool
    {
        $sql    = "SELECT COUNT(*) FROM contactMethods WHERE type = 'email' AND value = :email";
        $params = ['email' => $email];
        if ($excludeContactMethodId !== null) {
            $sql .= " AND id != :excludeId";
            $params['excludeId'] = $excludeContactMethodId;
        }
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn() > 0;
    }
}
