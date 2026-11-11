package com.workgo.order.service;


import com.workgo.order.entity.Order;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.enumeration.PaymentStatus;
import com.workgo.order.reppository.OrderRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

//doi soat voi payment: don COMPLETED chua release / don CANCELLED chua refund (payment tat / loi mang)
@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class PaymentSyncJob {

    OrderRepository orderRepository;
    PaymentSyncService paymentSyncService;

    @Scheduled(fixedDelay = 60_000)
    public void run() {

        //bo qua don vua doi trang thai, afterCommit dang goi payment
        Instant before = Instant.now().minus(Duration.ofMinutes(1));

        retryRelease(before);
        retryRefund(before);
    }

    //=====================================

    private void retryRelease(Instant before) {

        List<Order> orders = orderRepository
                .findTop50ByOrderStatusAndPaymentStatusAndCompletedAtLessThanEqualOrderByCompletedAtAsc(
                        OrderStatus.COMPLETED, PaymentStatus.SUCCEEDED, before);

        for (Order order : orders) {
            try {
                paymentSyncService.release(order.getOrderId());
            } catch (ObjectOptimisticLockingFailureException e) {
                log.info("Order {} was updated by another request, skip release", order.getOrderId());
            } catch (Exception e) {
                log.warn("Release escrow failed for order {}", order.getOrderId(), e);
            }
        }
    }

    private void retryRefund(Instant before) {

        List<Order> orders = orderRepository
                .findTop50ByOrderStatusAndPaymentStatusAndCancelledAtLessThanEqualOrderByCancelledAtAsc(
                        OrderStatus.CANCELLED, PaymentStatus.SUCCEEDED, before);

        for (Order order : orders) {
            try {
                paymentSyncService.refund(order.getOrderId());
            } catch (ObjectOptimisticLockingFailureException e) {
                log.info("Order {} was updated by another request, skip refund", order.getOrderId());
            } catch (Exception e) {
                log.warn("Refund escrow failed for order {}", order.getOrderId(), e);
            }
        }
    }

}
