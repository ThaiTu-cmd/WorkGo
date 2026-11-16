package com.workgo.job.dto.response;

import com.workgo.job.enumeration.OrderSyncStatus;
import java.util.UUID;

/** Acceptance is durable even while order-service is unavailable. Poll order-sync for delivery. */
public record ProposalAcceptanceDto(ProposalDto proposal, OrderSyncStatus orderSyncStatus, UUID orderId) { }
