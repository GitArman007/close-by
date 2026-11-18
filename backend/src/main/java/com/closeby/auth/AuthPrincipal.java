package com.closeby.auth;

import com.closeby.common.CloseByException;

import java.util.UUID;

/**
 * Immutable authenticated identity populated strictly from verified JWT claims.
 * Service methods must derive userId and clinicId exclusively from this principal.
 */
public record AuthPrincipal(
        UUID userId,
        String email,
        String fullName,
        UserRole role,
        UUID clinicId
) {
    public UUID requireClinicId() {
        if (clinicId == null) {
            throw CloseByException.forbidden("Clinic scope is required for this operation.");
        }
        return clinicId;
    }

    public void requireRole(UserRole... allowedRoles) {
        for (UserRole allowed : allowedRoles) {
            if (this.role == allowed) {
                return;
            }
        }
        throw CloseByException.forbidden("Your role does not permit this operation.");
    }
}
