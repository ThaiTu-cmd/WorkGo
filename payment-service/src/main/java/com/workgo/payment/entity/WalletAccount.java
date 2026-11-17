package com.workgo.payment.entity;

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
@Table(name = "wallet_accounts", uniqueConstraints = {
        @UniqueConstraint(name = "uk_wallet_account_type_owner", columnNames = {"account_type", "owner_key"})
})
public class WalletAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "wallet_account_id")
    UUID walletAccountId;

    @Column(name = "account_type", nullable = false)
    String accountType;

    @Column(name = "owner_key", nullable = false)
    String ownerKey;

    @Builder.Default
    @Column(name = "currency", nullable = false)
    String currency = "VND";

    @Builder.Default
    @Column(name = "balance", nullable = false)
    Long balance = 0L;

    @Version
    @Column(name = "version")
    Long version;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    Instant updatedAt;
}
