package com.workgo.payment.entity;

import com.workgo.payment.enumeration.EscrowStatus;
import com.workgo.payment.enumeration.FeeChargedParty;
import com.workgo.payment.enumeration.SettlementDestination;
import com.workgo.payment.enumeration.SettlementOperation;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.Immutable;

import java.time.Instant;
import java.util.UUID;

//ket qua lenh phan quyet da chay; ghi cung transaction voi but toan, goi lai tra dung ban ghi nay
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Immutable
@Table(name = "settlement_receipts", uniqueConstraints = {
        @UniqueConstraint(name = "uk_settlement_receipt_decision", columnNames = {"decision_id"}),
        @UniqueConstraint(name = "uk_settlement_receipt_order", columnNames = {"order_id"})
})
public class SettlementReceipt {

    @Enumerated(EnumType.STRING)
    @Column(name = "funding_source")
    com.workgo.payment.enumeration.EscrowFundingSource fundingSource;

    @Column(name = "fee_policy_version_id")
    UUID policyVersionId;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "settlement_receipt_id")
    UUID settlementReceiptId;

    @Column(name = "payload_hash", nullable = false, length = 64)
    String payloadHash;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "operation", nullable = false)
    SettlementOperation operation;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "branch", nullable = false)
    FeeChargedParty branch;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "destination", nullable = false)
    SettlementDestination destination;

    @Column(name = "amount", nullable = false)
    Long amount;

    @Column(name = "fee_amount", nullable = false)
    Long feeAmount;

    @Column(name = "destination_amount", nullable = false)
    Long destinationAmount;

    @Column(name = "currency", nullable = false)
    String currency;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "escrow_status", nullable = false)
    EscrowStatus escrowStatus;

    @Builder.Default
    @Column(name = "settled_at", nullable = false)
    Instant settledAt = Instant.now();

    //============FK===============

    @Column(name = "decision_id", nullable = false)
    UUID decisionId;

    @Column(name = "order_id", nullable = false)
    UUID orderId;

    @Column(name = "dispute_id")
    UUID disputeId;

    @Column(name = "destination_id", nullable = false)
    UUID destinationId;

    @Column(name = "settle_transaction_id", nullable = false)
    UUID settleTransactionId;

    @Column(name = "fee_assessment_id")
    UUID feeAssessmentId;
}
