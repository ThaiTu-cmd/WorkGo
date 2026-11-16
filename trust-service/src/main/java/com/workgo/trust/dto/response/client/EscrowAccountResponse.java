package com.workgo.trust.dto.response.client;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

public record EscrowAccountResponse(UUID escrowAccountId, UUID orderId, UUID paymentId, UUID clientId,
        UUID providerId, BigDecimal heldAmount, BigDecimal platformFeeAmount, BigDecimal providerNetAmount,
        BigDecimal releasedAmount, BigDecimal refundedAmount, String currency, String status,
        Instant heldAt, Instant releasedAt, Instant refundedAt, List<EscrowTransactionResponse> transactions) {}
