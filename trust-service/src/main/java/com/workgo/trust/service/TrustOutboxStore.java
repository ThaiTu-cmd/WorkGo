package com.workgo.trust.service;

import com.workgo.trust.entity.*;
import com.workgo.trust.enumeration.*;
import jakarta.persistence.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.*;

@Component @RequiredArgsConstructor
public class TrustOutboxStore {
    @PersistenceContext private EntityManager em;
    private final TrustTransactions transactions;
    @Value("${app.outbox.max-attempts:5}") private int maxAttempts;
    @Value("${app.outbox.lease-seconds:60}") private int leaseSeconds;
    public record Delivery(UUID id, UUID token, String eventType, UUID aggregateId, String payload) {}
    public Delivery claim(UUID id) {
        return transactions.execute(() -> {
            var e = em.find(TrustOutboxEvent.class,id,LockModeType.PESSIMISTIC_WRITE);
            if (e == null || e.getStatus() != OutboxStatus.PENDING || e.getNextAttemptAt().isAfter(Instant.now())) return null;
            if (e.getAttempts() >= maxAttempts) {
                e.setStatus(OutboxStatus.FAILED); e.setLastError("RECONCILE_EXPIRED_FINAL_ATTEMPT"); e.setClaimToken(null); return null;
            }
            e.setAttempts(e.getAttempts()+1); e.setClaimToken(UUID.randomUUID());
            e.setNextAttemptAt(Instant.now().plusSeconds(leaseSeconds));
            return new Delivery(id,e.getClaimToken(),e.getEventType(),e.getAggregateId(),e.getPayload());
        });
    }
    /** Persist recipient resolution before HTTP, retaining exact recipient on retries. */
    public boolean payload(Delivery delivery, String payload) {
        return transactions.execute(() -> {
            var e = owned(delivery);
            if (e == null) return false;
            e.setPayload(payload); return true;
        });
    }
    public void finish(Delivery delivery, String result, String error, boolean retry) {
        transactions.execute(() -> {
            var e = owned(delivery);
            if (e == null) return null;
            e.setClaimToken(null); e.setLastError(error); e.setDeliveryResult(result);
            if (error == null) { e.setStatus(OutboxStatus.COMPLETED); e.setProcessedAt(Instant.now()); }
            else if (!retry || e.getAttempts() >= maxAttempts) e.setStatus(OutboxStatus.FAILED);
            else e.setNextAttemptAt(Instant.now().plusSeconds(Math.min(300, 5L << Math.min(e.getAttempts()-1,6))));
            return null;
        });
    }
    private TrustOutboxEvent owned(Delivery delivery) {
        var e = em.find(TrustOutboxEvent.class,delivery.id(),LockModeType.PESSIMISTIC_WRITE);
        return e != null && e.getStatus() == OutboxStatus.PENDING && delivery.token().equals(e.getClaimToken()) ? e : null;
    }
}
