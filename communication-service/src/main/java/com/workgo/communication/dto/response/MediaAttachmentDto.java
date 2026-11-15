package com.workgo.communication.dto.response;

import java.time.Instant;
import java.util.UUID;

public record MediaAttachmentDto(UUID id, String fileUrl, String fileName, String mimeType,
                                 Long sizeBytes, Instant createdAt) {
}
