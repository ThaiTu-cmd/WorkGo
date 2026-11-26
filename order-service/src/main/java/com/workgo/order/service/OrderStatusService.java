package com.workgo.order.service;

import com.workgo.order.entity.Order;
import com.workgo.order.entity.OrderStatusHistory;
import com.workgo.order.entity.OrderCompletedOutbox;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.enumeration.PaymentStatus;
import com.workgo.order.enumeration.RoleName;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.reppository.OrderRepository;
import com.workgo.order.reppository.OrderStatusHistoryRepository;
import com.workgo.order.reppository.OrderCompletedOutboxRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;


import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class OrderStatusService {

    OrderStatusHistoryRepository orderStatusHistoryRepository;
    OrderRepository orderRepository;
    PaymentSyncService paymentSyncService;
    OrderCompletedOutboxRepository orderCompletedOutboxRepository;

    @org.springframework.beans.factory.annotation.Autowired
    com.workgo.order.reppository.OrderSnapshotRepository rewardSnapshots;
    @org.springframework.beans.factory.annotation.Autowired
    com.workgo.order.reppository.RewardCommitOutboxRepository rewardCommits;

    @Transactional(propagation = Propagation.MANDATORY )
    public void recordCreated(Order order, UUID clientId){
        saveHistory(order, null, order.getOrderStatus(), clientId, RoleName.CLIENT);
    }

    //chuyen trang thai cua order
    @Transactional(propagation = Propagation.MANDATORY)
    public void transition(Order order, OrderStatus toStatus, UUID actorId, RoleName roleName){

        OrderStatus fromStatus = order.getOrderStatus();

        if(!fromStatus.canTransitionTo(toStatus)){
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        Instant now = Instant.now();

        order.setOrderStatus(toStatus);

        switch (toStatus){
            case CONFIRMED -> order.setConfirmedAt(now);
            case IN_PROGRESS -> { if (order.getStartedAt() == null) order.setStartedAt(now); }
            case DELIVERED -> order.setDeliveredAt(now);
            case COMPLETED -> order.setCompletedAt(now);
            case CANCELLED ->  order.setCancelledAt(now);
            default -> {}
        }

        if(toStatus != OrderStatus.DELIVERED) order.setAutoCompleteAt(null);

        order.setOrderStatus(toStatus);
        orderRepository.save(order);

        saveHistory(order, fromStatus, toStatus, actorId, roleName);
        if(toStatus == OrderStatus.CONFIRMED && rewardSnapshots != null && rewardCommits != null) {
            rewardSnapshots.findById(order.getOrderId()).map(com.workgo.order.entity.OrderSnapshot::getRewardQuoteRef)
                    .filter(ref -> !ref.isBlank()).ifPresent(ref -> rewardCommits.save(com.workgo.order.entity.RewardCommitOutbox.from(order,ref)));
        }

        if (toStatus == OrderStatus.COMPLETED) {
            orderCompletedOutboxRepository.save(OrderCompletedOutbox.from(order));
        }

        if (toStatus == OrderStatus.COMPLETED && order.getPaymentStatus() == PaymentStatus.SUCCEEDED) {
            releaseEscrowAfterCommit(order.getOrderId());
        }

        if (toStatus == OrderStatus.CANCELLED && order.getPaymentStatus() == PaymentStatus.SUCCEEDED) {
            refundEscrowAfterCommit(order.getOrderId());
        }

        if (toStatus == OrderStatus.COMPLETED && order.getPaymentStatus() == PaymentStatus.CASH_ON_SITE) {
            recordCashFeeAfterCommit(order.getOrderId());
        }

    }

    //phan quyet ADMIN: duoc ket thuc tu bat ky trang thai dang lam; tien da chot o payment nen khong goi release / refund cu
    @Transactional(propagation = Propagation.MANDATORY)
    public void applyDecision(Order order, OrderStatus toStatus, UUID actorId) {

        OrderStatus fromStatus = order.getOrderStatus();

        if ((toStatus != OrderStatus.COMPLETED && toStatus != OrderStatus.CANCELLED)
                || fromStatus == OrderStatus.PENDING_PAYMENT
                || fromStatus == OrderStatus.COMPLETED
                || fromStatus == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        Instant now = Instant.now();

        if (toStatus == OrderStatus.COMPLETED) order.setCompletedAt(now);
        else order.setCancelledAt(now);

        order.setAutoCompleteAt(null);
        order.setOrderStatus(toStatus);
        orderRepository.save(order);

        saveHistory(order, fromStatus, toStatus, actorId, RoleName.ADMIN);

        if (toStatus == OrderStatus.COMPLETED) {
            orderCompletedOutboxRepository.save(OrderCompletedOutbox.from(order));
        }

        //cash: ADMIN ket luan hoan thanh = du dieu kien ghi phi, PaymentSyncJob goi lai neu loi
        if (toStatus == OrderStatus.COMPLETED && order.getPaymentStatus() == PaymentStatus.CASH_ON_SITE) {
            recordCashFeeAfterCommit(order.getOrderId());
        }
    }

    //commit COMPLETED xong moi bao payment tra tien cho provider
    private void releaseEscrowAfterCommit(UUID orderId) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    paymentSyncService.release(orderId);
                } catch (Exception e) {
                    log.warn("Release escrow failed for completed order {}", orderId, e);
                }
            }
        });
    }

    //cash: commit COMPLETED xong moi bao payment ghi phi, loi thi PaymentSyncJob goi lai
    private void recordCashFeeAfterCommit(UUID orderId) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    paymentSyncService.recordCashFee(orderId);
                } catch (Exception e) {
                    log.warn("Record cash fee failed for completed order {}", orderId, e);
                }
            }
        });
    }

    private void refundEscrowAfterCommit(UUID orderId) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    paymentSyncService.refund(orderId);
                } catch (Exception e) {
                    log.warn("Refund escrow failed for cancelled order {}", orderId, e);
                }
            }
        });
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
