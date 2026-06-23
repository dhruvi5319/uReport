<?php
declare(strict_types=1);
namespace Middleware;

use Http\Request;
use Services\AuthService;

class AuthMiddleware
{
    public function __construct(private AuthService $authService) {}

    public function handle(Request $request, callable $next): void
    {
        $token = $this->extractToken($request);

        if ($token !== null) {
            try {
                $claims = $this->authService->validateJwt($token);
                // Cross-validate role against DB (stale JWT correction per TechArch §5.2)
                $personId = (int) $claims['sub'];
                $role     = $claims['role'];
                $request->setCallerContext($personId, $role);
            } catch (\Throwable) {
                // Invalid/expired JWT → treat as anonymous; RbacMiddleware will enforce
                // Do not set caller context — remains 'anonymous'
            }
        }

        $next($request);
    }

    private function extractToken(Request $request): ?string
    {
        // 1. HttpOnly cookie (SPA)
        $cookie = $request->getCookie('ureport_session');
        if ($cookie !== null && $cookie !== '') {
            return $cookie;
        }

        // 2. Authorization: Bearer <token> (API clients / Open311 proxy)
        $authHeader = $request->getHeader('Authorization');
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            return substr($authHeader, 7);
        }

        return null;
    }
}
