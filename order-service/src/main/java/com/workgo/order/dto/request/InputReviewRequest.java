package com.workgo.order.dto.request;
import jakarta.validation.constraints.*;
public record InputReviewRequest(@NotNull @Positive Integer checklistVersion,
        @NotNull @PositiveOrZero Long expectedVersion, @NotNull Boolean sufficient,
        @Size(max=2000) String missingReason) {}
