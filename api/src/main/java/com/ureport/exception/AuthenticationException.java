package com.ureport.exception;

/**
 * Thrown when authentication fails (invalid credentials, expired/invalid token).
 * Maps to HTTP 401 Unauthorized.
 */
public class AuthenticationException extends RuntimeException {
    private final String code;

    public AuthenticationException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
