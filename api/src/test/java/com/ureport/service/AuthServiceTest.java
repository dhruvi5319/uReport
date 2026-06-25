package com.ureport.service;

import com.ureport.config.JwtConfig;
import com.ureport.dto.response.AuthResponse;
import com.ureport.entity.Person;
import com.ureport.entity.RefreshToken;
import com.ureport.exception.NotFoundException;
import com.ureport.repository.PersonRepository;
import com.ureport.repository.RefreshTokenRepository;
import com.ureport.repository.TokenBlacklistRepository;
import com.ureport.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private PersonRepository personRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private TokenBlacklistRepository tokenBlacklistRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private JwtConfig jwtConfig;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private Person testPerson;

    @BeforeEach
    void setUp() {
        testPerson = new Person();
        testPerson.setId(1);
        testPerson.setUsername("testuser");
        testPerson.setPasswordHash("$2a$10$hashedpassword");
        testPerson.setRole("staff");
        testPerson.setFirstname("Test");
        testPerson.setLastname("User");
    }

    @Test
    void testLogin_validCredentials_returnsAuthResponse() {
        when(personRepository.findByUsername("testuser")).thenReturn(Optional.of(testPerson));
        when(passwordEncoder.matches("password", "$2a$10$hashedpassword")).thenReturn(true);
        when(jwtTokenProvider.generateToken(1L, "staff")).thenReturn("access-token");
        when(jwtConfig.getRefreshExpiry()).thenReturn(86400L);
        when(jwtConfig.getExpiry()).thenReturn(3600L);
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AuthResponse response = authService.login("testuser", "password");

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.role()).isEqualTo("staff");
        assertThat(response.personId()).isEqualTo(1);
        assertThat(response.expiresIn()).isEqualTo(3600L);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void testLogin_invalidPassword_throws401() {
        when(personRepository.findByUsername("testuser")).thenReturn(Optional.of(testPerson));
        when(passwordEncoder.matches("wrongpassword", "$2a$10$hashedpassword")).thenReturn(false);

        assertThatThrownBy(() -> authService.login("testuser", "wrongpassword"))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Invalid credentials");
    }

    @Test
    void testLogin_unknownUsername_throws401() {
        when(personRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login("unknown", "password"))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Invalid credentials");
    }

    @Test
    void testRefresh_validToken_rotatesAndReturnsNewPair() {
        UUID tokenId = UUID.randomUUID();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setId(tokenId);
        refreshToken.setPersonId(1);
        refreshToken.setExpiresAt(OffsetDateTime.now().plusHours(1));
        refreshToken.setRevoked(false);

        when(refreshTokenRepository.findByIdAndRevokedFalse(tokenId)).thenReturn(Optional.of(refreshToken));
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(personRepository.findById(1)).thenReturn(Optional.of(testPerson));
        when(jwtTokenProvider.generateToken(1L, "staff")).thenReturn("new-access-token");
        when(jwtConfig.getRefreshExpiry()).thenReturn(86400L);
        when(jwtConfig.getExpiry()).thenReturn(3600L);

        AuthResponse response = authService.refresh(tokenId.toString());

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("new-access-token");
        assertThat(refreshToken.getRevoked()).isTrue(); // old token revoked
    }

    @Test
    void testRefresh_expiredToken_throws401() {
        UUID tokenId = UUID.randomUUID();
        RefreshToken expiredToken = new RefreshToken();
        expiredToken.setId(tokenId);
        expiredToken.setPersonId(1);
        expiredToken.setExpiresAt(OffsetDateTime.now().minusHours(1)); // expired
        expiredToken.setRevoked(false);

        when(refreshTokenRepository.findByIdAndRevokedFalse(tokenId)).thenReturn(Optional.of(expiredToken));

        assertThatThrownBy(() -> authService.refresh(tokenId.toString()))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void testRefresh_revokedToken_throws401() {
        UUID tokenId = UUID.randomUUID();

        when(refreshTokenRepository.findByIdAndRevokedFalse(tokenId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refresh(tokenId.toString()))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("revoked");
    }

    @Test
    void testLogout_blacklistsJti() {
        UUID tokenId = UUID.randomUUID();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setId(tokenId);
        refreshToken.setPersonId(1);
        refreshToken.setRevoked(false);

        when(refreshTokenRepository.findById(tokenId)).thenReturn(Optional.of(refreshToken));
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(tokenBlacklistRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        authService.logout(tokenId.toString(), "some-jti", OffsetDateTime.now().plusHours(1));

        assertThat(refreshToken.getRevoked()).isTrue();
        verify(tokenBlacklistRepository).save(argThat(entry ->
                entry.getJti().equals("some-jti")));
    }
}
