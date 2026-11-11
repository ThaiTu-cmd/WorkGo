package com.workgo.job.dto.response.client;

import java.util.UUID;

public record ProposalOrderResponse(UUID orderId, UUID proposalId, UUID jobId, String sourceType, String status) {
}
