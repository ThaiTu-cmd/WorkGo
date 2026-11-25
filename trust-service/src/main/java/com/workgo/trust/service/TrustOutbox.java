package com.workgo.trust.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.trust.entity.TrustOutboxEvent;
import com.workgo.trust.repository.TrustOutboxEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Component @RequiredArgsConstructor
public class TrustOutbox {
    private final TrustOutboxEventRepository repository;
    private final ObjectMapper json;
    public record Notification(UUID eventId, UUID recipientId, UUID providerId, String type,
                               String title, String content, String referenceType, UUID referenceId) {}
    public void add(String aggregateType, UUID aggregateId, String eventType, Object payload) {
        repository.save(TrustOutboxEvent.builder().aggregateType(aggregateType).aggregateId(aggregateId)
                .eventType(eventType).payload(encode(payload)).build());
    }
    public void notify(UUID user, UUID provider, String type, String referenceType, UUID referenceId) {
        String title = switch (type) {
            case "DISPUTE_EVIDENCE_REQUESTED" -> "Please provide additional dispute evidence";
            case "DISPUTE_EVIDENCE_EXTENDED" -> "Dispute evidence deadline has been extended";
            case "DISPUTE_SLA_INTAKE_OVERDUE" -> "Dispute intake SLA (24h) exceeded";
            case "DISPUTE_SLA_DECISION_OVERDUE" -> "Dispute decision SLA (72h) exceeded";
            case "DISPUTE_DECIDED" -> "A dispute decision is available";
            case "REVIEW_PUBLISHED" -> "Đánh giá đã được công bố";
            case "REVIEW_REMINDER" -> "Đơn hàng đã hoàn tất: mời bạn đánh giá";
            case "DISPUTE_OPENED" -> "Đơn hàng có tranh chấp mới";
            default -> throw new IllegalArgumentException("Unknown notification type");
        };
        add(referenceType, referenceId, "notification.send", new Notification(UUID.randomUUID(), user, provider,
                type, title, null, referenceType, referenceId));
    }
    public String encode(Object payload) {
        try { return json.writeValueAsString(payload); }
        catch (com.fasterxml.jackson.core.JsonProcessingException e) { throw new IllegalStateException("Cannot serialize durable event", e); }
    }
}
