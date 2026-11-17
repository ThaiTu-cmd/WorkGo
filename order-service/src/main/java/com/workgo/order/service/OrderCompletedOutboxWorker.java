package com.workgo.order.service;

import com.workgo.order.reppository.client.TrustClient;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.*;

@Component @RequiredArgsConstructor @Slf4j
public class OrderCompletedOutboxWorker {
    private final OrderCompletedOutboxStore store;
    private final TrustClient client;

    // HTTP is deliberately outside the short database claim/result transactions.
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    @Scheduled(fixedDelayString = "${order.trust-outbox.poll-millis:5000}")
    public void deliver() {
        for (String id : store.due()) {
            var claim = store.claim(id);
            if (claim == null) continue;
            try {
                var ack = client.orderCompleted(claim.payload());
                if (ack == null || ack.getCode() != 1000) {
                    store.finish(claim, false, false, "Invalid Trust acknowledgement");
                } else store.finish(claim, true, false, null);
            } catch (FeignException e) {
                // 409/5018 is a retryable concurrent-inbox conflict; 409/5017 is permanent.
                boolean concurrent = e.status() == 409 && isConcurrentConflict(e);
                store.finish(claim, false, e.status() < 0 || e.status() >= 500 || e.status() == 429 || concurrent,
                        "Trust HTTP " + e.status());
            } catch (RuntimeException e) {
                store.finish(claim, false, true, "Trust delivery " + e.getClass().getSimpleName());
                log.warn("Trust delivery failed for event {}", id);
            }
        }
    }

    private boolean isConcurrentConflict(FeignException e) {
        try { return new com.fasterxml.jackson.databind.ObjectMapper().readTree(e.contentUTF8()).path("code").asInt() == 5018; }
        catch (Exception ignored) { return false; }
    }
}
