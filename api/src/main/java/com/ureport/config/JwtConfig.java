package com.ureport.config;

import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Configuration
public class JwtConfig {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiry}")
    private long expiry;

    @Value("${app.jwt.refresh-expiry}")
    private long refreshExpiry;

    @Value("${app.jwt.issuer}")
    private String issuer;

    @Bean
    public SecretKey jwtSecretKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public long getExpiry() {
        return expiry;
    }

    public long getRefreshExpiry() {
        return refreshExpiry;
    }

    public String getIssuer() {
        return issuer;
    }
}
