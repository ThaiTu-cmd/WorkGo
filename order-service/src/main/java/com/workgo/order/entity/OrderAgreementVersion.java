package com.workgo.order.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Immutable
@Table(name = "order_agreement_versions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_order_agreement_version", columnNames = {"order_id", "version_no"})
})
public class OrderAgreementVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "agreement_version_id")
    UUID agreementVersionId;

    @Column(name = "order_id", nullable = false)
    UUID orderId;

    @Column(name = "version_no", nullable = false)
    Integer versionNo;

    @Column(name = "source", nullable = false)
    String source;

    @Column(name = "scope", columnDefinition = "TEXT")
    String scope;

    @Column(name = "acceptance_criteria", columnDefinition = "TEXT")
    String acceptanceCriteria;

    @Column(name="input_requirements", columnDefinition="TEXT")
    String inputRequirements;
    @Enumerated(EnumType.STRING)
    com.workgo.order.enumeration.OrderPaymentMethod paymentMethod;
    UUID feePolicyVersionId;
    String rewardQuoteRef;
    String policyVersion;

    @Column(name = "price", nullable = false)
    BigDecimal price;

    @Column(name = "currency")
    String currency;

    @Column(name = "duration_days")
    Integer durationDays;

    @Column(columnDefinition="TEXT")
    String address;

    @Column(name = "schedule_start")
    Instant scheduleStart;

    @Column(name = "schedule_end")
    Instant scheduleEnd;

    @Column(name = "amendment_id")
    UUID amendmentId;

    @Column(name = "provider_confirmed_at")
    Instant providerConfirmedAt;

    @Column(name = "client_confirmed_at")
    Instant clientConfirmedAt;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    Instant createdAt = Instant.now();
}
