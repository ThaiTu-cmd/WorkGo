package com.workgo.identity.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminActionLogResponse {

    UUID adminActionLogId;

    UUID actorId;

    String actorRole;

    String action;

    String targetType;

    String targetId;

    String reason;

    String beforeState;

    String afterState;

    String correlationId;

    Instant createdAt;
}
