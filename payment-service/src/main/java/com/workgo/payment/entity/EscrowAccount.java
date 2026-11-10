package com.workgo.payment.entity;

import com.workgo.payment.enumeration.EscrowStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

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

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_id", unique = true)
    Payment payment;

    @Builder.Default
    @OneToMany(mappedBy = "escrowAccount")
    @OrderBy("createdAt ASC")
    List<EscrowTransaction> transactions = new ArrayList<>();

}
