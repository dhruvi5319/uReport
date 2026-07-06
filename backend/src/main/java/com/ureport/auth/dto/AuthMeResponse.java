package com.ureport.auth.dto;

public record AuthMeResponse(
    Long personId,
    String username,
    String role,         // "admin" | "staff" | "public"
    String firstname,    // null if not set
    String lastname,     // null if not set
    String expiresAt     // ISO 8601 UTC
) {}
