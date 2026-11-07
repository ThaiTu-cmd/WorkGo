package com.workgo.payment.entity;

import com.workgo.payment.enumeration.EscrowTxnType;
import com.workgo.payment.enumeration.TriggeredBy;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Immutable
@Table(name = "escrow_transactions", indexes = {
    @Index(name = "idx_escrow_txn_account_created", columnList = "escrow_account_id, created_at")
})
public class EscrowTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "escrow_transaction_id")
    UUID escrowTransactionId;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "txn_type", nullable = false)
    EscrowTxnType txnType;

    @Column(name = "amount", nullable = false)
    BigDecimal amount;

    @Column(name = "balance_after", nullable = false)
    BigDecimal balanceAfter;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "triggered_by")
    TriggeredBy triggeredBy;

    @Column(name = "actor_id")
    UUID actorId;

    @Column(name = "reason_code")
    String reasonCode;

    @Column(name = "saga_id")
    UUID sagaId;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    //============FK===============

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "escrow_account_id")
    EscrowAccount escrowAccount;

}
