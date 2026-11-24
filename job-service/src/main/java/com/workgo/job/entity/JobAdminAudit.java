package com.workgo.job.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="job_admin_audit") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class JobAdminAudit {
    @Id private UUID id;
    @Column(nullable=false, updatable=false) private UUID actorId;
    @Column(nullable=false, updatable=false) private UUID targetId;
    @Column(nullable=false, updatable=false, length=1000) private String reason;
    @Column(nullable=false, updatable=false) private boolean beforeHidden;
    @Column(nullable=false, updatable=false) private boolean afterHidden;
    @Column(nullable=false, updatable=false) private Instant createdAt;
    public JobAdminAudit(UUID actor, UUID target, String reason, boolean before, boolean after) {
        id=UUID.randomUUID(); actorId=actor; targetId=target; this.reason=reason;
        beforeHidden=before; afterHidden=after; createdAt=Instant.now();
    }
}
