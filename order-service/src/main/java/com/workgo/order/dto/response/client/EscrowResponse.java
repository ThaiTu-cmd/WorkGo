package com.workgo.order.dto.response.client;

import com.workgo.order.enumeration.client.EscrowStatus;
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
public class EscrowResponse {

    UUID escrowAccountId;
    UUID adjustmentId;
    UUID adjustmentTransactionId;

    UUID orderId;

    java.math.BigDecimal heldAmount;
    java.math.BigDecimal platformFeeAmount;
    String currency;

    EscrowStatus status;

    Instant releasedAt;

    Instant refundedAt;

}
