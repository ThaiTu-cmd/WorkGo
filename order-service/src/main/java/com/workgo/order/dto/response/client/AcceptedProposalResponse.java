package com.workgo.order.dto.response.client;

import com.workgo.order.dto.snapshot.ProposalSnapshot;
import java.math.BigDecimal;
import java.util.UUID;

public record AcceptedProposalResponse(UUID proposalId, UUID jobId, UUID clientId, UUID providerId,
        String executionType, BigDecimal price, String currency, Integer estimatedDays, String jobTitle,
        String jobDescription, String locationSnapshot, String terms, String proposalStatus,
        String jobStatus, String applicationStatus) {
    public ProposalSnapshot snapshot() {
        return new ProposalSnapshot(proposalId, jobId, clientId, providerId, executionType, price, currency,
                estimatedDays, jobTitle, jobDescription, locationSnapshot, terms);
    }
}
