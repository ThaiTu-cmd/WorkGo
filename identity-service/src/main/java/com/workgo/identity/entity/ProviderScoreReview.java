package com.workgo.identity.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;
import java.time.Instant;
import java.util.UUID;

@Entity @Immutable @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
@Table(name="provider_score_reviews",uniqueConstraints=@UniqueConstraint(name="uk_provider_score_review_version",columnNames={"provider_id","reputation_version"}))
public class ProviderScoreReview {
    @Id private UUID id;
    @Column(nullable=false,updatable=false) private UUID providerId;
    @Column(nullable=false,updatable=false) private UUID userId;
    @Column(nullable=false,updatable=false) private UUID actorId;
    @Column(nullable=false,updatable=false) private int score;
    @Column(nullable=false,updatable=false) private long reputationVersion;
    @Column(nullable=false,updatable=false,length=32) private String outcome;
    @Column(nullable=false,updatable=false,length=1000) private String reason;
    @Column(nullable=false,updatable=false,length=200) private String reference;
    @Column(nullable=false,updatable=false) private Instant reviewedAt;
    @Column(updatable=false) private UUID sanctionId;
    public ProviderScoreReview(UUID id,UUID provider,UUID user,UUID actor,int score,long version,String outcome,String reason,String reference,UUID sanction){
        this.id=id;providerId=provider;userId=user;actorId=actor;this.score=score;reputationVersion=version;this.outcome=outcome;this.reason=reason;this.reference=reference;sanctionId=sanction;
        reviewedAt=Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS);
    }
}
