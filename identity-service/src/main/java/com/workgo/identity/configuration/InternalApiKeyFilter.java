package com.workgo.identity.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.dto.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

public class InternalApiKeyFilter extends OncePerRequestFilter {
    private final String internalApiKey;
    private final ObjectMapper objectMapper;

    public InternalApiKeyFilter(String internalApiKey, ObjectMapper objectMapper) {
        this.internalApiKey = internalApiKey;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String suppliedKey = request.getHeader("X-Internal-Key");
        if (internalApiKey == null || internalApiKey.isBlank() || suppliedKey == null
                || !MessageDigest.isEqual(internalApiKey.getBytes(StandardCharsets.UTF_8),
                        suppliedKey.getBytes(StandardCharsets.UTF_8))) {
            SecurityContextHolder.clearContext();
            ErrorCode error = ErrorCode.UNAUTHENTICATED;
            response.setStatus(error.getStatusCode().value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getOutputStream(), ApiResponse.builder()
                    .code(error.getCode()).message(error.getMessage()).build());
            return;
        }
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken("internal-service", null,
                List.of(new SimpleGrantedAuthority("INTERNAL_SERVICE"))));
        SecurityContextHolder.setContext(context);
        filterChain.doFilter(request, response);
    }
}
