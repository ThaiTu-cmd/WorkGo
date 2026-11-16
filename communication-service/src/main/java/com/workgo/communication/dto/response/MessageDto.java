package com.workgo.communication.dto.response;

import com.workgo.communication.enumeration.MessageType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MessageDto(UUID id, UUID conversationId, UUID senderId, String content,
                         MessageType messageType, List<MediaAttachmentDto> attachments,
                         Instant sentAt, Instant readAt) {
}
