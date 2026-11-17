package com.workgo.order.service;

import com.workgo.order.dto.request.AmendmentCreationRequest;
import com.workgo.order.dto.request.AmendmentRespondRequest;
import com.workgo.order.dto.response.OrderAgreementVersionResponse;
import com.workgo.order.dto.response.OrderAmendmentResponse;
import com.workgo.order.dto.snapshot.ExecutionSnapshot;
import com.workgo.order.dto.snapshot.PackageSnapshot;
import com.workgo.order.dto.snapshot.ProposalSnapshot;
import com.workgo.order.dto.snapshot.ServiceSnapshot;
import com.workgo.order.entity.*;
import com.workgo.order.enumeration.AmendmentStatus;
import com.workgo.order.enumeration.ExecutionType;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.enumeration.RoleName;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.mapper.OrderAgreementMapper;
import com.workgo.order.reppository.*;
import com.workgo.order.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class OrderAgreementService {

    OrderRepository orderRepository;
    OrderSnapshotRepository orderSnapshotRepository;
    OrderAgreementVersionRepository orderAgreementVersionRepository;
    OrderAmendmentRepository orderAmendmentRepository;
    ExecutionRepository executionRepository;
    DigitalExecutionRepository digitalExecutionRepository;
    OrderAgreementMapper orderAgreementMapper;
    TokenUtils tokenUtils;

    @Transactional
    public List<OrderAgreementVersionResponse> getAgreementVersions(UUID orderId) {

        Order order = loadOrder(orderId);
        tokenUtils.assertParticipant(order);
        currentVersion(order);

        return orderAgreementVersionRepository.findAllByOrderIdOrderByVersionNoAsc(orderId).stream()
                .map(orderAgreementMapper::toOrderAgreementVersionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderAmendmentResponse> getAmendments(UUID orderId) {

        tokenUtils.assertParticipant(loadOrder(orderId));

        return orderAmendmentRepository.findAllByOrderIdOrderByCreatedAtDesc(orderId).stream()
                .map(orderAgreementMapper::toOrderAmendmentResponse)
                .toList();
    }

    //ban 1 dung tu snapshot da dong bang luc tao don: provider chot offer/proposal, client dat/chap nhan dung ban do
    @Transactional
    public OrderAgreementVersion currentVersion(Order order) {

        return orderAgreementVersionRepository.findTopByOrderIdOrderByVersionNoDesc(order.getOrderId())
                .orElseGet(() -> orderAgreementVersionRepository.save(initialFromSnapshot(order)));
    }

    @Transactional
    public OrderAmendmentResponse propose(UUID orderId, AmendmentCreationRequest request) {

        Order order = loadOrder(orderId);
        tokenUtils.assertParticipant(order);
        assertAmendable(order);

        OrderAgreementVersion current = currentVersion(order);
        assertRealChange(order, current, request);

        if (orderAmendmentRepository.existsByOrderIdAndStatus(orderId, AmendmentStatus.PENDING.name())) {
            throw new AppException(ErrorCode.ORDER_AMENDMENT_PENDING_EXISTS);
        }

        OrderAmendment amendment = orderAmendmentRepository.save(OrderAmendment.builder()
                .orderId(orderId)
                .baseVersionNo(current.getVersionNo())
                .proposedBy(tokenUtils.getCurrentUserId())
                .proposedByRole(currentRole(order).name())
                .newScope(request.getNewScope())
                .newPrice(request.getNewPrice())
                .newDurationDays(request.getNewDurationDays())
                .reason(request.getReason())
                .status(AmendmentStatus.PENDING.name())
                .build());

        return orderAgreementMapper.toOrderAmendmentResponse(amendment);
    }

    @Transactional
    public OrderAmendmentResponse accept(UUID orderId, UUID amendmentId, AmendmentRespondRequest request) {

        Order order = loadOrder(orderId);
        tokenUtils.assertParticipant(order);
        assertAmendable(order);

        OrderAmendment amendment = loadPendingAmendmentOfOtherSide(order, amendmentId);
        OrderAgreementVersion current = currentVersion(order);

        if (!current.getVersionNo().equals(amendment.getBaseVersionNo())) {
            throw new AppException(ErrorCode.ORDER_AMENDMENT_STALE);
        }

        Instant now = Instant.now();
        amendment.setRespondedBy(tokenUtils.getCurrentUserId());
        amendment.setRespondedAt(now);
        amendment.setResponseNote(request == null ? null : request.getNote());

        //doi gia can giu/hoan tien chenh lech tu vi (phan D) nen chua ap dung
        if (amendment.getNewPrice() != null) {
            amendment.setStatus(AmendmentStatus.AWAITING_PAYMENT.name());
            return orderAgreementMapper.toOrderAmendmentResponse(orderAmendmentRepository.save(amendment));
        }

        boolean providerProposed = RoleName.PROVIDER.name().equals(amendment.getProposedByRole());

        OrderAgreementVersion next = orderAgreementVersionRepository.save(OrderAgreementVersion.builder()
                .orderId(orderId)
                .versionNo(current.getVersionNo() + 1)
                .source("AMENDMENT")
                .scope(amendment.getNewScope() != null ? amendment.getNewScope() : current.getScope())
                .acceptanceCriteria(current.getAcceptanceCriteria())
                .price(current.getPrice())
                .currency(current.getCurrency())
                .durationDays(amendment.getNewDurationDays() != null ? amendment.getNewDurationDays() : current.getDurationDays())
                .scheduleStart(current.getScheduleStart())
                .scheduleEnd(current.getScheduleEnd())
                .amendmentId(amendmentId)
                .providerConfirmedAt(providerProposed ? amendment.getCreatedAt() : now)
                .clientConfirmedAt(providerProposed ? now : amendment.getCreatedAt())
                .build());

        if (amendment.getNewDurationDays() != null) moveDigitalDeadline(order, next.getDurationDays());

        amendment.setStatus(AmendmentStatus.APPLIED.name());

        return orderAgreementMapper.toOrderAmendmentResponse(orderAmendmentRepository.save(amendment));
    }

    @Transactional
    public OrderAmendmentResponse reject(UUID orderId, UUID amendmentId, AmendmentRespondRequest request) {

        Order order = loadOrder(orderId);
        tokenUtils.assertParticipant(order);

        OrderAmendment amendment = loadPendingAmendmentOfOtherSide(order, amendmentId);
        amendment.setStatus(AmendmentStatus.REJECTED.name());
        amendment.setRespondedBy(tokenUtils.getCurrentUserId());
        amendment.setRespondedAt(Instant.now());
        amendment.setResponseNote(request == null ? null : request.getNote());

        return orderAgreementMapper.toOrderAmendmentResponse(orderAmendmentRepository.save(amendment));
    }

    //=====================================

    private OrderAgreementVersion initialFromSnapshot(Order order) {

        OrderSnapshot snapshot = orderSnapshotRepository.findById(order.getOrderId()).orElse(null);
        ProposalSnapshot proposal = snapshot == null ? null : snapshot.getProposalSnapshot();

        OrderAgreementVersion.OrderAgreementVersionBuilder builder = OrderAgreementVersion.builder()
                .orderId(order.getOrderId())
                .versionNo(1)
                .price(order.getSubtotal())
                .currency(order.getCurrency())
                .providerConfirmedAt(order.getPlacedAt())
                .clientConfirmedAt(order.getPlacedAt());

        if (proposal != null) {
            return builder.source("PROPOSAL")
                    .scope(join(proposal.jobTitle(), proposal.jobDescription()))
                    .acceptanceCriteria(proposal.terms())
                    .durationDays(proposal.estimatedDays())
                    .build();
        }

        ServiceSnapshot service = snapshot == null ? null : snapshot.getServiceSnapshot();
        PackageSnapshot pkg = snapshot == null ? null : snapshot.getPackageSnapshot();
        ExecutionSnapshot execution = snapshot == null ? null : snapshot.getExecutionSnapshot();

        return builder.source("SERVICE_LISTING")
                .scope(join(service == null ? order.getTitle() : service.getTitle(), pkg == null ? null : pkg.getName()))
                .acceptanceCriteria(pkg == null ? null : pkg.getDescription())
                .durationDays(pkg == null ? null : pkg.getDeliveryDay())
                .scheduleStart(execution == null ? null : execution.getScheduleStart())
                .scheduleEnd(execution == null ? null : execution.getScheduleEnd())
                .build();
    }

    private void assertAmendable(Order order) {

        if (order.getOrderStatus() == OrderStatus.COMPLETED || order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.ORDER_AMENDMENT_NOT_ALLOWED);
        }
    }

    private void assertRealChange(Order order, OrderAgreementVersion current, AmendmentCreationRequest request) {

        if (request.getReason() == null || request.getReason().isBlank()) {
            throw new AppException(ErrorCode.ORDER_AMENDMENT_INVALID);
        }

        BigDecimal newPrice = request.getNewPrice();
        if (newPrice != null && (newPrice.signum() <= 0 || newPrice.stripTrailingZeros().scale() > 0)) {
            throw new AppException(ErrorCode.ORDER_AMENDMENT_INVALID);
        }

        Integer newDays = request.getNewDurationDays();
        if (newDays != null && (newDays <= 0 || order.getExecutionType() != ExecutionType.DIGITAL)) {
            throw new AppException(ErrorCode.ORDER_AMENDMENT_INVALID);
        }

        boolean scopeChanged = request.getNewScope() != null && !request.getNewScope().isBlank()
                && !request.getNewScope().equals(current.getScope());
        boolean priceChanged = newPrice != null && newPrice.compareTo(current.getPrice()) != 0;
        boolean daysChanged = newDays != null && !newDays.equals(current.getDurationDays());

        if (!scopeChanged && !priceChanged && !daysChanged) {
            throw new AppException(ErrorCode.ORDER_AMENDMENT_INVALID);
        }
    }

    private OrderAmendment loadPendingAmendmentOfOtherSide(Order order, UUID amendmentId) {

        OrderAmendment amendment = orderAmendmentRepository.findByAmendmentIdAndOrderId(amendmentId, order.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_AMENDMENT_NOT_FOUND));

        if (!AmendmentStatus.PENDING.name().equals(amendment.getStatus())) {
            throw new AppException(ErrorCode.ORDER_AMENDMENT_NOT_PENDING);
        }

        if (currentRole(order).name().equals(amendment.getProposedByRole())) {
            throw new AppException(ErrorCode.ORDER_AMENDMENT_SELF_RESPOND);
        }

        return amendment;
    }

    //deadline chi doi khi phu luc da duoc ca hai ben chot, tinh lai tu moc bat dau cu
    private void moveDigitalDeadline(Order order, Integer durationDays) {

        if (order.getExecutionType() != ExecutionType.DIGITAL || durationDays == null) return;

        executionRepository.findByOrder_OrderId(order.getOrderId()).ifPresent(execution ->
                digitalExecutionRepository.findByExecution_ExecutionId(execution.getExecutionId())
                        .filter(digital -> digital.getDeadlineAt() != null && execution.getStartedAt() != null)
                        .ifPresent(digital -> {
                            digital.setDeadlineAt(execution.getStartedAt().plus(Duration.ofDays(durationDays)));
                            digitalExecutionRepository.save(digital);
                        }));
    }

    private RoleName currentRole(Order order) {

        return tokenUtils.getCurrentUserId().equals(order.getClientId()) ? RoleName.CLIENT : RoleName.PROVIDER;
    }

    private Order loadOrder(UUID orderId) {

        return orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }

    private String join(String first, String second) {

        return Objects.requireNonNullElse(first, "") + (second == null || second.isBlank() ? "" : "\n" + second);
    }
}
