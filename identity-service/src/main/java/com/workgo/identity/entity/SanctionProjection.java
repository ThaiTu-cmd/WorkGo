package com.workgo.identity.entity;
import jakarta.persistence.*;import lombok.*;import java.util.UUID;
@Entity @Table(name="sanction_projections") @Getter @Setter @NoArgsConstructor
public class SanctionProjection {
 @Id private UUID providerId;private boolean blocked;private long sourceVersion;private long jobSyncedVersion;private long catalogSyncedVersion;private long orderSyncedVersion;private String lastError;@Version private Long version;
 public SanctionProjection(UUID provider){providerId=provider;}
}
