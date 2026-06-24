package com.ureport.dto.response;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        long expiresIn,
        String role,
        Integer personId
) {}
