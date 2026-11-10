package com.workgo.order.reppository.client;

import feign.Request;
import feign.RequestInterceptor;
import feign.Retryer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import java.util.concurrent.TimeUnit;

// Imported only into the named internal clients, never component-scanned globally.
public class InternalFeignConfiguration {
    @Bean
    public RequestInterceptor internalKeyInterceptor(@Value("${app.internal-key:}") String key) {
        return request -> {
            if (key == null || key.isBlank()) throw new IllegalStateException("Internal API key is not configured");
            request.header("X-Internal-Key", key);
        };
    }

    @Bean
    public Request.Options internalRequestOptions(
            @Value("${app.clients.connect-timeout-millis:2000}") int connect,
            @Value("${app.clients.read-timeout-millis:5000}") int read) {
        if (connect <= 0 || read <= 0) throw new IllegalArgumentException("Feign timeouts must be positive");
        return new Request.Options(connect, TimeUnit.MILLISECONDS, read, TimeUnit.MILLISECONDS, false);
    }

    @Bean
    public Retryer internalRetryer() { return Retryer.NEVER_RETRY; }
}
