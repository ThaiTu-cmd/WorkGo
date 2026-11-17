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

    Integer refundPercent;

    RefundReason reasonCode;

    //chi dispute phan xu xong moi duoc refund escrow dang FROZEN
    UUID disputeId;

}
