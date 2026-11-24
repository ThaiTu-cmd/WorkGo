package com.workgo.trust.dto.request.client;
import java.math.BigDecimal;
import java.util.UUID;
public record SettlementCommand(UUID decisionId,UUID orderId,UUID disputeId,String operation,String branch,
        String destination,UUID destinationId,BigDecimal amount,String currency,UUID policyVersionId) {}
