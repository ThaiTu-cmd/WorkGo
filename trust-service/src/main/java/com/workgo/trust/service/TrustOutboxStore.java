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
    private final com.fasterxml.jackson.databind.ObjectMapper json;
    @Value("${app.outbox.max-attempts:5}") private int maxAttempts;
    @Value("${app.outbox.lease-seconds:60}") private int leaseSeconds;
    public record Delivery(UUID id, UUID token, String eventType, UUID aggregateId, String payload, String correlationId) {
        public Delivery(UUID id, UUID token, String eventType, UUID aggregateId, String payload) {this(id,token,eventType,aggregateId,payload,"legacy-"+id);}
    }
    public Delivery claim(UUID id) {
        return transactions.execute(() -> {
            var e = em.find(TrustOutboxEvent.class,id,LockModeType.PESSIMISTIC_WRITE);
            if (e == null || e.getStatus() != OutboxStatus.PENDING || e.getNextAttemptAt().isAfter(Instant.now())) return null;
            if (e.getAttempts() >= maxAttempts) {
                e.setStatus(OutboxStatus.FAILED); e.setLastError("RECONCILE_EXPIRED_FINAL_ATTEMPT"); e.setClaimToken(null); return null;
            }
            e.setAttempts(e.getAttempts()+1); e.setClaimToken(UUID.randomUUID());
            e.setNextAttemptAt(Instant.now().plusSeconds(leaseSeconds));
            return new Delivery(id,e.getClaimToken(),e.getEventType(),e.getAggregateId(),e.getPayload(),e.getCorrelationId()==null?"legacy-"+id:e.getCorrelationId());
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
            if (error == null) { e.setStatus(OutboxStatus.COMPLETED); e.setProcessedAt(Instant.now()); evidenceAcknowledged(e); }
            else if (!retry || e.getAttempts() >= maxAttempts) e.setStatus(OutboxStatus.FAILED);
            else e.setNextAttemptAt(Instant.now().plusSeconds(Math.min(300, 5L << Math.min(e.getAttempts()-1,6))));
            return null;
        });
    }
    private void evidenceAcknowledged(TrustOutboxEvent event) {
        if (!"notification.send".equals(event.getEventType())) return;
        try {
            var n=json.readValue(event.getPayload(),TrustOutbox.Notification.class);
            if (!"DISPUTE_EVIDENCE_REQUESTED".equals(n.type())) return;
            var d=em.find(Dispute.class,n.referenceId(),LockModeType.PESSIMISTIC_WRITE);
            if(d==null||d.getStatus()!=DisputeStatus.UNDER_REVIEW||d.getEvidenceRequest()==null||d.getDecisionId()!=null)return;
            Instant now=Instant.now(),deadline=now.plusSeconds(72*3600);
            boolean updated=false;
            if(n.providerId()!=null && d.getProviderId().equals(n.providerId())){
                if(d.getProviderEvidenceAckAt()==null && d.getProviderEvidenceDeadline()==null){
                    d.setProviderEvidenceAckAt(now);
                    d.setProviderEvidenceDeadline(deadline);
                    updated=true;
                }
            } else if(n.providerId()==null && d.getClientId().equals(n.recipientId())){
                if(d.getClientEvidenceAckAt()==null && d.getClientEvidenceDeadline()==null){
                    d.setClientEvidenceAckAt(now);
                    d.setClientEvidenceDeadline(deadline);
                    updated=true;
                }
            }
            if(!updated)return;
            if(d.getEvidenceRequestedAt()==null)d.setEvidenceRequestedAt(now);
            Instant maxDeadline=maxInstant(d.getClientEvidenceDeadline(),d.getProviderEvidenceDeadline());
            d.setEvidenceDeadline(maxDeadline);
            if(d.getClientEvidenceDeadline()!=null && d.getProviderEvidenceDeadline()!=null && maxDeadline!=null){
                d.setDecisionSlaDueAt(maxDeadline.plusSeconds(72*3600));
            }
        } catch(com.fasterxml.jackson.core.JsonProcessingException ex){throw new IllegalStateException("Invalid notification payload",ex);}
    }
    private static Instant maxInstant(Instant a, Instant b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.isAfter(b) ? a : b;
    }
    private TrustOutboxEvent owned(Delivery delivery) {
        var e = em.find(TrustOutboxEvent.class,delivery.id(),LockModeType.PESSIMISTIC_WRITE);
        return e != null && e.getStatus() == OutboxStatus.PENDING && delivery.token().equals(e.getClaimToken()) ? e : null;
    }
}
