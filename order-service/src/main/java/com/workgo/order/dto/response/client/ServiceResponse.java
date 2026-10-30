package com.workgo.order.dto.response.client;


import com.workgo.order.enumeration.ExecutionType;
import com.workgo.order.enumeration.client.ServiceStatus;
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
public class ServiceResponse {

    UUID serviceId;

    UUID providerId;

    UUID categoryId;

    ExecutionType executionType;

    String title;

    String slug;

    String description;

    double basePrice;

    String currency;

    ServiceStatus status;

    double avgRating;

    long reviewCount;

    long orderCount;

    Instant publishedAt;

    Instant createdAt;

    Instant updatedAt;

}
