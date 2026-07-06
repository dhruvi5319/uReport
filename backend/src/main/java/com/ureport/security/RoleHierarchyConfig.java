package com.ureport.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;

@Configuration
public class RoleHierarchyConfig {

    /**
     * Define role hierarchy: ROLE_ADMIN implies ROLE_STAFF implies ROLE_PUBLIC.
     *
     * This means:
     * - ADMIN can access routes restricted to ADMIN, STAFF, or PUBLIC
     * - STAFF can access routes restricted to STAFF or PUBLIC (not ADMIN-only)
     * - PUBLIC can only access routes restricted to PUBLIC (unauthenticated)
     *
     * Spring Security 6.x automatically picks up a RoleHierarchy bean from the
     * application context and injects it into the DefaultWebSecurityExpressionHandler —
     * no manual handler registration is needed (and would cause a bean name conflict
     * with WebSecurityConfiguration's own webSecurityExpressionHandler registration).
     */
    @Bean
    public RoleHierarchy roleHierarchy() {
        RoleHierarchyImpl hierarchy = new RoleHierarchyImpl();
        // ROLE_ADMIN > ROLE_STAFF > ROLE_PUBLIC
        hierarchy.setHierarchy("ROLE_ADMIN > ROLE_STAFF > ROLE_PUBLIC");
        return hierarchy;
    }
}
