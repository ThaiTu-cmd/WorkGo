package com.workgo.order.dto.response.client;

import java.util.UUID;

public record TrustDisputeStatus(UUID orderId, Boolean hasActiveDispute, UUID activeDisputeId, String status) {}
