package com.workgo.order.dto.request;

import java.time.Instant;
import java.util.UUID;

public record OrderCompletedEvent(String eventId, UUID orderId, UUID clientId, UUID providerId,
                                  UUID serviceId, Instant completedAt) {}
