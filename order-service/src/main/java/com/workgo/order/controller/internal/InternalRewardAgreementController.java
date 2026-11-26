package com.workgo.order.controller.internal;
import com.workgo.order.reppository.*;
import com.workgo.order.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.time.Instant;
import java.math.BigDecimal;
@RestController @RequiredArgsConstructor @RequestMapping("/internal/orders")
public class InternalRewardAgreementController {
    private final OrderRepository orders;
    private final OrderAgreementVersionRepository agreements;
    private final RewardCommitOutboxRepository commits;
    public record Agreement(UUID orderId,UUID providerId,UUID clientId,String quoteRef,String scope,
                            BigDecimal price,Integer durationDays,Instant confirmedAt,String paymentStatus,String orderStatus,UUID recoveryGrantId) {}
    @GetMapping("/{id}/reward-agreement")
    public Agreement get(@PathVariable UUID id) {
        var order=orders.findById(id).orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));
        var a=agreements.findTopByOrderIdOrderByVersionNoDesc(id).orElseThrow(()->new AppException(ErrorCode.ORDER_INPUTS_STALE));
        var confirmed=a.getProviderConfirmedAt()==null||a.getClientConfirmedAt()==null?null:
                (a.getProviderConfirmedAt().isAfter(a.getClientConfirmedAt())?a.getProviderConfirmedAt():a.getClientConfirmedAt());
        confirmed=commits.findFirstByOrderIdAndQuoteRef(id,a.getRewardQuoteRef()).map(com.workgo.order.entity.RewardCommitOutbox::getConfirmedAt).orElse(order.getConfirmedAt());
        return new Agreement(id,order.getProviderId(),order.getClientId(),a.getRewardQuoteRef(),a.getScope(),a.getPrice(),a.getDurationDays(),confirmed,
                order.getPaymentStatus().name(),order.getOrderStatus().name(),order.getRecoveryGrantId());
    }
}
