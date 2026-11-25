package com.workgo.order.service;

import com.workgo.order.dto.request.OrderCompletedEvent;
import com.workgo.order.reppository.OrderCompletedOutboxRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.time.Instant;
import java.util.*;

@Service
public class OrderCompletedOutboxStore {
    private final OrderCompletedOutboxRepository repository;
    private final int maxAttempts;
    private final long leaseSeconds;

    public OrderCompletedOutboxStore(OrderCompletedOutboxRepository repository,
            @Value("${order.trust-outbox.max-attempts:8}") int maxAttempts,
            @Value("${order.trust-outbox.lease-seconds:60}") long leaseSeconds) {
        if (maxAttempts < 1 || leaseSeconds < 1) throw new IllegalArgumentException("Positive outbox limits required");
        this.repository = repository; this.maxAttempts = maxAttempts; this.leaseSeconds = leaseSeconds;
    }

    public record Claim(OrderCompletedEvent payload, UUID token, int attempts, String correlationId) {
        public Claim(OrderCompletedEvent payload, UUID token, int attempts){this(payload,token,attempts,"legacy-"+payload.eventId());}
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<String> due() {
        Instant now = Instant.now();
        repository.failExpired(now, maxAttempts);
        return repository.due(now, PageRequest.of(0, 50));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Claim claim(String id) {
        Instant now = Instant.now(); UUID token = UUID.randomUUID();
        if (repository.claim(id, token, now, now.plusSeconds(leaseSeconds), maxAttempts) != 1) return null;
        var event = repository.findById(id).orElseThrow();
        return new Claim(event.payload(), token, event.getAttempts(), event.getCorrelationId()==null?"legacy-"+event.getEventId():event.getCorrelationId());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finish(Claim claim, boolean success, boolean retryable, String error) {
        String status = success ? "SENT" : retryable && claim.attempts() < maxAttempts ? "PENDING" : "FAILED";
        long backoff = Math.min(3600, 5L << Math.min(10, Math.max(0, claim.attempts()-1)));
        repository.finish(claim.payload().eventId(), claim.token(), status, Instant.now().plusSeconds(backoff),
                error == null ? null : error.substring(0, Math.min(500, error.length())));
    }
}
