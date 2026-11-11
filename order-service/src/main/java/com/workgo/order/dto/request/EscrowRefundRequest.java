package com.workgo.order.dto.request;

import com.workgo.order.enumeration.client.RefundReason;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EscrowRefundRequest {

    UUID orderId;

    Integer refundPercent;

    RefundReason reasonCode;

}
