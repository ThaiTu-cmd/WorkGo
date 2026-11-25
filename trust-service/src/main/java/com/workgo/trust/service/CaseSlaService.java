package com.workgo.trust.service;

import com.workgo.trust.entity.Dispute;
import com.workgo.trust.entity.PrivateEvidence;
import com.workgo.trust.entity.TrustAdminAudit;
import com.workgo.trust.enumeration.DisputeStatus;
import com.workgo.trust.repository.DisputeRepository;
import com.workgo.trust.repository.PrivateEvidenceRepository;
import com.workgo.trust.repository.TrustAdminAuditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * Case SLA evaluator (D05 / DEV-08):
 * - 24h intake target for OPEN disputes -> durable escalation & notification, never auto-decides or penalizes.
 * - 72h decision target after both parties provide READY evidence or evidence deadlines expire -> durable reminder/escalation,
 *   never treats missing evidence or silence as automatic loss/penalty.
 */
@Service
@RequiredArgsConstructor
public class CaseSlaService {
    private static final long INTAKE_SLA_SECONDS = 24L * 3600L;
    private static final long DECISION_SLA_SECONDS = 72L * 3600L;

    private final DisputeRepository disputes;
    private final PrivateEvidenceRepository evidenceFiles;
    private final TrustAdminAuditRepository audits;
    private final TrustTransactions transactions;
    private final TrustOutbox outbox;

    public record SlaScanResult(int intakeEscalated, int decisionEscalated) {}

    public SlaScanResult evaluateDueCases() {
        return evaluateDueCases(Instant.now());
    }

    public SlaScanResult evaluateDueCases(Instant now) {
        List<Dispute> active = disputes.findAll((root, query, cb) ->
                root.get("status").in(DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW));
        int intakeCount = 0;
        int decisionCount = 0;
        for (Dispute candidate : active) {
            EscalationOutcome outcome = evaluateCaseOutcome(candidate.getDisputeId(), now);
            if (outcome == EscalationOutcome.INTAKE_ESCALATED) intakeCount++;
            else if (outcome == EscalationOutcome.DECISION_ESCALATED) decisionCount++;
        }
        return new SlaScanResult(intakeCount, decisionCount);
    }

    public boolean evaluateCase(UUID disputeId, Instant now) {
        return evaluateCaseOutcome(disputeId, now) != EscalationOutcome.NONE;
    }

    public enum EscalationOutcome {
        NONE,
        INTAKE_ESCALATED,
        DECISION_ESCALATED
    }

