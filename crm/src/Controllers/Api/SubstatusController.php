<?php
declare(strict_types=1);
namespace Controllers\Api;

use Domain\Substatus;
use Repositories\SubstatusRepository;

class SubstatusController extends ApiController
{
    public function __construct(
        private readonly SubstatusRepository $substatuses,
    ) {}

    /** GET /api/substatuses */
    public function index(): void
    {
        $this->requireRole('staff');
        $primaryStatus = $_GET['primaryStatus'] ?? null;
        $list          = $this->substatuses->findAll(
            primaryStatus: in_array($primaryStatus, ['open', 'closed'], true) ? $primaryStatus : null
        );
        $this->jsonResponse(array_map(fn($s) => $this->hydrate($s), $list),
                            meta: ['total' => count($list)]);
    }

    /** POST /api/substatuses */
    public function create(): void
    {
        $this->requireRole('admin');
        $body   = $this->parseJsonBody();
        $errors = $this->validateSubstatusBody($body);
        if (!empty($errors)) { $this->validationError($errors); return; }

        try {
            if (!empty($body['isDefault'])) {
                $this->substatuses->clearDefaults($body['primaryStatus']);
            }

            $sub = new Substatus(
                id:            0,
                label:         trim($body['label']),
                primaryStatus: $body['primaryStatus'],
                isDefault:     (bool) ($body['isDefault'] ?? false),
                active:        $body['active'] ?? true,
                sortOrder:     (int) ($body['sortOrder'] ?? 0),
                createdAt:     '',
                updatedAt:     '',
            );
            $created = $this->substatuses->save($sub);
            $this->jsonResponse($this->hydrate($created), status: 201);
        } catch (\PDOException $e) {
            if (str_contains($e->getMessage(), 'Duplicate entry')) {
                $this->validationError([['field' => 'label', 'code' => 'DUPLICATE_NAME',
                    'message' => 'A substatus with this label and primaryStatus already exists']]);
            } else {
                throw $e;
            }
        }
    }

    /** GET /api/substatuses/{id} */
    public function show(int $id): void
    {
        $this->requireRole('staff');
        $sub = $this->substatuses->findById($id);
        if (!$sub) { $this->notFound('Substatus not found'); return; }
        $this->jsonResponse($this->hydrate($sub));
    }

    /** PUT /api/substatuses/{id} */
    public function update(int $id): void
    {
        $this->requireRole('admin');
        $sub = $this->substatuses->findById($id);
        if (!$sub) { $this->notFound('Substatus not found'); return; }

        $body   = $this->parseJsonBody();
        $errors = $this->validateSubstatusBody($body, isUpdate: true);
        if (!empty($errors)) { $this->validationError($errors); return; }

        try {
            $newPrimary   = $body['primaryStatus'] ?? $sub->primaryStatus;
            $newIsDefault = $body['isDefault'] ?? $sub->isDefault;

            // Clear other defaults for this primaryStatus when setting isDefault = true
            if ($newIsDefault && !$sub->isDefault) {
                $this->substatuses->clearDefaults($newPrimary, excludeId: $id);
            }

            $updated = new Substatus(
                id:            $id,
                label:         trim($body['label'] ?? $sub->label),
                primaryStatus: $newPrimary,
                isDefault:     (bool) $newIsDefault,
                active:        $body['active'] ?? $sub->active,
                sortOrder:     (int) ($body['sortOrder'] ?? $sub->sortOrder),
                createdAt:     $sub->createdAt,
                updatedAt:     '',
            );
            $saved = $this->substatuses->save($updated);
            $this->jsonResponse($this->hydrate($saved));
        } catch (\PDOException $e) {
            if (str_contains($e->getMessage(), 'Duplicate entry')) {
                $this->validationError([['field' => 'label', 'code' => 'DUPLICATE_NAME',
                    'message' => 'A substatus with this label and primaryStatus already exists']]);
            } else {
                throw $e;
            }
        }
    }

    /** DELETE /api/substatuses/{id} — deactivates (soft) */
    public function destroy(int $id): void
    {
        $this->requireRole('admin');
        if (!$this->substatuses->findById($id)) { $this->notFound('Substatus not found'); return; }
        $this->substatuses->delete($id);
        $this->emptyResponse();
    }

    private function hydrate(Substatus $s): array
    {
        return [
            'id'            => $s->id,
            'label'         => $s->label,
            'primaryStatus' => $s->primaryStatus,
            'isDefault'     => (bool) $s->isDefault,
            'active'        => (bool) $s->active,
            'sortOrder'     => $s->sortOrder,
            'createdAt'     => $s->createdAt,
        ];
    }

    private function validateSubstatusBody(array $body, bool $isUpdate = false): array
    {
        $errors = [];
        if (!$isUpdate && empty($body['label'])) {
            $errors[] = ['field' => 'label', 'message' => 'Label is required'];
        }
        if (!$isUpdate && empty($body['primaryStatus'])) {
            $errors[] = ['field' => 'primaryStatus', 'message' => 'primaryStatus is required'];
        }
        if (isset($body['primaryStatus']) && !in_array($body['primaryStatus'], ['open', 'closed'], true)) {
            $errors[] = ['field' => 'primaryStatus',
                         'message' => 'primaryStatus must be open or closed'];
        }
        return $errors;
    }
}
