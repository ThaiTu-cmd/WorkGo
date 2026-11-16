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
        Instant resolvedAt) {
}
