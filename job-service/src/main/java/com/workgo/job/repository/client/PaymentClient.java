package com.workgo.job.repository.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@FeignClient(name="jobPaymentClient", url="${app.services.payment:http://localhost:8084/payment}",
        configuration={JobFeignConfiguration.class,InternalKeyFeignConfiguration.class})
public interface PaymentClient {
    @JsonIgnoreProperties(ignoreUnknown=true)
    record Eligibility(UUID userId, long balance, long outstandingFee, boolean mayStartNewWork) {}
    @GetMapping("/internal/providers/{providerId}/financial-eligibility")
    Eligibility eligibility(@PathVariable("providerId") UUID providerId);
}
