package com.workgo.job.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="job_admin_audit") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
@org.hibernate.annotations.Immutable
public class JobAdminAudit {
    @Id private UUID id;
    @Column(nullable=false, updatable=false) private UUID actorId;
    @Column(nullable=false, updatable=false) private UUID targetId;
    @Column(nullable=false, updatable=false, length=1000) private String reason;
    @Column(nullable=false, updatable=false) private boolean beforeHidden;
    @Column(nullable=false, updatable=false) private boolean afterHidden;
    @Column(nullable=false, updatable=false) private Instant createdAt;
    @Column(updatable=false) private String actorRole;
    @Column(updatable=false) private String correlationId;
    @Column(updatable=false) private String source;
    @Column(updatable=false) private String targetType;
    @Column(updatable=false) private String action;
    @Column(updatable=false, columnDefinition="TEXT") private String beforeState;
    @Column(updatable=false, columnDefinition="TEXT") private String afterState;
    public JobAdminAudit(UUID actor, UUID target, String reason, boolean before, boolean after) {
        id=UUID.randomUUID(); actorId=actor; targetId=target; this.reason=reason;
        beforeHidden=before; afterHidden=after; createdAt=Instant.now();
        actorRole=com.workgo.job.service.AuditContext.actorRole();
        correlationId=com.workgo.job.service.AuditContext.correlationId(); source="JOB"; targetType="JOB";
        action=after ? "JOB_HIDDEN" : "JOB_RESTORED";
        beforeState="{\"moderationHidden\":"+before+"}"; afterState="{\"moderationHidden\":"+after+"}";
    }
    public static JobAdminAudit exported(UUID actor, String state) {
        var log = new JobAdminAudit(actor, UUID.randomUUID(), "Audit export", false, false);
        log.action="AUDIT_EXPORTED"; log.targetType="AUDIT_LOG"; log.beforeState=null; log.afterState=state;
        return log;
    }
}
