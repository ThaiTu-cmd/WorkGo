package com.workgo.catalog.dto.request;

import com.workgo.catalog.enumeration.ExecutionType;
import com.workgo.catalog.enumeration.PackageStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PackageUpdateRequest {

    String name;

    String description;

    BigDecimal price;

    String currency;

    Integer deliveryDay;

    Integer durationMinute;

    Integer revisionLimit;

}
