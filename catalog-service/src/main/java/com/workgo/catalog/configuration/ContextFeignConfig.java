package com.workgo.catalog.configuration;
import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;
public class ContextFeignConfig {
    @Bean RequestInterceptor contextKey(@Value("${app.internal-key:}") String key){return t->t.header("X-Internal-Key",key);}
}
