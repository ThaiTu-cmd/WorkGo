package com.workgo.job.dto.request;

import com.workgo.job.enumeration.ExecutionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record JobCreateReq(
        @NotBlank(message = "INVALID_REQUEST") @Size(max = 255, message = "INVALID_REQUEST") String title,
        String description,
        @NotNull(message = "INVALID_REQUEST") UUID categoryId,
        @DecimalMin(value = "0", message = "INVALID_REQUEST")
        @Digits(integer = 17, fraction = 2, message = "INVALID_REQUEST") BigDecimal budgetMin,
        @DecimalMin(value = "0", message = "INVALID_REQUEST")
        @Digits(integer = 17, fraction = 2, message = "INVALID_REQUEST") BigDecimal budgetMax,
        @Pattern(regexp = "(?s).*\\S.*", message = "INVALID_REQUEST")
        @Size(max = 10, message = "INVALID_REQUEST") String currency,
        @NotNull(message = "INVALID_REQUEST") ExecutionType executionType,
        String locationSnapshot,
        @Future(message = "INVALID_REQUEST") Instant deadlineAt,
        @Valid List<@NotNull(message = "INVALID_REQUEST") JobAttachmentReq> attachments) {
}
