package com.workgo.payment.entity;

import com.workgo.payment.enumeration.PayoutStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "wallet_payouts", indexes = {
        @Index(name = "idx_wallet_payout_user", columnList = "user_id, created_at"),
        @Index(name = "idx_wallet_payout_status", columnList = "status, updated_at")
})
public class WalletPayout {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "payout_id")
    UUID payoutId;

    @Column(name = "payout_code", unique = true, nullable = false, length = 34)
    String payoutCode;

    @Column(name = "amount", nullable = false)
    Long amount;

    @Builder.Default
    @Column(name = "currency", nullable = false)
    String currency = "VND";

    @Column(name = "bank_code", nullable = false)
    String bankCode;

    @Column(name = "account_number", nullable = false)
    String accountNumber;

    @Column(name = "account_name", nullable = false)
    String accountName;

    @Column(name = "idempotency_key", unique = true, nullable = false)
    String idempotencyKey;

    @Column(name = "payload_hash", length = 64, updatable = false)
    String payloadHash;

    @Column(name = "verified_beneficiary_id", updatable = false)
    UUID verifiedBeneficiaryId;
    @Column(name="source_evidence_hash",length=64)
    String sourceEvidenceHash;
    @Column(name="source_verified_at")
    Instant sourceVerifiedAt;

    @Builder.Default
    @Enumerated(value = EnumType.STRING)
    @Column(name = "status", nullable = false)
    PayoutStatus status = PayoutStatus.REQUESTED;

    @Column(name = "external_reference", unique = true)
    String externalReference;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    String failureReason;

    @Column(name = "processing_at")
    Instant processingAt;

    @Column(name = "finished_at")
    Instant finishedAt;

    @Version
    @Column(name = "version")
    Long version;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    Instant updatedAt;

    //============FK===============

    @Column(name = "user_id", nullable = false)
    UUID userId;

    @Column(name = "hold_transaction_id")
    UUID holdTransactionId;

    @Column(name = "settle_transaction_id")
    UUID settleTransactionId;

}
