<?php
declare(strict_types=1);
namespace Http;

class JsonResponse
{
    /**
     * Emit a successful response with optional meta.
     * HTTP status 200 (default) or 201 for created resources.
     */
    public static function success(mixed $data, int $status = 200, array $meta = []): void
    {
        self::emit([
            'data'   => $data,
            'meta'   => (object) $meta,
            'errors' => [],
        ], $status);
    }

    /**
     * Emit a paginated list response.
     * Wraps data in envelope with page, perPage, total, pages meta.
     */
    public static function paginated(array $rows, int $total, int $page, int $perPage): void
    {
        self::emit([
            'data'   => $rows,
            'meta'   => [
                'page'    => $page,
                'perPage' => $perPage,
                'total'   => $total,
                'pages'   => (int) ceil($total / max(1, $perPage)),
            ],
            'errors' => [],
        ], 200);
    }

    /**
     * Emit an error response.
     * $fieldErrors: array of ['field' => string, 'message' => string] for 422 responses.
     */
    public static function error(
        string  $message,
        int     $status,
        ?string $code       = null,
        array   $fieldErrors = [],
    ): void {
        $errors = $fieldErrors ?: [['field' => null, 'message' => $message, 'code' => $code]];
        self::emit([
            'data'   => null,
            'meta'   => (object) [],
            'errors' => $errors,
        ], $status);
    }

    private static function emit(array $body, int $status): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
