package com.workgo.order.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AmendmentCreationRequest {

    String newScope;

    BigDecimal newPrice;

    Integer newDurationDays;

    String reason;
}
