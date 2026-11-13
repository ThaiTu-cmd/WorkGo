package com.workgo.communication.configuration;

import com.workgo.communication.dto.request.IntrospectRequest;
import com.workgo.communication.dto.response.ApiResponse;
import com.workgo.communication.dto.response.client.IntrospectResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Component
public class IdentityTokenIntrospector {
    private final RestClient client;

    public IdentityTokenIntrospector(@Value("${app.services.identity}") String url,
            @Value("${app.clients.connect-timeout-millis:2000}") int connectTimeout,
            @Value("${app.clients.read-timeout-millis:5000}") int readTimeout) {
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(connectTimeout)).followRedirects(HttpClient.Redirect.NEVER).build());
        factory.setReadTimeout(Duration.ofMillis(readTimeout));
        client = RestClient.builder().baseUrl(url).requestFactory(factory).build();
    }

    public boolean isValid(String token) {
        try {
            var response = client.post().uri("/auth/introspect").contentType(MediaType.APPLICATION_JSON)
                    .body(new IntrospectRequest(token)).retrieve()
                    .body(new ParameterizedTypeReference<ApiResponse<IntrospectResponse>>() { });
            return response != null && response.getCode() == 1000
                    && response.getResult() != null && response.getResult().valid();
        } catch (RuntimeException exception) {
            // Do not log credentials or client exceptions that can include request details.
            return false;
        }
    }
}
