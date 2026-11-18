package com.workgo.order.entity;

import com.workgo.order.enumeration.DecisionOperation;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.enumeration.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.Immutable;

import java.time.Instant;
import java.util.UUID;

//phan quyet da ap vao order; ghi cung transaction voi doi trang thai, goi lai tra ban ghi nay
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Immutable
@Table(name = "order_dispute_decisions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_order_dispute_decision", columnNames = {"decision_id"}),
        @UniqueConstraint(name = "uk_order_dispute_decision_order", columnNames = {"order_id"})
})
public class OrderDisputeDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "order_dispute_decision_id")
    UUID orderDisputeDecisionId;

    @Column(name = "payload_hash", nullable = false, length = 64)
    String payloadHash;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "operation", nullable = false)
    DecisionOperation operation;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "order_status", nullable = false)
    OrderStatus orderStatus;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    PaymentStatus paymentStatus;

    @Column(name = "effective_at", nullable = false)
    Instant effectiveAt;

    @Builder.Default
    @Column(name = "applied_at", nullable = false)
    Instant appliedAt = Instant.now();

    //============FK===============

    @Column(name = "decision_id", nullable = false)
    UUID decisionId;

    @Column(name = "order_id", nullable = false)
    UUID orderId;

    @Column(name = "dispute_id", nullable = false)
    UUID disputeId;

    @Column(name = "decided_by", nullable = false)
    UUID decidedBy;

    @Column(name = "settlement_receipt_id")
    UUID settlementReceiptId;

    @Column(name = "settle_transaction_id")
    UUID settleTransactionId;
}
