package com.workgo.trust.repository.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import feign.*;
import feign.codec.ErrorDecoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import java.util.concurrent.TimeUnit;

/** Feign child-context configuration only; never install its interceptor globally. */
public class TrustClientsConfiguration {
    @Bean public InternalKeyRequestInterceptor internalKeyRequestInterceptor(
            @Value("${app.internal-api-key:}") String key) {
        return new InternalKeyRequestInterceptor(key);
    }

    @Bean public Request.Options requestOptions(
            @Value("${app.clients.connect-timeout-millis:2000}") int connectMillis,
            @Value("${app.clients.read-timeout-millis:5000}") int readMillis) {
        if (connectMillis <= 0 || readMillis <= 0) throw new IllegalArgumentException("Client timeouts must be positive");
        // Do not forward an internal credential through a dependency redirect.
        return new Request.Options(connectMillis, TimeUnit.MILLISECONDS, readMillis, TimeUnit.MILLISECONDS, false);
    }

    @Bean public Retryer retryer() { return Retryer.NEVER_RETRY; }

    @Bean public ErrorDecoder errorDecoder(ObjectMapper mapper) {
        return (method, response) -> {
            Integer remoteCode = null;
            if (response.body() != null) {
                try (var stream = response.body().asInputStream()) {
                    // Bound diagnostic reads; never retain or expose remote response bodies.
                    var code = mapper.readTree(stream.readNBytes(8192)).path("code");
                    if (code.canConvertToInt()) remoteCode = code.intValue();
                } catch (Exception ignored) { /* Non-JSON errors still retain their HTTP status. */ }
            }
            return new TrustClientException(response.status(), remoteCode);
        };
    }
}
