package com.workgo.trust.service;
import com.workgo.trust.dto.request.InternalOrderCompletedEventReq;
import com.workgo.trust.dto.response.InternalOrderDisputeStatusResponse;
import com.workgo.trust.entity.TrustInboxEvent;
import com.workgo.trust.exception.*;
import com.workgo.trust.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.Instant;
import java.util.*;
@Service @RequiredArgsConstructor
public class InternalTrustService {
    private final TrustInboxEventRepository inbox;
    private final DisputeRepository disputes;
    private final TrustTransactions transactions;
    private final TrustOutbox outbox;
    private final RewardCompletionService completion;
    public void orderCompleted(InternalOrderCompletedEventReq req) {
        // Typed canonical fields: UUIDs lowercase, null explicit, Instant normalized.
        String canonical = req.orderId()+"\n"+req.clientId()+"\n"+req.providerId()+"\n"+req.serviceId()+"\n"+req.completedAt();
        String hash;
        try { hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
        // Reject changed replays before any reward effect; source HTTP stays outside the transaction.
        var prior=inbox.findByEventId(req.eventId());
        if(prior.isPresent()){
            if(!"order.completed".equals(prior.get().getEventType())||!prior.get().getPayloadHash().equals(hash))throw new AppException(ErrorCode.IDEMPOTENCY_CONFLICT);
            if(prior.get().getProcessedAt()!=null)return;
        }
        var prepared=completion.prepare(req.orderId(),req.providerId(),req.clientId());
        transactions.locked(List.of("inbox:"+req.eventId(),"reward:"+req.orderId(),"reputation:"+req.providerId()), () -> {
            var existing = inbox.findByEventId(req.eventId());
            if (existing.isPresent()) {
                if (!"order.completed".equals(existing.get().getEventType())||!existing.get().getPayloadHash().equals(hash)) throw new AppException(ErrorCode.IDEMPOTENCY_CONFLICT);
                if(existing.get().getProcessedAt()!=null)return null;
            }
            if(prepared!=null)completion.apply(prepared);
            var receipt=existing.orElseGet(()->TrustInboxEvent.builder().eventId(req.eventId()).eventType("order.completed").payloadHash(hash).payload(outbox.encode(req)).build());
            receipt.setProcessedAt(Instant.now());
            inbox.save(receipt);
            outbox.notify(req.clientId(),null,"REVIEW_REMINDER","ORDER",req.orderId());
            outbox.notify(null,req.providerId(),"REVIEW_REMINDER","ORDER",req.orderId());
            return null;
        });
    }
    public InternalOrderDisputeStatusResponse disputeStatus(UUID orderId) {
        var active = disputes.findByOrderIdAndActiveSlot(orderId,1).orElse(null);
        return new InternalOrderDisputeStatusResponse(orderId,active != null,active == null ? null : active.getDisputeId(),active == null ? null : active.getStatus());
    }
}
