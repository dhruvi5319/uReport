package com.ureport.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    private final SecretKey secretKey;
    private final long expiryMs;

    public JwtUtil(
        @Value("${jwt.secret}") String secret,
        @Value("${jwt.expiry-seconds:28800}") long expirySeconds
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiryMs = expirySeconds * 1000;
    }

    public String generateToken(PersonDetails user) {
        return Jwts.builder()
            .subject(user.getUsername())
            .claim("id", user.getId())
            .claim("role", user.getRole())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expiryMs))
            .signWith(secretKey)
            .compact();
    }

    public Claims parseToken(String token) throws JwtException {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
