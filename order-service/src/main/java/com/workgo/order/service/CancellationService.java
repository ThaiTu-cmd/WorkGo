package com.workgo.order.service;


import com.workgo.order.dto.request.CancellationCreationRequest;
import com.workgo.order.dto.request.CancellationRespondRequest;
import com.workgo.order.dto.request.SlotActionRequest;
import com.workgo.order.dto.response.CancellationRequestResponse;
import com.workgo.order.entity.CancellationRequest;
import com.workgo.order.entity.Execution;
import com.workgo.order.entity.Order;
import com.workgo.order.enumeration.*;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.mapper.CancellationRequestMapper;
import com.workgo.order.reppository.*;
import com.workgo.order.reppository.client.CatalogClient;
import com.workgo.order.utils.TokenUtils;
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
public class CancellationService {

    OrderRepository orderRepository;
    ExecutionRepository executionRepository;
    DigitalExecutionRepository digitalExecutionRepository;
    OnsiteExecutionRepository onsiteExecutionRepository;
    CancellationRequestRepository cancellationRequestRepository;
    OrderStatusService orderStatusService;
    CancellationRequestMapper cancellationRequestMapper;
    CatalogClient catalogClient;
    TokenUtils tokenUtils;

    //client hoac provider gui yeu cau huy don
    @Transactional
    public CancellationRequestResponse cancel(UUID orderId, CancellationCreationRequest request) {

        Order order = loadOrder(orderId);
        RoleName roleName = resolveRole(order);

        OrderStatus orderStatus = order.getOrderStatus();

        if (orderStatus != OrderStatus.PENDING_PAYMENT
                && orderStatus != OrderStatus.CONFIRMED
                && orderStatus != OrderStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.ORDER_CANCEL_NOT_ALLOWED);
        }

        if (request.getReasonCode() == null || request.getReasonCode().isBlank()) {
            throw new AppException(ErrorCode.ORDER_CANCEL_REASON_REQUIRED);
        }

        //moi order chi co 1 yeu cau huy
        if (cancellationRequestRepository.existsByOrder_OrderId(orderId)) {
            throw new AppException(ErrorCode.ORDER_CANCELLATION_EXISTED);
        }

        UUID actorId = resolveActorId(roleName);

        CancellationRequest cancellation = CancellationRequest.builder()
                .order(order)
                .requestedBy(actorId)
                .requestedByRole(roleName)
                .reasonCode(request.getReasonCode())
                .note(request.getNote())
                .build();

        if (orderStatus == OrderStatus.PENDING_PAYMENT) {
            //chua thanh toan -> huy luon, khong can ben kia dong y
            cancellation.setStatus(CancellationStatus.AUTO_APPROVED);
            cancellation.setRefundPercent(0);
            cancellation.setRespondedAt(Instant.now());
            cancellationRequestRepository.save(cancellation);

            cancelOrder(order, actorId, roleName);
        } else {
            //da thanh toan -> cho ben con lai phan hoi
            cancellation.setStatus(CancellationStatus.PENDING);
            cancellationRequestRepository.save(cancellation);
        }

