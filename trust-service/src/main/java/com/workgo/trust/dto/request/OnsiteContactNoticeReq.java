package com.workgo.trust.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record OnsiteContactNoticeReq(
        @NotNull(message = "INVALID_REQUEST") UUID orderId,
        Instant occurredAt,
        @NotBlank(message = "INVALID_REQUEST") @Size(max = 100, message = "INVALID_REQUEST") String channel,
        @NotBlank(message = "INVALID_REQUEST") @Size(max = 1000, message = "INVALID_REQUEST") String note,
        @Size(max = 1000, message = "INVALID_REQUEST") String evidenceUrl
) {}
