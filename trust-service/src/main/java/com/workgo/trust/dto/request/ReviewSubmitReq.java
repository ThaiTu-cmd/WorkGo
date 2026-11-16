package com.workgo.trust.dto.request;

import jakarta.validation.constraints.*;
import java.util.UUID;
import java.time.Instant;
import com.workgo.trust.enumeration.ReportTargetType;

public record ReviewSubmitReq(
        @NotNull(message = "INVALID_REQUEST") UUID orderId,
        @NotNull(message = "INVALID_REQUEST") @Min(value = 1, message = "INVALID_REQUEST") @Max(value = 5, message = "INVALID_REQUEST") Integer rating,
        @Size(max = 2000, message = "INVALID_REQUEST") String comment) {
}
