<?php
declare(strict_types=1);
namespace Controllers\Auth;

use Http\Request;
use Services\AuthService;
use Repositories\PersonRepository;

class LoginController
{
    public function handle(Request $request): void
    {
        $authService = new AuthService(new PersonRepository());
        $state       = bin2hex(random_bytes(16));
        $redirectUrl = $authService->getAuthorizationUrl($state);

        header('Location: ' . $redirectUrl, true, 302);
        exit;
    }
}
