package com.workgo.catalog.dto.response;

import com.workgo.catalog.entity.Service;
import com.workgo.catalog.enumeration.MediaType;
import jakarta.persistence.*;
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

    MediaType mediaType;

    boolean cover;

    Instant createdAt = Instant.now();

    UUID service;
}
