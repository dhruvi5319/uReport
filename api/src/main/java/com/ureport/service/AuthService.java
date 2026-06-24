package com.ureport.service;

import com.ureport.config.JwtConfig;
import com.ureport.dto.response.AuthResponse;
import com.ureport.entity.RefreshToken;
import com.ureport.entity.TokenBlacklist;
import com.ureport.exception.AuthenticationException;
import com.ureport.exception.NotFoundException;
import com.ureport.repository.PersonRepository;
import com.ureport.repository.RefreshTokenRepository;
import com.ureport.repository.TokenBlacklistRepository;
import com.ureport.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@Transactional
public class AuthService {

    private final PersonRepository personRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenBlacklistRepository tokenBlacklistRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtConfig jwtConfig;
    private final PasswordEncoder passwordEncoder;

    public AuthService(PersonRepository personRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       TokenBlacklistRepository tokenBlacklistRepository,
                       JwtTokenProvider jwtTokenProvider,
                       JwtConfig jwtConfig,
                       PasswordEncoder passwordEncoder) {
        this.personRepository = personRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.tokenBlacklistRepository = tokenBlacklistRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.jwtConfig = jwtConfig;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Authenticate user with username/password, return JWT access + refresh token pair.
     */
    public AuthResponse login(String username, String password) {
        var person = personRepository.findByUsername(username)
                .orElseThrow(() -> new AuthenticationException("AUTH_FAILED", "Invalid credentials"));

        if (!passwordEncoder.matches(password, person.getPasswordHash())) {
            throw new AuthenticationException("AUTH_FAILED", "Invalid credentials");
        }

        String accessToken = jwtTokenProvider.generateToken(person.getId().longValue(), person.getRole());

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setId(UUID.randomUUID());
        refreshToken.setPersonId(person.getId());
        refreshToken.setCreatedAt(OffsetDateTime.now());
        refreshToken.setExpiresAt(OffsetDateTime.now().plusSeconds(jwtConfig.getRefreshExpiry()));
        refreshToken.setRevoked(false);
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(
                accessToken,
                refreshToken.getId().toString(),
                jwtConfig.getExpiry(),
                person.getRole(),
                person.getId()
        );
    }

    /**
     * Rotate refresh token — revoke old, issue new access + refresh token pair.
     */
    public AuthResponse refresh(String refreshTokenId) {
        UUID tokenId;
        try {
            tokenId = UUID.fromString(refreshTokenId);
        } catch (IllegalArgumentException e) {
            throw new NotFoundException("REFRESH_TOKEN_INVALID", "Invalid refresh token");
        }

        RefreshToken oldToken = refreshTokenRepository.findByIdAndRevokedFalse(tokenId)
                .orElseThrow(() -> new NotFoundException("REFRESH_TOKEN_INVALID", "Refresh token not found or revoked"));

        if (oldToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new NotFoundException("REFRESH_TOKEN_INVALID", "Refresh token has expired");
        }

        // Revoke old token
        oldToken.setRevoked(true);
        refreshTokenRepository.save(oldToken);

        // Get person details
        var person = personRepository.findById(oldToken.getPersonId())
                .orElseThrow(() -> new AuthenticationException("AUTH_FAILED", "Person not found"));

        // Generate new tokens
        String newAccessToken = jwtTokenProvider.generateToken(person.getId().longValue(), person.getRole());

        RefreshToken newRefreshToken = new RefreshToken();
        newRefreshToken.setId(UUID.randomUUID());
        newRefreshToken.setPersonId(person.getId());
        newRefreshToken.setCreatedAt(OffsetDateTime.now());
        newRefreshToken.setExpiresAt(OffsetDateTime.now().plusSeconds(jwtConfig.getRefreshExpiry()));
        newRefreshToken.setRevoked(false);
        refreshTokenRepository.save(newRefreshToken);

        return new AuthResponse(
                newAccessToken,
                newRefreshToken.getId().toString(),
                jwtConfig.getExpiry(),
                person.getRole(),
                person.getId()
        );
    }

    /**
     * Logout — revoke refresh token and blacklist the access token jti.
     */
    public void logout(String refreshTokenId, String accessTokenJti, OffsetDateTime accessTokenExpiry) {
        // Revoke refresh token if provided
        if (refreshTokenId != null && !refreshTokenId.isBlank()) {
            try {
                UUID tokenId = UUID.fromString(refreshTokenId);
                refreshTokenRepository.findById(tokenId).ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
            } catch (IllegalArgumentException e) {
                // Ignore invalid UUID during logout
            }
        }

        // Blacklist the access token jti
        if (accessTokenJti != null && !accessTokenJti.isBlank()) {
            TokenBlacklist blacklistEntry = new TokenBlacklist(accessTokenJti, accessTokenExpiry);
            tokenBlacklistRepository.save(blacklistEntry);
        }
    }
}
