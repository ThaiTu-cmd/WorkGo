package com.workgo.job.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.job.dto.request.CreateProposalOrderRequest;
import com.workgo.job.dto.response.client.ProposalOrderResponse;
import com.workgo.job.entity.ProposalOrderOutbox;
import com.workgo.job.enumeration.OrderSyncStatus;
import com.workgo.job.repository.ProposalOrderOutboxRepository;
import com.workgo.job.repository.client.OrderClient;
import java.time.Instant;
import java.util.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

/** Lease/commit, remote call, then fenced result/commit. No HTTP call holds a DB transaction. */
@Service @Slf4j
public class ProposalOrderWorker {
    private final ProposalOrderOutboxRepository outbox;
    private final OrderClient orders;
    private final ObjectMapper json;
    private final TransactionTemplate tx;
    private final int maxAttempts;
    private final long leaseSeconds;

    public ProposalOrderWorker(ProposalOrderOutboxRepository outbox, OrderClient orders, ObjectMapper json,
            PlatformTransactionManager manager, @Value("${app.outbox.max-attempts:5}") int maxAttempts,
            @Value("${app.outbox.lease-seconds:60}") long leaseSeconds) {
        this.outbox = outbox;
        this.orders = orders;
        this.json = json;
        this.maxAttempts = Math.max(1, maxAttempts);
        this.leaseSeconds = Math.max(30, leaseSeconds);
        this.tx = new TransactionTemplate(manager);
        this.tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public void processDue() {
        var ids = outbox.findDue(List.of(OrderSyncStatus.PENDING, OrderSyncStatus.RETRY, OrderSyncStatus.PROCESSING),
                Instant.now(), PageRequest.of(0, 20));
        for (UUID id : ids) {
            try { deliver(id); }
            catch (RuntimeException ex) { log.warn("Outbox delivery deferred for proposal {} ({})", id, ex.getClass().getSimpleName()); }
        }
    }

    public void deliver(UUID id) {
        Claim claim = tx.execute(status -> claim(id));
        if (claim == null) return;
        ProposalOrderResponse response = null;
        String error = null;
        try {
            var request = json.readValue(claim.payload(), CreateProposalOrderRequest.class);
            response = orders.createFromProposal(id, request);
            if (response == null || response.orderId() == null || !id.equals(response.proposalId()) ||
                    !request.jobId().equals(response.jobId()) || !"PROPOSAL".equals(response.sourceType()))
                throw new IllegalStateException("Invalid order response");
        } catch (Exception ex) {
            error = "ORDER_DELIVERY_FAILED";
            log.warn("Order delivery failed for proposal {} ({})", id, ex.getClass().getSimpleName());
        }
        ProposalOrderResponse result = response;
        String failure = error;
        tx.executeWithoutResult(status -> finish(id, claim.token(), result, failure));
    }

    private Claim claim(UUID id) {
        ProposalOrderOutbox event = outbox.findLockedById(id).orElse(null);
        Instant now = Instant.now();
        if (event == null || event.getStatus() == OrderSyncStatus.SUCCEEDED || event.getStatus() == OrderSyncStatus.FAILED ||
                event.getNextAttemptAt().isAfter(now)) return null;
        // An exhausted, expired lease becomes FAILED even if the worker died on its final attempt.
        if (event.getAttempts() >= maxAttempts) {
            event.setStatus(OrderSyncStatus.FAILED);
            event.setLeaseToken(null);
            event.setLastError("DELIVERY_ATTEMPTS_EXHAUSTED");
            event.setUpdatedAt(now);
            return null;
        }
        event.setStatus(OrderSyncStatus.PROCESSING);
        event.setAttempts(event.getAttempts() + 1);
        event.setLeaseToken(UUID.randomUUID());
        event.setNextAttemptAt(now.plusSeconds(leaseSeconds));
        event.setUpdatedAt(now);
        return new Claim(event.getPayload(), event.getLeaseToken());
    }

    private void finish(UUID id, UUID token, ProposalOrderResponse result, String failure) {
        var event = outbox.findLockedById(id).orElseThrow();
        // A newer worker may have recovered an expired lease. Ignore the stale worker's result.
        if (event.getStatus() != OrderSyncStatus.PROCESSING || !token.equals(event.getLeaseToken())) return;
        event.setLeaseToken(null);
        event.setUpdatedAt(Instant.now());
        if (failure == null) {
            event.setStatus(OrderSyncStatus.SUCCEEDED);
            event.setOrderId(result.orderId());
            event.setLastError(null);
        } else {
            event.setStatus(event.getAttempts() >= maxAttempts ? OrderSyncStatus.FAILED : OrderSyncStatus.RETRY);
            event.setLastError(failure);
            long delay = Math.min(3600, 30L * (1L << Math.min(7, event.getAttempts() - 1)));
            event.setNextAttemptAt(Instant.now().plusSeconds(delay));
        }
    }

    private record Claim(String payload, UUID token) { }
}
