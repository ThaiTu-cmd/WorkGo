package com.workgo.payment.configuration;

import feign.RequestInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

public class FeignInternalConfig {

    @Bean
    RequestInterceptor internalKeyInterceptor(@Value("${app.internal-key}") String internalKey) {
        return template -> template.header("X-Internal-Key", internalKey);
    }

}
