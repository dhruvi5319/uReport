<?php
declare(strict_types=1);
namespace Controllers\Api;

use Domain\Template;
use Repositories\TemplateRepository;

class TemplateController
{
    public function __construct(
        private TemplateRepository $templateRepo,
    ) {}

    // ── GET /api/templates ───────────────────────────────────────────────────

    public function index(array $query, array $currentUser): array
    {
        $activeOnly = (bool) ($query['active'] ?? true);
        $templates  = $this->templateRepo->findAll($activeOnly);

        return [
            'status' => 200,
            'body'   => [
                'data'   => array_map([$this, 'serialize'], $templates),
                'meta'   => ['total' => count($templates)],
                'errors' => [],
            ],
        ];
    }

    // ── POST /api/templates ──────────────────────────────────────────────────

    public function create(array $body, array $currentUser): array
    {
        $errors = $this->validate($body, isCreate: true);
        if ($errors) {
            return ['status' => 422, 'body' => ['data' => null, 'meta' => [], 'errors' => $errors]];
        }

        $entity = new Template(
            id:        0,
            name:      trim($body['name']),
            subject:   $body['subject'] ?? null,
            body:      $body['body'],
            slug:      null,  // user-created templates never have a slug
            active:    (bool) ($body['active'] ?? true),
            createdAt: date('Y-m-d H:i:s'),
            updatedAt: date('Y-m-d H:i:s'),
        );

        $saved = $this->templateRepo->save($entity);

        return [
            'status' => 201,
            'body'   => ['data' => $this->serialize($saved), 'meta' => [], 'errors' => []],
        ];
    }

    // ── GET /api/templates/{id} ──────────────────────────────────────────────

    public function show(int $id, array $currentUser): array
    {
        $template = $this->templateRepo->findById($id);
        if (!$template) {
            return $this->notFound();
        }

        return [
            'status' => 200,
            'body'   => ['data' => $this->serialize($template), 'meta' => [], 'errors' => []],
        ];
    }

    // ── PUT /api/templates/{id} ──────────────────────────────────────────────

    public function update(int $id, array $body, array $currentUser): array
    {
        $template = $this->templateRepo->findById($id);
        if (!$template) {
            return $this->notFound();
        }

        $updated = new Template(
            id:        $template->id,
            name:      isset($body['name']) ? trim($body['name']) : $template->name,
            subject:   array_key_exists('subject', $body) ? $body['subject'] : $template->subject,
            body:      $body['body'] ?? $template->body,
            slug:      $template->slug,   // slug is immutable
            active:    isset($body['active']) ? (bool) $body['active'] : $template->active,
            createdAt: $template->createdAt,
            updatedAt: date('Y-m-d H:i:s'),
        );

        $errors = $this->validate(['name' => $updated->name, 'body' => $updated->body], isCreate: false);
        if ($errors) {
            return ['status' => 422, 'body' => ['data' => null, 'meta' => [], 'errors' => $errors]];
        }

        $saved = $this->templateRepo->save($updated);

        return [
            'status' => 200,
            'body'   => ['data' => $this->serialize($saved), 'meta' => [], 'errors' => []],
        ];
    }

    // ── DELETE /api/templates/{id} ───────────────────────────────────────────

    public function delete(int $id, array $currentUser): array
    {
        $template = $this->templateRepo->findById($id);
        if (!$template) {
            return $this->notFound();
        }

        // System templates (non-null slug) cannot be deleted (F13)
        if ($template->slug !== null) {
            return [
                'status' => 422,
                'body'   => ['data' => null, 'meta' => [], 'errors' => [
                    ['field' => null, 'message' => 'System templates cannot be deleted', 'code' => 'SYSTEM_TEMPLATE_PROTECTED']
                ]],
            ];
        }

        $this->templateRepo->delete($id);

        return ['status' => 204, 'body' => null];
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function validate(array $body, bool $isCreate): array
    {
        $errors = [];

        if ($isCreate && empty($body['name'])) {
            $errors[] = ['field' => 'name', 'message' => 'name is required', 'code' => 'REQUIRED'];
        }

        if ($isCreate && empty($body['body'])) {
            $errors[] = ['field' => 'body', 'message' => 'body is required', 'code' => 'REQUIRED'];
        }

        if (!empty($body['name']) && mb_strlen($body['name']) > 255) {
            $errors[] = ['field' => 'name', 'message' => 'name must be 255 chars or fewer', 'code' => 'TOO_LONG'];
        }

        return $errors;
    }

    private function serialize(Template $t): array
    {
        return [
            'id'        => $t->id,
            'name'      => $t->name,
            'subject'   => $t->subject,
            'body'      => $t->body,
            'slug'      => $t->slug,
            'active'    => $t->active,
            'createdAt' => $t->createdAt,
            'updatedAt' => $t->updatedAt,
        ];
    }

    private function notFound(): array
    {
        return ['status' => 404, 'body' => ['data' => null, 'meta' => [], 'errors' => [
            ['field' => null, 'message' => 'Template not found', 'code' => 'NOT_FOUND']
        ]]];
    }
}
