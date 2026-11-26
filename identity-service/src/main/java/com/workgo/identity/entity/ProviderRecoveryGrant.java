package com.workgo.identity.entity;
import jakarta.persistence.*;import lombok.*;import java.util.UUID;import java.time.Instant;
@Entity @Table(name="provider_recovery_grants") @Getter @Setter @NoArgsConstructor
public class ProviderRecoveryGrant {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(nullable=false,updatable=false) private UUID providerId;
    @Column(nullable=false,updatable=false) private UUID actorId;
    @Column(nullable=false,updatable=false,length=1000) private String reason;
    @Column(nullable=false,updatable=false) private Instant approvedAt;
    @Column(nullable=false,updatable=false) private Instant expiresAt;
    @Column(nullable=false,updatable=false) private long reputationVersion;
}
