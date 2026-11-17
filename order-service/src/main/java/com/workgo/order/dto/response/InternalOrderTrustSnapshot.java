package com.workgo.order.dto.response;


import com.workgo.order.enumeration.ExecutionType;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.enumeration.PaymentStatus;
import com.workgo.order.enumeration.SourceType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InternalOrderTrustSnapshot {

    UUID orderId;

    String orderNumber;

    UUID clientId;

    UUID providerId;

    UUID serviceId;

    SourceType sourceType;

    ExecutionType executionType;

    OrderStatus orderStatus;

    PaymentStatus paymentStatus;

    Instant placedAt;

    Instant deliveredAt;

    Instant completedAt;

    Instant cancelledAt;

}
