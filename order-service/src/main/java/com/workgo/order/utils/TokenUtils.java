package com.workgo.order.utils;


import com.workgo.order.entity.Order;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Arrays;
import java.util.UUID;

@Component
public class TokenUtils {

    public UUID getCurrentProviderId() {
        UUID providerId = getCurrentProviderIdOrNull();

        if (providerId == null) throw new AppException(ErrorCode.UNAUTHENTICATED);

        return providerId;
    }

    public UUID getCurrentProviderIdOrNull() {
        Jwt jwt = currentJwt();
        String providerId = jwt.getClaimAsString("providerId");

        if (providerId == null || providerId.isBlank()) return null;

        return UUID.fromString(providerId);
    }

    public UUID getCurrentUserId(){
        Jwt jwt = currentJwt();
        String userId = jwt.getClaimAsString("userId");

        if(userId == null) throw new AppException(ErrorCode.UNAUTHENTICATED);

        return UUID.fromString(userId);

    }

    public boolean hasRole(String roleName) {
        Jwt jwt = currentJwt();
        String scope = jwt.getClaimAsString("scope");

        if (scope == null || scope.isBlank()) return false;

        return Arrays.stream(scope.split("\\s+"))
                .anyMatch(roleName::equals);
    }

    public int createDeletedMark(){

        int mark = Instant.now().getNano() * 1000;

        return mark;

    }

    private Jwt currentJwt() {
        return (Jwt) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
    }

    public void assertParticipant(Order order) {

        UUID userId = getCurrentUserId();

        if (userId.equals(order.getClientId())) {
            return;
        }

        UUID providerId = getCurrentProviderIdOrNull();

        if (providerId != null && providerId.equals(order.getProviderId())) {
            return;
        }

        throw new AppException(ErrorCode.ORDER_NOT_FOUND);
    }

}