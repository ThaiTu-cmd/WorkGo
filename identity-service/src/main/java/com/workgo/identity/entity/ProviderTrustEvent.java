package com.workgo.identity.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.Instant;
@Entity @Table(name="provider_trust_events") @Getter @Setter @NoArgsConstructor
public class ProviderTrustEvent {
    @Id private UUID providerId;
    @Column(nullable=false,updatable=false) private UUID userId;
    @Column(nullable=false,updatable=false) private Instant approvedAt;
    private Instant deliveredAt;
    private String lastError;
    @Version private Long version;
    public ProviderTrustEvent(UUID provider,UUID user){providerId=provider;userId=user;approvedAt=Instant.now();}
}
