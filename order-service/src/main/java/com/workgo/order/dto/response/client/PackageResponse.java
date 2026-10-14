package com.workgo.order.dto.response.client;


import com.workgo.order.enumeration.client.PackageStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PackageResponse {


    UUID packageId;

    String name;

    String description;

    BigDecimal price;

    String currency;

    Integer deliveryDay;

    Integer durationMinute;

    Integer revisionLimit;

    PackageStatus packageStatus;

    Instant createdAt;

    Instant updatedAt;

    UUID serviceId;

}
