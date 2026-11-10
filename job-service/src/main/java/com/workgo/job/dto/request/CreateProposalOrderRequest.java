package com.workgo.job.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

/** Immutable proposal terms sent to order-service. */
public record CreateProposalOrderRequest(
        @NotNull UUID proposalId,
        @NotNull UUID jobId,
        @NotNull UUID clientId,
        @NotNull UUID providerId,
        @NotNull @NotBlank String executionType,
        @NotNull @DecimalMin("0.01") @Digits(integer = 17, fraction = 2) BigDecimal price,
        @NotBlank @Size(max = 10) String currency,
        @NotNull @Min(1) @Max(36500) Integer estimatedDays,
        @NotBlank @Size(max = 255) String jobTitle,
        String jobDescription,
        String locationSnapshot,
        String terms) {
}
