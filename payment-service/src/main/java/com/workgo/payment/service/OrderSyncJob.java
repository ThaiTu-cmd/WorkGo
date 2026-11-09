package com.workgo.payment.service;

import com.workgo.payment.entity.Payment;
import com.workgo.payment.enumeration.OrderSyncStatus;
import com.workgo.payment.enumeration.PaymentStatus;
import com.workgo.payment.reppository.PaymentRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class OrderSyncJob {

    PaymentRepository paymentRepository;
    OrderSyncService orderSyncService;

    @NonFinal
    @Value("${payment.sync.max-retry}")
    int maxRetry;

    //goi lai order cho cac payment da thanh toan ma chua bao duoc
    @Scheduled(fixedDelay = 60_000)
    public void run() {

        List<Payment> payments = paymentRepository
                .findAllByStatusAndOrderSyncStatusAndOrderSyncRetryCountLessThan(
                        PaymentStatus.SUCCEEDED, OrderSyncStatus.PENDING, maxRetry);

        for (Payment payment : payments) {
            try {
                orderSyncService.sync(payment.getPaymentId());
            } catch (ObjectOptimisticLockingFailureException e) {
                //afterCommit cua IPN dang sync cung luc, bo qua
                log.info("Payment {} was updated by another request, skip sync", payment.getPaymentCode());
            } catch (Exception e) {
                log.warn("Sync order failed for payment {}", payment.getPaymentCode(), e);
            }
        }
    }

}
