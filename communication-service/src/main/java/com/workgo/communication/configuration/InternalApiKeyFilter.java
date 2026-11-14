package com.workgo.communication.configuration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

final class InternalApiKeyFilter extends OncePerRequestFilter {
    private final byte[] internalKey;
    private final JwtAuthenticationEntryPoint entryPoint;

    InternalApiKeyFilter(String internalKey, JwtAuthenticationEntryPoint entryPoint) {
        this.internalKey = internalKey.isBlank() ? new byte[0] : internalKey.getBytes(StandardCharsets.UTF_8);
        this.entryPoint = entryPoint;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String suppliedKey = request.getHeader("X-Internal-Key");
        if (internalKey.length == 0 || suppliedKey == null
                || !MessageDigest.isEqual(internalKey, suppliedKey.getBytes(StandardCharsets.UTF_8))) {
            entryPoint.commence(request, response, new BadCredentialsException("Invalid internal credentials"));
            return;
        }
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new PreAuthenticatedAuthenticationToken("internal-service", null,
                List.of(new SimpleGrantedAuthority("INTERNAL_SERVICE"))));
        SecurityContextHolder.setContext(context);
        chain.doFilter(request, response);
    }
}
