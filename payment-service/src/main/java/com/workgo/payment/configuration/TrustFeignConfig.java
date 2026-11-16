package com.workgo.payment.configuration;

import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import feign.Request;
import feign.RequestInterceptor;
import feign.Retryer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import java.util.concurrent.TimeUnit;

/** Restricted to the Trust client; not component-scanned into other Feign clients. */
public class TrustFeignConfig extends FeignInternalConfig {
    @Override @Bean
    RequestInterceptor internalKeyInterceptor(@Value("${app.internal-key:}") String key) {
        RequestInterceptor authenticated = super.internalKeyInterceptor(key);
        return template -> {
            if (key == null || key.isBlank()) {
                throw new AppException(ErrorCode.TRUST_SERVICE_UNAVAILABLE);
            }
            authenticated.apply(template);
        };
    }

    @Bean
    Request.Options trustOptions() {
        // Do not forward the service secret through a redirect to another host.
        return new Request.Options(2, TimeUnit.SECONDS, 5, TimeUnit.SECONDS, false);
    }

    @Bean
    Retryer trustRetryer() {
        return Retryer.NEVER_RETRY;
    }
}
