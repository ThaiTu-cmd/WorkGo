package com.workgo.payment.dto.gateway;

import com.workgo.payment.enumeration.PaymentMethod;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GatewayCharge {

    String code;

    BigDecimal amount;

    String currency;

    PaymentMethod paymentMethod;

    String description;

    Instant createdAt;

    Instant expiresAt;

}
