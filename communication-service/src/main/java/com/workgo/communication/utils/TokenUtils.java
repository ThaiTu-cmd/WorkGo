package com.workgo.communication.utils;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.UUID;

@Component
public class TokenUtils {
    public UUID getCurrentUserId() {
        UUID userId = uuidClaim("userId");
        if (userId == null) throw new BadCredentialsException("Missing user identity");
        return userId;
    }

    public UUID getCurrentProviderId() {
        UUID providerId = getCurrentProviderIdOrNull();
        if (providerId == null) throw new AccessDeniedException("Provider identity required");
        return providerId;
    }

    public UUID getCurrentProviderIdOrNull() {
        return uuidClaim("providerId");
    }

    public boolean hasRole(String roleName) {
        Object scope = currentJwt().getClaims().get("scope");
        return scope instanceof String roles && Arrays.stream(roles.split("\\s+"))
                .anyMatch(role -> role.equals(roleName));
    }

    private UUID uuidClaim(String name) {
        Object claim = currentJwt().getClaims().get(name);
        if (claim == null || claim instanceof String value && value.isBlank()) return null;
        if (!(claim instanceof String value)) throw new BadCredentialsException("Invalid identity claim");
        try {
            UUID id = UUID.fromString(value);
            if (!id.toString().equalsIgnoreCase(value)) throw new IllegalArgumentException();
            return id;
        } catch (IllegalArgumentException exception) {
            throw new BadCredentialsException("Invalid identity claim", exception);
        }
    }

    private Jwt currentJwt() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new AuthenticationCredentialsNotFoundException("JWT authentication required");
        }
        return jwt;
    }
}
