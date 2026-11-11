package com.workgo.payment.configuration;

import feign.RequestInterceptor;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

public class FeignInternalConfig {

    @Bean
    RequestInterceptor internalKeyInterceptor(@Value("${app.internal-key}") String internalKey) {
        return template -> template.header("X-Internal-Key", internalKey);
    }

    //chuyen tiep requestId sang service kia de noi log 2 ben
    @Bean
    RequestInterceptor requestIdInterceptor() {
        return template -> {
            String requestId = MDC.get(RequestIdFilter.MDC_KEY);
            if (requestId != null) {
                template.header(RequestIdFilter.HEADER, requestId);
            }
        };
    }

}
