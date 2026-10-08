package com.workgo.catalog.dto.request;

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
public class AddOnCreationRequest {

    String name;

    String description;

    BigDecimal price;

    String currency;

    UUID service;
}
