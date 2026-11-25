package com.workgo.order.controller.internal;

import com.workgo.order.dto.request.ApplyDecisionCommand;
import com.workgo.order.dto.request.PaymentConfirmedRequest;
import com.workgo.order.dto.response.AppliedDecisionResult;
import com.workgo.order.dto.response.InternalOrderTrustSnapshot;
import com.workgo.order.dto.response.OrderPaymentInfoResponse;
import com.workgo.order.dto.response.PaymentConfirmationResponse;
import com.workgo.order.service.DisputeDecisionApplicationService;
import com.workgo.order.service.OrderService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/internal/orders")
public class InternalOrderController {

    OrderService orderService;
    com.workgo.order.service.DeadlinePolicyService deadlinePolicyService;
    DisputeDecisionApplicationService disputeDecisionApplicationService;

    @PostMapping("/{orderId}/timer/pause")
    com.workgo.order.service.DeadlinePolicyService.TimerAck pause(@PathVariable UUID orderId,
            @RequestBody com.workgo.order.service.DeadlinePolicyService.PauseCommand c) {
        return deadlinePolicyService.pause(orderId,c.sourceType(),c.sourceId(),c.expectedVersion());
    }
    @PostMapping("/{orderId}/timer/resume")
    com.workgo.order.service.DeadlinePolicyService.TimerAck resume(@PathVariable UUID orderId,
            @RequestBody com.workgo.order.service.DeadlinePolicyService.ResumeCommand c) {
        return deadlinePolicyService.resume(orderId,c.sourceType(),c.sourceId(),c.resumeCommandId(),c.requireNewDelivery(),c.expectedVersion());
    }

    @GetMapping("/{orderId}")
    InternalOrderTrustSnapshot getTrustSnapshot(
            @PathVariable UUID orderId) {
        return orderService.getTrustSnapshot(orderId);
    }

    @GetMapping("/{orderId}/payment-info")
    OrderPaymentInfoResponse getPaymentInfo(
            @PathVariable UUID orderId) {
        return orderService.getPaymentInfo(orderId);
    }

    //trust ap phan quyet sau khi payment da chot tien; chi service noi bo co internal key goi duoc
    @PostMapping("/{orderId}/dispute-decision")
    AppliedDecisionResult applyDecision(
            @PathVariable UUID orderId,
            @RequestBody ApplyDecisionCommand command) {
        return disputeDecisionApplicationService.apply(orderId, command);
    }

    @PostMapping("/{orderId}/payment-confirmed")
    PaymentConfirmationResponse<Object> confirmPayment(
            @PathVariable UUID orderId,
            @RequestBody PaymentConfirmedRequest request) {
        return orderService.confirmPayment(orderId, request);
    }

}
