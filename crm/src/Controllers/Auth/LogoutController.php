<?php
declare(strict_types=1);
namespace Controllers\Auth;

use Http\Request;
use Http\JsonResponse;

class LogoutController
{
    public function handle(Request $request): void
    {
        // Require at least a session (not anonymous) — soft check since AuthMiddleware runs first
        if (!$request->isAuthenticated()) {
            JsonResponse::error('Not authenticated', 401, 'UNAUTHENTICATED');
            exit;
        }

        // Clear session cookie (expire in past)
        setcookie('ureport_session', '', [
            'expires'  => time() - 3600,
            'path'     => '/',
            'secure'   => true,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        // Redirect to OIDC provider end-session endpoint if configured
        if (defined('OIDC_ISSUER')) {
            $endSession = rtrim(OIDC_ISSUER, '/') . '/protocol/openid-connect/logout';
            $postLogout = defined('APP_URL') ? rtrim(APP_URL, '/') . '/' : '/';
            $url = $endSession . '?' . http_build_query([
                'post_logout_redirect_uri' => $postLogout,
                'client_id'               => defined('OIDC_CLIENT_ID') ? OIDC_CLIENT_ID : '',
            ]);
            header('Location: ' . $url, true, 302);
        } else {
            header('Location: /', true, 302);
        }
        exit;
    }
}
