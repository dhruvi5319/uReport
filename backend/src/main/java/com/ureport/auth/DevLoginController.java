package com.ureport.auth;

import com.ureport.auth.dto.AuthMeResponse;
import com.ureport.domain.Person;
import com.ureport.repository.PersonRepository;
import com.ureport.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.format.DateTimeFormatter;

/**
 * DEV PROFILE ONLY — not included in production builds.
 *
 * Provides POST /api/auth/dev-login for password-based authentication
 * against the H2 in-memory database (bypasses LDAP which is disabled in dev).
 *
 * Used to obtain a real JWT cookie during development/UAT so all /api/** authenticated
 * endpoints can be exercised via the React frontend.
 *
 * Credentials seeded by DevDataSeeder: username=devadmin, password=admin123
 */
@RestController
@RequestMapping("/api/auth")
@Profile("dev")
public class DevLoginController {

    private final PersonRepository personRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${jwt.expiry-seconds:28800}")
    private long expirySeconds;

    public DevLoginController(PersonRepository personRepository, JwtService jwtService) {
        this.personRepository = personRepository;
        this.jwtService = jwtService;
    }

    record DevLoginRequest(String username, String password) {}

    /**
     * POST /api/auth/dev-login
     *
     * Validates username + password against BCrypt hash in H2 people table.
     * Returns 200 + AuthMeResponse + auth_token httpOnly cookie on success.
     * Returns 401 on bad credentials, 404 if user not found.
     *
     * This endpoint is CSRF-exempt (like /api/auth/ldap — see SecurityConfig.ignoringRequestMatchers).
     */
    @PostMapping("/dev-login")
    public ResponseEntity<AuthMeResponse> devLogin(@RequestBody DevLoginRequest request) {
        Person person = personRepository.findByUsername(request.username())
                .orElse(null);

        if (person == null) {
            return ResponseEntity.status(401)
                    .body(null);
        }

        // Validate password against bcrypt hash stored by DevDataSeeder
        if (person.getPasswordHash() == null
                || !passwordEncoder.matches(request.password(), person.getPasswordHash())) {
            return ResponseEntity.status(401).build();
        }

        String token = jwtService.generateToken(person.getId(), person.getUsername(), person.getRole());

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

        ResponseCookie cookie = ResponseCookie.from("auth_token", token)
                .httpOnly(true)
                .sameSite("Strict")
                .secure(false)     // false for HTTP localhost dev (not HTTPS in dev)
                .path("/")
                .maxAge(expirySeconds)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(body);
    }
}
