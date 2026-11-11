package com.workgo.job.dto.response;

import com.workgo.job.enumeration.ApplicationStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Private response: the caller must authorize the job owner or application owner. */
public record ApplicationDto(UUID applicationId, UUID jobId, UUID providerId, String message,
                             ApplicationStatus status, Instant createdAt, Instant updatedAt,
                             ProviderBasicDto provider, List<ProposalDto> proposals) {
}
