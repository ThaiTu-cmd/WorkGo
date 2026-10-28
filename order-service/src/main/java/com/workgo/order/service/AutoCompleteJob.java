package com.workgo.order.service;


import com.workgo.order.entity.Execution;
import com.workgo.order.entity.Order;
import com.workgo.order.enumeration.*;
import com.workgo.order.reppository.DigitalExecutionRepository;
import com.workgo.order.reppository.ExecutionRepository;
import com.workgo.order.reppository.OnsiteExecutionRepository;
import com.workgo.order.reppository.OrderRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class AutoCompleteJob {

    OrderRepository orderRepository;
    ExecutionRepository executionRepository;
    OnsiteExecutionRepository onsiteExecutionRepository;
    DigitalExecutionRepository digitalExecutionRepository;
    OrderStatusService orderStatusService;

    @Scheduled(fixedDelay = 60_000)
    public void run() {

        List<Order> orders = orderRepository
                .findTop50ByOrderStatusAndAutoCompleteAtLessThanEqualOrderByAutoCompleteAtAsc(
                        OrderStatus.DELIVERED, Instant.now());

        for (Order order : orders) {
            try {
                complete(order.getOrderId());
            } catch (Exception e) {
                log.warn("Auto complete failed for order {}", order.getOrderId(), e);
            }
        }
    }

    @Transactional
    private void complete(UUID orderId) {

        Order order = orderRepository.findById(orderId).orElse(null);

        if (order == null || order.getOrderStatus() != OrderStatus.DELIVERED) {
            return;
        }

        if (order.getAutoCompleteAt() == null
                || order.getAutoCompleteAt().isAfter(Instant.now())) {
            return;
        }

        Execution execution = executionRepository.findByOrder_OrderId(orderId).orElse(null);

        if (execution == null) {
            return;
        }

        execution.setCompletedAt(Instant.now());
        executionRepository.save(execution);

        if (order.getExecutionType() == ExecutionType.ONSITE) {
            onsiteExecutionRepository.findByExecution_ExecutionId(execution.getExecutionId())
                    .ifPresent(onsite -> {
                        onsite.setStatus(OnsiteExecutionStatus.ACCEPT);
                        onsiteExecutionRepository.save(onsite);
                    });
        } else {
            digitalExecutionRepository.findByExecution_ExecutionId(execution.getExecutionId())
                    .ifPresent(digital -> {
                        digital.setStatus(DigitalExecutionStatus.ACCEPT);
                        digitalExecutionRepository.save(digital);
                    });
        }

        orderStatusService.transition(order, OrderStatus.COMPLETED, null, RoleName.SYSTEM);
    }

}
