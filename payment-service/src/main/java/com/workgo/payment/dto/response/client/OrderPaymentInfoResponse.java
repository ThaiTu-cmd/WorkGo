package com.workgo.payment.dto.response.client;


import com.workgo.payment.enumeration.client.ExecutionType;
import com.workgo.payment.enumeration.client.OrderStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderPaymentInfoResponse {

    UUID orderId;

    String orderNumber;

    UUID clientId;

    UUID providerId;

    OrderStatus orderStatus;

    ExecutionType executionType;

    String title;

    BigDecimal totalAmount;

    BigDecimal platformFee;

    BigDecimal providerNetAmount;

    String currency;

    Instant payableUntil;

}
