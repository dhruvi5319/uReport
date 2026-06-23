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
            'SELECT * FROM contactMethods WHERE personId = :personId ORDER BY isPrimary DESC, type ASC',
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
     * INSERT or UPDATE. When isPrimary=true on save, first demotes all
     * other records of the same type for the same personId to isPrimary=0.
     */
    public function save(object $entity): ContactMethod
    {
        /** @var ContactMethod $entity */

        // Demote existing primary methods of same type if this one is primary
        if ($entity->isPrimary) {
            $demoteStmt = $this->pdo->prepare(
                'UPDATE contactMethods SET isPrimary = 0
                 WHERE personId = :personId AND type = :type AND id != :excludeId'
            );
            $demoteStmt->execute([
                'personId'  => $entity->personId,
                'type'      => $entity->type,
                'excludeId' => $entity->id > 0 ? $entity->id : 0,
            ]);
        }

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
}
