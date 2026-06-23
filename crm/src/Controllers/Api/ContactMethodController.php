<?php
declare(strict_types=1);
namespace Controllers\Api;

use Domain\ContactMethod;
use Repositories\PersonRepository;
use Repositories\ContactMethodRepository;

class ContactMethodController
{
    public function __construct(
        private PersonRepository        $personRepo,
        private ContactMethodRepository $cmRepo,
    ) {}

    // ── GET /api/people/{id}/contact-methods ─────────────────────────────────

    public function index(int $personId, array $currentUser): array
    {
        if (!$this->personRepo->findById($personId)) {
            return $this->notFound('Person not found');
        }

        $cms = $this->cmRepo->findByPersonId($personId);
        return [
            'status' => 200,
            'body'   => ['data' => array_map([$this, 'serialize'], $cms), 'meta' => [], 'errors' => []],
        ];
    }

    // ── POST /api/people/{id}/contact-methods ────────────────────────────────

    public function create(int $personId, array $body, array $currentUser): array
    {
        if (!$this->personRepo->findById($personId)) {
            return $this->notFound('Person not found');
        }

        $errors = $this->validate($body);
        if ($errors) {
            return ['status' => 422, 'body' => ['data' => null, 'meta' => [], 'errors' => $errors]];
        }

        // Uniqueness check for email type (F03 validation)
        if (($body['type'] ?? '') === 'email') {
            if ($this->cmRepo->emailExists($body['value'])) {
                return [
                    'status' => 422,
                    'body'   => ['data' => null, 'meta' => [], 'errors' => [
                        ['field' => 'value', 'message' => 'This email address is already registered', 'code' => 'DUPLICATE_EMAIL']
                    ]],
                ];
            }
        }

        // Demote existing primaries if this one claims primary (F03 process step 3)
        $isPrimary = (bool) ($body['isPrimary'] ?? false);
        if ($isPrimary) {
            $this->cmRepo->demotePrimariesForPerson($personId, $body['type']);
        }

        $entity = new ContactMethod(
            id:        0,
            personId:  $personId,
            type:      $body['type'],
            value:     trim($body['value']),
            phoneType: $body['phoneType'] ?? null,
            isPrimary: $isPrimary,
            label:     $body['label'] ?? null,
        );

        $saved = $this->cmRepo->save($entity);

        return [
            'status' => 201,
            'body'   => ['data' => $this->serialize($saved), 'meta' => [], 'errors' => []],
        ];
    }

    // ── PUT /api/people/{id}/contact-methods/{cmId} ──────────────────────────

    public function update(int $personId, int $cmId, array $body, array $currentUser): array
    {
        if (!$this->personRepo->findById($personId)) {
            return $this->notFound('Person not found');
        }

        $cm = $this->cmRepo->findById($cmId);
        if (!$cm || $cm->personId !== $personId) {
            return $this->notFound('Contact method not found');
        }

        // Email uniqueness check (exclude self)
        if (($body['value'] ?? $cm->value) !== $cm->value && $cm->type === 'email') {
            if ($this->cmRepo->emailExists($body['value'], $cmId)) {
                return [
                    'status' => 422,
                    'body'   => ['data' => null, 'meta' => [], 'errors' => [
                        ['field' => 'value', 'message' => 'This email address is already registered', 'code' => 'DUPLICATE_EMAIL']
                    ]],
                ];
            }
        }

        $newIsPrimary = isset($body['isPrimary']) ? (bool) $body['isPrimary'] : $cm->isPrimary;
        if ($newIsPrimary && !$cm->isPrimary) {
            $this->cmRepo->demotePrimariesForPerson($personId, $cm->type);
        }

        $updated = new ContactMethod(
            id:        $cm->id,
            personId:  $cm->personId,
            type:      $cm->type,  // type is immutable after creation
            value:     isset($body['value']) ? trim($body['value']) : $cm->value,
            phoneType: $body['phoneType'] ?? $cm->phoneType,
            isPrimary: $newIsPrimary,
            label:     array_key_exists('label', $body) ? $body['label'] : $cm->label,
        );

        $saved = $this->cmRepo->save($updated);

        return [
            'status' => 200,
            'body'   => ['data' => $this->serialize($saved), 'meta' => [], 'errors' => []],
        ];
    }

    // ── DELETE /api/people/{id}/contact-methods/{cmId} ───────────────────────

    public function remove(int $personId, int $cmId, array $currentUser): array
    {
        if (!$this->personRepo->findById($personId)) {
            return $this->notFound('Person not found');
        }

        $cm = $this->cmRepo->findById($cmId);
        if (!$cm || $cm->personId !== $personId) {
            return $this->notFound('Contact method not found');
        }

        $this->cmRepo->delete($cmId);

        return ['status' => 204, 'body' => null];
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function validate(array $body): array
    {
        $errors = [];
        $type   = $body['type'] ?? '';

        if (!in_array($type, ['email', 'phone', 'address'], true)) {
            $errors[] = ['field' => 'type', 'message' => 'type must be email, phone, or address', 'code' => 'INVALID_TYPE'];
        }

        if (empty($body['value'])) {
            $errors[] = ['field' => 'value', 'message' => 'value is required', 'code' => 'REQUIRED'];
        }

        if ($type === 'email' && !empty($body['value']) && !filter_var($body['value'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = ['field' => 'value', 'message' => 'Email address is not valid', 'code' => 'INVALID_EMAIL'];
        }

        if ($type === 'phone' && isset($body['phoneType'])
            && !in_array($body['phoneType'], ['mobile', 'office', 'home'], true)) {
            $errors[] = ['field' => 'phoneType', 'message' => 'phoneType must be mobile, office, or home', 'code' => 'INVALID_PHONE_TYPE'];
        }

        return $errors;
    }

    private function serialize(ContactMethod $cm): array
    {
        return [
            'id'        => $cm->id,
            'personId'  => $cm->personId,
            'type'      => $cm->type,
            'value'     => $cm->value,
            'phoneType' => $cm->phoneType,
            'isPrimary' => $cm->isPrimary,
            'label'     => $cm->label,
        ];
    }

    private function notFound(string $message): array
    {
        return ['status' => 404, 'body' => ['data' => null, 'meta' => [], 'errors' => [['field' => null, 'message' => $message, 'code' => 'NOT_FOUND']]]];
    }
}
