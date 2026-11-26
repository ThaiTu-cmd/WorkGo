package com.workgo.payment.entity;
import jakarta.persistence.*;import lombok.*;import java.util.UUID;import java.time.Instant;
@Entity @Table(name="cash_decision_receipts",uniqueConstraints=@UniqueConstraint(columnNames="order_id")) @Getter @Setter @NoArgsConstructor
public class CashDecisionReceipt {
 @Id private UUID decisionId;
 @Column(name="order_id",nullable=false,updatable=false)private UUID orderId;
 @Column(nullable=false,updatable=false)private UUID disputeId;
 @Column(nullable=false,updatable=false)private UUID clientId;
 @Column(nullable=false,updatable=false)private UUID providerId;
 @Column(nullable=false,updatable=false,length=64)private String payloadHash;
 @Column(nullable=false,updatable=false)private UUID feeAssessmentId;
 @Column(nullable=false,updatable=false)private UUID feePolicyVersionId;
 @Column(nullable=false,updatable=false)private long orderAmount;
 @Column(nullable=false,updatable=false)private long feeAmount;
 @Column(nullable=false,updatable=false)private long cashReturnDue;
 @Column(nullable=false,updatable=false)private String currency="VND";
 @Column(nullable=false)private String status;
 private Instant returnConfirmedAt;private UUID returnConfirmedBy;
 @Column(nullable=false,updatable=false)private Instant createdAt=Instant.now();
 @Version private Long version;
}
