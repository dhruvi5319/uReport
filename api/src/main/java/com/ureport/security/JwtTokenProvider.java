package com.ureport.security;

import com.ureport.config.JwtConfig;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private final JwtConfig jwtConfig;
    private final SecretKey secretKey;

    public JwtTokenProvider(JwtConfig jwtConfig, SecretKey secretKey) {
        this.jwtConfig = jwtConfig;
        this.secretKey = secretKey;
    }

    /**
     * Generate access token with personId as subject, role claim, jti, iss, iat, exp.
     */
    public String generateToken(Long personId, String role) {
        return Jwts.builder()
                .subject(String.valueOf(personId))
                .claim("role", role)
                .issuer(jwtConfig.getIssuer())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtConfig.getExpiry() * 1000))
                .id(UUID.randomUUID().toString())
                .signWith(secretKey)
                .compact();
    }

    /**
     * Validate token — returns true if valid, false otherwise.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Extract all claims from token.
     */
    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Extract personId (sub claim) from token.
     */
    public Long getPersonId(String token) {
        return Long.valueOf(getClaims(token).getSubject());
    }

    /**
     * Extract role claim from token.
     */
    public String getRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    /**
     * Extract jti claim from token.
     */
    public String getJti(String token) {
        return getClaims(token).getId();
    }

    /**
     * Extract expiration date from token.
     */
    public Date getExpiration(String token) {
        return getClaims(token).getExpiration();
    }
}
