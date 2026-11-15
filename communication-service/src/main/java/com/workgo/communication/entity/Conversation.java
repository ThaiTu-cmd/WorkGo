package com.workgo.communication.entity;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.UUID;
import java.time.Instant;
import java.util.List;
import java.util.ArrayList;
import jakarta.validation.Valid;
import com.workgo.communication.enumeration.ConversationType;
import com.workgo.communication.enumeration.ContextType;
import com.workgo.communication.enumeration.ConversationStatus;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "conversations")
@CompoundIndexes({
    @CompoundIndex(name = "idx_conv_participant_activity", def = "{\"participants.userId\":1,\"lastActivityAt\":-1,\"_id\":-1}"),
    @CompoundIndex(name = "idx_conv_context", def = "{\"contextType\":1,\"contextId\":1}"),
    @CompoundIndex(name = "uq_conv_direct_key", def = "{\"directKey\":1}", unique = true, partialFilter = "{\"conversationType\":\"DIRECT_MESSAGE\"}")
})
public class Conversation {
    @Id
    private UUID id;

    @NotNull
    @Builder.Default
    private ConversationType conversationType = ConversationType.DIRECT_MESSAGE;

    @NotNull
    private ContextType contextType;

    private UUID contextId;

    @NotNull
    @Builder.Default
    private ConversationStatus status = ConversationStatus.ACTIVE;

    @NotNull
    @Builder.Default
    @Valid
    private List<ConversationParticipant> participants = new ArrayList<>();

    @NotNull
    private Instant createdAt;

    private Instant lastMessageAt;

    @Version
    private Long version;

    private String directKey;

    @NotNull
    private Instant lastActivityAt;
}
