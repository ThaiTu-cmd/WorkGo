package com.workgo.communication.entity;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.UUID;
import java.time.Instant;
import com.workgo.communication.enumeration.ReferenceType;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
@CompoundIndexes({
    @CompoundIndex(name = "idx_notification_history", def = "{\"recipientId\":1,\"createdAt\":-1,\"_id\":-1}"),
    @CompoundIndex(name = "idx_notification_unread_history", def = "{\"recipientId\":1,\"readAt\":1,\"createdAt\":-1,\"_id\":-1}")
})
public class Notification {
    @Id
    private UUID id;

    @NotNull
    private UUID recipientId;

    @NotNull
    private String type;

    @NotNull
    private String title;

    private String content;

    private ReferenceType referenceType;

    private UUID referenceId;

    private Instant readAt;

    @NotNull
    private Instant createdAt;
}
