package com.workgo.communication.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.communication.dto.response.ApiResponse;
import com.workgo.communication.exception.ErrorCode;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.*;
import java.nio.charset.StandardCharsets;

/** Metadata-only requests have a byte limit independent of uploaded file sizes, including chunked bodies. */
@Component
public class JsonBodyLimitFilter extends OncePerRequestFilter {
    private final int maxBytes;
    private final ObjectMapper json;

    public JsonBodyLimitFilter(@Value("${app.http.max-json-body-bytes:65536}") int maxBytes, ObjectMapper json) {
        if (maxBytes < 1 || maxBytes == Integer.MAX_VALUE) throw new IllegalArgumentException("Invalid JSON body limit");
        this.maxBytes = maxBytes;
        this.json = json;
    }

    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (!("POST".equals(request.getMethod()) || "PUT".equals(request.getMethod()) || "PATCH".equals(request.getMethod()))) {
            chain.doFilter(request, response); return;
        }
        byte[] body = request.getInputStream().readNBytes(maxBytes + 1);
        if (body.length > maxBytes) {
            response.setStatus(413); response.setContentType("application/json"); response.setCharacterEncoding("UTF-8");
            json.writeValue(response.getOutputStream(), ApiResponse.<Void>builder().code(ErrorCode.INVALID_REQUEST.getCode())
                    .message(ErrorCode.INVALID_REQUEST.getMessage()).build());
            return;
        }
        chain.doFilter(new HttpServletRequestWrapper(request) {
            @Override public ServletInputStream getInputStream() {
                var input = new ByteArrayInputStream(body);
                return new ServletInputStream() {
                    @Override public int read() { return input.read(); }
                    @Override public int read(byte[] bytes, int offset, int length) { return input.read(bytes, offset, length); }
                    @Override public boolean isFinished() { return input.available() == 0; }
                    @Override public boolean isReady() { return true; }
                    @Override public void setReadListener(ReadListener listener) { throw new UnsupportedOperationException("Synchronous JSON requests only"); }
                };
            }
            @Override public BufferedReader getReader() {
                return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
            }
        }, response);
    }
}
