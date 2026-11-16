package com.workgo.communication.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.workgo.communication.enumeration.MessageType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record MessageSendReq(
        @Size(max = 5000, message = "INVALID_REQUEST") String content,
        MessageType messageType,
        @Size(max = 10, message = "INVALID_REQUEST") List<@NotNull(message = "INVALID_REQUEST") @Valid AttachmentReq> attachments,
        @NotNull(message = "INVALID_REQUEST") UUID clientMessageId) {
    public MessageSendReq {
        if (messageType == null) messageType = MessageType.TEXT;
        if (attachments == null) attachments = List.of();
    }

    @JsonIgnore
    @AssertTrue(message = "INVALID_REQUEST")
    public boolean isAttachmentTotalSizeValid() {
        long remaining = 100L * 1024 * 1024;
        for (AttachmentReq attachment : attachments) {
            // Nested constraints report missing/invalid metadata; subtraction avoids overflow.
            if (attachment == null || attachment.sizeBytes() == null || attachment.sizeBytes() <= 0) continue;
            if (attachment.sizeBytes() > remaining) return false;
            remaining -= attachment.sizeBytes();
        }
        return true;
    }
}
