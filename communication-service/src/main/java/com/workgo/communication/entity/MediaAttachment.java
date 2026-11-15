package com.workgo.communication.entity;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.UUID;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaAttachment {
    @NotNull
    private UUID id;

    @NotNull
    private String fileUrl;

    private String fileName;

    private String mimeType;

    private Long sizeBytes;

    @NotNull
    private Instant createdAt;
}
