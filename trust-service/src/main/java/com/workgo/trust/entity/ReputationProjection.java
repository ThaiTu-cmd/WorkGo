package com.workgo.trust.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
@Entity @Table(name="reputation_projections") @Getter @Setter @NoArgsConstructor
public class ReputationProjection {
    @Id private UUID providerId;
    private int score;
    private long sourceVersion;
    private long identitySyncedVersion;
    private long jobSyncedVersion;
    @org.hibernate.annotations.ColumnDefault("0") private long catalogSyncedVersion;
    @org.hibernate.annotations.ColumnDefault("0") private long orderSyncedVersion;
    private String lastError;
    @Version private Long version;
    public ReputationProjection(UUID provider){providerId=provider;}
}
