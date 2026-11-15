package com.workgo.communication.entity;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.UUID;
import java.time.Instant;
import java.util.List;
import java.util.ArrayList;
import jakarta.validation.Valid;
import com.workgo.communication.enumeration.MessageType;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "messages")
@CompoundIndexes({
    @CompoundIndex(name = "idx_message_conversation_history", def = "{\"conversationId\":1,\"sentAt\":-1,\"_id\":-1}"),
    @CompoundIndex(name = "idx_message_unread", def = "{\"conversationId\":1,\"senderId\":1,\"readAt\":1}"),
    @CompoundIndex(name = "uq_message_retry_key", def = "{\"conversationId\":1,\"senderId\":1,\"clientMessageId\":1}", unique = true)
})
public class Message {
    @Id
    private UUID id;

    @NotNull
    private UUID conversationId;

    @NotNull
    private UUID senderId;

    private String content;

    @NotNull
    @Builder.Default
    private MessageType messageType = MessageType.TEXT;

    @NotNull
    @Builder.Default
    @Valid
    private List<MediaAttachment> attachments = new ArrayList<>();

    @NotNull
    private Instant sentAt;

    private Instant readAt;

    @NotNull
    private UUID clientMessageId;

    @NotNull
    private String requestHash;
}
