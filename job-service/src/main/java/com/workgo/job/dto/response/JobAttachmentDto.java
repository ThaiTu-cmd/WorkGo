package com.workgo.job.dto.response;

import java.time.Instant;
import java.util.UUID;

public record JobAttachmentDto(UUID attachmentId, String fileUrl, String fileName,
                               String mimeType, Long sizeBytes, Instant createdAt) {
}
