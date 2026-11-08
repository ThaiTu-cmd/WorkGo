package com.workgo.order.dto.response;


import com.workgo.order.enumeration.ExecutionType;
import com.workgo.order.enumeration.OrderStatus;
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
