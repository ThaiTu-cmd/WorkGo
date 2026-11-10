package com.workgo.order.dto.snapshot;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class PricingSnapshot {

    BigDecimal subtotal;

    BigDecimal platformFee;

    BigDecimal totalAmount;

    BigDecimal providerNetAmount;

    BigDecimal platformFeeRate;

    String currency;

}
