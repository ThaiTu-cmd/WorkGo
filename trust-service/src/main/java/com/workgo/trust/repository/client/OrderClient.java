package com.workgo.trust.repository.client;

import com.workgo.trust.dto.response.client.InternalOrderTrustSnapshot;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@FeignClient(name="trustOrderClient", url="${app.services.order}", configuration=TrustClientsConfiguration.class)
public interface OrderClient {
    @GetMapping("/internal/orders/{orderId}/payment-info")
    com.workgo.trust.dto.response.client.OrderPaymentInfo paymentInfo(@PathVariable("orderId") UUID id);
    @PostMapping("/internal/orders/{orderId}/dispute-decision")
    com.workgo.trust.dto.response.client.AppliedDecisionResult applyDecision(@PathVariable("orderId") UUID id,
            @RequestBody com.workgo.trust.dto.request.client.ApplyDecisionCommand command);
    @GetMapping("/internal/orders/{orderId}")
    InternalOrderTrustSnapshot getOrderSnapshot(@PathVariable("orderId") UUID orderId);
}
