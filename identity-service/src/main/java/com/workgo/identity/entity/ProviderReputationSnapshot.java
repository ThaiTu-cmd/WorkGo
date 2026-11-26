package com.workgo.identity.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;import java.time.Instant;
@Entity @Table(name="provider_reputation_snapshots") @Getter @Setter @NoArgsConstructor
public class ProviderReputationSnapshot {
    @Id private UUID providerId;
    private int score;
    private long sourceVersion;
    private Instant lowScoreSince;
    private String policyVersion;
    @Version private Long version;
    public ProviderReputationSnapshot(UUID id){providerId=id;}
}
