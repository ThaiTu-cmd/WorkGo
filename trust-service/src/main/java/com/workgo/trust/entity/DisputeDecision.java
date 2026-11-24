package com.workgo.trust.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

/** Immutable conclusion/payload; mutable execution fields describe delivery, never rewrite the conclusion. */
@Entity @Table(name="dispute_decisions",uniqueConstraints=@UniqueConstraint(columnNames="dispute_id"))
@Getter @Setter @NoArgsConstructor
public class DisputeDecision {
    @Id @Column(name="decision_id") private UUID decisionId;
    @Column(name="dispute_id",nullable=false,updatable=false) private UUID disputeId;
    @Column(name="order_id",nullable=false,updatable=false) private UUID orderId;
    @Column(nullable=false,updatable=false) private UUID actorId;
    @Column(nullable=false,updatable=false) private String operation;
    @Column(nullable=false,updatable=false) private String faultType="NONE";
    @Column(nullable=false,updatable=false) private int lateCycles;
    @Column(updatable=false,unique=true) private UUID supersedesDecisionId;
    @Column(nullable=false,updatable=false,length=1000) private String reason;
    @Column(nullable=false,updatable=false,length=2000) private String evidenceSummary;
    @Column(nullable=false,updatable=false) private Instant effectiveAt;
    @Column(updatable=false,columnDefinition="TEXT") private String settlementPayload;
    @Column(columnDefinition="TEXT") private String paymentResult;
    @Column(nullable=false) private String paymentStatus="PENDING";
    @Column(nullable=false) private String orderStatus="PENDING";
    @Column(nullable=false) private String executionStatus="PENDING";
    @Column(nullable=false) private int attempts;
    @Column(nullable=false) private Instant nextAttemptAt=Instant.now();
    private UUID leaseToken;
    @Column(length=255) private String lastError;
    @Column(nullable=false) private boolean terminalConflict;
    @Version private Long version;
}
