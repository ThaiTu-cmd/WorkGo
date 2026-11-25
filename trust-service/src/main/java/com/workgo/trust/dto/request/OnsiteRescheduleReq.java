package com.workgo.trust.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record OnsiteRescheduleReq(
        @NotNull(message = "INVALID_REQUEST") UUID orderId,
        @NotNull(message = "INVALID_REQUEST") Instant proposedStart,
        @NotNull(message = "INVALID_REQUEST") Instant proposedEnd,
        @NotBlank(message = "INVALID_REQUEST") @Size(max = 1000, message = "INVALID_REQUEST") String reason,
        Long expectedVersion
) {}
