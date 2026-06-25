package com.ureport.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Utility for API key generation and dual-hash storage.
 *
 * Strategy (per F13 spec):
 *   - api_key_lookup: SHA-256 hex of rawKey — enables O(1) indexed lookup without exposing the key
 *   - api_key_hash: BCrypt (cost=10) of rawKey — secure storage requiring full BCrypt verify
 */
@Component
public class ApiKeyHashUtil {

    private static final BCryptPasswordEncoder BCRYPT = new BCryptPasswordEncoder(10);

    /**
     * Generate a cryptographically secure raw API key (UUID-based, 36+ chars).
     */
    public String generateKey() {
        return UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
    }

    /**
     * SHA-256 hex of rawKey — stored in api_key_lookup for fast indexed lookup.
     */
    public String hashForLookup(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    /**
     * BCrypt hash (cost=10) of rawKey — stored in api_key_hash for secure storage.
     */
    public String hashForStorage(String rawKey) {
        return BCRYPT.encode(rawKey);
    }

    /**
     * Verify rawKey against stored lookup hash and BCrypt hash.
     * First checks SHA-256 lookup (fast), then BCrypt verify (secure).
     */
    public boolean verify(String rawKey, String storedLookup, String storedHash) {
        if (rawKey == null || storedLookup == null || storedHash == null) {
            return false;
        }
        // Fast check: SHA-256 lookup must match
        String computedLookup = hashForLookup(rawKey);
        if (!computedLookup.equals(storedLookup)) {
            return false;
        }
        // Secure check: BCrypt verify
        return BCRYPT.matches(rawKey, storedHash);
    }
}
