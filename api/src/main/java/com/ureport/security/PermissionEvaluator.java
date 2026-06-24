package com.ureport.security;

import org.springframework.stereotype.Component;

@Component
public class PermissionEvaluator {

    // Role hierarchy: anonymous(0) < public(1) < staff(2)
    private int rankOf(String role) {
        return switch (role == null ? "anonymous" : role.toLowerCase()) {
            case "staff" -> 2;
            case "public" -> 1;
            default -> 0;
        };
    }

    /**
     * Returns true if the caller's role satisfies the required permission level.
     * Used for per-category displayPermissionLevel and postingPermissionLevel checks.
     */
    public boolean isAllowed(String callerRole, String requiredLevel) {
        return rankOf(callerRole) >= rankOf(requiredLevel);
    }

    /** Returns true if caller is staff. */
    public boolean isStaff(String callerRole) {
        return "staff".equalsIgnoreCase(callerRole);
    }
}
