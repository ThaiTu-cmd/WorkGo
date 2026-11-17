package com.workgo.trust.dto.response.client;
import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(UUID id, UUID recipientId, String type, String title,
        String content, String referenceType, UUID referenceId, Instant readAt, Instant createdAt) {}
