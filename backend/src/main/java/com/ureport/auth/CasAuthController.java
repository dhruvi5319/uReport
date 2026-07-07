package com.ureport.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
public class CasAuthController {

    private final CasAuthService casAuthService;

    @Value("${jwt.expiry-seconds:28800}")
    private long expirySeconds;

    @Value("${cas.service-url:https://ureport.city.gov}")
    private String casServiceUrl;

    public CasAuthController(CasAuthService casAuthService) {
        this.casAuthService = casAuthService;
    }

    /**
     * GET /auth/cas
     * Public endpoint. Redirects the browser to the CAS server login URL with the
     * service parameter pointing back to /auth/cas/callback.
     *
     * Example redirect: https://cas.city.gov/login?service=https%3A%2F%2Fureport.city.gov%2Fauth%2Fcas%2Fcallback
     */
    @GetMapping("/auth/cas")
    public ResponseEntity<Void> casRedirect() {
        String casLoginUrl = casAuthService.buildCasLoginUrl();
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(casLoginUrl))
                .build();
    }

    /**
     * GET /auth/cas/callback
     * Public endpoint. Receives the service ticket from CAS after successful CAS login.
     *
     * On success: validates ticket, issues auth_token cookie, redirects to /dashboard
     * On failure: redirects to /login?error=cas
     *
     * @param ticket The CAS service ticket from ?ticket= query param
     */
    @GetMapping("/auth/cas/callback")
    public ResponseEntity<Void> casCallback(
            @RequestParam(name = "ticket", required = false) String ticket) {

        if (ticket == null || ticket.isBlank()) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create("/login?error=cas"))
                    .build();
        }

        try {
            String serviceUrl = casServiceUrl + "/auth/cas/callback";
            String jwtToken = casAuthService.validateTicket(ticket, serviceUrl);

            // Set auth_token cookie: HttpOnly; SameSite=Strict; Secure
            ResponseCookie cookie = ResponseCookie.from("auth_token", jwtToken)
                    .httpOnly(true)
                    .sameSite("Strict")
                    .secure(true)
                    .path("/")
                    .maxAge(expirySeconds)
                    .build();

            return ResponseEntity.status(HttpStatus.FOUND)
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .location(URI.create("/dashboard"))
                    .build();

        } catch (CasAuthService.CasAuthException e) {
            // Invalid ticket → redirect to login with error
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create("/login?error=cas"))
                    .build();
        } catch (IllegalStateException e) {
            // CAS not enabled
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
    }
}
