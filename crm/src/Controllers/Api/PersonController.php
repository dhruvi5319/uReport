<?php
declare(strict_types=1);
namespace Controllers\Api;

use Domain\Person;
use Repositories\PersonRepository;
use Repositories\ContactMethodRepository;

class PersonController
{
    public function __construct(
        private PersonRepository        $personRepo,
        private ContactMethodRepository $cmRepo,
    ) {}

    // ── GET /api/people ──────────────────────────────────────────────────────

    public function index(array $query, array $currentUser): array
    {
        $filters = [];
        if (!empty($query['role']))         $filters['role']         = $query['role'];
        if (isset($query['departmentId']))  $filters['departmentId'] = (int) $query['departmentId'];
        if (isset($query['active']))        $filters['active']       = filter_var($query['active'], FILTER_VALIDATE_BOOLEAN);

        $page    = max(1, (int) ($query['page']    ?? 1));
        $perPage = max(1, min(100, (int) ($query['perPage'] ?? 25)));

        $result = $this->personRepo->findWithFilters($filters, $page, $perPage);

        return [
            'status' => 200,
            'body'   => [
                'data'   => array_map([$this, 'serializePerson'], $result['rows']),
                'meta'   => [
                    'page'    => $page,
                    'perPage' => $perPage,
                    'total'   => $result['total'],
                    'pages'   => (int) ceil($result['total'] / $perPage),
                ],
                'errors' => [],
            ],
        ];
    }

    // ── POST /api/people ─────────────────────────────────────────────────────

    public function create(array $body, array $currentUser): array
    {
        $errors = $this->validatePersonBody($body);
        if ($errors) {
            return ['status' => 422, 'body' => ['data' => null, 'meta' => [], 'errors' => $errors]];
        }

        $entity = new Person(
            id:           0,
            firstName:    trim($body['firstName']),
            lastName:     trim($body['lastName']),
            role:         $body['role'],
            departmentId: isset($body['departmentId']) ? (int) $body['departmentId'] : null,
            active:       (bool) ($body['active'] ?? true),
            oidcSubject:  $body['oidcSubject'] ?? null,
            createdAt:    date('Y-m-d H:i:s'),
            updatedAt:    date('Y-m-d H:i:s'),
        );

        $saved = $this->personRepo->save($entity);

        return [
            'status' => 201,
            'body'   => ['data' => $this->serializePersonWithContacts($saved), 'meta' => [], 'errors' => []],
        ];
    }

    // ── GET /api/people/{id} ─────────────────────────────────────────────────

    public function show(int $id, array $currentUser): array
    {
        $person = $this->personRepo->findById($id);
        if (!$person) {
            return ['status' => 404, 'body' => ['data' => null, 'meta' => [], 'errors' => [['field' => null, 'message' => 'Person not found', 'code' => 'NOT_FOUND']]]];
        }

        return [
            'status' => 200,
            'body'   => ['data' => $this->serializePersonWithContacts($person), 'meta' => [], 'errors' => []],
        ];
    }

    // ── PUT /api/people/{id} ─────────────────────────────────────────────────

    public function update(int $id, array $body, array $currentUser): array
    {
        $person = $this->personRepo->findById($id);
        if (!$person) {
            return ['status' => 404, 'body' => ['data' => null, 'meta' => [], 'errors' => [['field' => null, 'message' => 'Person not found', 'code' => 'NOT_FOUND']]]];
        }

        // Merge updates into existing person
        $updated = new Person(
            id:           $person->id,
            firstName:    isset($body['firstName']) ? trim($body['firstName']) : $person->firstName,
            lastName:     isset($body['lastName'])  ? trim($body['lastName'])  : $person->lastName,
            role:         $body['role']         ?? $person->role,
            departmentId: array_key_exists('departmentId', $body)
                            ? (isset($body['departmentId']) ? (int) $body['departmentId'] : null)
                            : $person->departmentId,
            active:       isset($body['active']) ? (bool) $body['active'] : $person->active,
            oidcSubject:  array_key_exists('oidcSubject', $body) ? $body['oidcSubject'] : $person->oidcSubject,
            createdAt:    $person->createdAt,
            updatedAt:    date('Y-m-d H:i:s'),
        );

        $errors = $this->validatePersonBody([
            'firstName' => $updated->firstName,
            'lastName'  => $updated->lastName,
            'role'      => $updated->role,
        ], isUpdate: true);
        if ($errors) {
            return ['status' => 422, 'body' => ['data' => null, 'meta' => [], 'errors' => $errors]];
        }

        $saved = $this->personRepo->save($updated);

        return [
            'status' => 200,
            'body'   => ['data' => $this->serializePersonWithContacts($saved), 'meta' => [], 'errors' => []],
        ];
    }

    // ── DELETE /api/people/{id} ──────────────────────────────────────────────

    public function deactivate(int $id, array $currentUser): array
    {
        $person = $this->personRepo->findById($id);
        if (!$person) {
            return ['status' => 404, 'body' => ['data' => null, 'meta' => [], 'errors' => [['field' => null, 'message' => 'Person not found', 'code' => 'NOT_FOUND']]]];
        }

        // Preserve record; soft-deactivate via active = 0 (F03: "Cannot delete — only deactivate")
        $this->personRepo->delete($id);

        return ['status' => 204, 'body' => null];
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function validatePersonBody(array $body, bool $isUpdate = false): array
    {
        $errors = [];

        if (!$isUpdate) {
            if (empty($body['firstName']) || !is_string($body['firstName'])) {
                $errors[] = ['field' => 'firstName', 'message' => 'firstName is required', 'code' => 'REQUIRED'];
            }
            if (empty($body['lastName']) || !is_string($body['lastName'])) {
                $errors[] = ['field' => 'lastName', 'message' => 'lastName is required', 'code' => 'REQUIRED'];
            }
            if (!in_array($body['role'] ?? '', ['admin', 'staff', 'public'], true)) {
                $errors[] = ['field' => 'role', 'message' => 'Role must be admin, staff, or public', 'code' => 'INVALID_ROLE'];
            }
        } else {
            if (isset($body['role']) && !in_array($body['role'], ['admin', 'staff', 'public'], true)) {
                $errors[] = ['field' => 'role', 'message' => 'Role must be admin, staff, or public', 'code' => 'INVALID_ROLE'];
            }
        }

        return $errors;
    }

    private function serializePerson(Person $p): array
    {
        return [
            'id'           => $p->id,
            'firstName'    => $p->firstName,
            'lastName'     => $p->lastName,
            'fullName'     => $p->firstName . ' ' . $p->lastName,
            'role'         => $p->role,
            'departmentId' => $p->departmentId,
            'active'       => $p->active,
            'oidcSubject'  => $p->oidcSubject,
            'createdAt'    => $p->createdAt,
            'updatedAt'    => $p->updatedAt,
        ];
    }

    private function serializePersonWithContacts(Person $p): array
    {
        $base                   = $this->serializePerson($p);
        $cms                    = $this->cmRepo->findByPersonId($p->id);
        $base['contactMethods'] = array_map(
            fn($cm) => [
                'id'        => $cm->id,
                'personId'  => $cm->personId,
                'type'      => $cm->type,
                'value'     => $cm->value,
                'phoneType' => $cm->phoneType,
                'isPrimary' => $cm->isPrimary,
                'label'     => $cm->label,
            ],
            $cms
        );
        return $base;
    }
}
