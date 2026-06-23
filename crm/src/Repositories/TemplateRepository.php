<?php
declare(strict_types=1);
namespace Repositories;

use Domain\Template;

class TemplateRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?Template
    {
        $stmt = $this->pdo->prepare('SELECT * FROM templates WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Template::fromRow($row) : null;
    }

    /** For system template lookup (e.g., 'ticket_created') */
    public function findBySlug(string $slug): ?Template
    {
        $stmt = $this->pdo->prepare('SELECT * FROM templates WHERE slug = :slug AND active = 1 LIMIT 1');
        $stmt->execute(['slug' => $slug]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Template::fromRow($row) : null;
    }

    /** @return Template[] */
    public function findAll(bool $activeOnly = false): array
    {
        $sql = $activeOnly
            ? 'SELECT * FROM templates WHERE active = 1 ORDER BY name ASC'
            : 'SELECT * FROM templates ORDER BY name ASC';
        return $this->fetchAll($sql, [], fn($row) => Template::fromRow($row));
    }

    public function save(object $entity): Template
    {
        /** @var Template $entity */
        $data = [
            'name'    => $entity->name,
            'subject' => $entity->subject,
            'body'    => $entity->body,
            'active'  => (int) $entity->active,
        ];

        if ($entity->id > 0) {
            // Do not overwrite existing slug on update (system templates keep their slug)
            $set  = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
            $stmt = $this->pdo->prepare("UPDATE templates SET $set WHERE id = :id");
            $data['id'] = $entity->id;
            $stmt->execute($data);
            return $this->findById($entity->id) ?? $entity;
        } else {
            // On insert, include slug only if provided
            if ($entity->slug !== null) {
                $data['slug'] = $entity->slug;
            }
            $cols = implode(', ', array_keys($data));
            $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
            $stmt = $this->pdo->prepare("INSERT INTO templates ($cols) VALUES ($vals)");
            $stmt->execute($data);
            $newId = $this->lastInsertId();
            return $this->findById($newId) ?? $entity;
        }
    }

    /** Soft-deactivate */
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("UPDATE templates SET active = 0 WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
}
