<?php

declare(strict_types=1);

namespace Repositories;

class TemplateRepository extends AbstractRepository
{
    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM templates WHERE id = :id', [':id' => $id]);
    }

    public function findBySlug(string $slug): ?array
    {
        return $this->fetchOne(
            'SELECT * FROM templates WHERE slug = :slug AND active = 1',
            [':slug' => $slug]
        );
    }

    public function findAll(bool $activeOnly = true): array
    {
        $w = $activeOnly ? 'WHERE active = 1' : '';
        return $this->fetchAll("SELECT * FROM templates {$w} ORDER BY name");
    }

    public function create(array $data): int
    {
        return $this->insertRow(
            'INSERT INTO templates (name, subject, body, active) VALUES (:name, :subject, :body, :active)',
            [
                ':name'    => $data['name'],
                ':subject' => $data['subject'] ?? null,
                ':body'    => $data['body'],
                ':active'  => $data['active'] ?? 1,
            ]
        );
    }

    public function update(int $id, array $data): int
    {
        $sets   = [];
        $params = [':id' => $id];

        foreach (['name', 'subject', 'body', 'active'] as $col) {
            if (array_key_exists($col, $data)) {
                $sets[]            = "{$col} = :{$col}";
                $params[":{$col}"] = $data[$col];
            }
        }

        // System templates (slug IS NOT NULL) cannot have their slug changed
        return empty($sets) ? 0 : $this->execute(
            'UPDATE templates SET ' . implode(', ', $sets) . ' WHERE id = :id',
            $params
        );
    }

    public function isSystemTemplate(int $id): bool
    {
        $row = $this->fetchOne('SELECT slug FROM templates WHERE id = :id', [':id' => $id]);
        return $row !== null && $row['slug'] !== null;
    }
}
