package com.workgo.payment.dto.response;


import com.workgo.payment.enumeration.EscrowStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EscrowAccountResponse {

    UUID escrowAccountId;

    UUID orderId;

    UUID paymentId;

    UUID clientId;

    UUID providerId;

    BigDecimal heldAmount;

    BigDecimal platformFeeAmount;

    BigDecimal providerNetAmount;

    BigDecimal releasedAmount;

    BigDecimal refundedAmount;

    String currency;

    EscrowStatus status;

    Instant heldAt;

    Instant releasedAt;

    Instant refundedAt;

    List<EscrowTransactionResponse> transactions;

}
