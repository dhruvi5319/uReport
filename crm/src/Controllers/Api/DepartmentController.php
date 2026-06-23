<?php
declare(strict_types=1);
namespace Controllers\Api;

use Domain\Department;
use Repositories\DepartmentRepository;
use Repositories\PersonRepository;
use Repositories\TicketRepository;

class DepartmentController extends ApiController
{
    public function __construct(
        private readonly DepartmentRepository $departments,
        private readonly PersonRepository     $people,
        private readonly TicketRepository     $tickets,
    ) {}

    /** GET /api/departments */
    public function index(): void
    {
        $this->requireRole('staff');
        $list = $this->departments->findAll(activeOnly: false);
        $this->jsonResponse($this->hydrateList($list), meta: ['total' => count($list)]);
    }

    /** POST /api/departments */
    public function create(): void
    {
        $this->requireRole('admin');
        $body = $this->parseJsonBody();

        $errors = $this->validateDepartmentBody($body, existingId: null);
        if (!empty($errors)) {
            $this->validationError($errors);
            return;
        }

        $dept = new Department(
            id:                0,
            name:              trim($body['name']),
            defaultAssigneeId: $body['defaultAssigneeId'] ?? null,
            active:            $body['active'] ?? true,
            createdAt:         '',
            updatedAt:         '',
        );

        $created = $this->departments->save($dept);
        $this->jsonResponse($this->hydrate($created), status: 201);
    }

    /** GET /api/departments/{id} */
    public function show(int $id): void
    {
        $this->requireRole('staff');
        $dept = $this->departments->findById($id);
        if (!$dept) { $this->notFound('Department not found'); return; }
        $this->jsonResponse($this->hydrate($dept));
    }

    /** PUT /api/departments/{id} */
    public function update(int $id): void
    {
        $this->requireRole('admin');
        $dept = $this->departments->findById($id);
        if (!$dept) { $this->notFound('Department not found'); return; }

        $body   = $this->parseJsonBody();
        $errors = $this->validateDepartmentBody($body, existingId: $id);
        if (!empty($errors)) {
            $this->validationError($errors);
            return;
        }

        $updated = new Department(
            id:                $id,
            name:              trim($body['name'] ?? $dept->name),
            defaultAssigneeId: array_key_exists('defaultAssigneeId', $body)
                                   ? $body['defaultAssigneeId']
                                   : $dept->defaultAssigneeId,
            active:            $body['active'] ?? $dept->active,
            createdAt:         $dept->createdAt,
            updatedAt:         '',
        );

        $saved = $this->departments->save($updated);
        $this->jsonResponse($this->hydrate($saved));
    }

    /** DELETE /api/departments/{id} — deactivates (soft) */
    public function destroy(int $id): void
    {
        $this->requireRole('admin');
        $dept = $this->departments->findById($id);
        if (!$dept) { $this->notFound('Department not found'); return; }

        // F02: refuse if active open tickets exist (HAS_ACTIVE_TICKETS guard)
        $openCount = $this->tickets->countByDepartment($id, statusOpen: true);
        if ($openCount > 0) {
            $this->conflictError(
                'HAS_ACTIVE_TICKETS',
                "Department has {$openCount} active ticket(s); confirm deactivation separately."
            );
            return;
        }

        $this->departments->delete($id);
        $this->emptyResponse();
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private function hydrate(Department $d): array
    {
        $assignee = null;
        if ($d->defaultAssigneeId) {
            $p = $this->people->findById($d->defaultAssigneeId);
            if ($p) {
                $assignee = ['id' => $p->id, 'name' => $p->fullName()];
            }
        }
        return [
            'id'              => $d->id,
            'name'            => $d->name,
            'defaultAssignee' => $assignee,
            'active'          => (bool) $d->active,
            'createdAt'       => $d->createdAt,
            'updatedAt'       => $d->updatedAt,
        ];
    }

    private function hydrateList(array $departments): array
    {
        return array_map(fn($d) => $this->hydrate($d), $departments);
    }

    private function validateDepartmentBody(array $body, ?int $existingId): array
    {
        $errors = [];

        if (isset($body['name'])) {
            $name = trim($body['name']);
            if ($name === '') {
                $errors[] = ['field' => 'name', 'message' => 'Name is required'];
            } else {
                // Uniqueness check (case-insensitive)
                $stmt = $this->departments->getRawPdo()->prepare(
                    'SELECT id FROM departments WHERE LOWER(name) = LOWER(:name) AND id != :id'
                );
                $stmt->execute(['name' => $name, 'id' => $existingId ?? 0]);
                if ($stmt->fetch()) {
                    $errors[] = [
                        'field'   => 'name',
                        'code'    => 'DUPLICATE_NAME',
                        'message' => 'A department with this name already exists',
                    ];
                }
            }
        } elseif ($existingId === null) {
            // name is required on create
            $errors[] = ['field' => 'name', 'message' => 'Name is required'];
        }

        if (array_key_exists('defaultAssigneeId', $body) && $body['defaultAssigneeId'] !== null) {
            $assignee = $this->people->findById((int) $body['defaultAssigneeId']);
            if (!$assignee || !$assignee->active || !in_array($assignee->role, ['staff', 'admin'])) {
                $errors[] = [
                    'field'   => 'defaultAssigneeId',
                    'code'    => 'INVALID_ASSIGNEE',
                    'message' => 'Assignee not found or not active staff',
                ];
            }
        }

        return $errors;
    }
}
