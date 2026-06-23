<?php
declare(strict_types=1);
namespace Controllers\Api;

use Domain\Category;
use Repositories\CategoryRepository;
use Repositories\DepartmentRepository;
use Repositories\CategoryGroupRepository;
use Repositories\PersonRepository;

class CategoryController extends ApiController
{
    public function __construct(
        private readonly CategoryRepository      $categories,
        private readonly DepartmentRepository    $departments,
        private readonly CategoryGroupRepository $groups,
        private readonly PersonRepository        $people,
    ) {}

    /** GET /api/categories */
    public function index(): void
    {
        $role          = $this->getCurrentRole(); // null for anonymous
        $staffOnly     = !in_array($role, ['staff', 'admin'], true);
        $list          = $this->categories->findAll(activeOnly: false, excludeStaffOnly: $staffOnly);
        $this->jsonResponse(array_map(fn($c) => $this->hydrate($c), $list),
                            meta: ['total' => count($list)]);
    }

    /** POST /api/categories */
    public function create(): void
    {
        $this->requireRole('admin');
        $body   = $this->parseJsonBody();
        $errors = $this->validateCategoryBody($body, existingId: null);
        if (!empty($errors)) { $this->validationError($errors); return; }

        $cat = new Category(
            id:                0,
            name:              trim($body['name']),
            departmentId:      (int) $body['departmentId'],
            groupId:           isset($body['groupId']) ? (int) $body['groupId'] : null,
            slaDays:           isset($body['slaDays']) ? (int) $body['slaDays'] : null,
            displayPermission: $body['displayPermission'],
            postingPermission: $body['postingPermission'],
            defaultAssigneeId: isset($body['defaultAssigneeId']) ? (int) $body['defaultAssigneeId'] : null,
            autoCloseDays:     isset($body['autoCloseDays']) ? (int) $body['autoCloseDays'] : null,
            active:            $body['active'] ?? true,
            fields:            !empty($body['fields'])
                                   ? json_encode($body['fields'], JSON_THROW_ON_ERROR)
                                   : null,
            createdAt:         '',
            updatedAt:         '',
        );

        $created = $this->categories->save($cat);
        $this->jsonResponse($this->hydrate($created), status: 201);
    }

    /** GET /api/categories/{id} */
    public function show(int $id): void
    {
        $cat  = $this->categories->findById($id);
        $role = $this->getCurrentRole();
        if (!$cat
            || ($cat->displayPermission === 'staff' && !in_array($role, ['staff', 'admin'], true))
        ) {
            $this->notFound('Category not found');
            return;
        }
        $this->jsonResponse($this->hydrate($cat));
    }

    /** PUT /api/categories/{id} */
    public function update(int $id): void
    {
        $this->requireRole('admin');
        $cat = $this->categories->findById($id);
        if (!$cat) { $this->notFound('Category not found'); return; }

        $body   = $this->parseJsonBody();
        $errors = $this->validateCategoryBody($body, existingId: $id);
        if (!empty($errors)) { $this->validationError($errors); return; }

        $updated = new Category(
            id:                $id,
            name:              trim($body['name'] ?? $cat->name),
            departmentId:      (int) ($body['departmentId'] ?? $cat->departmentId),
            groupId:           array_key_exists('groupId', $body)
                                   ? (isset($body['groupId']) ? (int) $body['groupId'] : null)
                                   : $cat->groupId,
            slaDays:           array_key_exists('slaDays', $body)
                                   ? (isset($body['slaDays']) ? (int) $body['slaDays'] : null)
                                   : $cat->slaDays,
            displayPermission: $body['displayPermission'] ?? $cat->displayPermission,
            postingPermission: $body['postingPermission'] ?? $cat->postingPermission,
            defaultAssigneeId: array_key_exists('defaultAssigneeId', $body)
                                   ? (isset($body['defaultAssigneeId']) ? (int) $body['defaultAssigneeId'] : null)
                                   : $cat->defaultAssigneeId,
            autoCloseDays:     array_key_exists('autoCloseDays', $body)
                                   ? (isset($body['autoCloseDays']) ? (int) $body['autoCloseDays'] : null)
                                   : $cat->autoCloseDays,
            active:            $body['active'] ?? $cat->active,
            fields:            array_key_exists('fields', $body)
                                   ? (!empty($body['fields']) ? json_encode($body['fields'], JSON_THROW_ON_ERROR) : null)
                                   : $cat->fields,
            createdAt:         $cat->createdAt,
            updatedAt:         '',
        );

        $saved = $this->categories->save($updated);
        $this->jsonResponse($this->hydrate($saved));
    }

