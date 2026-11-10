package com.workgo.order.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.order.dto.ApiResponse;
import com.workgo.order.exception.ErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

final class InternalApiKeyFilter extends OncePerRequestFilter {
    private final byte[] key;
    private final ObjectMapper mapper;
    InternalApiKeyFilter(String key, ObjectMapper mapper) {
        this.key = key == null || key.isBlank() ? new byte[0] : key.getBytes(StandardCharsets.UTF_8);
        this.mapper = mapper;
    }
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String supplied = request.getHeader("X-Internal-Key");
        if (key.length == 0 || supplied == null || !MessageDigest.isEqual(key, supplied.getBytes(StandardCharsets.UTF_8))) {
            var error = ErrorCode.UNAUTHENTICATED;
            response.setStatus(error.getStatusCode().value());
            response.setContentType("application/json"); response.setCharacterEncoding("UTF-8");
            mapper.writeValue(response.getWriter(), ApiResponse.builder().code(error.getCode()).message(error.getMessage()).build());
            return;
        }
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new PreAuthenticatedAuthenticationToken("internal-service", null,
                List.of(new SimpleGrantedAuthority("INTERNAL_SERVICE"))));
        SecurityContextHolder.setContext(context);
        chain.doFilter(request, response);
    }
}
