package com.workgo.order.service;

import com.workgo.order.dto.request.CashFeeRequest;
import com.workgo.order.dto.request.EscrowRefundRequest;
import com.workgo.order.dto.request.EscrowReleaseRequest;
import com.workgo.order.dto.response.client.EscrowResponse;
import com.workgo.order.dto.snapshot.PricingSnapshot;
import com.workgo.order.entity.Order;
import com.workgo.order.entity.OrderSnapshot;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.enumeration.PaymentStatus;
import com.workgo.order.enumeration.client.EscrowStatus;
import com.workgo.order.enumeration.client.RefundReason;
import com.workgo.order.reppository.OrderRepository;
import com.workgo.order.reppository.OrderSnapshotRepository;
import com.workgo.order.reppository.client.PaymentClient;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class PaymentSyncService {

    static int FULL_REFUND_PERCENT = 100;

    OrderRepository orderRepository;
    OrderSnapshotRepository orderSnapshotRepository;
    PaymentClient paymentClient;
    TrustDisputeGuard trustDisputeGuard;

    //goi tu afterCommit + PaymentSyncJob nen can transaction rieng
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void release(UUID orderId) {

        Order order = orderRepository.findByIdForUpdate(orderId).orElse(null);

        if (order == null
                || order.getOrderStatus() != OrderStatus.COMPLETED
                || order.getPaymentStatus() != PaymentStatus.SUCCEEDED) {
            return;
        }

        if (!trustDisputeGuard.permitsPaymentSync(orderId)) return;

        EscrowResponse escrow;
        try {
            escrow = paymentClient.release(EscrowReleaseRequest.builder()
                    .orderId(orderId)
                    .build());
        } catch (FeignException e) {
            //giu SUCCEEDED, PaymentSyncJob goi lai sau
            log.warn("Release escrow failed for order {}, status {}", orderId, e.status());
            return;
        }

        if (!matches(escrow, order, EscrowStatus.RELEASED)) {
            log.warn("Invalid release ACK for order {}", orderId);
            return;
        }
        order.setPaymentStatus(PaymentStatus.RELEASED);
        log.info("Escrow of order {} released", orderId);
        orderRepository.save(order);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void refund(UUID orderId) {

        Order order = orderRepository.findByIdForUpdate(orderId).orElse(null);

        if (order == null
                || order.getOrderStatus() != OrderStatus.CANCELLED
                || order.getPaymentStatus() != PaymentStatus.SUCCEEDED) {
            return;
        }

        EscrowResponse escrow;

        if (!trustDisputeGuard.permitsPaymentSync(orderId)) return;

        try {
            escrow = paymentClient.refund(EscrowRefundRequest.builder()
                    .orderId(orderId)
                    .refundPercent(FULL_REFUND_PERCENT)
                    .reasonCode(RefundReason.ORDER_CANCELLED)
                    .build());
        } catch (FeignException e) {
            //giu SUCCEEDED, PaymentSyncJob goi lai sau
            log.warn("Refund escrow failed for order {}, status {}", orderId, e.status());
            return;
        }

        //gateway hoan tien loi -> escrow van HOLDING, admin xu ly ben payment
        if (!matches(escrow, order, EscrowStatus.REFUNDED)) {
            log.warn("Invalid refund ACK for order {}", orderId);
            return;
        }

        order.setPaymentStatus(PaymentStatus.REFUNDED);
        log.info("Escrow of order {} refunded", orderId);
        orderRepository.save(order);
    }

    private boolean matches(EscrowResponse escrow, Order order, EscrowStatus status) {
        return escrow != null && order.getOrderId().equals(escrow.getOrderId())
                && escrow.getStatus() == status && "VND".equals(escrow.getCurrency())
                && escrow.getHeldAmount() != null && order.getTotalAmount() != null
                && order.getTotalAmount().compareTo(escrow.getHeldAmount()) == 0;
    }

    //cash khong co escrow: chi bao payment ghi phi thanh cong vao vi provider (thieu thi am)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordCashFee(UUID orderId) {

        Order order = orderRepository.findById(orderId).orElse(null);

        if (order == null
                || order.getOrderStatus() != OrderStatus.COMPLETED
                || order.getPaymentStatus() != PaymentStatus.CASH_ON_SITE) {
            return;
        }

        try {
            paymentClient.recordCashFee(CashFeeRequest.builder()
                    .orderId(orderId)
                    .providerId(order.getProviderId())
                    .orderAmount(order.getTotalAmount().setScale(0, RoundingMode.HALF_UP))
                    .fee(order.getPlatformFee().setScale(0, RoundingMode.HALF_UP))
                    .feePolicyVersionId(orderSnapshotRepository.findById(orderId)
                            .map(OrderSnapshot::getPricingSnapshot)
                            .map(PricingSnapshot::getFeePolicyVersionId)
                            .orElse(null))
                    .build());
        } catch (FeignException e) {
            //giu CASH_ON_SITE, PaymentSyncJob goi lai sau
            log.warn("Record cash fee failed for order {}, status {}", orderId, e.status());
            return;
        }

        order.setPaymentStatus(PaymentStatus.CASH_SETTLED);
        log.info("Cash fee of order {} recorded", orderId);
        orderRepository.save(order);
    }

}
