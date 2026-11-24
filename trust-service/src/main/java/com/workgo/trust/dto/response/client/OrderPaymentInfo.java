package com.workgo.trust.dto.response.client;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.util.UUID;
@JsonIgnoreProperties(ignoreUnknown=true)
public record OrderPaymentInfo(UUID orderId,UUID clientId,UUID providerId,String orderStatus,String paymentMethod,
                               BigDecimal totalAmount,String currency,UUID feePolicyVersionId) {}
