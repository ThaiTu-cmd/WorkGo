package com.workgo.order.dto.request;
import jakarta.validation.constraints.*;
import java.util.Map;
public record InputSubmissionRequest(@NotNull @Positive Integer checklistVersion,
        @NotNull @PositiveOrZero Long expectedVersion, @NotNull @Size(max=50) Map<String,String> values) {}
