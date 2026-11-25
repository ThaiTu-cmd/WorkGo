package com.workgo.trust.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "onsite_incidents")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnsiteIncident {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "incident_id")
    private UUID incidentId;

    @Column(name = "order_id", nullable = false, unique = true)
    private UUID orderId;

    @Column(name = "dispute_id")
    private UUID disputeId;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "provider_id", nullable = false)
    private UUID providerId;

    @Column(name = "incident_type", length = 100)
    private String incidentType;

    @Column(name = "status", nullable = false, length = 60)
    @Builder.Default
    private String status = "MONITORING";

    @Column(name = "contact_required", nullable = false)
    private boolean contactRequired;

    @Column(name = "contact_attempts", nullable = false)
    private int contactAttempts;

    @Column(name = "client_contact_attempts", nullable = false)
    private int clientContactAttempts;

    @Column(name = "provider_contact_attempts", nullable = false)
    private int providerContactAttempts;

    @Column(name = "first_contact_at")
    private Instant firstContactAt;

    @Column(name = "last_contact_at")
    private Instant lastContactAt;

    @Column(name = "original_scheduled_start")
    private Instant originalScheduledStart;

    @Column(name = "original_scheduled_end")
    private Instant originalScheduledEnd;

    @Column(name = "effective_scheduled_start")
    private Instant effectiveScheduledStart;

    @Column(name = "effective_scheduled_end")
    private Instant effectiveScheduledEnd;

    @Column(name = "proposed_scheduled_start")
    private Instant proposedScheduledStart;

    @Column(name = "proposed_scheduled_end")
    private Instant proposedScheduledEnd;

    @Column(name = "reschedule_proposed_by_role", length = 30)
    private String rescheduleProposedByRole;

    @Column(name = "client_confirmed_reschedule", nullable = false)
    private boolean clientConfirmedReschedule;

    @Column(name = "provider_confirmed_reschedule", nullable = false)
    private boolean providerConfirmedReschedule;

    @Column(name = "reschedule_status", length = 60)
    @Builder.Default
    private String rescheduleStatus = "NONE";

    @Column(name = "alleged_fault_party", length = 50)
    private String allegedFaultParty;

    @Column(name = "force_majeure", nullable = false)
    private boolean forceMajeure;

    @Column(name = "allegation_summary", columnDefinition = "TEXT")
    private String allegationSummary;

    @Column(name = "evidence_url", columnDefinition = "TEXT")
    private String evidenceUrl;

    @Column(name = "location_signal", length = 500)
    private String locationSignal;

    @Column(name = "incident_reported_at")
    private Instant incidentReportedAt;

    @Column(name = "conclusion_status", nullable = false, length = 60)
    @Builder.Default
    private String conclusionStatus = "NO_CONCLUSION";

    @Column(name = "decision_id")
    private UUID decisionId;

    @Column(name = "concluded_fault_party", length = 50)
    private String concludedFaultParty;

    @Column(name = "concluded_fault_type", length = 50)
    private String concludedFaultType;

    @Column(name = "financial_status", nullable = false, length = 60)
    @Builder.Default
    private String financialStatus = "UNCHANGED";

    @Column(name = "applicable_cancellation_fee", nullable = false)
    private long applicableCancellationFee;

    @Column(name = "arrival_fee", nullable = false)
    private long arrivalFee;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;
}
