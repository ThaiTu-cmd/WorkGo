package com.workgo.order.dto.snapshot;

import com.workgo.order.enumeration.OrderPaymentMethod;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.UUID;

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

    OrderPaymentMethod paymentMethod;

    UUID feePolicyVersionId;

    Integer feePolicyVersionNo;

    BigDecimal cancellationFeeRate;

    Long cancellationFeeCap;

}
