<?php
declare(strict_types=1);
namespace Controllers\Api;

use Repositories\BookmarkRepository;

class BookmarkController
{
    /** Maximum bookmarks allowed per user (F12). */
    private const MAX_BOOKMARKS = 50;

    public function __construct(
        private readonly BookmarkRepository $bookmarkRepo,
    ) {}

    /**
     * GET /api/bookmarks
     * Returns all bookmarks for the authenticated user.
     * $personId comes from the JWT session (set by AuthMiddleware before dispatch).
     */
    public function index(int $personId): void
    {
        $bookmarks = $this->bookmarkRepo->findByPersonId($personId);

        $data = array_map(fn($b) => $this->bookmarkToArray($b), $bookmarks);

        http_response_code(200);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'data'   => $data,
            'meta'   => ['total' => count($data)],
            'errors' => [],
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }

    /**
     * POST /api/bookmarks
     * Create a new bookmark scoped to authenticated user.
     * Body: {name: string, filterState: object}
     */
    public function create(array $body, int $personId): void
    {
        // Validate required fields
        $errors = [];
        if (empty($body['name']) || !is_string($body['name'])) {
            $errors[] = ['field' => 'name', 'message' => 'name is required'];
        } elseif (strlen($body['name']) > 100) {
            $errors[] = ['field' => 'name', 'message' => 'name must be 100 characters or fewer'];
        }
        if (empty($body['filterState']) || !is_array($body['filterState'])) {
            $errors[] = ['field' => 'filterState', 'message' => 'filterState is required and must be an object'];
        }

        if (!empty($errors)) {
            http_response_code(422);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['data' => null, 'meta' => [], 'errors' => $errors], JSON_THROW_ON_ERROR);
            return;
        }

        // Enforce 50-bookmark limit per user (F12)
        $existing = $this->bookmarkRepo->findByPersonId($personId);
        if (count($existing) >= self::MAX_BOOKMARKS) {
            http_response_code(409);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'data'   => null,
                'meta'   => [],
                'errors' => [['field' => null, 'message' => 'Bookmark limit reached (max ' . self::MAX_BOOKMARKS . ')', 'code' => 'BOOKMARK_LIMIT']],
            ], JSON_THROW_ON_ERROR);
            return;
        }

        // Check name uniqueness per user (DB has UNIQUE KEY uq_bookmark_person_name(personId, name))
        foreach ($existing as $bm) {
            if ($bm->name === $body['name']) {
                http_response_code(422);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode([
                    'data'   => null,
                    'meta'   => [],
                    'errors' => [['field' => 'name', 'message' => 'A bookmark with this name already exists', 'code' => 'DUPLICATE_NAME']],
                ], JSON_THROW_ON_ERROR);
                return;
            }
        }

        $filterStateJson = json_encode($body['filterState'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);

        $bookmark = $this->bookmarkRepo->create([
            'personId'    => $personId,
            'name'        => $body['name'],
            'filterState' => $filterStateJson,
        ]);

        http_response_code(201);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'data'   => $this->bookmarkToArray($bookmark),
            'meta'   => [],
            'errors' => [],
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }

    /**
     * GET /api/bookmarks/{id}
     * Returns a single bookmark for the authenticated user.
     */
    public function show(int $id, int $personId): void
    {
        $bookmark = $this->bookmarkRepo->findById($id);

        if ($bookmark === null) {
            http_response_code(404);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'data'   => null,
                'meta'   => [],
                'errors' => [['field' => null, 'message' => 'Bookmark not found', 'code' => 'NOT_FOUND']],
            ], JSON_THROW_ON_ERROR);
            return;
        }

        // Enforce ownership — bookmarks are user-scoped (F12)
        if ($bookmark->personId !== $personId) {
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'data'   => null,
                'meta'   => [],
                'errors' => [['field' => null, 'message' => 'Forbidden', 'code' => 'FORBIDDEN']],
            ], JSON_THROW_ON_ERROR);
            return;
        }

        http_response_code(200);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'data'   => $this->bookmarkToArray($bookmark),
            'meta'   => [],
            'errors' => [],
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }

    /**
     * DELETE /api/bookmarks/{id}
     * Deletes a bookmark owned by the authenticated user. Returns 204.
     */
    public function delete(int $id, int $personId): void
    {
        $bookmark = $this->bookmarkRepo->findById($id);

        if ($bookmark === null) {
            http_response_code(404);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'data'   => null,
                'meta'   => [],
                'errors' => [['field' => null, 'message' => 'Bookmark not found', 'code' => 'NOT_FOUND']],
            ], JSON_THROW_ON_ERROR);
            return;
        }

        // Enforce ownership — only owner can delete their bookmark (F12)
        if ($bookmark->personId !== $personId) {
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'data'   => null,
                'meta'   => [],
                'errors' => [['field' => null, 'message' => 'Forbidden', 'code' => 'FORBIDDEN']],
            ], JSON_THROW_ON_ERROR);
            return;
        }

        $this->bookmarkRepo->delete($id);

        http_response_code(204);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function bookmarkToArray(\Domain\Bookmark $bookmark): array
    {
        return [
            'id'          => $bookmark->id,
            'personId'    => $bookmark->personId,
            'name'        => $bookmark->name,
            'filterState' => json_decode($bookmark->filterState, true, 512, JSON_THROW_ON_ERROR),
            'createdAt'   => $bookmark->createdAt,
        ];
    }
}
