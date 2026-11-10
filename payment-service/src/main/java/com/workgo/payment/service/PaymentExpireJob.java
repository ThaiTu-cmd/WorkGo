package com.workgo.payment.service;

import com.workgo.payment.entity.Payment;
import com.workgo.payment.reppository.PaymentRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class PaymentExpireJob {

    PaymentRepository paymentRepository;
    PaymentService paymentService;

    @Scheduled(fixedDelay = 60_000)
    public void run() {

        List<Payment> payments = paymentRepository
                .findAllByStatusInAndExpiresAtBefore(PaymentService.WAITING_STATUSES, Instant.now());

        for (Payment payment : payments) {
            try {
                paymentService.expirePayment(payment.getPaymentId());
            } catch (ObjectOptimisticLockingFailureException e) {
                log.info("Payment {} was updated by another request, skip expire", payment.getPaymentCode());
            } catch (Exception e) {
                log.warn("Expire payment {} failed", payment.getPaymentCode(), e);
            }
        }
    }

}
