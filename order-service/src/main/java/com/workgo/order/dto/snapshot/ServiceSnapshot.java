package com.workgo.order.dto.snapshot;

import com.workgo.order.enumeration.ExecutionType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ServiceSnapshot {

    UUID serviceId;

    UUID providerId;

    String title;

    String description;

    ExecutionType executionType;

    BigDecimal basePrice;

    String currency;

}
