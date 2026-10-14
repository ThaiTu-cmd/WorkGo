package com.workgo.order.dto.response;

import com.workgo.order.enumeration.ExecutionType;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.enumeration.PaymentStatus;
import com.workgo.order.enumeration.SourceType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderResponse {
    UUID orderId;
    String orderNumber;
    SourceType sourceType;
    UUID sourceId;
    UUID clientId;
    UUID providerId;
    UUID serviceId;
    UUID packageId;
    ExecutionType executionType;
    String title;
    BigDecimal subtotal;
    BigDecimal platformFee;
    BigDecimal totalAmount;
    BigDecimal providerNetAmount;
    String currency;
    OrderStatus orderStatus;
    PaymentStatus paymentStatus;
    Instant placedAt;
    Instant confirmedAt;
    Instant startedAt;
    Instant deliveredAt;
    Instant completedAt;
    Instant cancelledAt;
    Instant autoCompleteAt;
    Instant createdAt;
    Instant updatedAt;

    //=============FK============


}
