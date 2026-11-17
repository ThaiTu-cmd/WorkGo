package com.workgo.order.service;

import com.workgo.order.reppository.client.TrustClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service @RequiredArgsConstructor @Slf4j
public class TrustDisputeGuard {
    private final TrustClient client;

    // Advisory only. Payment must still enforce its own financial coordination.
    public boolean permitsPaymentSync(UUID orderId) {
        try {
            var status = client.disputeStatus(orderId);
            return status != null && orderId.equals(status.orderId())
                    && Boolean.FALSE.equals(status.hasActiveDispute())
                    && status.activeDisputeId() == null && status.status() == null;
        } catch (RuntimeException e) {
            log.warn("Trust dispute status unavailable for order {}; payment sync deferred", orderId);
            return false;
        }
    }
}
