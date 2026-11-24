package com.workgo.trust.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.Instant;
@Entity @Table(name="reward_snapshots") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class RewardSnapshot {
    @Id private UUID orderId;
    @Column(nullable=false,updatable=false) private UUID providerId;
    @Column(nullable=false,updatable=false) private UUID clientId;
    @Column(nullable=false,updatable=false) private int points;
    @Column(nullable=false,updatable=false) private boolean needsReview;
    @Column(nullable=false,updatable=false,length=100) private String modelVersion;
    @Column(nullable=false,updatable=false) private String ruleVersion;
    @Column(nullable=false,updatable=false,length=64) private String inputHash;
    @Column(nullable=false,updatable=false) private Instant lockedAt;
    public RewardSnapshot(UUID order,UUID provider,UUID client,com.workgo.trust.service.RewardPolicy.Quote quote){
        orderId=order;providerId=provider;clientId=client;points=quote.points();needsReview=quote.needsReview();
        modelVersion=quote.modelVersion();ruleVersion=quote.ruleVersion();inputHash=quote.inputHash();
        // Match TIMESTAMP(6): rounding up during persistence can otherwise make a later completion appear earlier.
        lockedAt=Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS);
    }
}
