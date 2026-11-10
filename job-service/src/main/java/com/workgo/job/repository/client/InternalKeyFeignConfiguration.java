package com.workgo.job.repository.client;

import feign.RequestInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

// Scoped to named Feign contexts; never component-scanned into public clients.
public class InternalKeyFeignConfiguration {
    @Bean
    public RequestInterceptor internalKeyInterceptor(@Value("${app.internal-api-key:}") String internalKey) {
        return template -> {
            if (internalKey == null || internalKey.isBlank()) {
                throw new IllegalStateException("Internal API key is not configured");
            }
            template.header("X-Internal-Key", internalKey);
        };
    }
}
