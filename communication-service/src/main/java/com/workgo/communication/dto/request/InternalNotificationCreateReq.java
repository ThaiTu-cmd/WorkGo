package com.workgo.communication.dto.request;

import com.workgo.communication.enumeration.ReferenceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record InternalNotificationCreateReq(
        @NotBlank(message = "INVALID_REQUEST") @Size(max = 100, message = "INVALID_REQUEST") String eventId,
        @NotNull(message = "INVALID_REQUEST") UUID recipientId,
        @NotBlank(message = "INVALID_REQUEST") @Size(max = 100, message = "INVALID_REQUEST") String type,
        @NotBlank(message = "INVALID_REQUEST") @Size(max = 255, message = "INVALID_REQUEST") String title,
        @Size(max = 2000, message = "INVALID_REQUEST") String content,
        ReferenceType referenceType,
        UUID referenceId) {
}
