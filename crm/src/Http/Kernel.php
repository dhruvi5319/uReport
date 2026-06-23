<?php
declare(strict_types=1);
namespace Http;

use Middleware\SecurityHeadersMiddleware;
use Middleware\ErrorHandlerMiddleware;
use Middleware\AuthMiddleware;
use Services\AuthService;
use Repositories\PersonRepository;
use Controllers\Auth\LoginController;
use Controllers\Auth\CallbackController;
use Controllers\Auth\LogoutController;
use Controllers\Auth\MeController;

class Kernel
{
    private Router $router;

    public function __construct()
    {
        $this->router = new Router();
        $this->registerRoutes();
    }

    public function handle(): void
    {
        $request    = new Request();
        $authService = new AuthService(new PersonRepository());

        // Middleware pipeline (outermost → innermost):
        // 1. ErrorHandler  — catches all Throwables
        // 2. SecurityHeaders — sets headers on every response
        // 3. Auth           — extracts + validates JWT, sets caller context
        // 4. Router         — dispatches to controller

        $pipeline = $this->buildPipeline([
            new ErrorHandlerMiddleware(),
            new SecurityHeadersMiddleware(),
            new AuthMiddleware($authService),
        ], fn(Request $req) => $this->router->dispatch($req));

        $pipeline($request);
    }

    /**
     * Register Auth controller routes. API controller routes are registered
     * by their respective Wave 2a/2b/2c/2d plan files via a separate routes
     * bootstrap file included in public/index.php.
     */
    private function registerRoutes(): void
    {
        $this->router->get('/auth/login',    fn(Request $req) => (new LoginController())->handle($req));
        $this->router->get('/auth/callback', fn(Request $req) => (new CallbackController())->handle($req));
        $this->router->post('/auth/logout',  fn(Request $req) => (new LogoutController())->handle($req));
        $this->router->get('/auth/me',       fn(Request $req) => (new MeController())->handle($req));
    }

    /**
     * Compose a middleware stack into a single callable.
     * @param array<object> $middlewares
     */
    private function buildPipeline(array $middlewares, callable $core): callable
    {
        $stack = $core;
        foreach (array_reverse($middlewares) as $middleware) {
            $next  = $stack;
            $stack = fn(Request $req) => $middleware->handle($req, $next);
        }
        return $stack;
    }
}
