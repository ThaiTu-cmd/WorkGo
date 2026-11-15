package com.workgo.communication.dto.response;

import com.workgo.communication.enumeration.ReferenceType;

import java.time.Instant;
import java.util.UUID;

public record NotificationDto(UUID id, UUID recipientId, String type, String title, String content,
                              ReferenceType referenceType, UUID referenceId, Instant readAt, Instant createdAt) {
}
