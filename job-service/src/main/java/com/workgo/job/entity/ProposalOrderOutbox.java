package com.workgo.job.entity;

import com.workgo.job.enumeration.OrderSyncStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

/** Immutable payload plus durable delivery state; proposalId is the remote idempotency key. */
@Entity
@Table(name = "proposal_order_outbox", indexes =
        @Index(name = "idx_proposal_order_outbox_due", columnList = "status, next_attempt_at"))
@Getter @Setter @NoArgsConstructor
public class ProposalOrderOutbox {
    @Id @Column(name = "proposal_id")
    private UUID proposalId;
    @Column(nullable = false, columnDefinition = "TEXT", updatable = false)
    private String payload;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private OrderSyncStatus status = OrderSyncStatus.PENDING;
    @Column(nullable = false)
    private int attempts;
    private UUID orderId;
    private UUID leaseToken;
    @Column(nullable = false)
    private Instant nextAttemptAt = Instant.now();
    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
    // Fixed error category only; never persist Feign body/credentials in user-visible state.
    private String lastError;
    @Version
    private Long version;
}
