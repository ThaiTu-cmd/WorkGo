package com.workgo.trust.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.trust.dto.request.client.*;
import com.workgo.trust.dto.response.client.EscrowAccountResponse;
import com.workgo.trust.enumeration.*;
import com.workgo.trust.repository.*;
import com.workgo.trust.repository.client.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.Instant;

@Component @RequiredArgsConstructor @Slf4j
public class TrustOutboxWorker {
    private final TrustOutboxEventRepository repository;
    private final DisputeRepository disputes;
    private final TrustOutboxStore store;
    private final TrustOutbox outbox;
    private final ObjectMapper json;
    private final PaymentClient payment;
    private final IdentityClient identity;
    private final CatalogClient catalog;
    private final CommunicationClient communication;
    @Value("${app.workers.enabled:true}") private boolean enabled;
    @Scheduled(fixedDelayString="${app.outbox.poll-interval-ms:5000}",initialDelayString="${app.outbox.initial-delay-ms:10000}")
    public void scheduled() { if (enabled) poll(); }
    public void poll() {
        var due = repository.findByStatusAndNextAttemptAtLessThanEqualOrderByNextAttemptAtAscCreatedAtAsc(
                OutboxStatus.PENDING,Instant.now(),PageRequest.of(0,100));
        for (var event : due) {
            try { deliver(event.getId()); }
            catch (RuntimeException e) { log.warn("Outbox delivery deferred {} ({})",event.getId(),e.getClass().getSimpleName()); }
        }
    }
    public void deliver(java.util.UUID id) {
        var delivery = store.claim(id);
        if (delivery == null) return;
        try (var trace=com.workgo.trust.configuration.CorrelationTrace.use(delivery.correlationId())) {
            String result = dispatch(delivery);
            store.finish(delivery,result,null,false);
        } catch (TrustClientException e) {
            store.finish(delivery,null,"REMOTE_HTTP_"+e.getHttpStatus()+"_CODE_"+e.getRemoteCode(),e.isRetryable());
        } catch (feign.FeignException e) {
            store.finish(delivery,null,"TRANSPORT_HTTP_"+e.status(),e.status() < 0 || e.status() >= 500 || e.status() == 429);
        } catch (ReconciliationRequired e) {
            store.finish(delivery,null,e.getMessage(),false);
        } catch (Exception e) {
            store.finish(delivery,null,"DELIVERY_"+e.getClass().getSimpleName(),true);
        }
    }
    private String dispatch(TrustOutboxStore.Delivery d) throws Exception {
        return switch (d.eventType()) {
            case "review.published.provider" -> {
                var req = json.readValue(d.payload(),ProviderRatingStatsRequest.class);
                var ack = identity.updateRatingStats(d.aggregateId(),req);
                if (ack == null || !d.aggregateId().equals(ack.providerProfileId())) throw new IllegalStateException("Invalid provider ACK");
                yield "RATING_ACCEPTED";
            }
            case "review.published.service" -> {
                var req = json.readValue(d.payload(),ServiceRatingStatsRequest.class);
                var ack = catalog.updateRatingStats(d.aggregateId(),req);
                if (ack == null || !d.aggregateId().equals(ack.serviceId())) throw new IllegalStateException("Invalid service ACK");
                yield "RATING_ACCEPTED";
            }
            case "dispute.opened.freeze_escrow", "dispute.cancelled.unfreeze_escrow" -> {
                var req = json.readValue(d.payload(),EscrowFreezeRequest.class);
                boolean freeze = d.eventType().equals("dispute.opened.freeze_escrow");
                EscrowAccountResponse ack = freeze ? payment.freeze(req) : payment.unfreeze(req);
                if (ack == null || !req.orderId().equals(ack.orderId()) || ack.status() == null
                        || !java.util.Set.of("PENDING","HOLDING","FROZEN","RELEASED","REFUNDED","PARTIALLY_REFUNDED").contains(ack.status()))
                    throw new IllegalStateException("Invalid escrow ACK");
                var dispute = disputes.findById(req.disputeId()).orElseThrow(() -> new ReconciliationRequired("DISPUTE_MISSING"));
                boolean active = dispute.getStatus() == DisputeStatus.OPEN || dispute.getStatus() == DisputeStatus.UNDER_REVIEW;
                if (freeze && active && !"FROZEN".equals(ack.status())) throw new ReconciliationRequired("FREEZE_NOT_CONFIRMED_"+ack.status());
                // Unfreeze ACK FROZEN can acknowledge a tombstone while another dispute owns the lock.
                yield "ESCROW_ACK_"+ack.status();
            }
            case "notification.send" -> {
                var notification = json.readValue(d.payload(),TrustOutbox.Notification.class);
                if (notification.recipientId() == null) {
                    var profile = identity.getProviderProfile(notification.providerId());
                    if (profile == null || !notification.providerId().equals(profile.providerProfileId()) || profile.userId() == null)
                        throw new IllegalStateException("Invalid provider identity");
                    notification = new TrustOutbox.Notification(notification.eventId(),profile.userId(),notification.providerId(),
                            notification.type(),notification.title(),notification.content(),notification.referenceType(),notification.referenceId());
                    if (!store.payload(d,outbox.encode(notification))) yield "STALE_CLAIM";
                }
                var ack = communication.createNotification(new InternalNotificationCreateReq(notification.eventId(),notification.recipientId(),
                        notification.type(),notification.title(),notification.content(),notification.referenceType(),notification.referenceId()));
                if (ack == null || ack.code() != 1000 || ack.result() == null || !notification.recipientId().equals(ack.result().recipientId()))
                    throw new IllegalStateException("Invalid notification ACK");
                yield "NOTIFICATION_ACCEPTED";
            }
            default -> throw new ReconciliationRequired("UNKNOWN_EVENT_TYPE");
        };
    }
    private static class ReconciliationRequired extends RuntimeException {
        ReconciliationRequired(String reason) { super(reason); }
    }
}
