package com.workgo.catalog.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.workgo.catalog.enumeration.MediaType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ServiceMediaResponse {

    UUID serviceMediaId;

    String url;

    String mimeType;

    Long sizeBytes;

    String sha256;

    String status = "READY";

    MediaType mediaType;

    boolean cover;

    Instant createdAt = Instant.now();

    UUID service;

    @JsonProperty("id")
    public UUID getId() {
        return serviceMediaId;
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
