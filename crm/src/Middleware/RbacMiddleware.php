<?php
declare(strict_types=1);
namespace Middleware;

use Http\Request;
use Http\JsonResponse;

class RbacMiddleware
{
    private const ROLE_WEIGHTS = [
        'anonymous' => 0,
        'public'    => 1,
        'staff'     => 2,
        'admin'     => 3,
    ];

    /**
     * Returns a middleware callable that enforces $minimumRole.
     * Usage: $router->post('/api/tickets', [...], [RbacMiddleware::requireRole('staff')])
     */
    public static function requireRole(string $minimumRole): callable
    {
        return function (Request $request, callable $next) use ($minimumRole): void {
            $callerWeight  = self::ROLE_WEIGHTS[$request->getCallerRole()] ?? 0;
            $requiredWeight = self::ROLE_WEIGHTS[$minimumRole] ?? 0;

            if ($callerWeight < $requiredWeight) {
                if ($request->getCallerRole() === 'anonymous') {
                    JsonResponse::error('Authentication required', 401, 'UNAUTHENTICATED');
                } else {
                    JsonResponse::error('Insufficient permissions', 403, 'FORBIDDEN');
                }
                exit;
            }

            $next($request);
        };
    }

    /**
     * Check whether a caller role satisfies a minimum role requirement (non-middleware use).
     * Used by controllers for inline permission checks (e.g., category posting permission).
     */
    public static function callerHasRole(Request $request, string $minimumRole): bool
    {
        $callerWeight   = self::ROLE_WEIGHTS[$request->getCallerRole()] ?? 0;
        $requiredWeight = self::ROLE_WEIGHTS[$minimumRole] ?? 0;
        return $callerWeight >= $requiredWeight;
    }
}
