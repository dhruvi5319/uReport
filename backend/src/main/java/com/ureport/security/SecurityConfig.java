package com.ureport.security;

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
                // Open311 endpoints and GET /auth/cas/** are CSRF-exempt
                .ignoringRequestMatchers(
                    "/open311/v2/**",
                    "/auth/cas/**",
                    "/api/auth/ldap",
                    "/api/auth/refresh",
                    "/api/auth/logout"
                )
            )
            .authorizeHttpRequests(auth -> auth
                // === PUBLIC routes (no JWT required) — from TechArch §5.4 ===
                .requestMatchers(HttpMethod.GET,  "/open311/v2/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/open311/v2/requests").permitAll()  // api_key handled at controller level
                .requestMatchers(HttpMethod.POST, "/api/auth/ldap").permitAll()
                .requestMatchers(HttpMethod.GET,  "/auth/cas/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/refresh").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/logout").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/categories/public").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/tickets/public").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/geocode").permitAll()
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/actuator/health").permitAll()

                // === ADMIN-only routes ===
                .requestMatchers(HttpMethod.DELETE, "/api/people/**").hasRole("ADMIN")
                .requestMatchers("/api/departments/**").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers("/api/categories/**").hasAnyRole("ADMIN", "STAFF")

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