    public EscalationOutcome evaluateCaseOutcome(UUID disputeId, Instant now) {
        Dispute sample = disputes.findById(disputeId).orElse(null);
        if (sample == null) return EscalationOutcome.NONE;
        return transactions.locked(List.of("order:" + sample.getOrderId()), () -> {
            Dispute d = disputes.findById(disputeId).orElse(null);
            if (d == null || d.getDecisionId() != null) return EscalationOutcome.NONE;

            if (d.getStatus() == DisputeStatus.OPEN && d.getAssignedAdminId() == null) {
                Instant baseCreated = d.getCreatedAt() != null ? d.getCreatedAt() : now;
                Instant intakeDue = d.getIntakeSlaDueAt() != null ? d.getIntakeSlaDueAt() : baseCreated.plusSeconds(INTAKE_SLA_SECONDS);
                if (d.getIntakeSlaDueAt() == null) {
                    d.setIntakeSlaDueAt(intakeDue);
                }
                if (d.getIntakeEscalatedAt() == null && !now.isBefore(intakeDue)) {
                    d.setIntakeEscalatedAt(now);
                    audits.save(TrustAdminAudit.system(
                            d.getDisputeId(),
                            "DISPUTE_SLA_INTAKE_ESCALATED",
                            "Dispute intake 24h SLA exceeded",
                            "OPEN",
                            "OPEN_ESCALATED"
                    ));
                    outbox.notify(d.getClientId(), null, "DISPUTE_SLA_INTAKE_OVERDUE", "DISPUTE", d.getDisputeId());
                    outbox.notify(null, d.getProviderId(), "DISPUTE_SLA_INTAKE_OVERDUE", "DISPUTE", d.getDisputeId());
                    disputes.saveAndFlush(d);
                    return EscalationOutcome.INTAKE_ESCALATED;
                }
                disputes.saveAndFlush(d);
                return EscalationOutcome.NONE;
            }

            if (d.getStatus() == DisputeStatus.UNDER_REVIEW && d.getDecisionId() == null) {
                Instant decisionDue = computeDecisionSlaDueAt(d);
                if (decisionDue != null && !Objects.equals(d.getDecisionSlaDueAt(), decisionDue)) {
                    d.setDecisionSlaDueAt(decisionDue);
                }
                if (decisionDue != null && d.getDecisionEscalatedAt() == null && !now.isBefore(decisionDue)) {
                    d.setDecisionEscalatedAt(now);
                    audits.save(TrustAdminAudit.system(
                            d.getDisputeId(),
                            "DISPUTE_SLA_DECISION_ESCALATED",
                            "Dispute decision 72h SLA exceeded",
                            "UNDER_REVIEW",
                            "UNDER_REVIEW_ESCALATED"
                    ));
                    if (d.getAssignedAdminId() != null) {
                        outbox.notify(d.getAssignedAdminId(), null, "DISPUTE_SLA_DECISION_OVERDUE", "DISPUTE", d.getDisputeId());
                    }
                    disputes.saveAndFlush(d);
                    return EscalationOutcome.DECISION_ESCALATED;
                }
                disputes.saveAndFlush(d);
            }
            return EscalationOutcome.NONE;
        });
    }

    public Instant computeDecisionSlaDueAt(Dispute d) {
        if (d.getStatus() != DisputeStatus.UNDER_REVIEW || d.getDecisionId() != null) {
            return d.getDecisionSlaDueAt();
        }
        if (d.getEvidenceRequest() == null) {
            return d.getClaimedAt() != null ? d.getClaimedAt().plusSeconds(DECISION_SLA_SECONDS) : d.getDecisionSlaDueAt();
        }
        Instant clientDeadline = d.getClientEvidenceDeadline();
        Instant providerDeadline = d.getProviderEvidenceDeadline();
        if (clientDeadline == null || providerDeadline == null) {
            return null;
        }
        List<PrivateEvidence> readyFiles = evidenceFiles.findByDisputeIdOrderByCreatedAtAsc(d.getDisputeId()).stream()
                .filter(e -> "READY".equals(e.getStatus()))
                .filter(e -> d.getEvidenceRequestedAt() == null || e.getCreatedAt() == null || !e.getCreatedAt().isBefore(d.getEvidenceRequestedAt()))
                .toList();

        Instant clientUploadedAt = readyFiles.stream()
                .filter(e -> d.getClientId().equals(e.getUploaderId()))
                .map(PrivateEvidence::getCreatedAt)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
        Instant providerUploadedAt = readyFiles.stream()
                .filter(e -> !d.getClientId().equals(e.getUploaderId()))
                .map(PrivateEvidence::getCreatedAt)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);

        Instant clientReadyAt = (!d.isClientExtensionUsed() && clientUploadedAt != null && clientUploadedAt.isBefore(clientDeadline))
                ? clientUploadedAt
                : clientDeadline;
        Instant providerReadyAt = (!d.isProviderExtensionUsed() && providerUploadedAt != null && providerUploadedAt.isBefore(providerDeadline))
                ? providerUploadedAt
                : providerDeadline;

        Instant evidencePhaseCompletedAt = clientReadyAt.isAfter(providerReadyAt) ? clientReadyAt : providerReadyAt;
        return evidencePhaseCompletedAt.plusSeconds(DECISION_SLA_SECONDS);
    }
}
