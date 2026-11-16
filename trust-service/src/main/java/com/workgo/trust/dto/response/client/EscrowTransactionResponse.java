package com.workgo.trust.dto.response.client;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record EscrowTransactionResponse(UUID escrowTransactionId, UUID escrowAccountId, String txnType,
        BigDecimal amount, BigDecimal balanceAfter, String triggeredBy, UUID actorId, String reasonCode, Instant createdAt) {}
