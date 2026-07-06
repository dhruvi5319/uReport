package com.ureport.auth;

import com.ureport.auth.dto.AuthMeResponse;
import com.ureport.auth.dto.LdapLoginRequest;
import com.ureport.domain.Person;
import com.ureport.domain.PersonRepository;
import com.ureport.security.CustomUserDetails;
import com.ureport.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Date;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final LdapAuthService ldapAuthService;
    private final JwtService jwtService;
    private final PersonRepository personRepository;

    @Value("${jwt.expiry-seconds:28800}")
    private long expirySeconds;

    public AuthController(LdapAuthService ldapAuthService,
                          JwtService jwtService,
                          PersonRepository personRepository) {
        this.ldapAuthService = ldapAuthService;
        this.jwtService = jwtService;
        this.personRepository = personRepository;
    }

    /**
     * POST /api/auth/ldap
     * Authenticate via LDAP bind. Returns 200 + AuthMeResponse + auth_token httpOnly cookie.
     * Returns 401 on bad credentials, 503 if LDAP is not enabled.
     */
    @PostMapping("/ldap")
    public ResponseEntity<AuthMeResponse> ldapLogin(@Valid @RequestBody LdapLoginRequest request) {
        String token;
        try {
            token = ldapAuthService.authenticate(request.username(), request.password());
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(503).build();
        }

        Person person = personRepository.findByUsername(request.username())
                .orElseThrow(() -> new RuntimeException("Person not found after auth"));

        Date expiry = jwtService.extractExpiration(token);
        String expiresAt = DateTimeFormatter.ISO_INSTANT
                .format(expiry.toInstant().atZone(ZoneOffset.UTC));

        AuthMeResponse body = new AuthMeResponse(
                person.getId(),
                person.getUsername(),
                person.getRole(),
                person.getFirstname(),
                person.getLastname(),
                expiresAt
        );

        // Set auth_token cookie: HttpOnly; SameSite=Strict; Secure; max-age = expiry-seconds
        ResponseCookie cookie = ResponseCookie.from("auth_token", token)
                .httpOnly(true)
                .sameSite("Strict")
                .secure(true)
                .path("/")
                .maxAge(expirySeconds)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(body);
    }

    /**
     * GET /api/auth/me
     * JWT required (enforced by SecurityConfig). Returns AuthMeResponse for the current user.
     */
    @GetMapping("/me")
    public ResponseEntity<AuthMeResponse> me(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        Person person = personRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found in database"));

        // Use current time + expiry-seconds as the expected expiry for /me response
        Instant expiresAt = Instant.now().plusSeconds(expirySeconds);
        String expiresAtStr = DateTimeFormatter.ISO_INSTANT.format(expiresAt);

        AuthMeResponse body = new AuthMeResponse(
                person.getId(),
                person.getUsername(),
                person.getRole(),
                person.getFirstname(),
                person.getLastname(),
                expiresAtStr
        );

        return ResponseEntity.ok(body);
    }

    /**
     * POST /api/auth/refresh
     * Issues a new JWT if the current auth_token is still valid.
     * Returns 200 + new auth_token cookie on success; 401 if cookie missing/invalid.
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthMeResponse> refresh(
            @CookieValue(name = "auth_token", required = false) String currentToken) {

        if (currentToken == null || !jwtService.validateToken(currentToken)) {
            return ResponseEntity.status(401).build();
        }

        Long personId = jwtService.extractPersonId(currentToken);
        String username = jwtService.extractUsername(currentToken);
        String role = jwtService.extractRole(currentToken);

        String newToken = jwtService.generateToken(personId, username, role);

        Person person = personRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Date expiry = jwtService.extractExpiration(newToken);
        String expiresAt = DateTimeFormatter.ISO_INSTANT
                .format(expiry.toInstant().atZone(ZoneOffset.UTC));

        ResponseCookie cookie = ResponseCookie.from("auth_token", newToken)
                .httpOnly(true)
                .sameSite("Strict")
                .secure(true)
                .path("/")
                .maxAge(expirySeconds)
                .build();

        AuthMeResponse body = new AuthMeResponse(
                person.getId(), person.getUsername(), person.getRole(),
                person.getFirstname(), person.getLastname(), expiresAt);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(body);
    }

    /**
     * POST /api/auth/logout
     * Clears auth_token cookie (max-age=0). Returns 200.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        ResponseCookie clearCookie = ResponseCookie.from("auth_token", "")
                .httpOnly(true)
                .sameSite("Strict")
                .secure(true)
                .path("/")
                .maxAge(0)   // Delete cookie
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .build();
    }
}
