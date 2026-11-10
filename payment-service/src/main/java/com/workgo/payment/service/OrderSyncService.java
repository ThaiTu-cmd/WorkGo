package com.workgo.payment.service;

import com.workgo.payment.dto.request.PaymentConfirmedRequest;
import com.workgo.payment.dto.response.client.PaymentConfirmationResponse;
import com.workgo.payment.entity.Payment;
import com.workgo.payment.enumeration.OrderSyncStatus;
import com.workgo.payment.enumeration.client.OrderStatus;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.reppository.PaymentRepository;
import com.workgo.payment.reppository.client.OrderClient;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class OrderSyncService {

    PaymentRepository paymentRepository;
    OrderClient orderClient;

    @NonFinal
    @Value("${payment.sync.max-retry}")
    int maxRetry;

    //bao order da thanh toan
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sync(UUID paymentId) {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        if (payment.getOrderSyncStatus() != OrderSyncStatus.PENDING) {
            return;
        }

        try {
            PaymentConfirmationResponse response = orderClient.confirmPayment(payment.getOrderId(),
                    PaymentConfirmedRequest.builder()
                            .paymentId(paymentId)
                            .build());

            if (response.getOrderStatus() == OrderStatus.CANCELLED) {
                log.warn("Order {} was cancelled, payment {} needs refund", payment.getOrderId(), payment.getPaymentCode());
                payment.setOrderSyncStatus(OrderSyncStatus.FAILED);
            } else {
                payment.setOrderSyncStatus(OrderSyncStatus.SYNCED);
                payment.setOrderSyncedAt(Instant.now());
            }

        } catch (FeignException e) {

            int retryCount = payment.getOrderSyncRetryCount() + 1;
            payment.setOrderSyncRetryCount(retryCount);

            if (retryCount >= maxRetry) {
                log.error("Sync order {} failed {} times, payment {} needs admin check",
                        payment.getOrderId(), retryCount, payment.getPaymentCode(), e);
                payment.setOrderSyncStatus(OrderSyncStatus.FAILED);
            } else {
                log.warn("Sync order {} failed ({}), job will retry", payment.getOrderId(), e.status());
            }
        }

        payment.setUpdatedAt(Instant.now());
        paymentRepository.save(payment);
    }

}
