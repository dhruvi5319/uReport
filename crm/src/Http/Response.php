<?php
declare(strict_types=1);
namespace Http;

class Response
{
    /**
     * Emit a JSON envelope and exit.
     *
     * @param mixed $data   The payload for the "data" field
     * @param int   $status HTTP status code
     * @param array $meta   Additional meta (pagination, facets, etc.)
     */
    public static function json(mixed $data, int $status = 200, array $meta = []): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'data'   => $data,
            'meta'   => $meta,
            'errors' => [],
        ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        exit;
    }

    /** HTTP 201 Created */
    public static function created(mixed $data): never
    {
        self::json($data, 201);
    }

    /** HTTP 204 No Content */
    public static function noContent(): never
    {
        http_response_code(204);
        header('Content-Type: application/json; charset=utf-8');
        exit;
    }

    /**
     * Emit an error envelope.
     *
     * @param int    $status      HTTP status (400, 401, 403, 404, 409, 422, 500…)
     * @param string $code        Machine-readable error code (e.g. NOT_FOUND)
     * @param string $message     Human-readable message
     * @param array  $fieldErrors Field-level errors for 422: [['field'=>'…','message'=>'…'],…]
     */
    public static function error(int $status, string $code, string $message, array $fieldErrors = []): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');

        $errors = empty($fieldErrors)
            ? [['field' => null, 'message' => $message, 'code' => $code]]
            : array_map(fn($e) => ['field' => $e['field'], 'message' => $e['message'], 'code' => $code], $fieldErrors);

        echo json_encode([
            'data'   => null,
            'meta'   => [],
            'errors' => $errors,
        ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        exit;
    }

    /** 401 Unauthorized */
    public static function unauthorized(string $message = 'Authentication required'): never
    {
        self::error(401, 'UNAUTHORIZED', $message);
    }

    /** 403 Forbidden */
    public static function forbidden(string $message = 'Insufficient permissions'): never
    {
        self::error(403, 'FORBIDDEN', $message);
    }

    /** 404 Not Found */
    public static function notFound(string $message = 'Resource not found'): never
    {
        self::error(404, 'NOT_FOUND', $message);
    }

    /** 422 Unprocessable Entity — field-level validation errors */
    public static function validationError(array $fieldErrors): never
    {
        self::error(422, 'VALIDATION_ERROR', 'Validation failed', $fieldErrors);
    }

    /** 409 Conflict */
    public static function conflict(string $code, string $message): never
    {
        self::error(409, $code, $message);
    }
}
