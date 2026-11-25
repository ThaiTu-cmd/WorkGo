package com.workgo.trust.service;

import com.workgo.trust.entity.*;
import com.workgo.trust.enumeration.DisputeStatus;
import com.workgo.trust.dto.response.client.SettlementResult;
import jakarta.persistence.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.UUID;

@Component @RequiredArgsConstructor
public class DecisionStore {
    @PersistenceContext private EntityManager em;
    private final TrustTransactions transactions;
    private final TrustOutbox outbox;
    public record Claim(UUID id,UUID token,UUID orderId,UUID disputeId,UUID actor,String operation,Instant effectiveAt,String payload,String receipt,String correlationId){
        public Claim(UUID id,UUID token,UUID orderId,UUID disputeId,UUID actor,String operation,Instant effectiveAt,String payload,String receipt){this(id,token,orderId,disputeId,actor,operation,effectiveAt,payload,receipt,"legacy-"+id);}
    }
    public Claim claim(UUID id){return transactions.execute(()->{
        var d=em.find(DisputeDecision.class,id,LockModeType.PESSIMISTIC_WRITE);Instant now=Instant.now();
        if(d==null||!"PENDING".equals(d.getExecutionStatus())||d.getNextAttemptAt().isAfter(now))return null;
        if(d.getAttempts()>=5){d.setExecutionStatus("NEEDS_RECONCILIATION");d.setLastError("ATTEMPTS_EXHAUSTED");d.setLeaseToken(null);return null;}
        d.setLeaseToken(UUID.randomUUID());d.setAttempts(d.getAttempts()+1);d.setNextAttemptAt(now.plusSeconds(60));
        return new Claim(id,d.getLeaseToken(),d.getOrderId(),d.getDisputeId(),d.getActorId(),d.getOperation(),d.getEffectiveAt(),d.getSettlementPayload(),d.getPaymentResult(),d.getCorrelationId()==null?"legacy-"+id:d.getCorrelationId());
    });}
    public void payment(Claim c,SettlementResult result){transactions.execute(()->{var d=owned(c);if(d==null)return null;
        d.setPaymentResult(outbox.encode(result));d.setPaymentStatus("COMPLETED");d.setAttempts(0);d.setLeaseToken(null);d.setNextAttemptAt(Instant.now());d.setLastError(null);return null;});}
    public void complete(Claim c){transactions.execute(()->{var d=owned(c);if(d==null)return null;
        var dispute=em.find(Dispute.class,c.disputeId(),LockModeType.PESSIMISTIC_WRITE);
        d.setOrderStatus("COMPLETED");d.setTimerStatus("SKIPPED");d.setExecutionStatus("COMPLETED");d.setLeaseToken(null);d.setLastError(null);
        dispute.setStatus("RELEASE".equals(c.operation())?DisputeStatus.RESOLVED_PROVIDER:DisputeStatus.RESOLVED_CLIENT);dispute.setResolvedAt(Instant.now());return null;});}
    public void unfreeze(Claim c){transactions.execute(()->{var d=owned(c);if(d==null)return null;
        d.setPaymentStatus("COMPLETED");d.setPaymentResult("UNFROZEN");d.setAttempts(0);d.setLeaseToken(null);
        d.setNextAttemptAt(Instant.now());d.setLastError(null);return null;});}
    public void resumed(Claim c,com.workgo.trust.dto.response.client.TimerAck ack){transactions.execute(()->{var d=owned(c);if(d==null)return null;
        d.setTimerResult(outbox.encode(ack));d.setTimerStatus("COMPLETED");d.setOrderStatus("COMPLETED");
        d.setExecutionStatus("COMPLETED");d.setLeaseToken(null);d.setLastError(null);return null;});}
    public void failure(Claim c,String code,boolean retry,boolean terminal){transactions.execute(()->{var d=owned(c);if(d==null)return null;
        d.setLeaseToken(null);d.setLastError(code);d.setTerminalConflict(terminal);
        if(!retry||d.getAttempts()>=5)d.setExecutionStatus("NEEDS_RECONCILIATION");
        else d.setNextAttemptAt(Instant.now().plusSeconds(Math.min(300,5L << Math.min(d.getAttempts()-1,6))));return null;});}
    private DisputeDecision owned(Claim c){var d=em.find(DisputeDecision.class,c.id(),LockModeType.PESSIMISTIC_WRITE);
        return d!=null&&"PENDING".equals(d.getExecutionStatus())&&c.token().equals(d.getLeaseToken())?d:null;}
}
