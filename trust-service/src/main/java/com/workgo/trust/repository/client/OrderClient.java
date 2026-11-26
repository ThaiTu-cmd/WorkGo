package com.workgo.trust.repository.client;

import com.workgo.trust.dto.response.client.InternalOrderTrustSnapshot;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@FeignClient(name="trustOrderClient", url="${app.services.order}", configuration=TrustClientsConfiguration.class)
public interface OrderClient {
    record RewardAgreement(UUID orderId,UUID providerId,UUID clientId,String quoteRef,String scope,
            java.math.BigDecimal price,Integer durationDays,java.time.Instant confirmedAt,String paymentStatus,String orderStatus,UUID recoveryGrantId) {
        public RewardAgreement(UUID orderId,UUID providerId,UUID clientId,String quoteRef,String scope,java.math.BigDecimal price,Integer durationDays,java.time.Instant confirmedAt,String paymentStatus,String orderStatus){this(orderId,providerId,clientId,quoteRef,scope,price,durationDays,confirmedAt,paymentStatus,orderStatus,null);}
    }
    record RecoverySuccess(UUID orderId,UUID clientId,UUID recoveryGrantId,String paymentStatus){}
    record AdmissionStats(UUID providerId,long activeOrders,java.util.List<UUID> consumedRecoveryGrants,java.util.List<RecoverySuccess> successfulRecoveries){}
    @GetMapping("/internal/providers/{id}/admission-stats") AdmissionStats admissionStats(@PathVariable UUID id);
    @GetMapping("/internal/orders/{id}/reward-agreement")
    RewardAgreement rewardAgreement(@PathVariable UUID id);
    @PostMapping("/internal/orders/{orderId}/dispute-decision")
    com.workgo.trust.dto.response.client.AppliedDecisionResult applyCashDecision(@PathVariable("orderId") UUID id,
            @RequestBody com.workgo.trust.dto.request.client.CashDecisionCommand command);
    @PostMapping("/internal/orders/{orderId}/timer/pause")
    com.workgo.trust.dto.response.client.TimerAck pauseTimer(@PathVariable("orderId") UUID orderId,
            @RequestBody com.workgo.trust.dto.request.client.TimerPauseCommand command);
    @PostMapping("/internal/orders/{orderId}/timer/resume")
    com.workgo.trust.dto.response.client.TimerAck resumeTimer(@PathVariable("orderId") UUID orderId,
            @RequestBody com.workgo.trust.dto.request.client.TimerResumeCommand command);
    @GetMapping("/internal/orders/{orderId}/payment-info")
    com.workgo.trust.dto.response.client.OrderPaymentInfo paymentInfo(@PathVariable("orderId") UUID id);
    @PostMapping("/internal/orders/{orderId}/dispute-decision")
    com.workgo.trust.dto.response.client.AppliedDecisionResult applyDecision(@PathVariable("orderId") UUID id,
            @RequestBody com.workgo.trust.dto.request.client.ApplyDecisionCommand command);
    @GetMapping("/internal/orders/{orderId}")
    InternalOrderTrustSnapshot getOrderSnapshot(@PathVariable("orderId") UUID orderId);
}
