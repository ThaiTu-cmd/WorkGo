package com.workgo.order.service;


import com.workgo.order.entity.Order;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.reppository.OrderRepository;
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
public class AutoCompleteJob {

    OrderRepository orderRepository;
    AutoCompleteService autoCompleteService;

    @Scheduled(fixedDelay = 60_000)
    public void run() {

        List<Order> orders = orderRepository
                .findTop50ByOrderStatusAndAutoCompleteAtLessThanEqualOrderByAutoCompleteAtAsc(
                        OrderStatus.DELIVERED, Instant.now());

        for (Order order : orders) {
            try {
                autoCompleteService.complete(order.getOrderId());
            } catch (ObjectOptimisticLockingFailureException e) {
                //client vua accept cung luc, bo qua
                log.info("Order {} was updated by another request, skip auto complete", order.getOrderId());
            } catch (Exception e) {
                log.warn("Auto complete failed for order {}", order.getOrderId(), e);
            }
        }
    }

}
