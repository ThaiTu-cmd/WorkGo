package com.workgo.trust.dto.response.client;
import java.time.Instant;
import java.util.UUID;

public record InternalOrderTrustSnapshot(UUID orderId, String orderNumber, UUID clientId, UUID providerId,
        UUID serviceId, String sourceType, String executionType, String orderStatus, String paymentStatus,
        Instant placedAt, Instant deliveredAt, Instant completedAt, Instant cancelledAt) {}
