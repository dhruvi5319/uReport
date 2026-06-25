package com.ureport.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "token_blacklist")
public class TokenBlacklist {

    @Id
    @Column(name = "jti", length = 36)
    private String jti;

    @Column(name = "expiresAt", nullable = false)
    private OffsetDateTime expiresAt;

    public TokenBlacklist() {}

    public TokenBlacklist(String jti, OffsetDateTime expiresAt) {
        this.jti = jti;
        this.expiresAt = expiresAt;
    }

    public String getJti() { return jti; }
    public void setJti(String jti) { this.jti = jti; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }
}
