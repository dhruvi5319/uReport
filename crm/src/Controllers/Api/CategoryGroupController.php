<?php
declare(strict_types=1);
namespace Controllers\Api;

use Domain\CategoryGroup;
use Repositories\CategoryGroupRepository;

class CategoryGroupController extends ApiController
{
    public function __construct(
        private readonly CategoryGroupRepository $groups,
    ) {}

    /** GET /api/category-groups — accessible to all (no auth required) */
    public function index(): void
    {
        $list = $this->groups->findAll(activeOnly: false);
        $this->jsonResponse(array_map(fn($g) => $this->hydrate($g), $list),
                            meta: ['total' => count($list)]);
    }

    /** POST /api/category-groups */
    public function create(): void
    {
        $this->requireRole('admin');
        $body = $this->parseJsonBody();

        $errors = [];
        if (empty($body['name'])) {
            $errors[] = ['field' => 'name', 'message' => 'Name is required'];
        } else {
            $existing = $this->groups->findByName(trim($body['name']));
            if ($existing) {
                $errors[] = [
                    'field'   => 'name',
                    'code'    => 'DUPLICATE_NAME',
                    'message' => 'A category group with this name already exists',
                ];
            }
        }
        if (!empty($errors)) { $this->validationError($errors); return; }

        $group = new CategoryGroup(
            id:        0,
            name:      trim($body['name']),
            sortOrder: (int) ($body['sortOrder'] ?? 0),
            active:    $body['active'] ?? true,
        );
        $created = $this->groups->save($group);
        $this->jsonResponse($this->hydrate($created), status: 201);
    }

    /** PUT /api/category-groups/{id} */
    public function update(int $id): void
    {
        $this->requireRole('admin');
        $group = $this->groups->findById($id);
        if (!$group) { $this->notFound('Category group not found'); return; }

        $body   = $this->parseJsonBody();
        $errors = [];
        if (isset($body['name'])) {
            $existing = $this->groups->findByName(trim($body['name']));
            if ($existing && $existing->id !== $id) {
                $errors[] = [
                    'field'   => 'name',
                    'code'    => 'DUPLICATE_NAME',
                    'message' => 'A category group with this name already exists',
                ];
            }
        }
        if (!empty($errors)) { $this->validationError($errors); return; }

        $updated = new CategoryGroup(
            id:        $id,
            name:      trim($body['name'] ?? $group->name),
            sortOrder: (int) ($body['sortOrder'] ?? $group->sortOrder),
            active:    $body['active'] ?? $group->active,
        );
        $this->jsonResponse($this->hydrate($this->groups->save($updated)));
    }

    /** DELETE /api/category-groups/{id} */
    public function destroy(int $id): void
    {
        $this->requireRole('admin');
        if (!$this->groups->findById($id)) { $this->notFound('Category group not found'); return; }
        $this->groups->delete($id);
        $this->emptyResponse();
    }

    private function hydrate(CategoryGroup $g): array
    {
        return [
            'id'        => $g->id,
            'name'      => $g->name,
            'sortOrder' => $g->sortOrder,
            'active'    => (bool) $g->active,
        ];
    }
}
