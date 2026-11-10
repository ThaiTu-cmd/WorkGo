package com.workgo.payment.dto.request;

import com.workgo.payment.enumeration.RefundReason;
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

    //phase nay chi ho tro 100
    Integer refundPercent;

    RefundReason reasonCode;

}
