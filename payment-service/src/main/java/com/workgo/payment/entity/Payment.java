package com.workgo.payment.entity;

import com.workgo.payment.enumeration.OrderSyncStatus;
import com.workgo.payment.enumeration.PaymentGateway;
import com.workgo.payment.enumeration.PaymentMethod;
import com.workgo.payment.enumeration.PaymentPurpose;
import com.workgo.payment.enumeration.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payment_order_status", columnList = "order_id, status"),
    @Index(name = "idx_payment_status_expires", columnList = "status, expires_at"),
    @Index(name = "idx_payment_status_sync", columnList = "status, order_sync_status")
})
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "payment_id")
    UUID paymentId;

    @Column(name = "payment_code", unique = true, nullable = false, length = 34)
    String paymentCode;

    @Builder.Default
    @Enumerated(value = EnumType.STRING)
    @Column(name = "purpose")
    PaymentPurpose purpose = PaymentPurpose.FULL;

    @Column(name = "amount", nullable = false)
    BigDecimal amount;

    @Column(name = "platform_fee_amount")
    BigDecimal platformFeeAmount;

    @Column(name = "provider_net_amount")
    BigDecimal providerNetAmount;

    @Builder.Default
    @Column(name = "currency")
    String currency = "VND";

    @Enumerated(value = EnumType.STRING)
    @Column(name = "gateway", nullable = false)
    PaymentGateway gateway;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "payment_method")
    PaymentMethod paymentMethod;

    @Column(name = "gateway_txn_id")
    String gatewayTxnId;

    @Column(name = "idempotency_key", unique = true, nullable = false)
    String idempotencyKey;

    @Builder.Default
    @Enumerated(value = EnumType.STRING)
    @Column(name = "status", nullable = false)
    PaymentStatus status = PaymentStatus.INITIATED;

    @Column(name = "payment_url", columnDefinition = "TEXT")
    String paymentUrl;

    @Column(name = "qr_code_url", columnDefinition = "TEXT")
    String qrCodeUrl;

    @Column(name = "deeplink", columnDefinition = "TEXT")
    String deeplink;

    @Column(name = "failure_code")
    String failureCode;

    @Column(name = "failure_message")
    String failureMessage;

    @Column(name = "raw_response", columnDefinition = "TEXT")
    String rawResponse;

    @Builder.Default
    @Enumerated(value = EnumType.STRING)
    @Column(name = "order_sync_status")
    OrderSyncStatus orderSyncStatus = OrderSyncStatus.NOT_REQUIRED;

    @Builder.Default
    @Column(name = "order_sync_retry_count")
    int orderSyncRetryCount = 0;

    @Column(name = "order_synced_at")
    Instant orderSyncedAt;

    @Column(name = "paid_at")
    Instant paidAt;

    @Column(name = "expires_at")
    Instant expiresAt;

    @Version
    @Column(name = "version")
    Long version;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    Instant updatedAt;

    //============FK===============

    @Column(name = "order_id", nullable = false)
    UUID orderId;

    @Column(name = "payer_id", nullable = false)
    UUID payerId;

    @Column(name = "provider_id")
    UUID providerId;

}
