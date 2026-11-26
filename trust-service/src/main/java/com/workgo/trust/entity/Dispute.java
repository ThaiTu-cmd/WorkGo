package com.workgo.trust.entity;

import com.workgo.trust.enumeration.DisputeStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "disputes",
        uniqueConstraints = @UniqueConstraint(name = "uq_dispute_order_active_slot", columnNames = {"order_id", "active_slot"}),
        indexes = {
            @Index(name = "idx_dispute_order", columnList = "order_id"),
            @Index(name = "idx_dispute_client", columnList = "client_id, created_at"),
            @Index(name = "idx_dispute_provider", columnList = "provider_id, created_at")
        })
@Check(name = "ck_dispute_active_slot", constraints = "(status IN ('OPEN', 'UNDER_REVIEW') AND active_slot IS NOT NULL AND active_slot = 1) OR (status NOT IN ('OPEN', 'UNDER_REVIEW') AND active_slot IS NULL)")
@SQLRestriction("is_deleted = false")
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "dispute_id")
    private UUID disputeId;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(name = "opened_by", nullable = false)
    private UUID openedBy;

    @Column(name = "opened_by_role", nullable = false, length = 30)
    private String openedByRole;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "provider_id", nullable = false)
    private UUID providerId;

    @Column(name = "reason", nullable = false, length = 150)
    private String reason;
    @Builder.Default
    @Column(name="case_type",nullable=false)
    @org.hibernate.annotations.ColumnDefault("'ESCROW'") private String caseType="ESCROW";

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "evidence_url", columnDefinition = "TEXT")
    private String evidenceUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private DisputeStatus status = DisputeStatus.OPEN;

    @Column(name = "resolution", columnDefinition = "TEXT")
    private String resolution;

    @Column(name="assigned_admin_id")
    private UUID assignedAdminId;
    @Column(name="claimed_at")
    private Instant claimedAt;
    @Column(name="evidence_request",length=1000)
    private String evidenceRequest;
    @Column(name="evidence_requested_at")
    private Instant evidenceRequestedAt;
    @Column(name="evidence_deadline")
    private Instant evidenceDeadline;
    @Column(name="client_evidence_ack_at")
    private Instant clientEvidenceAckAt;
    @Column(name="provider_evidence_ack_at")
    private Instant providerEvidenceAckAt;
    @Column(name="client_evidence_deadline") private Instant clientEvidenceDeadline;
    @Column(name="provider_evidence_deadline") private Instant providerEvidenceDeadline;
    @Column(name="client_evidence_extended_until") private Instant clientEvidenceExtendedUntil;
    @Column(name="provider_evidence_extended_until") private Instant providerEvidenceExtendedUntil;
    @Column(name="client_extension_used", nullable = false) private boolean clientExtensionUsed;
    @Column(name="provider_extension_used", nullable = false) private boolean providerExtensionUsed;
    @Column(name="client_extension_reason", length = 1000) private String clientExtensionReason;
    @Column(name="provider_extension_reason", length = 1000) private String providerExtensionReason;
    @Column(name="client_extension_base_version") private Long clientExtensionBaseVersion;
    @Column(name="provider_extension_base_version") private Long providerExtensionBaseVersion;
    @Column(name="intake_sla_due_at") private Instant intakeSlaDueAt;
    @Column(name="intake_escalated_at") private Instant intakeEscalatedAt;
    @Column(name="decision_sla_due_at") private Instant decisionSlaDueAt;
    @Column(name="decision_escalated_at") private Instant decisionEscalatedAt;
    @Column(name="decision_id") private UUID decisionId;

    @Column(name = "active_slot")
    private Integer activeSlot;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (intakeSlaDueAt == null) intakeSlaDueAt = createdAt.plusSeconds(24 * 3600);
        updatedAt = now;
        synchronizeActiveSlot();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
        synchronizeActiveSlot();
    }

    private void synchronizeActiveSlot() {
        activeSlot = status == DisputeStatus.OPEN || status == DisputeStatus.UNDER_REVIEW ? 1 : null;
    }
}
