package com.workgo.payment.entity;

import com.workgo.payment.enumeration.EscrowFundingSource;
import com.workgo.payment.enumeration.EscrowStatus;
import com.workgo.payment.enumeration.OrderSyncStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "escrow_accounts")
public class EscrowAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "escrow_account_id")
    UUID escrowAccountId;

    @Column(name = "held_amount", nullable = false)
    BigDecimal heldAmount;

    @Column(name = "platform_fee_amount")
    BigDecimal platformFeeAmount;

    @Column(name = "provider_net_amount")
    BigDecimal providerNetAmount;

    @Builder.Default
    @Column(name = "released_amount")
    BigDecimal releasedAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "refunded_amount")
    BigDecimal refundedAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "currency")
    String currency = "VND";

    @Builder.Default
    @Enumerated(value = EnumType.STRING)
    @Column(name = "status", nullable = false)
    EscrowStatus status = EscrowStatus.HOLDING;

    @Column(name = "held_at")
    Instant heldAt;

    @Column(name = "released_at")
    Instant releasedAt;

    @Column(name = "refunded_at")
    Instant refundedAt;

    @Column(name = "auto_release_at")
    Instant autoReleaseAt;

    @Column(name = "active_dispute_id")
    UUID activeDisputeId;

    @Builder.Default
    @Enumerated(value = EnumType.STRING)
    @ColumnDefault("'GATEWAY'")
    @Column(name = "funding_source", nullable = false)
    EscrowFundingSource fundingSource = EscrowFundingSource.GATEWAY;

    @Builder.Default
    @Enumerated(value = EnumType.STRING)
    @Column(name = "order_sync_status")
    OrderSyncStatus orderSyncStatus = OrderSyncStatus.NOT_REQUIRED;

    @Builder.Default
    @Column(name = "order_sync_retry_count")
    int orderSyncRetryCount = 0;

    @Version
    @Column(name = "version")
    Long version;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    Instant updatedAt;

    //============FK===============

    @Column(name = "order_id", unique = true, nullable = false)
    UUID orderId;

    @Column(name = "client_id", nullable = false)
    UUID clientId;

    @Column(name = "provider_id", nullable = false)
    UUID providerId;

    //WALLET khong co payment cong
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", unique = true)
    Payment payment;

    @Column(name = "provider_user_id")
    UUID providerUserId;

    @Column(name = "fee_policy_version_id")
    UUID feePolicyVersionId;

    @Column(name = "hold_transaction_id")
    UUID holdTransactionId;

    @Column(name = "settle_transaction_id")
    UUID settleTransactionId;

    @Builder.Default
    @OneToMany(mappedBy = "escrowAccount")
    @OrderBy("createdAt ASC")
    List<EscrowTransaction> transactions = new ArrayList<>();

}