        return cancellationRequestMapper.toResponse(cancellation);
    }

    //ben con lai dong y hoac tu choi yeu cau huy
    @Transactional
    public CancellationRequestResponse respond(UUID orderId, CancellationRespondRequest request) {

        Order order = loadOrder(orderId);
        RoleName roleName = resolveRole(order);

        if (request.getAccept() == null) {
            throw new AppException(ErrorCode.ORDER_CANCEL_ANSWER_REQUIRED);
        }

        CancellationRequest cancellation = cancellationRequestRepository.findByOrder_OrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_CANCELLATION_NOT_FOUND));

        if (cancellation.getStatus() != CancellationStatus.PENDING) {
            throw new AppException(ErrorCode.ORDER_CANCELLATION_NOT_PENDING);
        }

        if (cancellation.getRequestedByRole() == roleName) {
            throw new AppException(ErrorCode.ORDER_CANCELLATION_SELF_RESPOND);
        }

        UUID actorId = resolveActorId(roleName);

        cancellation.setRespondedBy(actorId);
        cancellation.setRespondedAt(Instant.now());

        if (request.getAccept()) {

            if (order.getOrderStatus() != OrderStatus.CONFIRMED
                    && order.getOrderStatus() != OrderStatus.IN_PROGRESS) {
                throw new AppException(ErrorCode.ORDER_CANCEL_NOT_ALLOWED);
            }

            //phase nay chi hoan 100%, payment-service tu refund sau khi commit
            cancellation.setStatus(CancellationStatus.ACCEPTED);
            cancellation.setRefundPercent(100);
            cancellationRequestRepository.save(cancellation);

            cancelOrder(order, actorId, roleName);
        } else {

            cancellation.setStatus(CancellationStatus.REJECTED);
            cancellationRequestRepository.save(cancellation);

        }

        return cancellationRequestMapper.toResponse(cancellation);
    }

    @Transactional(readOnly = true)
    public CancellationRequestResponse getCancellation(UUID orderId) {

        Order order = loadOrder(orderId);
        tokenUtils.assertParticipant(order);

        return cancellationRequestRepository.findByOrder_OrderId(orderId)
                .map(cancellationRequestMapper::toResponse)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_CANCELLATION_NOT_FOUND));
    }

    //he thong tu huy don
    public void cancelBySystem(Order order) {
        cancelOrder(order, null, RoleName.SYSTEM);
    }

    //qua han ma chua thanh toan -> he thong huy + nha slot (PaymentTimeoutJob)
    @Transactional
    public void cancelUnpaid(UUID orderId) {

        Order order = orderRepository.findById(orderId).orElse(null);

        //nap lai order, co the tien vua ve
        if (order == null
                || order.getOrderStatus() != OrderStatus.PENDING_PAYMENT
                || order.getPaymentStatus() != PaymentStatus.PENDING) {
            return;
        }

        log.info("Order {} not paid in time, cancel by system", orderId);
        cancelOrder(order, null, RoleName.SYSTEM);
    }

    //=====================================

    //dong execution + chuyen order sang CANCELLED
    private void cancelOrder(Order order, UUID actorId, RoleName roleName) {

        Execution execution = executionRepository.findByOrder_OrderId(order.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_EXECUTION_NOT_FOUND));

        switch (order.getExecutionType()) {
            case DIGITAL -> digitalExecutionRepository.findByExecution_ExecutionId(execution.getExecutionId())
                    .ifPresent(digital -> {
                        digital.setStatus(DigitalExecutionStatus.CANCELLED);
                        digitalExecutionRepository.save(digital);
                    });

            case ONSITE -> onsiteExecutionRepository.findByExecution_ExecutionId(execution.getExecutionId())
                    .ifPresent(onsite -> {
                        onsite.setStatus(OnsiteExecutionStatus.CANCELLED);
                        onsiteExecutionRepository.save(onsite);

                        releaseSlotAfterCommit(onsite.getBookingSlotId(), order.getOrderId());
                    });
        }

        orderStatusService.transition(order, OrderStatus.CANCELLED, actorId, roleName);
    }

    //huy don thanh cong moi nha slot ben catalog
    private void releaseSlotAfterCommit(UUID slotId, UUID orderId) {

        if (slotId == null) {
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    catalogClient.releaseSlot(slotId, SlotActionRequest.builder()
                            .orderId(orderId)
                            .build());
                } catch (Exception e) {
                    log.warn("Release slot {} failed for cancelled order {}", slotId, orderId, e);
                }
            }
        });
    }

    //nguoi goi la client hay provider cua don
    private RoleName resolveRole(Order order) {

        if (tokenUtils.getCurrentUserId().equals(order.getClientId())) {
            return RoleName.CLIENT;
        }

        UUID providerId = tokenUtils.getCurrentProviderIdOrNull();

        if (providerId != null && providerId.equals(order.getProviderId())) {
            return RoleName.PROVIDER;
        }

        throw new AppException(ErrorCode.ORDER_NOT_FOUND);
    }

    private UUID resolveActorId(RoleName roleName) {
        return roleName == RoleName.CLIENT
                ? tokenUtils.getCurrentUserId()
                : tokenUtils.getCurrentProviderId();
    }

    private Order loadOrder(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }

}
