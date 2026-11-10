package com.workgo.order.dto.snapshot;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PackageSnapshot {

    UUID packageId;

    String name;

    String description;

    BigDecimal price;

    String currency;

    Integer deliveryDay;

    Integer durationMinute;

    Integer revisionLimit;

}
