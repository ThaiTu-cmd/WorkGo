package com.workgo.order.dto.response;

import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.enumeration.RoleName;
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
public class OrderStatusHistoryResponse {
    UUID orderStatusHistoryId;
    UUID orderId;
    OrderStatus fromStatus;
    OrderStatus toStatus;
    UUID actorId;
    RoleName roleName;
    Instant createdAt;
}
