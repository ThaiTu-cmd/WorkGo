package com.workgo.payment.entity;

import com.workgo.payment.enumeration.PaymentGateway;
import com.workgo.payment.enumeration.PaymentMethod;
import com.workgo.payment.enumeration.TopUpStatus;
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
@Table(name = "wallet_top_ups", uniqueConstraints = {
        @UniqueConstraint(name = "uk_wallet_top_up_gateway_txn", columnNames = {"gateway", "gateway_txn_id"})
}, indexes = {
        @Index(name = "idx_wallet_top_up_user", columnList = "user_id, created_at"),
        @Index(name = "idx_wallet_top_up_status_expires", columnList = "status, expires_at")
})
public class WalletTopUp {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "top_up_id")
    UUID topUpId;

    @Column(name = "top_up_code", unique = true, nullable = false, length = 34)
    String topUpCode;

    @Column(name = "amount", nullable = false)
    Long amount;

    @Builder.Default
    @Column(name = "currency", nullable = false)
    String currency = "VND";

    @Enumerated(value = EnumType.STRING)
    @Column(name = "gateway", nullable = false)
    PaymentGateway gateway;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "payment_method")
    PaymentMethod paymentMethod;

    @Column(name = "idempotency_key", unique = true, nullable = false)
    String idempotencyKey;

    @Builder.Default
    @Enumerated(value = EnumType.STRING)
    @Column(name = "status", nullable = false)
    TopUpStatus status = TopUpStatus.INITIATED;

    @Column(name = "payment_url", columnDefinition = "TEXT")
    String paymentUrl;

    @Column(name = "qr_code_url", columnDefinition = "TEXT")
    String qrCodeUrl;

    @Column(name = "deeplink", columnDefinition = "TEXT")
    String deeplink;

    @Column(name = "gateway_txn_id")
    String gatewayTxnId;

    @Column(name = "failure_code")
    String failureCode;

    @Column(name = "failure_message")
    String failureMessage;

    @Column(name = "raw_response", columnDefinition = "TEXT")
    String rawResponse;

    @Column(name = "expires_at", nullable = false)
    Instant expiresAt;

    @Column(name = "confirmed_at")
    Instant confirmedAt;

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

    @Column(name = "wallet_transaction_id")
    UUID walletTransactionId;

}
