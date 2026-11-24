package com.workgo.catalog.configuration;

import feign.Request;
import feign.Retryer;
import org.springframework.context.annotation.Bean;
import java.util.concurrent.TimeUnit;

// Scoped by @FeignClient; not component-scanned as a global Feign configuration.
public class IdentityFeignConfig {
    @Bean public Request.Options identityOptions() { return new Request.Options(2, TimeUnit.SECONDS, 5, TimeUnit.SECONDS, false); }
    @Bean public Retryer identityRetryer() { return Retryer.NEVER_RETRY; }
}
