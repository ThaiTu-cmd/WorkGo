package com.workgo.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

/** Durable deliveries, committed with the cancellation receivable. */
@Entity
@Table(name = "fee_reminders", uniqueConstraints = @UniqueConstraint(
        name = "uk_fee_reminder_milestone", columnNames = {"fee_assessment_id", "milestone"}))
@Getter @Setter @NoArgsConstructor
public class FeeReminder {
    @Id
    private UUID id;
    @Column(name = "fee_assessment_id", nullable = false)
    private UUID feeAssessmentId;
    @Column(nullable = false)
    private String milestone;
    @Column(name = "due_at", nullable = false)
    private Instant dueAt;
    @Column(name = "delivered_at")
    private Instant deliveredAt;
    @Column(name = "cancelled_at")
    private Instant cancelledAt;
}
