package com.ureport.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiry-seconds:28800}")
    private long expirySeconds;

    @Value("${jwt.issuer:ureport}")
    private String issuer;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Generate a signed HS256 JWT.
     * Claims: sub (username), personId, role, iat, exp, iss
     */
    public String generateToken(Long personId, String username, String role) {
        long nowMs = System.currentTimeMillis();
        return Jwts.builder()
                .subject(username)
                .claim("personId", personId)
                .claim("role", role)
                .issuer(issuer)
                .issuedAt(new Date(nowMs))
                .expiration(new Date(nowMs + expirySeconds * 1000))
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    /** Validate signature and expiry; returns false on any failure. */
    public boolean validateToken(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    public Long extractPersonId(String token) {
        return extractClaims(token).get("personId", Long.class);
    }

    public String extractRole(String token) {
        return extractClaims(token).get("role", String.class);
    }

    public Date extractExpiration(String token) {
        return extractClaims(token).getExpiration();
    }
}
