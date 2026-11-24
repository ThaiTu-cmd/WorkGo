package com.workgo.trust.dto.request.client;
import java.time.Instant;
import java.util.UUID;
public record ApplyDecisionCommand(UUID decisionId,UUID disputeId,String operation,UUID decidedBy,Instant effectiveAt,
        UUID settlementReceiptId,UUID settleTransactionId,String destination,UUID destinationId,Long settledAmount,
        Long destinationAmount,Long feeAmount,String escrowStatus) {}
