package com.workgo.trust.repository.client;

import com.workgo.trust.dto.response.client.InternalOrderTrustSnapshot;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@FeignClient(name="trustOrderClient", url="${app.services.order}", configuration=TrustClientsConfiguration.class)
public interface OrderClient {
    @GetMapping("/internal/orders/{orderId}")
    InternalOrderTrustSnapshot getOrderSnapshot(@PathVariable("orderId") UUID orderId);
}
