<?php
declare(strict_types=1);
namespace Middleware;

use Http\Request;
use Http\JsonResponse;

class ErrorHandlerMiddleware
{
    public function handle(Request $request, callable $next): void
    {
        try {
            $next($request);
        } catch (\Throwable $e) {
            // Forward to Graylog if configured
            $this->logToGraylog($e, $request);

            $debug = defined('APP_DEBUG') && APP_DEBUG;
            JsonResponse::error(
                $debug ? $e->getMessage() : 'An internal server error occurred.',
                500,
                'INTERNAL_ERROR',
            );
        }
    }

    private function logToGraylog(\Throwable $e, Request $request): void
    {
        if (!defined('GRAYLOG_HOST') || !GRAYLOG_HOST) {
            return;
        }
        try {
            // Best-effort UDP GELF message — failures silently ignored
            $payload = json_encode([
                'version'      => '1.1',
                'host'         => gethostname(),
                'short_message'=> $e->getMessage(),
                'level'        => 3, // ERROR
                '_exception'   => get_class($e),
                '_file'        => $e->getFile(),
                '_line'        => $e->getLine(),
                '_path'        => $request->getPath(),
                '_method'      => $request->getMethod(),
            ]);
            $sock = @socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
            if ($sock !== false && $payload !== false) {
                @socket_sendto($sock, $payload, strlen($payload), 0,
                    GRAYLOG_HOST, defined('GRAYLOG_PORT') ? (int)GRAYLOG_PORT : 12201);
                @socket_close($sock);
            }
        } catch (\Throwable) {
            // Silently swallow Graylog errors — never let logging break the app
        }
    }
}
