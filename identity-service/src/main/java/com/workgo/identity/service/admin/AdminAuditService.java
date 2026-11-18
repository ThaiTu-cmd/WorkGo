package com.workgo.identity.service.admin;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.identity.Exception.AppException;
import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.entity.AdminActionLog;
import com.workgo.identity.repository.AdminActionLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AdminAuditService {

    static Pattern REQUEST_ID = Pattern.compile("[A-Za-z0-9-]{1,64}");

    AdminActionLogRepository adminActionLogRepository;
    ObjectMapper objectMapper;

    //chi chay trong transaction cua lenh nghiep vu, loi ghi log thi rollback ca lenh
    @Transactional(propagation = Propagation.MANDATORY)
    public void record(AdminAction action) {

        Authentication authentication = loadAuthentication();
        Jwt jwt = (Jwt) authentication.getPrincipal();

        adminActionLogRepository.save(AdminActionLog.builder()
                .actorId(UUID.fromString(jwt.getClaimAsString("userId")))
                .actorRole(actorRole(authentication))
                .action(action.getAction().name())
                .targetType(action.getTargetType())
                .targetId(action.getTargetId().toString())
                .reason(action.getReason())
                .beforeState(toJson(action.getBeforeState()))
                .afterState(toJson(action.getAfterState()))
                .correlationId(correlationId())
                .build());
    }

    //=====================================

    private Authentication loadAuthentication() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)
                || jwt.getClaimAsString("userId") == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return authentication;
    }

    private String actorRole(Authentication authentication) {

        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring(5))
                .sorted()
                .collect(Collectors.joining(","));
    }

    private String correlationId() {

        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            HttpServletRequest request = attributes.getRequest();
            String requestId = request.getHeader("X-Request-Id");

            if (requestId != null && REQUEST_ID.matcher(requestId).matches()) return requestId;
        }

        return UUID.randomUUID().toString();
    }

    private String toJson(Object value) {

        if (value == null) return null;

        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Cannot write admin audit state", e);
        }
    }
}
