package com.workgo.order.service;

import com.workgo.order.entity.*;
import com.workgo.order.enumeration.*;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.reppository.*;
import com.workgo.order.reppository.client.OrderNotificationClient;
import com.workgo.order.utils.TokenUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LatenessAssessmentService {

    private static final Set<String> SUPERFICIAL_RESPONSES = Set.of(
            "dang lam", "đang làm", "working", "in progress", "ok", "okay",
            "hello", "hi", "xin chao", "xin chào", "chao", "chào", "soon", "wait", "cho chut"
    );

    private final OrderRepository orders;
    private final ExecutionRepository executions;
    private final DigitalExecutionRepository digitals;
    private final OrderTimerStateRepository timers;
    private final OrderLatenessStateRepository latenessStates;
    private final OrderDisputeDecisionRepository decisions;
    private final StoredFileRepository storedFiles;
    private final OrderNotificationClient notifications;
    private final TokenUtils tokenUtils;
    private final Clock clock;

    public record ProgressResponseCommand(
            String progressSummary,
            String evidenceRef,
            String proposedRemedy,
            Instant proposedRemedyAt
    ) {}

    public record ExplanationCommand(
            String explanationText,
            String evidenceRef
    ) {}

    public record ConclusionView(
            boolean hasOfficialConclusion,
            UUID decisionId,
            UUID disputeId,
            String operation,
            int officialPenaltyPoints,
            String statusNote
    ) {}

    public record FinancialView(
            OrderPaymentMethod paymentMethod,
            PaymentStatus paymentStatus,
            BigDecimal totalAmount,
            boolean financialSettled
    ) {}

    public record LatenessAssessment(
            UUID orderId,
            ExecutionType executionType,
            boolean digitalLatenessApplicable,
            boolean late,
            Instant deadlineAt,
            Instant evaluatedAt,
            long responsibleLateSeconds,
            long responsibleLateHours,
            int projectedCycles,
            int currentCycleProposal,
            int projectedPenaltyPoints,
            boolean officialProgressResponded,
            Instant progressResponseDueAt,
            String progressSummary,
            String progressEvidenceRef,
            String proposedRemedy,
            Instant proposedRemedyAt,
            boolean verificationOpened,
            Instant verificationOpenedAt,
            Instant verificationNotificationAckAt,
            Instant explanationDueAt,
            boolean explanationOverdue,
            boolean explanationSubmitted,
            String explanationText,
            String explanationEvidenceRef,
            boolean escalatedToAdmin7d,
            int autoAbandonmentPenalty,
            ConclusionView conclusion,
            FinancialView financial
    ) {}

    @Transactional
    public LatenessAssessment assessLate(UUID orderId) {
        return assessLate(orderId, clock.instant());
    }

    @Transactional
    public LatenessAssessment assessLate(UUID orderId, Instant asOf) {
        Instant evalTime = asOf == null ? clock.instant() : asOf;
        Order order = orders.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        ConclusionView conclusion = buildConclusionView(orderId);
        FinancialView financial = buildFinancialView(order);

        if (order.getExecutionType() != ExecutionType.DIGITAL) {
            return new LatenessAssessment(
                    orderId,
                    order.getExecutionType(),
                    false,
                    false,
                    null,
                    evalTime,
                    0L,
                    0L,
                    0,
                    0,
                    0,
                    false,
                    null,
                    null,
                    null,
                    null,
                    null,
                    false,
                    null,
                    null,
                    null,
                    false,
                    false,
                    null,
                    null,
                    false,
                    0,
                    conclusion,
                    financial
            );
        }

        Execution execution = executions.findByOrder_OrderId(orderId).orElse(null);
        DigitalExecution digital = execution == null ? null
                : digitals.findByExecution_ExecutionId(execution.getExecutionId()).orElse(null);
        Instant deadlineAt = digital == null ? null : digital.getDeadlineAt();

        OrderLatenessState state = latenessStates.findById(orderId)
                .orElseGet(() -> OrderLatenessState.builder().orderId(orderId).deadlineSnapshot(deadlineAt).build());
        if (deadlineAt != null && !Objects.equals(state.getDeadlineSnapshot(), deadlineAt)) {
            state.setDeadlineSnapshot(deadlineAt);
        }

        boolean hasValidDelivery = order.getOrderStatus() == OrderStatus.DELIVERED
                || order.getOrderStatus() == OrderStatus.COMPLETED
                || (order.getDeliveredAt() != null && !order.getDeliveredAt().isAfter(evalTime));

        if (order.getStartedAt() == null || deadlineAt == null || hasValidDelivery || !evalTime.isAfter(deadlineAt)) {
            latenessStates.save(state);
            return toAssessment(order, state, deadlineAt, evalTime, 0L, 0, 0, 0, conclusion, financial);
        }

        long exemptPausedSeconds = computeExemptPausedSeconds(orderId, evalTime);
        long rawLateSeconds = Math.max(0L, Duration.between(deadlineAt, evalTime).getSeconds());
        long responsibleLateSeconds = Math.max(0L, rawLateSeconds - exemptPausedSeconds);

        int rawCycles = (int) (responsibleLateSeconds / (24L * 3600L));
        int projectedCycles = Math.min(6, rawCycles);
        int currentCycleProposal = rawCycles <= 0 ? 0 : (rawCycles > 6 ? 6 : projectedCycles);
        int projectedPenaltyPoints = projectedCycles * (projectedCycles + 1) / 2;

        Instant progressDueAt = deadlineAt.plus(Duration.ofHours(24)).plusSeconds(exemptPausedSeconds);
        if (state.getProgressRespondedAt() == null && !evalTime.isBefore(progressDueAt)) {
            if (!state.isVerificationOpened()) {
                state.setVerificationOpened(true);
                state.setVerificationOpenedAt(evalTime);
            }
            if (state.getVerificationNoticeId() == null) {
                state.setVerificationNoticeId(UUID.nameUUIDFromBytes(
                        ("lateness-verify:" + orderId).getBytes(StandardCharsets.UTF_8)));
            }
            tryDeliverVerificationNotice(order, state, evalTime);
        }

        if (responsibleLateSeconds >= 7L * 24L * 3600L && !state.isEscalated7d()) {
            state.setEscalated7d(true);
            state.setEscalated7dAt(evalTime);
        }

        latenessStates.saveAndFlush(state);
        return toAssessment(order, state, deadlineAt, evalTime, responsibleLateSeconds,
                projectedCycles, currentCycleProposal, projectedPenaltyPoints, conclusion, financial);
    }

    @Transactional
    public LatenessAssessment submitProgressResponse(UUID orderId, ProgressResponseCommand command) {
        Order order = orders.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        assertProvider(order);
        if (order.getExecutionType() != ExecutionType.DIGITAL) {
            throw new AppException(ErrorCode.ORDER_EXECUTION_TYPE_NOT_SUPPORTED);
        }

        Instant now = clock.instant();
        validateProgressCommand(orderId, command, now);

        Execution execution = executions.findByOrder_OrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_EXECUTION_NOT_FOUND));
        DigitalExecution digital = digitals.findByExecution_ExecutionId(execution.getExecutionId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_EXECUTION_NOT_FOUND));

        OrderLatenessState state = latenessStates.findById(orderId)
                .orElseGet(() -> OrderLatenessState.builder().orderId(orderId).deadlineSnapshot(digital.getDeadlineAt()).build());

        state.setProgressRespondedAt(now);
        state.setProgressSummary(command.progressSummary().strip());
        state.setProgressEvidenceRef(command.evidenceRef().strip());
        state.setProposedRemedy(command.proposedRemedy().strip());
        state.setProposedRemedyAt(command.proposedRemedyAt());
        latenessStates.saveAndFlush(state);

        return assessLate(orderId, now);
    }

    @Transactional
    public LatenessAssessment acknowledgeVerificationNotification(UUID orderId, Instant ackAt) {
        Order order = orders.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        OrderLatenessState state = latenessStates.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_LATENESS_EXPLANATION_INVALID));
        if (!state.isVerificationOpened()) {
            throw new AppException(ErrorCode.ORDER_LATENESS_EXPLANATION_INVALID);
        }
        Instant effectiveAck = ackAt == null ? clock.instant() : ackAt;
        if (state.getVerificationAckAt() == null) {
            state.setVerificationAckAt(effectiveAck);
            state.setExplanationDueAt(effectiveAck.plus(Duration.ofHours(48)));
            latenessStates.saveAndFlush(state);
        }
        return assessLate(order.getOrderId(), effectiveAck);
    }

    @Transactional
    public LatenessAssessment submitExplanation(UUID orderId, ExplanationCommand command) {
        Order order = orders.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        assertProvider(order);
        OrderLatenessState state = latenessStates.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_LATENESS_EXPLANATION_INVALID));

        Instant now = clock.instant();
        if (!state.isVerificationOpened()
                || command == null
                || isSuperficialOrBlank(command.explanationText())
                || (state.getExplanationDueAt() != null && now.isAfter(state.getExplanationDueAt()))) {
            throw new AppException(ErrorCode.ORDER_LATENESS_EXPLANATION_INVALID);
        }
        if (command.evidenceRef() != null && !command.evidenceRef().isBlank()) {
            validateEvidenceReference(orderId, command.evidenceRef().strip());
        }

        state.setExplanationSubmittedAt(now);
        state.setExplanationText(command.explanationText().strip());
        state.setExplanationEvidenceRef(command.evidenceRef() == null ? null : command.evidenceRef().strip());
        latenessStates.saveAndFlush(state);

        return assessLate(orderId, now);
    }

    private void tryDeliverVerificationNotice(Order order, OrderLatenessState state, Instant evalTime) {
        if (state.getVerificationAckAt() != null || state.getVerificationNoticeId() == null) {
            return;
        }
        try {
            var response = notifications.send(new OrderNotificationClient.Notice(
                    state.getVerificationNoticeId().toString(),
                    order.getProviderId(),
                    "ORDER_LATENESS_VERIFICATION",
                    "Lateness verification opened",
                    "No official 24h progress response was recorded. Submit your explanation and evidence within 48 hours.",
                    "ORDER",
                    order.getOrderId()
            ));
            var ack = response == null ? null : response.getResult();
            if (response != null
                    && response.getCode() == 1000
                    && ack != null
                    && ack.id() != null
                    && order.getProviderId().equals(ack.recipientId())
                    && "ORDER_LATENESS_VERIFICATION".equals(ack.type())
                    && "ORDER".equals(ack.referenceType())
                    && order.getOrderId().equals(ack.referenceId())) {
                state.setVerificationAckAt(evalTime);
                state.setExplanationDueAt(evalTime.plus(Duration.ofHours(48)));
            }
        } catch (RuntimeException ignored) {
            // Notification not yet acknowledged: 48h explanation countdown does not start until ACK.
        }
    }

    private long computeExemptPausedSeconds(UUID orderId, Instant asOf) {
        OrderTimerState timer = timers.findById(orderId).orElse(null);
        if (timer == null) {
            return 0L;
        }
        long activePause = 0L;
        if (timer.getPausedAt() != null && asOf.isAfter(timer.getPausedAt())) {
            activePause = Duration.between(timer.getPausedAt(), asOf).getSeconds();
        }
        return Math.max(0L, timer.getTotalPausedSeconds() + activePause);
    }

    private void validateProgressCommand(UUID orderId, ProgressResponseCommand command, Instant now) {
        if (command == null
                || isSuperficialOrBlank(command.progressSummary())
                || command.evidenceRef() == null || command.evidenceRef().isBlank()
                || isSuperficialOrBlank(command.proposedRemedy())
                || command.proposedRemedyAt() == null
                || !command.proposedRemedyAt().isAfter(now)) {
            throw new AppException(ErrorCode.ORDER_LATENESS_RESPONSE_INVALID);
        }
        validateEvidenceReference(orderId, command.evidenceRef().strip());
    }

    private void validateEvidenceReference(UUID orderId, String evidenceRef) {
        try {
            UUID fileId = UUID.fromString(evidenceRef);
            storedFiles.findById(fileId).ifPresent(file -> {
                if (!orderId.equals(file.getOrderId()) || !"READY".equals(file.getStatus())) {
                    throw new AppException(ErrorCode.ORDER_LATENESS_RESPONSE_INVALID);
                }
            });
        } catch (IllegalArgumentException ignored) {
            // Structured non-UUID evidence reference string is permitted if non-blank.
        }
    }

    private boolean isSuperficialOrBlank(String text) {
        if (text == null || text.isBlank()) {
            return true;
        }
        String normalized = text.strip().toLowerCase(Locale.ROOT).replaceAll("[.!?,;]+$", "");
        return normalized.length() < 10 || SUPERFICIAL_RESPONSES.contains(normalized);
    }

    private void assertProvider(Order order) {
        UUID providerId = tokenUtils.getCurrentProviderIdOrNull();
        if (providerId == null || !providerId.equals(order.getProviderId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private ConclusionView buildConclusionView(UUID orderId) {
        return decisions.findByOrderId(orderId)
                .map(d -> new ConclusionView(
                        true,
                        d.getDecisionId(),
                        d.getDisputeId(),
                        d.getOperation().name(),
                        0,
                        "OFFICIAL_TRUST_CONCLUSION_APPLIED"
                ))
                .orElseGet(() -> new ConclusionView(
                        false,
                        null,
                        null,
                        null,
                        0,
                        "PROJECTED_ONLY_AWAITING_TRUST_CONCLUSION"
                ));
    }

    private FinancialView buildFinancialView(Order order) {
        boolean settled = order.getPaymentStatus() == PaymentStatus.RELEASED
                || order.getPaymentStatus() == PaymentStatus.REFUNDED
                || order.getPaymentStatus() == PaymentStatus.CASH_SETTLED;
        return new FinancialView(
                order.getPaymentMethod(),
                order.getPaymentStatus(),
                order.getTotalAmount(),
                settled
        );
    }

    private LatenessAssessment toAssessment(
            Order order,
            OrderLatenessState state,
            Instant deadlineAt,
            Instant evalTime,
            long responsibleLateSeconds,
            int projectedCycles,
            int currentCycleProposal,
            int projectedPenaltyPoints,
            ConclusionView conclusion,
            FinancialView financial) {

        long exemptPausedSeconds = computeExemptPausedSeconds(order.getOrderId(), evalTime);
        Instant progressDueAt = deadlineAt == null ? null
                : deadlineAt.plus(Duration.ofHours(24)).plusSeconds(exemptPausedSeconds);
        boolean explanationOverdue = state.isVerificationOpened()
                && state.getExplanationSubmittedAt() == null
                && state.getExplanationDueAt() != null
                && evalTime.isAfter(state.getExplanationDueAt());

        return new LatenessAssessment(
                order.getOrderId(),
                order.getExecutionType(),
                true,
                responsibleLateSeconds > 0,
                deadlineAt,
                evalTime,
                responsibleLateSeconds,
                responsibleLateSeconds / 3600L,
                projectedCycles,
                currentCycleProposal,
                projectedPenaltyPoints,
                state.getProgressRespondedAt() != null,
                progressDueAt,
                state.getProgressSummary(),
                state.getProgressEvidenceRef(),
                state.getProposedRemedy(),
                state.getProposedRemedyAt(),
                state.isVerificationOpened(),
                state.getVerificationOpenedAt(),
                state.getVerificationAckAt(),
                state.getExplanationDueAt(),
                explanationOverdue,
                state.getExplanationSubmittedAt() != null,
                state.getExplanationText(),
                state.getExplanationEvidenceRef(),
                state.isEscalated7d(),
                0,
                conclusion,
                financial
        );
    }
}
