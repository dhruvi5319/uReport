<?php
declare(strict_types=1);
namespace Controllers\Auth;

use Http\Request;
use Http\JsonResponse;
use Services\AuthService;
use Repositories\PersonRepository;

class CallbackController
{
    public function handle(Request $request): void
    {
        $code  = $_GET['code']  ?? '';
        $state = $_GET['state'] ?? '';
        $error = $_GET['error'] ?? '';

        if ($error) {
            JsonResponse::error('OIDC provider returned error: ' . htmlspecialchars($error), 401, 'OIDC_ERROR');
            exit;
        }

        if (!$code || !$state) {
            JsonResponse::error('Missing code or state parameter', 400, 'INVALID_CALLBACK');
            exit;
        }

        try {
            $authService = new AuthService(new PersonRepository());
            $person      = $authService->exchangeCode($code, $state);
            $jwt         = $authService->issueJwt($person);

            // Set HttpOnly session cookie per TechArch §5.2
            $ttl     = defined('SESSION_TTL') ? (int) SESSION_TTL : 28800;
            $secure  = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
            setcookie('ureport_session', $jwt, [
                'expires'  => time() + $ttl,
                'path'     => '/',
                'secure'   => $secure,
                'httponly' => true,
                'samesite' => 'Lax',
            ]);

            // Redirect to SPA dashboard
            $redirectTo = defined('APP_URL') ? rtrim(APP_URL, '/') . '/dashboard' : '/dashboard';
            header('Location: ' . $redirectTo, true, 302);
            exit;

        } catch (\Throwable $e) {
            JsonResponse::error('Authentication failed: ' . $e->getMessage(), 401, 'AUTH_FAILED');
            exit;
        }
    }
}
