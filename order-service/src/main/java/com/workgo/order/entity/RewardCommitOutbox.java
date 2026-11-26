package com.workgo.order.entity;
import jakarta.persistence.*;import lombok.*;import java.util.*;import java.time.Instant;
@Entity @Table(name="reward_commit_outbox") @Getter @Setter @NoArgsConstructor
public class RewardCommitOutbox {
 @Id @Column(length=255) private String eventKey;
 @Column(nullable=false,updatable=false) private UUID orderId;
 @Column(nullable=false,updatable=false) private UUID providerId;
 @Column(nullable=false,updatable=false) private UUID clientId;
 @Column(nullable=false,updatable=false) private String quoteRef;
 @Column(nullable=false,updatable=false) private Instant confirmedAt;
 @Column(nullable=false) private boolean acknowledged;
 private String lastError;
 public static RewardCommitOutbox from(Order o,String quoteRef){var r=new RewardCommitOutbox();r.eventKey=o.getOrderId()+":"+quoteRef;r.orderId=o.getOrderId();r.providerId=o.getProviderId();r.clientId=o.getClientId();r.quoteRef=quoteRef;r.confirmedAt=o.getPlacedAt()==null?o.getConfirmedAt():o.getPlacedAt();return r;}
}
