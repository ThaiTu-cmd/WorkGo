package com.workgo.job.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;

public record ProposalSubmitReq(
        @NotNull(message = "INVALID_REQUEST") @DecimalMin(value = "0.01", message = "INVALID_REQUEST")
        @Digits(integer = 17, fraction = 2, message = "INVALID_REQUEST") BigDecimal price,
        @NotNull(message = "INVALID_REQUEST") @Min(value = 1, message = "INVALID_REQUEST")
        @Max(value = 36500, message = "INVALID_REQUEST") Integer estimatedDays,
        String message,
        String terms,
        @Future(message = "INVALID_REQUEST") Instant expiresAt) {
}
