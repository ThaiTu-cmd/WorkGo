package com.workgo.order.service;


import com.workgo.order.entity.Execution;
import com.workgo.order.entity.OnsiteExecution;
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
    OnsiteFlowService onsiteFlowService;
    DeadlinePolicyService deadlinePolicyService;
    TrustDisputeGuard trustDisputeGuard;
    DeliveryReadinessService deliveryReadinessService;
    java.time.Clock clock;

    //moi order chay trong 1 transaction rieng
    @Transactional
    public void complete(UUID orderId) {

        Order order = orderRepository.findByIdForUpdate(orderId).orElse(null);

        //nap lai order, co the client vua accept xong
        if (order == null || order.getOrderStatus() != OrderStatus.DELIVERED) {
            return;
        }

        Instant now = clock.instant();

        if (order.getAutoCompleteAt() == null || order.getAutoCompleteAt().isAfter(now)) {
            return;
        }

        Execution execution = executionRepository.findByOrder_OrderId(orderId).orElse(null);

        if (execution == null) {
            return;
        }

        if (!trustDisputeGuard.permitsPaymentSync(orderId)) {
            deadlinePolicyService.pauseForError(order,"TIMER_ERROR");return;
        }
        if (!deliveryReadinessService.ready(order,execution)) {
            deadlinePolicyService.pauseForError(order,"EVIDENCE");
            return;
        }
        if (!deadlinePolicyService.eligible(order)) return;

        if (order.getExecutionType() == ExecutionType.ONSITE) {

            OnsiteExecution onsite = onsiteExecutionRepository.findByExecution_ExecutionId(execution.getExecutionId())
                    .orElse(null);

            if (onsite == null || onsite.getStatus() != OnsiteExecutionStatus.SERVICE_DONE) {
                return;
            }

            //im lang chi la nghiem thu, cash van cho provider xac nhan da nhan tien
            onsite.setStatus(OnsiteExecutionStatus.ACCEPT);
            deadlinePolicyService.accepted(order);
            if (onsite.getClientAcceptedAt() == null) onsite.setClientAcceptedAt(now);
            onsiteExecutionRepository.save(onsite);

            onsiteFlowService.completeIfSettled(order, execution, onsite, null, RoleName.SYSTEM);
            return;
        }

        if (order.getExecutionType() == ExecutionType.DIGITAL) {
            var digital = digitalExecutionRepository.findByExecution_ExecutionId(execution.getExecutionId()).orElse(null);
            var delivery = deliveryPackageRepository.findFirstByExecution_ExecutionIdOrderByVersionNoDesc(execution.getExecutionId()).orElse(null);
            if (digital == null || digital.getStatus() != DigitalExecutionStatus.SUBMITTED
                    || delivery == null || delivery.getStatus() != DeliveryPackageStatus.SUBMITTED) return;
        }
        deadlinePolicyService.accepted(order);
        execution.setCompletedAt(now);
        executionRepository.save(execution);

        switch (order.getExecutionType()) {
            case DIGITAL -> {
                digitalExecutionRepository.findByExecution_ExecutionId(execution.getExecutionId())
                        .ifPresent(digital -> {
                            digital.setStatus(DigitalExecutionStatus.ACCEPT);
                            digitalExecutionRepository.save(digital);
                        });

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
