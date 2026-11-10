package com.workgo.payment.dto.response;


import com.workgo.payment.enumeration.EscrowTxnType;
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
public class EscrowTransactionResponse {

    UUID escrowTransactionId;

    UUID escrowAccountId;

    EscrowTxnType txnType;

    BigDecimal amount;

    BigDecimal balanceAfter;

    TriggeredBy triggeredBy;

    UUID actorId;

    String reasonCode;

    Instant createdAt;

}
