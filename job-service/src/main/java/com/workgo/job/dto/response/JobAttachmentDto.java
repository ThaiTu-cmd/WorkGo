package com.workgo.job.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.UUID;

public record JobAttachmentDto(UUID attachmentId, String fileUrl, String fileName,
                               String mimeType, Long sizeBytes, Instant createdAt,
                               String sha256, String status) {

    public JobAttachmentDto(UUID attachmentId, String fileUrl, String fileName,
                            String mimeType, Long sizeBytes, Instant createdAt) {
        this(attachmentId, fileUrl, fileName, mimeType, sizeBytes, createdAt, null, "READY");
    }

    @JsonProperty("id")
    public UUID id() {
        return attachmentId;
    }

    @JsonProperty("mime")
    public String mime() {
        return mimeType;
    }

    @JsonProperty("size")
    public Long size() {
        return sizeBytes;
    }
}
