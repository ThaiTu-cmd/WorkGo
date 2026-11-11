package com.workgo.order.dto.response;

import java.util.UUID;

public record ProposalOrderResponse(UUID orderId, UUID proposalId, UUID jobId, String sourceType, String status) {
}
