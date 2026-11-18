package com.workgo.payment.entity;

import com.workgo.payment.enumeration.FeeAssessmentStatus;
import com.workgo.payment.enumeration.FeeChargedParty;
import com.workgo.payment.enumeration.FeeType;
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
@Table(name = "fee_assessments", uniqueConstraints = {
        @UniqueConstraint(name = "uk_fee_assessment_order", columnNames = {"order_id"})
}, indexes = {
        @Index(name = "idx_fee_assessment_charged_user", columnList = "charged_user_id, status"),
        @Index(name = "idx_fee_assessment_status", columnList = "status, created_at")
})
public class FeeAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "fee_assessment_id")
    UUID feeAssessmentId;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "fee_type", nullable = false)
    FeeType feeType;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "charged_party", nullable = false)
    FeeChargedParty chargedParty;

    @Column(name = "base_amount", nullable = false)
    Long baseAmount;

    @Column(name = "amount", nullable = false)
    Long amount;

    @Builder.Default
    @Column(name = "collected_amount", nullable = false)
    Long collectedAmount = 0L;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "status", nullable = false)
    FeeAssessmentStatus status;

    @Version
    @Column(name = "version")
    Long version;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    Instant updatedAt;

    //============FK===============

    @Column(name = "order_id", nullable = false)
    UUID orderId;

    @Column(name = "charged_user_id")
    UUID chargedUserId;

    @Column(name = "fee_policy_version_id", nullable = false)
    UUID feePolicyVersionId;

    @Column(name = "decision_id")
    UUID decisionId;

    @Column(name = "collect_transaction_id")
    UUID collectTransactionId;

}
