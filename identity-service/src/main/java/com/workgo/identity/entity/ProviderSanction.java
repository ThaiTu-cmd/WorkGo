package com.workgo.identity.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.Instant;
@Entity @Table(name="provider_sanctions") @Getter @Setter @NoArgsConstructor
public class ProviderSanction {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(nullable=false,updatable=false) private UUID providerId;
    @Column(nullable=false,updatable=false) private UUID userId;
    @Column(nullable=false,updatable=false) private UUID actorId;
    @Column(nullable=false,updatable=false) private String scope;
    @Column(nullable=false,updatable=false,length=1000) private String reason;
    @Column(nullable=false,updatable=false,length=200) private String reference;
    @Column(nullable=false,updatable=false) private Instant effectiveAt;
    private Instant expiresAt;
    private Instant revokedAt;
    private UUID revokedBy;
    @Column(length=1000) private String revocationReason;
    @Version private Long version;
}
