package com.workgo.order.dto.request;
import jakarta.validation.constraints.*;
import java.util.List;
public record InputChecklistRequest(@NotNull @Positive Integer agreementVersion,
        @NotNull @Size(max=50) List<@NotBlank @Size(max=500) String> requirements) {}
