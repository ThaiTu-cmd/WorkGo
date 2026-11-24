package com.workgo.trust.dto.response.client;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.UUID;
@JsonIgnoreProperties(ignoreUnknown=true)
public record SettlementResult(UUID settlementReceiptId,UUID decisionId,UUID orderId,UUID disputeId,String operation,
        String branch,String destination,UUID destinationId,Long amount,Long feeAmount,Long destinationAmount,
        String currency,String escrowStatus,UUID settleTransactionId) {}
