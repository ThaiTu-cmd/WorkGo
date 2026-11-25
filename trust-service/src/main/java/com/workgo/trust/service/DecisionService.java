package com.workgo.trust.service;

import com.workgo.trust.dto.request.client.*;
import com.workgo.trust.dto.response.client.InternalOrderTrustSnapshot;
import com.workgo.trust.dto.response.client.OrderPaymentInfo;
import com.workgo.trust.entity.*;
import com.workgo.trust.enumeration.DisputeStatus;
import com.workgo.trust.exception.*;
import com.workgo.trust.repository.*;
import com.workgo.trust.repository.client.OrderClient;
import com.workgo.trust.utils.TokenUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DecisionService {
    private final DisputeRepository disputes;
    private final DisputeDecisionRepository decisions;
    private final OnsiteIncidentRepository onsiteIncidents;
    private final TrustAdminAuditRepository audits;
    private final TrustAdminService admin;
    private final TrustTransactions transactions;
    private final TrustOutbox outbox;
    private final OrderClient orders;
    private final TokenUtils token;
    private final ReputationService reputation;
    private final ReputationLedgerRepository reputationLedger;

    public static long calculateCancellationFee(BigDecimal totalAmount) {
        if (totalAmount == null || totalAmount.signum() <= 0) {
            return 0L;
        }
        long twoPercent = totalAmount.multiply(new BigDecimal("0.02"))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();
        return Math.min(twoPercent, 100_000L);
    }

    public DisputeDecision decide(
            UUID id,
            String operation,
            String branch,
            String reason,
            String evidence,
            long version,
            String fault,
            Integer cycles,
            UUID supersedes) {
        role();
        String faultType = fault == null ? "NONE" : fault;
        int lateCycles = cycles == null ? 0 : cycles;
        if (!Set.of("NONE", "LATE", "ABANDONMENT", "CAPABILITY", "CORRECTION").contains(faultType)
                || lateCycles < 0 || lateCycles > 6
                || "LATE".equals(faultType) && lateCycles < 1
                || !"LATE".equals(faultType) && lateCycles != 0
                || Set.of("ABANDONMENT", "CAPABILITY").contains(faultType) && (!"REFUND".equals(operation) || !"PROVIDER".equals(branch))
                || "CORRECTION".equals(faultType) && (!"REJECT".equals(operation) || supersedes == null)
                || !"CORRECTION".equals(faultType) && supersedes != null)
            throw new AppException(ErrorCode.INVALID_REQUEST);
        if (!Set.of("RELEASE", "REFUND", "REJECT").contains(operation)
                || !Set.of("NONE", "CLIENT", "PROVIDER").contains(branch)
                || reason == null || reason.isBlank() || reason.length() > 1000
                || evidence == null || evidence.isBlank() || evidence.length() > 2000
                || "RELEASE".equals(operation) && !"NONE".equals(branch))
            throw new AppException(ErrorCode.INVALID_REQUEST);

        var sample = disputes.findById(id).orElseThrow(DisputeNotFoundException::new);
        admin.independent(sample);

        InternalOrderTrustSnapshot orderSnapshot = orders.getOrderSnapshot(sample.getOrderId());
        if ("LATE".equals(faultType) && (orderSnapshot == null || !"DIGITAL".equals(orderSnapshot.executionType())))
            throw new AppException(ErrorCode.INVALID_REQUEST);

        if (orderSnapshot != null && "ONSITE".equals(orderSnapshot.executionType())) {
            validateOnsiteDecisionRules(sample, orderSnapshot, operation, branch, faultType, lateCycles);
        }

        if (supersedes != null) {
            var original = decisions.findById(supersedes).orElseThrow(() -> new AppException(ErrorCode.TARGET_NOT_FOUND));
            if (!sample.getOrderId().equals(original.getOrderId())
                    || original.getActorId().equals(token.getCurrentUserId())
                    || decisions.existsBySupersedesDecisionId(supersedes))
                throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        OrderPaymentInfo info;
        try {
            info = "REJECT".equals(operation) ? null : orders.paymentInfo(sample.getOrderId());
        } catch (RuntimeException ex) {
            throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        }
        if (!"REJECT".equals(operation) && (info == null || !sample.getOrderId().equals(info.orderId())
                || !sample.getClientId().equals(info.clientId()) || !sample.getProviderId().equals(info.providerId())
                || !"WALLET".equals(info.paymentMethod()) || !"VND".equals(info.currency())
                || info.totalAmount() == null || info.totalAmount().signum() <= 0 || info.totalAmount().stripTrailingZeros().scale() > 0
                || !Set.of("CONFIRMED", "IN_PROGRESS", "DELIVERED").contains(info.orderStatus())))
            throw new AppException(ErrorCode.INVALID_REQUEST);

        return transactions.locked(List.of("order:" + sample.getOrderId()), () -> {
            var d = disputes.findById(id).orElseThrow(DisputeNotFoundException::new);
            admin.assigned(d);
            if (!Objects.equals(d.getVersion(), version) || d.getDecisionId() != null)
                throw new AppException(ErrorCode.CONCURRENT_MODIFICATION);
            if (supersedes != null && decisions.existsBySupersedesDecisionId(supersedes))
                throw new AppException(ErrorCode.CONCURRENT_MODIFICATION);

            var decision = new DisputeDecision();
            UUID decisionId = UUID.randomUUID();
            decision.setDecisionId(decisionId);
            decision.setDisputeId(id);
            decision.setOrderId(d.getOrderId());
            decision.setActorId(token.getCurrentUserId());
            decision.setOperation(operation);
            decision.setReason(reason.strip());
            decision.setEvidenceSummary(evidence.strip());
            decision.setEffectiveAt(Instant.now());
            decision.setFaultType(faultType);
            decision.setLateCycles(lateCycles);
            decision.setSupersedesDecisionId(supersedes);
            d.setDecisionId(decisionId);
            d.setResolution(reason.strip());

            if ("REJECT".equals(operation)) {
                d.setStatus(DisputeStatus.REJECTED);
                d.setResolvedAt(decision.getEffectiveAt());
                // Conclusion is effective now; unfreeze and timer resume still need authoritative ACKs.
                decision.setPaymentStatus("PENDING");
                decision.setOrderStatus("PENDING");
                decision.setTimerStatus("PENDING");
            } else {
                boolean release = "RELEASE".equals(operation);
                decision.setSettlementPayload(outbox.encode(new SettlementCommand(
                        decisionId, d.getOrderId(), id, operation, branch,
                        release ? "PROVIDER" : "CLIENT",
                        release ? d.getProviderId() : d.getClientId(),
                        info.totalAmount(), info.currency(), info.feePolicyVersionId())));
            }

            decisions.saveAndFlush(decision);
            disputes.flush();

            updateOnsiteIncidentConclusion(d.getOrderId(), decisionId, operation, branch, faultType, info);

            if (supersedes != null) {
                for (var entry : reputationLedger.findByDecisionIdAndKind(supersedes, "PENALTY")) {
                    reputation.reverse(entry.getId(), decisionId, reason);
                }
            }
            audits.save(new TrustAdminAudit(token.getCurrentUserId(), id, "DISPUTE_DECISION", reason, "UNDER_REVIEW", operation));
            outbox.notify(d.getClientId(), null, "DISPUTE_DECIDED", "DISPUTE", id);
            outbox.notify(null, d.getProviderId(), "DISPUTE_DECIDED", "DISPUTE", id);
            return decision;
        });
    }

    public DisputeDecision retry(UUID id, String reason, long version) {
        role();
        if (reason == null || reason.isBlank() || reason.length() > 1000)
            throw new AppException(ErrorCode.INVALID_REQUEST);
        var sample = decisions.findById(id).orElseThrow(() -> new AppException(ErrorCode.TARGET_NOT_FOUND));
        var d = disputes.findById(sample.getDisputeId()).orElseThrow(DisputeNotFoundException::new);
        admin.independent(d);
        admin.assigned(d);
        return transactions.locked(List.of("order:" + d.getOrderId()), () -> {
            var decision = decisions.findById(id).orElseThrow();
            if (!Objects.equals(decision.getVersion(), version)
                    || !"NEEDS_RECONCILIATION".equals(decision.getExecutionStatus())
                    || decision.isTerminalConflict())
                throw new AppException(ErrorCode.CONCURRENT_MODIFICATION);
            decision.setAttempts(0);
            decision.setNextAttemptAt(Instant.now());
            decision.setLeaseToken(null);
            decision.setExecutionStatus("PENDING");
            decision.setLastError(null);
            audits.save(new TrustAdminAudit(token.getCurrentUserId(), d.getDisputeId(), "DECISION_RETRY", reason, "NEEDS_RECONCILIATION", "PENDING"));
            decisions.flush();
            return decision;
        });
    }

    private void validateOnsiteDecisionRules(
            Dispute dispute,
            InternalOrderTrustSnapshot orderSnapshot,
            String operation,
            String branch,
            String faultType,
            int lateCycles) {
        if ("LATE".equals(faultType) || lateCycles > 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        OnsiteIncident incident = onsiteIncidents == null ? null
                : onsiteIncidents.findByOrderId(dispute.getOrderId()).orElse(null);

        if (incident != null) {
            if ("CANCELLATION_BEFORE_24H".equals(incident.getIncidentType())) {
                if ("REFUND".equals(operation) && (!"NONE".equals(branch) || !"NONE".equals(faultType))) {
                    throw new AppException(ErrorCode.INVALID_REQUEST);
                }
            }
            if ("CLIENT_NO_SHOW".equals(incident.getIncidentType())) {
                // Client absence must never penalize the provider or charge the provider a cancellation fee.
                if ("PROVIDER".equals(branch) || !"NONE".equals(faultType)) {
                    throw new AppException(ErrorCode.INVALID_REQUEST);
                }
            }
            if (incident.isForceMajeure() && "NONE".equals(branch) && !"NONE".equals(faultType)) {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }
        } else if (orderSnapshot.startedAt() == null && orderSnapshot.scheduledStart() != null && dispute.getCreatedAt() != null) {
            if (!dispute.getCreatedAt().isAfter(orderSnapshot.scheduledStart().minus(Duration.ofHours(24)))) {
                if ("REFUND".equals(operation) && (!"NONE".equals(branch) || !"NONE".equals(faultType))) {
                    throw new AppException(ErrorCode.INVALID_REQUEST);
                }
            }
        }
    }

    private void updateOnsiteIncidentConclusion(
            UUID orderId,
            UUID decisionId,
            String operation,
            String branch,
            String faultType,
            OrderPaymentInfo info) {
        if (onsiteIncidents == null) {
            return;
        }
        onsiteIncidents.findByOrderId(orderId).ifPresent(incident -> {
            incident.setDecisionId(decisionId);
            incident.setConclusionStatus("CONCLUDED_" + operation);
            incident.setConcludedFaultParty(branch);
            incident.setConcludedFaultType(faultType);
            long fee = ("REFUND".equals(operation)
                    && ("CLIENT".equals(branch) || "PROVIDER".equals(branch))
                    && info != null)
                    ? calculateCancellationFee(info.totalAmount())
                    : 0L;
            incident.setApplicableCancellationFee(fee);
            incident.setArrivalFee(0L);
            incident.setFinancialStatus("REJECT".equals(operation) ? "NO_SETTLEMENT" : "SETTLEMENT_PENDING");
            onsiteIncidents.saveAndFlush(incident);
        });
    }

    private void role() {
        if (!token.hasRole("ROLE_ADMIN"))
            throw new org.springframework.security.access.AccessDeniedException("Administrator required");
    }
}
