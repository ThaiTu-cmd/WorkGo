package com.workgo.order.dto.response;

import com.workgo.order.enumeration.ItemType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItemResponse {

    UUID orderItemId;

    String name;

    int quantity;

    BigDecimal unitPrice;

    BigDecimal amount;

    ItemType itemType;

    Instant createdAt;
//
//    Instant updatedAt;

    UUID referenceId;

    UUID orderId;

    int sortOrder;

}
