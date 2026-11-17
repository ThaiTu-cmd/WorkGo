package com.workgo.trust.dto.request;

import jakarta.validation.constraints.*;
import java.util.UUID;
import java.time.Instant;
import com.workgo.trust.enumeration.ReportTargetType;

public record ReportReq(
        @NotNull(message = "INVALID_REQUEST") ReportTargetType targetType,
        @NotNull(message = "INVALID_REQUEST") UUID targetId,
        @NotBlank(message = "INVALID_REQUEST") @Size(max = 150, message = "INVALID_REQUEST") String reason,
        @Size(max = 2000, message = "INVALID_REQUEST") String description,
        @Size(max = 1000, message = "INVALID_REQUEST") @Pattern(regexp = "https?://.*", message = "INVALID_REQUEST") String evidenceUrl) {
}
