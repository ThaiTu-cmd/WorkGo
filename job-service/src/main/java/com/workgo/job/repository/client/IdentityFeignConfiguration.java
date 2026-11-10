package com.workgo.job.repository.client;

import feign.RequestInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

// No @Configuration: prevents the internal credential interceptor leaking to CatalogClient.
public class IdentityFeignConfiguration {
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
