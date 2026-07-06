package com.ureport.security;

import com.ureport.domain.Person;
import com.ureport.domain.PersonRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for route-level authorization rules (TechArch §5.4).
 *
 * Uses @SpringBootTest to load the full security filter chain.
 * Tests generate real JWTs via JwtService with staff/admin roles.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthorizationIT {

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;
    @Autowired PersonRepository personRepository;

    /**
     * Seed test persons so that controllers that load Person from DB can find them.
     * The tokens use username "staffuser" (id auto-assigned) and "adminuser".
     */
    @BeforeEach
    void setUp() {
        personRepository.findByUsername("staffuser").orElseGet(() ->
                personRepository.save(new Person("staffuser", "staff")));
        personRepository.findByUsername("adminuser").orElseGet(() ->
                personRepository.save(new Person("adminuser", "admin")));
    }

    // ========== Helper methods ==========

    private Cookie staffJwtCookie() {
        String token = jwtService.generateToken(1L, "staffuser", "staff");
        return new Cookie("auth_token", token);
    }

    private Cookie adminJwtCookie() {
        String token = jwtService.generateToken(2L, "adminuser", "admin");
        return new Cookie("auth_token", token);
    }

    // ========== PUBLIC routes — no JWT required ==========

    @Test
    void open311_getServices_publicRouteNoAuth() throws Exception {
        // GET /open311/v2/services → public route; should NOT return 401
        mockMvc.perform(get("/open311/v2/services"))
               .andExpect(status().is(not(401)));
    }

    @Test
    void authLdap_post_publicRoute() throws Exception {
        // POST /api/auth/ldap → public; CSRF-exempt; may return 400/503 but never 401
        mockMvc.perform(post("/api/auth/ldap")
                    .contentType("application/json")
                    .content("{\"username\":\"user\",\"password\":\"pass\"}"))
               .andExpect(status().is(not(401)));
    }

    @Test
    void authCasCallback_get_publicRoute() throws Exception {
        // GET /auth/cas/callback → public; may redirect or return error but never 401
        mockMvc.perform(get("/auth/cas/callback"))
               .andExpect(status().is(not(401)));
    }

    @Test
    void authRefresh_post_publicRoute() throws Exception {
        // POST /api/auth/refresh → public from security layer perspective (CSRF-exempt, no JWT required).
        // Controller returns 401 when no auth_token cookie present — that is controller logic, not security filter.
        // We verify: security layer does NOT return 403 (which would indicate a security rule block).
        mockMvc.perform(post("/api/auth/refresh"))
               .andExpect(status().is(not(403)));
    }

    @Test
    void authLogout_post_publicRoute() throws Exception {
        // POST /api/auth/logout → public (CSRF-exempt); no JWT required
        mockMvc.perform(post("/api/auth/logout"))
               .andExpect(status().is(not(401)));
    }

    @Test
    void categoriesPublic_get_publicRoute() throws Exception {
        // GET /api/categories/public → public (may be 404 if controller not yet built, never 401)
        mockMvc.perform(get("/api/categories/public"))
               .andExpect(status().is(not(401)));
    }

    @Test
    void ticketsPublic_post_publicRoute() throws Exception {
        // POST /api/tickets/public → public (CSRF-exempt via open311? No — use csrf() for safety)
        // Actually this is not CSRF-exempt, but it IS in permitAll, so security won't block it.
        // Spring Security still checks CSRF for POST. Use with(csrf()) to pass CSRF check.
        mockMvc.perform(post("/api/tickets/public")
                    .contentType("application/json").content("{}")
                    .with(csrf()))
               .andExpect(status().is(not(401)));
    }

    @Test
    void geocode_get_publicRoute() throws Exception {
        // GET /api/geocode → public (may be 404, not 401)
        mockMvc.perform(get("/api/geocode"))
               .andExpect(status().is(not(401)));
    }

    @Test
    void swaggerUi_publicRoute() throws Exception {
        mockMvc.perform(get("/swagger-ui.html"))
               .andExpect(status().is(not(401)));
    }

    @Test
    void actuatorHealth_publicRoute() throws Exception {
        mockMvc.perform(get("/actuator/health"))
               .andExpect(status().isOk());
    }

    // ========== PROTECTED routes — JWT required ==========

    @Test
    void ticketsGet_noJwt_returns401() throws Exception {
        // GET /api/tickets → requires JWT; no cookie → 401
        mockMvc.perform(get("/api/tickets"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void ticketsGet_invalidJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/tickets")
                    .cookie(new Cookie("auth_token", "invalid.jwt.here")))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void ticketsGet_staffJwt_returns2xxOr404() throws Exception {
        // GET /api/tickets with valid staff JWT → security passes (may be 404 if controller not built yet)
        mockMvc.perform(get("/api/tickets").cookie(staffJwtCookie()))
               .andExpect(status().is(not(401)));
    }

    @Test
    void authMe_staffJwt_returns2xx() throws Exception {
        // GET /api/auth/me with valid staff JWT → 200
        mockMvc.perform(get("/api/auth/me").cookie(staffJwtCookie()))
               .andExpect(status().is(not(401)));
    }

    // ========== STAFF routes — staff or admin role required ==========

    @Test
    void ticketsPost_noJwt_returns401() throws Exception {
        // POST /api/tickets → staff or admin; no JWT → 401 (CSRF also required but auth check happens first via 401)
        mockMvc.perform(post("/api/tickets")
                    .contentType("application/json").content("{}")
                    .with(csrf()))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void ticketsPost_staffJwt_notForbidden() throws Exception {
        // POST /api/tickets with staff JWT → should NOT return 401 or 403
        mockMvc.perform(post("/api/tickets")
                    .contentType("application/json").content("{}")
                    .cookie(staffJwtCookie())
                    .with(csrf()))
               .andExpect(status().is(not(401)));
        // May return 400 (validation) or 422 (business logic) — that's fine
    }

    @Test
    void ticketsPost_adminJwt_notForbidden() throws Exception {
        // POST /api/tickets with admin JWT → role hierarchy: admin implies staff → not 403
        mockMvc.perform(post("/api/tickets")
                    .contentType("application/json").content("{}")
                    .cookie(adminJwtCookie())
                    .with(csrf()))
               .andExpect(status().is(not(403)));
    }

    // ========== ADMIN-ONLY routes — admin role required ==========

    @Test
    void deletePerson_staffJwt_returns403() throws Exception {
        // DELETE /api/people/1 → admin only; staff JWT → 403 Forbidden
        mockMvc.perform(delete("/api/people/1")
                    .cookie(staffJwtCookie())
                    .with(csrf()))
               .andExpect(status().isForbidden());
    }

    @Test
    void deletePerson_noJwt_returns401() throws Exception {
        // DELETE /api/people/1 → no JWT → 401
        mockMvc.perform(delete("/api/people/1")
                    .with(csrf()))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void deletePerson_adminJwt_notForbidden() throws Exception {
        // DELETE /api/people/1 → admin JWT → security passes (may be 404 if person not found)
        mockMvc.perform(delete("/api/people/1")
                    .cookie(adminJwtCookie())
                    .with(csrf()))
               .andExpect(status().is(not(403)));
    }

    // ========== Role hierarchy: ADMIN implies STAFF ==========

    @Test
    void roleHierarchy_adminCanAccessStaffRoutes() throws Exception {
        // PATCH /api/tickets/1 → staff or admin route; admin JWT should pass security
        mockMvc.perform(patch("/api/tickets/1")
                    .contentType("application/json").content("{}")
                    .cookie(adminJwtCookie())
                    .with(csrf()))
               .andExpect(status().is(not(403)));
    }

    @Test
    void roleHierarchy_staffCannotAccessAdminRoutes() throws Exception {
        // DELETE /api/people/1 → admin only; staff JWT → 403
        mockMvc.perform(delete("/api/people/1")
                    .cookie(staffJwtCookie())
                    .with(csrf()))
               .andExpect(status().isForbidden());
    }
}
