package com.workgo.order.service;


import com.workgo.order.entity.Order;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.reppository.OrderRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

//huy don PENDING_PAYMENT qua han, tien ve tre thi payment tu refund
@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class PaymentTimeoutJob {

    OrderRepository orderRepository;
    CancellationService cancellationService;

    @NonFinal
    @Value("${order.payment-timeout-minutes}")
    long paymentTimeoutMinutes;

    @Scheduled(fixedDelay = 60_000)
    public void run() {

        List<Order> orders = orderRepository
                .findTop50ByOrderStatusAndCreatedAtLessThanEqualOrderByCreatedAtAsc(
                        OrderStatus.PENDING_PAYMENT, Instant.now().minus(Duration.ofMinutes(paymentTimeoutMinutes)));

        for (Order order : orders) {
            try {
                cancellationService.cancelUnpaid(order.getOrderId());
            } catch (ObjectOptimisticLockingFailureException e) {
                //tien vua ve cung luc, bo qua
                log.info("Order {} was updated by another request, skip timeout cancel", order.getOrderId());
            } catch (Exception e) {
                log.warn("Timeout cancel failed for order {}", order.getOrderId(), e);
            }
        }
    }

}
