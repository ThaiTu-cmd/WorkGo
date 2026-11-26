package com.workgo.trust.dto.request.client;
import java.util.UUID;
import java.time.Instant;
import java.math.BigDecimal;
public record CashDecisionCommand(String paymentMethod,UUID decisionId,UUID disputeId,String operation,
        UUID decidedBy,Instant effectiveAt,UUID cashOutcomeId,Boolean workAccepted,Boolean paymentReceived,
        BigDecimal actualReceivedAmount,String branch,UUID clientId,UUID providerId,BigDecimal totalAmount,String currency,UUID feePolicyVersionId,UUID orderId) {}
