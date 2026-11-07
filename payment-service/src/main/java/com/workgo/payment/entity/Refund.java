package com.workgo.payment.entity;

import com.workgo.payment.enumeration.RefundReason;
import com.workgo.payment.enumeration.RefundStatus;
import com.workgo.payment.enumeration.TriggeredBy;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "refunds", indexes = {
    @Index(name = "idx_refund_order", columnList = "order_id"),
    @Index(name = "idx_refund_status", columnList = "status")
})
public class Refund {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "refund_id")
    UUID refundId;

    @Column(name = "amount", nullable = false)
    BigDecimal amount;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "reason_code", nullable = false)
    RefundReason reasonCode;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "initiated_by")
    TriggeredBy initiatedBy;

    @Builder.Default
    @Enumerated(value = EnumType.STRING)
    @Column(name = "status", nullable = false)
    RefundStatus status = RefundStatus.PENDING;

    @Column(name = "gateway_ref")
    String gatewayRef;

    @Column(name = "failure_message")
    String failureMessage;

    @Column(name = "processed_at")
    Instant processedAt;

    @Version
    @Column(name = "version")
    Long version;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    Instant updatedAt;

    //============FK===============

    @Column(name = "order_id", nullable = false)
    UUID orderId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_id", unique = true)
    Payment payment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escrow_account_id")
    EscrowAccount escrowAccount;

}
