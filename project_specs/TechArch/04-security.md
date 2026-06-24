## Section 04: Security Architecture

---

## Authentication Model

uReport uses **JWT-based stateless authentication** for the React SPA and staff clients, and **API key authentication** for Open311 write operations by external integrations.

### JWT Specification

| Parameter | Value |
|-----------|-------|
| Algorithm | HS256 (configurable to RS256 via `app.jwt.algorithm`) |
| Signing secret | Min 256-bit symmetric key (`app.jwt.secret`) |
| Access token expiry | 3600 seconds / 1 hour (configurable `app.jwt.expiry`) |
| Refresh token expiry | 86400 seconds / 24 hours (configurable `app.jwt.refreshExpiry`) |
| Issuer claim (`iss`) | `"ureport"` |
| Subject claim (`sub`) | `people.id` (integer, as string) |
| Role claim (`role`) | `"staff"` / `"public"` / `"anonymous"` |
| JTI claim (`jti`) | UUID v4 — used for blacklist on logout |

### JWT Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    JWT Authentication Flow                        │
│                                                                  │
│  Client          Spring API              PostgreSQL              │
│    │                  │                      │                   │
│    │─ POST /auth/login│                      │                   │
│    │  {username, pw}  │                      │                   │
│    │                  │── SELECT people ─────>│                  │
│    │                  │<── {id, role, hash} ──│                  │
│    │                  │  BCrypt.verify(pw,hash)                  │
│    │                  │── INSERT refresh_tokens ──>│             │
│    │<── {accessToken,  │                      │                  │
│    │    refreshToken}  │                      │                  │
│    │                  │                      │                   │
│    │─ GET /api/v1/... │                      │                   │
│    │  Bearer: <jwt>   │                      │                   │
│    │                  │  JwtAuthFilter:       │                   │
│    │                  │  1. Extract Bearer    │                   │
│    │                  │  2. Verify signature  │                   │
│    │                  │  3. Check expiry      │                   │
│    │                  │── SELECT token_blacklist WHERE jti=? ──>│ │
│    │                  │<── (not found = valid) ──│              │ │
│    │                  │  4. Set SecurityContext  │              │ │
│    │<── 200 OK ───────│                          │              │ │
│                                                                  │
│  On logout:                                                      │
│    │─ POST /auth/logout {refreshToken}                           │
│    │                  │── UPDATE refresh_tokens SET revoked=true  │
│    │                  │── INSERT token_blacklist (jti, expiresAt) │
│    │<── 200 OK ───────│                                           │
└──────────────────────────────────────────────────────────────────┘
```

### Refresh Token Rotation

Refresh tokens are **single-use**. On each call to `POST /api/v1/auth/refresh`:
1. The old refresh token is marked `revoked = true`
2. A new refresh token UUID is inserted
3. A new access token is issued with a fresh `jti`

This prevents refresh token reuse attacks.

### Token Blacklist Cleanup

The `AuditScheduler` (or a dedicated `TokenCleanupScheduler`) periodically removes expired entries from `token_blacklist` where `expiresAt < NOW()`. This prevents unbounded table growth.

---

## API Key Authentication (Open311)

External clients authenticate Open311 write operations with an `api_key` parameter. Keys are stored with **two hashes**:

| Column | Algorithm | Purpose |
|--------|-----------|---------|
| `clients.api_key_hash` | BCrypt (cost ≥ 10) | Secure storage — used for final verification |
| `clients.api_key_lookup` | SHA-256(rawKey) hex | Fast indexed lookup — avoids BCrypt scan of all rows |

**Validation process:**
```
1. Compute SHA-256(provided api_key) → lookup_hash
2. SELECT * FROM clients WHERE api_key_lookup = lookup_hash
3. If found: BCrypt.verify(api_key, clients.api_key_hash) → confirm match
4. If no match anywhere → HTTP 403 API_KEY_INVALID
```

The raw API key is **never stored** and is returned to the admin **once only** at creation time.

### Obsolete API Keys

A configurable list `app.open311.obsoleteApiKeys` contains deprecated key values. These are checked **before** the normal validation. If a match is found, the API returns a 200 OK shutdown notice JSON payload (no ticket created) as specified by the legacy system:
```json
{ "shutdown": true, "message": "<shutdown notice text>" }
```

---

## Authorization Model (RBAC)

### Permission Levels

| Level | Value | Who |
|-------|-------|-----|
| Anonymous | `0` | Unauthenticated requests (no JWT, no API key) |
| Public | `1` | Authenticated constituent (`people.role = 'public'`) |
| Staff | `2` | Authenticated municipality employee (`people.role = 'staff'`) |

**Hierarchy:** Staff ≥ Public ≥ Anonymous. A staff user can access anything a public user can.

### Spring Security Implementation

```java
// SecurityConfig.java (sketch)
@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        return http
            .csrf(csrf -> csrf.disable())   // SPA uses JWT, not cookies
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(apiKeyAuthFilter, JwtAuthFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**", "/callback").permitAll()
                .requestMatchers("/open311/**").permitAll()  // auth checked in controller
                .requestMatchers("/api/v1/contact-methods", "/api/v1/issue-types").permitAll()
                .anyRequest().authenticated()
            )
            .build();
    }
}
```

Fine-grained per-endpoint authorization uses `@PreAuthorize`:
```java
@PreAuthorize("hasRole('STAFF')")
public ResponseEntity<TicketResponse> closeTicket(...) { ... }
```

Per-category permission checks are evaluated in the service layer using `PermissionEvaluator.isAllowed(callerRole, categoryPermissionLevel)`.

### Permission Matrix Summary

| Operation | anonymous | public | staff |
|-----------|-----------|--------|-------|
| View category (anonymous-level) | ✓ | ✓ | ✓ |
| View category (public-level) | ✗ | ✓ | ✓ |
| View category (staff-level) | ✗ | ✗ | ✓ |
| Submit ticket (per category posting level) | per cat | per cat | ✓ |
| Assign / Close / Reopen ticket | ✗ | ✗ | ✓ |
| Export CSV / print | ✗ | ✗ | ✓ |
| View ticket history | ✗ | ✗ | ✓ |
| All admin operations | ✗ | ✗ | ✓ |
| Metrics / reports | ✗ | ✗ | ✓ |
| Open311 POST /requests | api_key + posting perm | api_key + posting perm | ✓ |

---

## Data Protection

### Password Storage
- Algorithm: **BCrypt** with cost factor ≥ 10
- Column: `people.passwordHash VARCHAR(255)`
- On creation/update: plain-text password is **never stored**; BCrypt hash is computed in `AuthService` before persistence

### API Key Storage
- Fast lookup hash: SHA-256(rawKey) stored in `clients.api_key_lookup`
- Secure storage hash: BCrypt(rawKey) stored in `clients.api_key_hash`
- Raw key returned **once** at client registration; not stored anywhere

### JWT Secret
- Stored in environment variable `APP_JWT_SECRET`
- Minimum 256 bits (32 bytes) for HS256
- Never logged or exposed in API responses

### Input Validation
- All request bodies validated with Bean Validation (`@Valid`, `@NotBlank`, `@Size`, etc.)
- SQL injection prevention: all queries use parameterized statements (Spring Data JPA / HibernateQL)
- `sortBy` whitelist in `TicketSearchService` prevents injection via sort parameter
- Keyword `q` passed through `websearch_to_tsquery()` which sanitizes FTS input

### Secrets Management

All sensitive values are injected via environment variables (Docker Compose `.env` file):

| Variable | Purpose |
|----------|---------|
| `DB_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | JWT signing key (≥ 32 chars) |
| `MAIL_HOST` / `MAIL_PORT` | SMTP configuration |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP credentials |

No secrets are committed to source control. A `.env.example` file documents required variables with placeholder values.

### File Upload Security
- Allowed MIME types enforced server-side (content-type header + magic byte detection)
- Internal filenames are UUIDs — no path traversal possible
- Files served via `GET /api/v1/media/{internalFilename}` — server validates internalFilename against `media` table before serving
- Thumbnail cache path is separate from upload storage; cache files are always JPEG (no executable upload)
- Maximum file size: 20MB (configurable `app.media.maxSizeMb`)

### HTTPS
- In production, Nginx terminates TLS. All traffic from clients to Nginx is HTTPS.
- Internal Docker network traffic (Nginx → API, API → DB) is plaintext on the Docker bridge — acceptable for single-host deployments. For multi-host, use Docker overlay network with encryption.

### CORS
- `WebMvcConfig` sets CORS allowed origins to the configured SPA origin (`app.cors.allowedOrigins`)
- `Authorization` header is in the allowed headers list
- Open311 endpoints allow `*` origins (public API)
