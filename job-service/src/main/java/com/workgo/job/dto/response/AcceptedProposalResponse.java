package com.workgo.job.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

/** Current source snapshot; consumers must check the three statuses before creating an order. */
public record AcceptedProposalResponse(
        UUID proposalId, UUID jobId, UUID clientId, UUID providerId,
        String executionType, BigDecimal price, String currency, Integer estimatedDays,
        String jobTitle, String jobDescription, String locationSnapshot, String terms,
        String proposalStatus, String jobStatus, String applicationStatus) {
}
