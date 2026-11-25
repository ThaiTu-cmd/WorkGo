package com.workgo.trust.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.trust.dto.request.client.*;
import com.workgo.trust.dto.response.client.*;
import com.workgo.trust.repository.*;
import com.workgo.trust.repository.client.*;
import com.workgo.trust.enumeration.OutboxStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.*;
import java.time.Instant;
import java.util.*;

@Component @RequiredArgsConstructor @Slf4j
public class DecisionWorker {
    private final DecisionStore store;
    private final DisputeDecisionRepository decisions;
    private final TrustOutboxEventRepository outbox;
    private final PaymentClient payment;
    private final OrderClient orders;
    private final ObjectMapper json;
    @Value("${app.workers.enabled:true}") private boolean enabled;
    @Value("${app.decisions.execution-enabled:false}") private boolean executionEnabled;
    @Scheduled(fixedDelayString="${app.outbox.poll-interval-ms:5000}",initialDelayString="${app.outbox.initial-delay-ms:10000}")
    public void poll(){if(!enabled||!executionEnabled)return;for(var d:decisions.findByExecutionStatusAndNextAttemptAtLessThanEqual("PENDING",Instant.now(),PageRequest.of(0,50))){
        try{deliver(d.getDecisionId());}catch(RuntimeException e){log.warn("Decision delivery deferred {} ({})",d.getDecisionId(),e.getClass().getSimpleName());}
    }}
    @Transactional(propagation=Propagation.NOT_SUPPORTED)
    public void deliver(UUID id){var c=store.claim(id);if(c==null)return;
        try(var trace=com.workgo.trust.configuration.CorrelationTrace.use(c.correlationId())){
            if("REJECT".equals(c.operation())){
                if(c.receipt()==null){
                    var ack=payment.unfreeze(new EscrowFreezeRequest(c.orderId(),c.disputeId(),"DISPUTE_REJECTED"));
                    if(ack==null||!c.orderId().equals(ack.orderId())||ack.status()==null
                            ||!Set.of("PENDING","HOLDING","FROZEN","RELEASED","REFUNDED","PARTIALLY_REFUNDED").contains(ack.status()))throw new InvalidAck();
                    store.unfreeze(c);return;
                }
                var ack=orders.resumeTimer(c.orderId(),new TimerResumeCommand("DISPUTE",c.disputeId(),c.id(),false));
                if(ack==null||!c.orderId().equals(ack.orderId())||!c.id().equals(ack.commandId())||ack.timerVersion()==null||ack.timerVersion()<0
                        ||ack.paused()==null||ack.requiresNewDelivery()==null||ack.paused()&&ack.resumeAt()!=null
                        ||ack.requiresNewDelivery()&&!ack.paused())throw new InvalidAck();
                store.resumed(c,ack);return;
            }
            var command=json.readValue(c.payload(),SettlementCommand.class);
            if(c.receipt()==null){
                var freeze=outbox.findByAggregateIdAndEventType(c.disputeId(),"dispute.opened.freeze_escrow").orElse(null);
                if(freeze==null||freeze.getStatus()!=OutboxStatus.COMPLETED||!"ESCROW_ACK_FROZEN".equals(freeze.getDeliveryResult())){
                    store.failure(c,"FREEZE_NOT_CONFIRMED",freeze!=null&&freeze.getStatus()==OutboxStatus.PENDING,false);return;
                }
                var result=payment.settle(command);validatePayment(command,result);store.payment(c,result);return;
            }
            var receipt=json.readValue(c.receipt(),SettlementResult.class);validatePayment(command,receipt);
            var result=orders.applyDecision(c.orderId(),new ApplyDecisionCommand(c.id(),c.disputeId(),c.operation(),c.actor(),c.effectiveAt(),
                    receipt.settlementReceiptId(),receipt.settleTransactionId(),receipt.destination(),receipt.destinationId(),receipt.amount(),receipt.destinationAmount(),receipt.feeAmount(),receipt.escrowStatus()));
            boolean release="RELEASE".equals(c.operation());
            if(result==null||!c.id().equals(result.decisionId())||!c.orderId().equals(result.orderId())||!c.disputeId().equals(result.disputeId())
                    ||!c.operation().equals(result.operation())||!receipt.settlementReceiptId().equals(result.settlementReceiptId())
                    ||!(release?"COMPLETED":"CANCELLED").equals(result.orderStatus())||!(release?"RELEASED":"REFUNDED").equals(result.paymentStatus()))throw new InvalidAck();
            store.complete(c);
        }catch(TrustClientException e){store.failure(c,"REMOTE_HTTP_"+e.getHttpStatus()+"_CODE_"+e.getRemoteCode(),e.isRetryable(),e.getHttpStatus()==409);}
        catch(feign.FeignException e){store.failure(c,"HTTP_"+e.status(),e.status()<0||e.status()>=500||e.status()==429,e.status()==409);}
        catch(InvalidAck e){store.failure(c,"INVALID_RECEIPT",false,true);}
        catch(Exception e){store.failure(c,"DELIVERY_"+e.getClass().getSimpleName(),true,false);}
    }
    private void validatePayment(SettlementCommand c,SettlementResult r){boolean release="RELEASE".equals(c.operation());
        if(r==null||r.settlementReceiptId()==null||r.settleTransactionId()==null||!c.decisionId().equals(r.decisionId())||!c.orderId().equals(r.orderId())
                ||!c.disputeId().equals(r.disputeId())||!c.operation().equals(r.operation())||!c.branch().equals(r.branch())
                ||!c.destination().equals(r.destination())||!c.destinationId().equals(r.destinationId())||!c.currency().equals(r.currency())
                ||r.amount()==null||c.amount().compareTo(java.math.BigDecimal.valueOf(r.amount()))!=0
                ||r.feeAmount()==null||r.feeAmount()<0||r.destinationAmount()==null||r.destinationAmount()<0||r.destinationAmount()>r.amount()
                ||release&&r.destinationAmount()!=r.amount()-r.feeAmount()||!(release?"RELEASED":"REFUNDED").equals(r.escrowStatus()))throw new InvalidAck();
    }
    private static class InvalidAck extends RuntimeException{}
}
