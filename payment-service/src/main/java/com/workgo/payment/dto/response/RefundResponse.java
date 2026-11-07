package com.workgo.payment.dto.response;


import com.workgo.payment.enumeration.RefundReason;
import com.workgo.payment.enumeration.RefundStatus;
import com.workgo.payment.enumeration.TriggeredBy;
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
public class RefundResponse {

    UUID refundId;

    UUID orderId;

    UUID paymentId;

    UUID escrowAccountId;

    BigDecimal amount;

    RefundReason reasonCode;

    TriggeredBy initiatedBy;

    RefundStatus status;

    String gatewayRef;

    String failureMessage;

    Instant processedAt;

    Instant createdAt;

}
