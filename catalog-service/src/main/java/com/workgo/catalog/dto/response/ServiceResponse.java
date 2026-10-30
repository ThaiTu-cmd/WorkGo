package com.workgo.catalog.dto.response;


import com.workgo.catalog.enumeration.ExecutionType;
import com.workgo.catalog.enumeration.ServiceStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
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
