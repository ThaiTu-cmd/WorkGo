package com.workgo.communication.dto.request;

import jakarta.validation.constraints.*;

/** Metadata only; ownership and trusted file metadata are checked by the service. */
public record AttachmentReq(
        @NotBlank(message = "INVALID_REQUEST")
        @Pattern(regexp = "^https?://.*", message = "INVALID_REQUEST") String fileUrl,
        @Size(max = 255, message = "INVALID_REQUEST") String fileName,
        @Size(max = 150, message = "INVALID_REQUEST") String mimeType,
        @NotNull(message = "INVALID_REQUEST")
        @Positive(message = "INVALID_REQUEST")
        @Max(value = 20L * 1024 * 1024, message = "INVALID_REQUEST") Long sizeBytes) {
}
