package com.ureport.security;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Double-Submit Cookie CSRF pattern:
        //   - XSRF-TOKEN cookie is non-httpOnly (readable by React JS)
        //   - Client sends X-XSRF-TOKEN request header
        //   - Open311 /open311/v2/* endpoints are CSRF-exempt
        CookieCsrfTokenRepository csrfRepo = CookieCsrfTokenRepository.withHttpOnlyFalse();
        CsrfTokenRequestAttributeHandler csrfHandler = new CsrfTokenRequestAttributeHandler();

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfRepo)
                .csrfTokenRequestHandler(csrfHandler)
                // All /api/** are CSRF-exempt: stateless JWT auth means CSRF is not applicable
                // (tokens are in httpOnly cookies; the JWT itself is the CSRF defense)
                .ignoringRequestMatchers(
                    "/open311/v2/**",
                    "/auth/cas/**",
                    "/api/**"
                )
            )
            .authorizeHttpRequests(auth -> auth
                // === PUBLIC routes (no JWT required) — from TechArch §5.4 ===
                .requestMatchers(HttpMethod.GET,  "/open311/v2/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/open311/v2/requests").permitAll()  // api_key handled at controller level
                .requestMatchers(HttpMethod.POST, "/api/auth/ldap").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/dev-login").permitAll()  // dev profile only — endpoint is @Profile("dev")
                .requestMatchers(HttpMethod.GET,  "/auth/cas/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/refresh").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/logout").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/categories/public").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/tickets/public").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/geocode").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/actions").permitAll()  // action type reference data (non-sensitive)
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/actuator/health").permitAll()

                // === ADMIN-only routes ===
                .requestMatchers(HttpMethod.DELETE, "/api/people/**").hasRole("ADMIN")
                .requestMatchers("/api/departments/**").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers("/api/categories/**").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers("/api/category-groups/**").hasAnyRole("ADMIN", "STAFF")

                // === Ticket write routes — staff or admin ===
                .requestMatchers(HttpMethod.POST, "/api/tickets").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/tickets/**").hasAnyRole("STAFF", "ADMIN")

                // === All other /api/** — any authenticated user ===
                .requestMatchers("/api/**").authenticated()

                // Deny everything else
                .anyRequest().denyAll()
            )
            // JWT filter before Spring's UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            // Return 401 JSON (not HTML 302) for unauthenticated requests
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Authentication required\"}");
                })
                .accessDeniedHandler((request, response, deniedException) -> {
                    response.setStatus(403);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Forbidden\"}");
                })
            );

        return http.build();
    }

    /**
     * Prevent Spring Boot from auto-registering JwtAuthFilter as a servlet-level filter.
     * It must ONLY run inside the Spring Security filter chain (via addFilterBefore).
     * Auto-registration causes it to run BEFORE SecurityContextHolderFilter clears the context,
     * making SecurityContextHolder-based auth resolution fail in the chain.
     */
    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtAuthFilterRegistration(JwtAuthFilter filter) {
        FilterRegistrationBean<JwtAuthFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    /**
     * Prevent legacy JwtAuthenticationFilter from also running at the servlet level.
     * It uses PersonDetails (not CustomUserDetails) and would conflict with JwtAuthFilter.
     */
    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> jwtAuthenticationFilterRegistration(
            JwtAuthenticationFilter filter) {
        FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Allow React dev server (Vite default port 5173) and production origin
        config.setAllowedOriginPatterns(List.of("http://localhost:5173", "http://localhost:3000", "${CAS_SERVICE_URL:https://ureport.city.gov}"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("X-XSRF-TOKEN"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
