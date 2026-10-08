package com.workgo.catalog.dto.response;

import com.workgo.catalog.entity.Service;
import com.workgo.catalog.enumeration.AddOnStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddOnResponse {

    UUID addOnId;

    String name;

    String description;

    BigDecimal price;

    String currency;

    AddOnStatus status;

    Instant createdAt;

    Instant updatedAt;

    UUID service;

}
