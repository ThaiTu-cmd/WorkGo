package com.workgo.order.dto.response.client;


import com.workgo.order.enumeration.client.AddOnStatus;
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
