package com.workgo.trust.service;

import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.*;

/** Trace data is untrusted metadata; it never grants a permission. */
public final class AuditContext {
    private AuditContext() {}
    public static String actorRole() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) throw new IllegalStateException("Verified audit actor required");
        return auth.getAuthorities().stream().map(a -> a.getAuthority())
            .filter(a -> java.util.Set.of("ROLE_CLIENT","ROLE_PROVIDER","ROLE_ADMIN","ROLE_SUPER_ADMIN").contains(a))
            .map(a -> a.substring(5)).sorted().collect(Collectors.joining(","));
    }
    public static String correlationId() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes a) {
            var request = a.getRequest();
            String cached = (String) request.getAttribute("workgo.correlationId");
            if (cached != null) return cached;
            String id = request.getHeader("X-Correlation-Id");
            if (id == null || !id.matches("[A-Za-z0-9-]{1,64}") || java.util.Collections.list(request.getHeaders("X-Correlation-Id")).size()!=1)
                id = UUID.randomUUID().toString();
            request.setAttribute("workgo.correlationId",id);
            return id;
        }
        return UUID.randomUUID().toString();
    }
}
