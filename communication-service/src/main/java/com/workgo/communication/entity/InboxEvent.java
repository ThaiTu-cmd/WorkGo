package com.workgo.communication.entity;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.UUID;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "inbox_events")
public class InboxEvent {
    @Id
    private UUID id;

    @NotNull
    @Indexed(unique = true, name = "uq_inbox_event_id")
    private String eventId;

    @NotNull
    private UUID notificationId;

    @NotNull
    private String eventType;

    @NotNull
    private String payload;

    @NotNull
    private Instant receivedAt;

    private Instant processedAt;

    @NotNull
    private String payloadHash;
}
