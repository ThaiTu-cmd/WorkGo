package com.workgo.trust.dto.response.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Instant;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record InternalOrderTrustSnapshot(
        UUID orderId,
        String orderNumber,
        UUID clientId,
        UUID providerId,
        UUID serviceId,
        String sourceType,
        String executionType,
        String orderStatus,
        String paymentStatus,
        Instant placedAt,
        Instant deliveredAt,
        Instant completedAt,
        Instant cancelledAt,
        Instant scheduledStart,
        Instant scheduledEnd,
        Instant startedAt) {

    public InternalOrderTrustSnapshot(
            UUID orderId,
            String orderNumber,
            UUID clientId,
            UUID providerId,
            UUID serviceId,
            String sourceType,
            String executionType,
            String orderStatus,
            String paymentStatus,
            Instant placedAt,
            Instant deliveredAt,
            Instant completedAt,
            Instant cancelledAt) {
        this(orderId, orderNumber, clientId, providerId, serviceId, sourceType, executionType,
                orderStatus, paymentStatus, placedAt, deliveredAt, completedAt, cancelledAt,
                null, null, null);
    }
}
