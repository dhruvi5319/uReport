<?php
declare(strict_types=1);
namespace Middleware;

use Http\Request;

class SecurityHeadersMiddleware
{
    public function handle(Request $request, callable $next): void
    {
        // CORS — check against ALLOWED_ORIGINS config constant
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowed = defined('ALLOWED_ORIGINS') ? ALLOWED_ORIGINS : [];
        if ($origin && (in_array($origin, $allowed, true) || in_array('*', $allowed, true))) {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With');
            header('Access-Control-Max-Age: 86400');
        }

        // Handle CORS preflight — return early
        if ($request->getMethod() === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        // Security headers from TechArch §5.4
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        header('X-Frame-Options: DENY');
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'");
        header("Permissions-Policy: camera=(), microphone=(), geolocation=(self)");

        $next($request);
    }
}
