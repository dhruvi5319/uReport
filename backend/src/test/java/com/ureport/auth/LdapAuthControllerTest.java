package com.ureport.auth;

import com.ureport.repository.PersonRepository;
import com.ureport.security.JwtAuthFilter;
import com.ureport.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit test for AuthController LDAP login path using @WebMvcTest (no full Spring context).
 * Mocks LdapAuthService so we can exercise the 401 path without a real LDAP server.
 */
@WebMvcTest(AuthController.class)
@ActiveProfiles("test")
class LdapAuthControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    LdapAuthService ldapAuthService;

    @MockBean
    JwtService jwtService;

    @MockBean
    PersonRepository personRepository;

    /**
     * Required: @WebMvcTest loads the security filter chain, which autowires JwtAuthFilter
     * (@Component). Without this mock, the test context will fail to start with a
     * NoSuchBeanDefinitionException or UnsatisfiedDependencyException.
     */
    @MockBean
    com.ureport.security.JwtAuthFilter jwtAuthFilter;

    /**
     * Required: legacy JwtAuthenticationFilter (@Component) also needs JwtUtil to
     * construct. Mock it so the @WebMvcTest context can start without JwtUtil available.
     */
    @MockBean
    com.ureport.security.JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * When LdapAuthService throws BadCredentialsException, AuthController returns 401.
     */
    @Test
    void ldapLogin_badCredentials_returns401() throws Exception {
        when(ldapAuthService.authenticate(anyString(), anyString()))
            .thenThrow(new BadCredentialsException("Invalid credentials"));

        mockMvc.perform(post("/api/auth/ldap")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"attacker\",\"password\":\"wrong\"}"))
            .andExpect(status().isUnauthorized());
    }
}
