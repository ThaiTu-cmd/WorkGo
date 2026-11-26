package com.workgo.order.entity;
import jakarta.persistence.*;import lombok.*;import java.util.UUID;
@Entity @Table(name="provider_restriction_projections") @Getter @Setter @NoArgsConstructor
public class ProviderRestrictionProjection {
 @Id private String id;private UUID providerId;private String source;private long sourceVersion;private boolean blocked;@Version private Long version;
 public ProviderRestrictionProjection(UUID provider,String source){id=provider+":"+source;providerId=provider;this.source=source;}
}
