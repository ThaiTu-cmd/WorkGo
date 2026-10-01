package com.workgo.catalog.repository.httpclient;

import com.workgo.catalog.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "identity-service", url = "${app.service.identity.url}")
public interface IdentityClient {

    @GetMapping("/internal/providerProfile/{providerId}")
    ApiResponse<Object> getProviderProfile(@PathVariable UUID providerId);

}
