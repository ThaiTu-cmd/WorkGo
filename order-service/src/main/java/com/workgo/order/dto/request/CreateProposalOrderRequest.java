package com.workgo.order.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

public record CreateProposalOrderRequest(
        @NotNull(message = "PROPOSAL_ORDER_INVALID_REQUEST") UUID proposalId,
        @NotNull(message = "PROPOSAL_ORDER_INVALID_REQUEST") UUID jobId,
        @NotNull(message = "PROPOSAL_ORDER_INVALID_REQUEST") UUID clientId,
        @NotNull(message = "PROPOSAL_ORDER_INVALID_REQUEST") UUID providerId,
        @NotBlank(message = "PROPOSAL_ORDER_INVALID_REQUEST") String executionType,
        @NotNull(message = "PROPOSAL_ORDER_INVALID_REQUEST")
        @DecimalMin(value = "0.01", message = "PROPOSAL_ORDER_INVALID_REQUEST")
        @Digits(integer = 17, fraction = 2, message = "PROPOSAL_ORDER_INVALID_REQUEST") BigDecimal price,
        @NotBlank(message = "PROPOSAL_ORDER_INVALID_REQUEST")
        @Size(max = 10, message = "PROPOSAL_ORDER_INVALID_REQUEST") String currency,
        @NotNull(message = "PROPOSAL_ORDER_INVALID_REQUEST")
        @Min(value = 1, message = "PROPOSAL_ORDER_INVALID_REQUEST")
        @Max(value = 36500, message = "PROPOSAL_ORDER_INVALID_REQUEST") Integer estimatedDays,
        @NotBlank(message = "PROPOSAL_ORDER_INVALID_REQUEST")
        @Size(max = 255, message = "PROPOSAL_ORDER_INVALID_REQUEST") String jobTitle,
        String jobDescription, String locationSnapshot, String terms) {
}
