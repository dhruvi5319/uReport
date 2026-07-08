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
     * Spring Security 3.x auto-picks up a RoleHierarchy bean and wires it
     * into the expression handler; registering a separate webSecurityExpressionHandler
     * bean causes a BeanDefinitionOverrideException with Spring's own registration.
     */
    @Bean
    public RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.withDefaultRolePrefix()
                .role("ADMIN").implies("STAFF")
                .role("STAFF").implies("PUBLIC")
                .build();
    }
}
