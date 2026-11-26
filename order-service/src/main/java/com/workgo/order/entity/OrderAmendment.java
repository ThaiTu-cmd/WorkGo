package com.workgo.order.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "order_amendments", indexes = {
        @Index(name = "idx_order_amendments_order", columnList = "order_id, created_at")
})
public class OrderAmendment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "amendment_id")
    UUID amendmentId;
    String rewardQuoteRef;
    UUID paymentReceiptId;
    Instant paymentAdjustedAt;

    @Column(name = "order_id", nullable = false)
    UUID orderId;

    @Column(name = "base_version_no", nullable = false)
    Integer baseVersionNo;

    @Column(name = "proposed_by", nullable = false)
    UUID proposedBy;

    @Column(name = "proposed_by_role", nullable = false)
    String proposedByRole;

    @Column(columnDefinition="TEXT")
    String oldScope;
    BigDecimal oldPrice;
    Integer oldDurationDays;

    @Column(name = "new_scope", columnDefinition = "TEXT")
    String newScope;

    @Column(name = "new_price")
    BigDecimal newPrice;

    @Column(name = "new_duration_days")
    Integer newDurationDays;

    @Column(name = "reason", columnDefinition = "TEXT", nullable = false)
    String reason;

    @Column(name = "status", nullable = false)
    String status;

    @Column(name = "responded_by")
    UUID respondedBy;

    @Column(name = "responded_at")
    Instant respondedAt;

    @Column(name = "response_note", columnDefinition = "TEXT")
    String responseNote;

    @Version
    @Column(name = "version")
    Long version;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    Instant createdAt = Instant.now();
}