    /** DELETE /api/categories/{id} — deactivates (soft) */
    public function destroy(int $id): void
    {
        $this->requireRole('admin');
        if (!$this->categories->findById($id)) { $this->notFound('Category not found'); return; }
        $this->categories->delete($id);  // soft deactivate: sets active = 0
        $this->emptyResponse();
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private function hydrate(Category $c): array
    {
        $fields = [];
        if ($c->fields) {
            $decoded = json_decode($c->fields, true);
            $fields  = is_array($decoded) ? $decoded : [];
        }
        return [
            'id'                => $c->id,
            'name'              => $c->name,
            'departmentId'      => $c->departmentId,
            'groupId'           => $c->groupId,
            'slaDays'           => $c->slaDays,
            'displayPermission' => $c->displayPermission,
            'postingPermission' => $c->postingPermission,
            'defaultAssigneeId' => $c->defaultAssigneeId,
            'autoCloseDays'     => $c->autoCloseDays,
            'active'            => (bool) $c->active,
            'fields'            => $fields,
            'createdAt'         => $c->createdAt,
            'updatedAt'         => $c->updatedAt,
        ];
    }

    private function validateCategoryBody(array $body, ?int $existingId): array
    {
        $errors       = [];
        $validDisplay = ['public', 'staff', 'anonymous'];
        $validPost    = ['staff', 'public', 'anonymous'];

        // name
        if ($existingId === null && empty($body['name'])) {
            $errors[] = ['field' => 'name', 'message' => 'Name is required'];
        }
        if (!empty($body['name'])) {
            $stmt = $this->categories->getRawPdo()->prepare(
                'SELECT id FROM categories WHERE LOWER(name) = LOWER(:name) AND id != :id'
            );
            $stmt->execute(['name' => trim($body['name']), 'id' => $existingId ?? 0]);
            if ($stmt->fetch()) {
                $errors[] = [
                    'field'   => 'name',
                    'code'    => 'DUPLICATE_NAME',
                    'message' => 'A category with this name already exists',
                ];
            }
        }

        // departmentId
        if (isset($body['departmentId'])) {
            $dept = $this->departments->findById((int) $body['departmentId']);
            if (!$dept || !$dept->active) {
                $errors[] = [
                    'field'   => 'departmentId',
                    'code'    => 'INVALID_DEPARTMENT',
                    'message' => 'Department not found or inactive',
                ];
            }
        } elseif ($existingId === null) {
            $errors[] = ['field' => 'departmentId', 'message' => 'Department is required'];
        }

        // groupId
        if (!empty($body['groupId'])) {
            if (!$this->groups->findById((int) $body['groupId'])) {
                $errors[] = [
                    'field'   => 'groupId',
                    'code'    => 'INVALID_GROUP',
                    'message' => 'Category group not found',
                ];
            }
        }

        // permissions
        if (isset($body['displayPermission']) && !in_array($body['displayPermission'], $validDisplay, true)) {
            $errors[] = ['field' => 'displayPermission',
                         'message' => 'displayPermission must be public, staff, or anonymous'];
        }
        if (isset($body['postingPermission']) && !in_array($body['postingPermission'], $validPost, true)) {
            $errors[] = ['field' => 'postingPermission',
                         'message' => 'postingPermission must be staff, public, or anonymous'];
        }
        if ($existingId === null) {
            if (empty($body['displayPermission'])) {
                $errors[] = ['field' => 'displayPermission', 'message' => 'displayPermission is required'];
            }
            if (empty($body['postingPermission'])) {
                $errors[] = ['field' => 'postingPermission', 'message' => 'postingPermission is required'];
            }
        }

        // defaultAssigneeId
        if (!empty($body['defaultAssigneeId'])) {
            $assignee = $this->people->findById((int) $body['defaultAssigneeId']);
            if (!$assignee || !$assignee->active || !in_array($assignee->role, ['staff', 'admin'])) {
                $errors[] = [
                    'field'   => 'defaultAssigneeId',
                    'code'    => 'INVALID_ASSIGNEE',
                    'message' => 'Assignee not found or not active staff',
                ];
            }
        }

        // custom fields
        if (!empty($body['fields'])) {
            $codes = [];
            foreach ($body['fields'] as $i => $field) {
                $prefix = "fields[$i]";
                if (empty($field['code'])) {
                    $errors[] = ['field' => "$prefix.code", 'message' => 'Field code is required'];
                } elseif (!preg_match('/^[a-z0-9_]+$/', $field['code'])) {
                    $errors[] = ['field' => "$prefix.code",
                                 'message' => 'Field code must match /^[a-z0-9_]+$/'];
                } elseif (in_array($field['code'], $codes, true)) {
                    $errors[] = ['field' => "$prefix.code",
                                 'message' => 'Field codes must be unique within a category'];
                } else {
                    $codes[] = $field['code'];
                }
                if (empty($field['label'])) {
                    $errors[] = ['field' => "$prefix.label", 'message' => 'Field label is required'];
                }
                $validTypes = ['text', 'select', 'date', 'checkbox'];
                if (!in_array($field['type'] ?? '', $validTypes, true)) {
                    $errors[] = ['field' => "$prefix.type",
                                 'message' => 'Field type must be text, select, date, or checkbox'];
                }
                if (($field['type'] ?? '') === 'select' && empty($field['options'])) {
                    $errors[] = [
                        'field'   => "$prefix.options",
                        'code'    => 'FIELD_OPTIONS_REQUIRED',
                        'message' => 'Select-type fields require at least one option',
                    ];
                }
            }
        }

        return $errors;
    }
}
