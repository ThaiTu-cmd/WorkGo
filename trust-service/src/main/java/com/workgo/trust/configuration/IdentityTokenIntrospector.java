package com.workgo.trust.configuration;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import java.net.http.HttpClient;
import java.time.Duration;

/** No cache: Identity validates signature, expiry, account state and authorization version per request. */
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
        try { return verify(token); } catch (RuntimeException unavailable) { return false; }
    }
    public boolean verify(String token) {
        try {
            var response = client.post().uri("/auth/introspect").contentType(MediaType.APPLICATION_JSON)
                    .body(new Request(token)).retrieve()
                    .onStatus(status -> !status.is2xxSuccessful(), (request, reply) -> { throw new IdentityUnavailableException(); })
                    .body(Response.class);
            if (response == null || response.code() != 1000 || response.result() == null || response.result().valid() == null) {
                throw new IdentityUnavailableException();
            }
            return response.result().valid();
        } catch (RuntimeException exception) {
            throw new IdentityUnavailableException();
        }
    }
    private record Request(String token) {}
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true) private record Response(int code, Result result) {}
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true) private record Result(Boolean valid) {}
}
