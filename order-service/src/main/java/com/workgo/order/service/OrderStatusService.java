package com.workgo.order.service;

import com.workgo.order.entity.Order;
import com.workgo.order.entity.OrderStatusHistory;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.enumeration.RoleName;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.reppository.OrderRepository;
import com.workgo.order.reppository.OrderStatusHistoryRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;


import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class OrderStatusService {

    OrderStatusHistoryRepository orderStatusHistoryRepository;
    OrderRepository orderRepository;

    @Transactional(propagation = Propagation.MANDATORY )
    public void recordCreated(Order order, UUID clientId){
        saveHistory(order, null, order.getOrderStatus(), clientId, RoleName.CLIENT);
    }

    public void transition(Order order, OrderStatus toStatus, UUID actorId, RoleName roleName){

        OrderStatus fromStatus = order.getOrderStatus();

        if(!fromStatus.canTransitionTo(toStatus)){
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        Instant now = Instant.now();

        switch (toStatus){
            case CONFIRMED -> order.setConfirmedAt(now);
            case IN_PROGRESS -> order.setStartedAt(now);
            case DELIVERED -> order.setDeliveredAt(now);
            case COMPLETED -> order.setCompletedAt(now);
            case CANCELLED ->  order.setCancelledAt(now);
            default -> {}
        }

        if(toStatus != OrderStatus.DELIVERED) order.setAutoCompleteAt(null);

        orderRepository.save(order);

        saveHistory(order, fromStatus, toStatus, actorId, roleName);

    }

    private void saveHistory(Order order,
                             OrderStatus fromStatus,
                             OrderStatus toStatus,
                             UUID actorId,
                             RoleName roleName){
        orderStatusHistoryRepository.save(OrderStatusHistory.builder()
                .fromStatus(fromStatus)
                .toStatus(toStatus)
                .order(order)
                .actorId(actorId)
                .roleName(roleName)
                .build());
    }

}
