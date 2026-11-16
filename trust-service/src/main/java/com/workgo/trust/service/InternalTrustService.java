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
    public void orderCompleted(InternalOrderCompletedEventReq req) {
        // Typed canonical fields: UUIDs lowercase, null explicit, Instant normalized.
        String canonical = req.orderId()+"\n"+req.clientId()+"\n"+req.providerId()+"\n"+req.serviceId()+"\n"+req.completedAt();
        String hash;
        try { hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
        transactions.locked(List.of("inbox:"+req.eventId()), () -> {
            var existing = inbox.findByEventId(req.eventId());
            if (existing.isPresent()) {
                if (!existing.get().getPayloadHash().equals(hash)) throw new AppException(ErrorCode.IDEMPOTENCY_CONFLICT);
                return null;
            }
            inbox.save(TrustInboxEvent.builder().eventId(req.eventId()).eventType("order.completed").payloadHash(hash)
                    .payload(outbox.encode(req)).processedAt(Instant.now()).build());
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
