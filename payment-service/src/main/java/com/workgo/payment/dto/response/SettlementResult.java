package com.workgo.payment.dto.response;

import com.workgo.payment.enumeration.EscrowStatus;
import com.workgo.payment.enumeration.FeeChargedParty;
import com.workgo.payment.enumeration.SettlementDestination;
import com.workgo.payment.enumeration.SettlementOperation;
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
public class SettlementResult {

    com.workgo.payment.enumeration.EscrowFundingSource fundingSource;

    UUID policyVersionId;

    UUID settlementReceiptId;

    UUID decisionId;

    UUID orderId;

    UUID disputeId;

    SettlementOperation operation;

    FeeChargedParty branch;

    SettlementDestination destination;

    UUID destinationId;

    Long amount;

    Long feeAmount;

    Long destinationAmount;

    String currency;

    EscrowStatus escrowStatus;

    UUID settleTransactionId;

    UUID feeAssessmentId;

    boolean replayed;

    Instant settledAt;

}
