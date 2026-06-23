<?php
declare(strict_types=1);
namespace Controllers\Api;

use Http\Request;
use Http\JsonResponse;
use Middleware\RbacMiddleware;

/**
 * Base class for Wave 2b+ API controllers.
 *
 * Provides convenience methods that wrap JsonResponse and RbacMiddleware:
 *   - requireRole()      — abort with 401/403 if caller lacks the role
 *   - getCurrentRole()   — return the caller's role string (or null for anonymous)
 *   - parseJsonBody()    — return decoded JSON request body
 *   - jsonResponse()     — emit { data, meta, errors } envelope
 *   - notFound()         — emit 404
 *   - validationError()  — emit 422 with field errors
 *   - conflictError()    — emit 409
 *   - emptyResponse()    — emit 204 No Content
 *
 * Controllers MUST call setRequest() before using any helper method.
 * The router/kernel injects the request via the route handler closure.
 */
abstract class ApiController
{
    protected ?Request $request = null;

    /**
     * Inject the current HTTP Request. Called by the route handler before
     * dispatching to a controller action method.
     */
    public function setRequest(Request $request): void
    {
        $this->request = $request;
    }

    // ─── Auth helpers ────────────────────────────────────────────────────────

    /**
     * Abort with 401/403 if the caller's role is below $minimumRole.
     * Role hierarchy: anonymous(0) < public(1) < staff(2) < admin(3).
     */
    protected function requireRole(string $minimumRole): void
    {
        $req = $this->getRequest();
        if (!RbacMiddleware::callerHasRole($req, $minimumRole)) {
            if ($req->getCallerRole() === 'anonymous') {
                JsonResponse::error('Authentication required', 401, 'UNAUTHENTICATED');
            } else {
                JsonResponse::error('Insufficient permissions', 403, 'FORBIDDEN');
            }
            exit;
        }
    }

    /**
     * Return the current caller's role string, or null for anonymous callers.
     */
    protected function getCurrentRole(): ?string
    {
        $role = $this->getRequest()->getCallerRole();
        return $role === 'anonymous' ? null : $role;
    }

    // ─── Request helpers ─────────────────────────────────────────────────────

    /**
     * Decode and return the JSON request body as an associative array.
     */
    protected function parseJsonBody(): array
    {
        return $this->getRequest()->all();
    }

    // ─── Response helpers ────────────────────────────────────────────────────

    /**
     * Emit a { data, meta, errors } JSON envelope.
     *
     * @param mixed $data   Payload for the "data" key
     * @param int   $status HTTP status code (default 200)
     * @param array $meta   Optional meta object (e.g. ['total' => 42])
     */
    protected function jsonResponse(mixed $data, int $status = 200, array $meta = []): void
    {
        JsonResponse::success($data, $status, $meta);
    }

    /**
     * Emit a 404 Not Found response.
     */
    protected function notFound(string $message = 'Resource not found'): void
    {
        JsonResponse::error($message, 404, 'NOT_FOUND');
        exit;
    }

    /**
     * Emit a 422 Unprocessable Entity response with field-level errors.
     *
     * @param array $errors Each entry: ['field' => string, 'message' => string, 'code'? => string]
     */
    protected function validationError(array $errors): void
    {
        JsonResponse::error('Validation failed', 422, 'VALIDATION_ERROR', $errors);
        exit;
    }

    /**
     * Emit a 409 Conflict response.
     */
    protected function conflictError(string $code, string $message): void
    {
        JsonResponse::error($message, 409, $code);
        exit;
    }

    /**
     * Emit a 204 No Content response (used after DELETE).
     */
    protected function emptyResponse(): void
    {
        http_response_code(204);
        header('Content-Type: application/json; charset=UTF-8');
        exit;
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    private function getRequest(): Request
    {
        if ($this->request === null) {
            // Fallback: construct a fresh Request from the current HTTP context.
            // This happens when a controller is called without setRequest() (e.g. in tests).
            $this->request = new Request();
        }
        return $this->request;
    }
}
