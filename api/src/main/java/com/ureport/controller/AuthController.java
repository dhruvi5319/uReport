package com.ureport.controller;

import com.ureport.dto.request.LoginRequest;
import com.ureport.dto.response.AuthResponse;
import com.ureport.security.JwtTokenProvider;
import com.ureport.security.JwtUserDetails;
import com.ureport.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthController(AuthService authService, JwtTokenProvider jwtTokenProvider) {
        this.authService = authService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request.username(), request.password());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        AuthResponse response = authService.refresh(refreshToken);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest,
                                       @RequestBody(required = false) Map<String, String> request) {
        String refreshTokenId = request != null ? request.get("refreshToken") : null;

        // Extract JWT jti from the current security context
        String authHeader = httpRequest.getHeader("Authorization");
        String jti = null;
        OffsetDateTime expiry = OffsetDateTime.now().plusHours(1); // default fallback

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                jti = jwtTokenProvider.getJti(token);
                Date expDate = jwtTokenProvider.getExpiration(token);
                expiry = expDate.toInstant().atOffset(java.time.ZoneOffset.UTC);
            } catch (Exception e) {
                // Token may be invalid, proceed anyway
            }
        }

        authService.logout(refreshTokenId, jti, expiry);
        return ResponseEntity.ok().build();
    }
}
