package com.workgo.communication.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.workgo.communication.enumeration.ContextType;
import com.workgo.communication.enumeration.ConversationType;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ConversationCreateReq(
        @NotNull(message = "INVALID_REQUEST") UUID participantId,
        ConversationType conversationType,
        @NotNull(message = "INVALID_REQUEST") ContextType contextType,
        UUID contextId) {
    public ConversationCreateReq {
        if (conversationType == null) conversationType = ConversationType.DIRECT_MESSAGE;
    }

    @JsonIgnore
    @AssertTrue(message = "INVALID_REQUEST")
    public boolean isContextValid() {
        return contextType == null || (contextType == ContextType.GENERAL ? contextId == null : contextId != null);
    }
}
