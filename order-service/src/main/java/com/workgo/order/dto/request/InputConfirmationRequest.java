package com.workgo.order.dto.request;
import jakarta.validation.constraints.*;
public record InputConfirmationRequest(@NotNull @Positive Integer checklistVersion,
        @NotNull @PositiveOrZero Long expectedVersion) {}
