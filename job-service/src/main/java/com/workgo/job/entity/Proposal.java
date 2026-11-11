package com.workgo.job.entity;

import com.workgo.job.enumeration.ProposalStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.jdbc.Expectation;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "proposals", uniqueConstraints = {
        @UniqueConstraint(name = "uq_proposal_pending", columnNames = {"application_id", "pending_slot"})
})
@Check(name = "ck_proposal_pending_slot", constraints =
        "(status = 'PENDING' and pending_slot is not null and pending_slot = 1) "
        + "or (status <> 'PENDING' and pending_slot is null)")
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE proposals SET is_deleted = true, version = version + 1 WHERE proposal_id = ? AND version = ?",
        verify = Expectation.RowCount.class)
public class Proposal {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "proposal_id")
    UUID proposalId;

    // Application writes both FK columns; this association exposes the same job_id.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false, insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_proposal_job"))
    Job job;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumns(value = {
            @JoinColumn(name = "application_id", referencedColumnName = "application_id", nullable = false),
            @JoinColumn(name = "job_id", referencedColumnName = "job_id", nullable = false)
    }, foreignKey = @ForeignKey(name = "fk_proposal_application_job"))
    Application application;

    @Column(name = "price", nullable = false, precision = 19, scale = 2)
    BigDecimal price;

    @Builder.Default
    @Column(name = "currency", nullable = false, length = 10)
    String currency = "VND";

    @Column(name = "estimated_days", nullable = false)
    Integer estimatedDays;

    @Column(name = "message", columnDefinition = "TEXT")
    String message;

    @Column(name = "terms", columnDefinition = "TEXT")
    String terms;

    @Column(name = "expires_at")
    Instant expiresAt;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    ProposalStatus status = ProposalStatus.PENDING;

    // CHECK + UNIQUE enforce one PENDING version, including soft-deleted rows.
    @Column(name = "pending_slot")
    @Setter(AccessLevel.NONE)
    Integer pendingSlot;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;

    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    Boolean isDeleted = false;

    @Version
    @Column(name = "version", nullable = false)
    Long version;

    @PrePersist
    @PreUpdate
    void validateJob() {
        pendingSlot = status == ProposalStatus.PENDING ? 1 : null;
        if (application == null) {
            throw new IllegalStateException("Proposal application is required");
        }
        Job applicationJob = application.getJob();
        if (applicationJob == null || (job != null && job != applicationJob
                && (job.getJobId() == null || !job.getJobId().equals(applicationJob.getJobId())))) {
            throw new IllegalStateException("Proposal job must match application job");
        }
        job = applicationJob;
    }
}
