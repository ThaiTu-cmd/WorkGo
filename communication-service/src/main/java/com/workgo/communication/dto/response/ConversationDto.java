package com.workgo.communication.dto.response;

import com.workgo.communication.enumeration.ContextType;
import com.workgo.communication.enumeration.ConversationStatus;
import com.workgo.communication.enumeration.ConversationType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ConversationDto(UUID id, ConversationType conversationType, ContextType contextType,
                              UUID contextId, ConversationStatus status, List<ParticipantDto> participants,
                              long unreadCount, Instant createdAt, Instant lastMessageAt) {
}
