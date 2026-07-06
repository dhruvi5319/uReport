package com.ureport.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityConfigTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void publicRoute_open311_get_returns_not_401() throws Exception {
        // Public GET /open311/v2/services should NOT return 401
        // It may return 404 (no controller yet) but NOT 401
        mockMvc.perform(get("/open311/v2/services"))
               .andExpect(status().is(not(401)));
    }

    @Test
    void publicRoute_authLdap_post_permitAll() throws Exception {
        // POST /api/auth/ldap should not be blocked by auth (may be 400/404 for missing body/controller, never 401)
        mockMvc.perform(post("/api/auth/ldap")
                    .contentType("application/json")
                    .content("{}"))
               .andExpect(status().is(not(401)));
    }

    @Test
    void protectedRoute_noJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/tickets"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedRoute_invalidJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/tickets")
                    .cookie(new jakarta.servlet.http.Cookie("auth_token", "invalid.token.here")))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void actuatorHealth_isPublic() throws Exception {
        mockMvc.perform(get("/actuator/health"))
               .andExpect(status().isOk());
    }
}
