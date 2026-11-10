package com.workgo.order.dto.snapshot;

import com.workgo.order.dto.request.CreateProposalOrderRequest;
import java.math.BigDecimal;
import java.util.UUID;

/** Frozen source/terms used for audit and idempotent replay, independent of later Job availability. */
public record ProposalSnapshot(UUID proposalId, UUID jobId, UUID clientId, UUID providerId, String executionType,
        BigDecimal price, String currency, Integer estimatedDays, String jobTitle, String jobDescription,
        String locationSnapshot, String terms) {
    public ProposalSnapshot {
        if (price != null) price = price.stripTrailingZeros();
    }

    public static ProposalSnapshot from(CreateProposalOrderRequest r) {
        return new ProposalSnapshot(r.proposalId(), r.jobId(), r.clientId(), r.providerId(), r.executionType(),
                r.price(), r.currency(), r.estimatedDays(), r.jobTitle(), r.jobDescription(), r.locationSnapshot(), r.terms());
    }
}
