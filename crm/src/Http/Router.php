<?php
declare(strict_types=1);
namespace Http;

class Router
{
    /** @var array<array{method:string, regex:string, names:string[], handler:callable|array}> */
    private array $routes = [];

    /**
     * Register a route. Pattern uses {paramName} placeholders.
     * E.g.: $router->register('POST', '/api/tickets/{id}/close', $handler)
     *
     * Handler may be a callable or a [ClassName::class, 'method'] array for lazy instantiation.
     */
    public function register(string $method, string $pattern, callable|array $handler): void
    {
        // Convert {name} → named capture group
        $regex = preg_replace('/\{([a-z_]+)\}/', '(?P<$1>[^/]+)', $pattern);
        $regex = '#^' . $regex . '$#';

        // Collect param names
        preg_match_all('/\{([a-z_]+)\}/', $pattern, $m);
        $this->routes[] = [
            'method'  => strtoupper($method),
            'regex'   => $regex,
            'names'   => $m[1],
            'handler' => $handler,
        ];
    }

    /** Convenience wrappers */
    public function get(string $path, callable|array $handler): void    { $this->register('GET', $path, $handler); }
    public function post(string $path, callable|array $handler): void   { $this->register('POST', $path, $handler); }
    public function put(string $path, callable|array $handler): void    { $this->register('PUT', $path, $handler); }
    public function delete(string $path, callable|array $handler): void { $this->register('DELETE', $path, $handler); }

    /** Dispatch current request or emit 404. */
    public function dispatch(Request $request): void
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $request->method) {
                continue;
            }
            if (preg_match($route['regex'], $request->path, $matches)) {
                // Extract named params
                $params = [];
                foreach ($route['names'] as $name) {
                    $params[$name] = $matches[$name] ?? null;
                    // Also inject into request for backward compatibility
                    if ($params[$name] !== null) {
                        $request->setParam($name, $params[$name]);
                    }
                }
                $this->call($route['handler'], $request, $params);
                return;
            }
        }
        Response::notFound('Endpoint not found');
    }

    /**
     * Invoke the handler. Supports:
     *  - callable ($handler)($request, $params)
     *  - [ClassName::class, 'method'] → instantiates class, calls method($request, $params)
     *    (legacy: also supports single-arg method($request) for auth controllers)
     */
    private function call(callable|array $handler, Request $request, array $params): void
    {
        if (is_array($handler) && count($handler) === 2 && is_string($handler[0])) {
            [$class, $method] = $handler;
            $instance = new $class();
            // Support both new-style ($request, $params) and old-style ($request) signatures
            $ref = new \ReflectionMethod($instance, $method);
            if ($ref->getNumberOfParameters() >= 2) {
                $instance->$method($request, $params);
            } else {
                $instance->$method($request);
            }
        } else {
            ($handler)($request, $params);
        }
    }
}
