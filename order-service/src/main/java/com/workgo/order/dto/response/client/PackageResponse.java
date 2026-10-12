package com.workgo.catalog.dto.response;

import com.workgo.catalog.entity.Service;
import com.workgo.catalog.enumeration.BookingStatus;
import com.workgo.catalog.enumeration.PackageStatus;
import jakarta.persistence.*;
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
