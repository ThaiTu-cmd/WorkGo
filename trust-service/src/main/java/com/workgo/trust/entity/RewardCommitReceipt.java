package com.workgo.trust.entity;
import jakarta.persistence.*;import lombok.*;import java.util.UUID;import java.time.Instant;
/** Immutable confirmation receipt; amendments add a new receipt, never rewrite prior consent. */
@Entity @Table(name="reward_commit_receipts") @Getter @NoArgsConstructor
public class RewardCommitReceipt {
 @Id @Column(length=255) private String eventKey;
 @Column(nullable=false,updatable=false) private UUID orderId;
 @Column(nullable=false,updatable=false) private UUID quoteId;
 @Column(nullable=false,updatable=false) private UUID providerId;
 @Column(nullable=false,updatable=false) private UUID clientId;
 @Column(nullable=false,updatable=false,length=64) private String inputHash;
 @Column(nullable=false,updatable=false) private Instant confirmedAt;
 public RewardCommitReceipt(UUID order,RewardQuote quote,Instant at){eventKey=order+":"+quote.getId();orderId=order;quoteId=quote.getId();providerId=quote.getProviderId();clientId=quote.getClientId();inputHash=quote.getInputHash();confirmedAt=at.truncatedTo(java.time.temporal.ChronoUnit.MICROS);}
}
