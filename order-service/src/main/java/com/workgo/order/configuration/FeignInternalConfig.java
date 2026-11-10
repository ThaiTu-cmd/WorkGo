package com.workgo.order.configuration;

import feign.RequestInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

//khong gan @Configuration de chi ap dung cho client nao khai bao (PaymentClient)
public class FeignInternalConfig {

    @Bean
    RequestInterceptor internalKeyInterceptor(@Value("${app.internal-key}") String internalKey) {
        return template -> template.header("X-Internal-Key", internalKey);
    }

}
