package com.workgo.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.Immutable;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Immutable
@Table(name = "wallet_ledger_entries", indexes = {
        @Index(name = "idx_wallet_ledger_entries_account", columnList = "wallet_account_id, created_at")
})
public class WalletLedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "wallet_ledger_entry_id")
    UUID walletLedgerEntryId;

    @Column(name = "amount", nullable = false)
    Long amount;

    @Column(name = "balance_after", nullable = false)
    Long balanceAfter;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    Instant createdAt = Instant.now();

    //============FK===============

    @ManyToOne
    @JoinColumn(name = "wallet_transaction_id", nullable = false)
    WalletTransaction transaction;

    @ManyToOne
    @JoinColumn(name = "wallet_account_id", nullable = false)
    WalletAccount account;
}
