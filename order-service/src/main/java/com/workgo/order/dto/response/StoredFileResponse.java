package com.workgo.order.dto.response;

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

    Instant createdAt;
}
