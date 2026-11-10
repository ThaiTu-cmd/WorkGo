package com.workgo.job.dto.response;

import com.workgo.job.enumeration.ProposalStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Private response; association IDs prevent recursive entity serialization. */
public record ProposalDto(UUID proposalId, UUID jobId, UUID applicationId, UUID providerId,
                          BigDecimal price, String currency, Integer estimatedDays, String message,
                          String terms, Instant expiresAt, ProposalStatus status,
                          Instant createdAt, Instant updatedAt) {
}
