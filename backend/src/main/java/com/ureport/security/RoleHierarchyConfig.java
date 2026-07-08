package com.ureport.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.web.access.expression.DefaultWebSecurityExpressionHandler;

@Configuration
public class RoleHierarchyConfig {

    /**
     * Define role hierarchy: ROLE_ADMIN implies ROLE_STAFF implies ROLE_PUBLIC.
     *
     * This means:
     * - ADMIN can access routes restricted to ADMIN, STAFF, or PUBLIC
     * - STAFF can access routes restricted to STAFF or PUBLIC (not ADMIN-only)
     * - PUBLIC can only access routes restricted to PUBLIC (unauthenticated)
     */
    @Bean
    public RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.withDefaultRolePrefix()
                .role("ADMIN").implies("STAFF")
                .role("STAFF").implies("PUBLIC")
                .build();
    }

    /**
     * Register the role hierarchy with the web security expression handler
     * so that hasRole() / hasAnyRole() expressions in SecurityConfig and
     * @PreAuthorize annotations respect the hierarchy.
     */
    @Bean
    public DefaultWebSecurityExpressionHandler webSecurityExpressionHandler() {
        DefaultWebSecurityExpressionHandler handler = new DefaultWebSecurityExpressionHandler();
        handler.setRoleHierarchy(roleHierarchy());
        return handler;
    }
}
