<?php
declare(strict_types=1);
namespace Http;

class Request
{
    public readonly string  $method;
    public readonly string  $path;       // e.g. /api/tickets/42/close
    public readonly array   $segments;   // ['api','tickets','42','close']
    public readonly array   $query;      // $_GET
    private array           $body;       // decoded JSON body
    private ?int            $actorId   = null;
    private ?string         $actorRole = null;

    public function __construct()
    {
        $this->method   = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $rawPath        = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
        $this->path     = '/' . trim($rawPath, '/');
        $this->segments = array_values(array_filter(explode('/', trim($rawPath, '/'))));
        $this->query    = $_GET ?? [];

        $raw        = file_get_contents('php://input');
        $this->body = ($raw !== false && $raw !== '')
            ? (json_decode($raw, true, 512, JSON_THROW_ON_ERROR) ?? [])
            : [];
    }

    /** Returns decoded JSON body field or $default */
    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $default;
    }

    /** Returns full body array */
    public function all(): array { return $this->body; }

    /** Auth context — set by AuthMiddleware before controller dispatch */
    public function setActor(int $personId, string $role): void
    {
        $this->actorId   = $personId;
        $this->actorRole = $role;
    }

    public function actorId(): ?int      { return $this->actorId; }
    public function actorRole(): ?string { return $this->actorRole; }
    public function isAuthenticated(): bool { return $this->actorId !== null; }
    public function hasRole(string ...$roles): bool
    {
        return $this->actorRole !== null && in_array($this->actorRole, $roles, true);
    }

    /** URL segment (0-indexed, after stripping empty). Segment 0='api', 1='tickets', 2=id, etc. */
    public function segment(int $n): ?string { return $this->segments[$n] ?? null; }

    /** Return path segment cast to int, or null */
    public function segmentInt(int $n): ?int
    {
        $v = $this->segments[$n] ?? null;
        return ($v !== null && ctype_digit($v)) ? (int) $v : null;
    }

    // --- Backward-compatible aliases for legacy code ---

    public function getMethod(): string   { return $this->method; }
    public function getPath(): string     { return $this->path; }
    public function getQuery(string $key, mixed $default = null): mixed { return $this->query[$key] ?? $default; }

    public function getHeader(string $name): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return $_SERVER[$key] ?? null;
    }

    public function getCookie(string $name): ?string
    {
        return $_COOKIE[$name] ?? null;
    }

    /** @deprecated Use all() */
    public function getBody(): array { return $this->all(); }

    /** Path params injected by Router (legacy usage) */
    private array $params = [];

    public function setParam(string $key, string $value): void { $this->params[$key] = $value; }
    public function getParam(string $key, mixed $default = null): mixed { return $this->params[$key] ?? $default; }

    /** @deprecated Use setActor() */
    public function setCallerContext(int $id, string $role): void { $this->setActor($id, $role); }
    public function getCallerId(): ?int     { return $this->actorId; }
    public function getCallerRole(): string { return $this->actorRole ?? 'anonymous'; }
}
