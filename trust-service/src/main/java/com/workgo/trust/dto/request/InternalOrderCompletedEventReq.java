package com.workgo.trust.dto.request;

import jakarta.validation.constraints.*;
import java.util.UUID;
import java.time.Instant;
import com.workgo.trust.enumeration.ReportTargetType;

public record InternalOrderCompletedEventReq(
        @NotBlank(message = "INVALID_REQUEST") @Size(max = 100, message = "INVALID_REQUEST") String eventId,
        @NotNull(message = "INVALID_REQUEST") UUID orderId,
        @NotNull(message = "INVALID_REQUEST") UUID clientId,
        @NotNull(message = "INVALID_REQUEST") UUID providerId,
        UUID serviceId,
        @NotNull(message = "INVALID_REQUEST") Instant completedAt) {
}
