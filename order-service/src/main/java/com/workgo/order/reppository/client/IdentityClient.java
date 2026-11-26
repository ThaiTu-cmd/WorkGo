package com.workgo.order.reppository.client;

import com.workgo.order.dto.ApiResponse;
import com.workgo.order.dto.request.IntrospectRequest;
import com.workgo.order.dto.response.client.IntrospectResponse;
import com.workgo.order.dto.response.client.ProviderProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.UUID;

@FeignClient(name = "identity-service", contextId = "orderIdentityClient", url = "${app.services.identity}",
        configuration = InternalFeignConfiguration.class)
public interface IdentityClient {
    record Admission(UUID providerId,boolean mayReceiveNewOrders,boolean payoutAllowed,long sourceVersion,UUID recoveryGrantId) {}
    @GetMapping("/internal/providers/{id}/admission")
    Admission admission(@PathVariable UUID id);

    @GetMapping("/internal/providers/{providerId}")
    ProviderProfileResponse getProviderProfile(@PathVariable UUID providerId);

    @PostMapping("/auth/introspect")
    ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request);

}
