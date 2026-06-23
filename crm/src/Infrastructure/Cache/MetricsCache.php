<?php
declare(strict_types=1);
namespace Infrastructure\Cache;

/**
 * In-memory TTL cache for SLA metrics (FRD F09 Process: Metrics Endpoint).
 *
 * Uses a static PHP array as the backing store, providing per-request in-process caching.
 * This is effective for the 5-minute SLA metrics cache because:
 * - PHP-FPM worker processes handle multiple requests until they are recycled
 * - The TTL check prevents stale data within a single worker's lifetime
 *
 * If REDIS_HOST is configured as an infrastructure constant in a future enhancement,
 * this class can be extended to fall back to Redis for cross-worker caching.
 *
 * Used by: ReportController::metrics() — GET /api/metrics/sla (5-minute TTL)
 */
class MetricsCache
{
    /** @var array<string, array{value: mixed, expiresAt: int}> */
    private static array $store = [];

    /**
     * Retrieve a cached value by key.
     * Returns null if the key does not exist or has expired.
     */
    public function get(string $key): mixed
    {
        if (isset(self::$store[$key]) && self::$store[$key]['expiresAt'] > time()) {
            return self::$store[$key]['value'];
        }
        // Clean up expired entry
        unset(self::$store[$key]);
        return null;
    }

    /**
     * Store a value with a TTL.
     *
     * @param string $key        Cache key
     * @param mixed  $value      Value to cache (must be JSON-serializable for future Redis compat)
     * @param int    $ttlSeconds Time-to-live in seconds (default: 300 = 5 minutes)
     */
    public function set(string $key, mixed $value, int $ttlSeconds = 300): void
    {
        self::$store[$key] = [
            'value'     => $value,
            'expiresAt' => time() + $ttlSeconds,
        ];
    }

    /**
     * Check if a non-expired entry exists for the given key.
     */
    public function has(string $key): bool
    {
        return $this->get($key) !== null;
    }

    /**
     * Remove a cache entry (explicit invalidation).
     */
    public function delete(string $key): void
    {
        unset(self::$store[$key]);
    }

    /**
     * Flush all cache entries (useful for testing).
     */
    public function flush(): void
    {
        self::$store = [];
    }
}
