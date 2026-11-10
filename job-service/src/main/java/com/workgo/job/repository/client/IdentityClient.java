package com.workgo.job.repository.client;

import com.workgo.job.dto.response.client.ProviderProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "identity-service", contextId = "jobIdentityClient", url = "${app.services.identity}",
        configuration = {JobFeignConfiguration.class, IdentityFeignConfiguration.class})
public interface IdentityClient {
    @GetMapping("/internal/providers/{providerId}")
    ProviderProfileResponse getProviderProfile(@PathVariable("providerId") UUID providerId);
}
