package com.workgo.payment.dto.request;
import java.util.UUID;import java.time.Instant;import java.math.BigDecimal;
public record CashDecisionRequest(String paymentMethod,UUID decisionId,UUID disputeId,String operation,UUID decidedBy,Instant effectiveAt,
 UUID cashOutcomeId,Boolean workAccepted,Boolean paymentReceived,BigDecimal actualReceivedAmount,String branch,UUID clientId,UUID providerId,
 BigDecimal totalAmount,String currency,UUID feePolicyVersionId,UUID orderId){
 public CashDecisionRequest{if(actualReceivedAmount!=null)actualReceivedAmount=actualReceivedAmount.stripTrailingZeros();if(totalAmount!=null)totalAmount=totalAmount.stripTrailingZeros();}
}
