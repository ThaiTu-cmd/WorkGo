package com.workgo.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Immutable
@Table(name = "fee_policy_versions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_fee_policy_version_no", columnNames = {"version_no"})
}, indexes = {
        @Index(name = "idx_fee_policy_effective", columnList = "effective_from, version_no")
})
public class FeePolicyVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "fee_policy_version_id")
    UUID feePolicyVersionId;

    @Column(name = "version_no", nullable = false)
    Integer versionNo;

    @Column(name = "success_fee_rate", nullable = false, precision = 5, scale = 4)
    BigDecimal successFeeRate;

    @Column(name = "cancellation_fee_rate", nullable = false, precision = 5, scale = 4)
    BigDecimal cancellationFeeRate;

    @Column(name = "cancellation_fee_cap", nullable = false)
    Long cancellationFeeCap;

    @Column(name = "effective_from", nullable = false)
    Instant effectiveFrom;

    @Column(name = "reason", columnDefinition = "TEXT", nullable = false)
    String reason;

    @Column(name = "created_by")
    UUID createdBy;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    Instant createdAt = Instant.now();
}
