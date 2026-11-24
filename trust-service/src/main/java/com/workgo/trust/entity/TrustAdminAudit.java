package com.workgo.trust.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="trust_admin_audit") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class TrustAdminAudit {
    @Id private UUID id;
    @Column(nullable=false,updatable=false) private UUID actorId;
    @Column(nullable=false,updatable=false) private UUID targetId;
    @Column(nullable=false,updatable=false) private String action;
    @Column(nullable=false,updatable=false,length=1000) private String reason;
    @Column(updatable=false) private String beforeState;
    @Column(updatable=false) private String afterState;
    @Column(nullable=false,updatable=false) private Instant createdAt;
    public TrustAdminAudit(UUID actor,UUID target,String action,String reason,String before,String after) {
        id=UUID.randomUUID();actorId=actor;targetId=target;this.action=action;this.reason=reason;
        beforeState=before;afterState=after;createdAt=Instant.now();
    }
}
