package com.workgo.job.dto.request;

import jakarta.validation.constraints.*;

/** File metadata only; upload authorization and attachment limits belong to the service. */
public record JobAttachmentReq(
        @NotBlank(message = "INVALID_REQUEST") String fileUrl,
        @Size(max = 255, message = "INVALID_REQUEST") String fileName,
        @Size(max = 255, message = "INVALID_REQUEST") String mimeType,
        @PositiveOrZero(message = "INVALID_REQUEST") Long sizeBytes) {
}
