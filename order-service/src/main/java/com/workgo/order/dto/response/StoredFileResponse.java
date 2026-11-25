package com.workgo.order.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StoredFileResponse {

    UUID storedFileId;

    String context;

    String originalName;

    String mimeType;

    Long sizeBytes;

    String sha256;

    @Builder.Default
    String status = "READY";

    Instant createdAt;

    @JsonProperty("id")
    public UUID getId() {
        return storedFileId;
    }

    @JsonProperty("mime")
    public String getMime() {
        return mimeType;
    }

    @JsonProperty("size")
    public Long getSize() {
        return sizeBytes;
    }
}
