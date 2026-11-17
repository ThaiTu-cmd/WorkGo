package com.workgo.trust.dto.response;

import java.util.UUID;
import java.time.Instant;
import com.workgo.trust.enumeration.*;

public record InternalOrderDisputeStatusResponse(
        UUID orderId,
        boolean hasActiveDispute,
        UUID activeDisputeId,
        DisputeStatus status) {
}
