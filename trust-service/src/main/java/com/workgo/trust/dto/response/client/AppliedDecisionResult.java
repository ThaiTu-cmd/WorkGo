package com.workgo.trust.dto.response.client;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.UUID;
@JsonIgnoreProperties(ignoreUnknown=true)
public record AppliedDecisionResult(UUID decisionId,UUID orderId,UUID disputeId,String operation,String orderStatus,
                                    String paymentStatus,UUID settlementReceiptId) {}
