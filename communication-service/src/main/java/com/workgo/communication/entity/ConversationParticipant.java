package com.workgo.communication.entity;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.UUID;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationParticipant {
    @NotNull
    private UUID userId;

    @NotNull
    private Instant joinedAt;

    private Instant lastReadAt;
}
