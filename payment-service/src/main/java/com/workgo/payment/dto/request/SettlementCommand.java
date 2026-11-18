package com.workgo.payment.dto.request;

import com.workgo.payment.enumeration.FeeChargedParty;
import com.workgo.payment.enumeration.SettlementDestination;
import com.workgo.payment.enumeration.SettlementOperation;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SettlementCommand {

    UUID decisionId;

    UUID orderId;

    UUID disputeId;

    SettlementOperation operation;

    FeeChargedParty branch;

    SettlementDestination destination;

    UUID destinationId;

    BigDecimal amount;

    String currency;

    UUID policyVersionId;

}
