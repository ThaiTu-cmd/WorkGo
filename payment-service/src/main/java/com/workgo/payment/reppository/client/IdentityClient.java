package com.workgo.payment.reppository.client;

import com.workgo.payment.dto.ApiResponse;
import com.workgo.payment.dto.request.IntrospectRequest;
import com.workgo.payment.dto.response.client.IntrospectResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(configuration = com.workgo.payment.configuration.IdentityFeignConfig.class, name = "identity-service", contextId = "paymentIdentityClient", url = "${app.services.identity}")
public interface IdentityClient {

    @PostMapping("/auth/introspect")
    ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request);
}
