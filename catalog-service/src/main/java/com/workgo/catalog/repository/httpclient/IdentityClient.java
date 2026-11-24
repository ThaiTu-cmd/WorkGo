package com.workgo.catalog.repository.httpclient;

import com.workgo.catalog.dto.ApiResponse;
import com.workgo.catalog.dto.request.IntrospectRequest;
import com.workgo.catalog.dto.response.IntrospectResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.UUID;

@FeignClient(configuration = com.workgo.catalog.configuration.IdentityFeignConfig.class, name = "identity-service", url = "${app.service.identity.url}")
public interface IdentityClient {

    @GetMapping("/internal/providerProfile/{providerId}")
    ApiResponse<Object> getProviderProfile(@PathVariable UUID providerId);

    @PostMapping("/auth/introspect")
    ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request);

}
