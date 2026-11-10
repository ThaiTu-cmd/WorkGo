package com.workgo.order.service;


import com.workgo.order.entity.Execution;
import com.workgo.order.entity.Order;
import com.workgo.order.enumeration.*;
import com.workgo.order.reppository.DeliveryPackageRepository;
import com.workgo.order.reppository.DigitalExecutionRepository;
import com.workgo.order.reppository.ExecutionRepository;
import com.workgo.order.reppository.OnsiteExecutionRepository;
import com.workgo.order.reppository.OrderRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AutoCompleteService {

    OrderRepository orderRepository;
    ExecutionRepository executionRepository;
    OnsiteExecutionRepository onsiteExecutionRepository;
    DigitalExecutionRepository digitalExecutionRepository;
    DeliveryPackageRepository deliveryPackageRepository;
    OrderStatusService orderStatusService;

    //moi order chay trong 1 transaction rieng
    @Transactional
    public void complete(UUID orderId) {

        Order order = orderRepository.findById(orderId).orElse(null);

        //nap lai order, co the client vua accept xong
        if (order == null || order.getOrderStatus() != OrderStatus.DELIVERED) {
            return;
        }

        Instant now = Instant.now();

        if (order.getAutoCompleteAt() == null || order.getAutoCompleteAt().isAfter(now)) {
            return;
        }

        Execution execution = executionRepository.findByOrder_OrderId(orderId).orElse(null);

        if (execution == null) {
            return;
        }

        execution.setCompletedAt(now);
        executionRepository.save(execution);

        switch (order.getExecutionType()) {
            case ONSITE -> onsiteExecutionRepository.findByExecution_ExecutionId(execution.getExecutionId())
                    .ifPresent(onsite -> {
                        onsite.setStatus(OnsiteExecutionStatus.ACCEPT);
                        onsiteExecutionRepository.save(onsite);
                    });

            case DIGITAL -> {
                digitalExecutionRepository.findByExecution_ExecutionId(execution.getExecutionId())
                        .ifPresent(digital -> {
                            digital.setStatus(DigitalExecutionStatus.ACCEPT);
                            digitalExecutionRepository.save(digital);
                        });

                //ban giao moi nhat coi nhu da duoc nghiem thu
                deliveryPackageRepository
                        .findFirstByExecution_ExecutionIdOrderByVersionNoDesc(execution.getExecutionId())
                        .filter(deliveryPackage -> deliveryPackage.getStatus() == DeliveryPackageStatus.SUBMITTED)
                        .ifPresent(deliveryPackage -> {
                            deliveryPackage.setStatus(DeliveryPackageStatus.ACCEPTED);
                            deliveryPackageRepository.save(deliveryPackage);
                        });
            }
        }

        orderStatusService.transition(order, OrderStatus.COMPLETED, null, RoleName.SYSTEM);
    }

}
