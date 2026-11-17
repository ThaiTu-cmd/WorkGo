package com.workgo.trust.dto.request.client;
import java.util.UUID;

/** eventId identifies one durable recipient delivery, reused on every retry. */
public record InternalNotificationCreateReq(UUID eventId, UUID recipientId, String type, String title,
        String content, String referenceType, UUID referenceId) {}
