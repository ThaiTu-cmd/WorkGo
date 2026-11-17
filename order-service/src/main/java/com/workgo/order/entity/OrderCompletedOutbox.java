package com.workgo.order.entity;

import com.workgo.order.dto.request.OrderCompletedEvent;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "order_completed_outbox", indexes = @Index(name = "ix_order_completed_outbox_due", columnList = "status,next_attempt_at"))
@Getter @NoArgsConstructor
public class OrderCompletedOutbox {
    @Id @Column(name = "event_id", length = 100) private String eventId;
    @Column(name = "order_id", nullable = false, unique = true, updatable = false) private UUID orderId;
    @Column(name = "client_id", nullable = false, updatable = false) private UUID clientId;
    @Column(name = "provider_id", nullable = false, updatable = false) private UUID providerId;
    @Column(name = "service_id", updatable = false) private UUID serviceId;
    @Column(name = "completed_at", nullable = false, updatable = false) private Instant completedAt;
    @Column(nullable = false) private String status;
    @Column(nullable = false) private int attempts;
    @Column(name = "next_attempt_at", nullable = false) private Instant nextAttemptAt;
    @Column(name = "claim_token") private UUID claimToken;
    @Column(name = "last_error", length = 500) private String lastError;

    public static OrderCompletedOutbox from(Order order) {
        OrderCompletedOutbox event = new OrderCompletedOutbox();
        event.eventId = UUID.randomUUID().toString();
        event.orderId = order.getOrderId();
        event.clientId = order.getClientId();
        event.providerId = order.getProviderId();
        event.serviceId = order.getServiceId();
        event.completedAt = order.getCompletedAt();
        event.status = "PENDING";
        event.nextAttemptAt = Instant.now();
        return event;
    }

    public OrderCompletedEvent payload() {
        return new OrderCompletedEvent(eventId, orderId, clientId, providerId, serviceId, completedAt);
    }
}
