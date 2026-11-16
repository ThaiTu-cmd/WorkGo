package com.workgo.communication.dto.response;

import java.time.Instant;
import java.util.UUID;

public record ParticipantDto(UUID userId, Instant joinedAt, Instant lastReadAt) {
}
