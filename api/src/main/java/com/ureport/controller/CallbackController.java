package com.ureport.controller;

import com.ureport.dto.response.AuthResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class CallbackController {

    @Value("${app.oauth.client-id:#{null}}")
    private String oauthClientId;

    /**
     * GET /callback — OAuth callback endpoint per FRD F04.5.
     * Validates CSRF state param (HMAC-signed stateless token) and exchanges OAuth code for person record.
     * Returns 501 if OAuth is not configured (APP_OAUTH_CLIENT_ID not set).
     */
    @GetMapping("/callback")
    public ResponseEntity<?> callback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error) {

        // Return 501 if OAuth is not configured
        if (oauthClientId == null || oauthClientId.isBlank()) {
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                    .body(Map.of("error", "OAUTH_NOT_CONFIGURED",
                            "message", "OAuth identity provider is not configured. Set APP_OAUTH_CLIENT_ID."));
        }

        if (error != null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "OAUTH_ERROR", "message", "OAuth provider returned error: " + error));
        }

        if (code == null || state == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "MISSING_PARAMS", "message", "code and state parameters are required"));
        }

        // CSRF state validation — verify the state parameter is a valid HMAC-signed token
        // In a full implementation, this would verify a HMAC-SHA256 signature on the state
        // to prevent CSRF attacks. For the stub, we just check it's non-empty.
        if (state.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "INVALID_STATE", "message", "Invalid or missing CSRF state token"));
        }

        // TODO: Exchange OAuth code with external IdP, look up/create person record, issue JWT
        // This is a placeholder — full implementation in Wave 2d when OAuth integration is complete
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(Map.of("error", "OAUTH_EXCHANGE_PENDING",
                        "message", "OAuth code exchange not yet implemented"));
    }
}
