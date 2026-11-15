package com.workgo.communication.entity;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.UUID;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "outbox_events")
public class OutboxEvent {
    @Id
    private UUID id;

    @NotNull
    private String aggregateType;

    @NotNull
    private UUID aggregateId;

    @NotNull
    private String eventType;

    @NotNull
    private String payload;

    @NotNull
    private Instant createdAt;

    private Instant processedAt;

    private String errorMessage;
}
