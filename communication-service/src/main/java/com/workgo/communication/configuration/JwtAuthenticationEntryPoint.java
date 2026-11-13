package com.workgo.communication.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.communication.dto.response.ApiResponse;
import com.workgo.communication.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {
    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
            throws IOException {
        write(response, ErrorCode.UNAUTHENTICATED);
    }

    public void write(HttpServletResponse response, ErrorCode error) throws IOException {
        response.setStatus(error.getStatusCode().value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getOutputStream(), ApiResponse.builder()
                .code(error.getCode()).message(error.getMessage()).build());
    }
}
