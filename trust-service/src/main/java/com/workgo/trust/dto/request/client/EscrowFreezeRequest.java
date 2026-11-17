package com.workgo.trust.dto.request.client;
import java.util.UUID;

public record EscrowFreezeRequest(UUID orderId, UUID disputeId, String reasonCode) {}
