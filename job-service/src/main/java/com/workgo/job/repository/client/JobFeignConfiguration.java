package com.workgo.job.repository.client;

import feign.Request;
import feign.Retryer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

import java.util.concurrent.TimeUnit;

// Intentionally not component-scanned: these beans belong only to named Feign contexts.
public class JobFeignConfiguration {
    @Bean
    public Request.Options requestOptions(
            @Value("${app.clients.connect-timeout-millis:2000}") int connectTimeoutMillis,
            @Value("${app.clients.read-timeout-millis:5000}") int readTimeoutMillis) {
        if (connectTimeoutMillis <= 0 || readTimeoutMillis <= 0) {
            throw new IllegalArgumentException("Feign timeouts must be positive");
        }
        return new Request.Options(connectTimeoutMillis, TimeUnit.MILLISECONDS,
                readTimeoutMillis, TimeUnit.MILLISECONDS, false);
    }

    @Bean
    public Retryer retryer() {
        // Order/outbox retries must be controlled by the worker, never implicit HTTP retries.
        return Retryer.NEVER_RETRY;
    }
}
