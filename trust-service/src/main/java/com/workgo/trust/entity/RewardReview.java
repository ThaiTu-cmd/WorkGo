package com.workgo.trust.entity;
import jakarta.persistence.*;import lombok.*;import java.util.UUID;import java.time.Instant;
@Entity @Table(name="reward_reviews") @Getter @Setter @NoArgsConstructor
public class RewardReview {
    @Id private UUID orderId;
    @Column(nullable=false) private String status="PENDING";
    @Column(nullable=false) private Instant requestedAt;
    @Column(nullable=false) private Instant dueAt;
    private Instant reviewedAt;private UUID reviewedBy;private Integer approvedPoints;
    @Column(length=1000) private String reason;
    @Version private Long version;
    public RewardReview(UUID id){orderId=id;requestedAt=Instant.now();dueAt=requestedAt.plusSeconds(72L*3600);}
}
