package com.workgo.trust.dto.response;

import java.util.UUID;
import java.time.Instant;
import com.workgo.trust.enumeration.*;

public record DisputeDto(
        UUID disputeId,
        UUID orderId,
        UUID openedBy,
        String openedByRole,
        UUID clientId,
        UUID providerId,
        String reason,
        String description,
        String evidenceUrl,
        DisputeStatus status,
        String resolution,
        Instant createdAt,
        Instant resolvedAt,
        UUID assignedAdminId,
        Instant claimedAt,
        String evidenceRequest,
        Instant evidenceRequestedAt,
        Instant evidenceDeadline,
        Instant clientEvidenceAckAt,
        Instant providerEvidenceAckAt,
        Instant clientEvidenceDeadline,
        Instant providerEvidenceDeadline,
        Instant clientEvidenceExtendedUntil,
        Instant providerEvidenceExtendedUntil,
        boolean clientExtensionUsed,
        boolean providerExtensionUsed,
        String clientExtensionReason,
        String providerExtensionReason,
        Instant intakeSlaDueAt,
        Instant intakeEscalatedAt,
        Instant decisionSlaDueAt,
        Instant decisionEscalatedAt,
        UUID decisionId,
        Long version) {
}
