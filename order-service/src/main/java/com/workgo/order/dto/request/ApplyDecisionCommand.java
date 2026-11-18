package com.workgo.order.dto.request;

import com.workgo.order.enumeration.DecisionOperation;
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
public class ApplyDecisionCommand {

    UUID decisionId;

    UUID disputeId;

    DecisionOperation operation;

    UUID decidedBy;

    Instant effectiveAt;

    UUID settlementReceiptId;

    UUID settleTransactionId;

    String destination;

    UUID destinationId;

    Long settledAmount;

    Long destinationAmount;

    Long feeAmount;

    String escrowStatus;

}
