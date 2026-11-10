package com.workgo.order.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.order.dto.ApiResponse;
import com.workgo.order.exception.ErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

//chi service noi bo co dung X-Internal-Key moi goi duoc /internal/**
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class InternalKeyFilter extends OncePerRequestFilter {

    String internalKey;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getServletPath().startsWith("/internal/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String key = request.getHeader("X-Internal-Key");

        if (key == null || !MessageDigest.isEqual(
                key.getBytes(StandardCharsets.UTF_8),
                internalKey.getBytes(StandardCharsets.UTF_8))) {

            ErrorCode errorCode = ErrorCode.UNAUTHENTICATED;

            response.setStatus(errorCode.getStatusCode().value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            ApiResponse<?> apiResponse = ApiResponse.builder()
                    .code(errorCode.getCode())
                    .message(errorCode.getMessage())
                    .build();

            response.getWriter().write(new ObjectMapper().writeValueAsString(apiResponse));
            response.flushBuffer();
            return;
        }

        filterChain.doFilter(request, response);
    }

}
