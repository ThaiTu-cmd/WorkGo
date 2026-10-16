package com.workgo.order.reppository.client;

import com.workgo.order.dto.response.client.ProviderProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "identity-service", url = "${app.services.identity}")
public interface IdentityClient {

    @GetMapping("/internal/providers/{providerId}")
    ProviderProfileResponse getProviderProfile(@PathVariable UUID providerId);

}
