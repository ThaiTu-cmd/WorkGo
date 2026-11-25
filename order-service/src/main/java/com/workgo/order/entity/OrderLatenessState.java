package com.workgo.order.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "order_lateness_states")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderLatenessState {

    @Id
    @Column(name = "order_id")
    private UUID orderId;

    @Column(name = "deadline_snapshot")
    private Instant deadlineSnapshot;

    @Column(name = "progress_responded_at")
    private Instant progressRespondedAt;

    @Column(name = "progress_summary", columnDefinition = "TEXT")
    private String progressSummary;

    @Column(name = "progress_evidence_ref", length = 500)
    private String progressEvidenceRef;

    @Column(name = "proposed_remedy", columnDefinition = "TEXT")
    private String proposedRemedy;

    @Column(name = "proposed_remedy_at")
    private Instant proposedRemedyAt;

    @Column(name = "verification_opened", nullable = false)
    private boolean verificationOpened;

    @Column(name = "verification_opened_at")
    private Instant verificationOpenedAt;

    @Column(name = "verification_notice_id")
    private UUID verificationNoticeId;

    @Column(name = "verification_ack_at")
    private Instant verificationAckAt;

    @Column(name = "explanation_due_at")
    private Instant explanationDueAt;

    @Column(name = "explanation_submitted_at")
    private Instant explanationSubmittedAt;

    @Column(name = "explanation_text", columnDefinition = "TEXT")
    private String explanationText;

    @Column(name = "explanation_evidence_ref", length = 500)
    private String explanationEvidenceRef;

    @Column(name = "escalated_7d", nullable = false)
    private boolean escalated7d;

    @Column(name = "escalated_7d_at")
    private Instant escalated7dAt;

    @Version
    @Column(name = "version")
    private Long version;
}
