package com.workgo.job.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
@Entity @Table(name="provider_restrictions") @Getter @Setter @NoArgsConstructor
public class ProviderRestriction {
    @Id private String id;
    @Column(nullable=false) private UUID providerId;
    @Column(nullable=false) private String source;
    @Column(nullable=false) private long sourceVersion;
    @Column(nullable=false) private boolean blocked;
    @Version private Long version;
    public ProviderRestriction(UUID provider,String source){this.id=provider+":"+source;providerId=provider;this.source=source;}
}
