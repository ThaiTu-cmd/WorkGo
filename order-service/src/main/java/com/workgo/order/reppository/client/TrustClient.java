package com.workgo.order.reppository.client;

import com.workgo.order.dto.ApiResponse;
import com.workgo.order.dto.request.OrderCompletedEvent;
import com.workgo.order.dto.response.client.TrustDisputeStatus;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@FeignClient(name = "trust-service", contextId = "orderTrustClient", url = "${app.services.trust}",
        configuration = InternalFeignConfiguration.class)
public interface TrustClient {
    record RewardCommit(UUID orderId,UUID providerId,UUID clientId,String quoteRef,java.time.Instant confirmedAt){}
    record RewardCommitAck(UUID orderId,String quoteRef){}
    @PostMapping("/internal/rewards/commit") ApiResponse<RewardCommitAck> commitReward(@RequestBody RewardCommit command);
    record Score(UUID providerId,int score,String policyVersion) {}
    @GetMapping("/internal/providers/{id}/reputation")
    ApiResponse<Score> reputation(@PathVariable UUID id);
    @PostMapping("/internal/events/order-completed")
    ApiResponse<Void> orderCompleted(@RequestBody OrderCompletedEvent event);

    @GetMapping("/internal/orders/{orderId}/dispute-status")
    TrustDisputeStatus disputeStatus(@PathVariable("orderId") UUID orderId);
}
