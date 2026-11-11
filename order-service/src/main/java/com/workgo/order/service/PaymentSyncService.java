package com.workgo.order.service;

import com.workgo.order.dto.request.EscrowRefundRequest;
import com.workgo.order.dto.request.EscrowReleaseRequest;
import com.workgo.order.dto.response.client.EscrowResponse;
import com.workgo.order.entity.Order;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.enumeration.PaymentStatus;
import com.workgo.order.enumeration.client.EscrowStatus;
import com.workgo.order.enumeration.client.RefundReason;
import com.workgo.order.reppository.OrderRepository;
import com.workgo.order.reppository.client.PaymentClient;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class PaymentSyncService {

    //D10: phase nay chi hoan 100%
    static int FULL_REFUND_PERCENT = 100;

    OrderRepository orderRepository;
    PaymentClient paymentClient;

    //goi tu afterCommit + PaymentSyncJob nen can transaction rieng
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void release(UUID orderId) {

        Order order = orderRepository.findById(orderId).orElse(null);

        //da release roi hoac don chua COMPLETED
        if (order == null
                || order.getOrderStatus() != OrderStatus.COMPLETED
                || order.getPaymentStatus() != PaymentStatus.SUCCEEDED) {
            return;
        }

        try {
            paymentClient.release(EscrowReleaseRequest.builder()
                    .orderId(orderId)
                    .build());
        } catch (FeignException e) {
            //giu SUCCEEDED, PaymentSyncJob goi lai sau
            log.warn("Release escrow failed for order {}, status {}", orderId, e.status());
            return;
        }

        order.setPaymentStatus(PaymentStatus.RELEASED);
        log.info("Escrow of order {} released", orderId);
        orderRepository.save(order);
    }

    //huy don da thanh toan -> bao payment hoan tien cho client
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void refund(UUID orderId) {

        Order order = orderRepository.findById(orderId).orElse(null);

        //da refund roi hoac don chua CANCELLED
        if (order == null
                || order.getOrderStatus() != OrderStatus.CANCELLED
                || order.getPaymentStatus() != PaymentStatus.SUCCEEDED) {
            return;
        }

        EscrowResponse escrow;

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
        if (escrow.getStatus() != EscrowStatus.REFUNDED) {
            log.warn("Escrow of order {} is {} after refund", orderId, escrow.getStatus());
            return;
        }

        order.setPaymentStatus(PaymentStatus.REFUNDED);
        log.info("Escrow of order {} refunded", orderId);
        orderRepository.save(order);
    }

}
