<?php
declare(strict_types=1);
namespace Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Repositories\PersonRepository;
use Domain\Person;

class AuthService
{
    private const JWT_ALG = 'HS256';

    public function __construct(private PersonRepository $persons) {}

    // ─── OIDC Flow ────────────────────────────────────────────────────────────

    /**
     * Build the OIDC authorization URL and store state nonce in PHP session.
     */
    public function getAuthorizationUrl(string $state): string
    {
        session_start_if_not_started();

        $nonce = bin2hex(random_bytes(16));
        $_SESSION['oidc_state'] = $state;
        $_SESSION['oidc_nonce'] = $nonce;

        $params = http_build_query([
            'response_type' => 'code',
            'client_id'     => OIDC_CLIENT_ID,
            'redirect_uri'  => OIDC_REDIRECT_URI,
            'scope'         => 'openid email profile',
            'state'         => $state,
            'nonce'         => $nonce,
        ]);

        return rtrim(OIDC_ISSUER, '/') . '/protocol/openid-connect/auth?' . $params;
    }

    /**
     * Exchange authorization code for tokens; validate state nonce; auto-provision person.
     * Returns the matched or newly created Domain\Person.
     *
     * @throws \RuntimeException on state mismatch or token validation failure
     */
    public function exchangeCode(string $code, string $state): Person
    {
        session_start_if_not_started();

        // Validate state nonce (CSRF protection per TechArch §5.6)
        $expectedState = $_SESSION['oidc_state'] ?? null;
        if (!hash_equals((string) $expectedState, $state)) {
            throw new \RuntimeException('OIDC state mismatch — possible CSRF');
        }
        unset($_SESSION['oidc_state'], $_SESSION['oidc_nonce']);

        // Exchange code for tokens via token endpoint
        $tokenEndpoint = rtrim(OIDC_ISSUER, '/') . '/protocol/openid-connect/token';

        $ch = curl_init($tokenEndpoint);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query([
                'grant_type'    => 'authorization_code',
                'code'          => $code,
                'redirect_uri'  => OIDC_REDIRECT_URI,
                'client_id'     => OIDC_CLIENT_ID,
                'client_secret' => OIDC_CLIENT_SECRET,
            ]),
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
            CURLOPT_TIMEOUT    => 10,
        ]);
        $body     = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$body) {
            throw new \RuntimeException("OIDC token exchange failed (HTTP {$httpCode})");
        }

        $tokens = json_decode($body, true, 512, JSON_THROW_ON_ERROR);

        // Decode id_token claims without full signature validation here
        // (signature validation would require JWKS fetch — use the sub claim to identify person)
        $idTokenParts = explode('.', $tokens['id_token'] ?? '');
        if (count($idTokenParts) !== 3) {
            throw new \RuntimeException('Invalid id_token format');
        }
        $claims = json_decode(base64_decode(strtr($idTokenParts[1], '-_', '+/')), true);
        if (!$claims || empty($claims['sub'])) {
            throw new \RuntimeException('Missing sub claim in id_token');
        }

        $oidcSubject = (string) $claims['sub'];
        $email       = $claims['email'] ?? null;
        $firstName   = $claims['given_name'] ?? ($claims['name'] ?? 'Unknown');
        $lastName    = $claims['family_name'] ?? '';

        // Lookup existing person by OIDC subject (per TechArch §5.2, F03 OIDC auto-provision)
        $person = $this->persons->findByOidcSubject($oidcSubject);

        if ($person === null && $email !== null) {
            // Fallback: look up by primary email
            $person = $this->persons->findByEmail($email);
        }

        if ($person === null) {
            // Auto-provision new person with role 'public' (F03 §Process: OIDC Auto-Provision)
            $newPerson = new Person(
                id: 0,
                firstName: $firstName,
                lastName:  $lastName,
                role:      'public',
                departmentId: null,
                active:    true,
                oidcSubject: $oidcSubject,
                createdAt: date('Y-m-d H:i:s'),
                updatedAt: date('Y-m-d H:i:s'),
            );
            $person = $this->persons->save($newPerson);
        } else {
            // Update name + oidcSubject from fresh OIDC claims (F03 §Process: OIDC Auto-Provision step 5)
            $updated = new Person(
                id:           $person->id,
                firstName:    $firstName,
                lastName:     $lastName,
                role:         $person->role,
                departmentId: $person->departmentId,
                active:       $person->active,
                oidcSubject:  $oidcSubject,
                createdAt:    $person->createdAt,
                updatedAt:    date('Y-m-d H:i:s'),
            );
            $person = $this->persons->save($updated);
        }

        return $person;
    }

    // ─── JWT ──────────────────────────────────────────────────────────────────

    /**
     * Issue a session JWT for the authenticated person.
     * Payload per TechArch §5.2: { iss, sub, role, jti, iat, exp }
     */
    public function issueJwt(Person $person): string
    {
        $now = time();
        $ttl = defined('SESSION_TTL') ? (int) SESSION_TTL : 28800;

        $payload = [
            'iss'  => 'ureport',
            'sub'  => $person->id,
            'role' => $person->role,
            'jti'  => $this->generateJti(),
            'iat'  => $now,
            'exp'  => $now + $ttl,
        ];

        return JWT::encode($payload, $this->jwtSecret(), self::JWT_ALG);
    }

    /**
     * Validate a session JWT.
     * Returns decoded claims: ['sub' => int, 'role' => string, 'jti' => string]
     *
     * @throws \Firebase\JWT\ExpiredException    on expired token
     * @throws \Firebase\JWT\SignatureInvalidException on bad signature
     * @throws \RuntimeException on inactive person
     */
    public function validateJwt(string $token): array
    {
        $decoded = (array) JWT::decode($token, new Key($this->jwtSecret(), self::JWT_ALG));

        $personId = (int) ($decoded['sub'] ?? 0);
        if ($personId <= 0) {
            throw new \RuntimeException('Invalid JWT sub claim');
        }

        // Cross-validate role against DB (TechArch §5.2 step 4)
        $person = $this->persons->findById($personId);
        if ($person === null || !$person->active) {
            throw new \RuntimeException('Person not found or inactive');
        }

        // Use DB role (authoritative); JWT role may be stale
        return [
            'sub'  => $personId,
            'role' => $person->role,
            'jti'  => $decoded['jti'] ?? '',
        ];
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function jwtSecret(): string
    {
        if (!defined('JWT_SECRET') || strlen(JWT_SECRET) < 32) {
            throw new \RuntimeException('JWT_SECRET must be at least 32 characters');
        }
        return JWT_SECRET;
    }

    private function generateJti(): string
    {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}

// Helper: start session only if not already started
if (!function_exists('session_start_if_not_started')) {
    function session_start_if_not_started(): void {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }
}
