package com.workgo.order.service;

import com.workgo.order.dto.request.CancellationCreationRequest;
import com.workgo.order.dto.request.CancellationRespondRequest;
import com.workgo.order.dto.request.SlotActionRequest;
import com.workgo.order.dto.response.CancellationRequestResponse;
import com.workgo.order.dto.snapshot.PricingSnapshot;
import com.workgo.order.entity.CancellationRequest;
import com.workgo.order.entity.Execution;
import com.workgo.order.entity.OnsiteExecution;
import com.workgo.order.entity.Order;
import com.workgo.order.entity.OrderDisputeDecision;
import com.workgo.order.entity.OrderSnapshot;
import com.workgo.order.enumeration.*;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.mapper.CancellationRequestMapper;
import com.workgo.order.reppository.*;
import com.workgo.order.reppository.client.CatalogClient;
import com.workgo.order.reppository.client.TrustClient;
import com.workgo.order.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
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
    OrderDisputeDecisionRepository orderDisputeDecisionRepository;
    OrderSnapshotRepository orderSnapshotRepository;
    OrderStatusService orderStatusService;
    DeadlinePolicyService deadlinePolicyService;
    CancellationRequestMapper cancellationRequestMapper;
    CatalogClient catalogClient;
    TrustClient trustClient;
    TokenUtils tokenUtils;
    Clock clock;

    @Transactional
    public CancellationRequestResponse cancel(UUID orderId, CancellationCreationRequest request) {

        Order order = lockOrder(orderId);
        RoleName roleName = resolveRole(order);

        if (request == null || request.getReasonCode() == null || request.getReasonCode().isBlank()) {
            throw new AppException(ErrorCode.ORDER_CANCEL_REASON_REQUIRED);
        }

        UUID actorId = resolveActorId(roleName);
        Instant now = currentInstant();

        // 1. Reuse existing effective abandonment/refund decision without creating a second refund.
        Optional<OrderDisputeDecision> appliedDecision = orderDisputeDecisionRepository.findByOrderId(orderId);
        if (appliedDecision.isPresent()) {
            OrderDisputeDecision decision = appliedDecision.get();
            if (decision.getOperation() != DecisionOperation.REFUND || roleName != RoleName.CLIENT) {
                throw new AppException(ErrorCode.ORDER_CANCEL_NOT_ALLOWED);
            }
            CancellationRequest linked = cancellationRequestRepository.findByOrder_OrderId(orderId)
                    .orElseGet(() -> CancellationRequest.builder()
                            .order(order)
                            .requestedBy(actorId)
                            .requestedByRole(roleName)
                            .reasonCode(request.getReasonCode().strip())
                            .note(request.getNote())
                            .createdAt(now)
                            .build());
            linked.setCaseId(decision.getDisputeId());
            linked.setDecisionId(decision.getDecisionId());
            linked.setExecutionStatus("COMPLETED");
            linked.setStatus(CancellationStatus.DECISION_LINKED);
            linked.setRefundPercent(100);
            if (linked.getRespondedAt() == null) {
                linked.setRespondedAt(decision.getEffectiveAt());
            }
            cancellationRequestRepository.save(linked);
            return cancellationRequestMapper.toResponse(linked);
        }

        CancellationRequest existing = cancellationRequestRepository.findByOrder_OrderId(orderId).orElse(null);
        if (existing != null && existing.getDecisionId() != null) {
            if (roleName != RoleName.CLIENT) {
                throw new AppException(ErrorCode.ORDER_CANCEL_NOT_ALLOWED);
            }
            return cancellationRequestMapper.toResponse(existing);
        }

        OrderStatus orderStatus = order.getOrderStatus();

        // 2. Unpaid order cancellation still transitions immediately without refunding uncollected funds.
        if (orderStatus == OrderStatus.PENDING_PAYMENT) {
            if (existing != null) {
                throw new AppException(ErrorCode.ORDER_CANCELLATION_EXISTED);
            }
            CancellationRequest cancellation = CancellationRequest.builder()
                    .order(order)
                    .requestedBy(actorId)
                    .requestedByRole(roleName)
                    .reasonCode(request.getReasonCode().strip())
                    .note(request.getNote())
                    .status(CancellationStatus.AUTO_APPROVED)
                    .refundPercent(0)
                    .respondedAt(now)
                    .executionStatus("NOT_APPLICABLE")
                    .feeExemptBefore24h(true)
                    .projectedCancellationFee(0L)
                    .createdAt(now)
                    .build();
            cancellationRequestRepository.save(cancellation);
            cancelOrder(order, actorId, roleName);
            return cancellationRequestMapper.toResponse(cancellation);
        }

        if (orderStatus != OrderStatus.CONFIRMED
                && orderStatus != OrderStatus.IN_PROGRESS
                && orderStatus != OrderStatus.DELIVERED) {
            throw new AppException(ErrorCode.ORDER_CANCEL_NOT_ALLOWED);
        }

        // 3. Committed/paid order: neither provider self-cancel nor counterpart consent can bypass ADMIN decision.
        if (existing != null) {
            if (existing.getRequestedByRole() == roleName) {
                if (Objects.equals(existing.getReasonCode(), request.getReasonCode().strip())) {
                    return cancellationRequestMapper.toResponse(existing);
                }
                throw new AppException(ErrorCode.ORDER_CANCELLATION_EXISTED);
            }
            existing.setCounterpartAgreed(true);
            existing.setRespondedBy(actorId);
            existing.setRespondedAt(now);
            existing.setStatus(CancellationStatus.AWAITING_ADMIN_DECISION);
            if (existing.getExecutionStatus() == null) {
                existing.setExecutionStatus("AWAITING_ADMIN_DECISION");
            }
            cancellationRequestRepository.save(existing);
            return cancellationRequestMapper.toResponse(existing);
        }

        UUID caseId = resolveCaseId(orderId, request.getCaseId());
        OnsiteCancellationAssessment feePreview = assessCancellationFeePreview(order, now);

        CancellationRequest cancellation = CancellationRequest.builder()
                .order(order)
                .requestedBy(actorId)
                .requestedByRole(roleName)
                .reasonCode(request.getReasonCode().strip())
                .note(request.getNote())
                .status(CancellationStatus.PENDING)
                .caseId(caseId)
                .decisionId(null)
                .executionStatus("AWAITING_ADMIN_DECISION")
                .counterpartAgreed(false)
                .feeExemptBefore24h(feePreview.exemptBefore24h())
                .projectedCancellationFee(feePreview.projectedFee())
                .createdAt(now)
                .build();

        cancellationRequestRepository.save(cancellation);

        if (orderStatus == OrderStatus.DELIVERED && deadlinePolicyService != null) {
            deadlinePolicyService.pause(orderId, "DISPUTE", caseId, null);
        }

        return cancellationRequestMapper.toResponse(cancellation);
    }

    @Transactional
    public CancellationRequestResponse respond(UUID orderId, CancellationRespondRequest request) {

        Order order = lockOrder(orderId);
        RoleName roleName = resolveRole(order);

        if (request == null || request.getAccept() == null) {
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

        if (order.getOrderStatus() != OrderStatus.CONFIRMED
                && order.getOrderStatus() != OrderStatus.IN_PROGRESS
                && order.getOrderStatus() != OrderStatus.DELIVERED) {
            throw new AppException(ErrorCode.ORDER_CANCEL_NOT_ALLOWED);
        }

        UUID actorId = resolveActorId(roleName);
        Instant now = currentInstant();

        cancellation.setRespondedBy(actorId);
        cancellation.setRespondedAt(now);
        cancellation.setCounterpartAgreed(request.getAccept());
        if (cancellation.getCaseId() == null) {
            cancellation.setCaseId(resolveCaseId(orderId, null));
        }
        if (cancellation.getExecutionStatus() == null) {
            cancellation.setExecutionStatus("AWAITING_ADMIN_DECISION");
        }

        if (request.getAccept()) {
            // Bilateral consent on a committed order still requires ADMIN responsibility/fee conclusion.
            cancellation.setStatus(CancellationStatus.AWAITING_ADMIN_DECISION);
        } else {
            cancellation.setStatus(CancellationStatus.REJECTED);
        }

        cancellationRequestRepository.save(cancellation);
        return cancellationRequestMapper.toResponse(cancellation);
    }

    @Transactional
    public CancellationRequestResponse recordEffectiveAbandonment(
            UUID orderId, UUID caseId, UUID decisionId, String executionStatus) {
        Order order = lockOrder(orderId);
        Instant now = currentInstant();
        CancellationRequest cancellation = cancellationRequestRepository.findByOrder_OrderId(orderId)
                .orElseGet(() -> CancellationRequest.builder()
                        .order(order)
                        .requestedBy(order.getClientId())
                        .requestedByRole(RoleName.CLIENT)
                        .reasonCode("ABANDONMENT_CONFIRMED")
                        .createdAt(now)
                        .build());
        cancellation.setCaseId(caseId);
        cancellation.setDecisionId(decisionId);
        cancellation.setExecutionStatus(executionStatus == null ? "IN_PROGRESS" : executionStatus);
        cancellation.setStatus(CancellationStatus.DECISION_LINKED);
        cancellation.setRefundPercent(100);
        if (cancellation.getRespondedAt() == null) {
            cancellation.setRespondedAt(now);
        }
        cancellationRequestRepository.save(cancellation);
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

    public void cancelBySystem(Order order) {
        cancelOrder(order, null, RoleName.SYSTEM);
    }

    @Transactional
    public void cancelUnpaid(UUID orderId) {

        Order order = orderRepository.findByIdForUpdate(orderId).orElse(null);

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

    private record OnsiteCancellationAssessment(boolean exemptBefore24h, long projectedFee) {}

    private OnsiteCancellationAssessment assessCancellationFeePreview(Order order, Instant now) {
        long fee = computeCancellationFee(order);
        if (order.getExecutionType() != ExecutionType.ONSITE) {
            return new OnsiteCancellationAssessment(false, fee);
        }
        Execution execution = executionRepository.findByOrder_OrderId(order.getOrderId()).orElse(null);
        OnsiteExecution onsite = execution == null ? null
                : onsiteExecutionRepository.findByExecution_ExecutionId(execution.getExecutionId()).orElse(null);
        Instant scheduledStart = onsite == null ? null : onsite.getScheduledStart();
        boolean notStarted = order.getStartedAt() == null
                && (onsite == null || onsite.getArrivedAt() == null);
        boolean before24h = scheduledStart != null && !now.isAfter(scheduledStart.minus(Duration.ofHours(24)));
        if (notStarted && before24h) {
            return new OnsiteCancellationAssessment(true, 0L);
        }
        return new OnsiteCancellationAssessment(false, fee);
    }

    private long computeCancellationFee(Order order) {
        BigDecimal total = order.getTotalAmount();
        if (total == null || total.signum() <= 0) {
            return 0L;
        }
        BigDecimal rate = new BigDecimal("0.02");
        long cap = 100_000L;
        if (orderSnapshotRepository != null) {
            try {
                PricingSnapshot pricing = orderSnapshotRepository.findById(order.getOrderId())
                        .map(OrderSnapshot::getPricingSnapshot)
                        .orElse(null);
                if (pricing != null) {
                    if (pricing.getCancellationFeeRate() != null) {
                        rate = pricing.getCancellationFeeRate();
                    }
                    if (pricing.getCancellationFeeCap() != null && pricing.getCancellationFeeCap() > 0) {
                        cap = pricing.getCancellationFeeCap();
                    }
                }
            } catch (RuntimeException ignored) {
                // Fallback to policy v1 defaults min(2%, 100,000 VND) when snapshot JSONB table is absent.
            }
        }
        long calculated = total.multiply(rate).setScale(0, RoundingMode.HALF_UP).longValueExact();
        return Math.min(calculated, cap);
    }

    private UUID resolveCaseId(UUID orderId, UUID requestedCaseId) {
        if (trustClient != null) {
            try {
                var status = trustClient.disputeStatus(orderId);
                if (status != null && orderId.equals(status.orderId()) && status.activeDisputeId() != null) {
                    return status.activeDisputeId();
                }
            } catch (RuntimeException ignored) {
                // Fallback to deterministic case ID when Trust is not reachable synchronously.
            }
        }
        if (requestedCaseId != null) {
            return requestedCaseId;
        }
        return UUID.nameUUIDFromBytes(("cancel-case:" + orderId).getBytes(StandardCharsets.UTF_8));
    }

    private Instant currentInstant() {
        return clock == null ? Instant.now() : clock.instant();
    }

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

    private void releaseSlotAfterCommit(UUID slotId, UUID orderId) {

        if (slotId == null) {
            return;
        }

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            try {
                catalogClient.releaseSlot(slotId, SlotActionRequest.builder()
                        .orderId(orderId)
                        .build());
            } catch (Exception e) {
                log.warn("Release slot {} failed for cancelled order {}", slotId, orderId, e);
            }
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

    private Order lockOrder(UUID orderId) {
        return orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }

    private Order loadOrder(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }

}
