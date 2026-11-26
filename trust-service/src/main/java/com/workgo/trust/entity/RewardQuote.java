package com.workgo.trust.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="reward_quotes") @Getter @NoArgsConstructor
public class RewardQuote {
    @Id private UUID id;
    @Column(nullable=false,updatable=false) private UUID providerId;
    @Column(nullable=false,updatable=false) private UUID clientId;
    @Column(nullable=false,updatable=false,length=64) private String inputHash;
    @Column(nullable=false,updatable=false,columnDefinition="TEXT") private String inputPayload;
    @Column(nullable=false,updatable=false) private int points;
    @Column(nullable=false,updatable=false) private boolean needsReview;
    @Column(nullable=false,updatable=false) private String ruleVersion;
    @Column(nullable=false,updatable=false) private String modelVersion;
    @Column(nullable=false,updatable=false) private Instant createdAt;
    @Column(nullable=false,updatable=false) private Instant expiresAt;
    public RewardQuote(UUID provider,UUID client,String hash,String payload,int points,boolean review) {
        id=UUID.randomUUID();providerId=provider;clientId=client;inputHash=hash;inputPayload=payload;
        this.points=points;needsReview=review;ruleVersion="WG-POLICY-1.0";modelVersion="DISABLED";
        createdAt=Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS);expiresAt=createdAt.plusSeconds(1800);
    }
}
