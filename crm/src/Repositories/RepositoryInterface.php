<?php
declare(strict_types=1);
namespace Repositories;

interface RepositoryInterface
{
    public function findById(int $id): ?object;
    public function save(object $entity): object;
    public function delete(int $id): void;
}
