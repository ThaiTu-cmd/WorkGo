package com.workgo.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.Immutable;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Immutable
@Table(name = "wallet_transactions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_wallet_transaction_idempotency", columnNames = {"idempotency_key"})
})
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "wallet_transaction_id")
    UUID walletTransactionId;

    @Column(name = "idempotency_key", nullable = false)
    String idempotencyKey;

    @Column(name = "posting_type", nullable = false)
    String postingType;

    @Column(name = "obligation_id", nullable = false)
    UUID obligationId;

    @Column(name = "description")
    String description;

    @Column(name = "payload_hash", nullable = false)
    String payloadHash;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    Instant createdAt = Instant.now();

    //============FK===============

    @Builder.Default
    @OneToMany(mappedBy = "transaction", cascade = CascadeType.PERSIST)
    @OrderBy("walletLedgerEntryId")
    List<WalletLedgerEntry> entries = new ArrayList<>();
}
