package com.workgo.payment.reppository.client;
import com.workgo.payment.configuration.TrustFeignConfig;
import com.workgo.payment.dto.response.client.TrustDisputeStatusResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.UUID;
@FeignClient(name = "trust-service", url = "${app.services.trust}", configuration = TrustFeignConfig.class)
public interface TrustClient {
    @GetMapping("/internal/orders/{orderId}/dispute-status")
    TrustDisputeStatusResponse getDisputeStatus(@PathVariable UUID orderId);
}
